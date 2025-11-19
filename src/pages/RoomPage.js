import React, { useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom'; 
import FreeCodeRoom from '../components/room/FreeCodeRoom';
import ChallengeRoom from '../components/room/ChallengeRoom'; 

import { useAuth } from '../contexts/AuthContext';
import { firestore, db } from '../services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; 
import { ref, set, onDisconnect, onValue, serverTimestamp, remove } from 'firebase/database';

const RoomPage = () => {
  const { roomId } = useParams(); 
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  
  const { 
    room, files, presence, chat,
    loading: roomLoading, error, 
    updateFileCode, updateFileOutput, updatePresence, 
    addNewFile, removeFile, sendChatMessage
  } = useRoom(roomId, currentUser); 

  const loading = authLoading || roomLoading;
  const onDisconnectRef = useRef(null);
  const hasLeftRef = useRef(false);

  // (useEffect for join/leave - NO CHANGE)
  useEffect(() => {
    if (loading || !room || !currentUser || !userProfile || !files || Object.keys(files).length === 0) {
      return;
    }
    
    const currentUserId = currentUser.uid;
    const roomDocRef = doc(firestore, 'rooms', roomId);
    const userPresenceRef = ref(db, `rooms/${roomId}/presence/${currentUserId}`);

    // Add participant if not exists
    const isParticipantInFirestore = room.participants.includes(currentUserId);
    if (!isParticipantInFirestore) {
      const newParticipantProfile = {
        uid: currentUserId,
        username: userProfile.username,
        avatar: userProfile.avatar || null, 
      };
      updateDoc(roomDocRef, {
        participants: arrayUnion(currentUserId),
        participantProfiles: arrayUnion(newParticipantProfile),
      }).catch(err => console.error("Error adding participant:", err));
    }
    
    // Set Presence
    onValue(userPresenceRef, (snapshot) => {
      if (onDisconnectRef.current === null) {
        const firstFileId = Object.keys(files)[0];
        const initialPresence = { activeFileId: firstFileId, joinedAt: serverTimestamp() };
        
        set(userPresenceRef, initialPresence)
          .then(() => {
            onDisconnectRef.current = onDisconnect(userPresenceRef);
            onDisconnectRef.current.update({ leftAt: serverTimestamp() });
          });
      }
    }, { onlyOnce: true });
    
    // Cleanup function
    const leaveRoom = () => {
      if (hasLeftRef.current) return;
      hasLeftRef.current = true;

      if (onDisconnectRef.current) {
        onDisconnectRef.current.cancel(); 
      }
      remove(userPresenceRef); 
      
      // Only remove from participants list if it's NOT a Practice room
      // (Practice rooms persist the user so they can resume later)
      if (room.mode !== 'Practice') {
        const profileToRemove = {
          uid: currentUserId,
          username: userProfile.username,
          avatar: userProfile.avatar || null,
        };
        updateDoc(roomDocRef, {
          participants: arrayRemove(currentUserId),
          participantProfiles: arrayRemove(profileToRemove),
        }).catch(err => console.error("Error removing participant:", err));
      }
    };

    return () => {
      leaveRoom();
    };
    
  }, [loading, room, files, currentUser, userProfile, roomId]); 

  // (useEffect for host cleanup - NO CHANGE)
  useEffect(() => {
    if (loading || !room || !presence || currentUser.uid !== room.hostId) {
      return;
    }
    // We don't run cleanup for Practice rooms to avoid deleting the solo user accidentally
    if (room.mode === 'Practice') return;

    const roomDocRef = doc(firestore, 'rooms', roomId);

    Object.entries(presence).forEach(([uid, data]) => {
      if (data.leftAt) {
        console.log(`Host cleaning up disconnected user: ${uid}`);
        const profileToRemove = room.participantProfiles.find(p => p.uid === uid);
        
        remove(ref(db, `rooms/${roomId}/presence/${uid}`));
        
        if (profileToRemove) {
          updateDoc(roomDocRef, {
            participants: arrayRemove(uid),
            participantProfiles: arrayRemove(profileToRemove)
          });
        }
      }
    });

  }, [presence, room, loading, currentUser, roomId]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold">Joining Room...</h1>
      </div>
    );
  }

  if (error || !room) {
    console.error("RoomPage Error:", error);
    return <Navigate to="/dashboard" />;
  }

  // --- ROUTING LOGIC ---
  if (room.mode === 'Free Code') {
    return (
      <FreeCodeRoom 
        room={room} files={files} presence={presence} chat={chat}
        updateFileCode={updateFileCode} updateFileOutput={updateFileOutput}
        updatePresence={updatePresence} addNewFile={addNewFile}
        removeFile={removeFile} sendChatMessage={sendChatMessage}
      />
    );
  }

  // --- THIS IS THE UPDATE ---
  // We now treat 'Practice' the same as 'Challenge' for routing purposes
  if (room.mode === 'Challenge' || room.mode === 'Practice') {
    return (
      <ChallengeRoom 
        room={room} 
      />
    );
  }
  // --- END OF UPDATE ---

  // Fallback for any other mode
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Unknown Room Mode: {room.mode}</h1>
    </div>
  );
};

export default RoomPage;