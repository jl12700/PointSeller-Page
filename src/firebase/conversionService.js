// firebase/conversionService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { posDb } from './firebase'; // Import posDb from your existing firebase config

// Collection reference for conversion requests (from POS system)
const conversionRequestsRef = collection(posDb, 'conversionRequests');

// Collection reference for vendors
const vendorsRef = collection(posDb, 'vendors');

// Get all conversion requests
export const getConversionRequests = async () => {
  try {
    const q = query(conversionRequestsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversion requests:', error);
    throw error;
  }
};

// Add a new conversion request
export const addConversionRequest = async (requestData) => {
  try {
    const docRef = await addDoc(conversionRequestsRef, {
      ...requestData,
      requestStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding conversion request:', error);
    throw error;
  }
};

// Update conversion request status
export const updateConversionRequest = async (requestId, updateData) => {
  try {
    const requestDoc = doc(posDb, 'conversionRequests', requestId);
    await updateDoc(requestDoc, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating conversion request:', error);
    throw error;
  }
};

// Delete conversion request
export const deleteConversionRequest = async (requestId) => {
  try {
    const requestDoc = doc(posDb, 'conversionRequests', requestId);
    await deleteDoc(requestDoc);
  } catch (error) {
    console.error('Error deleting conversion request:', error);
    throw error;
  }
};

// Get conversion requests by status
export const getConversionRequestsByStatus = async (status) => {
  try {
    const q = query(
      conversionRequestsRef, 
      where('requestStatus', '==', status), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting conversion requests by status:', error);
    throw error;
  }
};

// Get vendor by email
export const getVendorByEmail = async (email) => {
  try {
    const vendorDoc = doc(posDb, 'vendors', email);
    const docSnap = await getDoc(vendorDoc);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting vendor:', error);
    throw error;
  }
};

// Update vendor point balance
export const updateVendorPoints = async (vendorEmail, newPointBalance) => {
  try {
    const vendorDoc = doc(posDb, 'vendors', vendorEmail);
    await updateDoc(vendorDoc, {
      pointBalance: newPointBalance,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating vendor points:', error);
    throw error;
  }
};