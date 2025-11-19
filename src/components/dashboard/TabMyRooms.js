import React, { useState, useEffect } from 'react';
import { firestore, db } from '../../services/firebase'; // <-- 1. IMPORT 'db'
import { useAuth } from '../../contexts/AuthContext';
// --- 2. IMPORT FIRESTORE/RTDB FUNCTIONS ---
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, remove } from 'firebase/database';
import RoomCard from './RoomCard';

const TabMyRooms = () => {
  const { currentUser } = useAuth();
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (useEffect for fetching rooms is unchanged)
  useEffect(() => {
    if (!currentUser) return;

    const fetchMyRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const roomsRef = collection(firestore, 'rooms');
        const q = query(
          roomsRef,
          where('participants', 'array-contains', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const rooms = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // --- THIS IS THE UPDATE ---
          // We exclude "Practice" rooms so they don't clutter the dashboard
          if (data.mode !== 'Practice') {
            rooms.push({ id: doc.id, ...data });
          }         
          
        });

        setMyRooms(rooms);

      } catch (err) {
        console.error("Error fetching user's rooms:", err);
        setError("Failed to load your rooms.");
      }
      setLoading(false);
    };

    fetchMyRooms();
  }, [currentUser]);

  // --- 3. ADD THE DELETE HANDLER ---
  // This goes inside your TabMyRooms component

  const handleDeleteRoom = async (roomId, roomName) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the room "${roomName}"? This action is permanent.`)) {
      return;
    }

    try {
      // 1. Delete from Firestore
      const roomDocRef = doc(firestore, 'rooms', roomId);
      await deleteDoc(roomDocRef);

      // 2. Delete from Realtime Database
      const rtdbRoomRef = ref(db, `rooms/${roomId}`);
      await remove(rtdbRoomRef);

      // 3. Update the UI *only on success*
      setMyRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));

    } catch (err) {
      // 4. If any part fails, show an error and *do not* update the UI
      console.error("Error deleting room:", err);
      setError(`Failed to delete room. (Check security rules? Error: ${err.message})`);
    }
  };

  // 4. Render logic (updated to pass props)
  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-400">Loading your rooms...</p>;
    }

    if (error) {
      return <p className="text-red-400">{error}</p>;
    }

    if (myRooms.length === 0) {
      return (
        <p className="text-gray-400">
          You haven't joined or created any rooms yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Active & Recent Rooms</h2>
        {myRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            // Pass the current user's ID and the delete handler
            currentUserUid={currentUser.uid}
            onDeleteRoom={handleDeleteRoom}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      {renderContent()}
    </div>
  );
};

export default TabMyRooms;