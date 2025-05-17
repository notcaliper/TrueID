package com.dbis.models

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("token") val token: String,
    @SerializedName("user") val user: User,
    @SerializedName("message") val message: String
)
