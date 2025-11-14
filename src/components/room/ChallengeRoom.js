import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';

// Imports are all correct
import ChallengeLobby from './ChallengeLobby';
import ChallengeCountdown from './ChallengeCountdown';
import ChallengeActive from './ChallengeActive';
import ChallengeResults from './ChallengeResults';

const ChallengeRoom = ({ room }) => {
  const { currentUser } = useAuth();
  
  const [challengeState, setChallengeState] = useState('lobby');
  const [challengeData, setChallengeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RTDB listener (no change)
  useEffect(() => {
    const challengeRef = ref(db, `rooms/${room.roomId}/challenge`);
    
    const unsubscribe = onValue(challengeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setChallengeData(data); 
        
        if (challengeState !== 'active' && challengeState !== 'results') {
          setChallengeState(data.state || 'lobby');
        }
      } else {
        setChallengeData(null);
        setChallengeState('lobby');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to challenge state:", err);
      setError("Failed to load challenge state.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [room.roomId, challengeState]);

  // 'countdown' -> 'active' timer (no change)
  useEffect(() => {
    if (challengeState === 'countdown' && challengeData?.startTime) {
      const msRemaining = challengeData.startTime - Date.now();
      const timerId = setTimeout(() => {
        setChallengeState('active');
      }, msRemaining > 0 ? msRemaining : 0);
      return () => clearTimeout(timerId);
    }
  }, [challengeState, challengeData]);

  // --- 1. NEW: 'active' -> 'results' timer ---
  useEffect(() => {
    // We only run this timer when in the 'active' state
    if (challengeState === 'active' && challengeData?.firstFinisherTime) {
      
      // Calculate when the challenge should officially end
      const challengeEndTime = challengeData.firstFinisherTime + 600000; // 10 minutes
      const msRemaining = challengeEndTime - Date.now();

      // Set the master timer to switch all users to the results screen
      const timerId = setTimeout(() => {
        setChallengeState('results');
      }, msRemaining > 0 ? msRemaining : 0);

      // Clean up the timer
      return () => clearTimeout(timerId);
    }
  }, [challengeState, challengeData]); // Re-run when state or data changes
  // --- END OF NEW useEffect ---


  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white p-10">Loading challenge...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gray-900 text-red-400 p-10">Error: {error}</div>;
  }
  
  // Pass all props down, including the full 'room'
  switch (challengeState) {
    case 'lobby':
      return <ChallengeLobby room={room} isHost={room.hostId === currentUser.uid} />;
    case 'countdown':
      return <ChallengeCountdown challengeData={challengeData} />;
    case 'active':
      return (
        <ChallengeActive 
          room={room} 
          challengeData={challengeData} 
          isHost={room.hostId === currentUser.uid}
        />
      );
    case 'results':
      return <ChallengeResults room={room} challengeData={challengeData} />;
    default:
      return <ChallengeLobby room={room} isHost={room.hostId === currentUser.uid} />;
  }
};

export default ChallengeRoom;