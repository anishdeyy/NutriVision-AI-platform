package com.nutrivision.ui.screens

import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.data.AiFoodResult
import com.nutrivision.data.Screen
import com.nutrivision.ui.components.GlassCard
import com.nutrivision.ui.components.GradientButton
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.FoodEntryViewModel
import java.util.concurrent.Executors

@Composable
fun CameraScreen(
    navController: NavController,
    mealType: String = "Lunch",
    viewModel: FoodEntryViewModel = hiltViewModel()
) {
    val context       = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState       by viewModel.uiState.collectAsState()

    var hasCameraPermission by remember { mutableStateOf(false) }
    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }
    var capturedBitmap: Bitmap? by remember { mutableStateOf(null) }
    var selectedMeal   by remember { mutableStateOf(mealType) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.CAMERA)
        viewModel.setMealType(selectedMeal)
    }

    // Show saved snackbar then pop
    LaunchedEffect(uiState.savedMessage) {
        if (uiState.savedMessage != null) {
            kotlinx.coroutines.delay(1500)
            viewModel.clearSavedMessage()
            navController.popBackStack()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(DarkBg)) {

        // ── Camera Preview ────────────────────────────────────────────────────
        if (hasCameraPermission && capturedBitmap == null) {
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        val provider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also {
                            it.setSurfaceProvider(previewView.surfaceProvider)
                        }
                        val ic = ImageCapture.Builder()
                            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                            .build()
                        imageCapture = ic
                        try {
                            provider.unbindAll()
                            provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, ic)
                        } catch (e: Exception) { /* handle */ }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                modifier = Modifier.fillMaxSize()
            )
        }

        // ── Captured Image Preview ────────────────────────────────────────────
        capturedBitmap?.let { bmp ->
            androidx.compose.foundation.Image(
                bitmap      = bmp.asImageBitmap(),
                contentDescription = "Captured food",
                modifier    = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
        }

        // ── Top Bar ───────────────────────────────────────────────────────────
        Row(
            modifier              = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment     = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { navController.popBackStack() },
                modifier = Modifier
                    .size(44.dp)
                    .background(SurfaceDark.copy(alpha = 0.8f), CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, null, tint = TextPrimary)
            }
            Text(
                "AI Food Scanner",
                style    = MaterialTheme.typography.titleMedium,
                modifier = Modifier
                    .background(SurfaceDark.copy(alpha = 0.8f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )
            // Meal selector pill
            Box(
                modifier = Modifier
                    .background(NeonGreen.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(selectedMeal, style = MaterialTheme.typography.bodySmall.copy(color = NeonGreen))
            }
        }

        // ── Scanning overlay (crosshair) ──────────────────────────────────────
        if (capturedBitmap == null && !uiState.isAnalyzing) {
            Box(
                modifier = Modifier
                    .size(240.dp)
                    .align(Alignment.Center)
                    .border(2.dp, NeonGreen.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
            )
        }

        // ── Loading spinner ───────────────────────────────────────────────────
        if (uiState.isAnalyzing) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(DarkBg.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = NeonGreen, strokeWidth = 4.dp)
                    Spacer(Modifier.height(16.dp))
                    Text("🤖 AI is analyzing your food…", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        // ── Bottom Panel ──────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            // Results panel
            AnimatedVisibility(
                visible = uiState.detectedFoods.isNotEmpty(),
                enter   = slideInVertically { it },
                exit    = slideOutVertically { it }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(listOf(Color.Transparent, DarkBg)),
                            RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                        )
                        .padding(16.dp)
                ) {
                    Text(
                        "🎯 Detected Foods",
                        style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary)
                    )
                    Spacer(Modifier.height(12.dp))
                    uiState.detectedFoods.forEach { food ->
                        AiFoodResultCard(
                            food       = food,
                            onAdd      = {
                                viewModel.saveAiFood(food, selectedMeal)
                            }
                        )
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }

            // Success message
            uiState.savedMessage?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(NeonGreen)
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(msg, style = MaterialTheme.typography.bodyMedium.copy(color = Color(0xFF003319), fontWeight = FontWeight.Bold))
                }
            }

            // Error
            uiState.error?.let { err ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.error.copy(alpha = 0.9f))
                        .padding(16.dp)
                ) {
                    Text(err, style = MaterialTheme.typography.bodySmall.copy(color = Color.White))
                }
            }

            // Controls
            Row(
                modifier              = Modifier
                    .fillMaxWidth()
                    .background(DarkBg)
                    .padding(16.dp)
                    .navigationBarsPadding(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                // Gallery (retake)
                if (capturedBitmap != null) {
                    OutlinedButton(
                        onClick = {
                            capturedBitmap = null
                            viewModel.clearError()
                        },
                        border = BorderStroke(1.dp, NeonGreen),
                        modifier = Modifier.weight(1f).padding(end = 8.dp)
                    ) {
                        Icon(Icons.Default.Refresh, null, tint = NeonGreen)
                        Spacer(Modifier.width(8.dp))
                        Text("Retake", color = NeonGreen)
                    }
                }

                // Capture button
                if (capturedBitmap == null) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(
                                Brush.radialGradient(GradientGreen),
                                CircleShape
                            )
                            .clickable {
                                captureImage(imageCapture) { bitmap ->
                                    capturedBitmap = bitmap
                                    viewModel.analyzeImage(bitmap)
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Camera, null, tint = Color(0xFF003319), modifier = Modifier.size(32.dp))
                    }
                }

                // Manual entry shortcut
                OutlinedButton(
                    onClick = { navController.navigate(Screen.Manual.route + "?mealType=$selectedMeal") },
                    border  = BorderStroke(1.dp, ElectricBlue),
                    modifier = Modifier.weight(1f).padding(start = 8.dp)
                ) {
                    Icon(Icons.Default.Edit, null, tint = ElectricBlue)
                    Spacer(Modifier.width(8.dp))
                    Text("Manual", color = ElectricBlue)
                }
            }
        }
    }
}

@Composable
private fun AiFoodResultCard(food: AiFoodResult, onAdd: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark, RoundedCornerShape(14.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment     = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(food.foodName, style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary, fontWeight = FontWeight.SemiBold))
            Text(
                "${food.estimatedQuantityG.toInt()}g  •  ${food.calories.toInt()} cal  •  P${food.protein.toInt()}g",
                style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary)
            )
        }
        Spacer(Modifier.width(8.dp))
        IconButton(
            onClick  = onAdd,
            modifier = Modifier
                .size(36.dp)
                .background(NeonGreen, CircleShape)
        ) {
            Icon(Icons.Default.Add, null, tint = Color(0xFF003319), modifier = Modifier.size(20.dp))
        }
    }
}

private fun captureImage(
    imageCapture: ImageCapture?,
    onCaptured: (Bitmap) -> Unit
) {
    imageCapture ?: return
    val executor = Executors.newSingleThreadExecutor()
    imageCapture.takePicture(executor, object : ImageCapture.OnImageCapturedCallback() {
        override fun onCaptureSuccess(image: ImageProxy) {
            val buffer = image.planes[0].buffer
            val bytes  = ByteArray(buffer.remaining())
            buffer.get(bytes)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            image.close()
            onCaptured(bitmap)
        }

        override fun onError(exception: ImageCaptureException) {
            /* handle error */
        }
    })
}
