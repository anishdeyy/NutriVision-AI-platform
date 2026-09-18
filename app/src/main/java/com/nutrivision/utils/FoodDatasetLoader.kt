package com.nutrivision.utils

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.nutrivision.data.BioavailabilityHelper
import com.nutrivision.data.FoodItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Loads Indian food nutrition dataset from assets/indian_foods.json
 * Falls back to bundled minimal dataset if file not found.
 */
object FoodDatasetLoader {

    private var cachedFoods: List<FoodItem>? = null
    private val gson = Gson()

    suspend fun loadFoods(context: Context): List<FoodItem> = withContext(Dispatchers.IO) {
        cachedFoods?.let { return@withContext it }

        val foods = try {
            val json = context.assets.open("indian_foods.json")
                .bufferedReader().use { it.readText() }
            val type = object : TypeToken<List<RawFoodEntry>>() {}.type
            val rawList: List<RawFoodEntry> = gson.fromJson(json, type)
            rawList.map { it.toFoodItem() }
        } catch (e: Exception) {
            // Bundled fallback dataset (common Indian foods)
            getBuiltInFoods()
        }

        cachedFoods = foods
        foods
    }

    // ─── Built-in fallback dataset ────────────────────────────────────────────

    private fun getBuiltInFoods(): List<FoodItem> = listOf(
        // Breads
        FoodItem("1",  "Chapati / Roti",      227, 7.8,  1.0,  49.4, 2.5,  BioavailabilityHelper.score("Roti"),    "Bread"),
        FoodItem("2",  "Paratha",             297, 7.1,  8.0,  50.3, 2.1,  BioavailabilityHelper.score("Paratha"), "Bread"),
        FoodItem("3",  "Puri",                337, 7.0, 12.0,  51.0, 1.8,  BioavailabilityHelper.score("Puri"),    "Bread"),
        FoodItem("4",  "Naan",                263, 8.7,  4.4,  50.4, 1.9,  BioavailabilityHelper.score("Naan"),    "Bread"),
        FoodItem("5",  "Idli",                 58, 2.0,  0.4,  12.1, 0.3,  BioavailabilityHelper.score("Idli"),    "South Indian"),
        FoodItem("6",  "Dosa",                168, 3.8,  4.0,  30.0, 0.8,  BioavailabilityHelper.score("Dosa"),    "South Indian"),
        FoodItem("7",  "Uttapam",             134, 4.2,  2.5,  24.3, 1.0,  BioavailabilityHelper.score("Uttapam"), "South Indian"),

        // Rice dishes
        FoodItem("8",  "Steamed Rice",        130, 2.7,  0.3,  28.2, 0.4,  BioavailabilityHelper.score("Rice"),    "Rice"),
        FoodItem("9",  "Biryani (Chicken)",   250, 13.0, 9.0,  31.0, 1.0,  BioavailabilityHelper.score("chicken"), "Rice"),
        FoodItem("10", "Khichdi",             110, 4.0,  1.5,  20.0, 2.0,  BioavailabilityHelper.score("dal"),     "Rice"),
        FoodItem("11", "Pulao",               165, 4.0,  4.0,  28.0, 1.0,  BioavailabilityHelper.score("Rice"),    "Rice"),

        // Dals & legumes
        FoodItem("12", "Dal Tadka",            80, 5.0,  2.0,  12.0, 3.5,  BioavailabilityHelper.score("dal"),     "Dal"),
        FoodItem("13", "Dal Makhani",         130, 7.0,  5.0,  15.0, 4.0,  BioavailabilityHelper.score("dal"),     "Dal"),
        FoodItem("14", "Chana Masala",        164, 8.9,  3.0,  27.0, 8.0,  BioavailabilityHelper.score("chana"),   "Dal"),
        FoodItem("15", "Rajma",               127, 8.7,  0.5,  22.8, 6.4,  BioavailabilityHelper.score("rajma"),   "Dal"),
        FoodItem("16", "Moong Dal",            76, 5.6,  0.3,  13.7, 4.1,  BioavailabilityHelper.score("moong"),   "Dal"),
        FoodItem("17", "Sambhar",              48, 2.5,  0.8,   8.0, 2.0,  BioavailabilityHelper.score("dal"),     "South Indian"),

        // Vegetables
        FoodItem("18", "Paneer Butter Masala",164, 7.5,  9.5,  13.0, 2.0,  BioavailabilityHelper.score("paneer"),  "Curry"),
        FoodItem("19", "Palak Paneer",        140, 8.5,  8.0,  10.0, 3.0,  BioavailabilityHelper.score("paneer"),  "Curry"),
        FoodItem("20", "Aloo Gobi",            82, 2.5,  3.5,  12.0, 3.0,  BioavailabilityHelper.score("aloo"),    "Curry"),
        FoodItem("21", "Mixed Veg Curry",      72, 2.0,  3.0,  10.0, 2.5,  BioavailabilityHelper.score("veg"),     "Curry"),
        FoodItem("22", "Baingan Bharta",       72, 2.2,  3.8,   9.5, 3.5,  BioavailabilityHelper.score("veg"),     "Curry"),
        FoodItem("23", "Bhindi Masala",        64, 2.1,  2.5,   9.0, 3.2,  BioavailabilityHelper.score("veg"),     "Curry"),
        FoodItem("24", "Matar Paneer",        165, 8.0, 10.0,  13.0, 3.0,  BioavailabilityHelper.score("paneer"),  "Curry"),

        // Non-veg
        FoodItem("25", "Chicken Curry",       165, 17.0, 9.0,   6.0, 0.5,  BioavailabilityHelper.score("chicken"), "Non-Veg"),
        FoodItem("26", "Chicken Tikka",       203, 28.0, 9.0,   1.5, 0.0,  BioavailabilityHelper.score("chicken"), "Non-Veg"),
        FoodItem("27", "Butter Chicken",      237, 20.0,14.0,   8.0, 0.5,  BioavailabilityHelper.score("chicken"), "Non-Veg"),
        FoodItem("28", "Egg Curry",           175, 11.0,13.0,   5.0, 0.3,  BioavailabilityHelper.score("egg"),     "Non-Veg"),
        FoodItem("29", "Boiled Egg",           78, 6.3,  5.0,   0.6, 0.0,  BioavailabilityHelper.score("egg"),     "Egg"),
        FoodItem("30", "Scrambled Eggs",      148, 10.0,11.0,   1.6, 0.0,  BioavailabilityHelper.score("egg"),     "Egg"),
        FoodItem("31", "Fish Curry",          157, 18.0, 8.0,   4.0, 0.0,  BioavailabilityHelper.score("fish"),    "Non-Veg"),

        // Dairy
        FoodItem("32", "Paneer (raw)",        265, 18.3,20.8,   1.2, 0.0,  BioavailabilityHelper.score("paneer"),  "Dairy"),
        FoodItem("33", "Curd / Dahi",          66, 3.5,  4.0,   5.0, 0.0,  BioavailabilityHelper.score("curd"),    "Dairy"),
        FoodItem("34", "Lassi (sweet)",       103, 3.5,  2.5,  17.5, 0.0,  BioavailabilityHelper.score("milk"),    "Dairy"),
        FoodItem("35", "Milk (whole)",         61, 3.2,  3.5,   4.7, 0.0,  BioavailabilityHelper.score("milk"),    "Dairy"),
        FoodItem("36", "Raita",               54,  2.5,  2.0,   7.0, 0.0,  BioavailabilityHelper.score("curd"),    "Dairy"),

        // Snacks
        FoodItem("37", "Samosa (1 pc)",       262, 4.0, 14.0,  32.0, 2.0,  BioavailabilityHelper.score("samosa"),  "Snack"),
        FoodItem("38", "Pakora (100g)",       310, 7.0, 18.0,  31.0, 2.5,  BioavailabilityHelper.score("pakora"),  "Snack"),
        FoodItem("39", "Poha",                180, 3.5,  3.0,  36.0, 2.0,  BioavailabilityHelper.score("poha"),    "Snack"),
        FoodItem("40", "Upma",               160, 4.5,  4.0,  28.0, 2.5,  BioavailabilityHelper.score("upma"),    "Snack"),
        FoodItem("41", "Dhokla (100g)",       160, 5.0,  3.0,  29.0, 1.5,  BioavailabilityHelper.score("dhokla"),  "Snack"),
        FoodItem("42", "Peanuts (roasted)",   567, 25.8,49.2,  16.1, 8.5,  BioavailabilityHelper.score("peanut"),  "Snack"),
        FoodItem("43", "Banana",               89, 1.1,  0.3,  22.8, 2.6,  BioavailabilityHelper.score("banana"),  "Fruit"),
        FoodItem("44", "Apple",                52, 0.3,  0.2,  13.8, 2.4,  BioavailabilityHelper.score("apple"),   "Fruit"),
        FoodItem("45", "Mango",                60, 0.8,  0.4,  15.0, 1.6,  BioavailabilityHelper.score("mango"),   "Fruit"),

        // Sweets
        FoodItem("46", "Gulab Jamun (1pc)",   150, 2.3,  5.0,  26.0, 0.2,  BioavailabilityHelper.score("sweet"),   "Sweet"),
        FoodItem("47", "Kheer (1 bowl)",       200, 5.0,  6.0,  34.0, 0.2, BioavailabilityHelper.score("milk"),    "Sweet"),
        FoodItem("48", "Halwa",               350, 4.0, 12.0,  58.0, 1.0,  BioavailabilityHelper.score("sweet"),   "Sweet"),

        // Beverages
        FoodItem("49", "Masala Chai (cup)",    50, 2.0,  2.0,   7.0, 0.0,  BioavailabilityHelper.score("milk"),    "Beverage"),
        FoodItem("50", "Coconut Water",        19, 0.7,  0.2,   3.7, 1.1,  BioavailabilityHelper.score("coconut"), "Beverage")
    )
}

private data class RawFoodEntry(
    val food_name: String = "",
    val calories: Double = 0.0,
    val protein: Double = 0.0,
    val fat: Double = 0.0,
    val carbs: Double = 0.0,
    val fiber: Double = 0.0,
    val category: String = ""
) {
    fun toFoodItem() = FoodItem(
        id                   = food_name.hashCode().toString(),
        foodName             = food_name,
        calories             = calories,
        protein              = protein,
        fat                  = fat,
        carbs                = carbs,
        fiber                = fiber,
        bioavailabilityScore = BioavailabilityHelper.score(food_name),
        category             = category
    )
}
