package com.nutrivision.viewmodel

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nutrivision.api.GeminiApiService
import com.nutrivision.data.*
import com.nutrivision.repository.NutriRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

// ─── Auth ─────────────────────────────────────────────────────────────────

data class AuthUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val error: String? = null,
    val userId: String = ""
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val repo: NutriRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState(isLoggedIn = repo.isLoggedIn))
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun signUp(email: String, password: String, name: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = repo.signUp(email, password)
            result.fold(
                onSuccess = { uid ->
                    // Save initial profile
                    val profile = UserProfileEntity(
                        userId = uid,
                        name   = name,
                        email  = email
                    )
                    repo.saveProfile(profile)
                    _uiState.update { it.copy(isLoading = false, isLoggedIn = true, userId = uid) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = repo.signIn(email, password)
            result.fold(
                onSuccess = { uid ->
                    _uiState.update { it.copy(isLoading = false, isLoggedIn = true, userId = uid) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    fun signOut() {
        repo.signOut()
        _uiState.update { AuthUiState(isLoggedIn = false) }
    }
}

// ─── Food Entry (AI + Manual) ────────────────────────────────────────────────

data class FoodEntryUiState(
    val isAnalyzing: Boolean = false,
    val detectedFoods: List<AiFoodResult> = emptyList(),
    val searchResults: List<FoodItem> = emptyList(),
    val searchQuery: String = "",
    val selectedMealType: String = "Lunch",
    val savedMessage: String? = null,
    val error: String? = null
)

@HiltViewModel
class FoodEntryViewModel @Inject constructor(
    private val repo: NutriRepository,
    private val gemini: GeminiApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(FoodEntryUiState())
    val uiState: StateFlow<FoodEntryUiState> = _uiState.asStateFlow()

    // All foods loaded from local JSON dataset
    private var allFoods: List<FoodItem> = emptyList()

    fun setFoods(foods: List<FoodItem>) { allFoods = foods }

    /** Analyze image via Gemini */
    fun analyzeImage(bitmap: Bitmap) {
        viewModelScope.launch {
            _uiState.update { it.copy(isAnalyzing = true, error = null, detectedFoods = emptyList()) }
            val result = gemini.detectFoodFromImage(bitmap)
            result.fold(
                onSuccess = { foods ->
                    _uiState.update { it.copy(isAnalyzing = false, detectedFoods = foods) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isAnalyzing = false, error = "AI analysis failed: ${e.message}") }
                }
            )
        }
    }

    /** Parse text entry via Gemini */
    fun parseTextEntry(text: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isAnalyzing = true, error = null) }
            val result = gemini.parseTextEntry(text)
            result.fold(
                onSuccess = { foods ->
                    _uiState.update { it.copy(isAnalyzing = false, detectedFoods = foods) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(isAnalyzing = false, error = "Parsing failed: ${e.message}") }
                }
            )
        }
    }

    /** Search local food dataset */
    fun searchFood(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        val results = repo.searchFoodDataset(query, allFoods)
        _uiState.update { it.copy(searchResults = results) }
    }

    fun setMealType(mealType: String) {
        _uiState.update { it.copy(selectedMealType = mealType) }
    }

    /** Save a detected/selected AI food to log */
    fun saveAiFood(food: AiFoodResult, mealType: String) {
        viewModelScope.launch {
            val bioScore = BioavailabilityHelper.score(food.foodName)
            val log = FoodLogEntity(
                userId          = repo.currentUserId,
                foodName        = food.foodName,
                quantity        = food.estimatedQuantityG,
                calories        = food.calories,
                protein         = food.protein,
                fat             = food.fat,
                carbs           = food.carbs,
                effectiveProtein= food.protein * bioScore,
                mealType        = mealType,
                date            = LocalDate.now().toString()
            )
            repo.addFoodLog(log)
            _uiState.update { it.copy(savedMessage = "${food.foodName} added to $mealType!") }
        }
    }

    /** Save a food from dataset search */
    fun saveFoodItem(item: FoodItem, quantityG: Double, mealType: String) {
        viewModelScope.launch {
            val scale = quantityG / 100.0
            val log = FoodLogEntity(
                userId          = repo.currentUserId,
                foodName        = item.foodName,
                quantity        = quantityG,
                calories        = item.calories * scale,
                protein         = item.protein * scale,
                fat             = item.fat * scale,
                carbs           = item.carbs * scale,
                effectiveProtein= item.protein * scale * item.bioavailabilityScore,
                mealType        = mealType,
                date            = LocalDate.now().toString()
            )
            repo.addFoodLog(log)
            _uiState.update { it.copy(savedMessage = "${item.foodName} (${quantityG.toInt()}g) added!") }
        }
    }

    fun clearError() = _uiState.update { it.copy(error = null) }
    fun clearSavedMessage() = _uiState.update { it.copy(savedMessage = null) }
}

// ─── Profile / Goals ─────────────────────────────────────────────────────────

data class ProfileUiState(
    val isLoading: Boolean = false,
    val profile: UserProfileEntity? = null,
    val savedSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repo: NutriRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repo.getProfileFlow(repo.currentUserId).collect { profile ->
                _uiState.update { it.copy(profile = profile) }
            }
        }
    }

    fun saveProfile(profile: UserProfileEntity) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // Calculate goals based on new profile data
            val goals = UserProfileEntity.calculateGoals(
                age          = profile.age,
                heightIn     = profile.heightInches,
                weightKg     = profile.weightKg,
                goal         = profile.goal,
                activityLevel= profile.activityLevel
            )
            val updated = profile.copy(
                dailyCalorieGoal = goals.dailyCalorieGoal,
                dailyProteinGoal = goals.dailyProteinGoal,
                dailyFatGoal     = goals.dailyFatGoal,
                dailyCarbsGoal   = goals.dailyCarbsGoal
            )
            repo.saveProfile(updated)
            _uiState.update { it.copy(isLoading = false, savedSuccess = true, profile = updated) }
        }
    }
}

// ─── History ─────────────────────────────────────────────────────────────────

data class HistoryPoint(val date: String, val calories: Double, val protein: Double)

data class HistoryUiState(
    val isLoading: Boolean = true,
    val history: List<HistoryPoint> = emptyList()
)

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val repo: NutriRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val summaries = repo.getHistorySummaries(30)
            val points = summaries.map { HistoryPoint(it.date, it.totalCalories, it.totalProtein) }
            _uiState.update { it.copy(isLoading = false, history = points) }
        }
    }
}
