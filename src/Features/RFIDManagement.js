import '../Styles/RFIDManagement.css';
import '../Styles/Modal.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import rfidService from '../services/rfidService';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function RFIDManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  
  // Search & Topup States
  const [rfidUID, setRfidUID] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userData, setUserData] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  
  // Register New Card States
  const [newCardData, setNewCardData] = useState({
    rfidUID: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Card Management States
  const [allCards, setAllCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load all cards when manage tab is opened
  useEffect(() => {
    if (activeTab === 'manage') {
      loadAllCards();
    }
  }, [activeTab]);

  // ===== SEARCH & TOPUP FUNCTIONS =====
  const handleSearchInput = async (value) => {
    setRfidUID(value);
    
    if (value.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      console.log('Searching for:', value);
      const results = await rfidService.searchCards(value);
      console.log('Search results:', results);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectUser = async (card) => {
    try {
      setUserData(card);
      setRfidUID(card.rfid_uid);
      setShowResults(false);
      toast.success(`✅ Selected: ${card.name}`);
    } catch (error) {
      toast.error(`❌ Error selecting user: ${error.message}`);
    }
  };

  const handleSearchUser = async () => {
    if (!rfidUID.trim()) {
      toast.error('Please enter RFID UID or Name');
      return;
    }

    setIsLoading(true);
    try {
      const results = await rfidService.searchCards(rfidUID);
      if (results.length === 1) {
        setUserData(results[0]);
        setShowResults(false);
        toast.success(`✅ Found: ${results[0].name}`);
      } else if (results.length > 1) {
        setShowResults(true);
        toast.info(`Found ${results.length} matching cards`);
      } else {
        setUserData(null);
        setShowResults(false);
        toast.error('❌ No cards found');
      }
    } catch (error) {
      setUserData(null);
      setShowResults(false);
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!userData || !topupAmount) {
      toast.error('Select user and enter amount');
      return;
    }

    if (topupAmount <= 0) {
      toast.error('Amount must be positive');
      return;
    }

    setIsLoading(true);
    try {
      const result = await rfidService.topupCard(userData.rfid_uid, topupAmount);
      toast.success(`✅ Topup successful! New balance: ${result.new_balance} pts`);
      setUserData({ ...userData, balance: result.new_balance });
      setTopupAmount('');
    } catch (error) {
      toast.error(`❌ Topup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setRfidUID('');
    setUserData(null);
    setTopupAmount('');
    setSearchResults([]);
    setShowResults(false);
  };

  // ===== REGISTER NEW CARD FUNCTIONS =====
  const handleNewCardChange = (field, value) => {
    setNewCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegisterCard = async () => {
    const { rfidUID, name, email, password, confirmPassword } = newCardData;

    // Validation
    if (!rfidUID.trim() || !name.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }

    setIsLoading(true);
    try {
      const result = await rfidService.registerNewCard(
        email,
        password,
        name,
        rfidUID
      );

      toast.success(`✅ Card registered successfully! User ID: ${result.firebase_uid}`);
      
      // Reset form
      setNewCardData({
        rfidUID: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      // Reload cards list if manage tab is active
      if (activeTab === 'manage') {
        await loadAllCards();
      }
    } catch (error) {
      toast.error(`❌ Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== CARD MANAGEMENT FUNCTIONS =====
  const loadAllCards = async () => {
    setIsLoading(true);
    try {
      const cards = await rfidService.getAllCards();
      setAllCards(cards);
    } catch (error) {
      toast.error('Failed to load cards');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCardStatus = async (rfidUID) => {
    setIsLoading(true);
    try {
      const result = await rfidService.toggleCardStatus(rfidUID);
      toast.success(`✅ Card status changed to ${result.new_status}`);
      
      // Update UI
      setAllCards(allCards.map(card => 
        card.rfid_uid === rfidUID 
          ? { ...card, status: result.new_status } 
          : card
      ));
    } catch (error) {
      toast.error(`❌ Failed to update card: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <TopBar />
      <Sidebar />
      <div className="rfid-management">
        <h2>🏷️ RFID Card Management System</h2>

        {/* Main Tab Navigation */}
        <div className="main-tab-container">
          <button 
            className={`main-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            💰 Search & Top Up
          </button>
          <button 
            className={`main-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            ➕ Register New Card
          </button>
          <button 
            className={`main-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            📋 Card Management
          </button>
        </div>

        {/* ===== TAB 1: SEARCH & TOPUP ===== */}
        {activeTab === 'search' && (
          <div className="tab-content">
            <div className="search-section">
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Enter RFID UID or Name (e.g., A1B2C3D4 or John Doe)"
                  value={rfidUID}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                  className="input-field"
                  disabled={!!userData}
                />
                
                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #cbd5e0',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}>
                    {searchResults.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleSelectUser(card)}
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f7fafc'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 600, color: '#1a202c' }}>{card.name}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {card.rfid_uid} • {card.balance} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSearchUser} 
                disabled={isLoading || !!userData} 
                className="btn-primary"
              >
                {isLoading ? '⏳ Searching...' : '🔍 Search'}
              </button>
              {userData && (
                <button onClick={handleClearSearch} className="btn-secondary">
                  ↻ New Search
                </button>
              )}
            </div>

            {userData && (
              <>
                <div className="sub-tab-container">
                  <button className="sub-tab-btn active">👤 User Info</button>
                  <button className="sub-tab-btn active">💳 Top Up</button>
                </div>

                <div className="user-card">
                  <h3>✅ User Details</h3>
                  <div className="user-details">
                    <div className="detail-row">
                      <span className="label">Name:</span>
                      <span className="value">{userData.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Email:</span>
                      <span className="value">{userData.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">RFID UID:</span>
                      <span className="value rfid">{userData.rfid_uid}</span>
                    </div>
                    <div className="detail-row balance-row">
                      <span className="label">Current Balance:</span>
                      <span className="value balance-value">{userData.balance} pts</span>
                    </div>
                  </div>
                </div>

                <div className="topup-section">
                  <div className="topup-card">
                    <div className="current-balance">
                      <span>Current Balance:</span>
                      <span className="balance-number">{userData.balance}</span>
                      <span>pts</span>
                    </div>

                    <div className="topup-form">
                      <label htmlFor="amount">Amount to Add:</label>
                      <div className="amount-input-group">
                        <input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleTopup()}
                          min="1"
                          className="input-field amount-input"
                        />
                        <span className="unit">pts</span>
                      </div>

                      {topupAmount && (
                        <div className="topup-preview">
                          <p>New Balance: <strong>{userData.balance + parseInt(topupAmount || 0)} pts</strong></p>
                        </div>
                      )}
                    </div>

                    <div className="topup-actions">
                      <button 
                        onClick={handleTopup} 
                        disabled={isLoading || !topupAmount} 
                        className="btn-success"
                      >
                        {isLoading ? '⏳ Processing...' : '✓ Confirm Top Up'}
                      </button>
                      <button 
                        onClick={() => setTopupAmount('')} 
                        disabled={isLoading} 
                        className="btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB 2: REGISTER NEW CARD ===== */}
        {activeTab === 'register' && (
          <div className="tab-content">
            <div className="register-card">
              <h3>➕ Register New RFID Card</h3>
              <p className="register-subtitle">Create a new user and link an RFID card</p>

              <form className="register-form">
                <div className="form-group">
                  <label htmlFor="rfidUID">RFID UID *</label>
                  <input
                    id="rfidUID"
                    type="text"
                    placeholder="Scan card or enter UID (e.g., A1B2C3D4)"
                    value={newCardData.rfidUID}
                    onChange={(e) => handleNewCardChange('rfidUID', e.target.value.toUpperCase())}
                    className="input-field"
                    disabled={isLoading}
                  />
                  <small>Hex format (8 characters)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="User's full name"
                    value={newCardData.name}
                    onChange={(e) => handleNewCardChange('name', e.target.value)}
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newCardData.email}
                    onChange={(e) => handleNewCardChange('email', e.target.value)}
                    className="input-field"
                    disabled={isLoading}
                  />
                  <small>Used for Firebase authentication</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <div className="password-input-group">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={newCardData.password}
                        onChange={(e) => handleNewCardChange('password', e.target.value)}
                        className="input-field"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '🔒'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={newCardData.confirmPassword}
                      onChange={(e) => handleNewCardChange('confirmPassword', e.target.value)}
                      className="input-field"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleRegisterCard}
                    disabled={isLoading}
                    className="btn-success"
                  >
                    {isLoading ? '⏳ Registering...' : '✓ Register Card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardData({
                      rfidUID: '',
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                    })}
                    disabled={isLoading}
                    className="btn-secondary"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== TAB 3: CARD MANAGEMENT ===== */}
        {activeTab === 'manage' && (
          <div className="tab-content">
            <div className="manage-header">
              <h3>📋 All RFID Cards</h3>
              <button 
                onClick={loadAllCards}
                disabled={isLoading}
                className="btn-secondary"
              >
                {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {allCards.length > 0 ? (
              <div className="cards-table-container">
                <table className="cards-table">
                  <thead>
                    <tr>
                      <th>RFID UID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCards.map((card) => (
                      <tr key={card.id} className={`card-row status-${card.status}`}>
                        <td className="rfid-uid">{card.rfid_uid}</td>
                        <td>{card.name}</td>
                        <td>{card.email}</td>
                        <td className="balance">{card.balance} pts</td>
                        <td>
                          <span className={`status-badge status-${card.status}`}>
                            {card.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="date">{new Date(card.created_at).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleToggleCardStatus(card.rfid_uid)}
                            disabled={isLoading}
                            className={`btn-toggle ${card.status === 'active' ? 'deactivate' : 'activate'}`}
                          >
                            {card.status === 'active' ? '⛔ Deactivate' : '✓ Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No cards registered yet</p>
                <button 
                  onClick={() => setActiveTab('register')}
                  className="btn-primary"
                >
                  ➕ Register First Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default RFIDManagement;