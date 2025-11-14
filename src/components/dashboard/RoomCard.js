import React from 'react';
import { Link } from 'react-router-dom';

// --- 1. A SIMPLE TRASH ICON COMPONENT ---
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.176-2.34.296a.75.75 0 00-.7.712c-.217 2.016-.432 4.032-.646 6.048a.75.75 0 00.7.797c.76.12 1.52.22 2.28.312v5.942a2.75 2.75 0 002.75 2.75h2.5a2.75 2.75 0 002.75-2.75V12.33a.75.75 0 00.7.797c.76.12 1.52.22 2.28.312a.75.75 0 00.7-.712c-.217-2.016-.432-4.032-.646-6.048a.75.75 0 00-.7-.797c-.76-.12-1.52-.22-2.28-.312V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 2.5a1.25 1.25 0 011.25 1.25v.443c-.795.077-1.58.176-2.34.296a.75.75 0 00-.16.01V3.75A1.25 1.25 0 0110 2.5zm-2.25 1.5v.443a.75.75 0 00-.16.01c-.76.12-1.52.22-2.28.312V3.75a1.25 1.25 0 011.25-1.25h.06a.75.75 0 00.15-.01c.76-.12 1.52-.22 2.28-.312V2.5h-.06A1.25 1.25 0 007.75 3.75z" clipRule="evenodd" />
  </svg>
);


// Helper to get a color based on the language (no change)
const getLanguageColor = (lang) => {
  switch (lang?.toLowerCase()) {
    case 'python': return 'bg-blue-500';
    case 'javascript': return 'bg-yellow-500';
    case 'java': return 'bg-red-500';
    case 'c++': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

// Helper to format the participant count (no change)
const getParticipantCount = (profiles, max) => {
  return `(${profiles?.length || 0}/${max || 'N/A'})`;
};

// --- 2. ACCEPT THE NEW PROPS ---
const RoomCard = ({ room, currentUserUid, onDeleteRoom }) => {
  
  // --- 3. DETERMINE IF THE USER IS THE HOST ---
  // This is only true if currentUserUid is passed AND it matches the hostId
  const isHost = room.hostId === currentUserUid;

  const handleDelete = (e) => {
    // Stop click from navigating to the room
    e.preventDefault(); 
    e.stopPropagation();
    if (onDeleteRoom) {
      onDeleteRoom(room.roomId, room.roomName);
    }
  };

  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex justify-between items-center">
      {/* Left Side: Room Details (no change) */}
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{room.roomName}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          {/* Language Tag */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLanguageColor(room.language)}`}>
            {room.language}
          </span>
          {/* Mode Tag */}
          <span className="font-medium">{room.mode} Mode</span>
          {/* Participant Count */}
          <span className="font-medium">
            {getParticipantCount(room.participantProfiles, room.maxParticipants)}
          </span>
        </div>
      </div>

      {/* Right Side: Action Button(s) */}
      {/* --- 4. UPDATED TO SHOW BUTTONS IN A ROW --- */}
      <div className="flex items-center gap-2">
        <Link
          to={`/room/${room.roomId}`}
          className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Rejoin Room
        </Link>

        {/* --- 5. CONDITIONALLY RENDER DELETE BUTTON --- */}
        {/* Only show if isHost is true AND the onDeleteRoom function was passed */}
        {isHost && onDeleteRoom && (
          <button
            onClick={handleDelete}
            title="Delete Room"
            className="p-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;