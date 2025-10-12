import React from 'react';
import '../App.css';
import PixIcon from '@mui/icons-material/Pix';


function TopBar() {
  return (
    <div className="TopBar">
      <div className="TopBarContent">
        <PixIcon className="TopBarIcon" />
        <h1 className="TopBarTitle">Paytap</h1>
      </div>
    </div>
  );
}

export default TopBar;
