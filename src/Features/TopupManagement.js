import React, { useState } from 'react';
import '../Styles/TopupManagement.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

const TopupManagement = () => {
  const [data, setData] = useState([
    {
      name: 'John Doe',
      transactionCode: 'PT-001',
      cardNumber: 'PTC-001-001',
      paymentMethod: 'GCASH',
      requestedPoints: 100,
      proofOfPayment: 'proof1.jpg',
      status: 'Pending',
    },
    {
      name: 'Jane Smith',
      transactionCode: 'PT-002',
      cardNumber: 'PTC-002-002',
      paymentMethod: 'GCASH',
      requestedPoints: 200,
      proofOfPayment: 'proof2.jpg',
      status: 'Pending',
    },
  ]);

  const [selectedRow, setSelectedRow] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [reason, setReason] = useState('');

  const handleActionClick = (row, type) => {
    setSelectedRow(row);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedRow(null);
    setModalType(null);
    setReason('');
  };

  const handleApprove = () => {
    setData(prev =>
      prev.map(item =>
        item.transactionCode === selectedRow.transactionCode
          ? { ...item, status: 'Approved' }
          : item
      )
    );
    closeModal();
  };

  const handleReject = () => {
    setData(prev =>
      prev.map(item =>
        item.transactionCode === selectedRow.transactionCode
          ? { ...item, status: 'Rejected', reason }
          : item
      )
    );
    closeModal();
  };

  return (
     <>
    <TopBar />
    <Sidebar />
    <div className="topup-page-container">
      <h1 className="page-title">Topup Management</h1>
      <table className="topup-table">
        <thead>
          <tr>
            <th>Card Number</th>
            <th>User Type</th>
            <th>Requested Points</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.transactionCode}>
              <td>{row.cardNumber}</td>
              <td>{row.name}</td>
              <td>{row.requestedPoints}</td>
              <td>{row.paymentMethod}</td>
              <td>{row.status}</td>
              <td>
                <button
                  className="approve-btn"
                  onClick={() => handleActionClick(row, 'approve')}
                >
                  ✔
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleActionClick(row, 'reject')}
                >
                  ✖
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRow && modalType === 'approve' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Topup Conversion Approval</h2>
            <p><strong>Name:</strong> {selectedRow.name}</p>
            <p><strong>Transaction Code:</strong> {selectedRow.transactionCode}</p>
            <p><strong>Card Number:</strong> {selectedRow.cardNumber}</p>
            <p><strong>Payment Method:</strong> {selectedRow.paymentMethod}</p>
            <p><strong>Requested Points:</strong> {selectedRow.requestedPoints} points</p>
            <p><strong>Proof of Payment:</strong> {selectedRow.proofOfPayment}</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleApprove}>Approve</button>
              <button className="cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedRow && modalType === 'reject' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Topup Conversion Rejection</h2>
            <p><strong>Name:</strong> {selectedRow.name}</p>
            <p><strong>Transaction Code:</strong> {selectedRow.transactionCode}</p>
            <p><strong>Card Number:</strong> {selectedRow.cardNumber}</p>
            <p><strong>Payment Method:</strong> {selectedRow.paymentMethod}</p>
            <p><strong>Requested Points:</strong> {selectedRow.requestedPoints} points</p>
            <p><strong>Proof of Payment:</strong> {selectedRow.proofOfPayment}</p>

            <textarea
              className="reason-input"
              placeholder="Enter reason for rejection..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleReject}>Reject</button>
              <button className="cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
     </>
  );
};

export default TopupManagement;
