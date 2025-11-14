import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../../services/firebase';
// --- 1. IMPORT 'onSnapshot' INSTEAD OF 'getDocs' ---
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import RoomCard from './RoomCard';

const TabJoinRoom = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");
  
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // (handleJoinRoom function is unchanged)
  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError("");

    if (!roomInput) {
      setError("Please enter a room ID or link.");
      return;
    }

    let roomId = roomInput;
    if (roomInput.includes('/room/')) {
      const parts = roomInput.split('/room/');
      roomId = parts[parts.length - 1];
    }
    
    navigate(`/room/${roomId}`);
  };

  // --- 2. THIS useEffect IS NOW A REALTIME LISTENER ---
  useEffect(() => {
    setLoading(true);
    const roomsRef = collection(firestore, 'rooms');
    
    const q = query(
      roomsRef,
      where('privacy', '==', 'Public'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    // Replace getDocs with onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // This code runs every time the data changes in Firestore
      const rooms = [];
      querySnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() });
      });
      setPublicRooms(rooms);
      setLoading(false);
    }, (err) => {
      // This is the error handler
      console.error("Error fetching public rooms:", err);
      setError("Failed to load public rooms.");
      setLoading(false);
    });

    // 3. Return the unsubscribe function for cleanup
    // This stops the listener when the component unmounts
    return () => unsubscribe();
    
  }, []); // The empty array is correct, it only runs the setup once

  // --- 3. RENDER (no change) ---
  return (
    <div className="p-4 bg-gray-800 rounded-lg max-w-4xl mx-auto">
      
      {/* Section 1: Join by ID (no change) */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Join a Room by ID</h2>
        <form onSubmit={handleJoinRoom} className="flex gap-2">
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Room Code or Paste Link..."
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2"
          >
            Join Room
          </button>
        </form>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>

      <hr className="border-gray-700 my-8" />

      {/* Section 2: Browse Public Rooms (no change) */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Browse Public Rooms</h2>
        {loading && <p className="text-gray-400">Loading rooms...</p>}
        
        {!loading && publicRooms.length === 0 && (
          <p className="text-gray-400">No public rooms available right now. Why not create one?</p>
        )}

        <div className="space-y-4">
          {publicRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default TabJoinRoom;