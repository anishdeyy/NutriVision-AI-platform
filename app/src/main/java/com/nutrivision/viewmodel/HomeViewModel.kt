package com.nutrivision.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nutrivision.data.*
import com.nutrivision.repository.NutriRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = true,
    val dailyNutrition: DailyNutrition = DailyNutrition(LocalDate.now().toString()),
    val profile: UserProfileEntity? = null,
    val breakfastLogs: List<FoodLogEntity> = emptyList(),
    val lunchLogs: List<FoodLogEntity> = emptyList(),
    val dinnerLogs: List<FoodLogEntity> = emptyList(),
    val snackLogs: List<FoodLogEntity> = emptyList(),
    val recommendations: List<String> = emptyList(),
    val selectedDate: String = LocalDate.now().toString(),
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repo: NutriRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val today: String get() = LocalDate.now().toString()

    init {
        loadData()
    }

    private fun loadData() {
        val userId = repo.currentUserId

        // Observe user profile
        viewModelScope.launch {
            repo.getProfileFlow(userId).collect { profile ->
                _uiState.update { it.copy(profile = profile) }
                loadNutritionForDate(_uiState.value.selectedDate, profile)
            }
        }
    }

    private fun loadNutritionForDate(date: String, profile: UserProfileEntity?) {
        viewModelScope.launch {
            // Daily total nutrition
            repo.getDailyNutrition(date, profile).collect { nutrition ->
                val recs = repo.generateRecommendations(nutrition, profile?.goal ?: "Maintenance")
                _uiState.update {
                    it.copy(
                        isLoading        = false,
                        dailyNutrition   = nutrition,
                        recommendations  = recs
                    )
                }
            }
        }

        // Meal-specific logs
        viewModelScope.launch {
            repo.getMealLogs(date, "Breakfast").collect { logs ->
                _uiState.update { it.copy(breakfastLogs = logs) }
            }
        }
        viewModelScope.launch {
            repo.getMealLogs(date, "Lunch").collect { logs ->
                _uiState.update { it.copy(lunchLogs = logs) }
            }
        }
        viewModelScope.launch {
            repo.getMealLogs(date, "Dinner").collect { logs ->
                _uiState.update { it.copy(dinnerLogs = logs) }
            }
        }
        viewModelScope.launch {
            repo.getMealLogs(date, "Snacks").collect { logs ->
                _uiState.update { it.copy(snackLogs = logs) }
            }
        }
    }

    fun selectDate(date: String) {
        _uiState.update { it.copy(selectedDate = date) }
        loadNutritionForDate(date, _uiState.value.profile)
    }

    fun deleteFoodLog(log: FoodLogEntity) {
        viewModelScope.launch {
            repo.deleteFoodLog(log)
        }
    }
}
