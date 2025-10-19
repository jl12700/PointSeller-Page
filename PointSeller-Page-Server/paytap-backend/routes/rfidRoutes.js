// Add these routes to your existing backend (index.js or server.js)
// These are public endpoints for ESP32 integration - NO AUTH REQUIRED

const express = require('express');
const router = express.Router();
const { supabase } = require('../Supabase/supabaseClient');

// ===== ESP32 RFID ENDPOINTS (PUBLIC - NO AUTH REQUIRED) =====

// 1. POST /api/rfid/search
// ESP32 calls this to search card by RFID UID
router.post('/search', async (req, res) => {
  try {
    const { rfid_uid } = req.body;

    if (!rfid_uid || rfid_uid.trim() === '') {
      return res.status(400).json({ error: 'RFID UID is required' });
    }

    console.log('ESP32 Search Request:', rfid_uid);

    const { data, error } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('rfid_uid', rfid_uid.toUpperCase())
      .single();

    if (error || !data) {
      console.log('Card not found:', rfid_uid);
      return res.status(404).json({ 
        error: 'Card not found',
        rfid_uid: rfid_uid 
      });
    }

    console.log('Card found:', data.name);

    res.json({
      id: data.id,
      rfid_uid: data.rfid_uid,
      firebase_uid: data.firebase_uid,
      name: data.name,
      email: data.email,
      balance: data.balance,
      status: data.status,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 2. POST /api/rfid/deduct
// Deduct points from card (for purchases/transactions)
router.post('/deduct', async (req, res) => {
  try {
    const { rfid_uid, amount, reason = 'Purchase' } = req.body;

    if (!rfid_uid || !amount) {
      return res.status(400).json({ error: 'Missing rfid_uid or amount' });
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log('Deduct Points Request:', { rfid_uid, amount });

    // Get current card data
    const { data: cardData, error: getError } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('rfid_uid', rfid_uid.toUpperCase())
      .single();

    if (getError || !cardData) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Check if card is active
    if (cardData.status !== 'active') {
      return res.status(403).json({ 
        error: 'Card is inactive',
        status: cardData.status 
      });
    }

    // Check balance
    if (cardData.balance < parsedAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        current_balance: cardData.balance,
        required: parsedAmount
      });
    }

    const newBalance = cardData.balance - parsedAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from('rfid_cards')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('rfid_uid', rfid_uid.toUpperCase());

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Log transaction (optional - if you have rfid_transactions table)
    try {
      await supabase
        .from('rfid_transactions')
        .insert([{
          rfid_uid: rfid_uid.toUpperCase(),
          amount: parsedAmount,
          transaction_type: 'deduct',
          reason: reason,
          old_balance: cardData.balance,
          new_balance: newBalance,
          timestamp: new Date().toISOString(),
        }]);
    } catch (logError) {
      console.warn('Failed to log transaction:', logError);
      // Don't fail the request if logging fails
    }

    console.log('Deduct successful:', newBalance);

    res.json({
      success: true,
      message: 'Transaction successful',
      rfid_uid: rfid_uid,
      amount_deducted: parsedAmount,
      old_balance: cardData.balance,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Deduct error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 3. POST /api/rfid/topup
// Add points to card (topup via ESP32)
router.post('/topup', async (req, res) => {
  try {
    const { rfid_uid, amount } = req.body;

    if (!rfid_uid || !amount) {
      return res.status(400).json({ error: 'Missing rfid_uid or amount' });
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    console.log('Topup Request:', { rfid_uid, amount });

    // Get current card
    const { data: cardData, error: getError } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('rfid_uid', rfid_uid.toUpperCase())
      .single();

    if (getError || !cardData) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const newBalance = cardData.balance + parsedAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from('rfid_cards')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('rfid_uid', rfid_uid.toUpperCase());

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Topup successful:', newBalance);

    res.json({
      success: true,
      message: 'Topup successful',
      rfid_uid: rfid_uid,
      amount_added: parsedAmount,
      old_balance: cardData.balance,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 4. GET /api/rfid/:rfidUID
// Get card status by RFID UID
router.get('/:rfidUID', async (req, res) => {
  try {
    const { rfidUID } = req.params;

    const { data, error } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('rfid_uid', rfidUID.toUpperCase())
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({
      id: data.id,
      rfid_uid: data.rfid_uid,
      name: data.name,
      balance: data.balance,
      status: data.status,
      email: data.email,
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;