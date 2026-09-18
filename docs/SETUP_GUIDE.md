# 🥗 NutriVision — Complete Setup Guide
## AI-Powered Indian Diet Tracker

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Firebase Setup (FREE)](#firebase-setup)
3. [Gemini API Key (FREE)](#gemini-api)
4. [Project Setup in Android Studio](#android-studio)
5. [Dataset Preprocessing](#dataset)
6. [Run the App](#run)
7. [How the App Works](#architecture)
8. [Offline Mode Explained](#offline)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Install these first:

| Tool | Version | Download |
|------|---------|----------|
| Android Studio | Hedgehog+ | https://developer.android.com/studio |
| JDK | 17+ | Bundled with Android Studio |
| Android SDK | API 26+ | Via SDK Manager |

---

## 2. 🔥 Firebase Setup (100% FREE)

**The Spark plan (free) gives you:**
- ✅ 50,000 Firestore reads/day
- ✅ 20,000 Firestore writes/day
- ✅ 10,000 authentications/month
- ✅ 1 GB Firestore storage
- ✅ Unlimited offline persistence cache

### Step-by-step:

### A. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Project name: `NutriVision`
4. Disable Google Analytics (optional, saves setup time)
5. Click **"Create project"**

### B. Add Android App

1. In Firebase console, click the **Android icon** `</>`
2. **Android package name:** `com.nutrivision`
3. App nickname: `NutriVision`
4. Click **"Register app"**
5. **Download `google-services.json`**
6. Place it at: `NutriVision/app/google-services.json`

### C. Enable Firebase Authentication

1. Firebase Console → **Build → Authentication**
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **Enable → Save**

### D. Create Firestore Database

1. Firebase Console → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows all reads/writes for 30 days)
4. Select region closest to you (e.g., `asia-south1` for India)
5. Click **"Enable"**

### E. Set Firestore Security Rules (after testing)

Go to **Firestore → Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /meals/{mealId} {
      allow read, write: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 3. 🤖 Gemini API Key (FREE)

1. Go to https://aistudio.google.com
2. Sign in with Google account
3. Click **"Get API key"**
4. Click **"Create API key"**
5. Copy the key

**Free tier limits:**
- 15 requests/minute
- 1 million tokens/day
- Completely free, no credit card needed

### Add API Key to Project

Open `NutriVision/gradle.properties` and add:
```
GEMINI_API_KEY=your_actual_api_key_here
```

> ⚠️ **NEVER commit this file to git!** Add `gradle.properties` to `.gitignore`

---

## 4. 📱 Android Studio Setup

```bash
# 1. Open Android Studio
# 2. File → Open → Select the NutriVision/ folder
# 3. Wait for Gradle sync (first time takes 5-10 mins)
```

### File structure after placing google-services.json:
```
NutriVision/
├── app/
│   ├── google-services.json   ← PUT HERE
│   ├── src/main/
│   │   ├── assets/
│   │   │   └── indian_foods.json  ← Already included
│   │   └── java/com/nutrivision/
├── gradle/
│   └── libs.versions.toml
├── gradle.properties          ← ADD API KEY HERE
└── settings.gradle.kts
```

---

## 5. 🍛 Dataset Preprocessing (Optional)

The app ships with 40+ built-in Indian foods. To add the full Kaggle dataset:

```bash
# Install dependencies
pip install kagglehub pandas

# Set up Kaggle credentials first:
# 1. Go to https://www.kaggle.com → Account → API → "Create New Token"
# 2. Download kaggle.json
# 3. Place at ~/.kaggle/kaggle.json

# Run preprocessor
cd NutriVision/scripts/
python preprocess_dataset.py

# Output: indian_foods.json
# Copy to:
cp indian_foods.json ../app/src/main/assets/indian_foods.json
```

---

## 6. ▶️ Run the App

### On Physical Device (Recommended):
1. Enable **Developer Options** on your Android phone
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**
   - Settings → Developer Options → USB Debugging → ON
3. Connect via USB
4. In Android Studio: click the **green ▶ Run** button

### On Emulator:
1. Android Studio → **Device Manager** → **Create Device**
2. Choose **Pixel 6** or any modern phone
3. API Level: **30** or higher
4. Start emulator → Click **Run**

---

## 7. 🏗️ How the App Works

### Architecture: MVVM + Repository Pattern

```
UI (Compose Screens)
       ↓ observes
ViewModel (state + logic)
       ↓ calls
Repository (single source of truth)
       ↓              ↓
Room Database    Firebase Firestore
(offline first)  (sync when online)
```

### AI Food Detection Flow:
```
Camera captures image
       ↓
Bitmap → Base64 encoded
       ↓
POST to Gemini API (gemini-1.5-flash)
       ↓
JSON response parsed → AiFoodResult list
       ↓
User selects/confirms → saved to Room DB
       ↓
WorkManager syncs to Firebase (if online)
```

### Offline Sync Flow:
```
User adds food log
       ↓
Saved to Room DB with isSynced=false
       ↓ (network available)
WorkManager SyncWorker runs
       ↓
Uploads to Firebase, marks isSynced=true
```

---

## 8. 📶 Offline Mode

The app works **100% offline** with full functionality:

| Feature | Offline | Online |
|---------|---------|--------|
| View dashboard | ✅ | ✅ |
| Manual food search | ✅ (local DB) | ✅ |
| Log meals | ✅ | ✅ |
| View history | ✅ | ✅ |
| AI food detection | ❌ (needs internet) | ✅ |
| Sync to Firebase | Auto when online | Real-time |

**How offline storage works:**
- Room Database stores everything locally
- Firestore SDK caches data (up to unlimited with free plan)
- WorkManager queues sync jobs and retries automatically

---

## 9. 🔧 Troubleshooting

### Build Error: "google-services.json not found"
→ Make sure you placed it in `app/` folder, not the root

### "API key not valid" from Gemini
→ Check `gradle.properties` — ensure `GEMINI_API_KEY=` has no spaces

### "Permission denied" on camera
→ App requests camera at runtime; approve the popup on device

### Firebase auth not working
→ Ensure Email/Password is enabled in Firebase Console → Authentication

### Sync not happening
→ Check device has internet; WorkManager runs in background — can take up to 1 hour for periodic sync. For immediate: trigger by going to background and returning.

### Gradle sync fails
→ File → Invalidate Caches → Restart; ensure JDK 17 is set in Project Structure

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `MainActivity.kt` | App entry + Navigation |
| `HomeScreen.kt` | Dashboard with calories & macros |
| `CameraScreen.kt` | AI food detection |
| `ManualEntryScreen.kt` | Text search + AI text parse |
| `GeminiApiService.kt` | Gemini API integration |
| `NutriRepository.kt` | Data layer (offline-first) |
| `SyncWorker.kt` | Background Firebase sync |
| `FoodDatasetLoader.kt` | Loads Indian food dataset |
| `indian_foods.json` | Built-in food database |
| `preprocess_dataset.py` | Kaggle dataset preprocessor |

---

## 🚀 What's Free Forever

- Firebase Spark plan (no cost ever for typical personal use)
- Gemini API free tier (15 req/min, no credit card)
- Room database (local, unlimited)
- All app features

---

## 📞 Support

If you hit issues:
1. Check Firebase Console → Usage tab to ensure you're within limits
2. Check Android Studio Logcat for detailed error messages
3. Ensure `google-services.json` matches your `applicationId = "com.nutrivision"`
