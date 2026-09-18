package com.nutrivision.utils

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.nutrivision.repository.NutriRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * Background worker that runs when network is available.
 * Syncs all locally-stored food logs to Firebase Firestore.
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: NutriRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            repository.syncPendingLogs()
            Result.success()
        } catch (e: Exception) {
            // Retry up to 3 times
            if (runAttemptCount < 3) Result.retry()
            else Result.failure()
        }
    }
}
