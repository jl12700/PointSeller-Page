import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, Loader, X, History } from 'lucide-react';
import { supabase } from '../Supabase/supabaseClient';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import '../Styles/admin-support.css';

const AdminSupportDashboard = () => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [solutionMessage, setSolutionMessage] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'Pending', sortBy: 'date', view: 'active' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
        console.log('✅ Admin authenticated:', user.email);
      } else {
        setIsAdmin(false);
        console.log('ℹ️ No admin user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAllSupportRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching support requests...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('support_requests')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Filter based on view type
      if (filters.view === 'active') {
        query = query.in('status', ['Pending', 'In Progress']);
      } else if (filters.view === 'history') {
        query = query.eq('status', 'Resolved');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      console.log('✅ Support requests fetched:', data?.length || 0, 'records');
      setSupportRequests(data || []);
    } catch (error) {
      console.error('❌ Error fetching requests:', error.message);
      setNotification({
        type: 'error',
        message: 'Failed to load support requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllSupportRequests();
    }
  }, [isAdmin, filters.view]);

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      console.log(`📝 Updating status to ${newStatus} for request ${requestId}`);

      const { data, error } = await supabase
        .from('support_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Status updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error updating status:', error.message);
      throw error;
    }
  };

  const submitSolution = async (requestId, solution) => {
    try {
      console.log(`📝 Submitting solution for request ${requestId}`);

      const { data, error } = await supabase
        .from('support_requests')
        .update({ 
          solution: solution,
          status: 'Resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Solution submitted successfully');
      return data;
    } catch (error) {
      console.error('❌ Error submitting solution:', error.message);
      throw error;
    }
  };

  const getFilteredAndSortedRequests = () => {
    let filtered = supportRequests;

    if (filters.status !== 'All') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sortBy === 'status') {
      const statusOrder = { Pending: 0, 'In Progress': 1, Resolved: 2 };
      filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }

    return filtered;
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setSolutionMessage(request.solution || '');
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setResponseLoading(true);

      await updateRequestStatus(selectedRequest.id, newStatus);

      setSupportRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id ? { ...req, status: newStatus } : req
        )
      );

      setSelectedRequest(prev => ({ ...prev, status: newStatus }));

      setNotification({
        type: 'success',
        message: `Status updated to "${newStatus}" successfully!`,
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to update status.',
      });
    } finally {
      setResponseLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSubmitSolution = async () => {
    if (!solutionMessage.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter a solution before submitting.',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setResponseLoading(true);

      await submitSolution(selectedRequest.id, solutionMessage);

      setSupportRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id 
            ? { ...req, solution: solutionMessage, status: 'Resolved', resolved_at: new Date().toISOString() } 
            : req
        )
      );

      setNotification({
        type: 'success',
        message: 'Solution submitted successfully! Status changed to Resolved.',
      });

      setSelectedRequest(null);
      setSolutionMessage('');
      
      // Refresh the list
      setTimeout(() => {
        fetchAllSupportRequests();
      }, 1000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to submit solution.',
      });
    } finally {
      setResponseLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <TopBar />
        <Sidebar />
        <div className="main-content">
          <div className="auth-error">
            <AlertCircle size={48} />
            <h2>Access Denied</h2>
            <p>You must be logged in as an admin to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredRequests = getFilteredAndSortedRequests();

  return (
    <div>
      <TopBar />
      <Sidebar />
      <div className="main-content">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Support Requests Management</h1>
            <p className="admin-subtitle">Manage and respond to user support requests (Last 30 days)</p>
          </div>
          <div className="admin-stats">
            <div className="stat-box">
              <span className="stat-label">Total</span>
              <span className="stat-value">{supportRequests.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Pending</span>
              <span className="stat-value pending-count">
                {supportRequests.filter(r => r.status === 'Pending').length}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Resolved</span>
              <span className="stat-value resolved-count">
                {supportRequests.filter(r => r.status === 'Resolved').length}
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${filters.view === 'active' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, view: 'active', status: 'Pending' })}
          >
            Active Requests
          </button>
          <button
            className={`view-tab ${filters.view === 'history' ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, view: 'history', status: 'All' })}
          >
            <History size={16} />
            Request History
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`notification notification-enter notification-${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="notification-icon" />
            ) : (
              <AlertCircle size={20} className="notification-icon" />
            )}
            <p className="notification-text">{notification.message}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by email, subject, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            {filters.view === 'active' && (
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-select"
              >
                <option value="All">All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
              </select>
            )}

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="filter-select"
            >
              <option value="date">Sort by Date (Newest)</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-container">
              <Loader size={40} className="loading-spinner spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="empty-state">
              {searchQuery 
                ? 'No requests match your search.' 
                : filters.view === 'history' 
                  ? 'No resolved requests found.' 
                  : 'No pending support requests found.'}
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr className="table-header">
                    <th className="table-header-cell">Ticket ID</th>
                    <th className="table-header-cell">User Email</th>
                    <th className="table-header-cell">Subject</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Date Submitted</th>
                    {filters.view === 'history' && (
                      <th className="table-header-cell">Date Resolved</th>
                    )}
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="table-cell"><span className="ticket-id">{request.id.slice(0, 8).toUpperCase()}</span></td>
                      <td className="table-cell">{request.user_email}</td>
                      <td className="table-cell table-cell-subject">{request.subject}</td>
                      <td className="table-cell">{request.category}</td>
                      <td className="table-cell">
                        <span className={`status-badge status-${request.status.toLowerCase().replace(' ', '-')}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="table-cell">{new Date(request.created_at).toLocaleDateString()}</td>
                      {filters.view === 'history' && (
                        <td className="table-cell">
                          {request.resolved_at ? new Date(request.resolved_at).toLocaleDateString() : '-'}
                        </td>
                      )}
                      <td className="table-cell">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="action-btn"
                        >
                          <Eye size={16} />
                          {filters.view === 'history' ? 'View Details' : 'Respond'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedRequest && (
          <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {filters.view === 'history' ? 'Request Details' : 'Support Request Details'}
                </h2>
                <button onClick={() => setSelectedRequest(null)} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                {/* Request Details */}
                <div className="details-grid">
                  <div className="detail-group">
                    <label className="detail-label">Ticket ID</label>
                    <p className="admin-detail-value">{selectedRequest.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="detail-group">
                    <label className="detail-label">User Email</label>
                    <p className="admin-detail-value">{selectedRequest.user_email}</p>
                  </div>
                  <div className="detail-group">
                    <label className="detail-label">Status</label>
                    <p className="admin-detail-value">{selectedRequest.status}</p>
                  </div>
                  <div className="detail-group">
                    <label className="detail-label">Category</label>
                    <p className="admin-detail-value">{selectedRequest.category}</p>
                  </div>
                  <div className="detail-group">
                    <label className="detail-label">Date Submitted</label>
                    <p className="admin-detail-value">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                  {selectedRequest.resolved_at && (
                    <div className="detail-group">
                      <label className="detail-label">Date Resolved</label>
                      <p className="admin-detail-value">{new Date(selectedRequest.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Subject and Message */}
                <div className="message-section">
                  <div className="detail-group">
                    <label className="detail-label">Subject</label>
                    <p className="admin-detail-value">{selectedRequest.subject}</p>
                  </div>
                  <div className="detail-group">
                    <label className="detail-label">User's Message</label>
                    <div className="message-box">{selectedRequest.message}</div>
                  </div>
                </div>

                {/* Solution Section - Only show for active requests OR if viewing history */}
                {filters.view === 'history' && selectedRequest.solution ? (
                  <div className="solution-display-section">
                    <h3 className="response-title">Admin Solution</h3>
                    <div className="solution-display-box">{selectedRequest.solution}</div>
                  </div>
                ) : filters.view === 'active' && (
                  <>
                    {/* Response Section */}
                    <div className="response-section">
                      <h3 className="response-title">Provide Solution</h3>
                      <p className="response-section-text">
                        Enter your solution or response to the user's support request.
                      </p>
                      <textarea
                        value={solutionMessage}
                        onChange={(e) => setSolutionMessage(e.target.value)}
                        placeholder="Type your solution here..."
                        className="solution-textarea"
                        rows="6"
                      />
                      <button
                        onClick={handleSubmitSolution}
                        disabled={responseLoading || !solutionMessage.trim()}
                        className="submit-solution-btn"
                      >
                        {responseLoading ? (
                          <>
                            <Loader size={16} className="spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Solution & Mark as Resolved'
                        )}
                      </button>
                    </div>

                    {/* Status Update Buttons */}
                    <div className="status-buttons-group">
                      <p className="status-label">Or Update Status Only:</p>
                      <div className="status-buttons">
                        {['Pending', 'In Progress'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(status)}
                            disabled={responseLoading || selectedRequest.status === status}
                            className={`status-update-btn ${selectedRequest.status === status ? 'active' : ''}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportDashboard;