package com.nutrivision.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.data.Screen
import com.nutrivision.ui.components.GradientButton
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    navController: NavController,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPass by remember { mutableStateOf(false) }

    // Navigate on success
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) navController.navigate(Screen.Home.route) {
            popUpTo(Screen.Login.route) { inclusive = true }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBg, Color(0xFF0D1B2A))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(80.dp))

            // Logo area
            Text("🥗", fontSize = 64.sp)
            Spacer(Modifier.height(16.dp))
            Text(
                "NutriVision",
                style = MaterialTheme.typography.headlineLarge.copy(color = NeonGreen)
            )
            Text(
                "Your AI Diet Tracker",
                style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary)
            )

            Spacer(Modifier.height(48.dp))

            // Email
            OutlinedTextField(
                value         = email,
                onValueChange = { email = it },
                label         = { Text("Email") },
                leadingIcon   = { Icon(Icons.Default.Email, null, tint = NeonGreen) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier      = Modifier.fillMaxWidth(),
                shape         = RoundedCornerShape(14.dp),
                colors        = nutrivisionFieldColors()
            )

            Spacer(Modifier.height(16.dp))

            // Password
            OutlinedTextField(
                value             = password,
                onValueChange     = { password = it },
                label             = { Text("Password") },
                leadingIcon       = { Icon(Icons.Default.Lock, null, tint = NeonGreen) },
                trailingIcon      = {
                    IconButton(onClick = { showPass = !showPass }) {
                        Icon(
                            if (showPass) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null, tint = TextSecondary
                        )
                    }
                },
                visualTransformation = if (showPass) VisualTransformation.None else PasswordVisualTransformation(),
                modifier          = Modifier.fillMaxWidth(),
                shape             = RoundedCornerShape(14.dp),
                colors            = nutrivisionFieldColors()
            )

            Spacer(Modifier.height(24.dp))

            // Error
            AnimatedVisibility(uiState.error != null) {
                Text(
                    uiState.error ?: "",
                    color  = MaterialTheme.colorScheme.error,
                    style  = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            GradientButton(
                text    = if (uiState.isLoading) "Signing in…" else "Sign In",
                onClick = { viewModel.signIn(email, password) },
                modifier = Modifier.fillMaxWidth(),
                enabled  = !uiState.isLoading && email.isNotBlank() && password.isNotBlank()
            )

            Spacer(Modifier.height(20.dp))

            Row {
                Text("Don't have an account? ", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
                Text(
                    "Sign Up",
                    style    = MaterialTheme.typography.bodyMedium.copy(color = NeonGreen),
                    modifier = Modifier.clickable { navController.navigate(Screen.Register.route) }
                )
            }
        }
    }
}

@Composable
fun RegisterScreen(
    navController: NavController,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var name     by remember { mutableStateOf("") }
    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPass by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) navController.navigate(Screen.Onboarding.route) {
            popUpTo(Screen.Register.route) { inclusive = true }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBg, Color(0xFF0D1B2A))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(60.dp))

            Text("Create Account", style = MaterialTheme.typography.headlineMedium.copy(color = TextPrimary))
            Text("Let's set up your profile", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))

            Spacer(Modifier.height(40.dp))

            OutlinedTextField(
                value         = name,
                onValueChange = { name = it },
                label         = { Text("Full Name") },
                leadingIcon   = { Icon(Icons.Default.Person, null, tint = NeonGreen) },
                modifier      = Modifier.fillMaxWidth(),
                shape         = RoundedCornerShape(14.dp),
                colors        = nutrivisionFieldColors()
            )
            Spacer(Modifier.height(14.dp))
            OutlinedTextField(
                value         = email,
                onValueChange = { email = it },
                label         = { Text("Email") },
                leadingIcon   = { Icon(Icons.Default.Email, null, tint = NeonGreen) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier      = Modifier.fillMaxWidth(),
                shape         = RoundedCornerShape(14.dp),
                colors        = nutrivisionFieldColors()
            )
            Spacer(Modifier.height(14.dp))
            OutlinedTextField(
                value             = password,
                onValueChange     = { password = it },
                label             = { Text("Password") },
                leadingIcon       = { Icon(Icons.Default.Lock, null, tint = NeonGreen) },
                trailingIcon      = {
                    IconButton(onClick = { showPass = !showPass }) {
                        Icon(
                            if (showPass) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null, tint = TextSecondary
                        )
                    }
                },
                visualTransformation = if (showPass) VisualTransformation.None else PasswordVisualTransformation(),
                modifier          = Modifier.fillMaxWidth(),
                shape             = RoundedCornerShape(14.dp),
                colors            = nutrivisionFieldColors()
            )

            Spacer(Modifier.height(24.dp))

            AnimatedVisibility(uiState.error != null) {
                Text(uiState.error ?: "", color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 8.dp))
            }

            GradientButton(
                text     = if (uiState.isLoading) "Creating account…" else "Create Account",
                onClick  = { viewModel.signUp(email, password, name) },
                modifier = Modifier.fillMaxWidth(),
                enabled  = !uiState.isLoading && name.isNotBlank() && email.isNotBlank() && password.length >= 6
            )

            Spacer(Modifier.height(20.dp))

            Row {
                Text("Already have an account? ", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
                Text(
                    "Sign In",
                    style    = MaterialTheme.typography.bodyMedium.copy(color = NeonGreen),
                    modifier = Modifier.clickable { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
private fun nutrivisionFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor   = NeonGreen,
    unfocusedBorderColor = SurfaceLight,
    focusedLabelColor    = NeonGreen,
    cursorColor          = NeonGreen,
    focusedTextColor     = TextPrimary,
    unfocusedTextColor   = TextPrimary,
    unfocusedLabelColor  = TextSecondary,
    unfocusedContainerColor = SurfaceDark,
    focusedContainerColor   = SurfaceDark
)
