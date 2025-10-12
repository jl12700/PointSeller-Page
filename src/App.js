import './App.css';
import Sidebar from './Components/Sidebar';
import TopBar from './Components/Topbar';
import CashConversion from './Features/CashConversion';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <TopBar />
      <Sidebar />

      <Routes>
        <Route path="/CashConvert" element={<CashConversion />} />
      </Routes>
    </Router>
  );
}

export default App;
