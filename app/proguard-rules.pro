# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Retrofit + Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.nutrivision.api.** { *; }
-keep class retrofit2.** { *; }
-keep class com.google.gson.** { *; }

# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Data models
-keep class com.nutrivision.data.** { *; }
