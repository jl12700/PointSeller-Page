import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaChartBar, 
  FaTrophy, 
  FaArrowUp, 
  FaArrowDown,
  FaCalendarAlt,
  FaStore,
  FaReceipt,
  FaCoins,
  FaFilter,
  FaDownload,
  FaSync,
  FaPrint,
  FaChartLine,
  FaInfinity
} from 'react-icons/fa';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Styles/StallsReport.css';
import { posDb as db } from '../firebase/firebase';
import Sidebar from '../Components/Sidebar';
import TopBar from '../Components/Topbar';

/**
 * PayTap Stalls Report Component
 * Displays comprehensive sales analytics for all cafeteria stalls
 * Features: Firebase integration, sorting, filtering, performance metrics, and export
 * 
 * ENHANCED FEATURES:
 * - Performance comparison analytics (bar/line charts)
 * - All-time sales mode (date-independent view)
 */
const StallsReport = () => {
  // ==================== STATE MANAGEMENT ====================
  const [stallsData, setStallsData] = useState([]);
  const [sortBy, setSortBy] = useState('highest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW: View mode and chart visibility
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'all-time'
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'

  // ==================== FETCH DATA FROM FIREBASE ====================
  
  useEffect(() => {
    fetchStallsReport();
  }, [selectedDate, viewMode]); // Re-fetch when date or mode changes

  /**
   * ENHANCED: Fetch all orders and aggregate by vendor/stall
   * Now supports both daily and all-time modes
   */
  const fetchStallsReport = async () => {
    setIsLoading(true);
    try {
      console.log(`📊 Fetching stalls report (${viewMode} mode) for date:`, selectedDate);

      // Fetch all orders
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      // Aggregate orders by vendor
      const vendorMap = new Map();

      querySnapshot.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() };
        
        // Filter by selected date ONLY if in 'daily' mode
        let includeOrder = true;
        if (viewMode === 'daily' && order.createdAt) {
          const targetDate = new Date(selectedDate);
          targetDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(targetDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          includeOrder = (orderDate >= targetDate && orderDate < nextDay);
        }
        
        if (includeOrder) {
          const vendorId = order.vendorId;
          
          if (!vendorMap.has(vendorId)) {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            vendorMap.set(vendorId, {
              id: vendorId,
              businessName: order.businessName || order.storeName || 'Unknown Stall',
              category: order.category || 'General',
              totalSales: 0,
              transactionCount: 0,
              pointsEarned: 0,
              pointsRedeemed: 0,
              orders: [],
              startTime: orderDate,
              endTime: orderDate
            });
          }

          const vendorData = vendorMap.get(vendorId);
          
          // Only count completed orders for sales
          if (order.status?.toLowerCase() === 'completed') {
            vendorData.totalSales += order.totalAmount || 0;
            vendorData.transactionCount += 1;
            
            // Calculate points (1 point per peso)
            vendorData.pointsEarned += Math.floor(order.totalAmount || 0);
            
            // Track points redeemed if available
            if (order.pointsUsed) {
              vendorData.pointsRedeemed += order.pointsUsed;
            }
          }

          // Track earliest and latest order times
          const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          if (orderDate < vendorData.startTime) {
            vendorData.startTime = orderDate;
          }
          if (orderDate > vendorData.endTime) {
            vendorData.endTime = orderDate;
          }

          vendorData.orders.push(order);
        }
      });

      // Convert map to array
      const stallsArray = Array.from(vendorMap.values());
      
      console.log('📦 Processed stalls data:', stallsArray.length, 'stalls');
      setStallsData(stallsArray);
    } catch (error) {
      console.error('❌ Error fetching stalls report:', error);
      setStallsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== COMPUTED VALUES ====================
  
  const overallStats = {
    totalSales: stallsData.reduce((sum, stall) => sum + stall.totalSales, 0),
    totalTransactions: stallsData.reduce((sum, stall) => sum + stall.transactionCount, 0),
    totalPointsEarned: stallsData.reduce((sum, stall) => sum + stall.pointsEarned, 0),
    totalPointsRedeemed: stallsData.reduce((sum, stall) => sum + stall.pointsRedeemed, 0),
    totalStalls: stallsData.length
  };

  const categories = ['all', ...new Set(stallsData.map(stall => stall.category))];

  // ==================== DATA PROCESSING ====================
  
  const getProcessedData = () => {
    let filtered = [...stallsData];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(stall => stall.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(stall => 
        stall.businessName.toLowerCase().includes(query) 
        
      );
    }

    switch (sortBy) {
      case 'highest':
        filtered.sort((a, b) => b.totalSales - a.totalSales);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.totalSales - b.totalSales);
        break;
      case 'transactions':
        filtered.sort((a, b) => b.transactionCount - a.transactionCount);
        break;
      case 'default':
      default:
        filtered.sort((a, b) => a.businessName.localeCompare(b.businessName));
        break;
    }

    return filtered;
  };

  const processedData = getProcessedData();
  const topPerformer = processedData.length > 0 ? processedData[0] : null;
  const bottomPerformer = processedData.length > 0 ? processedData[processedData.length - 1] : null;

  // ==================== NEW: CHART DATA ====================
  
  /**
   * Prepare comparison data for analytics chart
   * Compares top vs bottom performer
   */
  const chartData = useMemo(() => {
    if (!topPerformer || !bottomPerformer || processedData.length < 2) {
      return null;
    }

    return [
      {
        name: topPerformer.businessName.length > 20 
          ? topPerformer.businessName.substring(0, 20) + '...' 
          : topPerformer.businessName,
        'Total Sales (₱)': topPerformer.totalSales,
        'Transactions': topPerformer.transactionCount,
      },
      {
        name: bottomPerformer.businessName.length > 20 
          ? bottomPerformer.businessName.substring(0, 20) + '...' 
          : bottomPerformer.businessName,
        'Total Sales (₱)': bottomPerformer.totalSales,
        'Transactions': bottomPerformer.transactionCount,
      }
    ];
  }, [topPerformer, bottomPerformer, processedData]);

  // ==================== EVENT HANDLERS ====================
  
  const handleRefresh = () => {
    fetchStallsReport();
  };

  const handleExport = () => {
    const headers = ['Stall Name', 'Vendor', 'Total Sales', 'Transactions', 'Points Earned', 'Points Redeemed', 'Category'];
    const rows = processedData.map(stall => [
      stall.businessName,
      stall.totalSales.toFixed(2),
      stall.transactionCount,
      stall.pointsEarned,
      stall.pointsRedeemed,
      stall.category
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stalls-report-${viewMode === 'daily' ? selectedDate : 'all-time'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (processedData.length === 0) {
      alert('No stalls data available to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stalls Report - ${viewMode === 'daily' ? selectedDate : 'All Time'}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; padding: 20px; }
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 30px;
            background: white;
            color: #000;
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            color: #000;
            font-weight: bold;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }
          .summary-card p {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            color: #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 12px;
          }
          th {
            background: #000;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-row {
            font-weight: bold;
            background: #e8f5e9 !important;
            border-top: 2px solid #4caf50;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>STALLS SALES REPORT</h1>
          <p>PayTap Cafeteria System</p>
          <p>${viewMode === 'daily' 
            ? `Report Date: ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
            : 'All-Time Sales Report'
          }</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Sales</h3>
            <p>₱${overallStats.totalSales.toFixed(2)}</p>
          </div>
          <div class="summary-card">
            <h3>Transactions</h3>
            <p>${overallStats.totalTransactions}</p>
          </div>
          <div class="summary-card">
            <h3>Points Earned</h3>
            <p>${overallStats.totalPointsEarned}</p>
          </div>
          <div class="summary-card">
            <h3>Points Redeemed</h3>
            <p>${overallStats.totalPointsRedeemed}</p>
          </div>
          <div class="summary-card">
            <h3>Active Stalls</h3>
            <p>${overallStats.totalStalls}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 25%;">Stall Name</th>
              <th style="width: 20%;">Vendor</th>
              <th style="width: 15%;">Category</th>
              <th style="width: 10%; text-align: right;">Sales</th>
              <th style="width: 10%; text-align: right;">Transactions</th>
              <th style="width: 10%; text-align: right;">Points +</th>
              <th style="width: 10%; text-align: right;">Points -</th>
            </tr>
          </thead>
          <tbody>
            ${processedData.map((stall, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${stall.businessName}</strong></td>
                <td>${stall.category}</td>
                <td style="text-align: right;"><strong>₱${stall.totalSales.toFixed(2)}</strong></td>
                <td style="text-align: right;">${stall.transactionCount}</td>
                <td style="text-align: right;">+${stall.pointsEarned}</td>
                <td style="text-align: right;">-${stall.pointsRedeemed}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><strong>TOTALS:</strong></td>
              <td style="text-align: right;"><strong>₱${overallStats.totalSales.toFixed(2)}</strong></td>
              <td style="text-align: right;"><strong>${overallStats.totalTransactions}</strong></td>
              <td style="text-align: right;"><strong>+${overallStats.totalPointsEarned}</strong></td>
              <td style="text-align: right;"><strong>-${overallStats.totalPointsRedeemed}</strong></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const formatDateRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // ==================== RENDER ====================
  
  return (
    
    <div className="main-content">
        <Sidebar />
      <div className="stalls-report-container">
          <TopBar />
      {/* Header Section */}
      <div className="report-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="report-title">
              <FaChartBar className="title-icon" />
              Stalls Sales Report
            </h1>
            <p className="report-subtitle">Comprehensive stall performance analytics</p>
          </div>
          
          <div className="header-actions">
            <button 
              className="action-btn refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <FaSync className={isLoading ? 'spinning' : ''} />
              Refresh
            </button>
            <button 
              className="action-btn export-btn"
              onClick={handleExport}
              disabled={processedData.length === 0}
            >
              <FaDownload />
              Export CSV
            </button>
            <button 
              className="action-btn print-btn"
              onClick={printReport}
              disabled={processedData.length === 0}
            >
              <FaPrint />
              Print Report
            </button>
            {/* NEW: Analytics Button */}
            <button 
              className="action-btn analytics-btn"
              onClick={() => setShowChart(!showChart)}
              disabled={processedData.length < 2}
            >
              <FaChartLine />
              {showChart ? 'Hide' : 'Show'} Analytics
            </button>
          </div>
        </div>

        {/* NEW: View Mode Toggle + Date Selector */}
        <div className="date-controls-wrapper">
          {/* View Mode Selector */}
          <div className="view-mode-selector">
            <button
              className={`mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              <FaCalendarAlt />
              Daily Sales
            </button>
            <button
              className={`mode-btn ${viewMode === 'all-time' ? 'active' : ''}`}
              onClick={() => setViewMode('all-time')}
            >
              <FaInfinity />
              All-Time Sales
            </button>
          </div>

          {/* Date Selector */}
          <div className={`date-selector ${viewMode === 'all-time' ? 'disabled' : ''}`}>
            <FaCalendarAlt className="date-icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
              max={new Date().toISOString().split('T')[0]}
              disabled={viewMode === 'all-time'}
            />
          </div>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card active-stalls">
          <div className="stat-content">
            <p className="stat-label">Active Stalls</p>
            <p className="stat-value">{overallStats.totalStalls}</p>
          </div>
        </div>
      </div>

      {/* NEW: ANALYTICS CHART SECTION */}
      {showChart && chartData && sortBy === 'highest' && (
        <div className="analytics-section">
          <div className="analytics-header">
            <h2 className="analytics-title">
              <FaChartLine className="chart-icon" />
              Performance Comparison Analytics
            </h2>
            <div className="chart-type-toggle">
              <button
                className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                <FaChartBar /> Bar Chart
              </button>
              <button
                className={`chart-toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                <FaChartLine /> Line Chart
              </button>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Total Sales (₱)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Transactions', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [
                      name === 'Total Sales (₱)' ? `₱${value.toFixed(2)}` : value,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="Total Sales (₱)" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Total Sales (₱)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Transactions', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [
                      name === 'Total Sales (₱)' ? `₱${value.toFixed(2)}` : value,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="Total Sales (₱)" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Transactions" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top & Bottom Performers */}
      {topPerformer && bottomPerformer && sortBy === 'highest' && processedData.length > 1 && (
        <div className="performance-highlights">
          <div className="performer-card top-performer">
            <div className="performer-badge">
              <FaTrophy className="trophy-icon" />
              <span>Top Performer</span>
            </div>
            <h3 className="performer-name">{topPerformer.businessName}</h3>
            <p className="performer-sales">₱{topPerformer.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="performer-transactions">{topPerformer.transactionCount} transactions</p>
          </div>

          <div className="performer-card bottom-performer">
            <div className="performer-badge">
              <FaArrowDown className="arrow-icon" />
              <span>Low Performer</span>
            </div>
            <h3 className="performer-name">{bottomPerformer.businessName}</h3>
            <p className="performer-sales">₱{bottomPerformer.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="performer-transactions">{bottomPerformer.transactionCount} transactions</p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="stalls-search-box">
          <input
            type="text"
            placeholder="Search by stall or vendor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="stalls-search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="stalls-filter-group">
            <label className="stalls-filter-label">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="default">Default Order</option>
              <option value="highest">Highest Sales</option>
              <option value="lowest">Lowest Sales</option>
              <option value="transactions">Most Transactions</option>
            </select>
          </div>

          <div className="stalls-filter-group">
            <label className="stalls-filter-label">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stalls Data Table */}
      <div className="stalls-table-container">
        {isLoading ? (
          <div className="loading-state">
            <FaSync className="spinning" />
            <p>Loading data...</p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="empty-state">
            <FaStore className="empty-icon" />
            <p>No stalls found matching your criteria</p>
          </div>
        ) : (
          <table className="stalls-table">
            <thead>
              <tr>
                <th className="table-header rank-col">#</th>
                <th className="table-header stall-col">Stall Information</th>
                <th className="table-header sales-col">Total Sales</th>
                <th className="table-header transactions-col">Transactions</th>
                <th className="table-header points-col">Points Earned</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((stall, index) => (
                <tr key={stall.id} className="table-row">
                  <td className="table-cell rank-cell">
                    {sortBy === 'highest' && index === 0 && (
                      <FaTrophy className="rank-trophy gold" />
                    )}
                    {sortBy === 'highest' && index === 1 && (
                      <FaTrophy className="rank-trophy silver" />
                    )}
                    {sortBy === 'highest' && index === 2 && (
                      <FaTrophy className="rank-trophy bronze" />
                    )}
                    {(sortBy !== 'highest' || index > 2) && (
                      <span className="rank-number">{index + 1}</span>
                    )}
                  </td>
                  
                  <td className="table-cell stall-info-cell">
                    <div className="stall-info">
                      <p className="business-name">{stall.businessName}</p>
                      <span className="category-badge">{stall.category}</span>
                    </div>
                  </td>
                  
                  <td className="table-cell sales-cell">
                    <span className="sales-amount">
                      ₱{stall.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  
                  <td className="table-cell transactions-cell">
                    <span className="transaction-count">{stall.transactionCount}</span>
                  </td>
                  
                  <td className="table-cell points-cell">
                    <span className="points-earned">+{stall.pointsEarned} pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      <div className="report-footer">
        <p className="footer-text">
          Showing {processedData.length} of {stallsData.length} stalls
          {filterCategory !== 'all' && ` • Filtered by: ${filterCategory}`}
          {searchQuery && ` • Search: "${searchQuery}"`}
        </p>
        <p className="footer-timestamp">
          Report generated: {new Date().toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          })}
        </p>
      </div>
    </div>
    </div>
  );
};

export default StallsReport;