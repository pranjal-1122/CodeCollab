import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FollowIcon from '../common/FollowIcon';
import ChatMessageBox from './ChatMessageBox';

const MicOnIcon = () => <span title="Mic is on">🎤</span>;
const MicOffIcon = () => <span title="Mic is muted">🔇</span>;


const ParticipantPanel = ({
  room,
  presence,
  chat,
  followingUserId,
  onFollowUser,
  onSendMessage,
  isMuted,
  onToggleMute,
  isSpeaking,
  isToggling
}) => {
  const { currentUser, userProfile } = useAuth();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);

  // Auto-scroll (no change)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Send handler (no change)
  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const sender = {
        uid: currentUser.uid,
        username: userProfile.username,
        avatar: userProfile.avatar
      };
      onSendMessage(sender, message);
      setMessage("");
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
      {/* 1. Participants List */}
      <h2 className="text-xl font-bold mb-4">Participants</h2>
      <div className="mb-4 space-y-3">
        {room.participantProfiles.map(p => {
          const isCurrentUser = p.uid === currentUser.uid;
          const isBeingFollowed = followingUserId === p.uid;

          // This logic is now correct
          const isOnline = presence && presence[p.uid] !== undefined && presence[p.uid] !== null;
          const speaking = isSpeaking[p.uid]; // Remove the mute check here - it's handled in the hook

          return (
            <div
              key={p.uid}
              className={`flex items-center justify-between ${!isOnline ? 'opacity-50' : ''}`}
            >
              {/* Avatar and Name */}
              <div className="flex items-center gap-3">
                <img
                  src={p.avatar ? p.avatar : 'https://i.imgur.com/6bE0a8Z.png'}
                  alt={p.username}
                  className={`w-8 h-8 rounded-full transition-all ${speaking ? 'ring-4 ring-green-500' : ''
                    }`}
                />
                <span>{p.username} {p.uid === room.hostId && '(Host)'}</span>
              </div>

              {/* Follow Button (no change) */}
              {!isCurrentUser && isOnline && (
                <button
                  onClick={() => onFollowUser(p.uid)}
                  className={`p-1 rounded-full ${isBeingFollowed ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                  title={isBeingFollowed ? 'Stop following' : `Follow ${p.username}`}
                >
                  <FollowIcon isFollowing={isBeingFollowed} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Voice Chat Controls (no change) */}
      <div className="mb-4">
        <button
          onClick={onToggleMute}
          disabled={isToggling}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold ${isMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isMuted ? <MicOffIcon /> : <MicOnIcon />}
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      <hr className="border-gray-700 my-4" />

      {/* Chat (no change) */}
      <h2 className="text-xl font-bold mb-4">Chat</h2>
      <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2">
        {chat.map(msg => (
          <ChatMessageBox
            key={msg.id}
            msg={msg}
            isSender={msg.sender.uid === currentUser.uid}
          />
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ParticipantPanel;