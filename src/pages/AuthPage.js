import React, { useEffect } from 'react'; // <-- 1. Import useEffect
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '../components/common/GoogleIcon';

const AuthPage = () => {
  // 2. Get currentUser from useAuth
  const { signInWithGoogle, currentUser } = useAuth(); 
  const navigate = useNavigate();

  // 3. ADD THIS ENTIRE useEffect BLOCK
  useEffect(() => {
    // If the user is logged in, don't show this page.
    // Redirect them to the dashboard (which will then route to /setup if needed).
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]); // This effect runs when currentUser or navigate changes

  const handleGoogleSignIn = async () => {
    try {
      // The useEffect above will handle the redirect now
      await signInWithGoogle();
      // We can even remove the navigate from here, but it's good for robustness.
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
    }
  };

  // If we're still loading or already logged in, show nothing
  if (currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">
          Welcome to CodeCollab
        </h2>
        <p className="text-center text-gray-400">
          Sign in to start your collaborative coding journey.
        </p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          <GoogleIcon className="w-6 h-6" /> 
          <span className="text-lg">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};

export default AuthPage;