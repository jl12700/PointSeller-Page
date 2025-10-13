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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

  const uploadToSupabase = async (file, folderName) => {
    try {
      const fileName = `${folderName}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("image") // ✅ bucket name
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("image")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error.message);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.accreditationCert || !files.menuList || !files.dtiSec || !files.mayorPermit) {
      toast.error("⚠️ Please upload all required documents", { position: "top-center" });
      return;
    }

    toast.info("Uploading files, please wait...");

    const uploaded = {};
    for (const key in files) {
      if (files[key]) {
        const url = await uploadToSupabase(files[key], formData.businessName || "vendors");
        if (url) uploaded[key] = url;
      }
    }

    setUploadedURLs(uploaded);

    console.log("Form Data:", formData);
    console.log("Uploaded URLs:", uploaded);

    toast.success("✅ All files uploaded successfully!");
    setShowSuccessModal(true);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
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
            {/* Personal Information Section */}
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
                  />
                </div>
              </div>
            </div>

            {/* Business Information Section */}
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
                />
              </div>
            </div>

            {/* Documents Section */}
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
                      />
                      <span className="file-btn">
                        {files[key] ? "✓ " + files[key].name : "Choose File"}
                      </span>
                    </label>

                    {/* ✅ Preview uploaded image */}
                    {uploadedURLs[key] && uploadedURLs[key].match(/\.(jpeg|jpg|png)$/i) && (
                      <div className="image-preview">
                        <img src={uploadedURLs[key]} alt={key} style={{ width: "120px", marginTop: "10px", borderRadius: "8px" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="file-note">* Accepted formats: PDF, JPG, PNG (Max 5MB per file)</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">Submit Application</button>
              <button type="button" className="cancel-btn" onClick={() => navigate("/login")}>Cancel</button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Success Modal */}
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
