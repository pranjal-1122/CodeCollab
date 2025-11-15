import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/solid';

// This is the new component for displaying hints
const HintDisplay = ({ staticHint, staticHintVisible, aiHints, isLoading, error }) => {
  const staticHintText = staticHint || "No static hint available for this problem.";

  return (
    <div className="mt-4 space-y-3">
      {/* 1. Static Hint */}
      {staticHintVisible && (
        <div className="p-4 bg-gray-700 rounded-lg border border-yellow-500">
          <p className="font-semibold text-yellow-400">Hint 1:</p>
          <p className="text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: staticHintText }} />
        </div>
      )}

      {/* 2. AI-Generated Hints */}
      {aiHints.map((hint, index) => (
        <div key={index} className="p-4 bg-gray-700 rounded-lg border border-indigo-500">
          <p className="font-semibold text-indigo-400">AI Hint {index + 2}:</p>
          <p className="text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: hint }} />
        </div>
      ))}

      {/* 3. Loading State */}
      {isLoading && (
        <div className="p-4 bg-gray-700 rounded-lg border border-indigo-500 opacity-60">
          <p className="text-indigo-400 text-sm animate-pulse">Generating AI hint...</p>
        </div>
      )}

      {/* 4. Error State */}
      {error && (
        <div className="p-4 bg-gray-700 rounded-lg border border-red-500">
          <p className="font-semibold text-red-400">Error:</p>
          <p className="text-gray-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};


// This is the main panel component
const ProblemStatementPanel = ({
  challengeData,
  onGetHint,
  staticHintVisible,
  aiHints,
  isHintLoading,
  hintError
}) => {
  
  const {
    description,
    examples = [],
    constraints = [],
    followUp,
    hint // This is the static hint
  } = challengeData || {};

  // Determine the button text based on the state
  const getButtonText = () => {
    if (isHintLoading) {
      return "Getting AI Hint...";
    }
    if (!staticHintVisible) {
      return "Get Hint (Free)";
    }
    return "Get AI Hint (30s Penalty)";
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 overflow-auto border-r border-gray-700">
      
      {/* 1. Header with Hint Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Problem Statement</h2>
        {/* The hint button is now smarter */}
        {hint && (
          <button
            onClick={onGetHint}
            disabled={isHintLoading}
            title="Get a progressive hint"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
              ${staticHintVisible 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
              } disabled:bg-gray-500`}
          >
            <LightBulbIcon className="w-4 h-4" />
            {getButtonText()}
          </button>
        )}
      </div>
      
      {/* 2. Main Problem Description */}
      <div 
        className="prose prose-invert prose-pre:bg-gray-700 text-gray-300 mb-6"
        dangerouslySetInnerHTML={{ __html: description || "<p>Loading problem...</p>" }}
      />

      {/* 3. Hint Display Area */}
      {/* This new component will render all hints (static + AI) */}
      <HintDisplay 
        staticHint={hint}
        staticHintVisible={staticHintVisible}
        aiHints={aiHints}
        isLoading={isHintLoading}
        error={hintError}
      />
      
      {/* 4. Examples (Unchanged) */}
      {examples.map((ex, index) => (
        <div key={index} className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <p className="font-semibold text-white">Example {index + 1}:</p>
          <div className="bg-gray-800 p-3 rounded-md mt-2 whitespace-pre-wrap text-sm font-mono text-gray-200">
            <p><strong>Input:</strong> {ex.input}</p>
            <p><strong>Output:</strong> {ex.output}</p>
            {ex.explanation && (
              <p dangerouslySetInnerHTML={{ __html: `<strong>Explanation:</strong> ${ex.explanation}` }} />
            )}
          </div>
        </div>
      ))}
      
      {/* 5. Constraints (Unchanged) */}
      <div className="mt-6 mb-6">
        <p className="font-semibold text-white mb-2">Constraints:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
          {constraints.map((c, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: c }} />
          ))}
        </ul>
      </div>
      
      {/* 6. Follow-up (Unchanged) */}
      {followUp && (
        <div>
          <p className="font-semibold text-white mb-2">Follow-up:</p>
          <p className="text-gray-300 text-sm">{followUp}</p>
        </div>
      )}
    </div>
  );
};

export default ProblemStatementPanel;