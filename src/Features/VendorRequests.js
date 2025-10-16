import React, { useEffect, useState } from "react";
import { supabase } from "../Supabase/supabaseClient";
import { FileText, Download, Eye, Calendar, Mail, Phone, Building, User, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import '../Styles/VendorApplicationDisplay.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

function VendorApplicationsDisplay() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch all vendor applications
  const fetchApplications = async () => {
    setLoading(true);
    console.log('🔍 Fetching applications with filter:', filter);
    
    try {
      let query = supabase
        .from('vendor_applications')
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
      
      console.log('✅ Fetched applications:', data);
      setApplications(data || []);
    } catch (error) {
      console.error("💥 Error fetching applications:", error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Update application status
const updateStatus = async (id, newStatus) => {
  if (updating) return;

  setUpdating(true);
  console.log(`🔄 Updating application ${id} to status: ${newStatus}`);

  try {
    const { error } = await supabase
      .from('vendor_applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Update successful.');

    // ✅ Instantly update local UI even if Supabase returns []
    setApplications(prevApps =>
      prevApps.map(app =>
        app.id === id ? { ...app, status: newStatus } : app
      )
    );

    // ✅ Also update modal if open
    setSelectedApp(prev => (prev ? { ...prev, status: newStatus } : prev));

    // Toast notification
    if (newStatus === 'approved') {
      toast.success('✓ Application Approved!', { autoClose: 2000 });
    } else if (newStatus === 'rejected') {
      toast.error('✗ Application Rejected', { autoClose: 2000 });
    } else {
      toast.info('⏱ Set to Pending', { autoClose: 2000 });
    }

    // Optional: Close modal after short delay
    setTimeout(() => setSelectedApp(null), 500);

    // Optional: Refresh data after delay to stay in sync
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

  // Close on Escape key when modal is open
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

  const DocumentCard = ({ label, url }) => {
    const isImage = url?.match(/\.(jpeg|jpg|png|gif)$/i);
    
    return (
      <div className="document-card">
        <div className="document-header">
          <div className="document-title">
            <FileText className="document-icon" />
            <span className="document-label">{label}</span>
          </div>
        </div>
        
        {isImage && (
          <img 
            src={url} 
            alt={label}
            className="document-preview"
            onClick={() => window.open(url, '_blank')}
          />
        )}
        
        <div className="document-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-view"
          >
            <Eye className="btn-icon" />
            View
          </a>
          <a
            href={url}
            download
            className="btn-download"
          >
            <Download className="btn-icon" />
          </a>
        </div>
      </div>
    );
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
              <h1 className="header-title">Vendor Applications</h1>
              <p className="header-subtitle">Review and manage vendor registration requests</p>
            </div>
            
            {/* Filter Buttons */}
            <div className="filter-container">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    console.log('Filter changed to:', status);
                    setFilter(status);
                  }}
                  className={`filter-btn ${filter === status ? 'filter-active' : ''}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="vendor-app-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <Building className="empty-icon" />
            <h3 className="empty-title">No Applications Found</h3>
            <p className="empty-text">There are no {filter !== 'all' ? filter : ''} vendor applications at the moment.</p>
          </div>
        ) : (
          <div className="applications-grid">
            <table className="vendor-applications-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.business_name}</td>
                    <td>{app.full_name}</td>
                    <td>{app.email}</td>
                    <td>{app.phone_number}</td>
                    <td>{app.stall_location}</td>
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

      {/* Modal for Full Application View */}
      {selectedApp && (
        <div 
          className="vendor-modal-overlay" 
          onClick={() => setSelectedApp(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
        >
          <div className="vendor-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="vendor-modal-header">
              <div>
                <h2 id="vendor-modal-title" className="vendor-modal-title">{selectedApp.business_name}</h2>
                <p className="vendor-modal-subtitle">{selectedApp.stall_location}</p>
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
              {/* Owner Information */}
              <div className="section">
                <h3 className="section-title">
                  <User className="section-icon" />
                  Owner Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Full Name</label>
                    <p className="info-value">{selectedApp.full_name}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Email</label>
                    <p className="info-value">{selectedApp.email}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Phone Number</label>
                    <p className="info-value">{selectedApp.phone_number}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Authorized Seller</label>
                    <p className="info-value">{selectedApp.authorized_seller_name}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="section">
                <h3 className="section-title">
                  <FileText className="section-icon" />
                  Required Documents
                </h3>
                <div className="documents-grid">
                  <DocumentCard 
                    label="Accreditation Certificate" 
                    url={selectedApp.accreditation_cert_url}
                  />
                  <DocumentCard 
                    label="Menu List" 
                    url={selectedApp.menu_list_url}
                  />
                  <DocumentCard 
                    label="DTI/SEC Registration" 
                    url={selectedApp.dti_sec_url}
                  />
                  <DocumentCard 
                    label="Mayor's Permit" 
                    url={selectedApp.mayor_permit_url}
                  />
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
                    {updating ? 'Updating...' : selectedApp.status === 'approved' ? 'Already Approved' : 'Approve'}
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
                    {updating ? 'Updating...' : selectedApp.status === 'rejected' ? 'Already Rejected' : 'Reject'}
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

export default VendorApplicationsDisplay;