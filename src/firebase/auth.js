import { auth, db } from "./firebase"; // Import both auth and db
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// ============================================
// EXISTING AUTHENTICATION FUNCTIONS
// ============================================

export const doCreateUserWithEmailandPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailandPassword = (email, password) => {
  return firebaseSignInWithEmail(auth, email, password);
};

export const doSignInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const doSignOut = async () => {
  try {
    await signOut(auth);
    console.log("✅ User signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

export const doPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password) => {
  return updatePassword(auth.currentUser, password);
};

// ============================================
// NEW ROLE-BASED FUNCTIONS
// ============================================

/**
 * Get user role from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<string|null>} User role ('admin' or 'user') or null if not found
 */
export const getUserRole = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("👤 User role:", userData.role);
      return userData.role || 'user'; // Default to 'user' if role not specified
    } else {
      console.warn("⚠️ User document not found in Firestore for UID:", uid);
      return 'user'; // Default role for users without Firestore document
    }
  } catch (error) {
    console.error("❌ Error fetching user role:", error);
    throw error;
  }
};

/**
 * Check if user is admin
 * @param {string} uid - User ID
 * @returns {Promise<boolean>} True if user is admin
 */
export const isAdmin = async (uid) => {
  try {
    const role = await getUserRole(uid);
    return role === 'admin';
  } catch (error) {
    console.error("❌ Error checking admin status:", error);
    return false;
  }
};

/**
 * Get user data from Firestore (includes role and other user info)
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data object or null if not found
 */
export const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.warn("⚠️ User document not found in Firestore for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    throw error;
  }
};