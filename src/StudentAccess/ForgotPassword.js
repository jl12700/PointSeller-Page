import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import TopBar from '../Components/Topbar';
import '../Styles/login.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle password reset
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error("Please enter your email address", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      
      console.log("✅ Password reset email sent to:", email);
      
      // Show success state
      setEmailSent(true);
      
      toast.success("Password reset email sent! Check your inbox.", {
        position: "top-center",
        autoClose: 5000,
      });

    } catch (error) {
      console.error("❌ Password reset error:", error);
      
      let errorMessage = "Failed to send reset email. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please try again later.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
        default:
          errorMessage = error?.message || errorMessage;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 4000,
      });
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form to send another email
   */
  const handleSendAnother = () => {
    setEmailSent(false);
    setEmail("");
  };

  return (
    <>
      <TopBar />
      <div className="login-container">
        <form onSubmit={handleResetPassword} className="login-form">
          
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="forgot-password-header">
                <div className="forgot-password-icon">🔐</div>
                <h3>Reset Password</h3>
                <p className="forgot-password-description">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Email Input */}
              <div className="mb-3">
                <label htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {/* Submit Button */}
              <div className="d-grid">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="success-state">
                <div className="success-icon">✉️</div>
                <h3>Email Sent!</h3>
                <p className="success-message">
                  We've sent a password reset link to:
                </p>
                <p className="success-email">{email}</p>
                <p className="success-note">
                  Please check your inbox and spam folder. The link will expire in 1 hour.
                </p>

                {/* Send Another Email Button */}
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={handleSendAnother}
                >
                  Send Another Email
                </button>
              </div>
            </>
          )}

          {/* Navigation Links */}
          <div className="login-links">
            <button 
              type="button" 
              className="forgot-password-link"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              ← Back to Login
            </button>
            
            <button 
              type="button" 
              className="admin-login-btn"
              onClick={() => navigate('/AdminLogin')}
              disabled={loading}
            >
              Admin Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ForgotPassword;