import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { firestore, db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { nanoid } from 'nanoid';

// Helper to get a color based on difficulty
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

// Helper to get file extension
const getFileExtension = (lang) => {
  switch (lang?.toLowerCase()) {
    case 'python': return 'py';
    case 'javascript': return 'js';
    case 'java': return 'java';
    case 'c++': return 'cpp';
    default: return 'txt';
  }
};

const ProblemCard = ({ problem }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePracticeSolo = async () => {
    if (!currentUser) {
      alert("Please log in to practice.");
      return;
    }
    setLoading(true);

    try {
      // 1. SMART REUSE: Check if a practice room already exists
      const roomsRef = collection(firestore, 'rooms');
      const q = query(
        roomsRef, 
        where('hostId', '==', currentUser.uid),
        where('mode', '==', 'Practice')
      );
      
      const querySnapshot = await getDocs(q);
      let existingRoomId = null;

      querySnapshot.forEach((doc) => {
        const roomData = doc.data();
        if (roomData.problemId === problem.id) {
          existingRoomId = doc.id;
        }
      });

      if (existingRoomId) {
        console.log("Resuming existing practice room:", existingRoomId);
        navigate(`/room/${existingRoomId}`);
        return;
      }

      // 2. CREATE NEW ROOM
      const newRoomId = nanoid(10);
      
      // --- UPDATED: DEFAULT TO JAVA ---
      const language = userProfile?.preferredLanguage || 'Java'; 
      // --------------------------------

      const fileExtension = getFileExtension(language);
      const defaultFileId = nanoid();
      const defaultFileName = `Solution.${fileExtension}`;

      // A. Firestore Data
      await setDoc(doc(firestore, 'rooms', newRoomId), {
        roomId: newRoomId,
        hostId: currentUser.uid,
        hostUsername: userProfile.username || 'Anonymous',
        roomName: `Practice: ${problem.title}`,
        mode: 'Practice',
        problemId: problem.id,
        problemTitle: problem.title,
        language: language,
        privacy: 'Private',
        maxParticipants: 1,
        participants: [currentUser.uid],
        participantProfiles: [
          { uid: currentUser.uid, username: userProfile.username, avatar: userProfile.avatar }
        ],
        createdAt: serverTimestamp(),
      });

      // B. Realtime Database Data
      const rtdbUpdates = {
        files: {
          [defaultFileId]: {
            name: defaultFileName,
            code: problem.functionTemplate?.[language.toLowerCase()] || `// Write your ${language} solution here...`,
            output: 'Click "Run Code" to see output...'
          }
        },
        presence: {
          [currentUser.uid]: {
            activeFileId: defaultFileId
          }
        },
        challenge: {
          state: 'active',
          problemId: problem.id,
          problemTitle: problem.title,
          description: problem.description || "",
          examples: problem.examples || [],
          constraints: problem.constraints || [],
          hint: problem.hint || "",
          sampleTestCases: problem.sampleTestCases || [],
          hiddenTestCases: problem.hiddenTestCases || [],
          functionName: problem.functionName,
          functionSignature: problem.functionSignature,
          functionTemplate: problem.functionTemplate,
          startTime: Date.now(),
        }
      };

      await set(ref(db, `rooms/${newRoomId}`), rtdbUpdates);
      navigate(`/room/${newRoomId}`);

    } catch (err) {
      console.error("Error entering practice mode:", err);
      alert("Failed to start practice session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">{problem.title}</h4>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
          <span className="text-sm text-gray-400">{problem.topic}</span>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button 
          className="hidden sm:block bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
          onClick={() => alert("Full details view coming soon!")}
        >
          View Details
        </button>
        <button 
          onClick={handlePracticeSolo}
          disabled={loading}
          className="flex-1 sm:flex-none bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Loading...
            </>
          ) : (
            <>
              <span>🚀</span> Practice Solo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProblemCard;