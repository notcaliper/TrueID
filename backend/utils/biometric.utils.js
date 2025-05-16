/**
 * Biometric utilities for DBIS
 * Handles facemesh data processing and verification
 */
const crypto = require('crypto');

/**
 * Generate SHA-256 hash for facemesh data
 * @param {Object} facemeshData - Facemesh data object
 * @returns {String} SHA-256 hash
 */
const generateFacemeshHash = (facemeshData) => {
  // Ensure facemeshData is an object
  if (typeof facemeshData !== 'object' || facemeshData === null) {
    throw new Error('Facemesh data must be a valid object');
  }

  // Sort keys to ensure consistent hashing regardless of property order
  const normalizedData = normalizeObject(facemeshData);
  
  // Convert facemesh data to a consistent string format
  const facemeshString = JSON.stringify(normalizedData);
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(facemeshString).digest('hex');
};

/**
 * Normalize an object by sorting keys recursively
 * @param {Object} obj - Object to normalize
 * @returns {Object} Normalized object with sorted keys
 */
const normalizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeObject);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = normalizeObject(obj[key]);
      return result;
    }, {});
};

/**
 * Verify facemesh data against a stored hash
 * @param {Object} facemeshData - Facemesh data to verify
 * @param {String} storedHash - Stored hash to compare against
 * @returns {Boolean} True if the hash matches
 */
const verifyFacemeshHash = (facemeshData, storedHash) => {
  try {
    const generatedHash = generateFacemeshHash(facemeshData);
    return generatedHash === storedHash;
  } catch (error) {
    console.error('Facemesh verification error:', error);
    return false;
  }
};

/**
 * Calculate similarity between two facemesh data objects
 * This is a simplified implementation for demonstration purposes
 * In a real-world scenario, you would use a more sophisticated algorithm
 * @param {Object} facemeshData1 - First facemesh data
 * @param {Object} facemeshData2 - Second facemesh data
 * @returns {Number} Similarity score between 0 and 1
 */
const calculateFacemeshSimilarity = (facemeshData1, facemeshData2) => {
  // This is a placeholder implementation
  // In a real system, you would use a proper biometric comparison algorithm
  
  // For demonstration, we'll just compare a few key points
  // Assuming facemeshData has a 'landmarks' array with facial landmark coordinates
  if (!facemeshData1.landmarks || !facemeshData2.landmarks) {
    return 0;
  }
  
  const landmarks1 = facemeshData1.landmarks;
  const landmarks2 = facemeshData2.landmarks;
  
  // Ensure both have the same number of landmarks
  if (landmarks1.length !== landmarks2.length) {
    return 0;
  }
  
  // Calculate Euclidean distance between corresponding landmarks
  let totalDistance = 0;
  let pointCount = 0;
  
  for (let i = 0; i < landmarks1.length; i++) {
    const point1 = landmarks1[i];
    const point2 = landmarks2[i];
    
    if (point1 && point2 && point1.x !== undefined && point1.y !== undefined && point1.z !== undefined) {
      const distance = Math.sqrt(
        Math.pow(point1.x - point2.x, 2) +
        Math.pow(point1.y - point2.y, 2) +
        Math.pow(point1.z - point2.z, 2)
      );
      
      totalDistance += distance;
      pointCount++;
    }
  }
  
  if (pointCount === 0) {
    return 0;
  }
  
  // Average distance
  const avgDistance = totalDistance / pointCount;
  
  // Convert to similarity score (0 to 1)
  // Smaller distance means higher similarity
  // Using a simple exponential decay function
  const similarity = Math.exp(-avgDistance);
  
  return similarity;
};

/**
 * Check if facemesh similarity is above threshold
 * @param {Object} facemeshData1 - First facemesh data
 * @param {Object} facemeshData2 - Second facemesh data
 * @param {Number} threshold - Similarity threshold (0 to 1)
 * @returns {Boolean} True if similarity is above threshold
 */
const isFacemeshSimilar = (facemeshData1, facemeshData2, threshold = 0.85) => {
  const similarity = calculateFacemeshSimilarity(facemeshData1, facemeshData2);
  return similarity >= threshold;
};

module.exports = {
  generateFacemeshHash,
  verifyFacemeshHash,
  calculateFacemeshSimilarity,
  isFacemeshSimilar
};
