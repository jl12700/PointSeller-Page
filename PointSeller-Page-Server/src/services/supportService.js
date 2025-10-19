import { supabase } from "../Supabase/supabaseClient";
import { auth } from "../firebase/firebase"; // Adjust path based on your structure

// Fetch support requests for Firebase authenticated user OR anonymous
export const fetchUserSupportRequests = async () => {
  try {
    console.log('🔍 Fetching support requests...');
    
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('ℹ️ No Firebase user - returning empty array');
      return [];
    }

    console.log('✅ Fetching for Firebase user:', currentUser.uid);

    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', currentUser.uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    console.log('✅ Support requests fetched:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching support requests:', error.message);
    return [];
  }
};

// Create a new support request using Firebase UID
export const createSupportRequest = async (supportData) => {
  try {
    console.log('🔍 Creating support request...');
    
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : null;
    const userEmail = currentUser ? currentUser.email : null;
    
    console.log(userId 
      ? `✅ Firebase user: ${userId}` 
      : 'ℹ️ Anonymous support request'
    );

    const { data, error } = await supabase
      .from('support_requests')
      .insert([
        {
          user_id: userId,
          user_email: userEmail,
          subject: supportData.subject,
          category: supportData.category,
          message: supportData.message,
          status: 'Pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log('✅ Support request created with ID:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error creating support request:', error.message);
    throw error;
  }
};

// Update support request status
export const updateSupportRequestStatus = async (requestId, status) => {
  try {
    const { data, error } = await supabase
      .from('support_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating support request:', error.message);
    throw error;
  }
};

// Delete a support request
export const deleteSupportRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('support_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting support request:', error.message);
    throw error;
  }
};