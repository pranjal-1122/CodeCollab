import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- 1. IMPORT YOUR NEW COPY ICON ---
import copyIcon from '../../assets/copy-icon.png';

// (SendIcon is unchanged)
const SendIcon = () => (
  <img src="/send.png" alt="Send" className="w-5 h-5" />
);

// --- 2. NEW: ADDED A CHECK ICON FOR FEEDBACK ---
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4 text-green-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

// --- 3. NEW: WRAPPED YOUR ICON IN A COMPONENT ---
const CopyIcon = () => (
  <img src={copyIcon} alt="Copy" className="w-4 h-4" />
);


// --- 4. THE CUSTOM COMPONENT FOR RENDERING CODE ---
const CodeComponent = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // For inline code (unchanged)
  if (inline) {
    return (
      <code className="bg-gray-700 text-indigo-300 px-1.5 py-0.5 rounded-md" {...props}>
        {children}
      </code>
    );
  }

  // For block code
  return (
    <div className="relative my-2 bg-gray-800 rounded-lg">
      {/* --- 5. THE BUTTON NOW USES YOUR ICON --- */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-500"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>

      {/* The Syntax Highlighter (unchanged) */}
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={lang}
        PreTag="div"
        className="rounded-lg"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};


// --- AiChatMessage component ---
// (This is unchanged, it just passes the components prop)
const AiChatMessage = ({ message }) => {
  const { role, parts } = message;
  const isUser = role === 'user';
  
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-600' : 'bg-indigo-600'}`}>
        {isUser ? (
          <span title="You">🧑</span>
        ) : (
          <SendIcon />
        )}
      </div>
      
      <div className={`flex flex-col p-3 rounded-xl w-full ${
        isUser 
          ? 'bg-gray-700 rounded-tr-none' 
          : 'bg-indigo-900 bg-opacity-50 rounded-tl-none'
      }`}>
        <div className="text-gray-300">
          <ReactMarkdown
            components={{
              code: CodeComponent, // This tells markdown to use our new component
            }}
          >
            {parts[0].text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};


// --- The MAIN COMPONENT (No changes from here down) ---
const AiMentorPanel = ({
  onSendAiMessage,
  chatHistory,
  isLoading,
  error
}) => {
  const [userMessage, setUserMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userMessage.trim() || isLoading) return;

    const messageToSend = chatHistory.length === 0 
      ? `Get AI Help: ${userMessage}` 
      : userMessage;
    
    onSendAiMessage(messageToSend);
    setUserMessage("");
  };

  const isFirstMessage = chatHistory.length === 0;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 flex-shrink-0">AI Mentor</h2>

      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
        {chatHistory.map((msg, index) => (
          <AiChatMessage key={index} message={msg} />
        ))}
        
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

        <div ref={messagesEndRef} />
      </div>

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