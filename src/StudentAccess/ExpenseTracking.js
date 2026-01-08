import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  FaCalendarDay,
  FaCalendarAlt,
  FaReceipt,
  FaUtensils,
  FaCalendar,
} from 'react-icons/fa';
import { auth, posDb } from '../firebase/firebase';
import StudentSidebar from '../Components/studentsidebar';
import TopBar from '../Components/Topbar';
import '../Styles/ExpenseTracker.css';
import ExpenseMonitoringGraph from './ExpenseMonitoringGraph';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [filterLabel, setFilterLabel] = useState('');

  // --- MAIN EFFECT ---
  useEffect(() => {
    const unsubscribe = subscribeToExpenses();
    return () => unsubscribe && unsubscribe();
  }, [filterType, customRange]);

  // --- FIRESTORE SUBSCRIPTION ---
  const subscribeToExpenses = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('⚠️ No user logged in');
      return;
    }

    console.log('🔍 Querying orders for user:', currentUser.uid);
    setLoading(true);

    const ordersRef = collection(posDb, 'orders');
    
    // REMOVED paymentMethod filter - now shows ALL payments (GCash, PayTap, Cash)
    const constraints = [
      where('customerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
    ];

    const { start, end, label } = getDateRange(filterType, customRange);
    setFilterLabel(label);

    if (start && end) {
      constraints.push(where('createdAt', '>=', start));
      constraints.push(where('createdAt', '<=', end));
    }

    const q = query(ordersRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📊 Orders received:', snapshot.docs.length);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log('📋 Orders data:', data);
        setExpenses(data);
        updateSummary(data);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Firestore error:', error);
        setExpenses([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  // --- CALCULATE DATE RANGES ---
  const getDateRange = (type, custom) => {
    const now = new Date();
    let start = null;
    let end = null;
    let label = '';

    if (type === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = `Today, ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (type === 'custom' && custom.start && custom.end) {
      start = new Date(custom.start + 'T00:00:00');
      end = new Date(custom.end + 'T23:59:59');
      const startDate = new Date(custom.start);
      const endDate = new Date(custom.end);
      label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    return { start, end, label };
  };

  // --- SUMMARY UPDATE ---
  const updateSummary = (data) => {
    const total = data.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
    setSummary({ total, count: data.length });
  };

  // --- IMPROVED DATE FORMATTER ---
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle milliseconds timestamp
    else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    }
    // Handle string timestamp
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Handle timestamp with seconds and nanoseconds
    else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    else {
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format with full date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleApplyCustomRange = () => {
    if (customRange.start && customRange.end) {
      setFilterType('custom');
    } else {
      alert('Please select both start and end dates');
    }
  };

  return (
    <div className="App">
      <TopBar />
      <StudentSidebar />

      <div className="main-content">
        <div className="expense-tracker-container">
          {/* Header */}
          <div className="expense-header">
            <h1 className="expense-title">Food Expense Tracking</h1>
            <p className="expense-subtitle">{filterLabel}</p>
          </div>

          {/* FILTER SECTION WITH ANALYTICS BUTTON */}
          <div className="filter-section">
            <div className="quick-filters">
              <button
                className={`filter-btn ${filterType === 'today' ? 'active' : ''}`}
                onClick={() => setFilterType('today')}
              >
                <FaCalendarDay className="filter-icon" />
                <span>Today</span>
              </button>
              
              <button
                className={`filter-btn ${filterType === 'month' ? 'active' : ''}`}
                onClick={() => setFilterType('month')}
              >
                <FaCalendarAlt className="filter-icon" />
                <span>This Month</span>
              </button>

              {/* VIEW ANALYTICS BUTTON - Added here */}
              <div style={{ marginLeft: 'auto' }}>
                <ExpenseMonitoringGraph expenses={expenses} />
              </div>
            </div>

            {/* CUSTOM RANGE */}
            <div className="custom-range-section">
              <div className="custom-range-label">
                <FaCalendar className="range-icon" />
                <span>Custom</span>
              </div>
              <div className="date-inputs">
                <input
                  type="date"
                  className="date-input"
                  value={customRange.start}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="date-input"
                  value={customRange.end}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
                <button
                  className="apply-btn"
                  onClick={handleApplyCustomRange}
                  disabled={!customRange.start || !customRange.end}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="summary-cards">
            <div className="summary-card blue">
              <div className="summary-card-header">
                <span>Total Spent</span>
                <FaUtensils className="summary-card-icon" />
              </div>
              <p className="summary-card-value">₱{summary.total.toFixed(2)}</p>
            </div>
            <div className="summary-card green">
              <div className="summary-card-header">
                <span>Total Orders</span>
                <FaReceipt className="summary-card-icon" />
              </div>
              <p className="summary-card-value">{summary.count}</p>
            </div>
          </div>

          {/* TRANSACTION TABLE */}
          <div className="transactions-container">
            <div className="transactions-header">
              <h2>Purchase History</h2>
              <p>{expenses.length} {expenses.length === 1 ? 'order' : 'orders'}</p>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading purchases...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="empty-state">
                <FaUtensils className="empty-icon" />
                <p>No purchases found for this period.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Business Name</th>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="date-cell">{formatDate(e.createdAt)}</td>
                        <td className="business-name-cell">
                          {e.businessName || 'N/A'}
                        </td>
                        <td className="order-id-cell">{e.orderId}</td>
                        <td>
                          {e.items?.map((item, i) => (
                            <div key={i} className="item-row">
                              {item.name} — ₱{item.price} × {item.qty}
                            </div>
                          ))}
                        </td>
                        <td className="text-right amount-cell">
                          ₱{e.totalAmount?.toFixed(2) || '0.00'}
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
    </div>
  );
};

export default ExpenseTracker;