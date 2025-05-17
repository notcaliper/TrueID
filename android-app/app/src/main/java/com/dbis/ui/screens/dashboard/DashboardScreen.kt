package com.dbis.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.dbis.blockchain.BlockchainManager
import com.dbis.models.BlockchainRecord
import com.dbis.ui.theme.Blue
import com.dbis.ui.theme.DarkText
import com.dbis.ui.theme.LightBlue
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    authManager: AuthManager,
    blockchainManager: BlockchainManager,
    onNavigateToProfile: () -> Unit,
    onNavigateToBlockchain: () -> Unit,
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var blockchainRecords by remember { mutableStateOf<List<BlockchainRecord>>(emptyList()) }
    var user by remember { mutableStateOf<String?>(null) }
    
    // Fetch user data and blockchain records on screen load
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val userId = authManager.getUserId()
                val token = authManager.getAuthToken()
                
                if (userId != null && token != null) {
                    user = userId
                    
                    // Fetch blockchain records
                    val result = blockchainManager.getBlockchainRecords(token, userId)
                    if (result.isSuccess) {
                        blockchainRecords = result.getOrNull() ?: emptyList()
                    } else {
                        errorMessage = "Failed to load blockchain records: ${result.exceptionOrNull()?.message}"
                    }
                } else {
                    errorMessage = "User not authenticated"
                }
            } catch (e: Exception) {
                errorMessage = "Error loading data: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("DBIS Dashboard") },
                actions = {
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Profile")
                    }
                    IconButton(onClick = onLogout) {
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
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = onLogout,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Blue
                        )
                    ) {
                        Text("Logout")
                    }
                }
            } else {
                DashboardContent(
                    blockchainRecords = blockchainRecords,
                    onNavigateToBlockchain = onNavigateToBlockchain,
                    onNavigateToProfile = onNavigateToProfile
                )
            }
        }
    }
}

@Composable
fun DashboardContent(
    blockchainRecords: List<BlockchainRecord>,
    onNavigateToBlockchain: () -> Unit,
    onNavigateToProfile: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Identity Status Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Identity Status",
                    style = MaterialTheme.typography.titleLarge,
                    color = DarkText
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(24.dp))
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
                            text = "Verified",
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
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Recent Blockchain Records
        Text(
            text = "Recent Blockchain Records",
            style = MaterialTheme.typography.titleLarge,
            color = DarkText,
            modifier = Modifier.padding(vertical = 8.dp)
        )
        
        if (blockchainRecords.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "No Records",
                        tint = Blue,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No blockchain records found",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn {
                items(blockchainRecords) { record ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable { onNavigateToBlockchain() },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(LightBlue),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Storage,
                                    contentDescription = "Blockchain Record",
                                    tint = Blue
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(16.dp))
                            
                            Column(
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Transaction: ${record.transactionHash.take(8)}...",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Timestamp: ${record.timestamp}",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                            
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "View Details"
                            )
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Quick Actions
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleLarge,
            color = DarkText,
            modifier = Modifier.padding(vertical = 8.dp)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            ActionButton(
                icon = Icons.Default.Person,
                text = "View Profile",
                onClick = onNavigateToProfile,
                modifier = Modifier.weight(1f)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            ActionButton(
                icon = Icons.Default.Storage,
                text = "Blockchain Records",
                onClick = onNavigateToBlockchain,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun ActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .padding(vertical = 8.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = LightBlue
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = text,
                tint = Blue,
                modifier = Modifier.size(32.dp)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = text,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = Blue,
                textAlign = TextAlign.Center
            )
        }
    }
}
