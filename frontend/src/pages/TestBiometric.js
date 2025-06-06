import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Grid,
  Divider
} from '@mui/material';
import BiometricVerification from '../components/BiometricVerification';

const TestBiometric = () => {
  const [showTempTest, setShowTempTest] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [opencvLoaded, setOpencvLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize OpenCV when component mounts
  useEffect(() => {
    // Check if OpenCV is already loaded
    if (window.cv) {
      setOpencvLoaded(true);
    } else {
      // Listen for OpenCV ready event
      const handleOpenCvReady = () => {
        console.log('OpenCV is ready');
        setOpencvLoaded(true);
      };
      
      document.addEventListener('opencv-ready', handleOpenCvReady);
      
      // Clean up event listener
      return () => {
        document.removeEventListener('opencv-ready', handleOpenCvReady);
      };
    }
  }, []);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  const handleVerificationComplete = (success) => {
    console.log('Verification complete. Success:', success);
  };
  
  // Start camera for temp test
  const startCamera = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      // Store stream reference for cleanup
      streamRef.current = stream;
      
      // Set video source to camera stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraActive(true);
      
      // Start processing video frames
      startVideoProcessing();
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };
  
  // Stop camera and clean up resources
  const stopCamera = () => {
    // Stop animation frame loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Stop all video tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setFaceDetected(false);
  };
  
  // Start processing video frames with OpenCV
  const startVideoProcessing = () => {
    if (!opencvLoaded) {
      console.warn('OpenCV not loaded yet');
      return;
    }
    
    const processFrame = () => {
      processVideoFrame();
      animationRef.current = requestAnimationFrame(processFrame);
    };
    
    processFrame();
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
      // Use our enhanced simulated face detection
      const faceDetected = detectSimulatedFaces(gray, src) > 0;
      setFaceDetected(faceDetected);
      
      // Display the processed frame
      const processedImageData = new ImageData(
        new Uint8ClampedArray(src.data),
        canvas.width,
        canvas.height
      );
      ctx.putImageData(processedImageData, 0, 0);
    } catch (e) {
      console.error('Error in face detection:', e);
    }
    
    // Clean up OpenCV resources
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
  
  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}
        >
          <Box sx={{ width: '100%', mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowTempTest(!showTempTest)}
              sx={{ mb: 2 }}
            >
              {showTempTest ? 'Hide Temporary Face Detection Test' : 'Show Temporary Face Detection Test'}
            </Button>
            
            {showTempTest && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Temporary Face Detection Test
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This is a standalone test of the face detection algorithm. It shows the raw output of the detection process.
                </Typography>
                
                <Box sx={{ position: 'relative', width: '100%', height: 'auto', maxWidth: 640, margin: '0 auto', mb: 2 }}>
                  <video 
                    ref={videoRef} 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      opacity: cameraActive ? 0 : 1
                    }} 
                    autoPlay 
                    playsInline 
                    muted
                  />
                  <canvas 
                    ref={canvasRef} 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: 'auto',
                      position: cameraActive ? 'absolute' : 'static',
                      top: 0,
                      left: 0,
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }} 
                  />
                  
                  {faceDetected && cameraActive && (
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
                      Face Detected!
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {!cameraActive ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={startCamera}
                      disabled={!opencvLoaded}
                    >
                      Start Test Camera
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={stopCamera}
                    >
                      Stop Test Camera
                    </Button>
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  {faceDetected 
                    ? 'Face detected! The detection algorithm is working correctly.' 
                    : cameraActive ? 'No face detected. Position your face in the frame.' : 'Start the camera to test face detection.'}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
              </Box>
            )}
          </Box>
          <Typography component="h1" variant="h4" gutterBottom>
            OpenCV.js Biometric Test Page
          </Typography>
          
          <Typography variant="body1" paragraph align="center">
            This is a test page for the OpenCV.js biometric verification implementation.
            You can use this to test the face detection and verification system.
          </Typography>
          
          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            This page is for testing purposes. The verification will simulate success even though it's not connecting to a real backend verification system.
          </Alert>
          
          <BiometricVerification 
            userId="test-user-id" 
            onVerificationComplete={handleVerificationComplete}
            // For testing purposes, override the verification function
            verifyBiometricOverride={(userId, facialFeatures) => {
              // Always return success in test mode
              console.log('Test mode: Simulating successful verification');
              return Promise.resolve({ success: true, verified: true });
            }}
          />
          
          <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              How This Works
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              1. The system loads OpenCV.js from a CDN
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              2. When you start the camera, it uses OpenCV.js to process video frames
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              3. A face detection algorithm (simulated in this test) looks for a face in the frame
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              4. Once a face is detected, you can verify your identity
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              5. The system captures an image and facial landmarks (simulated) for verification
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TestBiometric;
