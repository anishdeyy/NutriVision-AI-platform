package com.nutrivision.data.remote

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.nutrivision.data.FoodLogEntity
import com.nutrivision.data.UserProfileEntity
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Firebase Firestore repository.
 * Uses FREE Spark plan – no cost for typical usage.
 * Firestore free limits: 50K reads/day, 20K writes/day, 1GB storage.
 */
@Singleton
class FirebaseRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth
) {
    private val db = firestore

    // ─── Auth ──────────────────────────────────────────────────────────────

    val currentUserId: String?
        get() = auth.currentUser?.uid

    val isLoggedIn: Boolean
        get() = auth.currentUser != null

    suspend fun signUp(email: String, password: String): Result<String> = try {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        Result.success(result.user?.uid ?: "")
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun signIn(email: String, password: String): Result<String> = try {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        Result.success(result.user?.uid ?: "")
    } catch (e: Exception) {
        Result.failure(e)
    }

    fun signOut() = auth.signOut()

    // ─── User Profile ──────────────────────────────────────────────────────

    suspend fun saveUserProfile(profile: UserProfileEntity): Result<Unit> = try {
        val data = mapOf(
            "name"             to profile.name,
            "email"            to profile.email,
            "age"              to profile.age,
            "heightInches"     to profile.heightInches,
            "weightKg"         to profile.weightKg,
            "goal"             to profile.goal,
            "activityLevel"    to profile.activityLevel,
            "dailyCalorieGoal" to profile.dailyCalorieGoal,
            "dailyProteinGoal" to profile.dailyProteinGoal,
            "dailyFatGoal"     to profile.dailyFatGoal,
            "dailyCarbsGoal"   to profile.dailyCarbsGoal,
            "updatedAt"        to com.google.firebase.Timestamp.now()
        )
        db.collection("users").document(profile.userId).set(data).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun fetchUserProfile(userId: String): Result<UserProfileEntity> = try {
        val doc = db.collection("users").document(userId).get().await()
        if (doc.exists()) {
            val profile = UserProfileEntity(
                userId         = userId,
                name           = doc.getString("name") ?: "",
                email          = doc.getString("email") ?: "",
                age            = (doc.getLong("age") ?: 25).toInt(),
                heightInches   = doc.getDouble("heightInches") ?: 65.0,
                weightKg       = doc.getDouble("weightKg") ?: 70.0,
                goal           = doc.getString("goal") ?: "Maintenance",
                activityLevel  = doc.getString("activityLevel") ?: "Moderate",
                dailyCalorieGoal = (doc.getLong("dailyCalorieGoal") ?: 2000).toInt(),
                dailyProteinGoal = (doc.getLong("dailyProteinGoal") ?: 100).toInt(),
                dailyFatGoal     = (doc.getLong("dailyFatGoal") ?: 65).toInt(),
                dailyCarbsGoal   = (doc.getLong("dailyCarbsGoal") ?: 250).toInt()
            )
            Result.success(profile)
        } else {
            Result.failure(Exception("Profile not found"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ─── Food Logs Sync ───────────────────────────────────────────────────

    /** Upload a batch of unsynced logs to Firestore */
    suspend fun syncFoodLogs(logs: List<FoodLogEntity>): Result<Unit> = try {
        val batch = db.batch()
        logs.forEach { log ->
            val ref = db.collection("meals").document(log.id)
            val data = mapOf(
                "userId"          to log.userId,
                "foodName"        to log.foodName,
                "quantity"        to log.quantity,
                "calories"        to log.calories,
                "protein"         to log.protein,
                "fat"             to log.fat,
                "carbs"           to log.carbs,
                "effectiveProtein"to log.effectiveProtein,
                "mealType"        to log.mealType,
                "date"            to log.date,
                "timestamp"       to log.timestamp
            )
            batch.set(ref, data)
        }
        batch.commit().await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    /** Fetch all logs for a date from Firestore (for cross-device sync) */
    suspend fun fetchLogsForDate(userId: String, date: String): Result<List<FoodLogEntity>> = try {
        val snapshot = db.collection("meals")
            .whereEqualTo("userId", userId)
            .whereEqualTo("date", date)
            .get().await()

        val logs = snapshot.documents.mapNotNull { doc ->
            try {
                FoodLogEntity(
                    id              = doc.id,
                    userId          = doc.getString("userId") ?: "",
                    foodName        = doc.getString("foodName") ?: "",
                    quantity        = doc.getDouble("quantity") ?: 100.0,
                    calories        = doc.getDouble("calories") ?: 0.0,
                    protein         = doc.getDouble("protein") ?: 0.0,
                    fat             = doc.getDouble("fat") ?: 0.0,
                    carbs           = doc.getDouble("carbs") ?: 0.0,
                    effectiveProtein= doc.getDouble("effectiveProtein") ?: 0.0,
                    mealType        = doc.getString("mealType") ?: "Breakfast",
                    date            = doc.getString("date") ?: date,
                    timestamp       = doc.getLong("timestamp") ?: 0L,
                    isSynced        = true
                )
            } catch (e: Exception) { null }
        }
        Result.success(logs)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
