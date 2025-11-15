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
    const [isToggling, setIsToggling] = useState(false);

    // Refs
    const myPeerId = currentUser.uid;
    const speakingUpdateQueueRef = useRef({});
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
        
        // Also remove from speaking state
        setIsSpeaking(prev => {
            const newState = { ...prev };
            delete newState[peerId];
            return newState;
        });
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
                speakingUpdateQueueRef.current[peerId] = avg > 15;
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
                    const isTrackEnabled = myStreamRef.current?.getAudioTracks()[0]?.enabled ?? false;
                    const isCurrentlySpeaking = avg > 15 && isTrackEnabled;
                    speakingUpdateQueueRef.current[myPeerId] = isCurrentlySpeaking;
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

        return () => {
            mounted = false;
            if (speakingLoopRef.current) cancelAnimationFrame(speakingLoopRef.current);
            if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close().catch(console.error);
            if (myStreamRef.current) {
                myStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                myStreamRef.current = null;
            }
            Object.keys(remoteAnalyserRefs.current).forEach(peerId => {
                const refs = remoteAnalyserRefs.current[peerId];
                if (refs) {
                    if (refs.animFrameId) cancelAnimationFrame(refs.animFrameId);
                    if (refs.context?.state !== 'closed') refs.context?.close().catch(console.error);
                    if (refs.source) {
                        try { refs.source.disconnect(); } catch (e) {}
                    }
                    delete remoteAnalyserRefs.current[peerId];
                }
            });
            Object.keys(peersRef.current).forEach(peerId => {
                if (peersRef.current[peerId]) {
                    try { peersRef.current[peerId].destroy(); } catch (err) {}
                    delete peersRef.current[peerId];
                }
            });
        };
    }, [roomId, myPeerId]);

    // ==================== EFFECT 2: PROCESS SPEAKING QUEUE ====================
    
    useEffect(() => {
        let rafId;
        const processQueue = () => {
            if (Object.keys(speakingUpdateQueueRef.current).length > 0) {
                const updates = { ...speakingUpdateQueueRef.current };
                speakingUpdateQueueRef.current = {};

                setIsSpeaking(prev => {
                    let changed = false;
                    const newState = { ...prev };
                    for (const [peerId, speaking] of Object.entries(updates)) {
                        if (newState[peerId] !== speaking) {
                            newState[peerId] = speaking;
                            changed = true;
                        }
                    }
                    return changed ? newState : prev;
                });
            }
            rafId = requestAnimationFrame(processQueue);
        };
        rafId = requestAnimationFrame(processQueue);
        return () => cancelAnimationFrame(rafId);
    }, []);

    // ==================== EFFECT 3: SIMPLE-PEER SIGNALING ====================

    useEffect(() => {
        if (!myStream || !roomId) return;

        console.log('🚀 Setting up WebRTC signaling for:', myPeerId);

        const signalsRef = ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}`);

        const unsubscribe = onValue(signalsRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const signals = snapshot.val();

            Object.entries(signals).forEach(([signalId, data]) => {
                const { from, signal: signalData, type } = data;

                if (from === myPeerId) return;

                console.log(`📨 Received ${type} from:`, from);

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

                        const ignorableErrors = [
                            'wrong state',
                            'cannot signal after peer is destroyed',
                            'InvalidStateError',
                            'ERR_ICE_CONNECTION_FAILURE',
                            'ERR_DATA_CHANNEL'
                        ];

                        const shouldIgnore = ignorableErrors.some(errType =>
                            err.message?.includes(errType) || err.code?.includes(errType)
                        );

                        if (shouldIgnore) {
                            console.log('⚠️ Ignoring benign error, keeping connection');
                            return;
                        }

                        if (err.code === 'ERR_CONNECTION_FAILURE' && peer._pc) {
                            const state = peer._pc.iceConnectionState;
                            if (state === 'connected' || state === 'completed') {
                                console.log('⚠️ Connection still active despite error, keeping peer');
                                return;
                            }
                        }

                        console.log('❌ Critical error, cleaning up peer');
                        cleanupPeer(from);
                    });

                    peer.on('close', () => {
                        console.log('📴 Peer closed:', from);
                        setTimeout(() => cleanupPeer(from), 500);
                    });

                    if (peer._pc) {
                        peer._pc.addEventListener('iceconnectionstatechange', () => {
                            const state = peer._pc.iceConnectionState;
                            console.log(`🧊 ICE state (${from}):`, state);
                            if (state === 'failed' || state === 'closed') {
                                console.log(`❌ ICE ${state}, cleaning up peer ${from}`);
                                setTimeout(() => cleanupPeer(from), 1000);
                            }
                        });
                    }
                }

                try {
                    peersRef.current[from].signal(signalData);
                    remove(ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}/${signalId}`));
                } catch (err) {
                    console.error('❌ Error processing signal:', err);
                }
            });
        });

        return () => {
            unsubscribe();
            remove(ref(db, `rooms/${roomId}/webrtcSignals/${myPeerId}`));
        };

    }, [roomId, myPeerId, myStream, cleanupPeer, setupRemoteAnalyser]);

    // ==================== EFFECT 4: INITIATE CONNECTIONS ====================

    useEffect(() => {
        if (!myStream || !roomId) return;

        console.log('👀 Watching for participants...');

        participantIds.forEach(peerId => {
            if (peerId === myPeerId) return;
            if (peersRef.current[peerId]) return;
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

                const ignorableErrors = [
                    'wrong state',
                    'cannot signal after peer is destroyed',
                    'InvalidStateError',
                    'ERR_ICE_CONNECTION_FAILURE',
                    'ERR_DATA_CHANNEL'
                ];

                const shouldIgnore = ignorableErrors.some(errType =>
                    err.message?.includes(errType) || err.code?.includes(errType)
                );

                if (shouldIgnore) {
                    console.log('⚠️ Ignoring benign error, keeping connection');
                    return;
                }

                if (err.code === 'ERR_CONNECTION_FAILURE' && peer._pc) {
                    const state = peer._pc.iceConnectionState;
                    if (state === 'connected' || state === 'completed') {
                        console.log('⚠️ Connection still active, keeping peer');
                        return;
                    }
                }

                cleanupPeer(peerId);
            });

            peer.on('close', () => {
                console.log('📴 Peer closed:', peerId);
                cleanupPeer(peerId);
            });

            if (peer._pc) {
                peer._pc.addEventListener('iceconnectionstatechange', () => {
                    const state = peer._pc.iceConnectionState;
                    console.log(`🧊 ICE state (${peerId}):`, state);
                    if (state === 'failed' || state === 'closed') {
                        console.log(`❌ ICE ${state}, cleaning up peer ${peerId}`);
                        setTimeout(() => cleanupPeer(peerId), 1000);
                    }
                });
            }
        });

    }, [roomId, myPeerId, myStream, participantIds, cleanupPeer, setupRemoteAnalyser]);

    // ==================== EFFECT 5: KEEP CONNECTION ALIVE ====================

    useEffect(() => {
        if (!roomId || !myPeerId) return;

        const heartbeatRef = ref(db, `rooms/${roomId}/heartbeat/${myPeerId}`);

        const sendHeartbeat = () => set(heartbeatRef, Date.now());

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 5000);

        return () => {
            clearInterval(interval);
            remove(heartbeatRef);
        };

    }, [roomId, myPeerId]);

    // ==================== MUTE/UNMUTE ====================

    const toggleMute = useCallback(() => {
        if (myStreamRef.current && !isToggling) {
            setIsToggling(true);

            setIsMuted(currentMuteState => {
                const newMuteState = !currentMuteState;

                myStreamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMuteState;
                });

                if (roomId && currentUser) {
                    const muteStatusRef = ref(db, `rooms/${roomId}/muteStatus/${currentUser.uid}`);
                    set(muteStatusRef, newMuteState).catch(console.error);
                }

                console.log(newMuteState ? '🔇 Muted' : '🔊 Unmuted');

                return newMuteState;
            });

            setTimeout(() => setIsToggling(false), 300);
        }
    }, [roomId, currentUser, isToggling]);

    return { remoteStreams, isMuted, toggleMute, isSpeaking, isToggling };
};