package com.dbis.api

import com.dbis.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Authentication endpoints
    @POST("user/register")
    suspend fun registerUser(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("user/login")
    suspend fun loginUser(@Body request: LoginRequest): Response<AuthResponse>
    
    // User profile endpoints
    @GET("user/profile")
    suspend fun getUserProfile(@Header("Authorization") token: String): Response<User>
    
    @PUT("user/profile")
    suspend fun updateUserProfile(
        @Header("Authorization") token: String,
        @Body user: User
    ): Response<User>
    
    // Biometric data endpoints
    @PUT("user/biometric")
    suspend fun updateBiometricData(
        @Header("Authorization") token: String,
        @Body biometricData: Map<String, String>
    ): Response<User>
    
    // Blockchain endpoints
    @GET("blockchain/fetch/{userId}")
    suspend fun getBlockchainRecord(
        @Header("Authorization") token: String,
        @Path("userId") userId: String
    ): Response<BlockchainRecord>
    
    @GET("blockchain/records/{userId}")
    suspend fun getBlockchainRecords(
        @Header("Authorization") token: String,
        @Path("userId") userId: String
    ): Response<List<BlockchainRecord>>
}
