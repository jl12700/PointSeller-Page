import React, { useState, useEffect } from 'react';
import { auth } from "../firebase/firebase"; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import { PAYMENT_METHODS } from '../Constants';
import { QRCodeCanvas } from 'qrcode.react';
import GCashLogo from '../design/Gcash.png';
import UnionBankLogo from '../design/unionbank.png';
import PaymentModal from './PaymentModal';
import '../Styles/pointsTopup.css';
import { supabase } from "../Supabase/supabaseClient";

const PointsTopup = ({ isAdmin }) => {
  const [userBalance, setUserBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [modalPaymentMethod, setModalPaymentMethod] = useState(null);
  const [refNo, setRefNo] = useState('');
  const [requestedPoints, setRequestedPoints] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [visibleQrForRow, setVisibleQrForRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectionReasonModal, setRejectionReasonModal] = useState(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user?.email);
      setCurrentUser(user);
      if (user) {
        fetchData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    if (!rejectionReasonModal && !showPaymentModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (rejectionReasonModal) {
          setRejectionReasonModal(null);
        }
        if (showPaymentModal) {
          closePaymentModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectionReasonModal, showPaymentModal]);

  const fetchData = async (userId) => {
    if (!userId) {
      console.warn('No user ID provided');
      return;
    }

    try {
      console.log('Fetching data for user:', userId);

      // Fetch transactions for the user
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
      } else {
        console.log('Transactions fetched:', txData);
        setTransactions(txData || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    }
  };

  const handlePaymentClick = (method) => {
    setModalPaymentMethod(method);
    setShowPaymentModal(true);
    setProofFile(null);
    setProofPreviewUrl('');
    setRefNo('');
    setRequestedPoints('');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setModalPaymentMethod(null);
    setRefNo('');
    setRequestedPoints('');
  };

  const handleProofUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProofFile(file);
    setProofPreviewUrl(url);
  };

  const clearProof = () => {
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(null);
    setProofPreviewUrl('');
  };

  const handlePointsChange = (e) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (value === '' || /^\d+$/.test(value)) {
      setRequestedPoints(value);
    }
  };

  // Handler to submit payment proof and ref no to Supabase
  const handleSubmitPayment = async () => {
    console.log('handleSubmitPayment called');
    console.log('currentUser:', currentUser);
    console.log('currentUser.email:', currentUser?.email);
    console.log('modalPaymentMethod:', modalPaymentMethod);
    console.log('refNo:', refNo);
    console.log('requestedPoints:', requestedPoints);
    console.log('proofFile:', proofFile);
    
    if (!modalPaymentMethod || !refNo || !requestedPoints || !proofFile) {
      alert('Please enter reference number, requested points, and upload proof of payment.');
      return;
    }

    const pointsAmount = parseInt(requestedPoints, 10);
    if (pointsAmount <= 0) {
      alert('Requested points must be greater than 0');
      return;
    }

    if (!currentUser || !currentUser.email) {
      alert('User not authenticated or email not available');
      return;
    }

    setLoading(true);

    try {
      console.log('=== STARTING PAYMENT SUBMISSION ===');
      console.log('Submitting payment for user:', currentUser.uid);
      console.log('User email:', currentUser.email);

      // Upload proof image to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `proofs/${currentUser.uid}_${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);
      console.log('File size:', proofFile.size);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image')
        .upload(fileName, proofFile);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        alert('Failed to upload proof image: ' + uploadError.message);
        setLoading(false);
        return;
      }

      console.log('✅ File uploaded successfully:', uploadData);

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

      console.log('Public URL generated:', publicURL);

      // Get account number for the payment method
      const accountNumber = PAYMENT_METHODS[modalPaymentMethod]?.accountNumber || '';

      console.log('Account number to save:', accountNumber);
      console.log('Email to save:', currentUser.email);

      // Insert transaction record in Supabase
      const { data: insertedData, error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: currentUser.uid,
            user_email: currentUser.email,
            date: new Date().toISOString(),
            method: modalPaymentMethod,
            amount: pointsAmount,
            ref_no: refNo,
            proof_url: publicURL,
            status: 'Pending',
            account_number: accountNumber,
          },
        ])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        console.error('Insert error details:', insertError.details);
        console.error('Insert error message:', insertError.message);
        alert('Failed to submit payment: ' + insertError.message);
        setLoading(false);
        return;
      }

      console.log('Transaction inserted successfully:', insertedData);

      alert('Payment proof submitted successfully!');
      closePaymentModal();
      clearProof();

      // Refresh transactions after submission
      await fetchData(currentUser.uid);
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="points-topup-wrapper">
        <TopBar />
        <StudentSidebar />
        <main className="points-topup-content">
          <p>Please log in to access this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="points-topup-wrapper">
      <TopBar />
      <StudentSidebar />
      <main className="points-topup-content">
        <section className="section payment-method-selection">
          <h2>Choose a payment method</h2>
          <div className="payment-options">
            {['GCash', 'UnionBank'].map((method) => (
              <div
                key={method}
                className={`payment-card ${modalPaymentMethod === method ? 'selected' : ''}`}
                onClick={() => handlePaymentClick(method)}
                role="button"
                tabIndex={0}
              >
                <img
                  src={method === 'GCash' ? GCashLogo : UnionBankLogo}
                  alt={method}
                  className="payment-logo"
                />
                <p>Pay with {method}</p>
              </div>
            ))}
          </div>
        </section>

        {modalPaymentMethod && (
          <section className="section payment-details">
            <h3>Payment details</h3>
            <p>
              Send payment to {modalPaymentMethod} number:{' '}
              <strong>{PAYMENT_METHODS[modalPaymentMethod]?.accountNumber}</strong>
            </p>

            <label htmlFor="user-email" className="form-label">
              Your Email
            </label>
            <input
              id="user-email"
              type="email"
              className="form-input"
              value={currentUser.email}
              disabled
              readOnly
            />

            <label htmlFor="requested-points" className="form-label">
              Requested Points (₱1 = 1 Point)
            </label>
            <input
              id="requested-points"
              type="text"
              className="form-input"
              value={requestedPoints}
              placeholder="Enter amount in PHP (e.g., 500)"
              onChange={handlePointsChange}
              inputMode="numeric"
            />
            {requestedPoints && (
              <p className="points-info">
                You will receive <strong>{requestedPoints}</strong> points
              </p>
            )}

            <label htmlFor="account-number" className="form-label">
              Your Account Number
            </label>
            <input
              id="account-number"
              type="text"
              className="form-input"
              placeholder="Enter your account number (GCash/UnionBank)"
              inputMode="numeric"
            />

            <label htmlFor="ref-no" className="form-label">
              Reference Number
            </label>
            <input
              id="ref-no"
              type="text"
              className="form-input"
              value={refNo}
              placeholder="Enter reference number"
              onChange={(e) => setRefNo(e.target.value)}
              inputMode="numeric"
            />

            <label htmlFor="proof" className="form-label">
              Upload Proof of Payment (image)
            </label>
            <input
              id="proof"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleProofUpload}
            />

            {proofPreviewUrl && (
              <div className="proof-preview">
                <img src={proofPreviewUrl} alt="Payment proof preview" />
                <button type="button" className="btn-secondary" onClick={clearProof}>
                  Remove
                </button>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmitPayment}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Payment'}
            </button>
          </section>
        )}

        <section className="section transaction-history">
          <h2>Transaction History</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Amount (Points)</th>
                <th>Reference Number</th>
                <th>Status</th>
                {isAdmin && <th>QR</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="no-data">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const getStatusColor = (status) => {
                    switch(status) {
                      case 'Approved':
                        return '#4CAF50'; // Green
                      case 'Rejected':
                        return '#F44336'; // Red
                      case 'Pending':
                        return '#FFC107'; // Yellow
                      default:
                        return '#999';
                    }
                  };

                  const statusColor = getStatusColor(tx.status);

                  return (
                    <tr key={tx.id}>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>{tx.method}</td>
                      <td>{tx.amount ? `${tx.amount} points` : '-'}</td>
                      <td>{tx.ref_no}</td>
                      <td>
                        <div className="status-indicator">
                          <div
                            className={`status-dot ${tx.status.toLowerCase()}`}
                          ></div>
                          <span>{tx.status}</span>
                          {tx.status === 'Rejected' && tx.rejection_reason && (
                            <button
                              type="button"
                              className="rejection-reason-btn"
                              onClick={() => setRejectionReasonModal(tx)}
                              title="View rejection reason"
                              aria-label="View rejection reason"
                            >
                            </button>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="qr-container">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setVisibleQrForRow(visibleQrForRow === tx.id ? null : tx.id)}
                            >
                              {visibleQrForRow === tx.id ? 'Hide QR' : 'Generate QR'}
                            </button>
                            {visibleQrForRow === tx.id && (
                              <QRCodeCanvas
                                value={JSON.stringify({
                                  ...tx,
                                  recipient: PAYMENT_METHODS[tx.method]?.accountNumber,
                                  refNo: tx.ref_no,
                                })}
                                size={96}
                                includeMargin
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {rejectionReasonModal && (
          <div 
            className="modal-overlay" 
            onClick={() => setRejectionReasonModal(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-modal-title"
          >
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2 id="rejection-modal-title">Rejection Reason</h2>
              <p><strong>Transaction ID:</strong> {rejectionReasonModal.id}</p>
              <p><strong>Date:</strong> {new Date(rejectionReasonModal.date).toLocaleString()}</p>
              <p><strong>Amount:</strong> {rejectionReasonModal.amount} points</p>
              <p><strong>Reason:</strong></p>
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                marginTop: '8px',
                minHeight: '60px'
              }}>
                {rejectionReasonModal.rejection_reason}
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setRejectionReasonModal(null)}
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <PaymentModal paymentMethod={modalPaymentMethod} onClose={closePaymentModal} />
        )}
      </main>
    </div>
  );
};

export default PointsTopup;