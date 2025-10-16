import React from 'react'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LogoutIcon from '@mui/icons-material/Logout';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

export const StudentSidebarData =  [
    {
        title: "Points Topup",
        icon: <AttachMoneyIcon />,
        link:  "/Topup"

    },
     {
        title: "Expense Tracking",
        icon: <ReceiptLongIcon />,
        link:  "/Expense"

    },
     {
        title: "Points Balance",
        icon: <AccountBalanceIcon />,
        link:  "/Balance"

    },
     {
        title: "Support Request",
        icon: <ContactSupportIcon />,
        link:  "/Support"

    },
      {
        title: "Edit Profile",
        icon: <AccountBoxIcon />,
        link:  "/Profile"

    },
     {
        title: "Logout",
        icon: <LogoutIcon />,
        link:  "/Logout"

    },
    

]

