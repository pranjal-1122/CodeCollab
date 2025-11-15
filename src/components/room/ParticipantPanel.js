import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FollowIcon from '../common/FollowIcon';
import ChatMessageBox from './ChatMessageBox';
import AiMentorPanel from './AiMentorPanel';

// --- 1. NEW, BETTER HEROICONS ---
const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.468 16.99l-1.263 1.263a.75.75 0 001.06 1.06l1.263-1.263a.75.75 0 00-1.06-1.06zM2.25 10.75a.75.75 0 000 1.5h.75a.75.75 0 000-1.5H2.25zM4 14.25a.75.75 0 00-.75.75v.75a.75.75 0 001.5 0v-.75a.75.75 0 00-.75-.75zM17.75 12.25a.75.75 0 000-1.5h-.75a.75.75 0 000 1.5h.75zM16 14.25a.75.75 0 00-.75.75v.75a.75.75 0 001.5 0v-.75a.75.75 0 00-.75-.75zM16.532 16.99l1.263 1.263a.75.75 0 001.06-1.06l-1.263-1.263a.75.75 0 00-1.06 1.06zM10 12a3 3 0 100-6 3 3 0 000 6zM8.5 14.25a.75.75 0 00-.75.75v.75a.75.75 0 001.5 0v-.75a.75.75 0 00-.75-.75zM11.5 14.25a.75.75 0 00-.75.75v.75a.75.75 0 001.5 0v-.75a.75.75 0 00-.75-.75z" />
    <path fillRule="evenodd" d="M3.25 10a6.75 6.75 0 1113.5 0 6.75 6.75 0 01-13.5 0zM10 3.25a6.75 6.75 0 110 13.5 6.75 6.75 0 010-13.5z" clipRule="evenodd" />
  </svg>
);
const ChatBubbleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10 2c-4.418 0-8 3.134-8 7 0 2.653 1.686 4.922 4.01 6.163a.75.75 0 00.99-1.163A.75.75 0 006.5 13a6.5 6.5 0 01.782-5.462A4.75 4.75 0 0110 6c1.612 0 3.033.79 3.903 2.003.87 1.214 1.28 2.633 1.144 4.025a.75.75 0 001.316.518A7.001 7.001 0 0018 9c0-3.866-3.582-7-8-7z" clipRule="evenodd" />
    <path d="M10 18.5a7.5 7.5 0 007.478-6.989a.75.75 0 00-.74-.761H3.262a.75.75 0 00-.74.761A7.5 7.5 0 0010 18.5z" />
  </svg>
);
const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10.868 2.884c.321-.772.321-1.646 0-2.418a.75.75 0 00-1.423-.19L8.354 3.75l-2.03-2.03a.75.75 0 00-1.06 1.06l2.03 2.03-3.481 1.09a.75.75 0 00-.517 1.222l2.67 4.198-2.67 4.198a.75.75 0 00.517 1.222l3.481 1.09-2.03 2.03a.75.75 0 101.06 1.06l2.03-2.03 1.093 3.482a.75.75 0 001.423-.19l.79-2.418.79 2.418a.75.75 0 001.423.19l1.093-3.482 2.03 2.03a.75.75 0 101.06-1.06l-2.03-2.03 3.481-1.09a.75.75 0 00-.517-1.222l-2.67-4.198 2.67-4.198a.75.75 0 00-.517-1.222l-3.481-1.09 2.03-2.03a.75.75 0 10-1.06-1.06l-2.03 2.03L10.868 2.884z" clipRule="evenodd" />
  </svg>
);
// --- END OF ICON FIX ---

const MicOnIcon = () => <span title="Mic is on">🎤</span>;
const MicOffIcon = () => <span title="Mic is muted">🔇</span>;

const TabButton = ({ title, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-2 text-xs font-medium ${
      isActive
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
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
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
        {/* --- 2. USE THE NEW ICONS --- */}
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

      {/* --- 3. RESIZING BUG FIX --- */}
      {/* This new div wrapper fixes the chat input bug on resize */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'participants' && renderParticipants()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'ai' && renderAiMentor()}
      </div>
    </div>
  );
};

export default ParticipantPanel;