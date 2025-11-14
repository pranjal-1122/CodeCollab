import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';

// This component renders the audio players
const RemoteAudioPlayer = ({ stream }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      // Attach the MediaStream to the <audio> element's srcObject
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  // 'autoPlay' and 'playsInline' are essential
  return <audio ref={audioRef} autoPlay playsInline />;
};


// This component manages the hook and renders the players
const VoiceChatManager = ({ room }) => {
  const { currentUser } = useAuth();
  
  // Get all participant IDs
  const participantIds = room.participants || [];

  const { remoteStreams, isMuted, toggleMute } = useVoiceChat(room.roomId, participantIds);

  return (
    <div style={{ display: 'none' }}> {/* This component is hidden */}
      {/* Render an audio player for every remote stream */}
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteAudioPlayer key={peerId} stream={stream} />
      ))}
      
      {/* We will pass 'isMuted' and 'toggleMute' down from FreeCodeRoom */}
      {/* This component itself doesn't render the button */}
    </div>
  );
};

export default VoiceChatManager;