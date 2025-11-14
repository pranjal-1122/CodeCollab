import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileSetupPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // State to hold form data
  const [username, setUsername] = useState(currentUser.displayName || '');
  const [language, setLanguage] = useState('Python'); // Default
  const [skillLevel, setSkillLevel] = useState('Beginner'); // Default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare the data to update in Firestore
    const profileData = {
      // Username is a new field, displayName is from Google
      username: username,
      preferredLanguage: language,
      skillLevel: skillLevel,
      isProfileComplete: true, // <-- This is the most important part!
    };

    const success = await updateProfile(currentUser.uid, profileData);

    if (success) {
      // Success! Send them to the dashboard.
      navigate('/dashboard');
    } else {
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-lg p-8 bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">
          Complete Your Profile
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Welcome! We just need a few more details to get you started.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-300">
              Preferred Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>C++</option>
              <option>Java</option>
              <option>Python</option>
              <option>JavaScript</option>
            </select>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Skill Level
            </label>
            <div className="flex gap-4 mt-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <button
                  type="button" // Important: prevents form submission
                  key={level}
                  onClick={() => setSkillLevel(level)}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    skillLevel === level
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-400 text-center">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-gray-500"
          >
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;