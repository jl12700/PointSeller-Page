import { doSignInWithEmailandPassword, getUserRole } from "../firebase/auth";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import '../Styles/login.css';
import TopBar from './Topbar';
import { useError } from "../contexts/errorContext";

function AdminLogin() {
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
    console.log("🔐 Attempting admin login with:", email);
    
    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await doSignInWithEmailandPassword(email, password);
      const user = userCredential.user;
      console.log("✅ Authentication successful for:", user.email);
      
      // Step 2: Check user role in Firestore
      const userRole = await getUserRole(user.uid);
      console.log("👤 User role retrieved:", userRole);
      
      // Step 3: Verify admin access
      if (userRole !== 'admin') {
        console.warn("⚠️ Non-admin user attempted admin login");
        
        // Sign out the user immediately
        await user.auth.signOut();
        
        toast.error("❌ Access denied. Admin credentials required", {
          position: "top-center",
          autoClose: 4000,
        });
        
        showError(
          "You do not have admin privileges. Please use the regular login page.",
          'Access Denied'
        );
        
        setError("❌ Access denied. This page is for administrators only.");
        setIsLoading(false);
        return;
      }
      
      // Step 4: Success - Allow admin login
      console.log("✅ Admin logged in successfully");

      toast.success("Admin logged in successfully", {
        position: "top-center",
        autoClose: 2000,
      });

      console.log("🚀 Navigating to /CashConvert");
      navigate("/CashConvert");

    } catch (error) {
      console.error("❌ Login error:", error);

      let errorMessage = "";
      
      // Handle Firebase authentication errors
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "⚠️ No admin account found with this email address";
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
          errorMessage = "⚠️ This admin account has been disabled";
          break;
        case 'permission-denied':
          errorMessage = "⚠️ Unable to verify admin role. Please contact support";
          break;
        default:
          errorMessage = error.message || "⚠️ Login failed. Please check your credentials";
      }

      setError(errorMessage);

      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
      
      showError(errorMessage, 'Admin Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h3>Admin Login</h3>
          
          <div className="admin-badge">
            🔒 Administrator Access Only
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label>Admin Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter admin email"
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
              {isLoading ? "Verifying..." : "Login"}
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
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              User Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default AdminLogin;