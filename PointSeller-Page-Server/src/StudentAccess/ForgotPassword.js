import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import TopBar from '../Components/Topbar';
import '../Styles/login.css';
import { useNavigate } from 'react-router-dom';
import { useError } from "../contexts/errorContext";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { showError } = useError();

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!email) {
      showMessage("error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      showMessage("success", "Password reset email sent! Check your inbox.");
    } catch (err) {
      let errorMessage = "Failed to send reset email. Please try again.";
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many requests. Please try again later.";
          break;
        default:
          errorMessage = err?.message || errorMessage;
      }
      
      showMessage("error", errorMessage);
      showError(errorMessage, 'Reset Password Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar />
      <div className="login-container">
        <div className="login-content">
          <div className="login-header">
            <h1>Reset Password</h1>
            <p className="login-description">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="login-form">
            <h3>Forgot Password</h3>

            {message && (
              <div className={`notification ${message.type === 'error' ? 'error' : 'success'}`}>
                <p className="notification-text">{message.text}</p>
              </div>
            )}

            {!emailSent ? (
              <>
                <div className="mb-3">
                  <label>Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: '#166534', margin: '0 0 0.5rem 0' }}>Email Sent!</h3>
                  <p style={{ color: '#166534', margin: 0 }}>
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                    setMessage(null);
                  }}
                >
                  Send Another Email
                </button>
              </div>
            )}

            <div className="login-links">
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
              
              <button 
                type="button" 
                className="admin-login-btn"
                onClick={() => navigate('/AdminLogin')}
              >
                Admin Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;