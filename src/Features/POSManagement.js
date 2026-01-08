import React, { useState, useEffect } from 'react';
import { posApp } from '../firebase/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/POSManagement.css';

function POSManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    email: '',
    password: ''
  });

  const posAuth = getAuth(posApp);
  const posDb = getFirestore(posApp);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const vendorsRef = collection(posDb, 'vendors');
      const q = query(vendorsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const vendorsList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setVendors(vendorsList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();

    if (!formData.vendorName || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create vendor login in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        posAuth,
        formData.email,
        formData.password
      );

      // Save vendor record in Firestore
      await addDoc(collection(posDb, 'vendors'), {
        vendorName: formData.vendorName,
        email: formData.email,
        uid: userCredential.user.uid,
        status: 'active',
        createdAt: Timestamp.now()
      });

      toast.success('Vendor added successfully!');
      setFormData({ vendorName: '', email: '', password: '' });
      fetchVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else {
        toast.error('Failed to add vendor: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (vendorId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmAction = window.confirm(
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this vendor?`
    );
    if (!confirmAction) return;

    try {
      setLoading(true);
      const vendorRef = doc(posDb, 'vendors', vendorId);
      await updateDoc(vendorRef, { status: newStatus });
      toast.success(`Vendor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update vendor status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />

       
          <div className="pos-main-card">
            {/* Page Header */}
            <div className="pos-page-header">
              <h2>POS Account Management</h2>
              <p className="pos-subtitle">
                Manage login credentials and access for POS users
              </p>
            </div>

            {/* Form + Vendor Table */}
            <div className="pos-page-form">
              {/* Add Vendor Section */}
              <div className="pos-form-section">
                <h3 className="pos-section-title">Add New Vendor</h3>
                <form onSubmit={handleAddVendor} className="pos-vendor-form">
                  <div className="pos-form-row">
                    <div className="pos-form-group">
                      <label htmlFor="vendorName">Vendor Name *</label>
                      <input
                        type="text"
                        id="vendorName"
                        name="vendorName"
                        value={formData.vendorName}
                        onChange={handleInputChange}
                        className="pos-form-input"
                        placeholder="Enter vendor name"
                        disabled={loading}
                      />
                    </div>

                    <div className="pos-form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pos-form-input"
                        placeholder="vendor@example.com"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="pos-form-row">
                    <div className="pos-form-group">
                      <label htmlFor="password">Password *</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pos-form-input"
                        placeholder="Minimum 6 characters"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="pos-form-actions">
                    <button
                      type="submit"
                      className="pos-submit-btn"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Vendor'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Vendor List */}
              <div className="pos-form-section">
                <h3 className="pos-section-title">Existing Vendors</h3>

                {loading && vendors.length === 0 ? (
                  <div className="pos-loading-state">
                    <div className="pos-spinner"></div>
                    <p>Loading vendors...</p>
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="pos-empty-state">
                    <p>No vendors found. Add your first vendor above.</p>
                  </div>
                ) : (
                  <div className="pos-table-wrapper">
                    <table className="pos-vendors-table">
                      <thead>
                        <tr>
                          <th>Vendor Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Created At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((vendor) => (
                          <tr key={vendor.id}>
                            <td data-label="Vendor Name">{vendor.vendorName}</td>
                            <td data-label="Email">{vendor.email}</td>
                            <td data-label="Status">
                              <span
                                className={`pos-status-badge ${vendor.status}`}
                              >
                                {vendor.status}
                              </span>
                            </td>
                            <td data-label="Created At">
                              {formatDate(vendor.createdAt)}
                            </td>
                            <td data-label="Actions">
                              <button
                                className={`pos-action-btn ${
                                  vendor.status === 'active'
                                    ? 'danger'
                                    : 'success'
                                }`}
                                onClick={() =>
                                  handleDeactivate(vendor.id, vendor.status)
                                }
                                disabled={loading}
                              >
                                {vendor.status === 'active'
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </button>
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

          <ToastContainer position="top-right" autoClose={3000} theme="light" />
        </div>
      </div>
    
  );
}

export default POSManagement;
