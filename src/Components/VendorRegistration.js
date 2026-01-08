import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../Styles/VendorRegistration.css';
import TopBar from './Topbar';
import { supabase } from "../Supabase/supabaseClient";
import PrivacyPolicyModal from './PrivacyPolicyModal';

function VendorRegistration() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    businessName: "",
    stallLocation: "",
    authorizedSellerName: "",
    privacyConsent: false  // New field for privacy consent
  });

  const [files, setFiles] = useState({
    accreditationCert: null,
    menuList: null,
    dtiSec: null,
    mayorPermit: null
  });

  const [uploadedURLs, setUploadedURLs] = useState({});
  const [previewURLs, setPreviewURLs] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      setFiles(prev => ({
        ...prev,
        [name]: file
      }));

      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setPreviewURLs(prev => ({
          ...prev,
          [name]: previewUrl
        }));
      }
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .from("vendor_applications")
        .select("email")
        .eq("email", email);

      if (error) {
        console.error("Email validation error:", error);
        toast.error("Failed to validate email. Please try again.");
        return { exists: false, error: true };
      }

      return { exists: data && data.length > 0, error: false };
    } catch (error) {
      console.error("Email validation exception:", error);
      toast.error("An error occurred while validating email.");
      return { exists: false, error: true };
    }
  };

  const uploadToSupabase = async (file, folderName) => {
    try {
      const fileName = `${folderName}/${Date.now()}_${file.name}`;
      console.log(`📤 Uploading ${file.name} as ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from("image")
        .upload(fileName, file);

      if (error) {
        console.error("❌ Supabase upload error:", error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("image")
        .getPublicUrl(fileName);

      console.log(`✅ Uploaded successfully: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("💥 Upload error:", error.message);
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🚀 Form submission started");
    console.log("📋 Form data:", formData);
    
    if (!files.accreditationCert || !files.menuList || !files.dtiSec || !files.mayorPermit) {
      toast.error("⚠️ Please upload all required documents", { position: "top-center" });
      return;
    }

    if (!formData.privacyConsent) {
      toast.error("⚠️ Please read and accept the Privacy Policy to continue", { position: "top-center" });
      return;
    }

    // Validate email uniqueness
    setIsValidating(true);
    const { exists, error } = await checkEmailExists(formData.email);
    setIsValidating(false);

    if (error) {
      return; // Error toast already shown
    }

    if (exists) {
      toast.error("This email has already sent a request. Only one email is allowed.", {
        position: "top-center",
        autoClose: 5000
      });
      return;
    }

    // Show confirmation modal if email is unique
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    toast.info("Uploading files, please wait...");

    try {
      // Upload all files
      const uploaded = {};
      let uploadFailed = false;

      console.log("📁 Starting file uploads...");
      for (const key in files) {
        if (files[key]) {
          const url = await uploadToSupabase(files[key], formData.businessName || "vendors");
          if (url) {
            uploaded[key] = url;
          } else {
            uploadFailed = true;
          }
        }
      }

      if (uploadFailed || Object.keys(uploaded).length !== 4) {
        toast.error("❌ Some files failed to upload. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setUploadedURLs(uploaded);
      console.log("✅ All files uploaded successfully:", uploaded);

      // Prepare data for database
      const dataToInsert = {
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        business_name: formData.businessName,
        stall_location: formData.stallLocation,
        authorized_seller_name: formData.authorizedSellerName,
        accreditation_cert_url: uploaded.accreditationCert,
        menu_list_url: uploaded.menuList,
        dti_sec_url: uploaded.dtiSec,
        mayor_permit_url: uploaded.mayorPermit,
        privacy_consent: formData.privacyConsent,
        privacy_consent_date: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log("💾 Inserting into database:", dataToInsert);

      const { data: vendorData, error: dbError } = await supabase
        .from('vendor_applications')
        .insert([dataToInsert])
        .select();

      console.log("📊 Database response - Data:", vendorData);
      console.log("📊 Database response - Error:", dbError);

      if (dbError) {
        console.error("❌ Database error:", dbError);
        toast.error("Files uploaded but failed to save application. Please contact support.");
        setIsSubmitting(false);
        return;
      }

      console.log("✅ Application saved successfully!");
      toast.success("✅ Application submitted successfully!");
      setShowSuccessModal(true);

    } catch (error) {
      console.error("💥 Submission error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    Object.values(previewURLs).forEach(url => URL.revokeObjectURL(url));
    navigate("/login");
  };

  const handlePrivacyAccept = () => {
    setFormData(prev => ({ ...prev, privacyConsent: true }));
    setShowPrivacyModal(false);
    toast.success("Privacy Policy accepted. You may now proceed with your application.");
  };

  const getFileLabel = (key) => {
    const labels = {
      accreditationCert: "School Cafeteria Accreditation Certificate",
      menuList: "Menu Items with Prices",
      dtiSec: "DTI/SEC Registration",
      mayorPermit: "Mayor's Permit"
    };
    return labels[key] || key;
  };

  return (
    <>
      <TopBar />
      <div className="vendor-reg-container">
        <div className="vendor-reg-card">
          <div className="vendor-reg-header">
            <button className="back-btn" onClick={() => navigate("/login")}>
              ← Back to Login
            </button>
            <h2>Vendor Registration</h2>
            <p className="subtitle">Join our school cafeteria network</p>
          </div>

          

          <form onSubmit={handleSubmit} className="vendor-reg-form">
            <div className="form-section">
              <h3 className="section-title">Owner Information</h3>
              <div className="form-group">
                <label>Full Name of Business Owner/Operator *</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || isValidating}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="form-input"
                    placeholder="09XX XXX XXXX"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Business Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    className="form-input"
                    placeholder="Enter business name"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>

                <div className="form-group">
                  <label>Canteen Stall Location *</label>
                  <input
                    type="text"
                    name="stallLocation"
                    className="form-input"
                    placeholder="e.g., Building A, Stall 3"
                    value={formData.stallLocation}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Authorized Food Seller Name *</label>
                <input
                  type="text"
                  name="authorizedSellerName"
                  className="form-input"
                  placeholder="Enter authorized seller name"
                  value={formData.authorizedSellerName}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || isValidating}
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Required Documents</h3>
              <div className="file-upload-grid">
                {["accreditationCert", "menuList", "dtiSec", "mayorPermit"].map((key, i) => (
                  <div className="file-upload-group" key={i}>
                    <label className="file-label">
                      <span className="file-label-text">
                        {getFileLabel(key)} *
                      </span>
                      <input
                        type="file"
                        name={key}
                        className="file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        required
                        disabled={isSubmitting || isValidating}
                      />
                      <span className="file-btn">
                        {files[key] ? "✓ " + files[key].name : "Choose File"}
                      </span>
                    </label>

                    {previewURLs[key] && (
                      <div className="image-preview">
                        <img 
                          src={previewURLs[key]} 
                          alt={`${key} preview`} 
                          style={{ width: "120px", marginTop: "10px", borderRadius: "8px", border: "1px solid #ddd" }} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="file-note">* Accepted formats: PDF, JPG, PNG (Max 5MB per file)</p>
            </div>
            {/* Privacy Notice Banner */}
          <div style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: "12px",
            padding: "20px",
            margin: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            <div style={{ fontSize: "24px" }}>🔒</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: "0 0 8px 0", 
                fontSize: "16px", 
                fontWeight: "600",
                color: "#1e40af" 
              }}>
                Data Privacy Notice
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: "14px", 
                lineHeight: "1.6",
                color: "#1e3a8a" 
              }}>
                Before proceeding, please review our Privacy Policy to understand how we collect, 
                use, and protect your business and personal information in compliance with the Data Privacy Act of 2012 (RA 10173).
              </p>
            </div>
          </div>

            {/* Privacy Policy Consent Section */}
            <div className="form-section" style={{
              background: "#f8fafc",
              border: "2px solid #cbd5e1",
              borderRadius: "12px",
              padding: "24px"
            }}>
              <h3 className="section-title" style={{ 
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                🔐 Privacy Policy & Data Consent
              </h3>
              
              <div className="checkbox-group" style={{ marginBottom: "16px" }}>
                <label className="checkbox-label" style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  cursor: "pointer",
                  padding: "12px",
                  background: formData.privacyConsent ? "#ecfdf5" : "white",
                  border: formData.privacyConsent ? "2px solid #10b981" : "2px solid #e5e7eb",
                  borderRadius: "8px",
                  transition: "all 0.3s ease"
                }}>
                  <input
                    type="checkbox"
                    name="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "2px",
                      cursor: "pointer"
                    }}
                  />
                  <span className="checkbox-text" style={{ flex: 1, fontSize: "14px", lineHeight: "1.6" }}>
                    <strong>I have read and agree to the Privacy Policy</strong> and authorize the PayTap Card System 
                    to collect, store, and process my business and personal data (including business owner information, 
                    business registration documents, transaction records, sales data, and financial information) for 
                    vendor account management, point-of-sale operations, payment settlements, and legitimate business 
                    purposes in compliance with the Data Privacy Act of 2012 (RA 10173).
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                📄 View Full Privacy Policy
              </button>

              {formData.privacyConsent && (
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#d1fae5",
                  border: "1px solid #10b981",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#065f46"
                }}>
                  ✓ Privacy Policy accepted. Your consent has been recorded.
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="vend-submit-btn"
                disabled={isSubmitting || isValidating || !formData.privacyConsent}
              >
                {isValidating ? "Validating..." : isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => navigate("/login")}
                disabled={isSubmitting || isValidating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={handlePrivacyAccept}
        appType="vendor"
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="success-modal-overlay">
          <div className="success-modal" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 className="success-title" style={{ marginBottom: "20px" }}>Confirm Your Details</h2>
            
            <div style={{ textAlign: "left", marginBottom: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Owner Information
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Full Name:</strong> {formData.fullName}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    <strong>Phone:</strong> {formData.phoneNumber}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Business Information
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Business Name:</strong> {formData.businessName}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Stall Location:</strong> {formData.stallLocation}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    <strong>Authorized Seller:</strong> {formData.authorizedSellerName}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Uploaded Documents
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px" }}>
                  {Object.keys(files).map((key) => (
                    files[key] && (
                      <div key={key} style={{ fontSize: "14px", color: "#555", marginBottom: "6px", display: "flex", alignItems: "center" }}>
                        <span style={{ color: "#10b981", marginRight: "8px" }}>✓</span>
                        <strong>{getFileLabel(key)}:</strong>
                        <span style={{ marginLeft: "8px", color: "#6b7280" }}>{files[key].name}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div style={{ 
                background: "#dcfce7", 
                border: "1px solid #10b981", 
                borderRadius: "8px", 
                padding: "12px",
                marginBottom: "12px"
              }}>
                <p style={{ fontSize: "13px", color: "#065f46", margin: 0, lineHeight: "1.5" }}>
                  <strong>✓ Privacy Consent:</strong> You have consented to the Privacy Policy and data processing terms.
                </p>
              </div>

              <div style={{ 
                background: "#fff3cd", 
                border: "1px solid #ffc107", 
                borderRadius: "8px", 
                padding: "12px",
                marginTop: "16px"
              }}>
                <p style={{ fontSize: "13px", color: "#856404", margin: 0, lineHeight: "1.5" }}>
                  <strong>⚠️ Reminder:</strong> Each email can only submit one registration request. 
                  Please ensure all information is correct before confirming.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                className="success-ok-btn" 
                onClick={handleConfirmSubmit}
                style={{ flex: 1, maxWidth: "200px" }}
              >
                Confirm
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => setShowConfirmModal(false)}
                style={{ flex: 1, maxWidth: "200px" }}
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <svg viewBox="0 0 52 52" className="checkmark">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="success-title">Application Successfully Submitted!</h2>
            <p className="success-message">Thank you for your interest in partnering with us.</p>
            <p className="success-message">Please check your email for updates on your application status.</p>
            <p className="success-email">
             We'll send an update regarding your application to your email: <strong>{formData.email}</strong> within 1–2 business days.
            </p>
            <button className="success-ok-btn" onClick={handleCloseModal}>Confirm</button>
          </div>
        </div>
      )}
    </>
  );
}

export default VendorRegistration;