// src/Components/Logout.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Logout.css";

const Logout = ({ onClose }) => {
  const navigate = useNavigate();

  const confirmLogout = () => {
    // Clear session or token if needed
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="logout-popup-overlay">
      <div className="logout-popup">
        <p>Are you sure you want to logout?</p>
        <div className="popup-buttons">
          <button className="confirm-btn" onClick={confirmLogout}>
            Yes, Logout
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
