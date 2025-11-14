import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Peer from 'peerjs';

export const useVoiceChat = (roomId, participantIds) => {
    const { currentUser } = useAuth();

    // State
    const [myStream, setMyStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState({});

    // Refs
    const myPeerId = currentUser.uid;
    const peerRef = useRef(null); 
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const speakingLoopRef = useRef(null);

    // 1. Main Effect to Initialize Mic and PeerJS
    useEffect(() => {
        // Get microphone permissions
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                setMyStream(stream);

                // --- Audio Analysis Logic ---
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = audioContext;
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyserRef.current = analyser;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                dataArrayRef.current = dataArray;
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const checkSpeaking = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                        let sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
                        let avg = sum / dataArrayRef.current.length;
                        setIsSpeaking(avg > 20); // Speaking threshold
                    }
                    speakingLoopRef.current = requestAnimationFrame(checkSpeaking);
                };
                checkSpeaking();
                // --- End Audio Analysis ---

                // --- Initialize PeerJS AND Call Logic ---
                const newPeer = new Peer(myPeerId, {
                    host: '0.peerjs.com', port: 443, path: '/peerjs', secure: true,
                });
                peerRef.current = newPeer;

                // a. Set up listener for INCOMING calls
                newPeer.on('call', (call) => {
                    call.answer(stream); // Answer with our stream
                    call.on('stream', (remoteStream) => {
                        setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
                    });
                    call.on('close', () => {
                        setRemoteStreams(prev => {
                            const streams = { ...prev };
                            delete streams[call.peer];
                            return streams;
                        });
                    });
                });

                // b. Call all OTHER participants
                participantIds.forEach(peerId => {
                    if (peerId !== myPeerId) {
                        console.log(`Calling peer: ${peerId}`);
                        const call = newPeer.call(peerId, stream);
                        if (call) {
                            call.on('stream', (remoteStream) => {
                                setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
                            });
                            call.on('close', () => {
                                setRemoteStreams(prev => {
                                    const streams = { ...prev };
                                    delete streams[peerId];
                                    return streams;
                                });
                            });
                        }
                    }
                });

            })
            .catch(err => {
                console.error("Failed to get mic permissions:", err);
            });

        // --- 3. Cleanup Function ---
        return () => {
            if (speakingLoopRef.current) {
                cancelAnimationFrame(speakingLoopRef.current);
                speakingLoopRef.current = null; // Clear the ref
            }
            
            // --- THIS IS THE FIX ---
            // Check the state before trying to close.
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            // ---------------------

            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null; // Clear the ref
            }
        };
    // Re-run this ENTIRE effect if the participant list changes
    }, [roomId, myPeerId, participantIds.join(',')]);

    // --- 4. Mute/Unmute Function (wrapped in useCallback) ---
    const toggleMute = useCallback(() => {
        if (myStream) {
            setIsMuted(currentMuteState => {
                const newMuteState = !currentMuteState;
                myStream.getAudioTracks().forEach(track => {
                    track.enabled = !newMuteState; // 'enabled' is the opposite of 'muted'
                });
                return newMuteState;
            });
        }
    }, [myStream]); 

    return { remoteStreams, isMuted, toggleMute, isSpeaking };
};