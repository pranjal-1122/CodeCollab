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
    const callsRef = useRef({}); // Track active calls
    
    // Store remote analysers to clean them up
    const remoteAnalyserRefs = useRef({});

    // Helper to clean up a remote analyser
    const cleanupRemoteAnalyser = useCallback((peerId) => {
        const refs = remoteAnalyserRefs.current[peerId];
        if (refs) {
            cancelAnimationFrame(refs.animFrameId.id);
            if (refs.context.state !== 'closed') {
                refs.context.close().catch(console.error);
            }
            if (refs.source) {
                refs.source.disconnect();
            }
            setIsSpeaking(prev => {
                const speaking = { ...prev };
                delete speaking[peerId];
                return speaking;
            });
            delete remoteAnalyserRefs.current[peerId];
        }
    }, []);

    // Helper to cleanup a specific call
    const cleanupCall = useCallback((peerId) => {
        const callsRefCurrent = callsRef.current;
        if (callsRefCurrent[peerId]) {
            try {
                callsRefCurrent[peerId].close();
            } catch (err) {
                console.error("Error closing call:", err);
            }
            delete callsRefCurrent[peerId];
        }
        
        // Clean up remote stream
        setRemoteStreams(prev => {
            const streams = { ...prev };
            if (streams[peerId]) {
                // Stop all tracks in the remote stream
                streams[peerId].getTracks().forEach(track => {
                    track.stop();
                });
                delete streams[peerId];
            }
            return streams;
        });
        
        // Clean up analyser
        cleanupRemoteAnalyser(peerId);
    }, [cleanupRemoteAnalyser]);

    // Helper to create remote analysers
    const setupRemoteAnalyser = useCallback((stream, peerId) => {
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
    }, []);

    // EFFECT 1: Get Mic Stream (runs ONCE)
    useEffect(() => {
        let mounted = true;
        
        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }, 
            video: false 
        })
            .then(stream => {
                if (!mounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                
                setMyStream(stream);
                myStreamRef.current = stream; 

                // Local Audio Analysis
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
                    if (analyserRef.current && mounted) {
                        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                        let sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
                        let avg = sum / dataArrayRef.current.length;
                        setIsSpeaking(prev => ({ ...prev, [myPeerId]: avg > 20 }));
                    }
                    if (mounted) {
                        speakingLoopRef.current = requestAnimationFrame(checkSpeaking);
                    }
                };
                checkSpeaking();
            })
            .catch(err => {
                console.error("Failed to get mic permissions:", err);
            });

        // Cleanup for THIS effect (runs on FINAL unmount)
        return () => {
            mounted = false;
            
            if (speakingLoopRef.current) {
                cancelAnimationFrame(speakingLoopRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            if (myStreamRef.current) {
                myStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                myStreamRef.current = null;
            }
            
            // Cleanup all remote analysers on unmount
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const analysersToCleanup = Object.keys(remoteAnalyserRefs.current);
            analysersToCleanup.forEach(peerId => {
                const refs = remoteAnalyserRefs.current[peerId];
                if (refs) {
                    cancelAnimationFrame(refs.animFrameId.id);
                    if (refs.context.state !== 'closed') {
                        refs.context.close().catch(console.error);
                    }
                    if (refs.source) {
                        refs.source.disconnect();
                    }
                    delete remoteAnalyserRefs.current[peerId];
                }
            });
            
            // Cleanup all active calls
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const callsToCleanup = Object.keys(callsRef.current);
            callsToCleanup.forEach(peerId => {
                if (callsRef.current[peerId]) {
                    try {
                        callsRef.current[peerId].close();
                    } catch (err) {
                        console.error("Error closing call:", err);
                    }
                    delete callsRef.current[peerId];
                }
            });
        };
    }, [myPeerId]);

    // EFFECT 2: Manage PeerJS Connections
    useEffect(() => {
        if (!myStream) {
            return;
        }

        const newPeer = new Peer(myPeerId, {
            host: '0.peerjs.com', 
            port: 443, 
            path: '/peerjs', 
            secure: true,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        peerRef.current = newPeer;

        newPeer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
        });

        newPeer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });

        // Set up listener for INCOMING calls
        newPeer.on('call', (call) => {
            console.log('Receiving call from:', call.peer);
            call.answer(myStream);
            callsRef.current[call.peer] = call;
            
            call.on('stream', (remoteStream) => {
                console.log('Received stream from:', call.peer);
                setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
                setupRemoteAnalyser(remoteStream, call.peer);
            });

            call.on('close', () => {
                console.log('Call closed from:', call.peer);
                cleanupCall(call.peer);
            });

            call.on('error', (err) => {
                console.error('Call error:', err);
                cleanupCall(call.peer);
            });
        });

        // Call all OTHER participants
        const callTimeout = setTimeout(() => {
            participantIds.forEach(peerId => {
                if (peerId !== myPeerId) {
                    console.log('Calling peer:', peerId);
                    try {
                        const call = newPeer.call(peerId, myStream);
                        if (call) {
                            callsRef.current[peerId] = call;
                            
                            call.on('stream', (remoteStream) => {
                                console.log('Received stream from outgoing call:', peerId);
                                setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
                                setupRemoteAnalyser(remoteStream, peerId);
                            });
                            
                            call.on('close', () => {
                                console.log('Outgoing call closed:', peerId);
                                cleanupCall(peerId);
                            });

                            call.on('error', (err) => {
                                console.error('Outgoing call error:', err);
                                cleanupCall(peerId);
                            });
                        }
                    } catch (err) {
                        console.error('Error calling peer:', peerId, err);
                    }
                }
            });
        }, 1000); // Small delay to ensure peer is ready
        
        return () => {
            clearTimeout(callTimeout);
            
            // Close all active calls
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const activeCalls = Object.keys(callsRef.current);
            activeCalls.forEach(peerId => {
                cleanupCall(peerId);
            });
            
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
        
    }, [roomId, myPeerId, myStream, participantIds, cleanupCall, setupRemoteAnalyser]);

    // Mute/Unmute Function
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
    }, []);

    return { remoteStreams, isMuted, toggleMute, isSpeaking };
};