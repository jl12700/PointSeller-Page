import React, { useState, useEffect } from 'react';
import { auth } from "../firebase/firebase";
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
  const [transactions, setTransactions] = useState([]);
  const [pastTransactions, setPastTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
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
  const [pastTransactionsPage, setPastTransactionsPage] = useState(1);
  const [loadingPastTransactions, setLoadingPastTransactions] = useState(false);

  const ITEMS_PER_PAGE = 20;
  const MAX_CURRENT_TRANSACTIONS = 50;

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
      setLoading(true);

      // Fetch current transactions (latest 50)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(MAX_CURRENT_TRANSACTIONS);

      if (txError) {
        console.error('Error fetching transactions:', txError);
      } else {
        console.log('Transactions fetched:', txData);
        setTransactions(txData || []);
      }

      // Fetch past transactions
      const { data: pastData, error: pastError } = await supabase
        .from('past_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (pastError) {
        console.error('Error fetching past transactions:', pastError);
      } else {
        console.log('Past transactions fetched:', pastData);
        setPastTransactions(pastData || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const archiveOldTransactions = async (userId) => {
    try {
      console.log('🔄 Starting archive process...');
      
      // Get all transactions for user, ordered by date
      const { data: allTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError || !allTransactions) {
        console.error('Error fetching transactions for archiving:', fetchError);
        return;
      }

      console.log(`Total transactions: ${allTransactions.length}`);

      // If more than 50, move oldest to past_transactions
      if (allTransactions.length > MAX_CURRENT_TRANSACTIONS) {
        const toArchive = allTransactions.slice(MAX_CURRENT_TRANSACTIONS);
        const toArchiveIds = toArchive.map(t => t.id);

        console.log(`📦 Archiving ${toArchive.length} transactions...`);

        // Insert into past_transactions
        const { error: insertError } = await supabase
          .from('past_transactions')
          .insert(toArchive);

        if (insertError) {
          console.error('❌ Error archiving transactions:', insertError);
          return;
        }

        console.log('✅ Transactions inserted into past_transactions');

        // Delete from transactions
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .in('id', toArchiveIds);

        if (deleteError) {
          console.error('❌ Error deleting archived transactions:', deleteError);
        } else {
          console.log(`✅ Successfully archived ${toArchive.length} old transactions`);
        }
      } else {
        console.log('✓ No archiving needed - under limit');
      }
    } catch (error) {
      console.error('Error in archiving process:', error);
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
    if (value === '' || /^\d+$/.test(value)) {
      setRequestedPoints(value);
    }
  };

  const handleSubmitPayment = async () => {
    console.log('handleSubmitPayment called');
    
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

      // Upload proof image to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `proofs/${currentUser.uid}_${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);

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
        alert('Failed to submit payment: ' + insertError.message);
        setLoading(false);
        return;
      }

      console.log('Transaction inserted successfully:', insertedData);

      alert('Payment proof submitted successfully!');
      closePaymentModal();
      clearProof();

      // Auto-archive if needed
      await archiveOldTransactions(currentUser.uid);

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

  // Pagination for past transactions
  const paginatedPastTransactions = pastTransactions.slice(
    (pastTransactionsPage - 1) * ITEMS_PER_PAGE,
    pastTransactionsPage * ITEMS_PER_PAGE
  );

  const totalPastPages = Math.ceil(pastTransactions.length / ITEMS_PER_PAGE);

  const TransactionTable = ({ data, isPast = false }) => {
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={isAdmin ? 7 : 6} className="no-data">
            {isPast ? 'No past transactions found.' : 'No transactions found.'}
          </td>
        </tr>
      );
    }

    return data.map((tx) => {
      const getStatusColor = (status) => {
        switch(status) {
          case 'Approved':
            return '#4CAF50';
          case 'Rejected':
            return '#F44336';
          case 'Pending':
            return '#FFC107';
          default:
            return '#999';
        }
      };

      return (
        <tr key={tx.id}>
          <td>{new Date(tx.date).toLocaleDateString()}</td>
          <td>{tx.method}</td>
          <td>{tx.amount ? `${tx.amount} points` : '-'}</td>
          <td>{tx.ref_no}</td>
          <td>{tx.account_number || '-'}</td>
          <td>
            <div className="status-indicator">
              <div className={`status-dot ${tx.status.toLowerCase()}`}></div>
              <span>{tx.status}</span>
              {tx.status === 'Rejected' && tx.rejection_reason && (
                <button
                  type="button"
                  className="rejection-reason-btn"
                  onClick={() => setRejectionReasonModal(tx)}
                  title="View rejection reason"
                  aria-label="View rejection reason"
                />
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
    });
  };

  return (
    <div className="points-topup-wrapper">
      <TopBar />
      <StudentSidebar />
      <main className="points-topup-content">
        {/* Payment Method Selection */}
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

        {/* Payment Details */}
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

        {/* Transaction History with Tabs */}
        <section className="section transaction-history">
          <div className="transaction-header">
            <h2>Transaction History</h2>
            
            {/* Tab Navigation */}
            <div className="transaction-tabs">
              <button
                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                Current ({transactions.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                Past ({pastTransactions.length})
              </button>
            </div>
          </div>

          {/* Info Banner for Current Tab */}
          {activeTab === 'current' && transactions.length > 0 && (
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <span>
                Showing the latest {Math.min(transactions.length, MAX_CURRENT_TRANSACTIONS)} transactions. 
                Older entries are automatically moved to Past Transactions.
              </span>
            </div>
          )}

          {/* Table */}
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Amount (Points)</th>
                <th>Reference Number</th>
                <th>Account Number</th>
                <th>Status</th>
                {isAdmin && <th>QR</th>}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'current' ? (
                <TransactionTable data={transactions} isPast={false} />
              ) : (
                <TransactionTable data={paginatedPastTransactions} isPast={true} />
              )}
            </tbody>
          </table>

          {/* Pagination for Past Transactions */}
          {activeTab === 'past' && totalPastPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPastTransactionsPage(p => Math.max(1, p - 1))}
                disabled={pastTransactionsPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pastTransactionsPage} of {totalPastPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPastTransactionsPage(p => Math.min(totalPastPages, p + 1))}
                disabled={pastTransactionsPage === totalPastPages}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Rejection Reason Modal */}
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