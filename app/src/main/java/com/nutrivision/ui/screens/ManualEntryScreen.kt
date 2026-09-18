package com.nutrivision.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.data.FoodItem
import com.nutrivision.ui.components.*
import com.nutrivision.ui.theme.*
import com.nutrivision.utils.FoodDatasetLoader
import com.nutrivision.viewmodel.FoodEntryViewModel
import androidx.compose.ui.platform.LocalContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManualEntryScreen(
    navController: NavController,
    mealType: String = "Lunch",
    viewModel: FoodEntryViewModel = hiltViewModel()
) {
    val context  = LocalContext.current
    val uiState  by viewModel.uiState.collectAsState()

    var selectedMeal     by remember { mutableStateOf(mealType) }
    var searchText       by remember { mutableStateOf("") }
    var aiInputText      by remember { mutableStateOf("") }
    var selectedFood: FoodItem? by remember { mutableStateOf(null) }
    var quantity         by remember { mutableStateOf("100") }
    var activeTab        by remember { mutableStateOf(0) }   // 0=search, 1=ai-text

    // Load dataset once
    LaunchedEffect(Unit) {
        val foods = FoodDatasetLoader.loadFoods(context)
        viewModel.setFoods(foods)
        viewModel.setMealType(selectedMeal)
    }

    LaunchedEffect(uiState.savedMessage) {
        if (uiState.savedMessage != null) {
            kotlinx.coroutines.delay(1200)
            viewModel.clearSavedMessage()
            navController.popBackStack()
        }
    }

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = { Text("Add Food", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null, tint = TextPrimary)
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
                .padding(horizontal = 16.dp)
        ) {
            // ── Meal Type Selector ────────────────────────────────────────────
            val meals = listOf("Breakfast", "Lunch", "Dinner", "Snacks")
            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                meals.forEach { meal ->
                    FilterChip(
                        selected = selectedMeal == meal,
                        onClick  = {
                            selectedMeal = meal
                            viewModel.setMealType(meal)
                        },
                        label    = { Text(meal, style = MaterialTheme.typography.bodySmall) },
                        colors   = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NeonGreen,
                            selectedLabelColor     = DarkBg
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Tab selector ──────────────────────────────────────────────────
            TabRow(
                selectedTabIndex = activeTab,
                containerColor   = SurfaceDark,
                contentColor     = NeonGreen
            ) {
                Tab(selected = activeTab == 0, onClick = { activeTab = 0 },
                    text = { Text("🔍 Search Database") })
                Tab(selected = activeTab == 1, onClick = { activeTab = 1 },
                    text = { Text("✨ AI Parse") })
            }

            Spacer(Modifier.height(16.dp))

            when (activeTab) {
                // ── Search Tab ────────────────────────────────────────────────
                0 -> {
                    // Search bar
                    OutlinedTextField(
                        value         = searchText,
                        onValueChange = {
                            searchText = it
                            viewModel.searchFood(it)
                        },
                        placeholder   = { Text("Search: roti, dal, paneer…", color = TextMuted) },
                        leadingIcon   = { Icon(Icons.Default.Search, null, tint = NeonGreen) },
                        trailingIcon  = if (searchText.isNotEmpty()) {{
                            IconButton(onClick = { searchText = ""; viewModel.searchFood("") }) {
                                Icon(Icons.Default.Clear, null, tint = TextMuted)
                            }
                        }} else null,
                        modifier      = Modifier.fillMaxWidth(),
                        shape         = RoundedCornerShape(14.dp),
                        colors        = searchFieldColors()
                    )

                    Spacer(Modifier.height(12.dp))

                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        // Selected food quantity editor
                        selectedFood?.let { food ->
                            item {
                                GlassCard(modifier = Modifier.fillMaxWidth()) {
                                    Text("📋 ${food.foodName}", style = MaterialTheme.typography.titleMedium.copy(color = NeonGreen))
                                    Spacer(Modifier.height(8.dp))
                                    NutritionPreview(food, quantity.toDoubleOrNull() ?: 100.0)
                                    Spacer(Modifier.height(12.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        OutlinedTextField(
                                            value         = quantity,
                                            onValueChange = { quantity = it.filter { c -> c.isDigit() || c == '.' } },
                                            label         = { Text("Quantity (g)") },
                                            modifier      = Modifier.weight(1f),
                                            shape         = RoundedCornerShape(12.dp),
                                            colors        = searchFieldColors()
                                        )
                                        GradientButton(
                                            text     = "Add",
                                            onClick  = {
                                                viewModel.saveFoodItem(food, quantity.toDoubleOrNull() ?: 100.0, selectedMeal)
                                            },
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                }
                            }
                        }

                        // Search results
                        items(uiState.searchResults) { food ->
                            FoodSearchResultItem(
                                food      = food,
                                isSelected = selectedFood?.foodName == food.foodName,
                                onClick   = {
                                    selectedFood = food
                                    quantity = "100"
                                }
                            )
                        }

                        if (uiState.searchResults.isEmpty() && searchText.isNotBlank()) {
                            item {
                                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                    Text("No results for \"$searchText\"", style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted))
                                }
                            }
                        }
                    }
                }

                // ── AI Text Tab ───────────────────────────────────────────────
                1 -> {
                    OutlinedTextField(
                        value         = aiInputText,
                        onValueChange = { aiInputText = it },
                        placeholder   = { Text("e.g. 2 roti + 1 bowl dal makhani + salad", color = TextMuted) },
                        leadingIcon   = { Icon(Icons.Default.AutoAwesome, null, tint = NeonGreen) },
                        modifier      = Modifier.fillMaxWidth().height(120.dp),
                        shape         = RoundedCornerShape(14.dp),
                        colors        = searchFieldColors(),
                        maxLines      = 4
                    )

                    Spacer(Modifier.height(12.dp))

                    GradientButton(
                        text     = if (uiState.isAnalyzing) "Analyzing…" else "🤖 Parse with AI",
                        onClick  = { viewModel.parseTextEntry(aiInputText) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled  = aiInputText.isNotBlank() && !uiState.isAnalyzing
                    )

                    if (uiState.isAnalyzing) {
                        Spacer(Modifier.height(16.dp))
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth(),
                            color    = NeonGreen,
                            trackColor = SurfaceLight
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    // AI detected foods
                    if (uiState.detectedFoods.isNotEmpty()) {
                        Text("✅ Detected Items", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(uiState.detectedFoods) { food ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(SurfaceDark, RoundedCornerShape(14.dp))
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(food.foodName, style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary, fontWeight = FontWeight.SemiBold))
                                        Text("${food.estimatedQuantityG.toInt()}g  •  ${food.calories.toInt()} cal  •  P ${food.protein.toInt()}g  C ${food.carbs.toInt()}g  F ${food.fat.toInt()}g",
                                            style = MaterialTheme.typography.bodySmall)
                                    }
                                    IconButton(
                                        onClick  = { viewModel.saveAiFood(food, selectedMeal) },
                                        modifier = Modifier.size(36.dp).background(NeonGreen, CircleShape)
                                    ) {
                                        Icon(Icons.Default.Add, null, tint = DarkBg, modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }
                    }

                    uiState.error?.let { err ->
                        Spacer(Modifier.height(8.dp))
                        Text(err, style = MaterialTheme.typography.bodySmall.copy(color = MaterialTheme.colorScheme.error))
                    }
                }
            }

            // Success message
            uiState.savedMessage?.let {
                Spacer(Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(NeonGreen, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(it, style = MaterialTheme.typography.bodyMedium.copy(color = DarkBg, fontWeight = FontWeight.Bold))
                }
            }
        }
    }
}

@Composable
private fun FoodSearchResultItem(
    food: FoodItem,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isSelected) NeonGreen.copy(alpha = 0.15f) else SurfaceDark,
                RoundedCornerShape(12.dp)
            )
            .border(
                width  = if (isSelected) 1.dp else 0.dp,
                color  = if (isSelected) NeonGreen else androidx.compose.ui.graphics.Color.Transparent,
                shape  = RoundedCornerShape(12.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(food.foodName, style = MaterialTheme.typography.bodyMedium.copy(
                color = if (isSelected) NeonGreen else TextPrimary,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
            ))
            Text("Per 100g  •  ${food.calories.toInt()} cal  •  P ${food.protein.toInt()}g",
                style = MaterialTheme.typography.bodySmall)
        }
        if (isSelected) {
            Icon(Icons.Default.CheckCircle, null, tint = NeonGreen, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun NutritionPreview(food: FoodItem, quantityG: Double) {
    val scale = quantityG / 100.0
    Row(
        modifier              = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        listOf(
            "Cal"     to "${(food.calories * scale).toInt()}",
            "Protein" to "${(food.protein * scale).toInt()}g",
            "Carbs"   to "${(food.carbs * scale).toInt()}g",
            "Fat"     to "${(food.fat * scale).toInt()}g"
        ).forEach { (label, value) ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(value, style = MaterialTheme.typography.titleMedium.copy(color = NeonGreen, fontWeight = FontWeight.Bold))
                Text(label, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun searchFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor    = NeonGreen,
    unfocusedBorderColor  = SurfaceLight,
    focusedLabelColor     = NeonGreen,
    cursorColor           = NeonGreen,
    focusedTextColor      = TextPrimary,
    unfocusedTextColor    = TextPrimary,
    unfocusedContainerColor = SurfaceDark,
    focusedContainerColor   = SurfaceDark
)
