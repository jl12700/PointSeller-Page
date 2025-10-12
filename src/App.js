import './App.css';
import Sidebar from './Components/Sidebar';
import TopBar from './Components/Topbar';
import CashConversion from './Features/CashConversion';
import TopupManagement from './Features/TopupManagement';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <TopBar />
      <Sidebar />

      <Routes>
        <Route path="/CashConvert" element={<CashConversion />} />
        <Route path="/Topup" element={<TopupManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
