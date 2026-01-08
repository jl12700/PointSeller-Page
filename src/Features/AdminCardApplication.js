import React, { useEffect, useState } from "react";
import { supabase } from "../Supabase/supabaseClient";
import { CreditCard, Download, Eye, Mail, User, CheckCircle, Clock, XCircle, Send, Phone, Hash, BookOpen } from "lucide-react";
import { toast } from "react-toastify";
import '../Styles/VendorApplicationDisplay.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

function AdminCardApplication() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [approvedCards, setApprovedCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [activeView, setActiveView] = useState("applications");

  // Fetch all card applications
  const fetchApplications = async () => {
    setLoading(true);
    console.log('🔍 Fetching card applications with filter:', filter);
    
    try {
      let query = supabase
        .from('card_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Fetch error:', error);
        toast.error('Error loading applications: ' + error.message);
        throw error;
      }
      
      console.log('✅ Fetched card applications:', data);
      setApplications(data || []);
    } catch (error) {
      console.error("💥 Error fetching applications:", error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Approved Card Applications
  const fetchApprovedCards = async () => {
    setCardsLoading(true);
    console.log('🔍 Fetching approved card applications...');
    
    try {
      const { data, error } = await supabase
        .from('card_applications')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch approved cards error:', error);
        toast.error('Error loading approved cards: ' + error.message);
        throw error;
      }
      
      console.log('✅ Fetched approved cards:', data);
      setApprovedCards(data || []);
    } catch (error) {
      console.error("💥 Error fetching approved cards:", error);
      toast.error('Failed to load approved cards');
    } finally {
      setCardsLoading(false);
    }
  };

  // Handle email for approved card holders
  const handleCardHolderEmail = (cardHolder) => {
    const { email, full_name } = cardHolder;
    
    const subject = 'Notice from PayTap';
    const body = `Hi ${full_name},

This is an official notice from PayTap. { fill up with message of admin }.

Best regards,
PayTap Admin Team`;
    
    const encodedEmail = encodeURIComponent(email);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');
    
    toast.info('📧 Opening Gmail...', { autoClose: 2000 });
  };

  // Handle email composition for application status updates
  const handleEmail = (type, applicant) => {
    const { email, full_name, school_id_number } = applicant;
    
    let subject = '';
    let body = '';
    
    if (type === 'approved') {
      subject = 'PayTap Card Application Approved';
      body = `Hi ${full_name},

Congratulations! Your PayTap Card application has been approved. We're excited to have you as a cardholder!

Please review the details below:

🎴 *PayTap Card Details*
-------------------------------------
Student ID: ${school_id_number}
Card Fee: ₱200
-------------------------------------

Please visit our office to settle your payment and claim your PayTap Card. Our team will assist you with card activation during your visit.

📍 Office Location: RFD Office, College Lobby, 2nd Floor
🕒 Available Hours: 9:00 AM – 5:00 PM

Once payment is completed, your card will be activated and ready to use.

Best regards,
PayTap Admin Team`;
    } else if (type === 'rejected') {
      subject = 'PayTap Card Application Update';
      body = `Hi ${full_name},

Thank you for your interest in PayTap Card.

After reviewing your application, we regret to inform you that it has not been approved at this time.

Due to: 

You may reapply in the future once all requirements are met.

Sincerely,
PayTap Admin Team`;
    }
    
    const encodedEmail = encodeURIComponent(email);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');
    
    toast.info('📧 Opening Gmail...', { autoClose: 2000 });
  };

  // Update application status
  const updateStatus = async (id, newStatus) => {
    if (updating) return;

    setUpdating(true);
    console.log(`🔄 Updating application ${id} to status: ${newStatus}`);

    try {
      const { error } = await supabase
        .from('card_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Update successful.');

      setApplications(prevApps =>
        prevApps.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );

      setSelectedApp(prev => (prev ? { ...prev, status: newStatus } : prev));

      if (newStatus === 'approved' || newStatus === 'rejected') {
        const applicant = selectedApp;
        handleEmail(newStatus, applicant);
      }

      if (newStatus === 'approved') {
        toast.success('✓ Application Approved!', { autoClose: 2000 });
        fetchApprovedCards();
      } else if (newStatus === 'rejected') {
        toast.error('✗ Application Rejected', { autoClose: 2000 });
      } else {
        toast.info('⏱ Set to Pending', { autoClose: 2000 });
      }

      setTimeout(() => setSelectedApp(null), 500);
      setTimeout(() => fetchApplications(), 700);

    } catch (error) {
      console.error("💥 Error updating status:", error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  useEffect(() => {
    fetchApprovedCards();
  }, []);

  // Auto-refresh polling every 30 seconds
  useEffect(() => {
    console.log('🔄 Auto-refresh polling started (every 30 seconds)');
    
    const pollingInterval = setInterval(() => {
      console.log('⏰ Auto-refreshing data...');
      
      if (activeView === 'applications') {
        fetchApplications();
      }
      
      if (activeView === 'approved') {
        fetchApprovedCards();
      }
    }, 30000);

    return () => {
      console.log('🛑 Auto-refresh polling stopped');
      clearInterval(pollingInterval);
    };
  }, [activeView, filter]);

  useEffect(() => {
    if (!selectedApp) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedApp(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="status-icon" />;
      case 'approved': return <CheckCircle className="status-icon" />;
      case 'rejected': return <XCircle className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  return (
    <>
      <TopBar />
      <Sidebar />
      <div className="vendor-app-container">
        {/* Header */}
        <div className="vendor-app-header">
          <div className="header-content">
            <div className="header-text">
              <div>
                <h1 className="header-title">Card Application Management</h1>
                <p className="header-subtitle">Review student card applications and manage approved cardholders</p>
              </div>
              
              <div className="filter-container">
                {activeView === 'applications' ? (
                  <>
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          console.log('Filter changed to:', status);
                          setFilter(status);
                        }}
                        className={`vr-filter-btn  ${filter === status ? 'filter-active' : ''}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        console.log('Switching to Approved Cards view');
                        setActiveView('approved');
                      }}
                      className="vr-filter-btn  filter-registered"
                    >
                      Approved Cards
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Switching back to Applications view');
                      setActiveView('applications');
                    }}
                    className="vr-filter-btn filter-active"
                  >
                    Card Applications
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applications View */}
        {activeView === 'applications' && (
          <div className="vendor-app-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <CreditCard className="empty-icon" />
                <h3 className="empty-title">No Applications Found</h3>
                <p className="empty-text">There are no {filter !== 'all' ? filter : ''} card applications at the moment.</p>
              </div>
            ) : (
              <div className="applications-grid">
                <table className="vendor-applications-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Student ID</th>
                      <th>Section</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.full_name}</td>
                        <td>{app.email}</td>
                        <td>{app.school_id_number}</td>
                        <td>{app.section}</td>
                        <td>{app.contact_number}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(app.status)}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {new Date(app.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td>
                          <button
                            className="view-details-btn"
                            onClick={() => setSelectedApp(app)}
                            title="View Details"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Approved Cards View */}
        {activeView === 'approved' && (
          <div className="vendor-app-content">
            <div className="registered-vendors-header">
              <div>
                <h2 className="registered-vendors-title">Approved Cardholders</h2>
                <p className="registered-vendors-subtitle">
                  All approved PayTap Card holders ({approvedCards.length} total)
                </p>
              </div>
            </div>

            {cardsLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : approvedCards.length === 0 ? (
              <div className="empty-state">
                <CheckCircle className="empty-icon" style={{ color: '#10B981' }} />
                <h3 className="empty-title">No Approved Cards</h3>
                <p className="empty-text">There are no approved card applications yet. Approve applications to see them here.</p>
              </div>
            ) : (
              <div className="applications-grid">
                <table className="vendor-applications-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Student ID</th>
                      <th>Section</th>
                      <th>Contact</th>
                      <th>Approved Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedCards.map((card) => (
                      <tr key={card.id}>
                        <td>
                          <div className="business-name-cell">
                            <User size={16} className="business-icon" />
                            <span className="business-name-text">{card.full_name}</span>
                          </div>
                        </td>
                        <td className="email-cell">{card.email}</td>
                        <td>{card.school_id_number}</td>
                        <td>{card.section}</td>
                        <td>{card.contact_number}</td>
                        <td>
                          {new Date(card.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td>
                          <button
                            onClick={() => handleCardHolderEmail(card)}
                            className="send-email-btn"
                            title="Send Email to Cardholder"
                          >
                            <Send size={16} />
                            Send Email
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for Full Application View */}
        {selectedApp && (
          <div 
            className="vendor-modal-overlay" 
            onClick={() => setSelectedApp(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-modal-title"
          >
            <div className="vendor-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="vendor-modal-header">
                <div>
                  <h2 id="card-modal-title" className="vendor-modal-title">{selectedApp.full_name}</h2>
                  <p className="vendor-modal-subtitle">{selectedApp.school_id_number} - {selectedApp.section}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="vendor-modal-close-btn"
                  disabled={updating}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="vendor-modal-body">
                {/* Student Information */}
                <div className="section">
                  <h3 className="section-title">
                    <User className="section-icon" />
                    Student Information
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Full Name</label>
                      <p className="info-value">{selectedApp.full_name}</p>
                    </div>
                    <div className="info-item">
                      <label className="info-label">Email Address</label>
                      <p className="info-value">{selectedApp.email}</p>
                    </div>
                    <div className="info-item">
                      <label className="info-label">Student ID Number</label>
                      <p className="info-value">{selectedApp.school_id_number}</p>
                    </div>
                    <div className="info-item">
                      <label className="info-label">Section</label>
                      <p className="info-value">{selectedApp.section}</p>
                    </div>
                    <div className="info-item">
                      <label className="info-label">Contact Number</label>
                      <p className="info-value">{selectedApp.contact_number}</p>
                    </div>
                    <div className="info-item">
                      <label className="info-label">Terms Agreed</label>
                      <p className="info-value">{selectedApp.agreed_to_terms ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="section">
                  <h3 className="section-title">
                    <CreditCard className="section-icon" />
                    Application Details
                  </h3>
                  <div className="info-grid">
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <label className="info-label">Reason / Purpose</label>
                      <p className="info-value">{selectedApp.reason_purpose}</p>
                    </div>
                  </div>
                </div>

                {/* School ID Document */}
                <div className="section">
                  <h3 className="section-title">
                    <Hash className="section-icon" />
                    School ID
                  </h3>
                  <div className="documents-grid">
                    <div className="document-card">
                      <div className="document-header">
                        <div className="document-title">
                          <CreditCard className="document-icon" />
                          <span className="document-label">School ID</span>
                        </div>
                      </div>
                      
                      {selectedApp.school_id_url?.match(/\.(jpeg|jpg|png|gif)$/i) && (
                        <img 
                          src={selectedApp.school_id_url} 
                          alt="School ID"
                          className="document-preview"
                          onClick={() => window.open(selectedApp.school_id_url, '_blank')}
                        />
                      )}
                      
                      <div className="document-actions">
                        <a
                          href={selectedApp.school_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-view"
                        >
                          <Eye className="btn-icon" />
                          View
                        </a>
                        <a
                          href={selectedApp.school_id_url}
                          download
                          className="btn-download"
                        >
                          <Download className="btn-icon" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="actions-section">
                  <h3 className="section-title">Update Status</h3>
                  <div className="action-buttons">
                    <button
                      onClick={() => updateStatus(selectedApp.id, 'approved')}
                      className="action-btn btn-approve"
                      disabled={updating || selectedApp.status === 'approved'}
                    >
                      <CheckCircle className="action-icon" />
                      {updating ? 'Updating...' : selectedApp.status === 'approved' ? 'Already Approved' : 'Approve & Email'}
                    </button>
                    <button
                      onClick={() => updateStatus(selectedApp.id, 'pending')}
                      className="action-btn btn-pending"
                      disabled={updating || selectedApp.status === 'pending'}
                    >
                      <Clock className="action-icon" />
                      {updating ? 'Updating...' : selectedApp.status === 'pending' ? 'Already Pending' : 'Set to Pending'}
                    </button>
                    <button
                      onClick={() => updateStatus(selectedApp.id, 'rejected')}
                      className="action-btn btn-reject"
                      disabled={updating || selectedApp.status === 'rejected'}
                    >
                      <XCircle className="action-icon" />
                      {updating ? 'Updating...' : selectedApp.status === 'rejected' ? 'Already Rejected' : 'Reject & Email'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminCardApplication;