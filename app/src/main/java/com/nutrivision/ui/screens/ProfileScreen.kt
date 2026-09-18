package com.nutrivision.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.data.Screen
import com.nutrivision.data.UserProfileEntity
import com.nutrivision.ui.components.GlassCard
import com.nutrivision.ui.components.GradientButton
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.AuthViewModel
import com.nutrivision.viewmodel.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    navController: NavController,
    authViewModel: AuthViewModel = hiltViewModel(),
    profileViewModel: ProfileViewModel = hiltViewModel()
) {
    val profileState by profileViewModel.uiState.collectAsState()
    val profile = profileState.profile

    var weight by remember(profile) { mutableStateOf(profile?.weightKg?.toString() ?: "70") }
    var showGoalDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = { Text("My Profile", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null, tint = TextPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.History.route) }) {
                        Icon(Icons.Default.BarChart, null, tint = NeonGreen)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { pv ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(pv)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── Avatar + Name ─────────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(
                        Brush.radialGradient(listOf(NeonGreen.copy(alpha = 0.15f), DarkBg)),
                        RoundedCornerShape(20.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(NeonGreen.copy(alpha = 0.2f), CircleShape)
                            .border(2.dp, NeonGreen, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            profile?.name?.firstOrNull()?.uppercase() ?: "N",
                            style = MaterialTheme.typography.headlineLarge.copy(color = NeonGreen, fontWeight = FontWeight.Black)
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(profile?.name ?: "User", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Text(profile?.email ?: "", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
                }
            }

            // ── Daily Goals ────────────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("🎯 Daily Goals", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    GoalStatItem("Calories",  "${profile?.dailyCalorieGoal ?: 2000}", VibrantOrange)
                    GoalStatItem("Protein",   "${profile?.dailyProteinGoal ?: 100}g", PurpleAccent)
                    GoalStatItem("Carbs",     "${profile?.dailyCarbsGoal ?: 250}g",   TealAccent)
                    GoalStatItem("Fats",      "${profile?.dailyFatGoal ?: 65}g",      AmberAccent)
                }
            }

            // ── Body Stats ─────────────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("📏 Body Stats", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(16.dp))
                ProfileStatRow("Age",            "${profile?.age ?: 25} years")
                Divider(color = SurfaceLight, modifier = Modifier.padding(vertical = 8.dp))
                ProfileStatRow("Height",         "${profile?.heightInches?.toInt() ?: 65} inches")
                Divider(color = SurfaceLight, modifier = Modifier.padding(vertical = 8.dp))
                ProfileStatRow("Goal",           when(profile?.goal) {
                    "WeightLoss" -> "🔥 Lose Weight"
                    "WeightGain" -> "💪 Gain Weight"
                    else         -> "⚖️ Maintenance"
                })
                Divider(color = SurfaceLight, modifier = Modifier.padding(vertical = 8.dp))
                ProfileStatRow("Activity Level", profile?.activityLevel ?: "Moderate")
            }

            // ── Update Weight ─────────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("⚖️ Update Weight", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value         = weight,
                        onValueChange = { weight = it.filter { c -> c.isDigit() || c == '.' } },
                        label         = { Text("Weight") },
                        suffix        = { Text("kg", color = TextSecondary) },
                        modifier      = Modifier.weight(1f),
                        shape         = RoundedCornerShape(12.dp),
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
                    GradientButton(
                        text     = "Save",
                        onClick  = {
                            profile?.let { p ->
                                profileViewModel.saveProfile(p.copy(weightKg = weight.toDoubleOrNull() ?: p.weightKg))
                            }
                        },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // ── Sign Out ──────────────────────────────────────────────────────
            OutlinedButton(
                onClick  = {
                    authViewModel.signOut()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                border   = BorderStroke(1.dp, MaterialTheme.colorScheme.error),
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape    = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Logout, null, tint = MaterialTheme.colorScheme.error)
                Spacer(Modifier.width(8.dp))
                Text("Sign Out", color = MaterialTheme.colorScheme.error)
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun GoalStatItem(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleMedium.copy(color = color, fontWeight = FontWeight.Black))
        Text(label, style = MaterialTheme.typography.bodySmall.copy(color = TextMuted))
    }
}

@Composable
private fun ProfileStatRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary))
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary, fontWeight = FontWeight.SemiBold))
    }
}
