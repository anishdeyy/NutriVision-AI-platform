package com.nutrivision.di

import android.content.Context
import androidx.room.Room
import androidx.work.WorkManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.nutrivision.BuildConfig
import com.nutrivision.api.GeminiApiService
import com.nutrivision.data.local.NutriDatabase
import com.nutrivision.data.local.dao.FoodLogDao
import com.nutrivision.data.local.dao.UserProfileDao
import com.nutrivision.data.remote.FirebaseRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // ─── Room ─────────────────────────────────────────────────────────────

    @Provides @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): NutriDatabase =
        Room.databaseBuilder(ctx, NutriDatabase::class.java, NutriDatabase.DB_NAME)
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideFoodLogDao(db: NutriDatabase): FoodLogDao = db.foodLogDao()
    @Provides fun provideUserProfileDao(db: NutriDatabase): UserProfileDao = db.userProfileDao()

    // ─── Firebase ─────────────────────────────────────────────────────────

    @Provides @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    @Provides @Singleton
    fun provideFirestore(): FirebaseFirestore = FirebaseFirestore.getInstance().also { db ->
        // Enable offline persistence (FREE, up to 100MB cache)
        val settings = com.google.firebase.firestore.FirebaseFirestoreSettings.Builder()
            .setPersistenceEnabled(true)
            .setCacheSizeBytes(com.google.firebase.firestore.FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
            .build()
        db.firestoreSettings = settings
    }

    @Provides @Singleton
    fun provideFirebaseRepo(
        firestore: FirebaseFirestore,
        auth: FirebaseAuth
    ): FirebaseRepository = FirebaseRepository(firestore, auth)

    // ─── Gemini AI ────────────────────────────────────────────────────────

    @Provides @Singleton
    fun provideGeminiService(): GeminiApiService =
        GeminiApiService(apiKey = BuildConfig.GEMINI_API_KEY)

    // ─── WorkManager ─────────────────────────────────────────────────────

    @Provides @Singleton
    fun provideWorkManager(@ApplicationContext ctx: Context): WorkManager =
        WorkManager.getInstance(ctx)
}
