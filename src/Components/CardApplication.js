import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../Styles/CardApplication.css';
import TopBar from './Topbar';
import { supabase } from "../Supabase/supabaseClient";
import PrivacyPolicyModal from './PrivacyPolicyModal';

function CardApplication() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    schoolIdNumber: "",
    section: "",
    contactNumber: "",
    reasonPurpose: "",
    agreeToTerms: false,
    privacyConsent: false  // New field for privacy consent
  });

  const [schoolIdFile, setSchoolIdFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      setSchoolIdFile(file);

      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setPreviewURL(previewUrl);
      }
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .from("card_applications")
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
    
    if (!schoolIdFile) {
      toast.error("⚠️ Please upload a picture of your School ID", { position: "top-center" });
      return;
    }

    if (!formData.privacyConsent) {
      toast.error("⚠️ Please read and accept the Privacy Policy to continue", { position: "top-center" });
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("⚠️ Please agree to the terms and consent", { position: "top-center" });
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
      toast.error("This email has already submitted an application. Only one application per email is allowed.", {
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
    toast.info("Uploading file, please wait...");

    try {
      // Upload school ID file
      console.log("📁 Starting file upload...");
      const schoolIdUrl = await uploadToSupabase(
        schoolIdFile, 
        `card-applications/${formData.schoolIdNumber || "students"}`
      );

      if (!schoolIdUrl) {
        toast.error("❌ Failed to upload School ID. Please try again.");
        setIsSubmitting(false);
        return;
      }

      console.log("✅ File uploaded successfully:", schoolIdUrl);

      // Prepare data for database
      const dataToInsert = {
        email: formData.email,
        full_name: formData.fullName,
        school_id_number: formData.schoolIdNumber,
        section: formData.section,
        contact_number: formData.contactNumber,
        reason_purpose: formData.reasonPurpose,
        school_id_url: schoolIdUrl,
        agreed_to_terms: formData.agreeToTerms,
        privacy_consent: formData.privacyConsent,
        privacy_consent_date: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log("💾 Inserting into database:", dataToInsert);

      const { data: cardData, error: dbError } = await supabase
        .from('card_applications')
        .insert([dataToInsert])
        .select();

      console.log("📊 Database response - Data:", cardData);
      console.log("📊 Database response - Error:", dbError);

      if (dbError) {
        console.error("❌ Database error:", dbError);
        toast.error("File uploaded but failed to save application. Please contact support.");
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
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
    }
    navigate("/login");
  };

  const handlePrivacyAccept = () => {
    setFormData(prev => ({ ...prev, privacyConsent: true }));
    setShowPrivacyModal(false);
    toast.success("Privacy Policy accepted. You may now proceed with your application.");
  };

  return (
    <>
      <TopBar />
      <div className="card-app-container">
        <div className="card-app-card">
          <div className="card-app-header">
            <button className="back-btn" onClick={() => navigate("/login")}>
              ← Back to Login
            </button>
            <h2>PayTap Card Application</h2>
            <p className="subtitle">Apply for your Paytap card</p>
          </div>

         

          <form onSubmit={handleSubmit} className="card-app-form">
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>
              
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
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || isValidating}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>School ID Number *</label>
                  <input
                    type="text"
                    name="schoolIdNumber"
                    className="form-input"
                    placeholder="e.g., 1600012345"
                    value={formData.schoolIdNumber}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>

                <div className="form-group">
                  <label>Course *</label>
                  <input
                    type="text"
                    name="section"
                    className="form-input"
                    placeholder="e.g., BSCS, BSIT "
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isValidating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  className="form-input"
                  placeholder="09XX XXX XXXX"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || isValidating}
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Application Details</h3>
              
              <div className="form-group">
                <label>Reason/Purpose *</label>
                <p className="field-hint">Why do you want to apply for a PayTap Card?</p>
                <textarea
                  name="reasonPurpose"
                  className="form-textarea"
                  placeholder="e.g., I am interested in paytap card for cafeteria payments, or I lost my previous card and need a replacement..."
                  value={formData.reasonPurpose}
                  onChange={handleInputChange}
                  rows="5"
                  required
                  disabled={isSubmitting || isValidating}
                />
                <p className="field-note">This helps admins understand if you're a new applicant or replacing a lost card.</p>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Required Document</h3>
              
              <div className="form-group">
                <label>Upload a picture of your School ID *</label>
                <p className="field-hint">For visual verification purposes</p>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    name="schoolId"
                    className="file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                    disabled={isSubmitting || isValidating}
                    id="schoolIdInput"
                  />
                  <label htmlFor="schoolIdInput" className="file-btn">
                    {schoolIdFile ? `✓ ${schoolIdFile.name}` : "Choose File"}
                  </label>
                </div>

                {previewURL && (
                  <div className="image-preview">
                    <img 
                      src={previewURL} 
                      alt="School ID preview" 
                      style={{ 
                        maxWidth: "300px", 
                        marginTop: "16px", 
                        borderRadius: "8px", 
                        border: "2px solid #e5e7eb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }} 
                    />
                  </div>
                )}
                <p className="file-note">* Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>
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
                Before continuing, please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information in compliance with the Data Privacy Act of 2012 (RA 10173).
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
                    to collect, store, and process my personal and financial data (including name, email, school ID, 
                    contact information, transaction history, and card balance) for legitimate school transactions, 
                    account management, and service provision in compliance with the Data Privacy Act of 2012 (RA 10173).
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
                className="cardamin-submit-btn"
                disabled={isSubmitting || isValidating || !formData.agreeToTerms || !formData.privacyConsent}
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
        appType="card"
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="success-modal-overlay">
          <div className="success-modal" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 className="success-title" style={{ marginBottom: "20px" }}>Confirm Your Details</h2>
            
            <div style={{ textAlign: "left", marginBottom: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Personal Information
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Full Name:</strong> {formData.fullName}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>School ID Number:</strong> {formData.schoolIdNumber}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>
                    <strong>Course:</strong> {formData.section}
                  </div>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    <strong>Contact Number:</strong> {formData.contactNumber}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Application Details
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#555" }}>
                    <strong>Reason/Purpose:</strong>
                    <p style={{ marginTop: "6px", marginBottom: "0", lineHeight: "1.5" }}>
                      {formData.reasonPurpose}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#2c3e50" }}>
                  Uploaded Document
                </h3>
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#555", display: "flex", alignItems: "center" }}>
                    <span style={{ color: "#10b981", marginRight: "8px" }}>✓</span>
                    <strong>School ID:</strong>
                    <span style={{ marginLeft: "8px", color: "#6b7280" }}>{schoolIdFile?.name}</span>
                  </div>
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
                  <strong>⚠️ Reminder:</strong> Each email can only submit one application. 
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
            <p className="success-message">Thank you for applying for a PayTap Card.</p>
            <p className="success-message">Your application is now being processed.</p>
            <p className="success-email">
              We'll send updates regarding your application to: <strong>{formData.email}</strong> within 1–2 business days.
            </p>
            <p className="success-note">
              Please keep your contact number accessible. Our team may reach out for verification or card pickup instructions.
            </p>
            <button className="success-ok-btn" onClick={handleCloseModal}>Confirm</button>
          </div>
        </div>
      )}
    </>
  );
}

export default CardApplication;