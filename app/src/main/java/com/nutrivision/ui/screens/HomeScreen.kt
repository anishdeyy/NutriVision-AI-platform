package com.nutrivision.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.nutrivision.data.FoodLogEntity
import com.nutrivision.data.Screen
import com.nutrivision.ui.components.*
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.HomeViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val nutrition = uiState.dailyNutrition

    Scaffold(
        containerColor = DarkBg,
        floatingActionButton = {
            FloatingActionButton(
                onClick            = { navController.navigate(Screen.Camera.route) },
                containerColor     = NeonGreen,
                contentColor       = DarkBg,
                shape              = RoundedCornerShape(18.dp)
            ) {
                Icon(Icons.Default.CameraAlt, "Scan Food", modifier = Modifier.size(26.dp))
            }
        }
    ) { paddingValues ->

        LazyColumn(
            modifier              = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding        = PaddingValues(16.dp),
            verticalArrangement   = Arrangement.spacedBy(16.dp)
        ) {

            // ── Header ────────────────────────────────────────────────────────
            item {
                Row(
                    modifier              = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment     = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            greeting(),
                            style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary)
                        )
                        Text(
                            uiState.profile?.name?.ifEmpty { "Nutri Champ" } ?: "Nutri Champ",
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black)
                        )
                    }
                    IconButton(onClick = { navController.navigate(Screen.Profile.route) }) {
                        Icon(Icons.Default.AccountCircle, null, tint = NeonGreen, modifier = Modifier.size(32.dp))
                    }
                }
            }

            // ── Week Strip ────────────────────────────────────────────────────
            item {
                WeekStrip(
                    selectedDate   = uiState.selectedDate,
                    onDateSelected = viewModel::selectDate
                )
            }

            // ── Calories Card ─────────────────────────────────────────────────
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Daily Calories",
                        style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary)
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier              = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment     = Alignment.CenterVertically
                    ) {
                        CircularCalorieProgress(
                            consumed = nutrition.totalCalories,
                            goal     = nutrition.calorieGoal
                        )
                        Column(
                            modifier            = Modifier.weight(1f).padding(start = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CalorieStatRow("Goal",     "${nutrition.calorieGoal}", ElectricBlue)
                            CalorieStatRow("Consumed", "${nutrition.totalCalories.toInt()}", NeonGreen)
                            CalorieStatRow(
                                label = "Remaining",
                                value = "${nutrition.caloriesRemaining.toInt()}",
                                color = if (nutrition.caloriesRemaining >= 0) TealAccent else VibrantOrange
                            )
                        }
                    }
                }
            }

            // ── Macros ────────────────────────────────────────────────────────
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Macronutrients",
                        style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary)
                    )
                    Spacer(Modifier.height(16.dp))
                    MacroBar("Protein", nutrition.totalProtein, nutrition.proteinGoal, PurpleAccent)
                    Spacer(Modifier.height(12.dp))
                    MacroBar("Carbs",   nutrition.totalCarbs,   nutrition.carbsGoal,   TealAccent)
                    Spacer(Modifier.height(12.dp))
                    MacroBar("Fats",    nutrition.totalFat,     nutrition.fatGoal,     AmberAccent)
                    Spacer(Modifier.height(12.dp))
                    // Effective protein
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceMed, RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("⚡ Effective Protein", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "${nutrition.totalEffectiveProtein.toInt()}g",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color      = NeonGreen,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }
            }

            // ── Meals ─────────────────────────────────────────────────────────
            item {
                Text(
                    "Today's Meals",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
            }

            listOf(
                "Breakfast" to uiState.breakfastLogs,
                "Lunch"     to uiState.lunchLogs,
                "Dinner"    to uiState.dinnerLogs,
                "Snacks"    to uiState.snackLogs
            ).forEach { (meal, logs) ->
                item {
                    MealCard(
                        mealType  = meal,
                        logs      = logs,
                        onAddClick = {
                            navController.navigate(Screen.Manual.route + "?mealType=$meal")
                        },
                        onDeleteLog = viewModel::deleteFoodLog
                    )
                }
            }

            // ── Recommendations ───────────────────────────────────────────────
            if (uiState.recommendations.isNotEmpty()) {
                item {
                    Text(
                        "💡 Today's Tips",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                }
                item {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        uiState.recommendations.forEach { rec ->
                            RecommendationCard(text = rec)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }

            // Bottom spacing
            item { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
private fun CalorieStatRow(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Row(
        modifier              = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall)
        Text(
            "$value cal",
            style = MaterialTheme.typography.bodySmall.copy(color = color, fontWeight = FontWeight.SemiBold)
        )
    }
}

private fun greeting(): String {
    return when (LocalDate.now().let { java.time.LocalTime.now().hour }) {
        in 5..11  -> "Good Morning ☀️"
        in 12..16 -> "Good Afternoon 🌤️"
        in 17..20 -> "Good Evening 🌙"
        else      -> "Good Night 🌃"
    }
}
