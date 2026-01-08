import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaSpinner,
  FaExclamationTriangle,
  FaHistory,
  FaArchive,
  FaChartLine,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import '../Styles/CashConversion.css';
import { posDb } from '../firebase/firebase';

const CashConversion = () => {
  const [requests, setRequests] = useState([]);
  const [archivedRequests, setArchivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeView, setActiveView] = useState('active'); // 'active' or 'history'
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'declined'
  const [historyLoading, setHistoryLoading] = useState(false);

  // ============================
  // Fetch Active Conversion Requests
  // ============================
  useEffect(() => {
    if (!posDb) {
      console.error('❌ Firebase database (posDb) is not configured.');
      setError('Firebase database not configured. Please check your firebase setup.');
      setLoading(false);
      return;
    }

    console.log('✅ Firebase database connected. Setting up listener...');

    try {
      const requestsRef = collection(posDb, 'conversions');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log(`📊 Fetched ${snapshot.docs.length} conversion requests`);
          
          const requestsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Separate requests by status
          const pendingRequests = requestsData.filter(
            req => req.requestStatus === 'Pending' || req.requestStatus === 'pending'
          );
          const approvedRequests = requestsData.filter(
            req => req.requestStatus === 'Approved'
          );
          const declinedRequests = requestsData.filter(
            req => req.requestStatus === 'Declined'
          );

          // Check and archive each status independently if they reach 100
          
          // Archive oldest pending requests if count >= 100
          if (pendingRequests.length >= 100) {
            console.log(`🔄 Pending requests (${pendingRequests.length}) reached threshold. Archiving oldest...`);
            
            const sortedPending = [...pendingRequests].sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateA - dateB;
            });
            
            const numToArchive = pendingRequests.length - 100;
            const toArchive = sortedPending.slice(0, numToArchive);
            
            for (const request of toArchive) {
              console.log(`📦 Archiving oldest pending request ${request.id}`);
              await archiveRequest(request, 'Pending requests reached 100 items');
            }
          }

          // Archive oldest approved requests if count >= 100
          if (approvedRequests.length >= 100) {
            console.log(`🔄 Approved requests (${approvedRequests.length}) reached threshold. Archiving oldest...`);
            
            const sortedApproved = [...approvedRequests].sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateA - dateB;
            });
            
            const numToArchive = approvedRequests.length - 100;
            const toArchive = sortedApproved.slice(0, numToArchive);
            
            for (const request of toArchive) {
              console.log(`📦 Archiving oldest approved request ${request.id}`);
              await archiveRequest(request, 'Approved requests reached 100 items');
            }
          }

          // Archive oldest declined requests if count >= 100
          if (declinedRequests.length >= 100) {
            console.log(`🔄 Declined requests (${declinedRequests.length}) reached threshold. Archiving oldest...`);
            
            const sortedDeclined = [...declinedRequests].sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateA - dateB;
            });
            
            const numToArchive = declinedRequests.length - 100;
            const toArchive = sortedDeclined.slice(0, numToArchive);
            
            for (const request of toArchive) {
              console.log(`📦 Archiving oldest declined request ${request.id}`);
              await archiveRequest(request, 'Declined requests reached 100 items');
            }
          }
          
          setRequests(requestsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error fetching requests:', err);
          setError(`Failed to load conversion requests: ${err.message}`);
          setLoading(false);
        }
      );

      return () => {
        console.log('🛑 Cleaning up Firebase listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up Firebase listener:', err);
      setError(`Setup error: ${err.message}`);
      setLoading(false);
    }
  }, []);

  // ============================
  // Fetch Archived Requests (Request History)
  // ============================
  const fetchArchivedRequests = async () => {
    if (!posDb) {
      console.error('❌ Firebase not configured, cannot fetch archive');
      return;
    }
    
    setHistoryLoading(true);
    console.log('📂 Fetching archived requests...');
    
    try {
      const archiveRef = collection(posDb, 'conversions_archive');
      const q = query(archiveRef, orderBy('archivedAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const archivedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Fetched ${archivedData.length} archived requests`);
      setArchivedRequests(archivedData);
    } catch (err) {
      console.error('❌ Error fetching archived requests:', err);
      setArchivedRequests([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load archived requests when switching to history view
  useEffect(() => {
    if (activeView === 'history') {
      fetchArchivedRequests();
    }
  }, [activeView]);

  // ============================
  // Auto-Archive Function
  // ============================
  const archiveRequest = async (request, reason = 'Auto-archived') => {
    if (!posDb) {
      console.error('❌ Cannot archive: Firebase not configured');
      return;
    }

    try {
      console.log(`📦 Archiving request: ${request.id}`);
      
      const archiveRef = collection(posDb, 'conversions_archive');
      
      await addDoc(archiveRef, {
        ...request,
        archivedAt: new Date(),
        archiveReason: reason
      });
      
      console.log('✅ Added to archive collection');
      
      const requestRef = doc(posDb, 'conversions', request.id);
      await deleteDoc(requestRef);
      
      console.log(`✅ Request ${request.id} archived successfully`);
    } catch (err) {
      console.error('❌ Error archiving request:', err);
    }
  };

  // ============================
  // Format Date & Time
  // ============================
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleDateString('en-US', options);
  };

  // ============================
  // Handle Approve
  // ============================
  const handleApprove = async (request) => {
    if (!posDb) {
      alert('Error: Firebase not configured');
      return;
    }

    setProcessingId(request.id);
    console.log(`✓ Approving request ${request.id}`);
    
    try {
      const requestRef = doc(posDb, 'conversions', request.id);
      await updateDoc(requestRef, {
        requestStatus: 'Approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Request status updated to Approved');

      if (!request.vendorId) {
        throw new Error('Vendor ID not found in request. Please update conversion request to include vendorId.');
      }

      const vendorRef = doc(posDb, 'vendors', request.vendorId);
      console.log(`🔍 Looking for vendor with ID: ${request.vendorId}`);
      
      const vendorDoc = await getDoc(vendorRef);

      if (!vendorDoc.exists()) {
        console.error(`❌ Vendor not found with ID: ${request.vendorId}`);
        throw new Error(`Vendor not found (ID: ${request.vendorId})`);
      }

      const vendorData = vendorDoc.data();
      console.log('📄 Vendor data:', vendorData);
      
      const currentPoints = vendorData.points || 0;
      const requestedPoints = request.conversionAmount || 0;

      console.log(`💰 Current points: ${currentPoints}, Requested: ${requestedPoints}`);

      if (currentPoints < requestedPoints) {
        throw new Error(`Insufficient points. Available: ${currentPoints}, Requested: ${requestedPoints}`);
      }

      await updateDoc(vendorRef, {
        points: currentPoints - requestedPoints,
        updatedAt: new Date()
      });

      console.log(`✅ Deducted ${requestedPoints} points from vendor ${request.businessName || request.vendorName || request.vendorId}`);
      alert(`✓ Request approved! ${requestedPoints} points deducted from ${request.businessName || request.vendorName || 'vendor'}`);
    } catch (err) {
      console.error('❌ Error approving request:', err);
      alert(`✗ Error: ${err.message}`);
    } finally {
      setProcessingId(null);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  // ============================
  // Handle Decline
  // ============================
  const handleDecline = async (request) => {
    if (!posDb) {
      alert('Error: Firebase not configured');
      return;
    }

    setProcessingId(request.id);
    console.log(`✗ Declining request ${request.id}`);

    try {
      const requestRef = doc(posDb, 'conversions', request.id);
      await updateDoc(requestRef, {
        requestStatus: 'Declined',
        declinedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Request declined successfully');
      alert('✓ Request declined successfully');
    } catch (err) {
      console.error('❌ Error declining request:', err);
      alert(`✗ Error: ${err.message}`);
    } finally {
      setProcessingId(null);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  // ============================
  // Confirm Modal
  // ============================
  const openConfirmModal = (action, request) => {
    setConfirmAction({ action, request });
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    if (!confirmAction) return;

    if (confirmAction.action === 'approve') {
      handleApprove(confirmAction.request);
    } else if (confirmAction.action === 'decline') {
      handleDecline(confirmAction.request);
    }
  };

  // ============================
  // Status Badge Component
  // ============================
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'Pending',
      Pending: 'Pending',
      Approved: 'Approved',
      Declined: 'Declined'
    };

    const normalizedStatus = statusMap[status] || 'Pending';
    const statusClass = normalizedStatus.toLowerCase();

    const icons = {
      Pending: <FaClock />,
      Approved: <FaCheckCircle />,
      Declined: <FaTimesCircle />
    };

    return (
      <span className={`cc-status-badge cc-status-${statusClass}`}>
        {icons[normalizedStatus]}
        {normalizedStatus}
      </span>
    );
  };

  // Filter requests based on active tab (only for active view)
  const filteredRequests = activeView === 'active' 
    ? requests.filter(req => {
        if (activeTab === 'pending') {
          return req.requestStatus === 'Pending' || req.requestStatus === 'pending';
        } else if (activeTab === 'approved') {
          return req.requestStatus === 'Approved';
        } else if (activeTab === 'declined') {
          return req.requestStatus === 'Declined';
        }
        return false;
      })
    : [];

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.requestStatus === 'Pending' || r.requestStatus === 'pending').length,
    approved: requests.filter(r => r.requestStatus === 'Approved').length,
    declined: requests.filter(r => r.requestStatus === 'Declined').length
  };

  // ============================
  // Loading State
  // ============================
  if (loading) {
    return (
      <>
        <Sidebar />
        <TopBar />
        <div className="cc-main-content">
          <div className="cc-loading-state">
            <div className="cc-loading-content">
              <FaSpinner className="cc-spinner" />
              <p className="cc-loading-text">Loading conversion requests...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================
  // Error State
  // ============================
  if (error) {
    return (
      <>
        <Sidebar />
        <TopBar />
        <div className="cc-main-content">
          <div className="cc-error-state">
            <div className="cc-error-box">
              <FaExclamationTriangle className="cc-error-icon" />
              <h3 className="cc-error-title">Configuration Error</h3>
              <p className="cc-error-text">{error}</p>
              <div className="cc-error-help">
                <strong>Troubleshooting Steps:</strong>
                <ol className="cc-error-list">
                  <li>Check that your Firebase is properly initialized</li>
                  <li>Verify the <code>posDb</code> export path in your firebase config</li>
                  <li>Ensure Firebase credentials are correct</li>
                  <li>Check browser console for detailed error messages</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================
  // Main Render
  // ============================
  return (
    <>
      <Sidebar />
      <TopBar />
      
      <div className="cc-main-content">
        <div className="cc-conversion-container">
          <div className="cc-conversion-card">
            {/* Header with View Toggle */}
            <div className="cc-conversion-header">
              <div className="cc-header-content">
                <div>
                  <h1 className="cc-header-title">Cash Conversion Management</h1>
                  <p className="cc-header-subtitle">
                    {activeView === 'active' 
                      ? 'Manage vendor point-to-cash conversion requests' 
                      : 'View archived conversion history'}
                  </p>
                </div>
                
                {/* View Toggle Buttons */}
                <div className="cc-view-toggle">
                  <button
                    onClick={() => setActiveView('active')}
                    className={`cc-toggle-btn ${activeView === 'active' ? 'cc-toggle-active' : ''}`}
                  >
                    <FaChartLine className="cc-toggle-icon" />
                    Active Requests
                  </button>
                  <button
                    onClick={() => setActiveView('history')}
                    className={`cc-toggle-btn ${activeView === 'history' ? 'cc-toggle-active' : ''}`}
                  >
                    <FaHistory className="cc-toggle-icon" />
                    Request History
                  </button>
                </div>
              </div>
            </div>

            {/* ============================
                ACTIVE REQUESTS VIEW WITH TABS
                ============================ */}
            {activeView === 'active' && (
              <>
                {/* Tab Navigation */}
                <div className="cc-tab-navigation">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`cc-tab-btn ${activeTab === 'pending' ? 'cc-tab-active cc-tab-pending' : ''}`}
                  >
                    <FaClock className="cc-tab-icon" />
                    Pending ({stats.pending})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('approved')}
                    className={`cc-tab-btn ${activeTab === 'approved' ? 'cc-tab-active cc-tab-approved' : ''}`}
                  >
                    <FaThumbsUp className="cc-tab-icon" />
                    Approved ({stats.approved})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('declined')}
                    className={`cc-tab-btn ${activeTab === 'declined' ? 'cc-tab-active cc-tab-declined' : ''}`}
                  >
                    <FaThumbsDown className="cc-tab-icon" />
                    Declined ({stats.declined})
                  </button>
                </div>

                <div className="cc-conversion-table-wrapper">
                  {filteredRequests.length === 0 ? (
                    <div className="cc-empty-state">
                      <FaClock className="cc-empty-icon" />
                      <p className="cc-empty-text">No {activeTab} requests</p>
                    </div>
                  ) : (
                    <table className="cc-conversion-table">
                      <thead>
                        <tr>
                          <th>Business Name</th>
                          <th>Vendor Email</th>
                          <th>Payment Method</th>
                          <th>GCash Number</th>
                          <th>Points Balance</th>
                          <th>Conversion Amount</th>
                          <th>Transaction Code</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                          {activeTab === 'pending' && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="cc-vendor-name">
                                {request.businessName || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="cc-payment-method">
                                {request.vendorName || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="cc-payment-method">
                                {request.paymentMethod === 'paytap' ? 'PayTap (GCash)' : request.paymentMethod === 'cash' ? 'Cash' : request.paymentMethod || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="cc-gcash-number">
                                {request.gcashNumber || request.cardNumber ? (
                                  <span className="cc-gcash-display">
                                    {request.gcashNumber || request.cardNumber}
                                  </span>
                                ) : (
                                  <span className="cc-gcash-na">N/A</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="cc-points-amount">
                                {request.pointBalance || 0} pts
                              </div>
                            </td>
                            <td>
                              <div className="cc-points-amount cc-conversion-highlight">
                                {request.conversionAmount || 0} pts
                              </div>
                            </td>
                            <td>
                              <div className="cc-transaction-code">
                                {request.transactionCode || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="cc-date-time">
                                {formatDateTime(request.createdAt)}
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(request.requestStatus)}
                            </td>
                            {activeTab === 'pending' && (
                              <td>
                                <div className="cc-action-buttons">
                                  <button
                                    onClick={() => openConfirmModal('approve', request)}
                                    disabled={processingId === request.id}
                                    className="cc-btn-approve"
                                  >
                                    {processingId === request.id ? (
                                      <FaSpinner className="cc-spinner" />
                                    ) : (
                                      <FaCheckCircle />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openConfirmModal('decline', request)}
                                    disabled={processingId === request.id}
                                    className="cc-btn-decline"
                                  >
                                    <FaTimesCircle />
                                    Decline
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Stats Footer with Individual Warnings */}
                <div className="cc-stats-footer">
                  <div className="cc-stats-content">
                    <span>Total Requests: {stats.total}</span>
                    <div className="cc-stats-right">
                      <span className={stats.pending >= 90 ? 'cc-stat-warning' : ''}>
                        Pending: {stats.pending}/100
                        {stats.pending >= 90 && ` (${100 - stats.pending} until archive)`}
                      </span>
                      <span className={stats.approved >= 90 ? 'cc-stat-warning' : ''}>
                        Approved: {stats.approved}/100
                        {stats.approved >= 90 && ` (${100 - stats.approved} until archive)`}
                      </span>
                      <span className={stats.declined >= 90 ? 'cc-stat-warning' : ''}>
                        Declined: {stats.declined}/100
                        {stats.declined >= 90 && ` (${100 - stats.declined} until archive)`}
                      </span>
                    </div>
                  </div>
                  {(stats.pending >= 90 || stats.approved >= 90 || stats.declined >= 90) && (
                    <div className="cc-archive-warning">
                      <FaExclamationTriangle />
                      <span>
                        {stats.pending >= 100 || stats.approved >= 100 || stats.declined >= 100
                          ? 'Auto-archiving oldest requests...' 
                          : 'Some categories are approaching archive threshold'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ============================
                REQUEST HISTORY VIEW (PAST TRANSACTIONS)
                ============================ */}
            {activeView === 'history' && (
              <>
                <div className="cc-history-section">
                  <div className="cc-history-header">
                    <div className="cc-history-icon-wrapper">
                      <FaArchive className="cc-history-icon" />
                    </div>
                    <div>
                      <h2 className="cc-history-title">Archived Conversions</h2>
                      <p className="cc-history-subtitle">
                        All completed conversions
                      </p>
                    </div>
                  </div>

                  {historyLoading ? (
                    <div className="cc-loading-state">
                      <FaSpinner className="cc-spinner" />
                      <p className="cc-loading-text">Loading history...</p>
                    </div>
                  ) : archivedRequests.length === 0 ? (
                    <div className="cc-empty-state">
                      <FaArchive className="cc-empty-icon" />
                      <p className="cc-empty-text">No archived requests yet</p>
                      <p className="cc-empty-subtext">
                        When any status (Pending/Approved/Declined) reaches 100 items, oldest requests of that status are automatically archived here
                      </p>
                    </div>
                  ) : (
                    <div className="cc-history-table-wrapper">
                      <table className="cc-conversion-table cc-history-table">
                        <thead>
                          <tr>
                            <th>Business Name</th>
                            <th>Vendor Email</th>
                            <th>Payment Method</th>
                            <th>GCash Number</th>
                            <th>Conversion Amount</th>
                            <th>Transaction Code</th>
                            <th>Original Date</th>
                            <th>Archived Date</th>
                            <th>Original Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedRequests.map((request) => (
                            <tr key={request.id} className="cc-archived-row">
                              <td>
                                <div className="cc-vendor-name">
                                  {request.businessName || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="cc-payment-method">
                                  {request.vendorName || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="cc-payment-method">
                                  {request.paymentMethod === 'paytap' ? 'PayTap (GCash)' : request.paymentMethod === 'cash' ? 'Cash' : request.paymentMethod || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="cc-gcash-number">
                                  {request.gcashNumber || request.cardNumber ? (
                                    <span className="cc-gcash-display">
                                      {request.gcashNumber || request.cardNumber}
                                    </span>
                                  ) : (
                                    <span className="cc-gcash-na">N/A</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="cc-points-amount cc-archived-amount">
                                  {request.conversionAmount || 0} pts
                                </div>
                              </td>
                              <td>
                                <div className="cc-transaction-code">
                                  {request.transactionCode || 'N/A'}
                                </div>
                              </td>
                              <td>
                                <div className="cc-date-time">
                                  {formatDateTime(request.createdAt)}
                                </div>
                              </td>
                              <td>
                                <div className="cc-date-time">
                                  {formatDateTime(request.archivedAt)}
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(request.requestStatus)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* History Stats */}
                  {archivedRequests.length > 0 && (
                    <div className="cc-stats-footer cc-history-stats">
                      <div className="cc-stats-content">
                        <span>Total Archived: {archivedRequests.length}</span>
                        <span>
                          Total Points Converted: {
                            archivedRequests.reduce((sum, req) => 
                              sum + (req.conversionAmount || 0), 0
                            ).toLocaleString()
                          } pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="cc-modal-overlay">
          <div className="cc-modal-content">
            <div className="cc-modal-header">
              <div className={`cc-modal-icon-wrapper ${confirmAction.action === 'approve' ? 'cc-modal-icon-approve' : 'cc-modal-icon-decline'}`}>
                {confirmAction.action === 'approve' ? (
                  <FaCheckCircle className="cc-modal-icon" />
                ) : (
                  <FaTimesCircle className="cc-modal-icon" />
                )}
              </div>
              <h3 className="cc-modal-title">
                {confirmAction.action === 'approve' ? 'Approve Request?' : 'Decline Request?'}
              </h3>
              <p className="cc-modal-description">
                {confirmAction.action === 'approve' 
                  ? `This will deduct ${confirmAction.request.conversionAmount} points from ${confirmAction.request.businessName || confirmAction.request.vendorName}`
                  : `Are you sure you want to decline this request?`
                }
              </p>
            </div>

            <div className="cc-modal-details">
              <div className="cc-detail-row">
                <span className="cc-detail-label">Business:</span>
                <span className="cc-detail-value">{confirmAction.request.businessName || 'N/A'}</span>
              </div>
              <div className="cc-detail-row">
                <span className="cc-detail-label">Vendor:</span>
                <span className="cc-detail-value">{confirmAction.request.vendorName}</span>
              </div>
              <div className="cc-detail-row">
                <span className="cc-detail-label">Payment Method:</span>
                <span className="cc-detail-value">{confirmAction.request.paymentMethod}</span>
              </div>
              {(confirmAction.request.gcashNumber || confirmAction.request.cardNumber) && (
                <div className="cc-detail-row">
                  <span className="cc-detail-label">GCash Number:</span>
                  <span className="cc-detail-value" style={{ fontFamily: 'monospace', color: '#3182ce' }}>
                    {confirmAction.request.gcashNumber || confirmAction.request.cardNumber}
                  </span>
                </div>
              )}
              <div className="cc-detail-row">
                <span className="cc-detail-label">Points to Convert:</span>
                <span className="cc-detail-value-points">{confirmAction.request.conversionAmount} pts</span>
              </div>
              <div className="cc-detail-row">
                <span className="cc-detail-label">Transaction Code:</span>
                <span className="cc-detail-value">{confirmAction.request.transactionCode}</span>
              </div>
            </div>

            <div className="cc-modal-actions">
              <button
                onClick={executeAction}
                disabled={processingId !== null}
                className={`cc-btn-confirm ${confirmAction.action === 'decline' ? 'cc-decline' : ''}`}
              >
                {processingId ? (
                  <span className="cc-processing-text">
                    <FaSpinner className="cc-spinner" />
                    Processing...
                  </span>
                ) : (
                  `Confirm ${confirmAction.action === 'approve' ? 'Approval' : 'Decline'}`
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                disabled={processingId !== null}
                className="cc-btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CashConversion;