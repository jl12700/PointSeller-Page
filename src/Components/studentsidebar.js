
import React, { useState } from 'react';
import '../App.css';
import { StudentSidebarData } from './studentsidedata';
import { useNavigate, useLocation } from 'react-router-dom';
import Logout from '../Features/Logout';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';

function StudentSidebar() {
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

  // Insert student Support Request link below existing items
  const supportItem = { title: 'Support Requests', icon: <HeadsetMicIcon />, link: '/Support' };
  const insertIndex = StudentSidebarData.findIndex(item => item.title === 'Support Request')
  const menuItems = insertIndex !== -1
    ? [
        ...StudentSidebarData.slice(0, insertIndex + 1),
        supportItem,
        ...StudentSidebarData.slice(insertIndex + 1),
      ]
    : [...StudentSidebarData, supportItem];

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

export default StudentSidebar;
