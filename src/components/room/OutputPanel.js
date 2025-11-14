import React, { useState } from 'react';

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

// --- (getPistonLanguage helper is unchanged) ---
const getPistonLanguage = (lang) => {
  switch (lang.toLowerCase()) {
    case 'python':
      return { language: 'python', version: '3.10.0', mainFile: 'main.py' };
    case 'javascript':
      return { language: 'javascript', version: '18.15.0', mainFile: 'main.js' };
    case 'java':
      return { language: 'java', version: '15.0.2', mainFile: 'Main.java' };
    case 'c++':
      return { language: 'cpp', version: '10.2.0', mainFile: 'main.cpp' };
    default:
      return { language: 'python', version: '3.10.0', mainFile: 'main.py' };
  }
};

const OutputPanel = ({ activeFile, language, updateFileOutput }) => {
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [stdin, setStdin] = useState(""); 
  const [activeTab, setActiveTab] = useState('output');

  // (runCode function is unchanged)
  const runCode = async () => {
    if (!activeFile) return;

    setLoading(true);
    setIsError(false);
    setActiveTab('output'); 
    updateFileOutput(activeFile.id, 'Running code...'); 

    const { language: pistonLang, version, mainFile } = getPistonLanguage(language);

    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLang,
          version: version,
          files: [
            {
              name: mainFile,
              content: activeFile.code,
            },
          ],
          stdin: stdin, 
          args: [],
          compile_timeout: 10000, run_timeout: 3000,
        }),
      });
      const data = await response.json();

      if (data.run.stderr) {
        setIsError(true);
        updateFileOutput(activeFile.id, data.run.stderr);
      } else {
        setIsError(false);
        updateFileOutput(activeFile.id, data.run.stdout || '(No output)');
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      updateFileOutput(activeFile.id, 'Failed to run code. Check console.');
    }
    setLoading(false);
  };

  // --- THIS IS THE FIX ---
  // Changed "h-64" to "h-full"
  return (
    <div className="h-full flex-shrink-0 bg-gray-900 border-t border-gray-700 flex flex-col">
      
      {/* Top Bar: Tabs + Run Button (no change) */}
      <div className="flex justify-between items-center border-b border-gray-700">
        {/* Tabs for Input/Output */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('output')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'output' 
                ? 'text-white border-b-2 border-indigo-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Output
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'input' 
                ? 'text-white border-b-2 border-indigo-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Input (stdin)
          </button>
        </div>

        {/* Run Button */}
        <button
          onClick={runCode}
          disabled={loading || !activeFile}
          className="bg-green-600 text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-500 mr-2"
        >
          {loading ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      {/* Content Area (no change) */}
      <div className="flex-1 overflow-auto">
        {/* Output Panel (shows by default) */}
        <div className={activeTab === 'output' ? 'block' : 'hidden'}>
          <pre className={`p-4 text-white whitespace-pre-wrap font-mono text-sm ${isError ? 'text-red-400' : ''}`}>
            {activeFile ? activeFile.output : 'Loading...'}
          </pre>
        </div>
        
        {/* Input Panel (hidden by default) */}
        <div className={`h-full ${activeTab === 'input' ? 'block' : 'hidden'}`}>
          <textarea
            id="stdin"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            className="w-full h-full bg-gray-800 text-white p-4 focus:outline-none font-mono text-sm"
            placeholder="Enter all program input here before running..."
          />
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;