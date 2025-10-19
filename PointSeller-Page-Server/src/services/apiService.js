import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'demo-admin-token-123'; // Store in .env later

export const apiService = {
  // ===== SEARCH & TOPUP =====
  
  // Get user by RFID UID
  getUserByUID: async (uid) => {
    try {
      const response = await axios.get(`${API_BASE}/user`, {
        params: { uid },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Top up user balance
  topupUser: async (rfid_uid, amount, firebaseToken) => {
    try {
      const response = await axios.post(
        `${API_BASE}/admin/topup`,
        { rfid_uid, amount: parseInt(amount) },
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'x-admin-token': ADMIN_TOKEN,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ===== REGISTER NEW CARD =====
  
  // Register new user with RFID card
  registerUser: async (email, password, name, rfid_uid, firebaseToken) => {
    try {
      const response = await axios.post(
        `${API_BASE}/register`,
        { 
          email, 
          password, 
          name, 
          rfid_uid: rfid_uid.toUpperCase() 
        },
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'x-admin-token': ADMIN_TOKEN,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ===== CARD MANAGEMENT =====
  
  // Get all cards
  getAllCards: async (firebaseToken) => {
    try {
      const response = await axios.get(
        `${API_BASE}/admin/cards`,
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'x-admin-token': ADMIN_TOKEN,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle card status (activate/deactivate)
  toggleCardStatus: async (userId, firebaseToken) => {
    try {
      const response = await axios.post(
        `${API_BASE}/admin/card/${userId}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'x-admin-token': ADMIN_TOKEN,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get transaction history for a user
  getUserTransactions: async (userId, firebaseToken) => {
    try {
      const response = await axios.get(
        `${API_BASE}/user/${userId}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};