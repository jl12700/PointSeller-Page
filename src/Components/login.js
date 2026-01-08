import { doSignInWithEmailandPassword, getUserRole } from "../firebase/auth";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import '../Styles/login.css';
import TopBar from './Topbar';
import { useError } from "../contexts/errorContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("🔐 Attempting user login with:", email);
    
    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await doSignInWithEmailandPassword(email, password);
      const user = userCredential.user;
      console.log("✅ Authentication successful for:", user.email);
      
      // Step 2: Check user role in Firestore
      const userRole = await getUserRole(user.uid);
      console.log("👤 User role retrieved:", userRole);
      
      // Step 3: Prevent admins from logging in via user login page
      if (userRole === 'admin') {
        console.warn("⚠️ Admin attempted to login via user page");
        
        // Sign out the admin user
        await user.auth.signOut();
        
        toast.error("❌ Admin accounts must use the Admin Login page", {
          position: "top-center",
          autoClose: 4000,
        });
        
        showError(
          "This is an admin account. Please use the Admin Login page.",
          'Access Denied'
        );
        
        setError("❌ Admin accounts cannot login here. Please use Admin Login.");
        setIsLoading(false);
        return;
      }
      
      // Step 4: Success - Allow regular user login
      console.log("✅ User logged in successfully");
      
      toast.success("User logged in Successfully", {
        position: "top-center",
        autoClose: 2000,
      });
      
      console.log("🚀 Navigating to /Topup");
      navigate("/Topup");
      
    } catch (error) {
      console.error("❌ Login error:", error);
      
      let errorMessage = "";
      
      // Handle Firebase authentication errors
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
        case 'permission-denied':
          errorMessage = "⚠️ Unable to verify user role. Please contact support";
          break;
        default:
          errorMessage = error.message || "⚠️ Login failed. Please check your credentials";
      }
      
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
      
      showError(errorMessage, 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h1>Welcome to PayTap</h1>
          <p>Enjoy a smooth, cashless payment experience on campus.</p>
          <hr className="divider" />
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Submit"}
            </button>
          </div>

          <div className="login-links">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => navigate('/ForgotPassword')}
              disabled={isLoading}
            >
              Forgot Password?
            </button>

            <button
              type="button"
              className="admin-login-btn"
              onClick={() => navigate('/AdminLogin')}
              disabled={isLoading}
            >
              Admin Login
            </button>
          </div>

          {/* Card and Vendor Registration Sections - Side by Side */}
          <div className="registration-sections-container">
            {/* Student Card Application link */}
            <div className="card-application-link">
              <p>Do you want to apply for a PayTap Card?</p>
              <button 
                type="button" 
                className="card-link-btn"
                onClick={() => navigate("/card-application")}
                disabled={isLoading}
              >
                Apply Now
              </button>
            </div>

            {/* Vendor registration link */}
            <div className="vendor-registration-link">
              <p>Interested with our PayTap Service?</p>
              <button 
                type="button" 
                className="vendor-link-btn"
                onClick={() => navigate("/vendor-registration")}
                disabled={isLoading}
              >
                Apply as a Vendor
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default Login;