import React, { useState } from 'react';
import '../Styles/CashConversion.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';


const CashConversion = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      vendor: 'Vendor A',
      amount: '₱5,000',
      method: 'Bank Transfer',
      requestDate: '2025-01-10',
      status: 'Pending'
    },
    {
      id: 2,
      vendor: 'Vendor B',
      amount: '₱3,200',
      method: 'GCash',
      requestDate: '2025-01-08',
      status: 'Approved'
    },
    {
      id: 3,
      vendor: 'Vendor C',
      amount: '₱4,500',
      method: 'PayPal',
      requestDate: '2025-01-05',
      status: 'Rejected'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const openModal = (request, type) => {
    setSelectedRequest(request);
    setModalType(type);
    setInputValue('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setModalType(null);
  };

  const handleConfirm = () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(req =>
      req.id === selectedRequest.id
        ? { ...req, status: modalType === 'accept' ? 'Approved' : 'Rejected' }
        : req
    );

    setRequests(updatedRequests);
    closeModal();
  };

  return (
    <>
    <TopBar />
    <Sidebar />
    <div className="cash-page-container">
      <h1 className="page-title">Cash Conversion Request</h1>
      <table className="cash-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((row) => (
            <tr key={row.id}>
              <td>{row.vendor}</td>
              <td>{row.amount}</td>
              <td>{row.method}</td>
              <td>{row.requestDate}</td>
              <td>{row.status}</td>
              <td className="action-buttons">
                <button
                  className="check-btn"
                  onClick={() => openModal(row, 'accept')}
                >
                  ✔
                </button>
                <button
                  className="cross-btn"
                  onClick={() => openModal(row, 'decline')}
                >
                  ✖
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalType === 'accept' ? 'Approve Request' : 'Reject Request'}</h2>
            </div>

            <div className="modal-body">
              <p><strong>Vendor:</strong> {selectedRequest.vendor}</p>
              <p><strong>Point Balance:</strong> 120 points</p>
              <p><strong>Payment Method:</strong> {selectedRequest.method}</p>
              <p><strong>Account Details:</strong> 0997 501 1234</p>
              <p><strong>Conversion Amount:</strong> 120 points → ₱120</p>

              {modalType === 'accept' ? (
                <>
                  <label><strong>Note:</strong></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Enter note here..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <label><strong>Reason:</strong></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Enter reason here..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-confirm-btn" onClick={handleConfirm}>
                Confirm
              </button>
              <button className="modal-close-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CashConversion;
