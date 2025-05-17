package com.dbis.ui.screens.login

import android.content.Context
import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.dbis.auth.AuthManager
import com.dbis.facemesh.FaceMeshDetector
import com.dbis.ui.theme.Blue
import com.dbis.ui.theme.DarkText
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.Executor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    authManager: AuthManager,
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showCamera by remember { mutableStateOf(false) }
    
    // Camera state
    val imageCapture = remember { ImageCapture.Builder().build() }
    val cameraExecutor = remember { ContextCompat.getMainExecutor(context) }
    
    // FaceMesh detector
    val faceMeshDetector = remember { FaceMeshDetector(context) }
    
    // Cleanup when leaving the screen
    DisposableEffect(Unit) {
        onDispose {
            faceMeshDetector.close()
        }
    }
    
    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Text(
                text = "Login",
                style = MaterialTheme.typography.headlineMedium,
                color = DarkText,
                modifier = Modifier.padding(top = 48.dp, bottom = 24.dp)
            )
            
            // Error message
            errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                )
            }
            
            if (showCamera) {
                // Camera preview
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(400.dp)
                        .background(Color.Black, RoundedCornerShape(16.dp))
                ) {
                    AndroidView(
                        factory = { context ->
                            val previewView = PreviewView(context).apply {
                                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                            }
                            
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                            cameraProviderFuture.addListener({
                                val cameraProvider = cameraProviderFuture.get()
                                val preview = Preview.Builder().build().also {
                                    it.setSurfaceProvider(previewView.surfaceProvider)
                                }
                                
                                try {
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycleOwner,
                                        CameraSelector.DEFAULT_FRONT_CAMERA,
                                        preview,
                                        imageCapture
                                    )
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }, cameraExecutor)
                            
                            previewView
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                    
                    // Capture button
                    Button(
                        onClick = {
                            captureImage(
                                context = context,
                                imageCapture = imageCapture,
                                executor = cameraExecutor,
                                onImageCaptured = { bitmap ->
                                    scope.launch {
                                        isLoading = true
                                        showCamera = false
                                        
                                        // Process biometric data
                                        val biometricResult = faceMeshDetector.detectFaceMesh(bitmap)
                                        
                                        biometricResult.fold(
                                            onSuccess = { biometricData ->
                                                // Attempt login
                                                val loginResult = authManager.loginUser(email, biometricData)
                                                
                                                loginResult.fold(
                                                    onSuccess = {
                                                        isLoading = false
                                                        onLoginSuccess()
                                                    },
                                                    onFailure = { e ->
                                                        isLoading = false
                                                        errorMessage = e.message ?: "Login failed"
                                                    }
                                                )
                                            },
                                            onFailure = { e ->
                                                isLoading = false
                                                errorMessage = "Failed to process facial data: ${e.message}"
                                            }
                                        )
                                    }
                                },
                                onError = { exception ->
                                    errorMessage = "Failed to capture image: ${exception.message}"
                                }
                            )
                        },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Blue
                        )
                    ) {
                        Text("Capture")
                    }
                }
            } else {
                // Email field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = "Email"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Login with Face button
                Button(
                    onClick = {
                        if (email.isBlank()) {
                            errorMessage = "Please enter your email"
                            return@Button
                        }
                        showCamera = true
                        errorMessage = null
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Blue
                    ),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    } else {
                        Text("Login with Face")
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Register link
                TextButton(
                    onClick = onNavigateToRegister,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Don't have an account? Register",
                        color = Blue
                    )
                }
            }
        }
    }
}

private fun captureImage(
    context: Context,
    imageCapture: ImageCapture,
    executor: Executor,
    onImageCaptured: (Bitmap) -> Unit,
    onError: (ImageCaptureException) -> Unit
) {
    val photoFile = File(
        context.cacheDir,
        SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US)
            .format(System.currentTimeMillis()) + ".jpg"
    )
    
    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
    
    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                try {
                    // Load the saved image as a bitmap
                    val bitmap = android.graphics.BitmapFactory.decodeFile(photoFile.absolutePath)
                    onImageCaptured(bitmap)
                    
                    // Delete the temporary file
                    photoFile.delete()
                } catch (e: Exception) {
                    onError(ImageCaptureException(0, e.message ?: "Unknown error", e))
                }
            }
            
            override fun onError(exception: ImageCaptureException) {
                onError(exception)
            }
        }
    )
}
