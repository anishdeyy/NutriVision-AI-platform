package com.nutrivision.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

// ─── Food Item (from dataset + AI) ─────────────────────────────────────────

data class FoodItem(
    val id: String = "",
    val foodName: String = "",
    val calories: Double = 0.0,      // per 100g
    val protein: Double = 0.0,       // per 100g
    val fat: Double = 0.0,           // per 100g
    val carbs: Double = 0.0,         // per 100g
    val fiber: Double = 0.0,         // per 100g
    val bioavailabilityScore: Double = 1.0,  // 0.0 – 1.0
    val category: String = "",
    val servingSize: Double = 100.0,
    val servingUnit: String = "g"
) {
    // Effective protein = protein × bioavailability score
    val effectiveProtein: Double get() = protein * bioavailabilityScore
}

// ─── Bioavailability scoring logic ─────────────────────────────────────────

object BioavailabilityHelper {
    private val highBio = setOf(
        "egg", "chicken", "fish", "turkey", "paneer", "milk", "curd", "yogurt",
        "whey", "mutton", "lamb", "prawn", "tuna", "salmon"
    )
    private val medBio = setOf(
        "dal", "lentil", "rajma", "chana", "chickpea", "soya", "tofu",
        "moong", "masoor", "toor", "urad"
    )
    // Low bio = wheat, rice, maize, etc.

    fun score(foodName: String): Double {
        val lower = foodName.lowercase()
        return when {
            highBio.any { lower.contains(it) } -> 0.90
            medBio.any  { lower.contains(it) } -> 0.65
            else                               -> 0.45
        }
    }

    fun label(score: Double) = when {
        score >= 0.80 -> "High"
        score >= 0.60 -> "Medium"
        else          -> "Low"
    }
}

// ─── Logged Food Entry ──────────────────────────────────────────────────────

@Entity(tableName = "food_logs")
data class FoodLogEntity(
    @PrimaryKey val id: String = java.util.UUID.randomUUID().toString(),
    val userId: String = "",
    val foodName: String = "",
    val quantity: Double = 100.0,        // in grams/ml
    val calories: Double = 0.0,
    val protein: Double = 0.0,
    val fat: Double = 0.0,
    val carbs: Double = 0.0,
    val effectiveProtein: Double = 0.0,
    val mealType: String = "Breakfast",  // Breakfast/Lunch/Dinner/Snacks
    val date: String = LocalDate.now().toString(),   // "YYYY-MM-DD"
    val timestamp: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false        // offline sync flag
)

// ─── Meal Summary (derived, not stored separately) ──────────────────────────

data class MealSummary(
    val mealType: String,
    val items: List<FoodLogEntity>,
    val totalCalories: Double,
    val totalProtein: Double,
    val totalFat: Double,
    val totalCarbs: Double
)

// ─── User Profile ───────────────────────────────────────────────────────────

@Entity(tableName = "user_profile")
data class UserProfileEntity(
    @PrimaryKey val userId: String = "",
    val name: String = "",
    val email: String = "",
    val age: Int = 25,
    val heightInches: Double = 65.0,
    val weightKg: Double = 70.0,
    val goal: String = "Maintenance",   // WeightLoss / WeightGain / Maintenance
    val activityLevel: String = "Moderate",
    val dailyCalorieGoal: Int = 2000,
    val dailyProteinGoal: Int = 100,
    val dailyFatGoal: Int = 65,
    val dailyCarbsGoal: Int = 250
) {
    companion object {
        // Mifflin-St Jeor BMR → TDEE → goal-adjusted calories
        fun calculateGoals(age: Int, heightIn: Double, weightKg: Double, goal: String, activityLevel: String): UserProfileEntity {
            val heightCm = heightIn * 2.54
            val bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5  // male approximation

            val activityMultiplier = when (activityLevel) {
                "Sedentary"  -> 1.2
                "Light"      -> 1.375
                "Moderate"   -> 1.55
                "Active"     -> 1.725
                "Very Active"-> 1.9
                else         -> 1.55
            }

            val tdee = bmr * activityMultiplier

            val targetCalories = when (goal) {
                "WeightLoss" -> (tdee - 400).toInt()
                "WeightGain" -> (tdee + 400).toInt()
                else         -> tdee.toInt()
            }

            val protein = (weightKg * 1.8).toInt()   // 1.8g/kg bodyweight
            val fat     = ((targetCalories * 0.25) / 9).toInt()
            val carbs   = ((targetCalories - protein * 4 - fat * 9) / 4).toInt()

            return UserProfileEntity(
                dailyCalorieGoal = targetCalories,
                dailyProteinGoal = protein,
                dailyFatGoal     = fat,
                dailyCarbsGoal   = carbs
            )
        }
    }
}

// ─── Daily Nutrition Summary ─────────────────────────────────────────────────

data class DailyNutrition(
    val date: String,
    val totalCalories: Double = 0.0,
    val totalProtein: Double = 0.0,
    val totalFat: Double = 0.0,
    val totalCarbs: Double = 0.0,
    val totalEffectiveProtein: Double = 0.0,
    val calorieGoal: Int = 2000,
    val proteinGoal: Int = 100,
    val fatGoal: Int = 65,
    val carbsGoal: Int = 250
) {
    val caloriesRemaining get() = calorieGoal - totalCalories
    val calorieProgress   get() = (totalCalories / calorieGoal).coerceIn(0.0, 1.0).toFloat()
    val proteinProgress   get() = (totalProtein / proteinGoal).coerceIn(0.0, 1.0).toFloat()
    val fatProgress       get() = (totalFat / fatGoal).coerceIn(0.0, 1.0).toFloat()
    val carbsProgress     get() = (totalCarbs / carbsGoal).coerceIn(0.0, 1.0).toFloat()
}

// ─── AI Food Detection Result ────────────────────────────────────────────────

data class AiFoodResult(
    val foodName: String,
    val estimatedQuantityG: Double,
    val calories: Double,
    val protein: Double,
    val fat: Double,
    val carbs: Double,
    val confidence: Float = 0.8f
)

// ─── Navigation Routes ───────────────────────────────────────────────────────

sealed class Screen(val route: String) {
    object Splash    : Screen("splash")
    object Login     : Screen("login")
    object Register  : Screen("register")
    object Onboarding: Screen("onboarding")
    object Home      : Screen("home")
    object Diary     : Screen("diary")
    object Camera    : Screen("camera")
    object Manual    : Screen("manual_entry")
    object History   : Screen("history")
    object Profile   : Screen("profile")
    object Goals     : Screen("goals")
}
