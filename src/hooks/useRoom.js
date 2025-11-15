import { useState, useEffect } from 'react';
import { firestore, db } from '../services/firebase';
import { doc, onSnapshot as onFirestoreSnapshot } from 'firebase/firestore'; // (aliased)
// --- FIX 1: Removed 'update' which was unused ---
import { ref, onValue, set, push, remove, serverTimestamp } from 'firebase/database';
import { nanoid } from 'nanoid';

export const useRoom = (roomId, currentUser) => {
  // --- STATE (no change) ---
  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [files, setFiles] = useState(null);
  const [presence, setPresence] = useState(null);
  const [chat, setChat] = useState([]);
  const [loadingRTDB, setLoadingRTDB] = useState(true);
  const [error, setError] = useState(null);

  // --- EFFECT 1: FIRESTORE ---
useEffect(() => {
  if (!roomId || !currentUser) {
    setLoadingRoom(false);
    if (!roomId) setError("No room ID provided");
    return;
  }
  
  setLoadingRoom(true);
  const roomDocRef = doc(firestore, 'rooms', roomId);
  
  // Simple, single attempt listener
  const unsubscribe = onFirestoreSnapshot(
    roomDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        setRoom(docSnap.data());
        setError(null);
      } else {
        setError("Room not found");
        setRoom(null);
      }
      setLoadingRoom(false);
    },
    (err) => {
      console.error('Error listening to room:', err);
      setError(`Failed to load room data. (${err.message})`);
      setLoadingRoom(false);
    }
  );

  // Cleanup
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [roomId, currentUser]);

  // --- EFFECT 2: REALTIME DATABASE (no change) ---
  useEffect(() => {
    if (!roomId || !room || !currentUser) {
      setLoadingRTDB(false);
      return;
    }
    
    setLoadingRTDB(true);
    const rtdbRoomRef = ref(db, `rooms/${roomId}`);
    
    const unsubscribe = onValue(rtdbRoomRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFiles(data.files || {});
          setPresence(data.presence || {});

          const chatObject = data.chat || {};
          const chatList = Object.keys(chatObject).map(key => ({
            id: key,
            ...chatObject[key]
          })).sort((a, b) => a.timestamp - b.timestamp);
          setChat(chatList);

        } else {
          setFiles({});
          setPresence({});
          setChat([]);
        }
        setLoadingRTDB(false);
      }, 
      (err) => {
        console.error("Error listening to RTDB:", err);
        setError("Failed to load real-time data");
        setLoadingRTDB(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, room, currentUser]); 

  // --- FUNCTIONS (no change) ---
  const updateFileCode = (fileId, newCode) => {
    if (!roomId) return;
    const fileCodeRef = ref(db, `rooms/${roomId}/files/${fileId}/code`);
    set(fileCodeRef, newCode);
  };

  const updateFileOutput = (fileId, newOutput) => {
    if (!roomId) return;
    const fileOutputRef = ref(db, `rooms/${roomId}/files/${fileId}/output`);
    set(fileOutputRef, newOutput);
  };

  const updatePresence = (userId, activeFileId) => {
    if (!roomId || !userId) return;
    const presenceRef = ref(db, `rooms/${roomId}/presence/${userId}/activeFileId`);
    set(presenceRef, activeFileId);
  };

  const addNewFile = (fileName) => {
    if (!roomId) return;
    if (files && Object.keys(files).length >= 5) {
      alert("Error: Maximum of 5 files reached.");
      return;
    }
    const newFileId = nanoid(10);
    const newFileRef = ref(db, `rooms/${roomId}/files/${newFileId}`);
    set(newFileRef, {
      name: fileName,
      code: `// ${fileName}\n`,
      output: 'Click "Run Code" to see output...'
    });
  };

  const removeFile = (fileId) => {
    if (!roomId) return;
    
    const currentFiles = files || {};
    if (Object.keys(currentFiles).length <= 1) {
      console.warn("Cannot remove the last file.");
      return;
    }

    const fileRef = ref(db, `rooms/${roomId}/files/${fileId}`);
    remove(fileRef);
  };

  const sendChatMessage = (senderProfile, text) => {
    if (!roomId || !text.trim()) return;

    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const newMessageRef = push(chatRef);
    
    set(newMessageRef, {
      sender: {
        uid: senderProfile.uid,
        username: senderProfile.username,
        avatar: senderProfile.avatar
      },
      text: text,
      timestamp: serverTimestamp()
    });
  };

  // --- RETURN (no change) ---
  return {
    room,
    files,
    presence,
    chat,
    loading: loadingRoom || loadingRTDB,
    error,
    updateFileCode,
    updateFileOutput,
    updatePresence,
    addNewFile,
    removeFile,
    sendChatMessage,
  };
};