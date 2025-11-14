// src/components/room/AudioPlayer.js
import React, { useRef, useEffect } from 'react';

const AudioPlayer = ({ stream, peerId }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio && stream) {
      audio.srcObject = stream;
      audio.volume = 1.0;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Audio playing for peer: ${peerId}`);
          })
          .catch(err => {
            console.warn(`Audio play failed for peer ${peerId}:`, err);
          });
      }
    }

    return () => {
      if (audio) {
        audio.srcObject = null;
      }
    };
  }, [stream, peerId]);

  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline
      // This style is correct, it hides the player without disabling it
      style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}
    />
  );
};

export default AudioPlayer;