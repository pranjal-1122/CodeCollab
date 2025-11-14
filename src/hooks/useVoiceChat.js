// src/hooks/useVoiceChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Peer from 'peerjs';

export const useVoiceChat = (roomId, participantIds) => {
    const { currentUser } = useAuth();

    // State
    const [myStream, setMyStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});

    // Refs
    const myPeerId = currentUser.uid;
    const peerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const speakingLoopRef = useRef(null);
    const myStreamRef = useRef(null);
    
    // --- Store remote analysers to clean them up ---
    const remoteAnalyserRefs = useRef({});

    // --- 1. Helper to create remote analysers ---
    const setupRemoteAnalyser = (stream, peerId) => {
        try {
            const remoteAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const remoteAnalyser = remoteAudioContext.createAnalyser();
            remoteAnalyser.fftSize = 512;
            const remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
            const remoteSource = remoteAudioContext.createMediaStreamSource(stream);
            remoteSource.connect(remoteAnalyser);
            
            const remoteAnimFrameRef = { id: 0 }; 

            const checkRemoteSpeaking = () => {
                remoteAnalyser.getByteFrequencyData(remoteDataArray);
                let sum = remoteDataArray.reduce((a, b) => a + b, 0);
                let avg = sum / remoteDataArray.length;
                setIsSpeaking(prev => ({ ...prev, [peerId]: avg > 20 }));
                remoteAnimFrameRef.id = requestAnimationFrame(checkRemoteSpeaking);
            };
            checkRemoteSpeaking();
            
            // Store all refs needed for cleanup
            remoteAnalyserRefs.current[peerId] = {
                context: remoteAudioContext,
                animFrameId: remoteAnimFrameRef,
                source: remoteSource,
                analyser: remoteAnalyser
            };

        } catch (err) {
            console.error("Error setting up remote analyser:", err);
        }
    };

    // --- 2. Helper to clean up a remote analyser ---
    const cleanupRemoteAnalyser = (peerId) => {
        const refs = remoteAnalyserRefs.current[peerId];
        if (refs) {
            cancelAnimationFrame(refs.animFrameId.id);
            refs.context.close().catch(console.error);
            setIsSpeaking(prev => {
                const speaking = { ...prev };
                delete speaking[peerId];
                return speaking;
            });
            delete remoteAnalyserRefs.current[peerId];
        }
    };


    // --- EFFECT 1: Get Mic Stream (runs ONCE) ---
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                setMyStream(stream);
                myStreamRef.current = stream; 

                // --- Local Audio Analysis ---
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
                        setIsSpeaking(prev => ({ ...prev, [myPeerId]: avg > 20 }));
                    }
                    speakingLoopRef.current = requestAnimationFrame(checkSpeaking);
                };
                checkSpeaking();
            })
            .catch(err => {
                console.error("Failed to get mic permissions:", err);
            });

        // --- Cleanup for THIS effect (runs on FINAL unmount) ---
        return () => {
            if (speakingLoopRef.current) {
                cancelAnimationFrame(speakingLoopRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            if (myStreamRef.current) {
                myStreamRef.current.getTracks().forEach(track => track.stop());
                myStreamRef.current = null;
            }
            // --- Cleanup all remote analysers on unmount ---
            Object.keys(remoteAnalyserRefs.current).forEach(cleanupRemoteAnalyser);
        };
    }, [myPeerId]); 

    const participantIdString = participantIds.join(',');

    // --- EFFECT 2: Manage PeerJS Connections ---
    useEffect(() => {
        if (!myStream) {
            return;
        }

        const newPeer = new Peer(myPeerId, {
            host: '0.peerjs.com', port: 443, path: '/peerjs', secure: true,
        });
        peerRef.current = newPeer;

        // a. Set up listener for INCOMING calls
        newPeer.on('call', (call) => {
            call.answer(myStream);
            call.on('stream', (remoteStream) => {
                setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
                // --- FIX: Setup analyser for incoming stream ---
                setupRemoteAnalyser(remoteStream, call.peer);
            });

            // --- FIX: Combined 'close' handler ---
            call.on('close', () => {
                 setRemoteStreams(prev => {
                    const streams = { ...prev };
                    delete streams[call.peer];
                    return streams;
                });
                // --- FIX: Cleanup analyser on close ---
                cleanupRemoteAnalyser(call.peer);
            });
        });

        // b. Call all OTHER participants
        participantIds.forEach(peerId => {
            if (peerId !== myPeerId) {
                const call = newPeer.call(peerId, myStream);
                if (call) {
                    call.on('stream', (remoteStream) => {
                        setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
                        // --- FIX: Setup analyser for outgoing call's stream ---
                        setupRemoteAnalyser(remoteStream, peerId);
                    });
                    call.on('close', () => {
                        setRemoteStreams(prev => {
                            const streams = { ...prev };
                            delete streams[peerId];
                            return streams;
                        });
                        // --- FIX: Cleanup analyser on close ---
                        cleanupRemoteAnalyser(peerId);
                    });
                }
            }
        });
        
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, myPeerId, participantIdString, myStream]);


    // --- Mute/Unmute Function ---
    const toggleMute = useCallback(() => {
        if (myStreamRef.current) {
            setIsMuted(currentMuteState => {
                const newMuteState = !currentMuteState;
                myStreamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMuteState;
                });
                return newMuteState;
            });
        }
    }, []); // Dependency on myStreamRef.current is stable

    return { remoteStreams, isMuted, toggleMute, isSpeaking };
};