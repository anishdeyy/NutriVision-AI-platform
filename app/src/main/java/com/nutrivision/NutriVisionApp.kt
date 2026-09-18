package com.nutrivision

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.*
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class NutriVisionApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()
        scheduleSyncWork()
    }

    // WorkManager config with Hilt
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    private fun scheduleSyncWork() {
        // Schedule periodic sync when network is available
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<com.nutrivision.utils.SyncWorker>(
            repeatInterval = 1,
            repeatIntervalTimeUnit = java.util.concurrent.TimeUnit.HOURS
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "nutrivision_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
}
