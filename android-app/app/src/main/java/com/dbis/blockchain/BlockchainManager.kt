package com.dbis.blockchain

import android.util.Log
import com.dbis.api.ApiClient
import com.dbis.models.BlockchainRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BlockchainManager {
    companion object {
        private const val TAG = "BlockchainManager"
    }
    
    // Fetch blockchain record for a user
    suspend fun getBlockchainRecord(token: String, userId: String): Result<BlockchainRecord> = withContext(Dispatchers.IO) {
        try {
            val authToken = "Bearer $token"
            val response = ApiClient.apiService.getBlockchainRecord(authToken, userId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch blockchain record: ${response.errorBody()?.string()}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching blockchain record", e)
            Result.failure(e)
        }
    }
    
    // Fetch all blockchain records for a user
    suspend fun getBlockchainRecords(token: String, userId: String): Result<List<BlockchainRecord>> = withContext(Dispatchers.IO) {
        try {
            val authToken = "Bearer $token"
            val response = ApiClient.apiService.getBlockchainRecords(authToken, userId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch blockchain records: ${response.errorBody()?.string()}"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching blockchain records", e)
            Result.failure(e)
        }
    }
    
    // Get blockchain explorer URL for a transaction
    fun getBlockchainExplorerUrl(transactionHash: String, chainId: String = "80001"): String {
        return when (chainId) {
            "80001" -> "https://mumbai.polygonscan.com/tx/$transactionHash" // Polygon Mumbai Testnet
            "1" -> "https://etherscan.io/tx/$transactionHash" // Ethereum Mainnet
            else -> "https://etherscan.io/tx/$transactionHash" // Default to Ethereum
        }
    }
}
