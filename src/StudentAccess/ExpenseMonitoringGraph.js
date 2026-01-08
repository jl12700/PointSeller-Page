import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, X, BarChart3 } from 'lucide-react';

const ExpenseMonitoringGraph = ({ expenses = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('all');
  const [chartData, setChartData] = useState([]);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    trend: 0,
    isOverSpending: false
  });

  useEffect(() => {
    if (isOpen) {
      processExpenseData();
    }
  }, [expenses, timeframe, customRange, isOpen]);

  const processExpenseData = () => {
    if (!expenses || expenses.length === 0) {
      setChartData([]);
      setStats({
        average: 0,
        highest: 0,
        lowest: 0,
        trend: 0,
        isOverSpending: false
      });
      return;
    }

    let filteredExpenses = [...expenses];
    let data = [];
    let groupedExpenses = {};

    // Apply additional time filtering based on timeframe selection
    if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      filteredExpenses = expenses.filter(expense => {
        let date = convertToDate(expense.createdAt);
        return date >= sevenDaysAgo;
      });
    } else if (timeframe === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filteredExpenses = expenses.filter(expense => {
        let date = convertToDate(expense.createdAt);
        return date >= thirtyDaysAgo;
      });
    } else if (timeframe === 'yearly') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      filteredExpenses = expenses.filter(expense => {
        let date = convertToDate(expense.createdAt);
        return date >= oneYearAgo;
      });
    } else if (timeframe === 'custom' && customRange.start && customRange.end) {
      const startDate = new Date(customRange.start + 'T00:00:00');
      const endDate = new Date(customRange.end + 'T23:59:59');

      filteredExpenses = expenses.filter(expense => {
        let date = convertToDate(expense.createdAt);
        return date >= startDate && date <= endDate;
      });
    }
    // else timeframe === 'all', use all expenses

    filteredExpenses.forEach(expense => {
      let date = convertToDate(expense.createdAt);
      const amount = expense.totalAmount || 0;
      let key;

      if (timeframe === 'weekly' || timeframe === 'custom') {
        // Group by day
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        key = `${dayName}, ${dateStr}`;
      } else if (timeframe === 'monthly') {
        // Group by week
        const weekNum = Math.ceil(date.getDate() / 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        key = `${monthName} Week ${weekNum}`;
      } else if (timeframe === 'yearly') {
        // Group by month
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        // 'all' - group by month
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      if (!groupedExpenses[key]) {
        groupedExpenses[key] = { amount: 0, count: 0 };
      }
      groupedExpenses[key].amount += amount;
      groupedExpenses[key].count += 1;
    });

    // Convert to array with date for sorting
    data = Object.entries(groupedExpenses).map(([period, values]) => {
      // Extract the first expense date from this period for sorting
      const firstExpense = filteredExpenses.find(exp => {
        let date = convertToDate(exp.createdAt);
        let key;
        
        if (timeframe === 'weekly' || timeframe === 'custom') {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          key = `${dayName}, ${dateStr}`;
        } else if (timeframe === 'monthly') {
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          key = `${monthName} Week ${weekNum}`;
        } else if (timeframe === 'yearly') {
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        return key === period;
      });
      
      return {
        period,
        amount: parseFloat(values.amount.toFixed(2)),
        count: values.count,
        average: parseFloat((values.amount / values.count).toFixed(2)),
        sortDate: firstExpense ? convertToDate(firstExpense.createdAt) : new Date()
      };
    });

    // Sort data chronologically (ascending - oldest to newest)
    data.sort((a, b) => a.sortDate - b.sortDate);

    // Calculate statistics
    if (data.length === 0) {
      setChartData([]);
      setStats({
        average: 0,
        highest: 0,
        lowest: 0,
        trend: 0,
        isOverSpending: false
      });
      return;
    }

    const amounts = data.map(d => d.amount);
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    const average = amounts.length > 0 ? total / amounts.length : 0;
    const highest = Math.max(...amounts, 0);
    const lowest = Math.min(...amounts.filter(a => a > 0), 0) || 0;

    // Calculate trend (comparing recent half vs older half)
    const midpoint = Math.floor(data.length / 2);
    const recentAvg = data.slice(midpoint).reduce((sum, d) => sum + d.amount, 0) / (data.length - midpoint || 1);
    const olderAvg = data.slice(0, midpoint).reduce((sum, d) => sum + d.amount, 0) / (midpoint || 1);
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    // Determine if overspending (spending more than 20% above average)
    const isOverSpending = recentAvg > average * 1.2;

    setStats({
      average: parseFloat(average.toFixed(2)),
      highest: parseFloat(highest.toFixed(2)),
      lowest: parseFloat(lowest.toFixed(2)),
      trend: parseFloat(trend.toFixed(1)),
      isOverSpending
    });

    setChartData(data);
  };

  // Helper function to convert various timestamp formats to Date
  const convertToDate = (timestamp) => {
    if (!timestamp) return new Date();
    
    // Handle Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } 
    // Handle milliseconds timestamp (number)
    else if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    // Handle Firestore timestamp with seconds property
    else if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    // Handle string or Date object
    else {
      return new Date(timestamp);
    }
  };

  const handleApplyCustomRange = () => {
    if (customRange.start && customRange.end) {
      setTimeframe('custom');
    } else {
      alert('Please select both start and end dates');
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>
            {payload[0].payload.period}
          </p>
          <p style={{ margin: '4px 0', color: '#3b82f6', fontWeight: '500' }}>
            Total: ₱{payload[0].value.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
            Orders: {payload[0].payload.count}
          </p>
          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
            Avg: ₱{payload[0].payload.average.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* View Analytics Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }}
      >
        <BarChart3 size={20} />
        View Analytics
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          {/* Modal Content */}
          <div 
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: '16px',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              borderRadius: '16px 16px 0 0',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' }}>
                  Expense Analytics
                </h2>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  Track your spending patterns and identify trends
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <X size={20} color="#374151" />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Category Filter */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  Select Time Period
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => setTimeframe('all')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: timeframe === 'all' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: timeframe === 'all' ? '#eff6ff' : 'white',
                      color: timeframe === 'all' ? '#3b82f6' : '#374151',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    All Time
                  </button>

                  <button
                    onClick={() => setTimeframe('weekly')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: timeframe === 'weekly' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: timeframe === 'weekly' ? '#eff6ff' : 'white',
                      color: timeframe === 'weekly' ? '#3b82f6' : '#374151',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Last 7 Days
                  </button>
                  
                  <button
                    onClick={() => setTimeframe('monthly')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: timeframe === 'monthly' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: timeframe === 'monthly' ? '#eff6ff' : 'white',
                      color: timeframe === 'monthly' ? '#3b82f6' : '#374151',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Last 30 Days
                  </button>

                  <button
                    onClick={() => setTimeframe('yearly')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: timeframe === 'yearly' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: timeframe === 'yearly' ? '#eff6ff' : 'white',
                      color: timeframe === 'yearly' ? '#3b82f6' : '#374151',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Last Year
                  </button>
                </div>
              </div>

              {/* Custom Date Range Selector */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Custom Date Range
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      minWidth: '150px'
                    }}
                  />
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>to</span>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      minWidth: '150px'
                    }}
                  />
                  <button
                    onClick={handleApplyCustomRange}
                    disabled={!customRange.start || !customRange.end}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: (!customRange.start || !customRange.end) ? '#d1d5db' : '#3b82f6',
                      color: 'white',
                      fontWeight: '500',
                      cursor: (!customRange.start || !customRange.end) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Apply Range
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Average Spending</span>
                    <DollarSign size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    ₱{stats.average.toFixed(2)}
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Highest Spending</span>
                    <TrendingUp size={20} style={{ color: '#ef4444' }} />
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    ₱{stats.highest.toFixed(2)}
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Spending Trend</span>
                    {stats.trend > 0 ? (
                      <TrendingUp size={20} style={{ color: '#ef4444' }} />
                    ) : (
                      <TrendingDown size={20} style={{ color: '#10b981' }} />
                    )}
                  </div>
                  <p style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: stats.trend > 0 ? '#ef4444' : '#10b981',
                    margin: 0 
                  }}>
                    {stats.trend > 0 ? '+' : ''}{stats.trend}%
                  </p>
                </div>
              </div>

              {/* Alert for Overspending */}
              {stats.isOverSpending && chartData.length > 0 && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#991b1b' }}>
                      Overspending Alert
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>
                      Your recent spending is {Math.abs(stats.trend)}% higher than your average. 
                      Consider reviewing your expenses to stay on budget.
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                {chartData.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    color: '#6b7280'
                  }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '16px' }}>No expense data available for this period</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Try selecting a different time range</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      margin: '0 0 20px 0' 
                    }}>
                      Spending Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="period" 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `₱${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="average" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Average per order"
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    {/* Bar Chart Alternative */}
                    <div style={{ marginTop: '32px' }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        margin: '0 0 20px 0' 
                      }}>
                        Order Count Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="period" 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>

              {/* Insights Section */}
              {chartData.length > 0 && (
                <div style={{
                  marginTop: '24px',
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1f2937', 
                    margin: '0 0 16px 0' 
                  }}>
                    Spending Insights
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', lineHeight: '1.8' }}>
                    <li>
                      Your average spending is ₱{stats.average.toFixed(2)} per period
                    </li>
                    <li>
                      Highest spending period reached ₱{stats.highest.toFixed(2)}
                    </li>
                    <li>
                      {stats.trend > 0 ? (
                        <span>
                          ⚠️ Spending is <strong style={{ color: '#ef4444' }}>increasing by {stats.trend}%</strong> compared to earlier periods
                        </span>
                      ) : stats.trend < 0 ? (
                        <span>
                          ✓ Spending is <strong style={{ color: '#10b981' }}>decreasing by {Math.abs(stats.trend)}%</strong> compared to earlier periods
                        </span>
                      ) : (
                        <span>Spending remains stable across periods</span>
                      )}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseMonitoringGraph;