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
    const callsRef = useRef({});
    const remoteAnalyserRefs = useRef({});

    // ==================== CLEANUP HELPERS ====================

    const cleanupRemoteAnalyser = useCallback((peerId) => {
        const refs = remoteAnalyserRefs.current[peerId];
        if (refs) {
            if (refs.animFrameId) {
                cancelAnimationFrame(refs.animFrameId);
            }
            if (refs.context && refs.context.state !== 'closed') {
                refs.context.close().catch(console.error);
            }
            if (refs.source) {
                try {
                    refs.source.disconnect();
                } catch (e) {
                    // Already disconnected
                }
            }
            setIsSpeaking(prev => {
                const speaking = { ...prev };
                delete speaking[peerId];
                return speaking;
            });
            delete remoteAnalyserRefs.current[peerId];
        }
    }, []);

    const cleanupCall = useCallback((peerId) => {
        if (callsRef.current[peerId]) {
            try {
                callsRef.current[peerId].close();
            } catch (err) {
                console.error("Error closing call:", err);
            }
            delete callsRef.current[peerId];
        }

        setRemoteStreams(prev => {
            const streams = { ...prev };
            if (streams[peerId]) {
                streams[peerId].getTracks().forEach(track => {
                    track.stop();
                });
                delete streams[peerId];
            }
            return streams;
        });

        cleanupRemoteAnalyser(peerId);
    }, [cleanupRemoteAnalyser]);

    // ==================== SETUP ANALYSERS ====================

    const setupRemoteAnalyser = useCallback((stream, peerId) => {
        try {
            const remoteAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const remoteAnalyser = remoteAudioContext.createAnalyser();
            remoteAnalyser.fftSize = 512;
            const remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
            const remoteSource = remoteAudioContext.createMediaStreamSource(stream);
            remoteSource.connect(remoteAnalyser);

            let animFrameId = null;

            const checkRemoteSpeaking = () => {
                remoteAnalyser.getByteFrequencyData(remoteDataArray);
                let sum = remoteDataArray.reduce((a, b) => a + b, 0);
                let avg = sum / remoteDataArray.length;
                setIsSpeaking(prev => ({ ...prev, [peerId]: avg > 20 }));
                animFrameId = requestAnimationFrame(checkRemoteSpeaking);
            };
            checkRemoteSpeaking();

            remoteAnalyserRefs.current[peerId] = {
                context: remoteAudioContext,
                animFrameId: animFrameId,
                source: remoteSource,
                analyser: remoteAnalyser
            };

        } catch (err) {
            console.error("Error setting up remote analyser:", err);
        }
    }, []);

    // ==================== EFFECT 1: GET LOCAL MICROPHONE ====================

    useEffect(() => {
        let mounted = true;

        const getMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                });

                if (!mounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                myStreamRef.current = stream;
                setMyStream(stream);

                // Setup local speaking detection
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                dataArrayRef.current = dataArray;

                const checkSpeaking = () => {
                    if (!mounted) return;
                    analyser.getByteFrequencyData(dataArray);
                    let sum = dataArray.reduce((a, b) => a + b, 0);
                    let avg = sum / dataArray.length;

                    setIsSpeaking(prev => {
                        const speaking = { ...prev };
                        speaking[myPeerId] = avg > 20 && !isMuted;
                        return speaking;
                    });

                    speakingLoopRef.current = requestAnimationFrame(checkSpeaking);
                };
                checkSpeaking();

                console.log('Microphone initialized successfully');
            } catch (err) {
                console.error('Failed to get microphone:', err);
                alert('Could not access microphone. Please check permissions.');
            }
        };

        getMicrophone();

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

            // Cleanup all remote analysers
            const remoteAnalyserRefsSnapshot = remoteAnalyserRefs.current;
            const analysersToCleanup = Object.keys(remoteAnalyserRefsSnapshot);
            analysersToCleanup.forEach(peerId => {
                const refs = remoteAnalyserRefsSnapshot[peerId];
                if (refs) {
                    if (refs.animFrameId) {
                        cancelAnimationFrame(refs.animFrameId);
                    }
                    if (refs.context && refs.context.state !== 'closed') {
                        refs.context.close().catch(console.error);
                    }
                    if (refs.source) {
                        try {
                            refs.source.disconnect();
                        } catch (e) {
                            // Already disconnected
                        }
                    }
                    delete remoteAnalyserRefsSnapshot[peerId];
                }
            });

            // Cleanup all active calls
            const callsRefSnapshot = callsRef.current;
            const callsToCleanup = Object.keys(callsRefSnapshot);
            callsToCleanup.forEach(peerId => {
                if (callsRefSnapshot[peerId]) {
                    try {
                        callsRefSnapshot[peerId].close();
                    } catch (err) {
                        console.error("Error closing call:", err);
                    }
                    delete callsRefSnapshot[peerId];
                }
            });
        };
    }, [roomId, myPeerId, isMuted]);

    // ==================== EFFECT 2: PEERJS CONNECTIONS ====================

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

        // Handle INCOMING calls
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
                if (peerId !== myPeerId && !callsRef.current[peerId]) {
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
        }, 1000);

        return () => {
            clearTimeout(callTimeout);

            const callsRefSnapshot = callsRef.current;
            const activeCalls = Object.keys(callsRefSnapshot);
            activeCalls.forEach(peerId => {
                cleanupCall(peerId);
            });

            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };

    }, [roomId, myPeerId, myStream, participantIds, cleanupCall, setupRemoteAnalyser]);

    // ==================== MUTE/UNMUTE ====================

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