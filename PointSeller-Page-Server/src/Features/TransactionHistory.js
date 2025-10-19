import React, { useState, useEffect } from 'react';
import '../Styles/TransactionHistory.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import { supabase } from "../Supabase/supabaseClient";

const TransactionHistory = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch all transactions from Supabase on component mount
  useEffect(() => {
    fetchAllTransactions();
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all transactions ordered by date (newest first)
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
        .order('date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching transactions:', fetchError);
        setError('Failed to load transactions');
        return;
      }

      // Map transactions
      const enrichedData = transactions.map((tx) => ({
        id: tx.id,
        user_id: tx.user_id,
        email: tx.user_email || 'Unknown Email',
        transactionCode: tx.id,
        cardNumber: tx.user_id,
        paymentMethod: tx.method,
        requestedPoints: tx.amount || 0,
        proofOfPayment: tx.proof_url,
        status: tx.status,
        referenceNo: tx.ref_no,
        accountNumber: tx.account_number || 'N/A',
        date: tx.date,
        createdAt: tx.created_at,
        rejectionReason: tx.rejection_reason || null
      }));

      setData(enrichedData);
    } catch (err) {
      console.error('Error in fetchAllTransactions:', err);
      setError('An error occurred while loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Filter by status
    if (filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filter by search term (email, reference number, or transaction code)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.email.toLowerCase().includes(searchLower) ||
        item.referenceNo?.toLowerCase().includes(searchLower) ||
        item.transactionCode?.toString().toLowerCase().includes(searchLower) ||
        item.accountNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(item => new Date(item.date) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter(item => new Date(item.date) <= toDate);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewDetails = (row) => {
    setSelectedRow(row);
  };

  const closeModal = () => {
    setSelectedRow(null);
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

  const resetFilters = () => {
    setFilters({
      status: 'All',
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  if (loading && data.length === 0) {
    return (
      <>
        <TopBar />
        <Sidebar />
        <div className="transaction-history-container">
          <h1 className="page-title">Transaction History</h1>
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
        <div className="transaction-history-container">
          <h1 className="page-title">Transaction History</h1>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <Sidebar />
      <div className="transaction-history-container">
        <div className="page-header">
          <h1 className="page-title">Transaction History</h1>
          <button 
            className="refresh-btn" 
            onClick={fetchAllTransactions}
            disabled={loading}
            title="Refresh transactions"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
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

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search-filter">Search:</label>
            <input
              id="search-filter"
              name="searchTerm"
              type="text"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Email, Ref No, Transaction ID..."
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="date-from">From:</label>
            <input
              id="date-from"
              name="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="date-to">To:</label>
            <input
              id="date-to"
              name="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <button 
            className="reset-filters-btn" 
            onClick={resetFilters}
            title="Reset all filters"
          >
            Reset
          </button>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> transactions</p>
        </div>

        {/* Transactions Table */}
        {filteredData.length === 0 ? (
          <p className="no-data">No transactions found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Email</th>
                  <th>Payment Method</th>
                  <th>Account Number</th>
                  <th>Reference Number</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr key={row.transactionCode}>
                    <td>{row.transactionCode}</td>
                    <td>{row.email}</td>
                    <td>{row.paymentMethod}</td>
                    <td>{row.accountNumber}</td>
                    <td>{row.referenceNo}</td>
                    <td>{row.requestedPoints} points</td>
                    <td>{new Date(row.date).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => handleViewDetails(row)}
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

        {/* Details Modal */}
        {selectedRow && (
          <div
            className="th-modal-overlay"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="th-modal-title"
          >
            <div className="th-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="th-modal-header">
                <h2 id="th-modal-title">Transaction Details</h2>
                <button className="th-modal-close" onClick={closeModal} aria-label="Close">×</button>
              </div>

              <div className="th-modal-content">
                <div className="detail-row">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value">{selectedRow.transactionCode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedRow.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{selectedRow.user_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{selectedRow.paymentMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account Number:</span>
                  <span className="detail-value">{selectedRow.accountNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reference Number:</span>
                  <span className="detail-value">{selectedRow.referenceNo}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested Points:</span>
                  <span className="detail-value">{selectedRow.requestedPoints} points</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{new Date(selectedRow.date).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedRow.status)}`}>
                    {selectedRow.status}
                  </span>
                </div>
                {selectedRow.rejectionReason && (
                  <div className="detail-row">
                    <span className="detail-label">Rejection Reason:</span>
                    <span className="detail-value rejection-reason">{selectedRow.rejectionReason}</span>
                  </div>
                )}
                {selectedRow.proofOfPayment && (
                  <div className="detail-row">
                    <span className="detail-label">Proof of Payment:</span>
                    <a 
                      href={selectedRow.proofOfPayment} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="proof-link"
                    >
                      View Image
                    </a>
                  </div>
                )}
              </div>

              <div className="th-modal-actions">
                <button className="th-close-btn" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionHistory;