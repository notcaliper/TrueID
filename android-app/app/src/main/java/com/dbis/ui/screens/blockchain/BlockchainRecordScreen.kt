package com.dbis.ui.screens.blockchain

import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
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
fun BlockchainRecordScreen(
    authManager: AuthManager,
    blockchainManager: BlockchainManager,
    onNavigateBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current
    
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var blockchainRecords by remember { mutableStateOf<List<BlockchainRecord>>(emptyList()) }
    
    // Fetch blockchain records on screen load
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val userId = authManager.getUserId()
                val token = authManager.getAuthToken()
                
                if (userId != null && token != null) {
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
                title = { Text("Blockchain Records") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
            } else if (blockchainRecords.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "No Records",
                        tint = Blue,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No blockchain records found",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    item {
                        Text(
                            text = "Your Identity on Blockchain",
                            style = MaterialTheme.typography.headlineSmall,
                            color = DarkText,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        
                        Text(
                            text = "Your biometric identity is securely stored on the blockchain with the following records:",
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )
                    }
                    
                    items(blockchainRecords) { record ->
                        BlockchainRecordCard(
                            record = record,
                            blockchainManager = blockchainManager,
                            onViewInExplorer = { url ->
                                uriHandler.openUri(url)
                            }
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun BlockchainRecordCard(
    record: BlockchainRecord,
    blockchainManager: BlockchainManager,
    onViewInExplorer: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth(),
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(24.dp))
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
                        text = "Transaction",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.Gray
                    )
                    Text(
                        text = record.transactionHash,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Record details
            val blockNumberString: String = record.blockNumber.toString()
            RecordDetailItem("Block Number", blockNumberString)
            RecordDetailItem("Timestamp", record.timestamp)
            RecordDetailItem("Status", "Confirmed", Color.Green)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // View in explorer button
            OutlinedButton(
                onClick = { 
                    val explorerUrl = blockchainManager.getBlockchainExplorerUrl(record.transactionHash)
                    onViewInExplorer(explorerUrl)
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.OpenInNew,
                    contentDescription = "View in Explorer"
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("View in Blockchain Explorer")
            }
        }
    }
}

@Composable
fun RecordDetailItem(
    label: String,
    value: String,
    valueColor: Color = DarkText
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor,
            fontWeight = FontWeight.Medium
        )
    }
    
    Divider(modifier = Modifier.padding(vertical = 8.dp))
}
