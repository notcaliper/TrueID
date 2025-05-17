package com.dbis.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("biometricHash") val biometricHash: String
)

data class RegisterRequest(
    @SerializedName("name") val name: String,
    @SerializedName("governmentId") val governmentId: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("biometricHash") val biometricHash: String
)
