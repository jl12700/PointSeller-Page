import React, { useState, useEffect } from 'react';
import '../Styles/TopupManagement.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import { supabase } from "../Supabase/supabaseClient";
import { useNavigate } from 'react-router-dom';

const TopupManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');

  // Fetch transactions based on active tab
  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions based on active tab status
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          user_email,
          status,
          method,
          amount,
          ref_no,
          proof_url,
          date,
          created_at,
          account_number,
          rejection_reason
        `)
        .eq('status', activeTab)
        .order('date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching transactions:', fetchError);
        setError('Failed to load transactions');
        return;
      }

      // Fetch rfid_uid for each user from rfid_cards table
      const enrichedData = await Promise.all(
        transactions.map(async (tx) => {
          let rfidUid = 'N/A';
          
          // Fetch user's rfid_uid from rfid_cards table using firebase_uid
          if (tx.user_id) {
            const { data: cardData, error: cardError } = await supabase
              .from('rfid_cards')
              .select('rfid_uid')
              .eq('firebase_uid', tx.user_id)
              .single();

            if (!cardError && cardData) {
              rfidUid = cardData.rfid_uid || 'N/A';
            }
          }

          return {
            id: tx.id,
            user_id: tx.user_id,
            email: tx.user_email || 'Unknown Email',
            transactionCode: tx.id,
            cardNumber: rfidUid,
            paymentMethod: tx.method,
            requestedPoints: tx.amount || 0,
            proofOfPayment: tx.proof_url,
            status: tx.status,
            referenceNo: tx.ref_no,
            accountNumber: tx.account_number || 'N/A',
            date: tx.date,
            createdAt: tx.created_at,
            rejectionReason: tx.rejection_reason || 'N/A',
          };
        })
      );

      setData(enrichedData);
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      setError('An error occurred while loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (row, type) => {
    setSelectedRow(row);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedRow(null);
    setModalType(null);
    setReason('');
  };

  // Close on Escape key when modal is open
  useEffect(() => {
    if (!selectedRow) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRow]);

  const handleApprove = async () => {
    try {
      setLoading(true);

      // Update transaction status to 'Approved' in Supabase
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'Approved'
        })
        .eq('id', selectedRow.transactionCode);

      if (updateError) {
        console.error('Error approving transaction:', updateError);
        alert('Failed to approve transaction: ' + updateError.message);
        setLoading(false);
        return;
      }

      setSuccessMessage('Transaction approved! Redirecting to RFID Management...');
      setShowSuccessPopup(true);
      
      await fetchTransactions(); // Refresh the list
      
      // Redirect to RFID Management after 1.5 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        closeModal();
        
        // Navigate to RFID Management with search info - FIXED PATH
        navigate('/CardManage', {  // Changed from '/rfid-management' to '/CardManage'
          state: {
            searchRFID: selectedRow.cardNumber,
            topupAmount: selectedRow.requestedPoints,
            fromApproval: true
          }
        });
      }, 1500);
      
    } catch (err) {
      console.error('Error in handleApprove:', err);
      alert('An error occurred while approving the transaction');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    try {
      setLoading(true);

      // Update transaction status to 'Rejected' in Supabase
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'Rejected',
          rejection_reason: reason
        })
        .eq('id', selectedRow.transactionCode);

      if (updateError) {
        console.error('Error rejecting transaction:', updateError);
        alert('Failed to reject transaction: ' + updateError.message);
        setLoading(false);
        return;
      }

      setSuccessMessage('Transaction rejected successfully!');
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        closeModal();
      }, 2000);
      await fetchTransactions(); // Refresh the list
    } catch (err) {
      console.error('Error in handleReject:', err);
      alert('An error occurred while rejecting the transaction');
      setLoading(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <>
        <TopBar />
        <Sidebar />
        <div className="topup-page-container">
          <h1 className="page-title">Topup Management</h1>
          <p>Loading transactions...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <Sidebar />
        <div className="topup-page-container">
          <h1 className="page-title">Topup Management</h1>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Sidebar />
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <div className="success-icon">✅</div>
            <div className="success-message">
              <div className="success-title">{successMessage}</div>
            </div>
            <button className="success-close" onClick={() => setShowSuccessPopup(false)}>×</button>
          </div>
        </div>
      )}
      <div className="topup-page-container">
        <div className="page-header">
          <h1 className="page-title">Topup Management</h1>
          <button 
            className="refresh-btn" 
            onClick={fetchTransactions}
            disabled={loading}
            title="Refresh transactions"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={loading ? 'spinning' : ''}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>

        {/* Tabs for filtering transactions */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            Pending
          </button>
          <button 
            className={`tab-btn ${activeTab === 'Approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('Approved')}
          >
            Approved
          </button>
          <button 
            className={`tab-btn ${activeTab === 'Rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('Rejected')}
          >
            Rejected
          </button>
        </div>

        {data.length === 0 ? (
          <p>No {activeTab.toLowerCase()} transactions.</p>
        ) : (
          <div className="topup-table-wrapper">
          <table className="topup-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Card Number</th>
                <th>Payment Method</th>
                <th>Account Number</th>
                <th>Reference Number</th>
                <th>Requested Points</th>
                <th>Date</th>
                <th>Proof</th>
                <th>Status</th>
                {activeTab === 'Rejected' && <th>Rejection Reason</th>}
                {activeTab === 'Pending' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.transactionCode}>
                  <td>{row.email}</td>
                  <td>{row.cardNumber}</td>
                  <td>{row.paymentMethod}</td>
                  <td>{row.accountNumber}</td>
                  <td>{row.referenceNo}</td>
                  <td>{row.requestedPoints}</td>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>
                    {row.proofOfPayment ? (
                      <a 
                        href={row.proofOfPayment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="proof-link"
                      >
                        View
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        row.status === 'Approved'
                          ? 'status-approved'
                          : row.status === 'Rejected'
                          ? 'status-rejected'
                          : 'status-pending'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  {activeTab === 'Rejected' && <td>{row.rejectionReason}</td>}
                  {activeTab === 'Pending' && (
                    <td className="action-cell">
                      <button
                        className="approve-btn"
                        onClick={() => handleActionClick(row, 'approve')}
                        disabled={loading}
                        title="Approve"
                      >
                        ✔
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleActionClick(row, 'reject')}
                        disabled={loading}
                        title="Reject"
                      >
                        ✖
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {selectedRow && modalType === 'approve' && (
          <div 
            className="topup-modal-overlay"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-approve-title"
          >
            <div className="topup-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="topup-modal-header">
                <h2 id="topup-approve-title">Topup Conversion Approval</h2>
                <button 
                  className="topup-modal-close" 
                  onClick={closeModal} 
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="topup-modal-content">
                <p><strong>Email:</strong> {selectedRow.email}</p>
                <p><strong>User ID:</strong> {selectedRow.user_id}</p>
                <p><strong>Transaction Code:</strong> {selectedRow.transactionCode}</p>
                <p><strong>Card Number:</strong> {selectedRow.cardNumber}</p>
                <p><strong>Payment Method:</strong> {selectedRow.paymentMethod}</p>
                <p><strong>Account Number:</strong> {selectedRow.accountNumber}</p>
                <p><strong>Reference Number:</strong> {selectedRow.referenceNo}</p>
                <p><strong>Requested Points:</strong> {selectedRow.requestedPoints} points</p>
                <p><strong>Date:</strong> {new Date(selectedRow.date).toLocaleString()}</p>
                {selectedRow.proofOfPayment && (
                  <p>
                    <strong>Proof of Payment:</strong>{' '}
                    <a href={selectedRow.proofOfPayment} target="_blank" rel="noopener noreferrer">
                      View Image
                    </a>
                  </p>
                )}
              </div>
              
              <div className="topup-modal-actions">
                <button
                  className="topup-confirm-btn"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Approve'}
                </button>
                <button className="topup-cancel-btn" onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRow && modalType === 'reject' && (
          <div 
            className="topup-modal-overlay"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-reject-title"
          >
            <div className="topup-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="topup-modal-header">
                <h2 id="topup-reject-title">Topup Conversion Rejection</h2>
                <button 
                  className="topup-modal-close" 
                  onClick={closeModal} 
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="topup-modal-content">
                <p><strong>Email:</strong> {selectedRow.email}</p>
                <p><strong>User ID:</strong> {selectedRow.user_id}</p>
                <p><strong>Transaction Code:</strong> {selectedRow.transactionCode}</p>
                <p><strong>Card Number:</strong> {selectedRow.cardNumber}</p>
                <p><strong>Payment Method:</strong> {selectedRow.paymentMethod}</p>
                <p><strong>Account Number:</strong> {selectedRow.accountNumber}</p>
                <p><strong>Reference Number:</strong> {selectedRow.referenceNo}</p>
                <p><strong>Requested Points:</strong> {selectedRow.requestedPoints} points</p>
                <p><strong>Date:</strong> {new Date(selectedRow.date).toLocaleString()}</p>
                {selectedRow.proofOfPayment && (
                  <p>
                    <strong>Proof of Payment:</strong>{' '}
                    <a href={selectedRow.proofOfPayment} target="_blank" rel="noopener noreferrer">
                      View Image
                    </a>
                  </p>
                )}

                <textarea
                  className="topup-reason-input"
                  placeholder="Enter reason for rejection..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="topup-modal-actions">
                <button
                  className="topup-confirm-btn"
                  onClick={handleReject}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Reject'}
                </button>
                <button className="topup-cancel-btn" onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TopupManagement;