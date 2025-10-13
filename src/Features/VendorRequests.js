import React, { useEffect, useState } from "react";
import { supabase } from "../Supabase/supabaseClient";
import { FileText, Download, Eye, Calendar, Mail, Phone, Building, User, CheckCircle, Clock, XCircle } from "lucide-react";
import '../Styles/VendorApplicationDisplay.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

function VendorApplicationsDisplay() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);

  // Fetch all vendor applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('vendor_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

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
                  onClick={() => setFilter(status)}
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
            {applications.map((app) => (
              <div
                key={app.id}
                className="application-card"
                onClick={() => setSelectedApp(app)}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div className="card-header-content">
                    <h3 className="card-business-name">{app.business_name}</h3>
                    <span className={`status-badge ${getStatusClass(app.status)}`}>
                      {getStatusIcon(app.status)}
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="card-location">{app.stall_location}</p>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="card-info">
                    <User className="info-icon" />
                    <span className="info-text">{app.full_name}</span>
                  </div>
                  
                  <div className="card-info">
                    <Mail className="info-icon" />
                    <span className="info-text">{app.email}</span>
                  </div>
                  
                  <div className="card-info">
                    <Phone className="info-icon" />
                    <span className="info-text">{app.phone_number}</span>
                  </div>
                  
                  <div className="card-info">
                    <Calendar className="info-icon" />
                    <span className="info-text">
                      {new Date(app.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <button className="btn-view-full">
                    View Full Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Full Application View */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div>
                  <h2 className="modal-title">{selectedApp.business_name}</h2>
                  <p className="modal-subtitle">{selectedApp.stall_location}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="modal-close-btn"
                >
                  <XCircle className="close-icon" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="modal-body">
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
                  >
                    <CheckCircle className="action-icon" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(selectedApp.id, 'pending')}
                    className="action-btn btn-pending"
                  >
                    <Clock className="action-icon" />
                    Pending
                  </button>
                  <button
                    onClick={() => updateStatus(selectedApp.id, 'rejected')}
                    className="action-btn btn-reject"
                  >
                    <XCircle className="action-icon" />
                    Reject
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