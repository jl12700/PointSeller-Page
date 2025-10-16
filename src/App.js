import './App.css';
import CashConversion from './Features/CashConversion';
import TopupManagement from './Features/TopupManagement';
import Login from './Components/login';
import VendorRegistration from './Components/VendorRegistration';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import RFIDManagement from './Features/RFIDManagement';
import VendorApplicationsDisplay from './Features/VendorRequests'; // ✅ imported correctly
import AdminLogin from './Components/adminlogin';
import PointsTopup from './StudentAccess/PointsTopUp';
import Expense from './StudentAccess/ExpenseTracking';
import TransactionHistory from './Features/TransactionHistory';

function AppLayout() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/AdminLogin" element={<AdminLogin />} />  
        <Route path="/login" element={<Login />} />  
        <Route path="/Expense" element={<Expense />} />  
        <Route path="/Topup" element={<PointsTopup />} />  
        <Route path="/CashConvert" element={<CashConversion />} />
        <Route path="/TransHistory" element={<TransactionHistory />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} /> 
        <Route path="/AdminTopup" element={<TopupManagement />} />
        <Route path="/Register" element={<VendorApplicationsDisplay />} /> {/* ✅ FIXED */}
        <Route path="/CardManage" element={<RFIDManagement />} /> 
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
