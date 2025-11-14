import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';

import { ref, set, get, onValue } from 'firebase/database';
import Editor from '@monaco-editor/react';
import { ClockIcon, BellAlertIcon, LightBulbIcon } from '@heroicons/react/24/solid';

// This is the import for the resizable panels
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PISTON_API_URL, getPistonLanguage } from './pistonHelper'; 
import { generateFullScaffold } from './scaffoldHelper'; 

import ChallengeOutputPanel from './ChallengeOutputPanel';
import LiveStandings from './LiveStandings';

// ProblemStatementPanel component (no change)
const ProblemStatementPanel = ({ challengeData }) => {
  const {
    description,
    examples = [],
    constraints = [],
    followUp,
    hint
  } = challengeData || {};

  const [isHintVisible, setIsHintVisible] = useState(false);
  
  const toggleHintVisibility = () => {
    setIsHintVisible(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 overflow-auto border-r border-gray-700">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Problem Statement</h2>
        {hint && (
          <button
            onClick={toggleHintVisibility}
            title={isHintVisible ? "Hide hint" : "Show hint"}
            className={`p-1.5 rounded-full ${
              isHintVisible 
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <LightBulbIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div 
        className="prose prose-invert prose-pre:bg-gray-700 text-gray-300 mb-6"
        dangerouslySetInnerHTML={{ __html: description || "<p>Loading problem...</p>" }}
      />

      {isHintVisible && hint && (
        <div className="mb-4 p-4 bg-gray-700 rounded-lg border border-yellow-500">
          <p className="font-semibold text-yellow-400">Hint:</p>
          <p className="text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: hint }} />
        </div>
      )}
      
      {examples.map((ex, index) => (
        <div key={index} className="mb-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
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
      
      <div className="mb-6">
        <p className="font-semibold text-white mb-2">Constraints:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
          {constraints.map((c, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: c }} />
          ))}
        </ul>
      </div>
      
      {followUp && (
        <div>
          <p className="font-semibold text-white mb-2">Follow-up:</p>
          <p className="text-gray-300 text-sm">{followUp}</p>
        </div>
      )}
    </div>
  );
};

// ... (other helper components like normalizeOutput, formatTime are unchanged) ...
const normalizeOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/\s/g, ''); 
};
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
const FinalCountdown = ({ firstFinisherTime }) => {
  const [remaining, setRemaining] = useState(600);
  useEffect(() => {
    const endTime = firstFinisherTime + 600000;
    const update = () => {
      const msLeft = endTime - Date.now();
      const secsLeft = Math.max(0, Math.floor(msLeft / 1000));
      setRemaining(secsLeft);
    };
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [firstFinisherTime]);
  return (
    <span className="flex items-center gap-1 font-mono text-lg text-yellow-400 animate-pulse">
      <BellAlertIcon className="w-5 h-5" />
      Time left: {formatTime(remaining)}
    </span>
  );
};


// Main ChallengeActive component
const ChallengeActive = ({ room, challengeData, isHost }) => {
  const { currentUser, userProfile } = useAuth();
  
  // All state and logic (useState, useEffects, handleSubmit)
  // remains EXACTLY THE SAME.
  // ...
  const [code, setCode] = useState(() => {
    const { language } = room;
    const { functionSignature, functionTemplate, functionName } = challengeData;
    const funcStub = functionTemplate?.[language.toLowerCase()];
    if (functionSignature && funcStub && functionName) {
      return generateFullScaffold(language, functionSignature, funcStub, functionName);
    }
    return `// Error: Could not generate problem scaffold. Problem data is missing.\n// Please contact the admin.`;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasFinished, setHasFinished] = useState(false);
  const [firstFinisherTime, setFirstFinisherTime] = useState(null);

  useEffect(() => {
    if (challengeData?.firstFinisherTime) {
      setFirstFinisherTime(challengeData.firstFinisherTime);
    }
    const timerRef = ref(db, `rooms/${room.roomId}/challenge/firstFinisherTime`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      if (snapshot.exists()) {
        setFirstFinisherTime(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, [room.roomId, challengeData]);

  useEffect(() => {
    const startTime = challengeData?.startTime || Date.now();
    const intervalId = setInterval(() => {
      if (!hasFinished) { 
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [challengeData, hasFinished]);

  const handleEditorChange = (value) => {
    setCode(value);
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (isSubmitting || hasFinished) return;
    setIsSubmitting(true);
    setSubmitError("");
    const hiddenTestCases = challengeData?.hiddenTestCases || [];
    if (hiddenTestCases.length === 0) {
       console.warn("No hidden test cases found in challengeData.");
    }
    const { language: pistonLang, version, mainFile } = getPistonLanguage(room.language);
    for (const testCase of hiddenTestCases) {
      const { input, expectedOutput } = testCase;
      const formattedInput = input.replace(/\\n/g, '\n');
      try {
        const response = await fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang, 
            version, 
            files: [{ name: mainFile, content: code }],
            stdin: formattedInput,
          }),
        });
        const data = await response.json();
        if (data.run.stderr) {
          setSubmitError("Submission failed: Runtime Error.");
          setIsSubmitting(false);
          return;
        }
        if (normalizeOutput(data.run.stdout) !== normalizeOutput(expectedOutput)) {
          setSubmitError("Submission failed: Wrong Answer.");
          setIsSubmitting(false);
          return; 
        }
      } catch (err) {
        setSubmitError("An error occurred during submission.");
        setIsSubmitting(false);
        return;
      }
    }
    setHasFinished(true);
    setIsSubmitting(false);
    const submissionRef = ref(db, `rooms/${room.roomId}/challenge/submissions/${currentUser.uid}`);
    await set(submissionRef, {
      username: userProfile.username,
      avatar: userProfile.avatar,
      finishTime: elapsedSeconds,
      submittedAt: Date.now(),
    });
    const timerRef = ref(db, `rooms/${room.roomId}/challenge/firstFinisherTime`);
    const timerSnap = await get(timerRef);
    if (!timerSnap.exists()) {
      await set(timerRef, Date.now());
    }
  };
  // ...
  // --- END of unchanged logic ---


  // --- THIS IS THE UPDATED JSX ---
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Header (Unchanged) */}
      <div className="flex-shrink-0 bg-gray-800 p-3 flex justify-between items-center shadow-md z-10">
        {/* ... (no change) ... */}
        <h1 className="text-xl font-bold">
          Challenge: {challengeData?.problemTitle || "Loading..."}
        </h1>
        {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
        {hasFinished && <p className="text-green-400 text-lg font-bold">🎉 You finished!</p>}
        <div className="flex items-center gap-4">
          {firstFinisherTime ? (
            <FinalCountdown firstFinisherTime={firstFinisherTime} />
          ) : (
            <span className="flex items-center gap-1 font-mono text-lg">
              <ClockIcon className="w-5 h-5" />
              {formatTime(elapsedSeconds)}
            </span>
          )}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || hasFinished}
            className={`px-4 py-2 text-white font-semibold rounded-lg text-sm
              ${hasFinished ? 'bg-green-800' : 
               isSubmitting ? 'bg-gray-500 animate-pulse' : 
               'bg-green-600 hover:bg-green-700'
            }`}
          >
            {hasFinished ? 'Submitted' : isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Horizontal PanelGroup (no change) */}
        <PanelGroup direction="horizontal">
          
          <Panel defaultSize={35} minSize={20}>
            <ProblemStatementPanel challengeData={challengeData} />
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />

          {/* --- 1. THIS IS THE MODIFIED MIDDLE PANEL --- */}
          <Panel defaultSize={50} minSize={30}>
            {/* We've replaced the flex-col div with a vertical PanelGroup */}
            <PanelGroup direction="vertical">
              
              {/* Panel 1: Editor */}
              <Panel defaultSize={70} minSize={20}>
                <div className="bg-gray-800 h-full"> {/* h-full is crucial */}
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={room.language.toLowerCase()}
                    value={code}
                    onChange={handleEditorChange}
                    options={{ 
                      readOnly: hasFinished,
                      fontSize: 14, 
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </Panel>

              {/* Resize Handle */}
              <PanelResizeHandle className="h-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />

              {/* Panel 2: Terminal */}
              <Panel defaultSize={30} minSize={10}>
                <ChallengeOutputPanel
                  code={code}
                  language={room.language}
                  sampleTestCases={challengeData?.sampleTestCases || []}
                />
              </Panel>

            </PanelGroup>
          </Panel>
          {/* --- END OF MODIFICATION --- */}
          
          <PanelResizeHandle className="w-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />

          <Panel defaultSize={15} minSize={12}>
            <LiveStandings 
              roomId={room.roomId}
              participantProfiles={room.participantProfiles}
            />
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
};

export default ChallengeActive;