import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AudioPlayer from './AudioPlayer';
import FileTabsBar from './FileTabsBar';
import ParticipantPanel from './ParticipantPanel';
import OutputPanel from './OutputPanel';

import { useVoiceChat } from '../../hooks/useVoiceChat';

const getMonacoLanguage = (lang) => {
  const lower = lang?.toLowerCase();
  if (lower === 'c++' || lower === 'cpp') return 'cpp';
  return lower;
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
  
  // --- 1. STATE IS NOW A CHAT HISTORY ARRAY ---
  const [aiChatHistory, setAiChatHistory] = useState([]); // Was aiSuggestions
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  const isTyping = useRef(false);
  const editorRef = useRef(null);

  const participantIds = room.participants || [];
  const { remoteStreams, isMuted, toggleMute, isSpeaking, isToggling } = useVoiceChat(
    room.roomId, 
    participantIds
  );

  const debouncedUpdateCode = useDebounce((fileId, code) => {
    updateFileCode(fileId, code);
  }, 100);

  // (All useEffects are unchanged)
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


  // --- 2. HANDLER IS RENAMED AND UPDATED FOR CHAT ---
  const handleSendAiMessage = async (message) => { // Was handleGetAiReview
    if (!activeFileId || !files[activeFileId]) {
      setAiError("Please select a file to review.");
      return;
    }

    const code = files[activeFileId].code;
    const language = room.language;
    
    // Add the user's message to the chat history immediately
    const newUserMessage = { role: "user", parts: [{ text: message }] };
    const currentHistory = [...aiChatHistory, newUserMessage];
    
    setAiChatHistory(currentHistory);
    setIsAiLoading(true);
    setAiError("");

    try {
      // Pass the code, language, new message, AND the previous history
      const response = await fetch('/api/getAiCodeReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          message,
          history: aiChatHistory // Send the history *before* the new user message
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Add the AI's response to the chat history
      const newAiMessage = { role: "model", parts: [{ text: data.suggestions }] };
      setAiChatHistory([...currentHistory, newAiMessage]);

    } catch (err) {
      console.error("AI review error:", err);
      setAiError(err.message || "Failed to connect to the AI service.");
      // Note: The UI will now display this error as a chat bubble
    } finally {
      setIsAiLoading(false);
    }
  };

  // (All other handlers are unchanged)
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
  const activeFile = { id: activeFileId, ...files[activeFileId] };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <AudioPlayer key={peerId} stream={stream} peerId={peerId} />
      ))}
      <div className="flex-shrink-0 bg-gray-800 p-4 shadow-md z-10">
        <h1 className="text-2xl font-bold">{room.roomName}</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={75} minSize={30}>
            <div className="flex-1 flex flex-col h-full">
              <FileTabsBar
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onAddNewFile={addNewFile}
                onCloseFile={handleCloseFile}
                language={room.language}
              />
              <PanelGroup direction="vertical">
                <Panel defaultSize={70} minSize={20}>
                  <div className="bg-gray-800 h-full">
                    <Editor
                      height="100%"
                      theme="vs-dark"
                      language={getMonacoLanguage(room.language)}
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
                <PanelResizeHandle className="h-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />
                <Panel defaultSize={30} minSize={10}>
                  <OutputPanel
                    activeFile={{ ...activeFile, code: files[activeFileId].code }} 
                    language={room.language}
                    updateFileOutput={updateFileOutput}
                  />
                </Panel>
              </PanelGroup>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-900 hover:bg-indigo-600 transition-colors" />
          <Panel defaultSize={25} minSize={20}>
            {/* --- 3. PASS THE NEW PROPS DOWN --- */}
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
              isToggling={isToggling}
              
              // --- Pass the new chat props ---
              onSendAiMessage={handleSendAiMessage} // Renamed prop
              chatHistory={aiChatHistory}       // Renamed prop
              isAiLoading={isAiLoading}
              aiError={aiError}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default FreeCodeRoom;