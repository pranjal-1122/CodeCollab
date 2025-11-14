// src/hooks/useVoiceChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SimplePeer from 'simple-peer';
import { db } from '../services/firebase';
import { ref, set, onValue, remove, push } from 'firebase/database';

export const useVoiceChat = (roomId, participantIds) => {
    const { currentUser } = useAuth();

    // State
    const [myStream, setMyStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});

    // Refs
    const myPeerId = currentUser.uid;
    const peersRef = useRef({});
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const speakingLoopRef = useRef(null);
    const myStreamRef = useRef(null);
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

    const cleanupPeer = useCallback((peerId) => {
        if (peersRef.current[peerId]) {
            try {
                peersRef.current[peerId].destroy();
            } catch (err) {
                console.error("Error destroying peer:", err);
            }
            delete peersRef.current[peerId];
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

                    const isCurrentlySpeaking = avg > 20 && !isMuted;

                    setIsSpeaking(prev => {
                        const speaking = { ...prev };
                        speaking[myPeerId] = isCurrentlySpeaking;
                        return speaking;
                    });

                    speakingLoopRef.current = requestAnimationFrame(checkSpeaking);
                };
                checkSpeaking();

                console.log('✅ Microphone initialized');
            } catch (err) {
                console.error('❌ Microphone error:', err);
                alert('Could not access microphone. Please check permissions.');
            }
        };

        getMicrophone();

        const speakingLoop = speakingLoopRef;
        const audioContext = audioContextRef;
        const myStreamRefCurrent = myStreamRef;
        const remoteAnalysers = remoteAnalyserRefs;
        const peers = peersRef;

        return () => {
            mounted = false;

            if (speakingLoop.current) {
                cancelAnimationFrame(speakingLoop.current);
            }

            if (audioContext.current && audioContext.current.state !== 'closed') {
                audioContext.current.close().catch(console.error);
            }

            if (myStreamRefCurrent.current) {
                myStreamRefCurrent.current.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                myStreamRefCurrent.current = null;
            }

            Object.keys(remoteAnalysers.current).forEach(peerId => {
                const refs = remoteAnalysers.current[peerId];
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
                    delete remoteAnalysers.current[peerId];
                }
            });

            Object.keys(peers.current).forEach(peerId => {
                if (peers.current[peerId]) {
                    try {
                        peers.current[peerId].destroy();
                    } catch (err) {
                        console.error("Error destroying peer:", err);
                    }
                    delete peers.current[peerId];
                }
            });
        };

    }, [roomId, myPeerId, isMuted]);

    // ==================== EFFECT 2: SIMPLE-PEER SIGNALING ====================

    useEffect(() => {
        if (!myStream || !roomId) return;

        console.log('🚀 Setting up WebRTC signaling for:', myPeerId);

        // Listen for signals from other peers
        const signalsRef = ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}`);

        const unsubscribe = onValue(signalsRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const signals = snapshot.val();

            Object.entries(signals).forEach(([signalId, data]) => {
                const { from, signal: signalData, type } = data;

                if (from === myPeerId) return; // Skip own signals

                console.log(`📨 Received ${type} from:`, from);

                // Create or get peer
                if (!peersRef.current[from]) {
                    console.log('👤 Creating peer for:', from);

                    const peer = new SimplePeer({
                        initiator: false,
                        stream: myStream,
                        trickle: true,
                        config: {
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:stun1.l.google.com:19302' }
                            ]
                        }
                    });

                    peersRef.current[from] = peer;

                    peer.on('signal', (signal) => {
                        console.log('📤 Sending signal back to:', from);
                        const signalRef = push(ref(db, `rooms/${roomId}/webrtcSignals/${from}`));
                        set(signalRef, {
                            from: myPeerId,
                            signal: signal,
                            type: 'answer',
                            timestamp: Date.now()
                        });
                    });

                    peer.on('stream', (remoteStream) => {
                        console.log('🎵✅ Got stream from:', from);
                        setRemoteStreams(prev => ({ ...prev, [from]: remoteStream }));
                        setupRemoteAnalyser(remoteStream, from);
                    });

                    peer.on('error', (err) => {
                        console.error('❌ Peer error:', err.message || err);

                        // Ignore renegotiation errors - they're harmless
                        if (err.message && err.message.includes('wrong state')) {
                            console.log('⚠️ Ignoring state error (harmless)');
                            return;
                        }

                        // Don't cleanup on minor errors
                        if (err.code === 'ERR_CONNECTION_FAILURE' ||
                            err.message?.includes('InvalidStateError')) {
                            console.log('⚠️ Minor error, keeping connection');
                            return;
                        }

                        cleanupPeer(from);
                    });

                    peer.on('close', () => {
                        console.log('📴 Peer closed:', from);
                        // Small delay before cleanup to prevent race conditions
                        setTimeout(() => {
                            cleanupPeer(from);
                        }, 500);
                    });
                }

                /// Process the signal
                try {
                    peersRef.current[from].signal(signalData);

                    // Remove processed signal
                    remove(ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}/${signalId}`));
                } catch (err) {
                    console.error('❌ Error processing signal:', err);
                }
            });
        });

        return () => {
            unsubscribe();
            // Cleanup signals
            remove(ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}`));
        };

    }, [roomId, myPeerId, myStream, cleanupPeer, setupRemoteAnalyser]);

    // ==================== EFFECT 3: INITIATE CONNECTIONS ====================

    useEffect(() => {
        if (!myStream || !roomId) return;

        console.log('👀 Watching for participants...');

        participantIds.forEach(peerId => {
            if (peerId === myPeerId) return;
            if (peersRef.current[peerId]) return;

            // Only initiate if our ID is greater (prevents duplicates)
            if (myPeerId <= peerId) return;

            console.log('📞 Initiating connection to:', peerId);

            const peer = new SimplePeer({
                initiator: true,
                stream: myStream,
                trickle: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            peersRef.current[peerId] = peer;

            peer.on('signal', (signal) => {
                console.log('📤 Sending offer to:', peerId);
                const signalRef = push(ref(db, `rooms/${roomId}/webrtcSignals/${peerId}`));
                set(signalRef, {
                    from: myPeerId,
                    signal: signal,
                    type: 'offer',
                    timestamp: Date.now()
                });
            });

            peer.on('stream', (remoteStream) => {
                console.log('🎵✅ Got stream from:', peerId);
                setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
                setupRemoteAnalyser(remoteStream, peerId);
            });

            peer.on('error', (err) => {
                console.error('❌ Peer error:', err);
                cleanupPeer(peerId);
            });

            peer.on('close', () => {
                console.log('📴 Peer closed:', peerId);
                cleanupPeer(peerId);
            });
        });

    }, [roomId, myPeerId, myStream, participantIds, cleanupPeer, setupRemoteAnalyser]);


    // ==================== EFFECT 4: KEEP CONNECTION ALIVE ====================

    useEffect(() => {
        if (!roomId || !myPeerId) return;

        // Send periodic heartbeat to keep connection metadata alive
        const heartbeatRef = ref(db, `rooms/${roomId}/heartbeat/${myPeerId}`);

        const sendHeartbeat = () => {
            set(heartbeatRef, Date.now());
        };

        sendHeartbeat(); // Initial heartbeat
        const interval = setInterval(sendHeartbeat, 5000); // Every 5 seconds

        return () => {
            clearInterval(interval);
            remove(heartbeatRef);
        };

    }, [roomId, myPeerId]);



    // ==================== MUTE/UNMUTE ====================

    const toggleMute = useCallback(() => {
        if (myStreamRef.current) {
            setIsMuted(currentMuteState => {
                const newMuteState = !currentMuteState;

                // Mute/unmute all audio tracks
                myStreamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMuteState;
                });

                console.log(newMuteState ? '🔇 Muted' : '🔊 Unmuted');

                return newMuteState;
            });
        }
    }, []);

    return { remoteStreams, isMuted, toggleMute, isSpeaking };
};