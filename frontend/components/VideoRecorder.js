import { useState, useRef, useEffect, useCallback } from 'react';

export default function VideoRecorder({ onStreamReady, onPermissionDenied, isAdmin, onFrameReady }) {
    const [hasPermission, setHasPermission] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const mainVideoRef = useRef(null);
    const selfVideoRef = useRef(null);
    const streamRef = useRef(null);
    const hiddenCanvasRef = useRef(null);
    const frameIntervalRef = useRef(null);

    const requestPermission = useCallback(async () => {
        setIsRequesting(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
                audio: true,
            });
            streamRef.current = stream;

            if (mainVideoRef.current) {
                mainVideoRef.current.srcObject = stream;
            }
            if (selfVideoRef.current) {
                selfVideoRef.current.srcObject = stream;
            }

            setHasPermission(true);
            if (onStreamReady) onStreamReady(stream);
        } catch (err) {
            setError('Camera and microphone access is required to start the interview.');
            setHasPermission(false);
            if (onPermissionDenied) onPermissionDenied(err);
        }
        setIsRequesting(false);
    }, [onStreamReady, onPermissionDenied]);

    // Capture frame silently from local video and pass to parent
    const captureAndSendFrame = useCallback(() => {
        if (!isCamOn || !mainVideoRef.current || !hiddenCanvasRef.current || !onFrameReady) {
            console.log('[Debug] capture blocked:', { isCamOn, hasVideo: !!mainVideoRef.current, hasCanvas: !!hiddenCanvasRef.current, hasProp: !!onFrameReady });
            return;
        }
        
        const video = mainVideoRef.current;
        const canvas = hiddenCanvasRef.current;
        
        // Ensure video is playing and has dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('[Debug] video dimensions 0');
            return;
        }

        // Downscale to 320x240 for bandwidth efficiency
        const targetWidth = 320;
        const targetHeight = 240;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Compress as JPEG (0.6 quality)
        const base64Data = canvas.toDataURL('image/jpeg', 0.6);
        onFrameReady(base64Data);
    }, [isCamOn, onFrameReady]);

    const toggleMic = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCam = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsCamOn(!isCamOn);
        }
    };

    const endCall = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        setHasPermission(false);
    };

    // Auto-start capture loop if an onFrameReady handler is provided and camera is on
    useEffect(() => {
        if (onFrameReady && isCamOn && hasPermission) {
            console.log('[Debug] Starting frame capture loop');
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = setInterval(() => {
                captureAndSendFrame();
            }, 500);
        } else {
            console.log('[Debug] Stopping frame capture loop', { onFrameReady: !!onFrameReady, isCamOn, hasPermission });
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
        }
        
        return () => {
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
        };
    }, [onFrameReady, isCamOn, hasPermission, captureAndSendFrame]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div className="video-recorder">
            {!hasPermission ? (
                <div className="permission-gate">
                    <div className="permission-card">
                        <div className="permission-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00A3E0" strokeWidth="1.5">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                        </div>
                        <h2 className="permission-title">Camera & Microphone Access Required</h2>
                        <p className="permission-desc">
                            To start the interview, we need access to your camera and microphone.
                            Please allow access when prompted by your browser.
                        </p>
                        {error && <p className="permission-error">{error}</p>}
                        <button
                            className="permission-btn"
                            onClick={requestPermission}
                            disabled={isRequesting}
                        >
                            {isRequesting ? 'Requesting Access...' : 'Enable Camera & Microphone'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="video-container">
                    <div className="main-video-wrapper">
                        {/* Status badges */}
                        <div className="video-badges">
                            <div className="badge ai-active">
                                <span className="status-dot green"></span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                <span>AI Analysis Active</span>
                            </div>
                            <div className="badge rec-badge">
                                <span className="status-dot red"></span>
                                <span>REC</span>
                            </div>
                        </div>

                        {/* Main video */}
                        <video
                            ref={mainVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="main-video"
                        />

                        {/* Candidate info overlay */}
                        <div className="candidate-overlay">
                            <div className="candidate-avatar">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7EC8E3" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        </div>

                        {/* Self view */}
                        <div className="self-view">
                            <video
                                ref={selfVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="self-video"
                            />
                            <span className="self-label">You</span>
                        </div>

                        {/* Timer */}
                        <div className="interview-timer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Interview Time: --:--</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="video-controls">
                        <button
                            className={`control-btn ${!isMicOn ? 'off' : ''}`}
                            onClick={toggleMic}
                            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            {isMicOn ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .48-.05.96-.13 1.42" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            )}
                        </button>
                        <button
                            className={`control-btn ${!isCamOn ? 'off' : ''}`}
                            onClick={toggleCam}
                            title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {isCamOn ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            )}
                        </button>
                        <button className="control-btn end-call" onClick={endCall} title="End interview">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                                <line x1="23" y1="1" x2="1" y2="23" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden canvas for silent frame capture */}
            <canvas 
                ref={hiddenCanvasRef} 
                className="hidden-ai-canvas"
            />

            <style jsx>{`
        .video-recorder {
          width: 100%;
          height: 100%;
        }

        .permission-gate {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%);
          border-radius: 16px;
          padding: 40px;
        }

        .permission-card {
          text-align: center;
          max-width: 480px;
        }

        .permission-icon {
          margin-bottom: 24px;
        }

        .permission-title {
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
          font-family: 'Inter', sans-serif;
        }

        .permission-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-family: 'Inter', sans-serif;
        }

        .permission-error {
          color: #EF4444;
          font-size: 14px;
          margin: 0 0 16px 0;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
        }

        .permission-btn {
          padding: 14px 32px;
          background: #00A3E0;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .permission-btn:hover {
          background: #0090c7;
          transform: translateY(-1px);
        }

        .permission-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .video-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .main-video-wrapper {
          position: relative;
          background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%);
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16 / 9;
          min-height: 400px;
        }

        .main-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-badges {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          z-index: 10;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        .ai-active {
          background: rgba(10, 37, 64, 0.85);
          color: #FFFFFF;
          backdrop-filter: blur(8px);
        }

        .rec-badge {
          background: rgba(239, 68, 68, 0.9);
          color: #FFFFFF;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.green {
          background: #10B981;
          box-shadow: 0 0 6px #10B981;
          animation: pulse 2s infinite;
        }

        .status-dot.red {
          background: #FFFFFF;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .candidate-overlay {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .candidate-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(0, 163, 224, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .self-view {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 180px;
          height: 135px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #00A3E0;
          background: #0A2540;
          z-index: 10;
        }

        .self-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .self-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          background: rgba(10, 37, 64, 0.7);
          padding: 2px 10px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
        }

        .interview-timer {
          position: absolute;
          bottom: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(10, 37, 64, 0.85);
          color: #FFFFFF;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          backdrop-filter: blur(8px);
          z-index: 10;
          font-family: 'Inter', sans-serif;
        }

        .video-controls {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 12px;
        }

        .control-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: #0A2540;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #1a3a5c;
          transform: scale(1.05);
        }

        .control-btn.off {
          background: #6B7280;
        }

        .control-btn.end-call {
          background: #EF4444;
        }

        .control-btn.end-call:hover {
          background: #DC2626;
        }

        .hidden-ai-canvas {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          visibility: hidden !important;
        }
      `}</style>
        </div>
    );
}
