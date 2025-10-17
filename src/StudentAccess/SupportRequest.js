import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Send, Loader } from 'lucide-react';
import '../Styles/supportuser.css';
import { fetchUserSupportRequests, createSupportRequest } from '../services/supportService';
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import { auth } from '../firebase/firebase'; // Adjust path to your Firebase
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

  useEffect(() => {
    // Listen to Firebase auth state changes
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
        date: req.created_at.split('T')[0],
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

      // Refresh the list after successful submission
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

  return (
    <div className="support-container">
      <TopBar />
      <StudentSidebar />
      <div className="support-wrapper">
        {/* Header */}
        <div className="support-header">
          <h1 className="support-title">Support Center</h1>
          <p className="support-subtitle">
            Submit your concerns or issues and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle className="notification-icon" />
            ) : (
              <AlertCircle className="notification-icon" />
            )}
            <p className="notification-text">{notification.message}</p>
          </div>
        )}

        {/* Support Request Form */}
        <div className="form-card">
          <h2 className="form-title">Submit a Support Request</h2>

          <div>
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
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
            <div className="form-group">
              <label className="form-label">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your issue"
                maxLength="100"
                className="form-input"
              />
              <p className="form-counter">
                {formData.subject.length}/100 characters
              </p>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">
                Message <span className="required">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Please provide detailed information about your issue..."
                maxLength="1000"
                rows="5"
                className="form-textarea"
              />
              <p className="form-counter">
                {formData.message.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <Loader className={`submit-btn-icon spin`} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="submit-btn-icon" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* Previous Support Requests */}
        <div className="table-card">
          <h2 className="table-title">Your Support Requests</h2>

          {fetchingRequests ? (
            <div className="loading-container">
              <Loader className="loading-spinner" />
            </div>
          ) : supportRequests.length === 0 ? (
            <p className="empty-state">
              {isAuthenticated 
                ? "No support requests yet. Submit your first request above."
                : "Please log in to view your support requests."}
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="requests-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Ticket ID</th>
                    <th className="table-header-cell">Subject</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {supportRequests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="table-cell table-cell-ticket">
                        {request.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="table-cell table-cell-subject">
                        {request.subject}
                      </td>
                      <td className="table-cell table-cell-category">
                        {request.category}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${
                            request.status === 'Resolved'
                              ? 'status-resolved'
                              : request.status === 'Pending'
                              ? 'status-pending'
                              : request.status === 'In Progress'
                              ? 'status-in-progress'
                              : 'status-closed'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="table-cell table-cell-date">
                        {new Date(request.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportRequest;