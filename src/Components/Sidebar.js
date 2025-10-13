// src/Components/Sidebar.js
import React, { useState } from 'react';
import '../App.css';
import { SidebarData } from './SidebarData';
import { useNavigate, useLocation } from 'react-router-dom';
import Logout from '../Features/Logout';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleItemClick = (val) => {
    if (val.title === "Logout") {
      setShowLogoutPopup(true); // ✅ show popup directly
    } else {
      navigate(val.link);
    }
  };

  return (
    <div className="Sidebar">
      <ul className="SidebarList">
        {SidebarData.map((val, key) => (
          <li
            key={key}
            className="row"
            id={location.pathname === val.link ? "active" : ""}
            onClick={() => handleItemClick(val)}
          >
            <div id="icon">{val.icon}</div>
            <div id="title">{val.title}</div>
          </li>
        ))}
      </ul>

      {/* ✅ Show Logout popup when clicked */}
      {showLogoutPopup && (
        <Logout onClose={() => setShowLogoutPopup(false)} />
      )}
    </div>
  );
}

export default Sidebar;
