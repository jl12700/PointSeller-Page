// src/Components/Logout.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "../Styles/Logout.css";

const Logout = ({ onClose }) => {
  const navigate = useNavigate();

  const confirmLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Clear any local data if you store user info in localStorage/sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login page
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error during logout:", error);
    }
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
