package com.nutrivision.api

import android.graphics.Bitmap
import android.util.Base64
import com.nutrivision.data.AiFoodResult
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

// ─── Gemini API Request/Response Models ──────────────────────────────────────

data class GeminiRequest(
    val contents: List<GeminiContent>,
    @SerializedName("generationConfig") val generationConfig: GenerationConfig = GenerationConfig()
)

data class GeminiContent(
    val parts: List<GeminiPart>
)

data class GeminiPart(
    val text: String? = null,
    @SerializedName("inlineData") val inlineData: InlineData? = null
)

data class InlineData(
    @SerializedName("mimeType") val mimeType: String,
    val data: String   // base64 image
)

data class GenerationConfig(
    val temperature: Double = 0.1,
    @SerializedName("maxOutputTokens") val maxOutputTokens: Int = 1024
)

data class GeminiResponse(
    val candidates: List<Candidate>?
)

data class Candidate(
    val content: ContentResponse?
)

data class ContentResponse(
    val parts: List<PartResponse>?
)

data class PartResponse(
    val text: String?
)

// ─── Gemini API Client ───────────────────────────────────────────────────────

@Singleton
class GeminiApiService @Inject constructor(
    private val apiKey: String
) {
    private val gson = Gson()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    private val MODEL    = "gemini-1.5-flash"  // Free tier model

    /**
     * Detect Indian food items from a camera image.
     * Returns a list of detected food items with estimated nutrition.
     */
    suspend fun detectFoodFromImage(bitmap: Bitmap): Result<List<AiFoodResult>> =
        withContext(Dispatchers.IO) {
            try {
                val base64Image = bitmapToBase64(bitmap)

                val prompt = """
                    Analyze this image and identify ALL Indian food items visible.
                    For each food item, provide nutrition per actual portion visible.
                    
                    Respond ONLY with this exact JSON format, no other text:
                    {
                      "foods": [
                        {
                          "foodName": "Chapati / Roti",
                          "estimatedQuantityG": 30,
                          "calories": 71,
                          "protein": 2.5,
                          "fat": 0.9,
                          "carbs": 14.0,
                          "confidence": 0.9
                        }
                      ]
                    }
                    
                    Important:
                    - Use common Indian food names (Roti, Dal Tadka, Paneer Butter Masala, etc.)
                    - Estimate quantity realistically (1 roti ≈ 30g, 1 bowl dal ≈ 200g)
                    - If no food is visible, return empty foods array
                """.trimIndent()

                val request = GeminiRequest(
                    contents = listOf(
                        GeminiContent(
                            parts = listOf(
                                GeminiPart(
                                    inlineData = InlineData(
                                        mimeType = "image/jpeg",
                                        data = base64Image
                                    )
                                ),
                                GeminiPart(text = prompt)
                            )
                        )
                    )
                )

                val jsonBody = gson.toJson(request)
                val requestBody = jsonBody.toRequestBody("application/json".toMediaType())

                val httpRequest = Request.Builder()
                    .url("$BASE_URL/$MODEL:generateContent?key=$apiKey")
                    .post(requestBody)
                    .build()

                val response = httpClient.newCall(httpRequest).execute()

                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("API Error: ${response.code}"))
                }

                val responseBody = response.body?.string() ?: ""
                val geminiResponse = gson.fromJson(responseBody, GeminiResponse::class.java)

                val text = geminiResponse.candidates
                    ?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: return@withContext Result.failure(Exception("Empty response"))

                // Parse JSON from response
                val cleanJson = text.substringAfter("{").let { "{$it" }
                    .substringBefore("}").let { "$it}" }
                    // Better: extract JSON block
                val jsonStart = text.indexOf("{")
                val jsonEnd   = text.lastIndexOf("}") + 1

                if (jsonStart < 0 || jsonEnd <= jsonStart) {
                    return@withContext Result.failure(Exception("Invalid JSON in response"))
                }

                val jsonString = text.substring(jsonStart, jsonEnd)
                val parsed     = gson.fromJson(jsonString, FoodDetectionResponse::class.java)

                Result.success(parsed.foods.map { it.toAiFoodResult() })

            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Smart text parsing: "2 roti + 1 bowl dal" → list of foods
     */
    suspend fun parseTextEntry(text: String): Result<List<AiFoodResult>> =
        withContext(Dispatchers.IO) {
            try {
                val prompt = """
                    Parse this Indian food entry and return nutrition info:
                    "$text"
                    
                    Respond ONLY with this exact JSON format:
                    {
                      "foods": [
                        {
                          "foodName": "Chapati / Roti",
                          "estimatedQuantityG": 60,
                          "calories": 142,
                          "protein": 5.0,
                          "fat": 1.8,
                          "carbs": 28.0,
                          "confidence": 0.85
                        }
                      ]
                    }
                    
                    Use standard Indian portion sizes:
                    - 1 roti/chapati = 30g
                    - 1 bowl = 200ml/200g
                    - 1 katori = 150ml
                    - 1 cup = 240ml
                    - 1 plate = depends on item
                """.trimIndent()

                val request = GeminiRequest(
                    contents = listOf(
                        GeminiContent(parts = listOf(GeminiPart(text = prompt)))
                    )
                )

                val jsonBody    = gson.toJson(request)
                val requestBody = jsonBody.toRequestBody("application/json".toMediaType())

                val httpRequest = Request.Builder()
                    .url("$BASE_URL/$MODEL:generateContent?key=$apiKey")
                    .post(requestBody)
                    .build()

                val response   = httpClient.newCall(httpRequest).execute()
                val bodyString = response.body?.string() ?: ""
                val geminiResp = gson.fromJson(bodyString, GeminiResponse::class.java)

                val rawText = geminiResp.candidates
                    ?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: return@withContext Result.failure(Exception("Empty response"))

                val jsonStart = rawText.indexOf("{")
                val jsonEnd   = rawText.lastIndexOf("}") + 1
                val jsonStr   = rawText.substring(jsonStart, jsonEnd)
                val parsed    = gson.fromJson(jsonStr, FoodDetectionResponse::class.java)

                Result.success(parsed.foods.map { it.toAiFoodResult() })

            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val stream = ByteArrayOutputStream()
        // Compress to keep request size small
        bitmap.compress(Bitmap.CompressFormat.JPEG, 75, stream)
        val bytes = stream.toByteArray()
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
}

// ─── Internal parsing models ─────────────────────────────────────────────────

private data class FoodDetectionResponse(val foods: List<FoodRaw> = emptyList())

private data class FoodRaw(
    val foodName: String = "",
    val estimatedQuantityG: Double = 100.0,
    val calories: Double = 0.0,
    val protein: Double = 0.0,
    val fat: Double = 0.0,
    val carbs: Double = 0.0,
    val confidence: Float = 0.8f
) {
    fun toAiFoodResult() = AiFoodResult(
        foodName           = foodName,
        estimatedQuantityG = estimatedQuantityG,
        calories           = calories,
        protein            = protein,
        fat                = fat,
        carbs              = carbs,
        confidence         = confidence
    )
}
