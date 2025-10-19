import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../Styles/VendorRegistration.css';
import TopBar from './Topbar';
import { supabase } from "../Supabase/supabaseClient";

function VendorRegistration() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    businessName: "",
    stallLocation: "",
    authorizedSellerName: ""
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        alert(`Database Error: ${JSON.stringify(dbError, null, 2)}`);
        toast.error("Files uploaded but failed to save application. Please contact support.");
        setIsSubmitting(false);
        return;
      }

      console.log("✅ Application saved successfully!");
      toast.success("✅ Application submitted successfully!");
      setShowSuccessModal(true);

    } catch (error) {
      console.error("💥 Submission error:", error);
      alert(`Submission Error: ${error.message}`);
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                        {key === "accreditationCert" && "School Cafeteria Accreditation Certificate *"}
                        {key === "menuList" && "Menu Items with Prices *"}
                        {key === "dtiSec" && "DTI/SEC Registration *"}
                        {key === "mayorPermit" && "Mayor's Permit *"}
                      </span>
                      <input
                        type="file"
                        name={key}
                        className="file-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        required
                        disabled={isSubmitting}
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

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => navigate("/login")}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

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
              We've sent a confirmation to: <strong>{formData.email}</strong>
            </p>
            <button className="success-ok-btn" onClick={handleCloseModal}>Back to Login</button>
          </div>
        </div>
      )}
    </>
  );
}

export default VendorRegistration;