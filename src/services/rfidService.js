// services/rfidService.js
import { supabase } from '../Supabase/supabaseClient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth } from '../firebase/firebaseSecondary';

const rfidService = {
  /**
   * Register a new RFID card without logging out admin
   * Uses Firebase Secondary Auth (no backend needed)
   */
  registerNewCard: async (email, password, name, rfidUID) => {
    try {
      console.log('Starting card registration:', { email, name, rfidUID });

      // Check if RFID already exists
      const { data: existingCard, error: checkError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', rfidUID.toUpperCase())
        .maybeSingle();

      if (existingCard) {
        throw new Error('This RFID card is already registered to another user');
      }

      // Check if email already has a card
      const { data: existingEmail, error: emailError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        throw new Error('This email already has a registered card');
      }

      console.log('✓ Validations passed, creating Firebase user...');

      // Create user with Firebase Secondary Auth (won't log out admin)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim(),
        password
      );

      const firebaseUID = userCredential.user.uid;
      console.log('✓ Firebase user created:', firebaseUID);

      // Insert card into Supabase
      const { data, error } = await supabase
        .from('rfid_cards')
        .insert([
          {
            firebase_uid: firebaseUID,
            rfid_uid: rfidUID.toUpperCase(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            balance: 0,
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to save card to database: ${error.message}`);
      }

      console.log('✓ Card registered successfully:', data[0]);
      return {
        success: true,
        firebase_uid: firebaseUID,
        card_data: data[0],
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Firebase auth errors with user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email address is already in use');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak (minimum 6 characters)');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  },

  /**
   * Search for cards by RFID UID or Name (returns matches)
   */
  searchCards: async (searchQuery) => {
    try {
      console.log('Searching for:', searchQuery);

      if (!searchQuery || searchQuery.trim() === '') {
        return [];
      }

      const query = searchQuery.trim();
      const queryUpper = query.toUpperCase();

      // Search by RFID UID (exact or partial match)
      const { data: uidData } = await supabase
        .from('rfid_cards')
        .select('*')
        .ilike('rfid_uid', `%${queryUpper}%`);

      // Search by name (partial, case-insensitive)
      const { data: nameData } = await supabase
        .from('rfid_cards')
        .select('*')
        .ilike('name', `%${query}%`);

      // Combine and deduplicate results
      const allResults = [...(uidData || []), ...(nameData || [])];
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      );

      console.log('Cards found:', uniqueResults);
      return uniqueResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  /**
   * Get single card by RFID UID
   */
  getCardByUID: async (rfidUID) => {
    try {
      console.log('Getting card:', rfidUID);

      const { data, error } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', rfidUID.toUpperCase())
        .single();

      if (error) {
        throw new Error('Card not found');
      }

      return data;
    } catch (error) {
      console.error('Get card error:', error);
      throw error;
    }
  },

  /**
   * Add points (top up) to a card with ₱5,000 limit
   */
  topupCard: async (rfidUID, amount) => {
    try {
      console.log('Processing topup:', { rfidUID, amount });

      if (!rfidUID || rfidUID.trim() === '') {
        throw new Error('Invalid RFID UID');
      }

      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      const upperUID = rfidUID.toUpperCase();

      // Get current card data
      const { data: cardData, error: getError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', upperUID)
        .single();

      if (getError || !cardData) {
        console.error('Get error:', getError);
        throw new Error('Card not found in database');
      }

      console.log('Current card:', cardData);
      const currentBalance = cardData.balance || 0;
      const newBalance = currentBalance + parsedAmount;

      // Check ₱5,000 limit
      if (newBalance > 5000) {
        throw new Error(`Cannot exceed ₱5,000 maximum balance. Current: ₱${currentBalance}, Trying to add: ₱${parsedAmount}`);
      }

      console.log(`Calculating: ${currentBalance} + ${parsedAmount} = ${newBalance}`);

      // Update balance in Supabase
      const { error: updateError } = await supabase
        .from('rfid_cards')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', upperUID);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Fetch the updated card to confirm
      const { data: verifyData, error: verifyError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', upperUID)
        .single();

      if (verifyError || !verifyData) {
        console.error('Verify error:', verifyError);
        throw new Error('Failed to verify balance update');
      }

      console.log('✅ Topup successful - Verified:', verifyData);

      return {
        success: true,
        old_balance: currentBalance,
        new_balance: verifyData.balance,
        amount_added: parsedAmount,
        card_data: verifyData,
      };
    } catch (error) {
      console.error('❌ Topup error:', error);
      throw error;
    }
  },

  /**
   * Transfer points between cards
   */
  transferPoints: async (sourceRFID, destinationRFID, amount, reason = 'Admin Transfer') => {
    try {
      console.log('Processing transfer:', { sourceRFID, destinationRFID, amount });

      const parsedAmount = parseInt(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Transfer amount must be a positive number');
      }

      const sourceUID = sourceRFID.toUpperCase();
      const destUID = destinationRFID.toUpperCase();

      // Validate not same card
      if (sourceUID === destUID) {
        throw new Error('Source and destination cards cannot be the same');
      }

      // Get source card
      const { data: sourceCard, error: sourceError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', sourceUID)
        .single();

      if (sourceError || !sourceCard) {
        throw new Error('Source card not found');
      }

      // Get destination card
      const { data: destCard, error: destError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', destUID)
        .single();

      if (destError || !destCard) {
        throw new Error('Destination card not found');
      }

      // Check if source has enough balance
      if (sourceCard.balance < parsedAmount) {
        throw new Error(`Insufficient balance. Available: ₱${sourceCard.balance}`);
      }

      // Check destination won't exceed limit
      const newDestBalance = destCard.balance + parsedAmount;
      if (newDestBalance > 5000) {
        throw new Error(`Transfer would exceed ₱5,000 limit for destination card. Current: ₱${destCard.balance}`);
      }

      const newSourceBalance = sourceCard.balance - parsedAmount;

      // Update source card
      const { error: updateSourceError } = await supabase
        .from('rfid_cards')
        .update({
          balance: newSourceBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', sourceUID);

      if (updateSourceError) {
        throw new Error('Failed to update source card');
      }

      // Update destination card
      const { error: updateDestError } = await supabase
        .from('rfid_cards')
        .update({
          balance: newDestBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', destUID);

      if (updateDestError) {
        // Rollback source card
        await supabase
          .from('rfid_cards')
          .update({ balance: sourceCard.balance })
          .eq('rfid_uid', sourceUID);
        throw new Error('Failed to update destination card');
      }

      // Record transfer in history
      const transferRecord = {
        source_rfid: sourceUID,
        source_name: sourceCard.name,
        destination_rfid: destUID,
        destination_name: destCard.name,
        amount: parsedAmount,
        source_new_balance: newSourceBalance,
        dest_new_balance: newDestBalance,
        reason: reason,
        created_at: new Date().toISOString(),
      };

      console.log('Inserting transfer record:', transferRecord);

      const { data: historyData, error: historyError } = await supabase
        .from('transfers')
        .insert([transferRecord]);

      if (historyError) {
        console.error('Failed to record transfer history:', historyError);
        console.error('Error details:', JSON.stringify(historyError, null, 2));
        // Don't throw error - transfer already completed successfully
      } else {
        console.log('✓ Transfer history recorded successfully');
      }

      console.log('✅ Transfer successful');

      return {
        success: true,
        source: {
          rfid: sourceUID,
          name: sourceCard.name,
          old_balance: sourceCard.balance,
          new_balance: newSourceBalance,
        },
        destination: {
          rfid: destUID,
          name: destCard.name,
          old_balance: destCard.balance,
          new_balance: newDestBalance,
        },
        amount_transferred: parsedAmount,
      };
    } catch (error) {
      console.error('❌ Transfer error:', error);
      throw error;
    }
  },

  /**
   * Delete (delink) RFID card from user
   */
  deleteCard: async (rfidUID) => {
    try {
      console.log('Deleting card:', rfidUID);

      const { data: card, error: getError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', rfidUID.toUpperCase())
        .single();

      if (getError || !card) {
        throw new Error('Card not found');
      }

      // Delete the RFID card entry
      const { error } = await supabase
        .from('rfid_cards')
        .delete()
        .eq('rfid_uid', rfidUID.toUpperCase());

      if (error) {
        throw new Error('Failed to delete card');
      }

      console.log('Card deleted successfully');
      return {
        success: true,
        deleted_card: card,
        message: 'RFID card removed. Email account remains active.',
      };
    } catch (error) {
      console.error('Delete card error:', error);
      throw error;
    }
  },

  /**
   * Toggle card status (active/inactive)
   */
  toggleCardStatus: async (rfidUID) => {
    try {
      console.log('Toggling card status:', rfidUID);

      const card = await rfidService.getCardByUID(rfidUID);
      const newStatus = card.status === 'active' ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from('rfid_cards')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', rfidUID.toUpperCase())
        .select();

      if (error) {
        throw error;
      }

      console.log('Status toggled:', data);
      return {
        success: true,
        old_status: card.status,
        new_status: newStatus,
        card_data: data[0],
      };
    } catch (error) {
      console.error('Toggle status error:', error);
      throw error;
    }
  },

  /**
   * Get all registered RFID cards
   */
  getAllCards: async () => {
    try {
      console.log('Fetching all cards');

      const { data, error } = await supabase
        .from('rfid_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('All cards fetched:', data);
      return data;
    } catch (error) {
      console.error('Fetch all cards error:', error);
      throw error;
    }
  },

  /**
   * Get transfer history
   */
  getTransferHistory: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Format for display (add timestamp field from created_at)
      const formattedData = (data || []).map(transfer => ({
        ...transfer,
        timestamp: transfer.created_at
      }));

      return formattedData;
    } catch (error) {
      console.error('Fetch transfer history error:', error);
      throw error;
    }
  },

  /**
   * Deduct points from a card
   */
  deductPoints: async (rfidUID, amount, reason = 'Purchase') => {
    try {
      console.log('Deducting points:', { rfidUID, amount, reason });

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const card = await rfidService.getCardByUID(rfidUID);

      if (card.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = card.balance - amount;

      const { data, error } = await supabase
        .from('rfid_cards')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('rfid_uid', rfidUID.toUpperCase())
        .select();

      if (error) {
        throw error;
      }

      console.log('Points deducted:', data);
      return {
        success: true,
        old_balance: card.balance,
        new_balance: newBalance,
        amount_deducted: amount,
        reason: reason,
        card_data: data[0],
      };
    } catch (error) {
      console.error('Deduct points error:', error);
      throw error;
    }
  },
};

export default rfidService;