import './App.css';
import CashConversion from './Features/CashConversion';
import TopupManagement from './Features/TopupManagement';
import Login from './Components/login';
import VendorRegistration from './Components/VendorRegistration';
import CardApplication from './Components/CardApplication';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RFIDManagement from './Features/RFIDManagement';
import VendorApplicationsDisplay from './Features/VendorRequests';
import AdminCardApplication from './Features/AdminCardApplication';
import AdminLogin from './Components/adminlogin';
import PointsTopup from './StudentAccess/PointsTopUp';
import ExpenseTracking from './StudentAccess/ExpenseTracking';
import ForgotPassword from './StudentAccess/ForgotPassword';
import TransactionHistory from './Features/TransactionHistory';
import SupportRequest from './StudentAccess/SupportRequest';
import AdminSupportDashboard from './Features/AdminSupportDashboard';
import PointsBalance from './StudentAccess/PointsBalance';
import EditProfile from './StudentAccess/EditProfile';
import ProtectedRoute from './Components/ProtectedRoute';
import POSManagement from './Features/POSManagement';
import StallsReport from './Features/StallsReport';

function AppLayout() {
  return (
    <>
      <Routes>
        {/* ========================================
            PUBLIC ROUTES (No authentication required)
        ======================================== */}
        <Route path="/AdminLogin" element={<AdminLogin />} />  
        <Route path="/login" element={<Login />} />  
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} /> 
        <Route path="/card-application" element={<CardApplication />} /> 
        
        {/* ========================================
            STUDENT/USER ROUTES (Authentication required)
            These routes are accessible by logged-in users
        ======================================== */}
        <Route 
          path="/Topup" 
          element={
            <ProtectedRoute redirectTo="/login">
              <PointsTopup />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Expense" 
          element={
            <ProtectedRoute redirectTo="/login">
              <ExpenseTracking />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Balance" 
          element={
            <ProtectedRoute redirectTo="/login">
              <PointsBalance />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Profile" 
          element={
            <ProtectedRoute redirectTo="/login">
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Support" 
          element={
            <ProtectedRoute redirectTo="/login">
              <SupportRequest />
            </ProtectedRoute>
          } 
        />
        
        {/* ========================================
            ADMIN ROUTES (Admin role required)
            Only users with role='admin' can access
        ======================================== */}
        <Route 
          path="/CashConvert" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <CashConversion />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/TransHistory" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <TransactionHistory />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/AdminTopup" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <TopupManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Register" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <VendorApplicationsDisplay />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/CardManage" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <RFIDManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/CardApplications" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <AdminCardApplication />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/AdminSupport" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <AdminSupportDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/POSManagement" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
              <POSManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
  path="/StallsReport" 
  element={
    <ProtectedRoute requiredRole="admin" redirectTo="/AdminLogin">
      <StallsReport />
    </ProtectedRoute>
  } 
/>

        
        {/* ========================================
            CATCH ALL ROUTE
            Redirect to login for any undefined routes
        ======================================== */}
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;