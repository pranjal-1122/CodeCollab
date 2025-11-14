import React from 'react';

// Helper to get a color based on difficulty [cite: 184]
const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'text-green-400 border-green-400';
    case 'medium':
      return 'text-yellow-400 border-yellow-400';
    case 'hard':
      return 'text-red-400 border-red-400';
    default:
      return 'text-gray-400 border-gray-400';
  }
};

const ProblemCard = ({ problem }) => {
  // We'll add the "Create Challenge Room" button logic later.
  // For now, it will just be a visual.
  // We're also simplifying the user's solve history [cite: 185-189]
  // to just show "Not attempted yet" as a placeholder.

  return (
    <div className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
      {/* Left Side: Problem Info */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">{problem.title}</h4>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(
              problem.difficulty
            )}`}
          >
            {problem.difficulty}
          </span>
          {/* This is a placeholder for user history [cite: 170] */}
          <span className="text-sm text-gray-400">Not attempted yet</span>
        </div>
      </div>

      {/* Right Side: Action Buttons [cite: 191] */}
      <div className="flex gap-2">
        <button className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors">
          View Problem
        </button>
        <button className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Create Challenge Room
        </button>
      </div>
    </div>
  );
};

export default ProblemCard;