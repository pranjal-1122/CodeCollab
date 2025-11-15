import React from 'react';
import ReactMarkdown from 'react-markdown';

// A simple "Sparkles" icon for the AI
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10.868 2.884c.321-.772.321-1.646 0-2.418a.75.75 0 00-1.423-.19L8.354 3.75l-2.03-2.03a.75.75 0 00-1.06 1.06l2.03 2.03-3.481 1.09a.75.75 0 00-.517 1.222l2.67 4.198-2.67 4.198a.75.75 0 00.517 1.222l3.481 1.09-2.03 2.03a.75.75 0 101.06 1.06l2.03-2.03 1.093 3.482a.75.75 0 001.423-.19l.79-2.418.79 2.418a.75.75 0 001.423.19l1.093-3.482 2.03 2.03a.75.75 0 101.06-1.06l-2.03-2.03 3.481-1.09a.75.75 0 00.517-1.222l-2.67-4.198 2.67-4.198a.75.75 0 00-.517-1.222l-3.481-1.09 2.03-2.03a.75.75 0 10-1.06-1.06l-2.03 2.03L10.868 2.884z" clipRule="evenodd" />
  </svg>
);

/**
 * This component displays the AI mentor UI
 * It receives all its logic and state as props from the parent.
 */
const AiMentorPanel = ({ onGetReview, suggestions, isLoading, error }) => {

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-gray-400 text-sm animate-pulse">Thinking...</p>;
    }
    if (error) {
      return <p className="text-red-400 text-sm">{error}</p>;
    }
    if (suggestions) {
      // 'prose-invert' styles the markdown for a dark background
      // 'prose-sm' makes the text smaller
      return (
        <div className="prose prose-invert prose-sm text-gray-300">
          <ReactMarkdown>{suggestions}</ReactMarkdown>
        </div>
      );
    }
    return <p className="text-gray-400 text-sm">Click the button to get feedback on your currently active file.</p>;
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">AI Mentor</h2>

      {/* The main content area */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
        {renderContent()}
      </div>

      {/* The button at the bottom */}
      <button
        onClick={onGetReview}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500"
      >
        <SparklesIcon />
        {isLoading ? 'Getting Feedback...' : 'Get AI Help'}
      </button>
    </div>
  );
};

export default AiMentorPanel;