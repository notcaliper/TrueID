package com.dbis.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.dbis.auth.AuthManager
import com.dbis.models.User
import com.dbis.ui.theme.Blue
import com.dbis.ui.theme.DarkText
import com.dbis.ui.theme.LightBlue
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    authManager: AuthManager,
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var user by remember { mutableStateOf<User?>(null) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    
    // Fetch user profile on screen load
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val userId = authManager.getUserId()
                val token = authManager.getAuthToken()
                
                if (userId != null && token != null) {
                    // In a real app, you would fetch the user profile from the API
                    // For now, we'll create a placeholder user
                    user = User(
                        id = userId,
                        name = "John Doe",
                        email = "john.doe@example.com",
                        governmentId = "GOV123456789",
                        phone = "+1234567890",
                        verificationStatus = "Verified",
                        biometricHash = null,
                        createdAt = "2023-07-01T12:00:00Z",
                        updatedAt = "2023-07-01T12:00:00Z"
                    )
                } else {
                    errorMessage = "User not authenticated"
                }
            } catch (e: Exception) {
                errorMessage = "Error loading profile: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }
    
    // Logout confirmation dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    }
                ) {
                    Text("Logout")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showLogoutDialog = true }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Blue
                )
            } else if (errorMessage != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Error,
                        contentDescription = "Error",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = errorMessage ?: "Unknown error",
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                }
            } else if (user != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(scrollState),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Profile header
                    ProfileHeader(user = user!!)
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Profile details
                    ProfileDetailsSection(user = user!!)
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Verification status
                    VerificationStatusSection(user = user!!)
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Actions
                    Button(
                        onClick = { showLogoutDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout"
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Logout")
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileHeader(user: User) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Profile avatar
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(LightBlue),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = user.name.take(1).uppercase(),
                style = MaterialTheme.typography.headlineLarge,
                color = Blue,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // User name
        Text(
            text = user.name,
            style = MaterialTheme.typography.headlineMedium,
            color = DarkText,
            fontWeight = FontWeight.Bold
        )
        
        // User email
        Text(
            text = user.email,
            style = MaterialTheme.typography.bodyLarge,
            color = Color.Gray
        )
    }
}

@Composable
fun ProfileDetailsSection(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Personal Information",
                style = MaterialTheme.typography.titleLarge,
                color = DarkText,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileDetailItem(
                icon = Icons.Default.Badge,
                label = "Government ID",
                value = user.governmentId
            )
            
            ProfileDetailItem(
                icon = Icons.Default.Phone,
                label = "Phone Number",
                value = user.phone
            )
        }
    }
}

@Composable
fun VerificationStatusSection(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Verification Status",
                style = MaterialTheme.typography.titleLarge,
                color = DarkText,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Green),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified",
                        tint = Color.White
                    )
                }
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Column {
                    Text(
                        text = user.verificationStatus,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Your identity has been verified and is securely stored on the blockchain",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileDetailItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = Blue,
            modifier = Modifier.size(24.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
            
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                color = DarkText
            )
        }
    }
    
    Divider(modifier = Modifier.padding(vertical = 8.dp))
}
