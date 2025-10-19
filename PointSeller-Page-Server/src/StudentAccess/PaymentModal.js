import React, { useRef, useState } from 'react';
import { auth } from '../firebase/firebase';
import { PAYMENT_METHODS } from '../Constants';
import { validatePaymentForm } from '../utils/validation';
import { supabase } from '../Supabase/supabaseClient';

const PaymentModal = ({ paymentMethod, onClose }) => {
  const [paymentForm, setPaymentForm] = useState({
    name: auth.currentUser?.email || '',
    requestedPoints: '',
    accountNumber: '',
    referenceNumber: '',
    proofOfPayment: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const fileInputRef = useRef(null);

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setPaymentForm(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else if (name === 'requestedPoints') {
      // Only allow positive numbers for points
      if (value === '' || /^\d+$/.test(value)) {
        setPaymentForm(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setPaymentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const validationErrors = {};
    if (!paymentForm.requestedPoints || parseInt(paymentForm.requestedPoints) <= 0) {
      validationErrors.requestedPoints = 'Please enter requested points greater than 0';
    }
    if (!paymentForm.accountNumber.trim()) {
      validationErrors.accountNumber = 'Account number is required';
    }
    if (!paymentForm.referenceNumber.trim()) {
      validationErrors.referenceNumber = 'Reference number is required';
    }
    if (!paymentForm.proofOfPayment) {
      validationErrors.proofOfPayment = 'Proof of payment is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      alert('User not authenticated or email not available');
      return;
    }

    setLoading(true);

    try {
      console.log('=== STARTING PAYMENT SUBMISSION FROM MODAL ===');
      console.log('User ID:', user.uid);
      console.log('User Email:', user.email);
      console.log('Payment Method:', paymentMethod);
      console.log('Requested Points:', paymentForm.requestedPoints);

      // Upload proof image to Supabase Storage
      const fileExt = paymentForm.proofOfPayment.name.split('.').pop();
      const fileName = `proofs/${user.uid}_${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image')
        .upload(fileName, paymentForm.proofOfPayment);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        alert('Failed to upload proof image');
        setLoading(false);
        return;
      }

      console.log('✅ File uploaded successfully');

      // Get public URL of uploaded proof
      const { data: publicUrlData } = supabase.storage
        .from('image')
        .getPublicUrl(fileName);

      const publicURL = publicUrlData?.publicUrl;

      if (!publicURL) {
        alert('Failed to get public URL for proof image');
        setLoading(false);
        return;
      }

      console.log('✅ Public URL generated:', publicURL);

      // Get user's account number from form
      const userAccountNumber = paymentForm.accountNumber.trim();
      const pointsAmount = parseInt(paymentForm.requestedPoints, 10);

      console.log('User account number to save:', userAccountNumber);
      console.log('Email to save:', user.email);
      console.log('Points to save:', pointsAmount);

      // Insert transaction record in Supabase
      console.log('Inserting transaction with data:', {
        user_id: user.uid,
        user_email: user.email,
        date: new Date().toISOString(),
        method: paymentMethod,
        amount: pointsAmount,
        ref_no: paymentForm.referenceNumber,
        proof_url: publicURL,
        status: 'Pending',
        account_number: userAccountNumber,
      });

      const { data: insertedData, error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.uid,
            user_email: user.email,
            date: new Date().toISOString(),
            method: paymentMethod,
            amount: pointsAmount,
            ref_no: paymentForm.referenceNumber,
            proof_url: publicURL,
            status: 'Pending',
            account_number: userAccountNumber,
          },
        ])
        .select();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.error('Insert error details:', insertError.details);
        console.error('Insert error message:', insertError.message);
        alert('Failed to submit payment');
        setLoading(false);
        return;
      }

      console.log('✅ Transaction inserted successfully:', insertedData);
      console.log('=== PAYMENT SUBMISSION COMPLETE ===');

      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      alert('Failed to submit payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentForm({
      name: auth.currentUser?.email || '',
      requestedPoints: '',
      accountNumber: '',
      referenceNumber: '',
      proofOfPayment: null
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="pm-modal-overlay" onClick={handleClose}>
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <div className="success-icon">✅</div>
            <div className="success-message">
              <div className="success-title">Your payment has been submitted.</div>
              <div className="success-subtitle">A confirmation will appear in your Transaction History once processed.</div>
            </div>
            <button className="success-close" onClick={() => setShowSuccessPopup(false)}>×</button>
          </div>
        </div>
      )}
      <div className="pm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="pm-modal-title">
        <div className="pm-modal-header">
          <h2 id="pm-modal-title" className="pm-modal-title">Payment Form – {paymentMethod}</h2>
          <button className="pm-modal-close" onClick={handleClose} aria-label="Close">×</button>
        </div>
        
        <form className="pm-form" onSubmit={handleSubmit}>
          {/* Payment Details Section */}
          <div className="pm-section">
            <h3 className="pm-section-title">Payment details</h3>
            <p className="pm-callout">Send payment to {paymentMethod} number: <strong>{PAYMENT_METHODS[paymentMethod]?.accountNumber}</strong></p>
          </div>

          <div className="pm-form-grid">
            <div className="pm-group">
              <label htmlFor="payment-name" className="pm-label">Email</label>
              <input
              id="payment-name"
              name="name"
              type="email"
              value={paymentForm.name}
              onChange={handleFormChange}
              className="pm-input"
              readOnly
              />
            </div>

            <div className="pm-group">
              <label htmlFor="payment-points" className="pm-label">Requested Points (₱1 = 1 Point)</label>
              <input
              id="payment-points"
              name="requestedPoints"
              type="text"
              value={paymentForm.requestedPoints}
              onChange={handleFormChange}
              className="pm-input"
              placeholder="Enter amount in PHP (e.g., 500)"
              inputMode="numeric"
              aria-invalid={Boolean(errors.requestedPoints)}
              />
              {errors.requestedPoints && (
                <span className="pm-error">{errors.requestedPoints}</span>
              )}
              {paymentForm.requestedPoints && (
                <p className="pm-points-info">You will receive <strong>{paymentForm.requestedPoints}</strong> points</p>
              )}
            </div>

            <div className="pm-group">
              <label htmlFor="payment-account" className="pm-label">Your Account Number</label>
              <input
              id="payment-account"
              name="accountNumber"
              type="text"
              value={paymentForm.accountNumber}
              onChange={handleFormChange}
              className="pm-input"
              placeholder="Enter your account number"
              aria-invalid={Boolean(errors.accountNumber)}
              />
              {errors.accountNumber && (
                <span className="pm-error">{errors.accountNumber}</span>
              )}
              <p className="pm-help">Enter the account number you used to send the payment</p>
            </div>

            <div className="pm-group">
              <label htmlFor="payment-reference" className="pm-label">Reference Number</label>
              <input
              id="payment-reference"
              name="referenceNumber"
              type="text"
              value={paymentForm.referenceNumber}
              onChange={handleFormChange}
              className="pm-input"
              placeholder="Enter reference number"
              aria-invalid={Boolean(errors.referenceNumber)}
              />
              {errors.referenceNumber && (
                <span className="pm-error">{errors.referenceNumber}</span>
              )}
            </div>

            <div className="pm-group pm-upload-group">
              <label htmlFor="payment-proof" className="pm-label">Upload proof of payment</label>
              <div
                className="pm-upload"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                aria-label="Upload proof of payment"
              >
                <div className="pm-upload-inner">
                  <div className="pm-upload-icon">📎</div>
                  <div className="pm-upload-text">
                    <strong>Click to upload</strong> or drag and drop
                    <div className="pm-upload-sub">PNG, JPG up to 5MB</div>
                  </div>
                </div>
                {paymentForm.proofOfPayment && (
                  <div className="pm-upload-selected">Selected: {paymentForm.proofOfPayment.name}</div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="payment-proof"
                name="proofOfPayment"
                type="file"
                accept="image/*"
                onChange={handleFormChange}
                className="pm-file-input"
                aria-invalid={Boolean(errors.proofOfPayment)}
              />
              {errors.proofOfPayment && (
                <span className="pm-error">{errors.proofOfPayment}</span>
              )}
            </div>
          </div>

          <div className="pm-actions">
            <button type="button" className="pm-btn pm-btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="pm-btn pm-btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;