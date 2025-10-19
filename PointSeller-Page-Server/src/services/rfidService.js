// services/rfidService.js
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { supabase } from '../Supabase/supabaseClient';

const rfidService = {
  /**
   * Register a new RFID card
   */
  registerNewCard: async (email, password, name, rfidUID) => {
    try {
      console.log('Starting card registration:', { email, name, rfidUID });

      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUID = firebaseUser.user.uid;
      console.log('Firebase user created:', firebaseUID);

      const { data, error } = await supabase
        .from('rfid_cards')
        .insert([
          {
            firebase_uid: firebaseUID,
            rfid_uid: rfidUID.toUpperCase(),
            name: name.trim(),
            email: email.trim(),
            balance: 0,
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        await firebaseUser.user.delete();
        throw new Error(`Failed to save card to database: ${error.message}`);
      }

      console.log('Card registered successfully:', data);
      return {
        success: true,
        firebase_uid: firebaseUID,
        card_data: data[0],
      };
    } catch (error) {
      console.error('Registration error:', error);
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
        throw new Error('Please enter a search term');
      }

      const query = searchQuery.trim();
      const queryUpper = query.toUpperCase();

      // Search by RFID UID (exact match)
      const { data: uidData, error: uidError } = await supabase
        .from('rfid_cards')
        .select('*')
        .eq('rfid_uid', queryUpper);

      if (uidData && uidData.length > 0) {
        console.log('Cards found by RFID UID:', uidData);
        return uidData;
      }

      // Search by name (partial, case-insensitive)
      const { data: nameData, error: nameError } = await supabase
        .from('rfid_cards')
        .select('*')
        .ilike('name', `%${query}%`);

      if (nameData && nameData.length > 0) {
        console.log('Cards found by name:', nameData);
        return nameData;
      }

      // No results found
      throw new Error('No cards found matching your search');
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  /**
   * Get single card by RFID UID (for when you select a card from search results)
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
   * Add points (top up) to a card
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
      console.log(`Balance updated: ${currentBalance} → ${verifyData.balance}`);

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
   * Delete a card
   */
  deleteCard: async (rfidUID) => {
    try {
      console.log('Deleting card:', rfidUID);

      const { error } = await supabase
        .from('rfid_cards')
        .delete()
        .eq('rfid_uid', rfidUID.toUpperCase());

      if (error) {
        throw error;
      }

      console.log('Card deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Delete card error:', error);
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