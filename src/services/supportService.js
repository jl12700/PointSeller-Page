import { supabase } from "../Supabase/supabaseClient";
import { auth } from "../firebase/firebase"; // Adjust path based on your structure

/**
 * Fetch support requests for Firebase authenticated user
 * @returns {Promise<Array>} Array of support request objects
 */
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

/**
 * Create a new support request using Firebase UID
 * @param {Object} supportData - The support request data (subject, category, message)
 * @returns {Promise<Object>} Created support request object
 */
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
          solution: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

/**
 * Update support request status
 * @param {string} requestId - The ID of the support request
 * @param {string} status - The new status ('Pending', 'In Progress', 'Resolved', 'Closed')
 * @returns {Promise<Object>} Updated support request object
 */
export const updateSupportRequestStatus = async (requestId, status) => {
  try {
    console.log(`📝 Updating status to ${status} for request ${requestId}`);

    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // If marking as resolved, add resolved timestamp
    if (status === 'Resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    console.log('✅ Status updated successfully');
    return data;
  } catch (error) {
    console.error('❌ Error updating support request:', error.message);
    throw error;
  }
};

/**
 * Submit a solution to a support request (Admin function)
 * This automatically marks the request as 'Resolved'
 * @param {string} requestId - The ID of the support request
 * @param {string} solution - The solution/response text
 * @returns {Promise<Object>} Updated support request object
 */
export const submitSupportSolution = async (requestId, solution) => {
  try {
    console.log(`📝 Submitting solution for request ${requestId}`);

    const updateData = {
      solution: solution.trim(),
      status: 'Resolved',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('support_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw new Error('Failed to submit solution');
    }

    console.log('✅ Solution submitted successfully');
    return data;
  } catch (error) {
    console.error('❌ Error submitting solution:', error.message);
    throw error;
  }
};

/**
 * Fetch all support requests (Admin function)
 * @param {Object} filters - Optional filters (status, dateRange, etc.)
 * @returns {Promise<Array>} Array of support request objects
 */
export const fetchAllSupportRequests = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all support requests (Admin)...');

    let query = supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    // Apply date range filter if provided (default: last 30 days)
    if (filters.daysAgo) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - filters.daysAgo);
      query = query.gte('created_at', dateThreshold.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new Error('Failed to fetch support requests');
    }

    console.log('✅ Fetched all support requests:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchAllSupportRequests:', error.message);
    throw error;
  }
};

/**
 * Delete a support request (Admin function - use with caution)
 * @param {string} requestId - The ID of the support request to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteSupportRequest = async (requestId) => {
  try {
    console.log(`🗑️ Deleting support request ${requestId}...`);

    const { error } = await supabase
      .from('support_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('✅ Support request deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting support request:', error.message);
    throw error;
  }
};