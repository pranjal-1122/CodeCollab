import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { PISTON_API_URL, getPistonLanguage } from './pistonHelper';

// --- (normalizeOutput helper is unchanged) ---
/**
 * Normalizes an output string by removing all whitespace.
 * e.g., "[0, 1]\n" becomes "[0,1]"
 */
const normalizeOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/\s/g, ''); // Removes spaces, tabs, and newlines
};

// --- (ResultLine component is unchanged) ---
const ResultLine = ({ result, index }) => {
  let Icon = ClockIcon;
  let color = "text-gray-400";
  let statusText = "Running...";
  if (result.status === 'Passed') {
    Icon = CheckCircleIcon;
    color = "text-green-500";
    statusText = "Passed";
  } else if (result.status === 'Wrong Answer') {
    Icon = XCircleIcon;
    color = "text-red-500";
    statusText = "Wrong Answer";
  } else if (result.status === 'Error') {
    Icon = ExclamationTriangleIcon;
    color = "text-yellow-500";
    statusText = "Runtime Error";
  }
  return (
    <div className={`p-2 rounded-md ${result.status === 'Running' ? 'bg-gray-800' : 'bg-gray-700'}`}>
      <p className={`flex items-center gap-2 font-semibold ${color}`}>
        <Icon className="w-5 h-5" />
        Case {index + 1}: {statusText}
      </p>
      {result.status !== 'Passed' && result.status !== 'Running' && (
        <div className="mt-2 text-xs font-mono pl-7 space-y-1">
          <p><span className="font-bold">Input:</span> {result.input.replace(/\\n/g, ' ')}</p>
          <p><span className="font-bold">Expected:</span> {result.expected}</p>
          <p><span className="font-bold">Your Output:</span> {result.output || "(No output)"}</p>
        </div>
      )}
    </div>
  );
};

// Main Component
const ChallengeOutputPanel = ({ code, language, sampleTestCases }) => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // (handleRunTests function is unchanged)
  const handleRunTests = async () => {
    setLoading(true);
    const cases = Array.isArray(sampleTestCases) ? sampleTestCases : [];
    
    const initialResults = cases.map((tc) => ({
      status: 'Running',
      input: tc.input,
      expected: tc.expectedOutput,
      output: '',
    }));
    setTestResults(initialResults);

    const { language: pistonLang, version, mainFile } = getPistonLanguage(language);
    const finalResults = [];

    for (const testCase of cases) {
      const { input, expectedOutput } = testCase;
      const formattedInput = input.replace(/\\n/g, '\n');

      try {
        const response = await fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang,
            version: version,
            files: [{ name: mainFile, content: code }],
            stdin: formattedInput, 
          }),
        });
        const data = await response.json();

        if (data.run.stderr) {
          finalResults.push({ status: 'Error', input, expected: expectedOutput, output: data.run.stderr });
        }
        else if (normalizeOutput(data.run.stdout) === normalizeOutput(expectedOutput)) {
          finalResults.push({ status: 'Passed', input, expected: expectedOutput, output: data.run.stdout });
        }
        else {
          finalResults.push({ status: 'Wrong Answer', input, expected: expectedOutput, output: data.run.stdout });
        }
      } catch (err) {
        console.error(err);
        finalResults.push({ status: 'Error', input, expected: expectedOutput, output: 'Failed to run code. Check console.' });
      }
      setTestResults([...finalResults, ...initialResults.slice(finalResults.length)]);
    }
    setLoading(false);
  };

  // --- THIS IS THE FIX ---
  // Replaced "h-48 flex-shrink-0" with "h-full"
  return (
    <div className="h-full bg-gray-900 border-t border-gray-700 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Test Results</h3>
        <button
          onClick={handleRunTests}
          disabled={loading || !sampleTestCases || sampleTestCases.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 text-sm disabled:bg-gray-500"
        >
          {loading ? 'Running...' : 'Run Tests'}
        </button>
      </div>
      <div className="flex-1 overflow-auto space-y-2">
        {testResults.length === 0 && (
          <p className="text-gray-400">Click "Run Tests" to see sample case results.</p>
        )}
        {testResults.map((result, i) => (
          <ResultLine key={i} result={result} index={i} />
        ))}
      </div>
    </div>
  );
};

export default ChallengeOutputPanel;