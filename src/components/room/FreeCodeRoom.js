import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import FileTabsBar from './FileTabsBar';
import ParticipantPanel from './ParticipantPanel';
import OutputPanel from './OutputPanel';

import { useVoiceChat } from '../../hooks/useVoiceChat';

// Improved AudioPlayer component
const AudioPlayer = ({ stream, peerId }) => {
  const audioRef = useRef(null);
  
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.volume = 1.0;

      // Attempt to play, with error handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Audio playing for peer: ${peerId}`);
          })
          .catch(err => {
            console.warn(`Audio play failed for peer ${peerId}:`, err);
            // If autoplay is blocked, we might need user interaction
            // You could show a "Click to enable audio" button here
          });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [stream, peerId]);
  
  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline
      style={{ display: 'none' }}
    />
  );
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
  const { remoteStreams, isMuted, toggleMute, isSpeaking } = useVoiceChat(
    room.roomId, 
    participantIds
  );

  const debouncedUpdateCode = useDebounce((fileId, code) => {
    updateFileCode(fileId, code);
  }, 100);

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
      console.warn(`Active file ${activeFileId} was deleted. Switching to a new file.`);
      const remainingFileIds = Object.keys(files);
      
      if (remainingFileIds.length > 0) {
        const newActiveFileId = remainingFileIds[0];
        
        setFollowingUserId(null); 
        isTyping.current = false;
        setActiveFileId(newActiveFileId);
        setLocalCode(files[newActiveFileId].code);
        
        if (currentUser?.uid) {
          updatePresence(currentUser.uid, newActiveFileId);
        }
      } else {
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

  if (!files || !activeFileId || !files[activeFileId] || localCode === null) {
    return <div className="min-h-screen bg-gray-900 text-white p-10">Loading files...</div>;
  }

  const activeFile = {
    id: activeFileId,
    ...files[activeFileId]
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">

      {/* Render audio players for each remote stream */}
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <AudioPlayer key={peerId} stream={stream} peerId={peerId} />
      ))}

      {/* Header */}
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

          <PanelGroup direction="vertical">
            {/* Editor Panel */}
            <Panel defaultSize={70} minSize={20}>
              <div className="bg-gray-800 h-full">
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

        </div>

        {/* Participant Panel */}
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