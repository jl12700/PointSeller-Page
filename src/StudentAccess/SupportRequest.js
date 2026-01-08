import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Send, Loader, Eye, Clock } from 'lucide-react';
import '../Styles/supportuser.css';
import { fetchUserSupportRequests, createSupportRequest } from '../services/supportService';
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const SupportRequest = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'General',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [supportRequests, setSupportRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        console.log('✅ Firebase user logged in:', user.uid);
      } else {
        console.log('ℹ️ No Firebase user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSupportRequests();
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const fetchSupportRequests = async () => {
    try {
      setFetchingRequests(true);
      const requests = await fetchUserSupportRequests();
      const formattedRequests = requests.map(req => ({
        id: req.id,
        subject: req.subject,
        category: req.category,
        status: req.status,
        message: req.message,
        solution: req.solution || null,
        date: req.created_at.split('T')[0],
        resolvedDate: req.resolved_at ? req.resolved_at.split('T')[0] : null,
      }));
      setSupportRequests(formattedRequests);
    } catch (error) {
      console.error('Fetch error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load support requests.',
      });
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    try {
      const newRequest = await createSupportRequest(formData);
      
      setNotification({
        type: 'success',
        message: `Support request submitted successfully! Ticket ID: ${newRequest.id.slice(0, 8).toUpperCase()}`,
      });

      setFormData({
        subject: '',
        category: 'General',
        message: '',
      });

      setTimeout(() => {
        fetchSupportRequests();
      }, 1000);
    } catch (error) {
      console.error('Submit error:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to submit support request.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  const handleViewSolution = (request) => {
    setSelectedRequest(request);
    
    if (request.status === 'Pending' || request.status === 'In Progress') {
      setShowPendingModal(true);
    } else {
      setShowSolutionModal(true);
    }
  };

  const closeSolutionModal = () => {
    setShowSolutionModal(false);
    setSelectedRequest(null);
  };

  const closePendingModal = () => {
    setShowPendingModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className="srp-main-container">
      <TopBar />
      <StudentSidebar />
      <div className="srp-content-wrapper">
        {/* Header */}
        <div className="srp-page-header">
          <h1 className="srp-page-title">Support Center</h1>
          <p className="srp-page-subtitle">
            Submit your concerns or issues and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`srp-notification-banner srp-notification-${notification.type}`}>
            <div className="srp-notification-icon-wrapper">
              {notification.type === 'success' ? (
                <CheckCircle />
              ) : notification.type === 'info' ? (
                <Clock />
              ) : (
                <AlertCircle />
              )}
            </div>
            <p className="srp-notification-message">{notification.message}</p>
          </div>
        )}

        {/* Support Request Form */}
        <div className="srp-form-container">
          <h2 className="srp-form-heading">Submit a Support Request</h2>

          <div>
            {/* Category */}
            <div className="srp-input-group">
              <label className="srp-input-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="srp-select-input"
              >
                <option value="General">General Inquiry</option>
                <option value="Lost Card">Lost Card</option>
                <option value="Transaction Issue">Transaction Issue</option>
                <option value="Account Problem">Account Problem</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Billing">Billing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Subject */}
            <div className="srp-input-group">
              <label className="srp-input-label">
                Subject <span className="srp-required-mark">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your issue"
                maxLength="100"
                className="srp-text-input"
              />
              <p className="srp-char-counter">
                {formData.subject.length}/100 characters
              </p>
            </div>

            {/* Message */}
            <div className="srp-input-group">
              <label className="srp-input-label">
                Message <span className="srp-required-mark">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Please provide detailed information about your issue..."
                maxLength="1000"
                rows="5"
                className="srp-textarea-input"
              />
              <p className="srp-char-counter">
                {formData.message.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="srp-submit-button"
            >
              {loading ? (
                <>
                  <Loader className="srp-button-icon srp-spin-animation" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="srp-button-icon" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* Previous Support Requests */}
        <div className="srp-requests-container">
          <h2 className="srp-requests-heading">Your Support Requests</h2>

          {fetchingRequests ? (
            <div className="srp-loading-wrapper">
              <Loader className="srp-loading-spinner" />
            </div>
          ) : supportRequests.length === 0 ? (
            <p className="srp-empty-message">
              {isAuthenticated 
                ? "No support requests yet. Submit your first request above."
                : "Please log in to view your support requests."}
            </p>
          ) : (
            <div className="srp-table-scroll-wrapper">
              <table className="srp-data-table">
                <thead className="srp-table-head">
                  <tr>
                    <th className="srp-table-head-cell">Ticket ID</th>
                    <th className="srp-table-head-cell">Subject</th>
                    <th className="srp-table-head-cell">Category</th>
                    <th className="srp-table-head-cell">Status</th>
                    <th className="srp-table-head-cell">Date Submitted</th>
                    <th className="srp-table-head-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supportRequests.map((request) => (
                    <tr key={request.id} className="srp-table-body-row">
                      <td className="srp-table-body-cell srp-cell-ticket-id">
                        {request.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="srp-table-body-cell srp-cell-subject-text">
                        {request.subject}
                      </td>
                      <td className="srp-table-body-cell srp-cell-category-text">
                        {request.category}
                      </td>
                      <td className="srp-table-body-cell">
                        <span
                          className={`srp-status-indicator ${
                            request.status === 'Resolved'
                              ? 'srp-status-resolved'
                              : request.status === 'Pending'
                              ? 'srp-status-pending'
                              : request.status === 'In Progress'
                              ? 'srp-status-in-progress'
                              : 'srp-status-closed'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="srp-table-body-cell srp-cell-date-text">
                        {new Date(request.date).toLocaleDateString()}
                      </td>
                      <td className="srp-table-body-cell">
                        <button
                          onClick={() => handleViewSolution(request)}
                          className="srp-view-solution-btn"
                        >
                          <Eye size={16} />
                          View Solution
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Solution Modal */}
        {showSolutionModal && selectedRequest && (
          <div className="srp-modal-backdrop" onClick={closeSolutionModal}>
            <div className="srp-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="srp-modal-header-section">
                <h3 className="srp-modal-header-title">Support Request Solution</h3>
                <button onClick={closeSolutionModal} className="srp-modal-close-btn">×</button>
              </div>

              <div className="srp-modal-body-section">
                <div className="srp-detail-info-row">
                  <span className="srp-detail-info-label">Ticket ID:</span>
                  <span className="srp-detail-info-value">{selectedRequest.id.slice(0, 8).toUpperCase()}</span>
                </div>

                <div className="srp-detail-info-row">
                  <span className="srp-detail-info-label">Subject:</span>
                  <span className="srp-detail-info-value">{selectedRequest.subject}</span>
                </div>

                <div className="srp-detail-info-row">
                  <span className="srp-detail-info-label">Category:</span>
                  <span className="srp-detail-info-value">{selectedRequest.category}</span>
                </div>

                <div className="srp-detail-info-row">
                  <span className="srp-detail-info-label">Status:</span>
                  <span className={`srp-status-indicator ${
                    selectedRequest.status === 'Resolved'
                      ? 'srp-status-resolved'
                      : 'srp-status-pending'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="srp-detail-info-row">
                  <span className="srp-detail-info-label">Submitted:</span>
                  <span className="srp-detail-info-value">
                    {new Date(selectedRequest.date).toLocaleDateString()}
                  </span>
                </div>

                {selectedRequest.resolvedDate && (
                  <div className="srp-detail-info-row">
                    <span className="srp-detail-info-label">Resolved:</span>
                    <span className="srp-detail-info-value">
                      {new Date(selectedRequest.resolvedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="srp-message-section">
                  <h4 className="srp-section-subtitle">Your Issue:</h4>
                  <div className="srp-message-content-box">{selectedRequest.message}</div>
                </div>

                <div className="srp-response-section">
                  <h4 className="srp-section-subtitle">Admin Response:</h4>
                  <div className="srp-response-content-box">
                    {selectedRequest.solution || 'No solution provided yet.'}
                  </div>
                </div>
              </div>

              <div className="srp-modal-footer-section">
                <button onClick={closeSolutionModal} className="srp-modal-action-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending State Modal */}
        {showPendingModal && (
          <div className="srp-modal-backdrop" onClick={closePendingModal}>
            <div className="srp-pending-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="srp-pending-body-section">
                <div className="srp-pending-icon-container">
                  <Clock className="srp-pending-clock-icon" />
                </div>
                <h3 className="srp-pending-title-text">Request In Progress</h3>
                <p className="srp-pending-description-text">
                  Please wait for admin response. Your request is being processed.
                </p>
                <button onClick={closePendingModal} className="srp-pending-confirm-btn">
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportRequest;