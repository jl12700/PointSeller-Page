import { doSignInWithEmailandPassword } from "../firebase/auth";
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
  const navigate = useNavigate();
  const { showError } = useError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("🔐 Attempting admin login with:", email);
    
    try {
      await doSignInWithEmailandPassword(email, password);
      console.log("✅ Admin logged in successfully");

      toast.success("Admin logged in successfully", {
        position: "top-center",
        autoClose: 2000,
      });

      console.log("🚀 Navigating to /AdminDashboard");
      navigate("/CashConvert"); // Redirect to admin page

    } catch (error) {
      console.error("❌ Login error:", error);

      let errorMessage = "";
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
        default:
          errorMessage = "⚠️ Login failed. Please check your credentials";
      }

      setError(errorMessage);

      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
      showError(errorMessage, 'Admin Login Failed');
    }
  };

  return (
    <>
      <TopBar />
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h3>Admin Login</h3>

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
              placeholder="Enter admin email"
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
              Login
            </button>
          </div>

          <div className="login-links">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => navigate('/ForgotPassword')}
            >
              Forgot Password?
            </button>

            <button
              type="button"
              className="admin-login-btn"
              onClick={() => navigate('/login')}
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
