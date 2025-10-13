import React, { useState, useEffect } from 'react';
import '../Styles/RFIDManagement.css';
import '../Styles/Modal.css';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

const initialCardForm = {
  uid: '',
  userName: '',
  balance: 0,
  dateIssued: '',
  status: 'Active',
};

const RFIDManagement = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactModal, setShowTransactModal] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [cardForm, setCardForm] = useState(initialCardForm);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      setCards(data);
    } catch (error) {
      showNotification('Error fetching cards.', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const showNotification = (message, success = true) => {
    setNotification({ message, success });
    setTimeout(() => setNotification(null), 4000);
  };

  const openAddModal = () => {
    setCardForm({
      ...initialCardForm,
      dateIssued: new Date().toISOString().slice(0, 10),
    });
    setShowAddModal(true);
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCard = async () => {
    if (!cardForm.uid || !cardForm.userName) {
      showNotification('UID and User Name are required.', false);
      return;
    }
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardForm),
      });
      if (response.ok) {
        showNotification('Card added successfully.');
        fetchCards();
        setShowAddModal(false);
      } else {
        const err = await response.text();
        showNotification('Failed to add card: ' + err, false);
      }
    } catch {
      showNotification('Server error, try again.', false);
    }
  };

  const updateCardStatus = async (uid, status) => {
    try {
      const response = await fetch(`/api/cards/${uid}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        showNotification(`Card status updated to '${status}'.`);
        fetchCards();
      } else {
        showNotification('Failed to update status.', false);
      }
    } catch {
      showNotification('Server error, try again.', false);
    }
  };

  const openTransactionModal = (card) => {
    setCurrentCard(card);
    setTransactionAmount('');
    setShowTransactModal(true);
  };

  const handleTransaction = async () => {
    if (isNaN(transactionAmount) || Number(transactionAmount) < 0) {
      showNotification('Enter a valid amount.', false);
      return;
    }
    try {
      const response = await fetch(`/api/cards/${currentCard.uid}/transact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(transactionAmount) }),
      });
      const data = await response.json();
      if (data.approved) {
        showNotification('Transaction approved. New balance: ' + data.balance);
        fetchCards();
        setShowTransactModal(false);
      } else {
        showNotification('Transaction denied.', false);
      }
    } catch {
      showNotification('Server error, try again.', false);
    }
  };

  return (
    <>
      <TopBar />
      <Sidebar />

      {/* Main content section, centered with margins */}
      <div className="main-content">
        <div className="rfid-container">
          <h1 className="rfid-header">RFID Card Management System</h1>

          {notification && (
            <div
              className={`rfid-notification ${
                notification.success ? 'success' : 'error'
              }`}
            >
              {notification.message}
            </div>
          )}

          <button className="rfid-add-btn" onClick={openAddModal}>
            + Add New Card
          </button>

          {loading ? (
            <p>Loading cards...</p>
          ) : (
            <table className="rfid-table">
              <thead>
                <tr>
                  <th>Card Number (UID)</th>
                  <th>User Name</th>
                  <th>Balance</th>
                  <th>Date Issued</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
                      No cards found.
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr key={card.uid}>
                      <td>{card.uid}</td>
                      <td>{card.userName}</td>
                      <td>${card.balance.toFixed(2)}</td>
                      <td>
                        {new Date(card.dateIssued).toLocaleDateString()}
                      </td>
                      <td
                        className={
                          card.status === 'Active'
                            ? 'rfid-status-active'
                            : 'rfid-status-disabled'
                        }
                      >
                        {card.status}
                      </td>
                      <td>
                        {card.status === 'Active' ? (
                          <button
                            className="rfid-action-btn disable"
                            onClick={() =>
                              updateCardStatus(card.uid, 'Disabled')
                            }
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            className="rfid-action-btn enable"
                            onClick={() =>
                              updateCardStatus(card.uid, 'Active')
                            }
                          >
                            Enable
                          </button>
                        )}
                        <button
                          className="rfid-action-btn transact"
                          onClick={() => openTransactionModal(card)}
                        >
                          Transact
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Add New Card</h2>
            <label>Card Number (UID)</label>
            <input
              type="text"
              name="uid"
              value={cardForm.uid}
              onChange={handleCardInputChange}
            />
            <label>User Name</label>
            <input
              type="text"
              name="userName"
              value={cardForm.userName}
              onChange={handleCardInputChange}
            />
            <label> Balance Points (Php 1 = 1 Paytap Points)</label>
            <input
              type="number"
              name="balance"
              min="0"
              step="0.01"
              value={cardForm.balance}
              onChange={handleCardInputChange}
            />
            <label>Date Issued</label>
            <input
              type="date"
              name="dateIssued"
              value={cardForm.dateIssued}
              onChange={handleCardInputChange}
            />
            <label>Status</label>
            <select
              name="status"
              value={cardForm.status}
              onChange={handleCardInputChange}
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
            <div className="modal-buttons">
              <button className="modal-btn-primary" onClick={handleAddCard}>
                Add Card
              </button>
              <button
                className="modal-btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactModal && currentCard && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>
              Transaction for {currentCard.userName} ({currentCard.uid})
            </h2>
            <label>Amount to Debit / 0 for Access Check</label>
            <input
              type="number"
              placeholder="0.00"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="modal-buttons">
              <button
                className="modal-btn-primary"
                onClick={handleTransaction}
              >
                Submit
              </button>
              <button
                className="modal-btn-secondary"
                onClick={() => setShowTransactModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RFIDManagement;
