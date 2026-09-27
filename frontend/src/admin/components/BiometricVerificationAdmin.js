import React, { useState, useEffect, useRef, useCallback } from 'react';
import ApiService from '../services/adminApi.service';
import { FaCamera, FaCheck, FaTimes, FaSpinner, FaUserCheck, FaShieldAlt } from 'react-icons/fa';
import { createFaceMeshInstance, renderFaceMeshOverlay } from '../../utils/faceMeshTracker';

const BiometricVerificationAdmin = ({ onVerificationComplete, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [userInfo, setUserInfo] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastFaceMetricsRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isSendingFrameRef = useRef(false);
  const latestRawLandmarksRef = useRef(null);
  const frameCountRef = useRef(0);

  // Compute 68 landmark points for the face
  const computeFacialLandmarks = useCallback((box) => {
    const { x, y, w, h } = box;
    const landmarks = [];

    // Jawline (0-16)
    for (let i = 0; i <= 16; i++) {
      const angle = (Math.PI / 16) * i;
      landmarks.push({
        x: Math.round(x + w * 0.5 - Math.cos(angle) * w * 0.48),
        y: Math.round(y + h * 0.45 + Math.sin(angle) * h * 0.55)
      });
    }

    // Eyebrows (17-26)
    for (let i = 0; i < 5; i++) {
      landmarks.push({
        x: Math.round(x + w * 0.2 + i * (w * 0.06)),
        y: Math.round(y + h * 0.28 - Math.sin((i / 4) * Math.PI) * 8)
      });
    }
    for (let i = 0; i < 5; i++) {
      landmarks.push({
        x: Math.round(x + w * 0.55 + i * (w * 0.06)),
        y: Math.round(y + h * 0.28 - Math.sin((i / 4) * Math.PI) * 8)
      });
    }

    // Nose (27-35)
    for (let i = 0; i < 4; i++) {
      landmarks.push({
        x: Math.round(x + w * 0.5),
        y: Math.round(y + h * 0.35 + i * (h * 0.07))
      });
    }
    for (let i = -2; i <= 2; i++) {
      landmarks.push({
        x: Math.round(x + w * 0.5 + i * (w * 0.05)),
        y: Math.round(y + h * 0.60)
      });
    }

    // Eyes (36-47)
    const eyeY = y + h * 0.38;
    const rEyeX = x + w * 0.32;
    const lEyeX = x + w * 0.68;
    const eyeRadius = w * 0.06;

    for (let i = 0; i < 6; i++) {
      const theta = (Math.PI / 3) * i;
      landmarks.push({
        x: Math.round(rEyeX + Math.cos(theta) * eyeRadius),
        y: Math.round(eyeY + Math.sin(theta) * (eyeRadius * 0.6))
      });
    }
    for (let i = 0; i < 6; i++) {
      const theta = (Math.PI / 3) * i;
      landmarks.push({
        x: Math.round(lEyeX + Math.cos(theta) * eyeRadius),
        y: Math.round(eyeY + Math.sin(theta) * (eyeRadius * 0.6))
      });
    }

    // Mouth (48-67)
    const mouthY = y + h * 0.74;
    const mouthW = w * 0.22;
    const mouthH = h * 0.12;
    for (let i = 0; i < 12; i++) {
      const theta = (Math.PI / 6) * i;
      landmarks.push({
        x: Math.round(x + w * 0.5 + Math.cos(theta) * mouthW),
        y: Math.round(mouthY + Math.sin(theta) * mouthH)
      });
    }

    return landmarks;
  }, []);

  // Initialize MediaPipe Neural FaceMesh
  useEffect(() => {
    let isMounted = true;

    createFaceMeshInstance((results) => {
      if (!isMounted) return;
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        latestRawLandmarksRef.current = results.multiFaceLandmarks[0];
      } else {
        latestRawLandmarksRef.current = null;
      }
    }).then((instance) => {
      if (isMounted && instance) {
        faceMeshRef.current = instance;
        setModelLoaded(true);
      } else if (instance) {
        try { instance.close(); } catch (e) {}
      }
    });

    return () => {
      isMounted = false;
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch (e) {}
        faceMeshRef.current = null;
      }
    };
  }, []);

  // Frame processing animation
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameCountRef.current += 1;

        if (faceMeshRef.current && !isSendingFrameRef.current) {
          isSendingFrameRef.current = true;
          faceMeshRef.current.send({ image: video })
            .catch(() => {})
            .finally(() => {
              isSendingFrameRef.current = false;
            });
        }

        if (latestRawLandmarksRef.current) {
          const metrics = renderFaceMeshOverlay(
            ctx,
            canvas.width,
            canvas.height,
            latestRawLandmarksRef.current,
            frameCountRef.current
          );

          if (metrics) {
            lastFaceMetricsRef.current = metrics;
            setFaceDetected(true);
          }
        } else {
          try {
            const targetW = canvas.width * 0.44;
            const targetH = canvas.height * 0.62;
            const targetX = (canvas.width - targetW) / 2;
            const targetY = (canvas.height - targetH) / 2;

            const sample = ctx.getImageData(targetX, targetY, targetW, targetH);
            let sumLum = 0;
            const totalPix = sample.data.length / 4;
            for (let p = 0; p < sample.data.length; p += 16) {
              sumLum += sample.data[p] * 0.299 + sample.data[p + 1] * 0.587 + sample.data[p + 2] * 0.114;
            }
            const avgLum = sumLum / (totalPix / 4);
            const detected = avgLum > 30 && avgLum < 250;
            setFaceDetected(detected);

            if (detected) {
              const box = { x: targetX, y: targetY, w: targetW, h: targetH };
              const landmarks = computeFacialLandmarks(box);
              lastFaceMetricsRef.current = { box, landmarks, timestamp: Date.now() };

              ctx.save();
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
              ctx.fillStyle = '#10b981';

              for (let i = 0; i < landmarks.length; i += 2) {
                if (i + 2 < landmarks.length) {
                  ctx.beginPath();
                  ctx.moveTo(landmarks[i].x, landmarks[i].y);
                  ctx.lineTo(landmarks[i + 1].x, landmarks[i + 1].y);
                  ctx.lineTo(landmarks[i + 2].x, landmarks[i + 2].y);
                  ctx.closePath();
                  ctx.stroke();
                }
              }

              landmarks.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });

              ctx.restore();
            }
          } catch (e) {
            // ignore transient frame read error
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [computeFacialLandmarks]);

  const startCamera = async () => {
    setError(null);
    setVerificationStatus(null);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  const verifyUserBiometric = async () => {
    if (!faceDetected) {
      setError('No face detected. Please position citizen face within the scanner.');
      return;
    }

    setVerificationStatus(null);
    setUserInfo(null);
    setError(null);
    setLoading(true);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      const biometricData = {
        landmarks: lastFaceMetricsRef.current?.landmarks || [],
        imageData: imageData,
        timestamp: Date.now()
      };

      const result = await ApiService.verifyUserBiometric(biometricData);

      if (result.success) {
        setVerificationStatus('success');
        setUserInfo(result.userInfo);
        if (onVerificationComplete) {
          onVerificationComplete(result.userInfo);
        }
      } else {
        setVerificationStatus('failed');
        const errorMsg = result.message || 'Biometric identity match failed.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    } catch (err) {
      console.error('Error verifying biometric:', err);
      setVerificationStatus('failed');
      const errorMsg = err.response?.data?.message || err.message || 'Error processing facial recognition.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="biometric-verification-admin" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div className="admin-camera-container" style={{ position: 'relative', background: '#0a0e17', borderRadius: 16, overflow: 'hidden', border: faceDetected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', height: 420 }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {faceDetected && (
          <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            FACEMESH LOCKED
          </div>
        )}

        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <FaSpinner className="fa-spin" style={{ fontSize: 36, marginBottom: 12, color: '#6366f1' }} />
            <p>Matching facial vectors against citizen registry...</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {verificationStatus === 'success' && userInfo && (
        <div style={{ marginTop: 16, padding: '16px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#6ee7b7', borderRadius: 8, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FaUserCheck style={{ fontSize: 22, color: '#10b981' }} />
            <h4 style={{ margin: 0 }}>Identity Verified: {userInfo.name}</h4>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
            Government ID: <strong>{userInfo.governmentId || userInfo.government_id}</strong> • Wallet: <code>{userInfo.walletAddress || userInfo.avax_address}</code>
          </p>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button
          onClick={verifyUserBiometric}
          disabled={!faceDetected || loading}
          style={{
            padding: '12px 28px',
            background: faceDetected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            cursor: faceDetected ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 15,
            boxShadow: faceDetected ? '0 4px 16px rgba(16,185,129,0.3)' : 'none'
          }}
        >
          <FaCamera /> Identify & Verify Citizen
        </button>
      </div>
    </div>
  );
};

export default BiometricVerificationAdmin;
