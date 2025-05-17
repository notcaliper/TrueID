package com.dbis.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.dbis.DBISApplication
import com.dbis.ui.navigation.AppNavHost
import com.dbis.ui.theme.DBISTheme

class MainActivity : ComponentActivity() {
    private lateinit var application: DBISApplication
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        // Get application instance
        application = applicationContext as DBISApplication
        
        setContent {
            DBISTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    DBISApp(application)
                }
            }
        }
    }
}

@Composable
fun DBISApp(application: DBISApplication) {
    val navController = rememberNavController()
    
    // Check if user is authenticated
    val startDestination = if (application.authManager.isAuthenticated()) {
        "dashboard"
    } else {
        "welcome"
    }
    
    AppNavHost(
        navController = navController,
        startDestination = startDestination,
        application = application
    )
}
