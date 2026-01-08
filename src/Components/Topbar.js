import React from 'react';
import '../App.css';


function TopBar() {
  return (
    <div className="TopBar">
      <div className="TopBarContent">
        <img src={'/newicon-removebg-preview.png'} alt="PayTap" className="TopBarLogo" />
        <h1 className="TopBarTitle" style={{ fontFamily: 'Inter, Segoe UI, Roboto, sans-serif', fontWeight: 800 }}>PayTap</h1>
      </div>
    </div>
  );
}

export default TopBar;
