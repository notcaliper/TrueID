package com.dbis.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.dbis.DBISApplication
import com.dbis.ui.screens.dashboard.DashboardScreen
import com.dbis.ui.screens.login.LoginScreen
import com.dbis.ui.screens.register.RegisterScreen
import com.dbis.ui.screens.welcome.WelcomeScreen
import com.dbis.ui.screens.blockchain.BlockchainRecordScreen
import com.dbis.ui.screens.profile.ProfileScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String,
    application: DBISApplication
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Welcome screen - entry point for new users
        composable("welcome") {
            WelcomeScreen(
                onNavigateToLogin = { navController.navigate("login") },
                onNavigateToRegister = { navController.navigate("register") }
            )
        }
        
        // Login screen
        composable("login") {
            LoginScreen(
                authManager = application.authManager,
                onLoginSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("welcome") { inclusive = true }
                    }
                },
                onNavigateToRegister = { navController.navigate("register") }
            )
        }
        
        // Registration screen
        composable("register") {
            RegisterScreen(
                authManager = application.authManager,
                onRegistrationSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("welcome") { inclusive = true }
                    }
                },
                onNavigateToLogin = { navController.navigate("login") }
            )
        }
        
        // Dashboard screen - main screen after authentication
        composable("dashboard") {
            DashboardScreen(
                authManager = application.authManager,
                blockchainManager = application.blockchainManager,
                onNavigateToProfile = { navController.navigate("profile") },
                onNavigateToBlockchain = { navController.navigate("blockchain") },
                onLogout = {
                    application.authManager.logout()
                    navController.navigate("welcome") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        
        // Profile screen
        composable("profile") {
            ProfileScreen(
                authManager = application.authManager,
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    application.authManager.logout()
                    navController.navigate("welcome") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        
        // Blockchain record screen
        composable("blockchain") {
            BlockchainRecordScreen(
                authManager = application.authManager,
                blockchainManager = application.blockchainManager,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
