package com.dbis.auth

import android.content.SharedPreferences
import android.util.Log
import com.dbis.api.ApiClient
import com.dbis.models.LoginRequest
import com.dbis.models.RegisterRequest
import com.dbis.models.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest

class AuthManager(private val securePrefs: SharedPreferences) {
    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USER_ID = "user_id"
        private const val TAG = "AuthManager"
    }
    
    // Check if user is authenticated
    fun isAuthenticated(): Boolean {
        return getAuthToken() != null
    }
    
    // Get stored authentication token
    fun getAuthToken(): String? {
        return securePrefs.getString(KEY_AUTH_TOKEN, null)
    }
    
    // Get stored user ID
    fun getUserId(): String? {
        return securePrefs.getString(KEY_USER_ID, null)
    }
    
    // Store authentication token and user ID
    private fun storeAuthCredentials(token: String, userId: String) {
        securePrefs.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .apply()
    }
    
    // Clear authentication credentials
    fun logout() {
        securePrefs.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_ID)
            .apply()
    }
    
    // Register a new user
    suspend fun registerUser(
        name: String,
        governmentId: String,
        email: String,
        phone: String,
        biometricData: ByteArray
    ): Result<User> = withContext(Dispatchers.IO) {
        try {
            val biometricHash = hashBiometricData(biometricData)
            
            val registerRequest = RegisterRequest(
                name = name,
                governmentId = governmentId,
                email = email,
                phone = phone,
                biometricHash = biometricHash
            )
            
            val response = ApiClient.apiService.registerUser(registerRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                storeAuthCredentials(authResponse.token, authResponse.user.id)
                Result.success(authResponse.user)
            } else {
                Result.failure(Exception("Registration failed: ${response.errorBody()?.string()}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Registration error", e)
            Result.failure(e)
        }
    }
    
    // Login with biometric data
    suspend fun loginUser(email: String, biometricData: ByteArray): Result<User> = withContext(Dispatchers.IO) {
        try {
            val biometricHash = hashBiometricData(biometricData)
            
            val loginRequest = LoginRequest(
                email = email,
                biometricHash = biometricHash
            )
            
            val response = ApiClient.apiService.loginUser(loginRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                storeAuthCredentials(authResponse.token, authResponse.user.id)
                Result.success(authResponse.user)
            } else {
                Result.failure(Exception("Login failed: ${response.errorBody()?.string()}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Login error", e)
            Result.failure(e)
        }
    }
    
    // Hash biometric data using SHA-256
    fun hashBiometricData(biometricData: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(biometricData)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
}
