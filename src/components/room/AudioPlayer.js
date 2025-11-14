import React, { useRef, useEffect, useState } from 'react';

const AudioPlayer = ({ stream, peerId }) => {
  const audioRef = useRef(null);
  const [playAttempted, setPlayAttempted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio && stream) {
      console.log(`Setting up audio for peer: ${peerId}`);
      
      // Set the stream
      audio.srcObject = stream;
      audio.volume = 1.0;

      // Try to play
      const attemptPlay = async () => {
        if (!audio || playAttempted) return;
        
        setPlayAttempted(true);
        
        try {
          await audio.play();
          console.log(`✅ Audio playing for peer: ${peerId}`);
        } catch (err) {
          if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
            console.log(`⏸️ Autoplay blocked for ${peerId}, will retry on user interaction`);
            
            // Retry on any user interaction
            const retryPlay = async () => {
              try {
                await audio.play();
                console.log(`✅ Audio playing for peer: ${peerId} (after interaction)`);
                document.removeEventListener('click', retryPlay);
                document.removeEventListener('keydown', retryPlay);
              } catch (retryErr) {
                console.warn(`Still blocked:`, retryErr);
              }
            };
            
            document.addEventListener('click', retryPlay, { once: true });
            document.addEventListener('keydown', retryPlay, { once: true });
          } else {
            console.error(`❌ Audio play error for ${peerId}:`, err);
          }
        }
      };

      // Small delay to ensure stream is ready
      const timer = setTimeout(attemptPlay, 100);

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.srcObject = null;
      }
    };
  }, [stream, peerId, playAttempted]);

  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline
      controls={false}
      style={{ display: 'none' }}
    />
  );
};

export default AudioPlayer;