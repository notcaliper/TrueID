package com.dbis

import android.app.Application
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.dbis.auth.AuthManager
import com.dbis.blockchain.BlockchainManager

class DBISApplication : Application() {
    
    lateinit var authManager: AuthManager
    lateinit var blockchainManager: BlockchainManager
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize encrypted shared preferences
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val encryptedSharedPreferences = EncryptedSharedPreferences.create(
            "dbis_secure_prefs",
            masterKeyAlias,
            this,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        
        // Initialize managers
        authManager = AuthManager(encryptedSharedPreferences)
        blockchainManager = BlockchainManager()
        
        // Log application start
        println("DBIS Application started")
    }
}
