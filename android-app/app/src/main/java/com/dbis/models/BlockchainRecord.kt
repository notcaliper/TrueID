package com.dbis.models

import com.google.gson.annotations.SerializedName

data class BlockchainRecord(
    @SerializedName("userId") val userId: String,
    @SerializedName("biometricHash") val biometricHash: String,
    @SerializedName("verified") val verified: Boolean,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("transactionHash") val transactionHash: String,
    @SerializedName("blockNumber") val blockNumber: Long,
    @SerializedName("chainId") val chainId: String
)
