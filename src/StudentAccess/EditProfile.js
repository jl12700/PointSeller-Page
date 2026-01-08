import '../Styles/EditProfile.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { supabase } from '../Supabase/supabaseClient';
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import { toast } from 'react-toastify';
import { useError } from "../contexts/errorContext";

function EditProfile() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { showError } = useError();

  // Fetch user's RFID card data
  const fetchCardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching card for Firebase UID:', user.uid);

      let { data, error } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('firebase_uid', user.uid);

      if (!data || data.length === 0) {
        const result = await supabase
          .from('rfid_cards')
          .select('*')
          .eq('email', user.email);
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching card:', error);
        toast.error('Failed to load profile information');
        return;
      }

      if (!data || data.length === 0) {
        console.error('No card found for this user');
        setCardData(null);
        return;
      }

      setCardData(data[0]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('An error occurred while loading your profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, [user]);

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least 1 capital letter';
    }
    return null;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      showError('Please fill in all password fields', 'Validation Error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsSaving(true);

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase
      await updatePassword(user, newPassword);

      // Update timestamp in Supabase
      await supabase
        .from('rfid_cards')
        .update({ updated_at: new Date().toISOString() })
        .eq('firebase_uid', user.uid);

      toast.success('✅ Password updated successfully!');
      setSuccessMessage('Password updated successfully!');
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password update error:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('❌ Current password is incorrect');
        showError('Current password is incorrect', 'Authentication Failed');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('❌ Too many attempts. Please try again later');
        showError('Too many attempts. Please try again later', 'Rate Limited');
      } else {
        toast.error(`❌ Failed to update password: ${error.message}`);
        showError(`Failed to update password: ${error.message}`, 'Update Failed');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClearForm = () => {
    setShowConfirmModal(true);
  };

  const confirmClearForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowConfirmModal(false);
    setSuccessMessage('Form cleared successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const cancelClearForm = () => {
    setShowConfirmModal(false);
  };

  if (isLoading) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="edit-profile">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="edit-profile">
          <div className="error-container">
            <div className="error-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>Please log in to view your profile</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!cardData) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="edit-profile">
          <div className="error-container">
            <div className="error-icon">💳</div>
            <h3>No Profile Found</h3>
            <p>You don't have a profile registered yet</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <StudentSidebar />
      <div className="edit-profile">
        <div className="profile-header">
          <h2>👤 Edit Profile</h2>
          <button onClick={() => navigate('/points-balance')} className="btn-back">
            ← Back to Balance
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="profile-container">
          {/* Account Information Card */}
          <div className="info-card">
            <h3>📋 Account Information</h3>
            
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">📧</div>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">{cardData.email}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">👤</div>
                <div className="info-content">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{cardData.name}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">💳</div>
                <div className="info-content">
                  <span className="info-label">Card Number</span>
                  <span className="info-value rfid-uid">{cardData.rfid_uid}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">💵</div>
                <div className="info-content">
                  <span className="info-label">Points Balance</span>
                  <span className="info-value balance-highlight">
                    {cardData.balance} pts
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">
                    {new Date(cardData.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  {cardData.status === 'active' ? '✅' : '🔴'}
                </div>
                <div className="info-content">
                  <span className="info-label">Account Status</span>
                  <span className={`info-value status-text ${cardData.status}`}>
                    {cardData.status.charAt(0).toUpperCase() + cardData.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="password-card">
            <h3>🔒 Change Password</h3>
            <p className="password-subtitle">
              Password must be at least 8 characters with 1 capital letter
            </p>

            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    className="input-field"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 chars, 1 capital)"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="input-field"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? '👁️' : '🔒'}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      <div className={`strength-bar ${passwordForm.newPassword.length >= 8 ? 'filled' : ''}`}></div>
                      <div className={`strength-bar ${/[A-Z]/.test(passwordForm.newPassword) ? 'filled' : ''}`}></div>
                      <div className={`strength-bar ${/[0-9]/.test(passwordForm.newPassword) ? 'filled' : ''}`}></div>
                    </div>
                    <small>
                      {passwordForm.newPassword.length < 8 && '❌ Min 8 characters • '}
                      {!/[A-Z]/.test(passwordForm.newPassword) && '❌ 1 Capital letter required'}
                      {passwordForm.newPassword.length >= 8 && /[A-Z]/.test(passwordForm.newPassword) && '✅ Strong password'}
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    className="input-field"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? '👁️' : '🔒'}
                  </button>
                </div>
                {passwordForm.confirmPassword && (
                  <small className={passwordForm.newPassword === passwordForm.confirmPassword ? 'match-success' : 'match-error'}>
                    {passwordForm.newPassword === passwordForm.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </small>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-save"
                >
                  {isSaving ? '⏳ Updating...' : '✓ Update Password'}
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  disabled={isSaving}
                  className="btn-cancel"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={cancelClearForm}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Action</h2>
              <p>Are you sure you want to proceed?</p>
              <div className="modal-buttons">
                <button 
                  className="modal-btn-secondary" 
                  onClick={cancelClearForm}
                >
                  No
                </button>
                <button 
                  className="modal-btn-primary" 
                  onClick={confirmClearForm}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default EditProfile;