import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import our pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RoomPage from './pages/RoomPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import NotFoundPage from './pages/NotFoundPage';

// Import our route protector
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    // Set a dark background for the whole app
    <div className="min-h-screen bg-gray-900">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/room/:roomId" // :roomId is a dynamic parameter
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/setup" 
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          } 
        />

        {/* ADD THE CATCH-ALL ROUTE AT THE END */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

    </div>
  );
}

export default App;