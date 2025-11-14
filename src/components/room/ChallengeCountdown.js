import React, { useState, useEffect } from 'react';

const ChallengeCountdown = ({ challengeData }) => {
  const [count, setCount] = useState(10); // Start at 10

  useEffect(() => {
    // --- 1. Calculate remaining time ---
    // Get the start time (in the future) from the challenge data
    const startTime = challengeData?.startTime || (Date.now() + 10000);
    
    // Function to update the timer
    const updateTimer = () => {
      const remainingMs = startTime - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      if (remainingSeconds > 0) {
        setCount(remainingSeconds);
      } else {
        setCount(0);
        // The ChallengeRoom component will handle the state switch to 'active'
        // We just stop counting here.
      }
    };

    // --- 2. Set up an interval ---
    updateTimer(); // Run immediately
    const intervalId = setInterval(updateTimer, 500); // Check every 0.5 sec

    // --- 3. Cleanup ---
    return () => clearInterval(intervalId);
    
  }, [challengeData]); // Re-run if challengeData changes

  // --- 4. Get problem title from props ---
  const problemTitle = challengeData?.problemTitle || "Problem";
  const problemInfo = `(${challengeData?.problemDifficulty || 'N/A'} - ${challengeData?.problemTopic || 'N/A'})`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-4 animate-pulse">CHALLENGE STARTING!</h1>
      <p className="text-3xl mb-8">
        Problem: "{problemTitle}" <span className="text-xl text-gray-400">{problemInfo}</span>
      </p>
      <div className="text-9xl font-bold">
        {count}
      </div>
    </div>
  );
};

export default ChallengeCountdown;