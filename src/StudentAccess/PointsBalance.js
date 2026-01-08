import '../Styles/PointsBalance.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { supabase } from '../Supabase/supabaseClient';
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import { toast } from 'react-toastify';

function PointsBalance() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's RFID card data
  const fetchCardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching card for Firebase UID:', user.uid);
      console.log('User email:', user.email);

      // First try to find by firebase_uid
      let { data, error } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('firebase_uid', user.uid);

      console.log('Query by firebase_uid result:', data);

      // If no result by firebase_uid, try by email
      if (!data || data.length === 0) {
        console.log('No card found by firebase_uid, trying by email...');
        const result = await supabase
          .from('rfid_cards')
          .select('*')
          .eq('email', user.email);
        
        data = result.data;
        error = result.error;
        console.log('Query by email result:', data);
      }

      if (error) {
        console.error('Error fetching card:', error);
        toast.error('Failed to load card information');
        return;
      }

      if (!data || data.length === 0) {
        console.error('No card found for this user');
        setCardData(null);
        return;
      }

      // Take the first matching card
      setCardData(data[0]);
      console.log('Card data loaded:', data[0]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('An error occurred while loading your card');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCardData();
  };

  const handleAddBalance = () => {
    navigate('/topup');
  };

  if (isLoading) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="points-balance">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your card information...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="points-balance">
          <div className="error-container">
            <div className="error-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>Please log in to view your balance</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!cardData) {
    return (
      <>
        <TopBar />
        <StudentSidebar />
        <div className="points-balance">
          <div className="error-container">
            <div className="error-icon">💳</div>
            <h3>No Card Found</h3>
            <p>You don't have an RFID card registered yet</p>
            <button 
              onClick={() => navigate('/rfid-management')}
              className="btn-primary"
            >
              Register Card
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <StudentSidebar />
      <div className="points-balance">
        <div className="points-balance-header">
          <h2>💰 PayTap Balance</h2>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-refresh"
            title="Refresh balance"
          >
            {refreshing ? '⏳' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Main Balance Display Card */}
        <div className="balance-card">
          <div className="card-header">
            <div className="card-chip">
              <div className="chip-icon">💳</div>
            </div>
            <div className="card-logo">PayTap</div>
          </div>

          <div className="card-balance-section">
            <p className="balance-label">Available Balance</p>
            <div className="balance-amount">
              <span className="currency">₱</span>
              <span className="amount">{cardData.balance.toLocaleString()}</span>
              <span className="points-label">points</span>
            </div>
          </div>

          <div className="card-footer">
            <div className="rfid-card-detail">
              <span className="rfid-detail-label">Card Number</span>
              <span className="rfid-detail-value rfid-number">{cardData.rfid_uid}</span>
            </div>
            <div className="card-status">
              <span className={`status-indicator ${cardData.status}`}>
                {cardData.status === 'active' ? '✓ Active' : '⚠ Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Add Balance Button */}
        <div className="action-button-container">
          <button 
            onClick={handleAddBalance}
            className="btn-add-balance-main"
            disabled={cardData.status !== 'active'}
          >
            <span className="add-btn-icon">➕</span>
            Add Balance
          </button>
          {cardData.status !== 'active' && (
            <p className="inactive-warning">
              ⚠️ Card is inactive. Please contact administration.
            </p>
          )}
        </div>

        {/* Quick Stats Section */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <p className="stat-label">Current Balance</p>
              <p className="stat-value">{cardData.balance} pts</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Card Status</p>
              <p className="stat-value">{cardData.status}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-content">
              <p className="stat-label">Card ID</p>
              <p className="stat-value">{cardData.rfid_uid}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PointsBalance;