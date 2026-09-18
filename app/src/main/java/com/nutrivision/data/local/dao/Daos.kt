package com.nutrivision.data.local.dao

import androidx.room.*
import com.nutrivision.data.FoodLogEntity
import com.nutrivision.data.UserProfileEntity
import kotlinx.coroutines.flow.Flow

// ─── Food Log DAO ────────────────────────────────────────────────────────────

@Dao
interface FoodLogDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFoodLog(log: FoodLogEntity)

    @Delete
    suspend fun deleteFoodLog(log: FoodLogEntity)

    @Update
    suspend fun updateFoodLog(log: FoodLogEntity)

    /** Stream all logs for a specific date (reactive UI) */
    @Query("SELECT * FROM food_logs WHERE date = :date AND userId = :userId ORDER BY timestamp ASC")
    fun getLogsForDate(date: String, userId: String): Flow<List<FoodLogEntity>>

    /** Get logs by meal type for a given date */
    @Query("SELECT * FROM food_logs WHERE date = :date AND userId = :userId AND mealType = :mealType ORDER BY timestamp ASC")
    fun getLogsByMealType(date: String, userId: String, mealType: String): Flow<List<FoodLogEntity>>

    /** Get all unsynced logs (for Firebase upload) */
    @Query("SELECT * FROM food_logs WHERE isSynced = 0 AND userId = :userId")
    suspend fun getUnsyncedLogs(userId: String): List<FoodLogEntity>

    /** Mark log as synced after Firebase upload */
    @Query("UPDATE food_logs SET isSynced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)

    /** History: distinct dates with logs */
    @Query("SELECT DISTINCT date FROM food_logs WHERE userId = :userId ORDER BY date DESC LIMIT 30")
    suspend fun getLogDates(userId: String): List<String>

    /** Daily totals for history graph */
    @Query("""
        SELECT date,
               SUM(calories) as totalCalories,
               SUM(protein) as totalProtein,
               SUM(fat) as totalFat,
               SUM(carbs) as totalCarbs
        FROM food_logs 
        WHERE userId = :userId AND date >= :fromDate
        GROUP BY date
        ORDER BY date ASC
    """)
    suspend fun getDailySummaries(userId: String, fromDate: String): List<DailySummaryTuple>

    @Query("DELETE FROM food_logs WHERE date = :date AND userId = :userId")
    suspend fun deleteAllLogsForDate(date: String, userId: String)
}

/** Lightweight tuple for aggregated daily data */
data class DailySummaryTuple(
    val date: String,
    val totalCalories: Double,
    val totalProtein: Double,
    val totalFat: Double,
    val totalCarbs: Double
)

// ─── User Profile DAO ────────────────────────────────────────────────────────

@Dao
interface UserProfileDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveProfile(profile: UserProfileEntity)

    @Query("SELECT * FROM user_profile WHERE userId = :userId LIMIT 1")
    fun getProfile(userId: String): Flow<UserProfileEntity?>

    @Query("SELECT * FROM user_profile WHERE userId = :userId LIMIT 1")
    suspend fun getProfileOnce(userId: String): UserProfileEntity?

    @Update
    suspend fun updateProfile(profile: UserProfileEntity)
}
