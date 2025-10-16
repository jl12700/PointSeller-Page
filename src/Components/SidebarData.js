import React from 'react'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddCardIcon from '@mui/icons-material/AddCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LogoutIcon from '@mui/icons-material/Logout';

export const SidebarData =  [
    {
        title: "Cash Conversion",
        icon: <AttachMoneyIcon />,
        link:  "/CashConvert"
    },
    {
        title: "Topup Management",
        icon: <AccountBalanceIcon />,
        link:  "/AdminTopup"
    },
    {
        title: "RFID Card Management",
        icon: <AddCardIcon />,
        link:  "/CardManage"
    },
    {
        title: "Transaction History",
        icon: <ReceiptLongIcon />,
        link:  "/TransHistory"
    },
    {
        title: "Vendor Application",
        icon: <HowToRegIcon />,
        link:  "/Register"
    },
    {
        title: "Logout",
        icon: <LogoutIcon />,
        link:  "/Logout"
    },
]