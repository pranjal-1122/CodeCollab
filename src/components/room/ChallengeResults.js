import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Helper to format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Helper for ranking and points [cite: 455-460]
const getRankDetails = (index, didFinish) => {
  if (!didFinish) {
    return {
      badge: '❌',
      points: '+0 pts',
      color: 'text-gray-400',
      title: 'Did Not Finish',
    };
  }
  switch (index) {
    case 0:
      return { badge: '🥇', points: '+100 pts', color: 'text-yellow-400', title: '1st Place' };
    case 1:
      return { badge: '🥈', points: '+60 pts', color: 'text-gray-300', title: '2nd Place' };
    case 2:
      return { badge: '🥉', points: '+40 pts', color: 'text-orange-400', title: '3rd Place' };
    default:
      return { badge: '✅', points: '+10 pts', color: 'text-green-400', title: 'Finished' };
  }
};

const ChallengeResults = ({ room, challengeData }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 1. Process the results
  const { rankedUsers, dnfUsers } = useMemo(() => {
    const submissions = challengeData?.submissions || {};
    const allParticipants = room.participantProfiles || [];

    // Sort finished users
    const finished = Object.entries(submissions)
      .map(([uid, data]) => ({
        uid,
        username: data.username,
        finishTime: data.finishTime,
      }))
      .sort((a, b) => a.finishTime - b.finishTime); // Sort by time

    // Find DNF users
    const finishedIds = new Set(finished.map(u => u.uid));
    const dnf = allParticipants.filter(p => !finishedIds.has(p.uid));
    
    return { rankedUsers: finished, dnfUsers: dnf };
  }, [challengeData, room]);

  const problemTitle = challengeData?.problemTitle || "Challenge";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-5xl font-bold mb-4">CHALLENGE COMPLETE!</h1>
      <p className="text-2xl text-gray-300 mb-8">Problem: "{problemTitle}"</p>
      
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6">
        <h2 className="text-3xl font-semibold mb-6 text-center">Final Standings</h2>
        
        <div className="space-y-4">
          
          {/* 2. Render Finished Users */}
          {rankedUsers.map((user, index) => {
            const { badge, points, color, title } = getRankDetails(index, true);
            const isYou = user.uid === currentUser.uid;
            
            return (
              <div key={user.uid} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div>
                  <span className={`text-2xl font-bold ${color}`}>
                    {badge} {title}: {user.username} {isYou ? '(You)' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono">{formatTime(user.finishTime)}</span>
                  <span className={`block text-sm font-semibold ${color}`}>{points}</span>
                </div>
              </div>
            );
          })}
          
          {/* 3. Render DNF Users */}
          {dnfUsers.map((user) => {
            const { badge, points, color } = getRankDetails(null, false);
            const isYou = user.uid === currentUser.uid;
            
            return (
              <div key={user.uid} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg opacity-60">
                <span className={`text-xl font-semibold ${color}`}>
                  {badge} {user.username} {isYou ? '(You)' : ''}
                </span>
                <span className={`text-sm font-semibold ${color}`}>{points}</span>
              </div>
            );
          })}
        </div>

        {/* 4. Action Buttons [cite: 466-472] */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => alert("This would restart the challenge (coming soon!)")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg"
          >
            Challenge Again
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeResults;