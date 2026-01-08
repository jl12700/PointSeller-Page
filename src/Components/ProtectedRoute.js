import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUserRole } from '../firebase/auth';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and role requirements
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.requiredRole - Required role ('admin' or 'user')
 * @param {string} props.redirectTo - Path to redirect if access denied
 */
function ProtectedRoute({ children, requiredRole = null, redirectTo = '/login' }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // No user logged in
          console.log("⚠️ No authenticated user found");
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        console.log("✅ User authenticated:", user.email);

        // If no role required, just check authentication
        if (!requiredRole) {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        // Fetch user role from Firestore
        const role = await getUserRole(user.uid);
        setUserRole(role);
        console.log("👤 User role:", role);

        // Check if user has required role
        if (role === requiredRole) {
          console.log("✅ User authorized with role:", role);
          setIsAuthorized(true);
        } else {
          console.warn("⚠️ User does not have required role:", requiredRole);
          setIsAuthorized(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Error in ProtectedRoute:", error);
        setIsAuthorized(false);
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [requiredRole]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        🔄 Loading...
      </div>
    );
  }

  // Redirect if not authorized
  if (!isAuthorized) {
    console.log("🚫 Access denied, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Render protected content
  return children;
}

export default ProtectedRoute;