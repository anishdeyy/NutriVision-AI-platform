package com.nutrivision.data.local

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import android.content.Context
import com.nutrivision.data.FoodLogEntity
import com.nutrivision.data.UserProfileEntity
import com.nutrivision.data.local.dao.FoodLogDao
import com.nutrivision.data.local.dao.UserProfileDao

@Database(
    entities  = [FoodLogEntity::class, UserProfileEntity::class],
    version   = 1,
    exportSchema = false
)
abstract class NutriDatabase : RoomDatabase() {

    abstract fun foodLogDao(): FoodLogDao
    abstract fun userProfileDao(): UserProfileDao

    companion object {
        const val DB_NAME = "nutrivision_db"
    }
}
