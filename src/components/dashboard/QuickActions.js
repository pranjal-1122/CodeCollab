import React from 'react';

// Placeholder icons for the buttons
const FindPartnerIcon = () => <span>🤝</span>;
const CreateRoomIcon = () => <span>➕</span>;
const LeaderboardIcon = () => <span>🏆</span>;

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Find Coding Partner Button */}
      <button className="flex flex-col items-center justify-center p-6 bg-indigo-600 rounded-lg text-white font-semibold shadow-lg hover:bg-indigo-700 transition-colors">
        <FindPartnerIcon />
        <span className="mt-2 text-lg">Find Coding Partner</span>
      </button>

      {/* Create Room Button */}
      <button className="flex flex-col items-center justify-center p-6 bg-gray-700 rounded-lg text-white font-semibold shadow-lg hover:bg-gray-600 transition-colors">
        <CreateRoomIcon />
        <span className="mt-2 text-lg">Create Room</span>
      </button>

      {/* Leaderboard Button */}
      <button className="flex flex-col items-center justify-center p-6 bg-gray-700 rounded-lg text-white font-semibold shadow-lg hover:bg-gray-600 transition-colors">
        <LeaderboardIcon />
        <span className="mt-2 text-lg">Leaderboard</span>
      </button>
    </div>
  );
};

export default QuickActions;