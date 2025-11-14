import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

// Helper to format the time (unchanged)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const LiveStandings = ({ roomId, participantProfiles }) => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState({}); 

  // All logic (useEffect, useMemo) is unchanged
  useEffect(() => {
    if (!roomId) return;
    const submissionsRef = ref(db, `rooms/${roomId}/challenge/submissions`);

    const unsubscribe = onValue(submissionsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubmissions(snapshot.val());
      } else {
        setSubmissions({});
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const finishedUsers = useMemo(() => {
    return Object.entries(submissions)
      .map(([userId, data]) => ({
        uid: userId,
        username: data.username,
        finishTime: data.finishTime,
      }))
      .sort((a, b) => a.finishTime - b.finishTime);
  }, [submissions]);

  const solvingUsers = useMemo(() => {
    return participantProfiles.filter(p => !submissions[p.uid]);
  }, [participantProfiles, submissions]);
  // --- End of unchanged logic ---

  // --- THIS IS THE FIX ---
  // We removed `flex-shrink-0` from the className.
  return (
    <div className="bg-gray-800 border-l border-gray-700 p-6 flex flex-col h-full overflow-auto">
  {/* --- END OF FIX --- */}
  
      <h2 className="text-xl font-bold mb-4">Live Standings</h2>
      
      <div className="mb-6">
        <h3 className="text-green-400 font-semibold mb-2">Finished</h3>
        <div className="space-y-2">
          {finishedUsers.length === 0 && (
            <p className="text-gray-500 text-sm">(None yet)</p>
          )}
          {finishedUsers.map((user, index) => (
            <div key={user.uid} className="flex justify-between items-center text-white">
              <span className="flex items-center gap-2">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ' '}
                {user.username} {user.uid === currentUser.uid ? '(You)' : ''}
              </span>
              <span className="font-mono text-lg">{formatTime(user.finishTime)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 font-semibold mb-2">Still Solving...</h3>
        <div className="space-y-2">
          {solvingUsers.map(user => (
            <p key={user.uid} className="text-gray-500">
              {user.username} {user.uid === currentUser.uid ? '(You)' : ''}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStandings;