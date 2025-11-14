import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Editor from '@monaco-editor/react';

// --- 1. IMPORT THE RESIZABLE PANELS ---
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import FileTabsBar from './FileTabsBar';
import ParticipantPanel from './ParticipantPanel';
import OutputPanel from './OutputPanel';

import { useVoiceChat } from '../../hooks/useVoiceChat';

// A small helper component to render the audio
const AudioPlayer = ({ stream }) => {
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);
  return <audio ref={audioRef} autoPlay playsInline />;
};

const useDebounce = (callback, delay) => {
  const [timeoutId, setTimeoutId] = useState(null);
  return useCallback((...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
};

const FreeCodeRoom = ({
  room,
  files,
  presence,
  chat,
  updateFileCode,
  updateFileOutput,
  updatePresence,
  addNewFile,
  removeFile,
  sendChatMessage
}) => {
  const { currentUser } = useAuth();
  
  const [activeFileId, setActiveFileId] = useState(null);
  const [followingUserId, setFollowingUserId] = useState(null);
  const [localCode, setLocalCode] = useState(null);
  
  const isTyping = useRef(false);
  const editorRef = useRef(null);

  const participantIds = room.participants || [];
  const { remoteStreams, isMuted, toggleMute, isSpeaking } = useVoiceChat(room.roomId, participantIds, participantIds.join(','));

  const debouncedUpdateCode = useDebounce((fileId, code) => {
    updateFileCode(fileId, code);
  }, 100);

  // (All the useEffects and handlers remain the same)
  useEffect(() => {
    if (!activeFileId && files && Object.keys(files).length > 0) {
      const firstFileId = Object.keys(files)[0];
      setActiveFileId(firstFileId);
      setLocalCode(files[firstFileId].code);
      updatePresence(currentUser.uid, firstFileId);
    }
    
    if (activeFileId && files && files[activeFileId]) {
      const dbCode = files[activeFileId].code;
      if (!followingUserId) { 
        if (!isTyping.current && dbCode !== localCode) {
          setLocalCode(dbCode);
        }
      }
    }
  }, [files, activeFileId, currentUser.uid, updatePresence, followingUserId, localCode]);

  useEffect(() => {
    if (followingUserId && presence && presence[followingUserId]) {
      const followedFileId = presence[followingUserId].activeFileId;
      if (followedFileId !== activeFileId) {
        setActiveFileId(followedFileId);
      }
      if (files && files[followedFileId] && files[followedFileId].code !== localCode) {
        setLocalCode(files[followedFileId].code);
      }
    }
  }, [followingUserId, presence, files, activeFileId, localCode]); 

  useEffect(() => {
    if (files && activeFileId && !files[activeFileId]) {
      // The file we were watching was deleted!
      console.warn(`Active file ${activeFileId} was deleted. Switching to a new file.`);
      const remainingFileIds = Object.keys(files);
      
      if (remainingFileIds.length > 0) {
        const newActiveFileId = remainingFileIds[0];
        
        // Manually set the new file state, just like handleSelectFile
        setFollowingUserId(null); 
        isTyping.current = false;
        setActiveFileId(newActiveFileId);
        setLocalCode(files[newActiveFileId].code);
        
        // Update presence if currentUser is available
        if (currentUser?.uid) {
          updatePresence(currentUser.uid, newActiveFileId);
        }
      } else {
        // This shouldn't happen if removeFile logic is correct, but as a fallback:
        setActiveFileId(null);
        setLocalCode(null);
      }
    }
  }, [files, activeFileId, currentUser, updatePresence]);

  const handleSelectFile = (fileId) => {
    setFollowingUserId(null); 
    isTyping.current = false;
    setActiveFileId(fileId);
    setLocalCode(files[fileId].code);
    updatePresence(currentUser.uid, fileId);
  };

  const handleFollowUser = (userIdToFollow) => {
    isTyping.current = false; 
    if (followingUserId === userIdToFollow) {
      setFollowingUserId(null);
    } else {
      setFollowingUserId(userIdToFollow);
      if (presence && presence[userIdToFollow]) {
        const followedFileId = presence[userIdToFollow].activeFileId;
        setActiveFileId(followedFileId);
        if (files && files[followedFileId]) {
          setLocalCode(files[followedFileId].code);
        }
      }
    }
  };

  const handleEditorChange = (value) => {
    if (followingUserId) {
      setFollowingUserId(null);
    }
    isTyping.current = true;
    setLocalCode(value);
    if (activeFileId) {
      debouncedUpdateCode(activeFileId, value);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidFocusEditorText(() => {
      if (followingUserId) {
        setFollowingUserId(null); 
      }
      // Do NOT set isTyping.current = true here
    });
    editor.onDidBlurEditorText(() => {
      isTyping.current = false;
    });
  };

  const handleCloseFile = (fileId) => {
    if (files && Object.keys(files).length <= 1) {
      alert("You cannot close the last file.");
      return;
    }
    if (fileId === activeFileId) {
      const fileIds = Object.keys(files);
      const newActiveFileId = fileIds.find(id => id !== fileId);
      if (newActiveFileId) {
        handleSelectFile(newActiveFileId);
      }
    }
    removeFile(fileId);
  };
  // (End of unchanged logic)


  if (!files || !activeFileId || !files[activeFileId] || localCode === null) {
    return <div className="min-h-screen bg-gray-900 text-white p-10">Loading files...</div>;
  }

  const activeFile = {
    id: activeFileId,
    ...files[activeFileId]
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">

      {/* Render the hidden audio players (no change) */}
      <div style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <AudioPlayer key={peerId} stream={stream} />
        ))}
      </div>

      {/* Header (no change) */}
      <div className="flex-shrink-0 bg-gray-800 p-4 shadow-md z-10">
        <h1 className="text-2xl font-bold">{room.roomName}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Coding Area */}
        <div className="flex-1 flex flex-col">
          <FileTabsBar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onAddNewFile={addNewFile}
            onCloseFile={handleCloseFile}
            language={room.language}
          />

          {/* --- 2. ADD THE RESIZABLE PANEL GROUP --- */}
          <PanelGroup direction="vertical">
            {/* Editor Panel */}
            <Panel defaultSize={70} minSize={20}>
              <div className="bg-gray-800 h-full"> {/* h-full ensures editor fills panel */}
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={room.language.toLowerCase()}
                  value={localCode}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{ 
                    fontSize: 14, 
                    minimap: { enabled: false }, 
                    wordWrap: 'on',
                  }}
                />
              </div>
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="h-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />

            {/* Output Panel */}
            <Panel defaultSize={30} minSize={10}>
              <OutputPanel
                activeFile={{ ...activeFile, code: files[activeFileId].code }} 
                language={room.language}
                updateFileOutput={updateFileOutput}
              />
            </Panel>
          </PanelGroup>
          {/* --- END OF CHANGES --- */}

        </div>

        {/* Participant Panel (no change) */}
        <ParticipantPanel
          room={room}
          presence={presence}
          chat={chat}
          followingUserId={followingUserId}
          onFollowUser={handleFollowUser}
          onSendMessage={sendChatMessage}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isSpeaking={isSpeaking} 
        />
      </div>
    </div>
  );
};

export default FreeCodeRoom;