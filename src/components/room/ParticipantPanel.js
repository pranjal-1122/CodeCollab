import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FollowIcon from '../common/FollowIcon';
import ChatMessageBox from './ChatMessageBox';
import AiMentorPanel from './AiMentorPanel';

// (Icons are all unchanged)
const UserGroupIcon = () => (
  <img src="/icons/participants.png" alt="Participants" className="w-5 h-5" />
);
const ChatBubbleIcon = () => (
  <img src="/icons/chat.png" alt="Chat" className="w-5 h-5" />
);
const AiIcon = () => (
  <img src="/icons/ai-mentor.png" alt="AI Mentor" className="w-5 h-5" />
);

const MicOnIcon = () => <span title="Mic is on">🎤</span>;
const MicOffIcon = () => <span title="Mic is muted">🔇</span>;

const TabButton = ({ title, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-2 text-xs font-medium ${isActive
        ? 'text-white border-b-2 border-indigo-500'
        : 'text-gray-400 hover:text-white'
      }`}
  >
    {icon}
    <span className="mt-1">{title}</span>
  </button>
);


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
  isToggling,
  onSendAiMessage,
  chatHistory,
  isAiLoading,
  aiError,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('participants');

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, activeTab]);

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

  const renderParticipants = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2">
        {room.participantProfiles.map(p => {
          const isCurrentUser = p.uid === currentUser.uid;
          const isBeingFollowed = followingUserId === p.uid;
          const isOnline = presence && presence[p.uid] !== undefined && presence[p.uid] !== null;
          const speaking = isSpeaking[p.uid];

          return (
            <div
              key={p.uid}
              className={`flex items-center justify-between ${!isOnline ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.avatar ? p.avatar : 'https://i.imgur.com/6bE0a8Z.png'}
                  alt={p.username}
                  className={`w-8 h-8 rounded-full transition-all ${speaking ? 'ring-4 ring-green-500' : ''}`}
                />
                <span>{p.username} {p.uid === room.hostId && '(Host)'}</span>
              </div>
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
      <button
        onClick={onToggleMute}
        disabled={isToggling}
        className={`w-full flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold ${isMuted
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-gray-700 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isMuted ? <MicOffIcon /> : <MicOnIcon />}
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );

  const renderChat = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
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
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0">
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

  const renderAiMentor = () => (
    <AiMentorPanel
      onSendAiMessage={onSendAiMessage}
      chatHistory={chatHistory}
      isLoading={isAiLoading}
      error={aiError}
    />
  );

  return (
    <div className="w-full h-full bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
      <div className="flex-shrink-0 flex border-b border-gray-700 mb-4">
        <TabButton
          title="Participants"
          icon={<UserGroupIcon />}
          isActive={activeTab === 'participants'}
          onClick={() => setActiveTab('participants')}
        />
        <TabButton
          title="Chat"
          icon={<ChatBubbleIcon />}
          isActive={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        />
        <TabButton
          title="AI Mentor"
          icon={<AiIcon />}
          isActive={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        />
      </div>

      {/* --- THIS IS THE FIX --- */}
      {/* This div wrapper ensures its children can use flex-1 correctly */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'participants' && renderParticipants()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'ai' && renderAiMentor()} {/* <-- I also fixed the 'activeDab' typo here */}
      </div>
    </div>
  );
};

export default ParticipantPanel;