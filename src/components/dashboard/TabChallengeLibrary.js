import React, { useState, useEffect } from 'react';
import { firestore } from '../../services/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import ProblemCard from './ProblemCard'; // <-- 1. Import our new component

const TabChallengeLibrary = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. FETCH PROBLEMS FROM FIRESTORE ---
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const problemsRef = collection(firestore, 'problems');
        // Query to get all problems, ordered by topic
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
  }, []); // Run once on component mount

  // --- 2. GROUP PROBLEMS BY TOPIC ---
  const groupedProblems = problems.reduce((acc, problem) => {
    const topic = problem.topic || 'Uncategorized';
    if (!acc[topic]) {
      acc[topic] = []; // Create an array for this topic
    }
    acc[topic].push(problem); // Add the problem
    return acc;
  }, {}); // Start with an empty object

  // --- 3. RENDER LOGIC ---
  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-400">Loading problems...</p>;
    }

    if (error) {
      return <p className="text-red-400">{error}</p>;
    }

    if (problems.length === 0) {
      return (
        <p className="text-gray-400">
          No problems have been added to the library yet.
        </p>
      );
    }

    // Map over the grouped problems
    return (
      <div className="space-y-8">
        {Object.entries(groupedProblems).map(([topic, problemList]) => (
          <div key={topic}>
            {/* Topic Header [cite: 163] */}
            <h3 className="text-2xl font-bold text-white mb-4">
              {topic} ({problemList.length} problems)
            </h3>
            <div className="space-y-3">
              {problemList.map(problem => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold text-white mb-6">Challenge Library</h2>
      {/* TODO: Add Filters and Search [cite: 160-162] */}
      {renderContent()}
    </div>
  );
};

export default TabChallengeLibrary;