import { doSignInWithEmailandPassword } from "../firebase/auth";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import '../Styles/login.css';
import TopBar from './Topbar';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("🔐 Attempting login with:", email);
    
    try {
      await doSignInWithEmailandPassword(email, password);
      console.log("✅ User logged in Successfully");
      
      toast.success("User logged in Successfully", {
        position: "top-center",
        autoClose: 2000,
      });
      
      console.log("🚀 Navigating to /Topup");
      navigate("/Topup");
      
    } catch (error) {
      console.error("❌ Login error:", error);
      
      let errorMessage = "";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "⚠️ No account found with this email address";
          break;
        case 'auth/wrong-password':
          errorMessage = "⚠️ Incorrect password. Please try again";
          break;
        case 'auth/invalid-email':
          errorMessage = "⚠️ Invalid email format";
          break;
        case 'auth/invalid-credential':
          errorMessage = "⚠️ Invalid email or password. Please check your credentials";
          break;
        case 'auth/too-many-requests':
          errorMessage = "⚠️ Too many failed attempts. Please try again later";
          break;
        case 'auth/user-disabled':
          errorMessage = "⚠️ This account has been disabled";
          break;
        default:
          errorMessage = "⚠️ Login failed. Please check your credentials";
      }
      
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };

  return (
    <>
      <TopBar />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h3>Welcome</h3>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>

          {/* ✅ Add vendor registration link */}
          <div className="vendor-registration-link">
            <p>Looking to partner with PayTap Service?</p>
            <button 
              type="button" 
              className="vendor-link-btn"
              onClick={() => navigate("/vendor-registration")}
            >
              Apply as a Vendor
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Login;