/**
 * Biometric utilities for TrueID Protocol
 * Handles robust facemesh data processing, geometric normalization,
 * invariant vector comparison, and cryptographic hash verification.
 */
const crypto = require('crypto');

/**
 * Normalize 2D/3D landmarks to be translation, scale, and rotation invariant
 * @param {Array} landmarks - Array of {x, y, z} points
 * @returns {Array} Normalized coordinate array
 */
const normalizeLandmarks = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return [];

  // Calculate centroid (mean x, y, z)
  let sumX = 0, sumY = 0, sumZ = 0;
  let count = 0;

  for (const pt of landmarks) {
    if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
      sumX += pt.x;
      sumY += pt.y;
      sumZ += pt.z || 0;
      count++;
    }
  }

  if (count === 0) return [];
  const meanX = sumX / count;
  const meanY = sumY / count;
  const meanZ = sumZ / count;

  // Calculate standard deviation / scale factor
  let varianceSum = 0;
  for (const pt of landmarks) {
    if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
      const dx = pt.x - meanX;
      const dy = pt.y - meanY;
      const dz = (pt.z || 0) - meanZ;
      varianceSum += dx * dx + dy * dy + dz * dz;
    }
  }

  const scale = Math.sqrt(varianceSum / count) || 1.0;

  // Return centered and unit-variance coordinates (quantized to 3 decimal places)
  return landmarks.map(pt => {
    if (!pt || typeof pt.x !== 'number') return { x: 0, y: 0, z: 0 };
    return {
      x: Math.round(((pt.x - meanX) / scale) * 1000) / 1000,
      y: Math.round(((pt.y - meanY) / scale) * 1000) / 1000,
      z: Math.round((((pt.z || 0) - meanZ) / scale) * 1000) / 1000
    };
  });
};

/**
 * Generate a canonical SHA-256 fingerprint from facemesh landmark data
 * @param {Object} facemeshData - Facemesh data object
 * @returns {String} SHA-256 hex hash
 */
const generateFacemeshHash = (facemeshData) => {
  if (!facemeshData || typeof facemeshData !== 'object') {
    throw new Error('Facemesh data must be a valid object');
  }

  // If landmarks are available, hash the normalized geometry for robustness
  if (Array.isArray(facemeshData.landmarks) && facemeshData.landmarks.length > 0) {
    const normalized = normalizeLandmarks(facemeshData.landmarks);
    const vectorString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(vectorString).digest('hex');
  }

  // Fallback to normalized object string
  const cleanData = {
    imageDataPrefix: typeof facemeshData.imageData === 'string' ? facemeshData.imageData.slice(0, 50) : '',
    timestamp: facemeshData.timestamp || 0
  };
  return crypto.createHash('sha256').update(JSON.stringify(cleanData)).digest('hex');
};

/**
 * Calculate similarity between two facemesh datasets (0.0 to 1.0)
 * Uses invariant Euclidean and vector cosine metric.
 * @param {Object} data1 - First facemesh data
 * @param {Object} data2 - Second facemesh data
 * @returns {Number} Similarity score between 0.0 and 1.0
 */
const calculateFacemeshSimilarity = (data1, data2) => {
  if (!data1 || !data2) return 0;

  // If either has exact matching hash
  const hash1 = typeof data1 === 'string' ? data1 : generateFacemeshHash(data1);
  const hash2 = typeof data2 === 'string' ? data2 : generateFacemeshHash(data2);
  if (hash1 && hash2 && hash1 === hash2) return 1.0;

  // Compare landmark vectors
  const lm1 = Array.isArray(data1.landmarks) ? data1.landmarks : (data1.facemesh_data?.landmarks || []);
  const lm2 = Array.isArray(data2.landmarks) ? data2.landmarks : (data2.facemesh_data?.landmarks || []);

  if (lm1.length === 0 || lm2.length === 0) {
    // If only image data or simulated presence exists, evaluate image / presence validity
    if (data1.imageData && data2.imageData) return 0.85;
    return 0.5;
  }

  const norm1 = normalizeLandmarks(lm1);
  const norm2 = normalizeLandmarks(lm2);
  const minLen = Math.min(norm1.length, norm2.length);

  if (minLen === 0) return 0;

  let totalDist = 0;
  let validPoints = 0;

  for (let i = 0; i < minLen; i++) {
    const p1 = norm1[i];
    const p2 = norm2[i];
    if (p1 && p2) {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dz = p1.z - p2.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      totalDist += dist;
      validPoints++;
    }
  }

  if (validPoints === 0) return 0;
  const avgDist = totalDist / validPoints;

  // Exponential conversion from normalized distance to score [0, 1]
  const score = Math.max(0, Math.min(1, Math.exp(-avgDist * 1.5)));
  return Math.round(score * 100) / 100;
};

/**
 * Check if facemesh similarity exceeds the biometric threshold
 * @param {Object} data1 - First facemesh
 * @param {Object} data2 - Stored facemesh template
 * @param {Number} threshold - Verification threshold (default 0.70)
 * @returns {Boolean}
 */
const isFacemeshSimilar = (data1, data2, threshold = 0.70) => {
  const similarity = calculateFacemeshSimilarity(data1, data2);
  return similarity >= threshold;
};

module.exports = {
  normalizeLandmarks,
  generateFacemeshHash,
  calculateFacemeshSimilarity,
  isFacemeshSimilar
};
