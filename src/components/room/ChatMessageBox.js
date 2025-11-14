import React from 'react';

const ChatMessageBox = ({ msg, isSender }) => {
  return (
    <div className={`flex items-start gap-2.5 ${isSender ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <img 
        className="w-8 h-8 rounded-full" 
        src={msg.sender.avatar || 'https://i.imgur.com/6bE0a8Z.png'} 
        alt={msg.sender.username} 
      />
      
      {/* Message Bubble */}
      <div className={`flex flex-col p-3 rounded-xl ${
        isSender 
          ? 'bg-indigo-600 rounded-tr-none' 
          : 'bg-gray-700 rounded-tl-none'
      }`}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold text-white">
            {isSender ? 'You' : msg.sender.username}
          </span>
          <span className="text-xs font-normal text-gray-400">
            {/* Format the timestamp (e.g., 6:52 PM) */}
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm font-normal text-white">
          {msg.text}
        </p>
      </div>
    </div>
  );
};

export default ChatMessageBox;