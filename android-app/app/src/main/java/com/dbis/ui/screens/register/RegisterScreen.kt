package com.dbis.ui.screens.register

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
fun RegisterScreen(
    authManager: AuthManager,
    onRegistrationSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    
    // Form state
    var name by remember { mutableStateOf("") }
    var governmentId by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showCamera by remember { mutableStateOf(false) }
    var capturedBiometricData by remember { mutableStateOf<ByteArray?>(null) }
    var registrationStep by remember { mutableStateOf(1) } // 1: Form, 2: Biometric Capture
    
    // Camera state
    val imageCapture = remember { ImageCapture.Builder().build() }
    val cameraExecutor = remember { ContextCompat.getMainExecutor(context) }
    
    // FaceMesh detector
    val faceMeshDetector = remember { FaceMeshDetector(context) }
    
    // Permission launcher
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            showCamera = true
        } else {
            errorMessage = "Camera permission is required for biometric registration"
        }
    }
    
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
                .padding(24.dp)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Text(
                text = "Register",
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
                // Camera preview for biometric capture
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
                                
                                val cameraSelector = CameraSelector.Builder()
                                    .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                                    .build()
                                
                                try {
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycleOwner,
                                        cameraSelector,
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
                                        try {
                                            isLoading = true
                                            // Process the captured image to extract biometric data
                                            val biometricResult = faceMeshDetector.detectFaceMesh(bitmap)
                                            
                                            if (biometricResult.isFailure) {
                                                errorMessage = biometricResult.exceptionOrNull()?.message ?: "No face detected. Please try again."
                                                isLoading = false
                                                return@launch
                                            }
                                            
                                            val biometricData = biometricResult.getOrNull()!!
                                            capturedBiometricData = biometricData
                                            
                                            // Proceed with registration
                                            val result = authManager.registerUser(
                                                name = name,
                                                governmentId = governmentId,
                                                email = email,
                                                phone = phone,
                                                biometricData = biometricData
                                            )
                                            
                                            isLoading = false
                                            showCamera = false
                                            
                                            if (result.isSuccess) {
                                                onRegistrationSuccess()
                                            } else {
                                                errorMessage = result.exceptionOrNull()?.message ?: "Registration failed"
                                            }
                                        } catch (e: Exception) {
                                            isLoading = false
                                            errorMessage = "Error processing biometric data: ${e.message}"
                                        }
                                    }
                                },
                                onError = { exception ->
                                    errorMessage = "Failed to capture image: ${exception.message}"
                                    isLoading = false
                                }
                            )
                        },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 16.dp),
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Blue
                        )
                    ) {
                        Text("Capture")
                    }
                    
                    // Back button
                    TextButton(
                        onClick = {
                            showCamera = false
                            registrationStep = 1
                        },
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                    ) {
                        Text("Back to Form")
                    }
                    
                    // Loading indicator
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center),
                            color = Color.White
                        )
                    }
                }
            } else {
                // Registration form
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Name"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = governmentId,
                    onValueChange = { governmentId = it },
                    label = { Text("Government ID") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Badge,
                            contentDescription = "Government ID"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
                
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
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = "Phone"
                        )
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = ImeAction.Done
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Continue to Biometric Capture button
                Button(
                    onClick = {
                        // Validate form fields
                        when {
                            name.isBlank() -> {
                                errorMessage = "Please enter your full name"
                            }
                            governmentId.isBlank() -> {
                                errorMessage = "Please enter your government ID"
                            }
                            email.isBlank() -> {
                                errorMessage = "Please enter your email"
                            }
                            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                                errorMessage = "Please enter a valid email address"
                            }
                            phone.isBlank() -> {
                                errorMessage = "Please enter your phone number"
                            }
                            else -> {
                                errorMessage = null
                                registrationStep = 2
                                // Request camera permission
                                cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
                            }
                        }
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
                        Text("Continue to Face Registration")
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Login link
                TextButton(
                    onClick = onNavigateToLogin,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Already have an account? Login",
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
