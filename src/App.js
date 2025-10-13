import './App.css';
import CashConversion from './Features/CashConversion';
import TopupManagement from './Features/TopupManagement';
import Login from './Components/login';
import VendorRegistration from './Components/VendorRegistration';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import RFIDManagement from './Features/RFIDManagement';
import VendorApplicationsDisplay from './Features/VendorRequests'; // ✅ imported correctly

function AppLayout() {
  const location = useLocation();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />  
        <Route path="/CashConvert" element={<CashConversion />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} /> 
        <Route path="/Topup" element={<TopupManagement />} />
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
