import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * BiometricVerification component for verifying user identity using biometrics
 * This is separate from the login process and used only for verification
 */
const BiometricVerification = ({ onComplete, onVerificationComplete, userId, verifyBiometricOverride }) => {
  const { verifyBiometric, loading } = useAuth();
  const [facemeshCapturing, setFacemeshCapturing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [error, setError] = useState('');
  const [opencvLoaded, setOpencvLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingIntervalRef = useRef(null);
  
  // Listen for OpenCV.js to be loaded
  useEffect(() => {
    if (window.cv) {
      setOpencvLoaded(true);
    } else {
      const listener = () => setOpencvLoaded(true);
      document.addEventListener('opencv-ready', listener);
      return () => document.removeEventListener('opencv-ready', listener);
    }
  }, []);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // Start the camera and begin face detection
  const startCamera = async () => {
    if (!opencvLoaded) {
      setError('OpenCV is not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    setError('');
    setCameraActive(true);
    
    try {
      // Access the user's camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      
      // Set the video source to the camera stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Start processing frames for face detection
      processingIntervalRef.current = setInterval(() => {
        processVideoFrame();
      }, 100); // Process 10 frames per second
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted and try again.');
      setCameraActive(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setCameraActive(false);
    setFaceDetected(false);
  };

  // Process video frames with OpenCV for face detection
  const processVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !opencvLoaded || !window.cv) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Get canvas context and draw the current video frame
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return; // Canvas context not available yet
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Create OpenCV matrices directly without using imread or matFromImageData
    // Get image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Create an empty Mat of the right size and type
    const src = new window.cv.Mat(canvas.height, canvas.width, window.cv.CV_8UC4);
    // Fill the Mat with the image data
    src.data.set(new Uint8Array(imageData.data));
    
    // Create grayscale version
    const gray = new window.cv.Mat();
    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
    
    // Perform face detection
    try {
      // Since we can't easily load XML cascade classifiers in browser,
      // we'll use our enhanced simulated face detection instead
      
      // This is a hack - in a real application you would load the XML file properly
      // Since we can't easily load XML classifiers in the browser environment through OpenCV.js,
      // we're simulating face detection by checking for movement/differences in frames
      
      // Detect faces
      const faces = detectSimulatedFaces(gray, src);
      
      // If faces detected, update UI
      if (faces > 0) {
        setFaceDetected(true);
      } else {
        setFaceDetected(false);
      }
      
      // Draw faces on canvas for visualization
      // In a real implementation, this would draw rectangles around detected faces
      
      // Display the processed frame
      window.cv.imshow(canvas, src);
    } catch (e) {
      console.error('Error in face detection:', e);
    }
    
    // Clean up resources
    src.delete();
    gray.delete();
  };
  
  // Enhanced face detection simulation
  const detectSimulatedFaces = (gray, src) => {
    // We'll use multiple metrics to improve face detection reliability
    let faceDetected = false;
    
    if (gray.rows > 0 && gray.cols > 0) {
      // Define face region of interest (center of frame where face likely is)
      const faceROI = new window.cv.Rect(
        Math.floor(gray.cols * 0.25), 
        Math.floor(gray.rows * 0.15), 
        Math.floor(gray.cols * 0.5), 
        Math.floor(gray.rows * 0.7)
      );
      
      const centerRegion = gray.roi(faceROI);
      
      // 1. Calculate brightness in the center region
      const meanVal = window.cv.mean(centerRegion);
      const brightness = meanVal[0];
      
      // 2. Calculate contrast (standard deviation of pixel values)
      const stdDev = new window.cv.Mat();
      const mean = new window.cv.Mat();
      window.cv.meanStdDev(centerRegion, mean, stdDev);
      const contrast = stdDev.data[0];
      
      // 3. Edge detection to find facial features
      const edges = new window.cv.Mat();
      window.cv.Canny(centerRegion, edges, 50, 150);
      const edgesMean = window.cv.mean(edges);
      const edgeIntensity = edgesMean[0];
      
      // 4. Combine metrics with appropriate thresholds
      // Brightness must be sufficient (face is usually brighter than background)
      // Contrast must be high enough (faces have varying tones)
      // Edge intensity must be significant (faces have features that create edges)
      faceDetected = 
        brightness > 40 && // Brightness threshold
        contrast > 15 && // Contrast threshold
        edgeIntensity > 5; // Edge intensity threshold
      
      // Draw rectangle showing region of interest with color based on detection
      const color = faceDetected 
        ? new window.cv.Scalar(0, 255, 0, 255) // Green if face detected
        : new window.cv.Scalar(255, 0, 0, 255); // Red if no face detected
      
      window.cv.rectangle(
        src,
        new window.cv.Point(faceROI.x, faceROI.y),
        new window.cv.Point(faceROI.x + faceROI.width, faceROI.y + faceROI.height),
        color,
        2
      );
      
      // If face detected, draw additional visual cues
      if (faceDetected) {
        // Draw a circle in the center to indicate the sweet spot for face positioning
        const centerX = faceROI.x + Math.floor(faceROI.width / 2);
        const centerY = faceROI.y + Math.floor(faceROI.height / 2);
        window.cv.circle(
          src,
          new window.cv.Point(centerX, centerY),
          20,
          new window.cv.Scalar(0, 255, 255, 255),
          2
        );
      }
      
      // Clean up resources
      centerRegion.delete();
      stdDev.delete();
      mean.delete();
      edges.delete();
    }
    
    // Return 1 face if detected, 0 otherwise
    return faceDetected ? 1 : 0;
  };

  // Capture facial biometrics
  const captureFacemesh = async () => {
    setFacemeshCapturing(true);
    setError('');
    
    try {
      if (!faceDetected) {
        throw new Error('No face detected. Please position your face in the camera frame.');
      }
      
      // In a real app, this would capture actual facial landmarks
      // For demo purposes, we're capturing a frame from the canvas
      const canvas = canvasRef.current;
      
      // Get the image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Extract facial features (simulated)
      const facialFeatures = {
        // In a real implementation, these would be actual facial landmarks
        landmarks: Array.from({ length: 68 }, (_, i) => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 50
        })),
        imageData: imageData,
        timestamp: Date.now()
      };
      
      // Call the verification API - use override if provided (for testing)
      const result = verifyBiometricOverride 
        ? await verifyBiometricOverride(userId, facialFeatures)
        : await verifyBiometric(userId, facialFeatures);
      
      console.log('Verification result:', result); // Add logging
      
      if (result.success && (result.verified === undefined || result.verified)) {
        setVerificationStatus('success');
        // Call both callback props if they exist
        if (onVerificationComplete) {
          onVerificationComplete(true);
        }
        if (onComplete) {
          onComplete(result);
        }
        // Stop the camera after successful verification
        stopCamera();
      } else {
        const errorMsg = result.error || 'Biometric verification failed. Please try again.';
        console.error('Verification failed:', errorMsg); // Add logging
        setVerificationStatus('failed');
        setError(errorMsg);
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
      }
      
      return result.success;
    } catch (err) {
      console.error('Error during biometric verification:', err); // Add logging
      const errorMessage = err.message || 'Failed to capture or verify biometric data. Please try again.';
      setError(errorMessage);
      setVerificationStatus('failed');
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
      return false;
    } finally {
      setFacemeshCapturing(false);
    }
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, my: 2 }}>
      <Typography variant="h6" gutterBottom>
        Biometric Verification
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This will verify your identity using your biometric data. Please ensure you are in a well-lit environment and look directly at the camera.
      </Typography>
      {!opencvLoaded && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading facial recognition system... Please wait.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}
      {verificationStatus === 'success' && (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
          Biometric verification successful!
        </Alert>
      )}
      {cameraActive && (
        <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={8} sx={{ position: 'relative' }}>
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: 'auto',
              border: faceDetected ? '2px solid green' : '2px solid #ccc',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: faceDetected ? '0 0 10px rgba(0, 255, 0, 0.5)' : 'none'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  height: 'auto',
                  objectFit: 'cover',
                  opacity: 0 // Hide the video element as we're displaying the canvas
                }} 
              />
              <canvas 
                ref={canvasRef} 
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  height: 'auto',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }} 
              />
              {faceDetected && (
                <Box sx={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(0, 255, 0, 0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Face Detected
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {faceDetected 
                ? 'Face detected! You can now proceed with verification.' 
                : 'Position your face in the center of the frame.'}
            </Typography>
          </Grid>
        </Grid>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        {!cameraActive ? (
          <Button
            variant="contained"
            color="primary"
            onClick={startCamera}
            disabled={!opencvLoaded || loading || verificationStatus === 'success'}
          >
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="secondary"
              onClick={stopCamera}
              disabled={facemeshCapturing || loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color={faceDetected ? "primary" : "disabled"}
              onClick={captureFacemesh}
              disabled={facemeshCapturing || loading || !faceDetected || verificationStatus === 'success'}
              startIcon={facemeshCapturing ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {facemeshCapturing ? "Verifying..." : "Verify Identity"}
            </Button>
          </>
        )}
        
        {verificationStatus === 'success' && (
          <Button
            variant="contained"
            color="success"
            disabled
          >
            Verified ✓
          </Button>
        )}
        {verificationStatus === 'failed' && (
          <Button
            variant="contained"
            color="error"
            disabled
          >
            Not Matched ✗
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default BiometricVerification;
