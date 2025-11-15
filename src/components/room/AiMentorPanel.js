import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// --- A. New Icon for Sending a Message ---
// This is the CORRECT "Paper Airplane" icon
// --- A. New Icon for Sending a Message ---
const SendIcon = () => (
  <img src="/icons/send.png" alt="Send" className="w-5 h-5" />
);

// --- B. New Component for a single Chat Message ---
// This will render both the "user" and "model" (AI) messages
const AiChatMessage = ({ message }) => {
  const { role, parts } = message;
  const isUser = role === 'user';
  
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-600' : 'bg-indigo-600'}`}>
        {isUser ? (
          <span title="You">🧑</span>
        ) : (
          <SendIcon />
        )}
      </div>
      
      {/* Message Bubble */}
      <div className={`flex flex-col p-3 rounded-xl ${
        isUser 
          ? 'bg-gray-700 rounded-tr-none' 
          : 'bg-indigo-900 bg-opacity-50 rounded-tl-none'
      }`}>
        <div className="prose prose-invert prose-sm text-gray-300">
          <ReactMarkdown>{parts[0].text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};


// --- C. The MAIN COMPONENT, now a full chat UI ---
const AiMentorPanel = ({
  onSendAiMessage, // Renamed from 'onGetReview'
  chatHistory,     // Renamed from 'suggestions'
  isLoading,
  error
}) => {
  const [userMessage, setUserMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]); // Scroll when history changes or when AI starts loading

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userMessage.trim() || isLoading) return;

    // This is the initial "Get AI Help" message
    const messageToSend = chatHistory.length === 0 
      ? `Get AI Help: ${userMessage}` 
      : userMessage;
    
    onSendAiMessage(messageToSend);
    setUserMessage("");
  };

  // Determine if this is the very first message
  const isFirstMessage = chatHistory.length === 0;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">AI Mentor</h2>

      {/* --- D. The Chat History Area --- */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
        {chatHistory.map((msg, index) => (
          <AiChatMessage key={index} message={msg} />
        ))}
        
        {/* Show a "Thinking..." bubble while loading */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600">
              <SendIcon />
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-indigo-900 bg-opacity-50 rounded-tl-none">
              <p className="text-gray-400 text-sm animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
        
        {/* Show an error message in the chat */}
        {error && (
           <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-600">
              <span title="Error">!</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-red-900 bg-opacity-50 rounded-tl-none">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* This is the invisible element we scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- E. The Chat Input Form --- */}
      <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={isFirstMessage ? "Ask a question about your code..." : "Send a follow-up..."}
        />
        <button
          type="submit"
          disabled={isLoading || !userMessage.trim()}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default AiMentorPanel;