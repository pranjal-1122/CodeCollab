import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// --- 1. ADDED FIRESTORE IMPORTS ---
import { db, firestore } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore'; 
// ----------------------------------
import { ref, set, get, onValue } from 'firebase/database';
import Editor from '@monaco-editor/react';
import { ClockIcon, BellAlertIcon } from '@heroicons/react/24/solid';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { PISTON_API_URL, getPistonLanguage } from './pistonHelper'; 
import { generateFullScaffold } from './scaffoldHelper'; 
import { useLiveMentor } from '../../hooks/useLiveMentor';

import ChallengeOutputPanel from './ChallengeOutputPanel';
import LiveStandings from './LiveStandings';
import ProblemStatementPanel from './ProblemStatementPanel';


const getMonacoLanguage = (lang) => {
  const lower = lang?.toLowerCase();
  if (lower === 'c++' || lower === 'cpp') return 'cpp';
  return lower;
};

// Helpers (Unchanged)
const normalizeOutput = (str) => (typeof str !== 'string' ? '' : str.replace(/\s/g, ''));
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
      setRemaining(Math.max(0, Math.floor(msLeft / 1000)));
    };
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [firstFinisherTime]);
  return (
    <span className="flex items-center gap-1 font-mono text-lg text-yellow-400 animate-pulse">
      <BellAlertIcon className="w-5 h-5" /> Time left: {formatTime(remaining)}
    </span>
  );
};

const ChallengeActive = ({ room, challengeData, isHost }) => {
  const { currentUser, userProfile } = useAuth();
  const isPracticeMode = room.mode === 'Practice';

  // --- 2. LANGUAGE STATE ---
  const [currentLang, setCurrentLang] = useState(room.language || 'Java');

  // Code State
  const [code, setCode] = useState(() => {
    const { functionSignature, functionTemplate, functionName } = challengeData;
    // Use 'currentLang' instead of 'room.language'
    const funcStub = functionTemplate?.[currentLang.toLowerCase()];
    if (functionSignature && funcStub && functionName) {
      return generateFullScaffold(currentLang, functionSignature, funcStub, functionName);
    }
    return `// Error: Could not generate problem scaffold.\n`;
  });
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasFinished, setHasFinished] = useState(false);
  const [firstFinisherTime, setFirstFinisherTime] = useState(null);

  // Hint & Mentor State (Unchanged)
  const [staticHintVisible, setStaticHintVisible] = useState(false);
  const [aiHints, setAiHints] = useState([]); 
  const [timePenalty, setTimePenalty] = useState(0); 
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState("");
  const [isMentorEnabled, setIsMentorEnabled] = useState(true);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // --- 3. HANDLE LANGUAGE CHANGE ---
  const handleLanguageChange = async (newLang) => {
    if (newLang === currentLang) return;
    
    // Warning: This resets code!
    if (!window.confirm(`Switching to ${newLang} will reset your current code. Continue?`)) {
      return;
    }

    // A. Generate new scaffold
    const { functionSignature, functionTemplate, functionName } = challengeData;
    const funcStub = functionTemplate?.[newLang.toLowerCase()];
    
    if (funcStub) {
      const newCode = generateFullScaffold(newLang, functionSignature, funcStub, functionName);
      setCode(newCode);
      setCurrentLang(newLang);
      
      // B. Save preference to Firestore (so it resumes correctly next time)
      try {
        const roomRef = doc(firestore, 'rooms', room.roomId);
        await updateDoc(roomRef, { language: newLang });
      } catch (err) {
        console.error("Failed to save language preference:", err);
      }
    } else {
      alert(`Sorry, no template available for ${newLang}`);
    }
  };

  // --- 4. UPDATED MENTOR HOOK ---
  const { feedback, loading: mentorLoading } = useLiveMentor(
    isPracticeMode && isMentorEnabled ? room.problemId : null, 
    code, 
    currentLang, // <--- Use currentLang
    challengeData
  );

  // Visuals (Squiggly Lines) - Unchanged
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!feedback || !isMentorEnabled) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const position = editor.getPosition();
    let className = '';
    let glyphMarginClassName = '';
    let hoverMessage = '';

    if (feedback.type === 'hint') {
      className = 'squiggly-warning';
      glyphMarginClassName = 'glyph-warning';
      hoverMessage = `💡 MENTOR: ${feedback.message}`;
    } else if (feedback.type === 'praise') {
      className = 'highlight-success';
      glyphMarginClassName = 'glyph-success';
      hoverMessage = `🎉 MENTOR: ${feedback.message}`;
    }

    const newDecorations = [{
        range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 100),
        options: {
          isWholeLine: true, className, glyphMarginClassName,
          hoverMessage: { value: hoverMessage },
          minimap: { color: feedback.type === 'hint' ? '#eab308' : '#22c55e', position: 1 }
        },
    }];
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [feedback, isMentorEnabled]);

  // Standard Effects (Timer, etc) - Unchanged
  useEffect(() => {
    if (challengeData?.firstFinisherTime) setFirstFinisherTime(challengeData.firstFinisherTime);
    const timerRef = ref(db, `rooms/${room.roomId}/challenge/firstFinisherTime`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      if (snapshot.exists()) setFirstFinisherTime(snapshot.val());
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

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const style = document.createElement('style');
    style.innerHTML = `
      .squiggly-warning { background: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23fbbf24'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left; padding-bottom: 2px; }
      .highlight-success { background-color: rgba(34, 197, 94, 0.15); border-left: 2px solid #22c55e; }
      .glyph-warning:before { content: "⚠️"; }
      .glyph-success:before { content: "✅"; }
    `;
    document.head.appendChild(style);
  };

  const handleEditorChange = (value) => { setCode(value); setSubmitError(""); };
  const handleGetAiHint = async () => { /* ... existing hint logic ... */ };

  // --- 5. SUBMIT USING CURRENT LANG ---
  const handleSubmit = async () => {
    if (isSubmitting || hasFinished) return;
    setIsSubmitting(true);
    setSubmitError("");
    const hiddenTestCases = challengeData?.hiddenTestCases || [];
    // Use 'currentLang'
    const { language: pistonLang, version, mainFile } = getPistonLanguage(currentLang);
    
    for (const testCase of hiddenTestCases) {
      const { input, expectedOutput } = testCase;
      const formattedInput = input.replace(/\\n/g, '\n');
      try {
        const response = await fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang, version, files: [{ name: mainFile, content: code }], stdin: formattedInput,
          }),
        });
        const data = await response.json();
        if (data.run.stderr || normalizeOutput(data.run.stdout) !== normalizeOutput(expectedOutput)) {
          setSubmitError(data.run.stderr ? "Submission failed: Runtime Error." : "Submission failed: Wrong Answer.");
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
    const finalTime = elapsedSeconds + timePenalty;
    const submissionRef = ref(db, `rooms/${room.roomId}/challenge/submissions/${currentUser.uid}`);
    await set(submissionRef, {
      username: userProfile.username || 'Anonymous', // Added fallback
      avatar: userProfile.avatar || null,
      finishTime: finalTime,
      submittedAt: Date.now(),
    });
    const timerRef = ref(db, `rooms/${room.roomId}/challenge/firstFinisherTime`);
    const timerSnap = await get(timerRef);
    if (!timerSnap.exists()) await set(timerRef, Date.now());
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-shrink-0 bg-gray-800 p-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">
            {isPracticeMode ? "Practice Mode:" : "Challenge:"} {challengeData?.problemTitle || "Loading..."}
          </h1>
          
          {/* --- 6. THE NEW DROPDOWN --- */}
          {isPracticeMode && (
            <select 
              value={currentLang} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-700 text-white text-xs font-bold rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500 hover:bg-gray-600 cursor-pointer"
            >
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
            </select>
          )}

          {isPracticeMode && (
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full border border-gray-600">
              <span className="text-xs font-bold text-indigo-400">LIVE MENTOR</span>
              <button 
                onClick={() => setIsMentorEnabled(!isMentorEnabled)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${isMentorEnabled ? 'bg-indigo-600' : 'bg-gray-500'}`}
              >
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${isMentorEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
        
        <div className="flex items-center gap-4">
          {isPracticeMode && feedback && isMentorEnabled && (
            <div className={`text-sm font-semibold animate-pulse ${feedback.type === 'hint' ? 'text-yellow-400' : 'text-green-400'}`}>
              {feedback.message}
            </div>
          )}
          
          {!isPracticeMode && (
            firstFinisherTime ? <FinalCountdown firstFinisherTime={firstFinisherTime} /> : 
            <span className="flex items-center gap-1 font-mono text-lg"><ClockIcon className="w-5 h-5" />{formatTime(elapsedSeconds)}</span>
          )}
          
          {!isPracticeMode && (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || hasFinished}
              className={`px-4 py-2 text-white font-semibold rounded-lg text-sm ${hasFinished ? 'bg-green-800' : isSubmitting ? 'bg-gray-500 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {hasFinished ? 'Submitted' : isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}

          {isPracticeMode && (
             <button onClick={() => window.location.hash = '#/dashboard'} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg text-sm hover:bg-gray-600">
               Exit Practice
             </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={35} minSize={20}>
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
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <div className="bg-gray-800 h-full relative">
                  {mentorLoading && isMentorEnabled && (
                    <div className="absolute top-2 right-4 z-20 text-xs text-indigo-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"/> Mentor Analyzing...
                    </div>
                  )}
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={getMonacoLanguage(currentLang)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{ readOnly: hasFinished, fontSize: 14, minimap: { enabled: false }, wordWrap: 'on', glyphMargin: true }}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="h-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />
              <Panel defaultSize={30} minSize={10}>
                <ChallengeOutputPanel
                  code={code}
                  language={currentLang} // <--- Use currentLang
                  sampleTestCases={challengeData?.sampleTestCases || []}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          {!isPracticeMode && (
            <>
              <PanelResizeHandle className="w-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />
              <Panel defaultSize={15} minSize={12}>
                <LiveStandings roomId={room.roomId} participantProfiles={room.participantProfiles} />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
};

export default ChallengeActive;