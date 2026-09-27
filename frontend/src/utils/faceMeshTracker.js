/**
 * Enterprise MediaPipe Neural FaceMesh Tracker for TrueID
 * Provides real-time 3D facial landmark detection and tracking
 * powered by Google MediaPipe.
 */

// 68 canonical Dlib-compatible landmark indices mapped from MediaPipe 468 mesh
export const MEDIAPIPE_68_INDICES = [
  // Jawline (0-16)
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397,
  // Right eyebrow (17-21)
  70, 63, 105, 66, 107,
  // Left eyebrow (22-26)
  336, 296, 334, 293, 300,
  // Nose bridge & tip (27-35)
  168, 6, 197, 195, 5, 4, 1, 19, 94,
  // Right eye (36-41)
  33, 160, 158, 133, 153, 144,
  // Left eye (42-47)
  362, 385, 387, 263, 373, 380,
  // Outer lips (48-59)
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375,
  // Inner lips (60-67)
  321, 405, 314, 17, 84, 181, 91, 146
];

// Key facial contour paths for real-time visualization
export const FACIAL_CONTOUR_CHAINS = [
  // Jawline
  [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397],
  // Right Eyebrow
  [70, 63, 105, 66, 107],
  // Left Eyebrow
  [336, 296, 334, 293, 300],
  // Nose Ridge
  [168, 6, 197, 195, 5, 4, 1],
  // Nose Bottom
  [98, 97, 2, 326, 327],
  // Right Eye loop
  [33, 160, 158, 133, 153, 144, 33],
  // Left Eye loop
  [362, 385, 387, 263, 373, 380, 362],
  // Outer Lips loop
  [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61],
  // Inner Lips loop
  [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78]
];

/**
 * Dynamically load MediaPipe FaceMesh script if not already present
 */
export const ensureMediaPipeLoaded = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.FaceMesh) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '/mediapipe/face_mesh/face_mesh.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      // Fallback to CDN if local fails
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
      cdnScript.crossOrigin = 'anonymous';
      cdnScript.onload = () => resolve(true);
      cdnScript.onerror = () => resolve(false);
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
};

/**
 * Create and configure a MediaPipe FaceMesh instance
 */
export const createFaceMeshInstance = async (onResultsCallback) => {
  await ensureMediaPipeLoaded();

  if (typeof window === 'undefined' || !window.FaceMesh) {
    console.warn('FaceMesh library could not be loaded.');
    return null;
  }

  try {
    const faceMesh = new window.FaceMesh({
      locateFile: (file) => {
        return `/mediapipe/face_mesh/${file}`;
      }
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResultsCallback);
    return faceMesh;
  } catch (err) {
    console.error('Failed to instantiate MediaPipe FaceMesh:', err);
    return null;
  }
};

/**
 * Render real neural face mesh lines, nodes, and tracking brackets on Canvas
 */
export const renderFaceMeshOverlay = (ctx, width, height, rawLandmarks, frameCount = 0) => {
  if (!rawLandmarks || rawLandmarks.length === 0) return null;

  // Convert normalized landmarks to canvas pixel coordinates
  const pixelPoints = rawLandmarks.map((pt) => ({
    x: Math.round(pt.x * width),
    y: Math.round(pt.y * height),
    z: Math.round(pt.z * width)
  }));

  // Calculate face bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  pixelPoints.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const padX = Math.round((maxX - minX) * 0.08);
  const padY = Math.round((maxY - minY) * 0.08);
  const box = {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    w: Math.min(width - minX, maxX - minX + padX * 2),
    h: Math.min(height - minY, maxY - minY + padY * 2)
  };

  // 1. Draw facial contour chains
  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';

  FACIAL_CONTOUR_CHAINS.forEach((chain) => {
    ctx.beginPath();
    for (let i = 0; i < chain.length; i++) {
      const idx = chain[i];
      const pt = pixelPoints[idx];
      if (!pt) continue;
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
  });

  // 2. Draw 68 canonical landmark dots
  const canonical68 = MEDIAPIPE_68_INDICES.map((idx) => pixelPoints[idx]);
  canonical68.forEach((pt, i) => {
    if (!pt) return;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, i % 3 === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? '#10b981' : '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // 3. Draw dynamic cyber tracking corner brackets around the user's face
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  const cornerSize = Math.max(16, Math.round(box.w * 0.12));

  // Top-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + cornerSize);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + cornerSize, box.y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.w - cornerSize, box.y);
  ctx.lineTo(box.x + box.w, box.y);
  ctx.lineTo(box.x + box.w, box.y + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.h - cornerSize);
  ctx.lineTo(box.x, box.y + box.h);
  ctx.lineTo(box.x + cornerSize, box.y + box.h);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.w - cornerSize, box.y + box.h);
  ctx.lineTo(box.x + box.w, box.y + box.h);
  ctx.lineTo(box.x + box.w, box.y + box.h - cornerSize);
  ctx.stroke();

  // 4. Sweeping scan line across the face bounding box
  const scanProgress = (Math.sin(frameCount * 0.05) + 1) / 2;
  const scanY = box.y + scanProgress * box.h;
  const gradient = ctx.createLinearGradient(box.x, scanY, box.x + box.w, scanY);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
  gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.7)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(box.x, scanY);
  ctx.lineTo(box.x + box.w, scanY);
  ctx.stroke();

  ctx.restore();

  return {
    box,
    landmarks: canonical68,
    timestamp: Date.now()
  };
};
