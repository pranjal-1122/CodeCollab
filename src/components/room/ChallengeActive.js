import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';

import { ref, set, get, onValue } from 'firebase/database';
import Editor from '@monaco-editor/react';
// --- 1. REMOVED LightBulbIcon (it's now only in the child panel) ---
import { ClockIcon, BellAlertIcon } from '@heroicons/react/24/solid';

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PISTON_API_URL, getPistonLanguage } from './pistonHelper'; 
import { generateFullScaffold } from './scaffoldHelper'; 

import ChallengeOutputPanel from './ChallengeOutputPanel';
import LiveStandings from './LiveStandings';
import ProblemStatementPanel from './ProblemStatementPanel'; // <-- IMPORTED

// (ProblemStatementPanel component is now REMOVED from this file. We'll modify the one in its own file in the next step.)

// ... (normalizeOutput, formatTime, FinalCountdown helpers are unchanged) ...
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
  
  // (Existing State is unchanged)
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

  // --- 2. ADD NEW HINT STATE ---
  const [staticHintVisible, setStaticHintVisible] = useState(false);
  const [aiHints, setAiHints] = useState([]); // Stores AI-generated hints
  const [timePenalty, setTimePenalty] = useState(0); // In seconds
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState(""); // Separate from submitError

  // (Existing useEffects for timer/finishers are unchanged)
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

  // (handleEditorChange is unchanged)
  const handleEditorChange = (value) => {
    setCode(value);
    setSubmitError("");
  };

  // --- 3. ADD NEW FUNCTION TO GET AI HINT ---
  const handleGetAiHint = async () => {
    // Case 1: First click. Just reveal the static hint. No API, no penalty.
    if (!staticHintVisible) {
      setStaticHintVisible(true);
      return;
    }

    // Case 2: Subsequent clicks. Call the AI for a new hint.
    setIsHintLoading(true);
    setHintError("");

    try {
      // --- A. Assemble all previous hints ---
      const previousHints = [challengeData.hint]; // Start with the static hint
      aiHints.forEach(hint => previousHints.push(hint));

      // --- B. Get the language-specific function template ---
      const lang = room.language.toLowerCase();
      const functionTemplate = challengeData.functionTemplate?.[lang];
      
      if (!functionTemplate) {
        throw new Error("Could not find function template for this language.");
      }

      // --- C. Call our new /api/getAiHint endpoint ---
      const response = await fetch('/api/getAiHint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription: challengeData.description,
          functionTemplate: functionTemplate,
          userCode: code, // The user's current code
          previousHints: previousHints // Send all past hints
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get hint from AI.');
      }

      // --- D. Success: Update state ---
      setAiHints(prev => [...prev, data.newHint]); // Add the new hint
      setTimePenalty(prev => prev + 30); // Add 30-second penalty

    } catch (err) {
      console.error("AI hint error:", err);
      setHintError(err.message || "Failed to get AI hint.");
    } finally {
      setIsHintLoading(false);
    }
  };


  // --- 4. MODIFY handleSubmit TO INCLUDE PENALTY ---
  const handleSubmit = async () => {
    if (isSubmitting || hasFinished) return;
    setIsSubmitting(true);
    setSubmitError("");
    const hiddenTestCases = challengeData?.hiddenTestCases || [];
    if (hiddenTestCases.length === 0) {
       console.warn("No hidden test cases found in challengeData.");
    }
    const { language: pistonLang, version, mainFile } = getPistonLanguage(room.language);
    
    // (Test case loop is unchanged)
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

    // --- THIS IS THE MODIFICATION ---
    setHasFinished(true);
    setIsSubmitting(false);
    
    const finalTime = elapsedSeconds + timePenalty; // Add penalty to final time

    const submissionRef = ref(db, `rooms/${room.roomId}/challenge/submissions/${currentUser.uid}`);
    await set(submissionRef, {
      username: userProfile.username,
      avatar: userProfile.avatar,
      finishTime: finalTime, // <-- SAVE THE PENALIZED TIME
      submittedAt: Date.now(),
    });
    // --- END OF MODIFICATION ---

    const timerRef = ref(db, `rooms/${room.roomId}/challenge/firstFinisherTime`);
    const timerSnap = await get(timerRef);
    if (!timerSnap.exists()) {
      await set(timerRef, Date.now());
    }
  };


  // --- 5. MODIFY THE JSX TO PASS PROPS AND SHOW PENALTY ---
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Header */}
      <div className="flex-shrink-0 bg-gray-800 p-3 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">
          Challenge: {challengeData?.problemTitle || "Loading..."}
        </h1>
        {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
        {hasFinished && <p className="text-green-400 text-lg font-bold">🎉 You finished!</p>}
        
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          {firstFinisherTime ? (
            <FinalCountdown firstFinisherTime={firstFinisherTime} />
          ) : (
            <span className="flex items-center gap-1 font-mono text-lg">
              <ClockIcon className="w-5 h-5" />
              {formatTime(elapsedSeconds)}
              
              {/* --- ADD PENALTY DISPLAY --- */}
              {timePenalty > 0 && (
                <span className="text-yellow-400 text-sm ml-1" title="Time penalty for hints">
                  + {formatTime(timePenalty)}
                </span>
              )}
            </span>
          )}
          
          {/* Submit Button (unchanged) */}
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
        <PanelGroup direction="horizontal">
          
          <Panel defaultSize={35} minSize={20}>
            {/* --- PASS ALL NEW PROPS TO THE PANEL --- */}
            <ProblemStatementPanel 
              challengeData={challengeData}
              onGetHint={handleGetAiHint}
              staticHintVisible={staticHintVisible}
              aiHints={aiHints}
              isHintLoading={isHintLoading}
              hintError={hintError}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />

          {/* (Rest of the panels are unchanged) */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <div className="bg-gray-800 h-full">
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
              <PanelResizeHandle className="h-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />
              <Panel defaultSize={30} minSize={10}>
                <ChallengeOutputPanel
                  code={code}
                  language={room.language}
                  sampleTestCases={challengeData?.sampleTestCases || []}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          
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