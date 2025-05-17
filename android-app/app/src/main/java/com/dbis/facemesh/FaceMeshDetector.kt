package com.dbis.facemesh

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.google.mediapipe.tasks.vision.core.BaseVisionTaskApi
import com.google.mediapipe.framework.image.BitmapImageBuilder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.ByteBuffer

class FaceMeshDetector(private val context: Context) {
    companion object {
        private const val TAG = "FaceMeshDetector"
        private const val MODEL_FILE = "face_landmarker.task"
    }
    
    private var faceLandmarker: FaceLandmarker? = null
    
    init {
        setupFaceLandmarker()
    }
    
    private fun setupFaceLandmarker() {
        try {
            val baseOptionsBuilder = FaceLandmarker.FaceLandmarkerOptions.builder()
                .setRunningMode(RunningMode.IMAGE)
                .setNumFaces(1) // Only detect one face for biometric authentication
                .setMinFaceDetectionConfidence(0.5f)
                .setMinFacePresenceConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
            
            context.assets.open(MODEL_FILE).use { fileInputStream ->
                faceLandmarker = FaceLandmarker.createFromOptions(
                    context,
                    baseOptionsBuilder.build()
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up face landmarker", e)
        }
    }
    
    suspend fun detectFaceMesh(bitmap: Bitmap): Result<ByteArray> = withContext(Dispatchers.Default) {
        try {
            val faceLandmarker = faceLandmarker ?: return@withContext Result.failure(
                Exception("Face landmarker not initialized")
            )
            
            val mpImage = BitmapImageBuilder(bitmap).build()
            val result = faceLandmarker.detect(mpImage)
            
            if (result.faceLandmarks().isEmpty()) {
                return@withContext Result.failure(Exception("No face detected"))
            }
            
            // Convert landmarks to a byte array for hashing
            val landmarkData = serializeLandmarks(result)
            Result.success(landmarkData)
        } catch (e: Exception) {
            Log.e(TAG, "Error detecting face mesh", e)
            Result.failure(e)
        }
    }
    
    private fun serializeLandmarks(result: FaceLandmarkerResult): ByteArray {
        // Get the first detected face
        val landmarks = result.faceLandmarks().firstOrNull() ?: return ByteArray(0)
        
        // Create a ByteBuffer to store the landmark coordinates
        val buffer = ByteBuffer.allocate(landmarks.size * 3 * Float.SIZE_BYTES)
        
        // Store each landmark's x, y, z coordinates
        landmarks.forEach { landmark ->
            buffer.putFloat(landmark.x())
            buffer.putFloat(landmark.y())
            buffer.putFloat(landmark.z())
        }
        
        // Convert the buffer to a byte array
        buffer.flip()
        val byteArray = ByteArray(buffer.remaining())
        buffer.get(byteArray)
        return byteArray
    }
    
    fun close() {
        faceLandmarker?.close()
        faceLandmarker = null
    }
}
