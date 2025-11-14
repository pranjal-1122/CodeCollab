import React, { useState, useEffect, useMemo } from 'react';
import { firestore, db } from '../../services/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { ref, update } from 'firebase/database';

// WaitingView component (no changes)
const WaitingView = ({ roomName }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
    <h1 className="text-4xl font-bold mb-4">Challenge Room: {roomName}</h1>
    <p className="text-xl text-gray-300 mb-8">Waiting for host to start the challenge...</p>
    <div className="w-full max-w-lg bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Get Ready!</h2>
      <p className="text-gray-400">The host is selecting a problem. The challenge will begin soon.</p>
    </div>
  </div>
);

// HostView component (updated handler)
const HostView = ({ room, problems }) => {
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [problemId, setProblemId] = useState('');
  const [loading, setLoading] = useState(false); 

  // allTopics logic (no changes)
  const allTopics = useMemo(() => {
    const topics = new Set(problems.map(p => p.topic));
    return ['All', ...Array.from(topics)];
  }, [problems]);

  // filteredProblems logic (no changes)
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const diffMatch = difficulty === 'All' || p.difficulty === difficulty;
      const topicMatch = topic === 'All' || p.topic === topic;
      return diffMatch && topicMatch;
    });
  }, [problems, difficulty, topic]);
  
  // --- THIS IS THE UPDATED HANDLER ---
  const handleStartChallenge = async () => {
    if (!problemId) {
      alert("Please select a problem first.");
      return;
    }
    setLoading(true);

    const selectedProblem = problems.find(p => p.id === problemId);
    if (!selectedProblem) {
      alert("Error: Could not find selected problem.");
      setLoading(false);
      return;
    }

    try {
      const challengeRef = ref(db, `rooms/${room.roomId}/challenge`);
      
      // --- THIS IS THE FIX ---
      // We are now copying all the rich data, not just 'statement'
      await update(challengeRef, {
        state: 'countdown',
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        problemDifficulty: selectedProblem.difficulty,
        problemTopic: selectedProblem.topic,
        
        // The new rich data fields
        description: selectedProblem.description || "",
        examples: selectedProblem.examples || [],
        constraints: selectedProblem.constraints || [],
        followUp: selectedProblem.followUp || "",
        topics: selectedProblem.topics || [],
        hint: selectedProblem.hint || "",

        // Data for the test harness
        sampleTestCases: selectedProblem.sampleTestCases || [],
        functionName: selectedProblem.functionName,
        functionSignature: selectedProblem.functionSignature,
        functionTemplate: selectedProblem.functionTemplate,
        
        startTime: Date.now() + 10000, // 10 seconds in the future
      });
      // --- END OF FIX ---

    } catch (err) {
      console.error("Failed to start challenge:", err);
      alert("Error starting challenge. See console for details.");
      setLoading(false);
    }
  };

  // --- All JSX for HostView is unchanged ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Challenge Room: {room.roomName}</h1>
      <p className="text-xl text-green-400 mb-8">You are the host. Select a problem to begin.</p>
      
      <div className="w-full max-w-lg bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Participants ({room.participantProfiles.length}/{room.maxParticipants})</h2>
        <ul className="space-y-2">
          {room.participantProfiles.map(p => (
            <li key={p.uid} className="flex items-center gap-3">
              <img src={p.avatar || 'https://i.imgur.com/6bE0a8Z.png'} alt={p.username} className="w-8 h-8 rounded-full" />
              <span>{p.username} {p.uid === room.hostId && '(Host)'}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full max-w-lg bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Challenge Settings</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300">Difficulty</label>
              <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option>All</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-300">Topic</label>
              <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                {allTopics.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-300">Choose Problem</label>
            <select id="problem" value={problemId} onChange={(e) => setProblemId(e.target.value)}
              disabled={filteredProblems.length === 0}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-600 disabled:text-gray-400">
              <option value="">{filteredProblems.length === 0 ? 'No problems match filters' : 'Select a problem...'}</option>
              {filteredProblems.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleStartChallenge}
          disabled={!problemId || loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-lg mt-6 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Starting...' : 'Start Challenge'}
        </button>
      </div>
    </div>
  );
};

// Main ChallengeLobby component (no changes)
const ChallengeLobby = ({ room, isHost }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isHost) {
      setLoading(false);
      return;
    }
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const problemsRef = collection(firestore, 'problems');
        const q = query(problemsRef, orderBy('topic'), orderBy('title'));
        const querySnapshot = await getDocs(q);
        const fetchedProblems = [];
        querySnapshot.forEach((doc) => {
          fetchedProblems.push({ id: doc.id, ...doc.data() });
        });
        setProblems(fetchedProblems);
      } catch (err) {
        console.error("Error fetching problems:", err);
        setError("Failed to load challenge library.");
      }
      setLoading(false);
    };
    fetchProblems();
  }, [isHost]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white p-10">Loading Problem Library...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gray-900 text-red-400 p-10">Error: {error}</div>;
  }

  if (isHost) {
    return <HostView room={room} problems={problems} />;
  } else {
    return <WaitingView roomName={room.roomName} />;
  }
};

export default ChallengeLobby;