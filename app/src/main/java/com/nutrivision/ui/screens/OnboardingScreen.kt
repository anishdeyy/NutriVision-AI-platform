package com.nutrivision.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.data.Screen
import com.nutrivision.data.UserProfileEntity
import com.nutrivision.ui.components.GradientButton
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.ProfileViewModel

@Composable
fun OnboardingScreen(
    navController: NavController,
    userId: String = "",
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var currentStep   by remember { mutableStateOf(0) }
    var age           by remember { mutableStateOf("25") }
    var heightFt      by remember { mutableStateOf("5") }
    var heightIn      by remember { mutableStateOf("6") }
    var weight        by remember { mutableStateOf("70") }
    var selectedGoal  by remember { mutableStateOf("Maintenance") }
    var activityLevel by remember { mutableStateOf("Moderate") }

    LaunchedEffect(uiState.savedSuccess) {
        if (uiState.savedSuccess) {
            navController.navigate(Screen.Home.route) {
                popUpTo(Screen.Onboarding.route) { inclusive = true }
            }
        }
    }

    val totalHeightInches = (heightFt.toIntOrNull() ?: 5) * 12 + (heightIn.toIntOrNull() ?: 6)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBg, Color(0xFF0D1B2A))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(48.dp))

            // Progress dots
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(3) { idx ->
                    Box(
                        modifier = Modifier
                            .size(if (currentStep == idx) 24.dp else 8.dp, 8.dp)
                            .background(
                                if (currentStep >= idx) NeonGreen else SurfaceLight,
                                CircleShape
                            )
                    )
                }
            }

            Spacer(Modifier.height(32.dp))

            AnimatedContent(targetState = currentStep, label = "onboarding_step") { step ->
                when (step) {
                    // ── Step 0: Body Info ─────────────────────────────────────
                    0 -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Your Body", style = MaterialTheme.typography.headlineMedium.copy(color = NeonGreen, fontWeight = FontWeight.Black))
                        Text("Help us personalise your nutrition plan", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, textAlign = TextAlign.Center))
                        Spacer(Modifier.height(32.dp))

                        OnboardingField("Age", age, "years") { age = it }
                        Spacer(Modifier.height(16.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OnboardingField("Height (ft)", heightFt, "ft", modifier = Modifier.weight(1f)) { heightFt = it }
                            OnboardingField("Height (in)", heightIn, "in", modifier = Modifier.weight(1f)) { heightIn = it }
                        }
                        Spacer(Modifier.height(16.dp))
                        OnboardingField("Weight", weight, "kg") { weight = it }
                    }

                    // ── Step 1: Goal ──────────────────────────────────────────
                    1 -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Your Goal", style = MaterialTheme.typography.headlineMedium.copy(color = NeonGreen, fontWeight = FontWeight.Black))
                        Text("What do you want to achieve?", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
                        Spacer(Modifier.height(32.dp))

                        listOf(
                            Triple("WeightLoss",  "🔥 Lose Weight",  "Burn fat, feel lighter"),
                            Triple("WeightGain",  "💪 Gain Weight",  "Build muscle & mass"),
                            Triple("Maintenance", "⚖️ Maintain",     "Stay healthy & balanced")
                        ).forEach { (value, label, subtitle) ->
                            GoalCard(
                                label      = label,
                                subtitle   = subtitle,
                                isSelected = selectedGoal == value,
                                onClick    = { selectedGoal = value }
                            )
                            Spacer(Modifier.height(12.dp))
                        }
                    }

                    // ── Step 2: Activity ──────────────────────────────────────
                    2 -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Activity Level", style = MaterialTheme.typography.headlineMedium.copy(color = NeonGreen, fontWeight = FontWeight.Black))
                        Text("How active are you on average?", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
                        Spacer(Modifier.height(32.dp))

                        listOf(
                            "Sedentary"   to "Desk job, little/no exercise",
                            "Light"       to "Light exercise 1–3 days/week",
                            "Moderate"    to "Moderate exercise 3–5 days/week",
                            "Active"      to "Hard exercise 6–7 days/week",
                            "Very Active" to "Physical job + exercise daily"
                        ).forEach { (level, desc) ->
                            ActivityCard(
                                label      = level,
                                desc       = desc,
                                isSelected = activityLevel == level,
                                onClick    = { activityLevel = level }
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }

            Spacer(Modifier.height(40.dp))

            // Navigation buttons
            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (currentStep > 0) {
                    OutlinedButton(
                        onClick  = { currentStep-- },
                        border   = BorderStroke(1.dp, SurfaceLight),
                        modifier = Modifier.weight(1f).height(54.dp),
                        shape    = RoundedCornerShape(16.dp)
                    ) {
                        Text("Back", color = TextSecondary)
                    }
                }

                GradientButton(
                    text     = when (currentStep) {
                        2    -> if (uiState.isLoading) "Saving…" else "🚀 Start Tracking"
                        else -> "Continue →"
                    },
                    onClick  = {
                        if (currentStep < 2) {
                            currentStep++
                        } else {
                            val profile = UserProfileEntity(
                                userId        = userId.ifEmpty { viewModel.uiState.value.profile?.userId ?: "" },
                                age           = age.toIntOrNull() ?: 25,
                                heightInches  = totalHeightInches.toDouble(),
                                weightKg      = weight.toDoubleOrNull() ?: 70.0,
                                goal          = selectedGoal,
                                activityLevel = activityLevel
                            )
                            viewModel.saveProfile(profile)
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled  = !uiState.isLoading
                )
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun OnboardingField(
    label: String,
    value: String,
    unit: String,
    modifier: Modifier = Modifier.fillMaxWidth(),
    onChange: (String) -> Unit
) {
    OutlinedTextField(
        value         = value,
        onValueChange = { onChange(it.filter { c -> c.isDigit() }) },
        label         = { Text(label) },
        suffix        = { Text(unit, color = TextSecondary) },
        modifier      = modifier,
        shape         = RoundedCornerShape(14.dp),
        colors        = OutlinedTextFieldDefaults.colors(
            focusedBorderColor    = NeonGreen,
            unfocusedBorderColor  = SurfaceLight,
            focusedLabelColor     = NeonGreen,
            cursorColor           = NeonGreen,
            focusedTextColor      = TextPrimary,
            unfocusedTextColor    = TextPrimary,
            unfocusedContainerColor = SurfaceDark,
            focusedContainerColor   = SurfaceDark
        )
    )
}

@Composable
private fun GoalCard(label: String, subtitle: String, isSelected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isSelected) NeonGreen.copy(alpha = 0.15f) else SurfaceDark,
                RoundedCornerShape(16.dp)
            )
            .border(
                width  = if (isSelected) 1.5.dp else 0.dp,
                color  = if (isSelected) NeonGreen else Color.Transparent,
                shape  = RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(20.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment     = Alignment.CenterVertically
    ) {
        Column {
            Text(label, style = MaterialTheme.typography.titleMedium.copy(
                color = if (isSelected) NeonGreen else TextPrimary))
            Text(subtitle, style = MaterialTheme.typography.bodySmall)
        }
        if (isSelected) Icon(Icons.Default.CheckCircle, null, tint = NeonGreen)
    }
}

@Composable
private fun ActivityCard(label: String, desc: String, isSelected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isSelected) NeonGreen.copy(alpha = 0.12f) else SurfaceDark, RoundedCornerShape(12.dp))
            .border(if (isSelected) 1.dp else 0.dp, if (isSelected) NeonGreen else Color.Transparent, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.bodyMedium.copy(color = if (isSelected) NeonGreen else TextPrimary, fontWeight = FontWeight.SemiBold))
            Text(desc, style = MaterialTheme.typography.bodySmall)
        }
        if (isSelected) Icon(Icons.Default.RadioButtonChecked, null, tint = NeonGreen, modifier = Modifier.size(20.dp))
        else Icon(Icons.Default.RadioButtonUnchecked, null, tint = TextMuted, modifier = Modifier.size(20.dp))
    }
}
