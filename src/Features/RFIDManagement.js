import '../Styles/RFIDManagement.css';
import '../Styles/Modal.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import rfidService from '../services/rfidService';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function RFIDManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('search');
  
  // Search & Topup States
  const [rfidUID, setRfidUID] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [userData, setUserData] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  
  // Register New Card States - MODIFIED: Default password
  const [newCardData, setNewCardData] = useState({
    rfidUID: '',
    name: '',
    email: '',
    password: 'paytap', // Default password
    confirmPassword: 'paytap', // Default password
  });
  
  // Card Management States
  const [allCards, setAllCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Transfer Points States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    sourceRFID: '',
    destinationRFID: '',
    amount: '',
  });
  const [sourceSearchResults, setSourceSearchResults] = useState([]);
  const [destSearchResults, setDestSearchResults] = useState([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [selectedSourceCard, setSelectedSourceCard] = useState(null);
  const [selectedDestCard, setSelectedDestCard] = useState(null);

  // Delete confirmation state
  const [deleteConfirmCard, setDeleteConfirmCard] = useState(null);

  // Register Confirmation Modal State
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  // Card Search in Management Tab
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  // Sort and Filter States
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');

  // Registered Users Table States (for Search & Topup tab)
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userTableSort, setUserTableSort] = useState('newest');
  const [userTableFilter, setUserTableFilter] = useState('all');

  // Transfer History States
  const [transferHistory, setTransferHistory] = useState([]);
  const [showTransferHistory, setShowTransferHistory] = useState(false);

  // Handle navigation from TopupManagement (auto-search and pre-fill)
  useEffect(() => {
    if (location.state?.fromApproval && location.state?.searchRFID) {
      const rfidToSearch = location.state.searchRFID;
      const amountToTopup = location.state.topupAmount;
      
      setActiveTab('search');
      setRfidUID(rfidToSearch);
      
      setTimeout(async () => {
        if (rfidToSearch && rfidToSearch !== 'N/A') {
          setIsLoading(true);
          try {
            const results = await rfidService.searchCards(rfidToSearch);
            if (results.length === 1) {
              setUserData(results[0]);
              setShowResults(false);
              setTopupAmount(amountToTopup?.toString() || '');
              toast.success(`✅ Found: ${results[0].name} - Ready to topup!`);
            } else if (results.length > 1) {
              setSearchResults(results);
              setShowResults(true);
              toast.info(`Found ${results.length} matching cards - select one`);
            } else {
              toast.error('❌ Card not found');
            }
          } catch (error) {
            console.error('Auto-search error:', error);
            toast.error(`❌ ${error.message}`);
          } finally {
            setIsLoading(false);
          }
        } else {
          toast.warning('⚠️ No valid RFID card found for this transaction');
        }
      }, 500);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Load all cards when manage tab is opened
  useEffect(() => {
    if (activeTab === 'manage') {
      loadAllCards();
    }
  }, [activeTab]);

  // Load registered users when search tab is opened
  useEffect(() => {
    if (activeTab === 'search') {
      loadRegisteredUsers();
    }
  }, [activeTab]);

  // Load Registered Users Function
  const loadRegisteredUsers = async () => {
    try {
      const users = await rfidService.getAllCards();
      setRegisteredUsers(users);
    } catch (error) {
      console.error('Failed to load registered users:', error);
    }
  };

  // Load Transfer History
  const loadTransferHistory = async () => {
    setIsLoading(true);
    try {
      const history = await rfidService.getTransferHistory();
      setTransferHistory(history);
      setShowTransferHistory(true);
    } catch (error) {
      toast.error('❌ Failed to load transfer history');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== SEARCH & TOPUP FUNCTIONS =====
  const handleSearchInput = async (value) => {
    setRfidUID(value);
    
    if (value.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const results = await rfidService.searchCards(value);
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

    const confirmed = window.confirm(
      `Are you sure you want to add ₱${topupAmount} to ${userData.name}'s account?\n\nCurrent Balance: ₱${userData.balance}\nNew Balance: ₱${userData.balance + parseInt(topupAmount)}\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await rfidService.topupCard(userData.rfid_uid, topupAmount);
      
      toast.success(
        `🎉 Topup Successful!\nAdded ₱${topupAmount} to ${userData.name}'s account\nNew balance: ₱${result.new_balance}`,
        {
          autoClose: 5000,
          position: 'top-center',
        }
      );
      
      setUserData({ ...userData, balance: result.new_balance });
      setTopupAmount('');
      await loadRegisteredUsers();
    } catch (error) {
      toast.error(`❌ ${error.message}`);
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

  // MODIFIED: Validation function
  const handleShowRegisterConfirm = () => {
    const { rfidUID, name, email, password, confirmPassword } = newCardData;

    if (!rfidUID.trim() || !name.trim() || !email.trim()) {
      toast.error('❌ RFID UID, Name, and Email are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('❌ Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('❌ Password must be at least 6 characters');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('❌ Invalid email format');
      return;
    }

    setShowRegisterConfirm(true);
  };

  // MODIFIED: Reset form with default password
  const handleRegisterCard = async () => {
    const { rfidUID, name, email, password } = newCardData;

    setIsLoading(true);
    setShowRegisterConfirm(false);
    
    try {
      const result = await rfidService.registerNewCard(
        email,
        password,
        name,
        rfidUID
      );

      toast.success(`✅ Card registered successfully!\nUser: ${name}\nRFID: ${rfidUID}\nDefault Password: paytap`, {
        autoClose: 6000,
        position: 'top-center',
      });
      
      // Reset to default values
      setNewCardData({
        rfidUID: '',
        name: '',
        email: '',
        password: 'paytap',
        confirmPassword: 'paytap',
      });

      if (activeTab === 'manage') {
        await loadAllCards();
      }
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFIED: Clear form function
  const clearRegisterForm = () => {
    setNewCardData({
      rfidUID: '',
      name: '',
      email: '',
      password: 'paytap',
      confirmPassword: 'paytap',
    });
  };

  // ===== CARD MANAGEMENT FUNCTIONS =====
  const loadAllCards = async () => {
    setIsLoading(true);
    try {
      const cards = await rfidService.getAllCards();
      setAllCards(cards);
    } catch (error) {
      toast.error('❌ Failed to load cards');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCardStatus = async (rfidUID) => {
    setIsLoading(true);
    try {
      const result = await rfidService.toggleCardStatus(rfidUID);
      toast.success(`✅ Card status changed to ${result.new_status.toUpperCase()}`);
      
      setAllCards(allCards.map(card => 
        card.rfid_uid === rfidUID 
          ? { ...card, status: result.new_status } 
          : card
      ));
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (card) => {
    setDeleteConfirmCard(card);
  };

  const confirmDeleteCard = async () => {
    if (!deleteConfirmCard) return;

    setIsLoading(true);
    try {
      await rfidService.deleteCard(deleteConfirmCard.rfid_uid);
      
      toast.success(`✅ Card removed successfully!\nRFID: ${deleteConfirmCard.rfid_uid}\nEmail account remains active.`, {
        autoClose: 5000,
        position: 'top-center',
      });
      
      setAllCards(allCards.filter(c => c.rfid_uid !== deleteConfirmCard.rfid_uid));
      setDeleteConfirmCard(null);
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TRANSFER POINTS FUNCTIONS =====
  const handleSourceSearch = async (value) => {
    setTransferData(prev => ({ ...prev, sourceRFID: value }));
    setSelectedSourceCard(null);
    
    if (value.trim() === '') {
      setSourceSearchResults([]);
      setShowSourceDropdown(false);
      return;
    }

    try {
      const results = await rfidService.searchCards(value);
      setSourceSearchResults(results);
      setShowSourceDropdown(true);
    } catch (error) {
      console.error('Source search error:', error);
    }
  };

  const handleDestSearch = async (value) => {
    setTransferData(prev => ({ ...prev, destinationRFID: value }));
    setSelectedDestCard(null);
    
    if (value.trim() === '') {
      setDestSearchResults([]);
      setShowDestDropdown(false);
      return;
    }

    try {
      const results = await rfidService.searchCards(value);
      setDestSearchResults(results);
      setShowDestDropdown(true);
    } catch (error) {
      console.error('Destination search error:', error);
    }
  };

  const selectSourceCard = (card) => {
    setSelectedSourceCard(card);
    setTransferData(prev => ({ ...prev, sourceRFID: card.rfid_uid }));
    setShowSourceDropdown(false);
  };

  const selectDestCard = (card) => {
    setSelectedDestCard(card);
    setTransferData(prev => ({ ...prev, destinationRFID: card.rfid_uid }));
    setShowDestDropdown(false);
  };

  const handleTransferPoints = async () => {
    const { sourceRFID, destinationRFID, amount } = transferData;

    if (!sourceRFID || !destinationRFID || !amount) {
      toast.error('❌ All fields are required');
      return;
    }

    if (amount <= 0) {
      toast.error('❌ Amount must be positive');
      return;
    }

    const confirmed = window.confirm(
      `Transfer ₱${amount} points?\n\nFrom: ${selectedSourceCard?.name || sourceRFID}\nTo: ${selectedDestCard?.name || destinationRFID}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await rfidService.transferPoints(sourceRFID, destinationRFID, amount);
      
      toast.success(
        `✅ Transfer Successful!\n₱${amount} transferred from ${result.source.name} to ${result.destination.name}`,
        {
          autoClose: 5000,
          position: 'top-center',
        }
      );

      setTransferData({ sourceRFID: '', destinationRFID: '', amount: '' });
      setSelectedSourceCard(null);
      setSelectedDestCard(null);
      setShowTransferModal(false);

      if (activeTab === 'manage') {
        await loadAllCards();
      }
      
      if (activeTab === 'search') {
        await loadRegisteredUsers();
      }
    } catch (error) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferData({ sourceRFID: '', destinationRFID: '', amount: '' });
    setSelectedSourceCard(null);
    setSelectedDestCard(null);
    setSourceSearchResults([]);
    setDestSearchResults([]);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
  };

  // FILTERING AND SORTING FUNCTIONS
  const getFilteredAndSortedCards = (cards, search, sort, filter) => {
    let filtered = [...cards];

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(card =>
        card.rfid_uid.toLowerCase().includes(query) ||
        card.name.toLowerCase().includes(query) ||
        card.email.toLowerCase().includes(query)
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(card => card.status === filter);
    }

    filtered.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sort === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

    return filtered;
  };

  const filteredCards = getFilteredAndSortedCards(allCards, cardSearchQuery, sortBy, filterStatus);
  const filteredUsers = getFilteredAndSortedCards(registeredUsers, '', userTableSort, userTableFilter);

  return (
    <>
      <TopBar />
      <Sidebar />
      <div className="rfid-management">
        <h2>RFID Card Management System</h2>

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
                  className="rfid-input-field"
                  disabled={!!userData}
                />
                
                {showResults && searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleSelectUser(card)}
                        className="search-dropdown-item"
                      >
                        <div className="dropdown-item-name">{card.name}</div>
                        <div className="dropdown-item-details">
                          {card.rfid_uid} • ₱{card.balance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSearchUser} 
                disabled={isLoading || !!userData} 
                className="rfid1-btn-primary"
              >
                {isLoading ? '⏳ Searching...' : '🔍 Search'}
              </button>
              {userData && (
                <button onClick={handleClearSearch} className="rfid-btn-secondary">
                  ↻ New Search
                </button>
              )}
            </div>

            {userData && (
              <>
                <div className="user-card">
                  <h3>User Details</h3>
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
                      <span className="value balance-value">₱{userData.balance}</span>
                    </div>
                  </div>
                </div>

                <div className="topup-section">
                  <div className="topup-card">
                    <div className="current-balance">
                      <span>Current Balance:</span>
                      <span className="balance-number">₱{userData.balance}</span>
                    </div>

                    <div className="topup-form">
                      <label htmlFor="amount">Amount to Add:</label>
                      <div className="amount-input-group">
                        <span className="currency-symbol">₱</span>
                        <input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleTopup()}
                          min="1"
                          max={5000 - userData.balance}
                          className="input-field amount-input"
                        />
                      </div>

                      {topupAmount && (
                        <div className="topup-preview">
                          <p>New Balance: <strong>₱{userData.balance + parseInt(topupAmount || 0)}</strong></p>
                          {(userData.balance + parseInt(topupAmount || 0)) > 5000 && (
                            <p className="limit-warning">⚠️ Exceeds ₱5,000 limit!</p>
                          )}
                        </div>
                      )}
                      
                      <div className="balance-limit-info">
                        <small>💡 Maximum balance: ₱5,000 | Available to add: ₱{5000 - userData.balance}</small>
                      </div>
                    </div>

                    <div className="topup-actions">
                      <button 
                        onClick={handleTopup} 
                        disabled={isLoading || !topupAmount || (userData.balance + parseInt(topupAmount || 0)) > 5000} 
                        className="btn-success"
                      >
                        {isLoading ? '⏳ Processing...' : '✓ Confirm Top Up'}
                      </button>
                      <button 
                        onClick={() => setTopupAmount('')} 
                        disabled={isLoading} 
                        className="rfid-btn-secondary"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Registered Users Table */}
            <div className="app-registered-users-section">
              <div className="app-registered-users-header">
                <h3>📋 Registered Users</h3>
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="rfid-btn-primary"
                >
                Transfer Points
                </button>
              </div>

              <div className="app-sort-filter-controls">
                <div className="app-sort-filter-group">
                  <span className="app-sort-filter-label">Sort by:</span>
                  <select 
                    className="app-sort-filter-select"
                    value={userTableSort}
                    onChange={(e) => setUserTableSort(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="app-sort-filter-group">
                  <span className="app-sort-filter-label">Status:</span>
                  <select 
                    className="app-sort-filter-select"
                    value={userTableFilter}
                    onChange={(e) => setUserTableFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {filteredUsers.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className={`card-row status-${user.status}`}>
                          <td className="rfid-uid">{user.rfid_uid}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td className="balance">₱{user.balance}</td>
                          <td>
                            <span className={`status-badge status-${user.status}`}>
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="date">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No registered users found</p>
                </div>
              )}
            </div>
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
                  
                </div>

                {/* MODIFIED: Auto-generated password display - LOCKED */}
                <div className="form-group">
                  <label htmlFor="password">Password (Auto-generated - Locked)</label>
                  <div className="password-input-group">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newCardData.password}
                      className="input-field"
                      disabled={true}
                      readOnly
                      style={{ 
                        backgroundColor: '#f5f5f5', 
                        cursor: 'not-allowed',
                        color: '#666'
                      }}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>
                     Default password: <strong>paytap</strong> (Locked for security - Users can change this after login)
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleShowRegisterConfirm}
                    disabled={isLoading}
                    className="btn-success"
                  >
                    Register Card
                  </button>
                  <button
                    type="button"
                    onClick={clearRegisterForm}
                    disabled={isLoading}
                    className="rfid-btn-secondary"
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
              <div className="manage-actions">
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="rfid-btn-primary"
                >
                Transfer Points
                </button>
                <button 
                  onClick={loadTransferHistory}
                  disabled={isLoading}
                  className="rfid-btn-primary"
                >
                Transfer History
                </button>
                <button 
                  onClick={loadAllCards}
                  disabled={isLoading}
                  className="rfid-btn-secondary"
                >
                  {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            <div className="app-card-search-container">
              <span className="app-card-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by RFID UID, Name, or Email..."
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                className="app-card-search-input"
              />
            </div>

            <div className="app-sort-filter-controls">
              <div className="app-sort-filter-group">
                <span className="app-sort-filter-label">Sort by:</span>
                <select 
                  className="app-sort-filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <div className="app-sort-filter-group">
                <span className="app-sort-filter-label">Status:</span>
                <select 
                  className="app-sort-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {filteredCards.length > 0 ? (
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
                    {filteredCards.map((card) => (
                      <tr key={card.id} className={`card-row status-${card.status}`}>
                        <td className="rfid-uid">{card.rfid_uid}</td>
                        <td>{card.name}</td>
                        <td>{card.email}</td>
                        <td className="balance">₱{card.balance}</td>
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
                          <button
                            onClick={() => handleDeleteCard(card)}
                            disabled={isLoading}
                            className="btn-delete"
                          >
                            🗑️ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>{cardSearchQuery ? 'No cards match your search' : 'No cards registered yet'}</p>
                {!cardSearchQuery && (
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="rfid-btn-primary"
                  >
                    ➕ Register First Card
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
      </div>

      {/* MODIFIED: Register Confirmation Modal */}
      {showRegisterConfirm && (
        <div className="modal-overlay" onClick={() => setShowRegisterConfirm(false)}>
          <div className="modal-container app-confirm-register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Confirm Registration</h3>
              <button className="modal-close" onClick={() => setShowRegisterConfirm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="app-review-section">
                <h4 className="app-review-title">Card Information</h4>
                <div className="app-review-item">
                  <span className="app-review-label">RFID UID:</span>
                  <span className="app-review-value">{newCardData.rfidUID}</span>
                </div>
                <div className="app-review-item">
                  <span className="app-review-label">Full Name:</span>
                  <span className="app-review-value">{newCardData.name}</span>
                </div>
                <div className="app-review-item">
                  <span className="app-review-label">Email:</span>
                  <span className="app-review-value">{newCardData.email}</span>
                </div>
                <div className="app-review-item">
                  <span className="app-review-label">Password:</span>
                  <span className="app-review-value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {newCardData.password}
                  </span>
                </div>
              </div>

              <div className="app-review-note">
                <p>📝 Please review the information above carefully. Once confirmed, a new user account will be created with this RFID card.</p>
                <p style={{ marginTop: '10px', color: '#0066cc' }}>
                  🔐 The user can change their password after their first login.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleRegisterCard}
                disabled={isLoading}
                className="btn-success"
              >
                {isLoading ? '⏳ Registering...' : '✓ Confirm & Register'}
              </button>
              <button
                onClick={() => setShowRegisterConfirm(false)}
                disabled={isLoading}
                className="rfid-btn-secondary"
              >
                ✏️ Edit Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Points Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={closeTransferModal}>
          <div className="modal-container transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rfid-modal-header">
              <h3>Transfer Points</h3>
              <button className="modal-close" onClick={closeTransferModal}>✕</button>
            </div>
            
            <div className="rfid-modal-body">
              <div className="form-group">
                <label>Source Card (From) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by RFID UID or Name"
                    value={transferData.sourceRFID}
                    onChange={(e) => handleSourceSearch(e.target.value)}
                    className="input-field"
                    disabled={isLoading}
                  />
                  {selectedSourceCard && (
                    <div className="selected-card-info">
                      ✓ {selectedSourceCard.name} - Balance: ₱{selectedSourceCard.balance}
                    </div>
                  )}
                  {showSourceDropdown && sourceSearchResults.length > 0 && (
                    <div className="search-dropdown">
                      {sourceSearchResults.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => selectSourceCard(card)}
                          className="search-dropdown-item"
                        >
                          <div className="dropdown-item-name">{card.name}</div>
                          <div className="dropdown-item-details">
                            {card.rfid_uid} • ₱{card.balance}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Destination Card (To) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by RFID UID or Name"
                    value={transferData.destinationRFID}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    className="input-field"
                    disabled={isLoading}
                  />
                  {selectedDestCard && (
                    <div className="selected-card-info">
                      ✓ {selectedDestCard.name} - Balance: ₱{selectedDestCard.balance}
                    </div>
                  )}
                  {showDestDropdown && destSearchResults.length > 0 && (
                    <div className="search-dropdown">
                      {destSearchResults.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => selectDestCard(card)}
                          className="search-dropdown-item"
                        >
                          <div className="dropdown-item-name">{card.name}</div>
                          <div className="dropdown-item-details">
                            {card.rfid_uid} • ₱{card.balance}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Transfer Amount *</label>
                <div className="amount-input-group">
                  <span className="currency-symbol">₱</span>
                  <input
                    type="number"
                    placeholder="Enter amount to transfer"
                    value={transferData.amount}
                    onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    min="1"
                    className="input-field amount-input"
                    disabled={isLoading}
                  />
                </div>
                {selectedSourceCard && transferData.amount && (
                  <div className="transfer-preview">
                    <div className="preview-row">
                      <span>Source new balance:</span>
                      <strong>₱{selectedSourceCard.balance - parseInt(transferData.amount || 0)}</strong>
                    </div>
                    {selectedDestCard && (
                      <div className="preview-row">
                        <span>Destination new balance:</span>
                        <strong>₱{selectedDestCard.balance + parseInt(transferData.amount || 0)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rfid-modal-footer">
              <button
                onClick={handleTransferPoints}
                disabled={isLoading || !transferData.sourceRFID || !transferData.destinationRFID || !transferData.amount}
                className="btn-success"
              >
                {isLoading ? '⏳ Processing...' : '✓ Transfer Points'}
              </button>
              <button
                onClick={closeTransferModal}
                disabled={isLoading}
                className="rfid-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCard && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmCard(null)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Card Removal</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmCard(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="warning-text">Are you sure you want to remove this RFID card?</p>
              
              <div className="delete-card-details">
                <div className="detail-row">
                  <span className="label">RFID UID:</span>
                  <span className="value">{deleteConfirmCard.rfid_uid}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{deleteConfirmCard.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{deleteConfirmCard.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Balance:</span>
                  <span className="value">₱{deleteConfirmCard.balance}</span>
                </div>
              </div>

              <div className="warning-box">
                <p>⚠️ This will:</p>
                <ul>
                  <li>Remove the RFID card from this user</li>
                  <li>Keep the email account active</li>
                  <li>Allow this card to be registered to another user</li>
                  <li>Allow this email to register a new card</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={confirmDeleteCard}
                disabled={isLoading}
                className="btn-danger"
              >
                {isLoading ? '⏳ Removing...' : '🗑️ Yes, Remove Card'}
              </button>
              <button
                onClick={() => setDeleteConfirmCard(null)}
                disabled={isLoading}
                className="rfid-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer History Modal */}
      {showTransferHistory && (
        <div className="modal-overlay" onClick={() => setShowTransferHistory(false)}>
          <div className="modal-container" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 Transfer Points History</h3>
              <button className="modal-close" onClick={() => setShowTransferHistory(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '0' }}>
              {transferHistory.length > 0 ? (
                <div className="app-transfer-history-table-container">
                  <table className="app-transfer-history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferHistory.map((transfer, index) => (
                        <tr key={index}>
                          <td className="app-transfer-date">
                            {new Date(transfer.timestamp).toLocaleString()}
                          </td>
                          <td>{transfer.source_name || transfer.source_rfid}</td>
                          <td>{transfer.destination_name || transfer.destination_rfid}</td>
                          <td className="app-transfer-amount-negative">₱{transfer.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="app-transfer-empty-state">
                  <p>No transfer history found</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowTransferHistory(false)}
                className="rfid-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
       
    </>
  );
}

export default RFIDManagement;