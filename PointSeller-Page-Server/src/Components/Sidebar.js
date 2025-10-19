// src/Components/Sidebar.js
import React, { useState } from 'react';
import '../App.css';
import { SidebarData } from './SidebarData';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
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

  // Insert "Support Requests" below "Vendor Application" (admin path)
  const supportItem = { title: 'Support Requests', icon: <HeadsetMicIcon />, link: '/AdminSupport' };
  const insertIndex = SidebarData.findIndex(item => item.title === 'Vendor Application');
  const menuItems = insertIndex !== -1
    ? [
        ...SidebarData.slice(0, insertIndex + 1),
        supportItem,
        ...SidebarData.slice(insertIndex + 1),
      ]
    : [...SidebarData, supportItem];

  return (
    <div className="Sidebar">
      <ul className="SidebarList">
        {menuItems.map((val, key) => (
          <li
            key={key}
            className={`row ${val.title === 'Logout' ? 'row-logout' : ''}`}
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
