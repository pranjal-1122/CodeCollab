import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a blank page or a spinner while auth state is loading
    return <div className="min-h-screen bg-gray-900" />;
  }

  if (!currentUser) {
    // 1. Not logged in? Redirect to /auth
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!userProfile?.isProfileComplete) {
    // 2. Logged in, but profile is incomplete? Redirect to /setup
    // We also allow access if they are *already* on the setup page
    if (location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }
  }

  // 3. Logged in AND profile is complete? Show the page.
  return children;
};

export default ProtectedRoute;