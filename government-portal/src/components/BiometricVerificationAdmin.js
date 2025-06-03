import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';
import { FaCamera, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const BiometricVerificationAdmin = ({ onVerificationComplete, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [userInfo, setUserInfo] = useState(null);
  const [processingFrame, setProcessingFrame] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize OpenCV
  useEffect(() => {
    // Check if OpenCV is already loaded
    if (window.cv) {
      setLoading(false);
      return;
    }

    // Add event listener for when OpenCV is loaded
    window.addEventListener('opencv-loaded', () => {
      console.log('OpenCV.js loaded successfully');
      setLoading(false);
    });

    // If OpenCV script doesn't exist, add it
    if (!document.getElementById('opencv-script')) {
      const script = document.createElement('script');
      script.id = 'opencv-script';
      script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
      script.async = true;
      script.onload = () => {
        // Dispatch event when loaded
        window.dispatchEvent(new Event('opencv-loaded'));
      };
      script.onerror = () => {
        setError('Failed to load OpenCV.js. Please refresh the page and try again.');
        setLoading(false);
      };
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('opencv-loaded', () => {
        console.log('OpenCV.js event listener removed');
      });
    };
  }, []);

  // Start camera when component mounts
  useEffect(() => {
    if (!loading && !error) {
      startCamera();
    }
    
    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [loading, error]);

  const startCamera = async () => {
    try {
      if (streamRef.current) return; // Camera already started
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        startVideoProcessing();
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError(`Camera access error: ${err.message}. Please ensure your camera is connected and you've granted permission.`);
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setCameraActive(false);
  };

  const startVideoProcessing = () => {
    if (!window.cv || !videoRef.current || !canvasRef.current) return;
    
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Only process if video is playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA || processingFrame) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Process frame for face detection
      detectFace(canvas, ctx);
      
      // Continue processing frames
      animationRef.current = requestAnimationFrame(processFrame);
    };
    
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const detectFace = async (canvas, ctx) => {
    if (!window.cv || processingFrame) return;
    
    setProcessingFrame(true);
    
    try {
      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create OpenCV matrices
      const src = new window.cv.Mat(canvas.height, canvas.width, window.cv.CV_8UC4);
      
      // Copy image data to src matrix
      const data = imageData.data;
      const numBytes = data.length * data.BYTES_PER_ELEMENT;
      const dataPtr = src.data;
      
      // Copy data from canvas to OpenCV matrix
      for (let i = 0; i < numBytes; i++) {
        dataPtr[i] = data[i];
      }
      
      // Define center region for face detection (middle 60% of frame)
      const centerX = Math.floor(canvas.width * 0.2);
      const centerY = Math.floor(canvas.height * 0.2);
      const centerWidth = Math.floor(canvas.width * 0.6);
      const centerHeight = Math.floor(canvas.height * 0.6);
      const centerRect = new window.cv.Rect(centerX, centerY, centerWidth, centerHeight);
      
      // Extract center region
      const centerRegion = src.roi(centerRect);
      
      // Convert to grayscale for analysis
      const gray = new window.cv.Mat();
      window.cv.cvtColor(centerRegion, gray, window.cv.COLOR_RGBA2GRAY);
      
      // Calculate brightness (mean of center region)
      const mean = new window.cv.Mat();
      const stddev = new window.cv.Mat();
      window.cv.meanStdDev(gray, mean, stddev);
      const brightness = mean.data64F[0];
      const contrast = stddev.data64F[0];
      
      // Apply Canny edge detection
      const edges = new window.cv.Mat();
      window.cv.Canny(gray, edges, 50, 150);
      
      // Count edge pixels
      const edgePixels = window.cv.countNonZero(edges);
      const edgeRatio = edgePixels / (centerWidth * centerHeight);
      
      // Determine if face is detected based on multiple metrics
      // Lower thresholds to make detection more lenient
      const hasSufficientBrightness = brightness > 30; // Lower minimum brightness threshold
      const hasSufficientContrast = contrast > 15; // Lower minimum contrast threshold
      const hasSufficientEdges = edgeRatio > 0.03; // Lower minimum edge ratio threshold
      
      // Make detection more flexible - only require 2 out of 3 conditions to be met
      const conditionsMet = [hasSufficientBrightness, hasSufficientContrast, hasSufficientEdges].filter(Boolean).length;
      
      // Real detection mode - face is detected if at least 2 conditions are met
      const faceDetected = conditionsMet >= 2;
      
      // Log detection metrics for debugging
      console.log('Face Detection Metrics:', {
        brightness,
        contrast,
        edgeRatio,
        hasSufficientBrightness,
        hasSufficientContrast,
        hasSufficientEdges,
        conditionsMet,
        faceDetected
      });
      
      setFaceDetected(faceDetected);
      
      // Draw rectangle and circle for visual feedback
      const rectColor = faceDetected ? [0, 255, 0, 255] : [255, 0, 0, 255]; // Green if face detected, red otherwise
      const rectThickness = 2;
      
      // Draw rectangle around center region
      window.cv.rectangle(src, new window.cv.Point(centerX, centerY), 
                         new window.cv.Point(centerX + centerWidth, centerY + centerHeight), 
                         new window.cv.Scalar(...rectColor), rectThickness);
      
      // Draw targeting circle in the middle
      const centerCircleX = Math.floor(canvas.width / 2);
      const centerCircleY = Math.floor(canvas.height / 2);
      window.cv.circle(src, new window.cv.Point(centerCircleX, centerCircleY), 
                      Math.floor(canvas.width / 10), // Circle radius
                      new window.cv.Scalar(255, 255, 255, 128), // White, semi-transparent
                      2); // Thickness
      
      // Put the processed frame back to canvas
      window.cv.imshow(canvas, src);
      
      // Clean up OpenCV resources
      src.delete();
      centerRegion.delete();
      gray.delete();
      mean.delete();
      stddev.delete();
      edges.delete();
    } catch (err) {
      console.error('Error in face detection:', err);
    } finally {
      setProcessingFrame(false);
    }
  };

  const verifyUserBiometric = async () => {
    if (!faceDetected) {
      setError('No face detected. Please position your face in the center of the frame.');
      return;
    }

    setVerificationStatus(null);
    setUserInfo(null);
    setError(null);
    setLoading(true);

    try {
      // Capture the current frame from the canvas
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Create biometric data object
      const biometricData = {
        imageData: imageData,
        timestamp: Date.now()
      };

      // Call API to verify the biometric data
      const result = await ApiService.verifyUserBiometric(biometricData);

      if (result.success) {
        setVerificationStatus('success');
        setUserInfo(result.userInfo);
        if (onVerificationComplete) {
          onVerificationComplete(result.userInfo);
        }
      } else {
        setVerificationStatus('failed');
        setError(result.message || 'Verification failed');
        if (onError) {
          onError(result.message || 'Verification failed');
        }
      }
    } catch (err) {
      console.error('Error verifying biometric:', err);
      setVerificationStatus('failed');
      setError(err.message || 'An error occurred during verification');
      if (onError) {
        onError(err.message || 'An error occurred during verification');
      }
    } finally {
      setError('No face detected. Please position your face in the center of the frame.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Create biometric data object - no userId needed for direct face identification
      const biometricData = {
        imageData: imageData,
        timestamp: Date.now()
      };
      
      // Call API to verify user's biometric data
      const result = await ApiService.verifyUserBiometric(biometricData);
      
      if (result.success) {
        setVerificationStatus('success');
        setUserInfo(result.userInfo);
        
        // Call the callback with the user info
        if (onVerificationComplete) {
          onVerificationComplete(result.userInfo);
        }
        
        // Stop the camera after successful verification
        stopCamera();
      } else {
        setVerificationStatus('failed');
        setError(result.message || 'Biometric verification failed');
        
        if (onError) {
          onError(result.message || 'Biometric verification failed');
        }
      }
    } catch (err) {
      console.error('Error verifying biometric data:', err);
      setVerificationStatus('failed');
      setError('Failed to verify biometric data: ' + (err.message || 'Unknown error'));
      
      if (onError) {
        onError('Failed to verify biometric data: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="biometric-verification-admin">
      <div className="camera-container">
        {loading && !error && (
          <div className="loading-overlay">
            <FaSpinner className="spinner" />
            <p>Initializing camera...</p>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <FaExclamationTriangle className="error-icon" />
            <p>{error}</p>
            <button onClick={() => {
              setError(null);
              startCamera();
            }}>
              Try Again
            </button>
          </div>
        )}
        
        {verificationStatus === 'success' && userInfo && (
          <div className="success-overlay">
            <FaCheck className="success-icon" />
            <h3>Verification Successful</h3>
            <div className="user-info">
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>ID:</strong> {userInfo.id}</p>
              <p><strong>Government ID:</strong> {userInfo.governmentId}</p>
              <p><strong>Status:</strong> {userInfo.verification_status}</p>
            </div>
          </div>
        )}
        
        {verificationStatus === 'failed' && (
          <div className="failed-overlay">
            <FaTimes className="failed-icon" />
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <button onClick={() => {
              setVerificationStatus(null);
              setError(null);
            }}>
              Try Again
            </button>
          </div>
        )}
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ display: cameraActive && !verificationStatus ? 'block' : 'none' }}
        />
        <canvas 
          ref={canvasRef} 
          style={{ display: cameraActive && !verificationStatus ? 'block' : 'none' }}
        />
      </div>
      
      {cameraActive && !verificationStatus && (
        <div className="controls">
          <div className="face-status">
            {faceDetected ? (
              <span className="status-detected"><FaCheck /> Face Detected</span>
            ) : (
              <span className="status-not-detected"><FaTimes /> No Face Detected</span>
            )}
          </div>
          
          <button 
            className="verify-button" 
            onClick={verifyUserBiometric}
            disabled={!faceDetected || loading}
          >
            {loading ? <FaSpinner className="spinner" /> : <FaCamera />} 
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
        </div>
      )}
      
      <style jsx="true">{`
        /* Using only 4 colors:
         * Primary: #3b82f6 (blue)
         * Success: #10b981 (green)
         * Error: #ef4444 (red)
         * Background: #1f2937 (dark gray)
         * Text: white
         */
        
        .biometric-verification-admin {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          background: #1f2937;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .camera-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 75%; /* 4:3 aspect ratio */
          background: #1f2937;
          overflow: hidden;
        }
        
        video, canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .loading-overlay, .error-overlay, .success-overlay, .failed-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: rgba(31, 41, 55, 0.9); /* #1f2937 with opacity */
          color: white;
          text-align: center;
          padding: 20px;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
          font-size: 24px;
          margin-bottom: 10px;
          color: #3b82f6;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-icon, .success-icon, .failed-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-icon { color: #ef4444; }
        .success-icon { color: #10b981; }
        .failed-icon { color: #ef4444; }
        
        .controls {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #1f2937;
        }
        
        .face-status {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          padding: 8px;
          border-radius: 8px;
          background: #1f2937;
          border: 1px solid #3b82f6;
        }
        
        .status-detected {
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-not-detected {
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .verify-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .verify-button:hover {
          background: #3b82f6;
          opacity: 0.9;
        }
        
        .verify-button:disabled {
          background: #3b82f6;
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .user-info {
          background: #1f2937;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          text-align: left;
          width: 100%;
          max-width: 320px;
          border: 1px solid #3b82f6;
        }
        
        .user-info p {
          margin: 8px 0;
          color: white;
        }
        
        button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          margin-top: 12px;
          cursor: pointer;
        }
        
        button:hover {
          background: #3b82f6;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default BiometricVerificationAdmin;
