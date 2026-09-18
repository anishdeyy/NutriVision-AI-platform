package com.nutrivision.repository

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.nutrivision.data.*
import com.nutrivision.data.local.dao.DailySummaryTuple
import com.nutrivision.data.local.dao.FoodLogDao
import com.nutrivision.data.local.dao.UserProfileDao
import com.nutrivision.data.remote.FirebaseRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NutriRepository @Inject constructor(
    private val foodLogDao: FoodLogDao,
    private val userProfileDao: UserProfileDao,
    private val firebaseRepo: FirebaseRepository,
    @ApplicationContext private val context: Context
) {
    // ─── Network check ────────────────────────────────────────────────────

    private fun isOnline(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    // ─── Auth passthrough ─────────────────────────────────────────────────

    val currentUserId get() = firebaseRepo.currentUserId ?: ""
    val isLoggedIn    get() = firebaseRepo.isLoggedIn

    suspend fun signUp(email: String, password: String) = firebaseRepo.signUp(email, password)
    suspend fun signIn(email: String, password: String) = firebaseRepo.signIn(email, password)
    fun signOut() = firebaseRepo.signOut()

    // ─── User Profile ─────────────────────────────────────────────────────

    fun getProfileFlow(userId: String) = userProfileDao.getProfile(userId)

    suspend fun saveProfile(profile: UserProfileEntity) {
        userProfileDao.saveProfile(profile)
        if (isOnline()) {
            firebaseRepo.saveUserProfile(profile) // best-effort
        }
    }

    // ─── Food Logging ─────────────────────────────────────────────────────

    /**
     * Add a food log entry.
     * Saves to Room immediately (offline-first), syncs to Firebase if online.
     */
    suspend fun addFoodLog(log: FoodLogEntity) = withContext(Dispatchers.IO) {
        foodLogDao.insertFoodLog(log)
        if (isOnline()) {
            try {
                firebaseRepo.syncFoodLogs(listOf(log))
                foodLogDao.markSynced(log.id)
            } catch (_: Exception) { /* will sync later via WorkManager */ }
        }
    }

    suspend fun deleteFoodLog(log: FoodLogEntity) = withContext(Dispatchers.IO) {
        foodLogDao.deleteFoodLog(log)
    }

    // ─── Daily Nutrition ──────────────────────────────────────────────────

    /** Reactive stream of today's logs grouped by meal */
    fun getLogsForDate(date: String): Flow<List<FoodLogEntity>> =
        foodLogDao.getLogsForDate(date, currentUserId)

    /** Compute DailyNutrition from logs + user goals */
    fun getDailyNutrition(
        date: String,
        profile: UserProfileEntity?
    ): Flow<DailyNutrition> =
        getLogsForDate(date).map { logs ->
            DailyNutrition(
                date                 = date,
                totalCalories        = logs.sumOf { it.calories },
                totalProtein         = logs.sumOf { it.protein },
                totalFat             = logs.sumOf { it.fat },
                totalCarbs           = logs.sumOf { it.carbs },
                totalEffectiveProtein= logs.sumOf { it.effectiveProtein },
                calorieGoal          = profile?.dailyCalorieGoal ?: 2000,
                proteinGoal          = profile?.dailyProteinGoal ?: 100,
                fatGoal              = profile?.dailyFatGoal ?: 65,
                carbsGoal            = profile?.dailyCarbsGoal ?: 250
            )
        }

    /** Meal-wise grouped logs */
    fun getMealLogs(date: String, mealType: String): Flow<List<FoodLogEntity>> =
        foodLogDao.getLogsByMealType(date, currentUserId, mealType)

    // ─── History ──────────────────────────────────────────────────────────

    suspend fun getHistorySummaries(days: Int = 30): List<DailySummaryTuple> {
        val fromDate = LocalDate.now().minusDays(days.toLong()).toString()
        return foodLogDao.getDailySummaries(currentUserId, fromDate)
    }

    // ─── Offline Sync ─────────────────────────────────────────────────────

    /**
     * Called by WorkManager when network becomes available.
     * Uploads all unsynced local logs to Firebase.
     */
    suspend fun syncPendingLogs() = withContext(Dispatchers.IO) {
        if (!isOnline()) return@withContext
        val unsynced = foodLogDao.getUnsyncedLogs(currentUserId)
        if (unsynced.isEmpty()) return@withContext
        val result = firebaseRepo.syncFoodLogs(unsynced)
        if (result.isSuccess) {
            unsynced.forEach { foodLogDao.markSynced(it.id) }
        }
    }

    // ─── Food Dataset (Local JSON) ────────────────────────────────────────

    /** Search offline food database from assets */
    fun searchFoodDataset(query: String, allFoods: List<FoodItem>): List<FoodItem> {
        if (query.isBlank()) return emptyList()
        val lower = query.lowercase()
        return allFoods.filter { it.foodName.lowercase().contains(lower) }
            .sortedByDescending { it.foodName.lowercase().startsWith(lower) }
            .take(20)
    }

    // ─── Recommendations ─────────────────────────────────────────────────

    fun generateRecommendations(nutrition: DailyNutrition, goal: String): List<String> {
        val recs = mutableListOf<String>()
        val proteinGap = nutrition.proteinGoal - nutrition.totalProtein
        val calGap     = nutrition.caloriesRemaining

        when (goal) {
            "WeightLoss" -> {
                if (calGap < 0)    recs.add("⚠️ You've exceeded your calorie goal. Skip evening snacks.")
                if (proteinGap > 20) recs.add("🍗 Add high-protein foods like eggs, chicken, or dal to stay full longer.")
                if (nutrition.totalFat > nutrition.fatGoal) recs.add("🥗 Reduce fried foods & ghee to cut excess fat.")
                if (nutrition.carbsProgress > 0.9f) recs.add("🌾 Switch to brown rice or jowar roti to lower carb intake.")
            }
            "WeightGain" -> {
                if (calGap > 500)  recs.add("🍚 Eat more! Add a bowl of rice or roti with each meal.")
                if (proteinGap > 30) recs.add("💪 Include protein-rich foods like paneer, eggs, or chicken breast.")
                recs.add("🥜 Add healthy calorie-dense snacks like peanuts, chikki, or banana milkshake.")
            }
            else -> { // Maintenance
                if (calGap < -100) recs.add("⚖️ You're slightly over your goal. Balance it with a lighter dinner.")
                if (proteinGap > 20) recs.add("🎯 Great work! Just top up protein with a glass of milk or curd.")
            }
        }

        if (nutrition.totalEffectiveProtein < nutrition.totalProtein * 0.6) {
            recs.add("🥚 Your protein sources have low bioavailability. Switch to eggs, fish, or paneer for better absorption.")
        }

        if (recs.isEmpty()) {
            recs.add("✅ You're on track today! Keep it up!")
        }

        return recs
    }
}
