# External Kaggle Nutrition Datasets Integration

This directory documents the external datasets ingested into NutriVision AI via `kagglehub`.

---

## 1. Registered Datasets

### Dataset 1: Indian Food Nutrition
* **Kaggle Identifier**: `batthulavinay/indian-food-nutrition`
* **Download Method**:
  ```python
  import kagglehub
  path = kagglehub.dataset_download("batthulavinay/indian-food-nutrition")
  ```
* **Content**: 1,014 traditional and modern Indian dishes with macronutrients and select micronutrients (Calcium, Iron, Vitamin C, Folate, Free Sugars).
* **Role**: Expands the Indian regional dish coverage of NutriVision AI from 146 baseline staples to over 1,150 Indian culinary items.
* **Confidence Level**: `SOURCE_IMPORTED`

### Dataset 2: Daily Food and Nutrition Dataset
* **Kaggle Identifier**: `adilshamim8/daily-food-and-nutrition-dataset`
* **Download Method**:
  ```python
  import kagglehub
  path = kagglehub.dataset_download("adilshamim8/daily-food-and-nutrition-dataset")
  ```
* **Content**: 640+ universal everyday foods, fruits, grains, breakfast items, and beverages with meal categorizations.
* **Role**: Bridges everyday global and breakfast staples consumed across Indian urban households (e.g. Scrambled Eggs, Oatmeal, Whole Wheat Toast).
* **Confidence Level**: `SOURCE_IMPORTED`

---

## 2. Ingestion & Transformation Pipeline

```text
Kaggle Dataset Download
         │
         ▼
Recursive File Discovery (.csv, .xlsx, .json, .parquet)
         │
         ▼
Automated Schema Inspection & Dtype Profiling
         │
         ▼
Column Normalization via COLUMN_ALIASES Dictionary
         │
         ▼
Safe Numeric Extraction & Unquoted Comma Recovery
         │
         ▼
Biochemical Validation (Range & Energy Consistency 4P+4C+9F)
         │
         ▼
Normalized Name Matching & Deduplication (Priority: Curated > D1 > D2)
         │
         ▼
Database Upsert & Provenance Logging (SHA-256 Hash + JSONB Original)
```

---

## 3. Important Scientific Distinction: Data vs. Evidence

In NutriVision AI:
* **Structured Nutrition Data** (stored in PostgreSQL / SQLite):
  * Calories, protein, carbs, fats, fiber, prices, portion sizes.
  * Sourced from Kaggle and curated food tables.
  * Used for meal logging, macro rings, recipe generation, and food comparison.
  * **Attribution**: `"NutriVision Food Database (Kaggle Dataset)"`.
* **Scientific Evidence & Clinical Guidelines** (stored in ChromaDB Vector Store):
  * ICMR-NIN 2024 Dietary Guidelines for Indians.
  * FAO/WHO Protein Bioavailability and DIAAS Scoring frameworks.
  * PubMed studies on leucine trigger and glycemic index satiety.
  * **Attribution**: `"Scientific Evidence (ICMR-NIN, FAO, PubMed)"`.

> [!WARNING]
> Kaggle food rows are **never** cited as clinical or medical evidence. They serve exclusively as empirical food composition records.

---

## 4. How to Re-Run Ingestion

```bash
# 1. Inspect schema without downloading or writing
python scripts/ingest_kaggle_datasets.py --inspect

# 2. Run simulation dry-run
python scripts/ingest_kaggle_datasets.py --dry-run

# 3. Commit live import and provenance tracking
python scripts/ingest_kaggle_datasets.py --import

# 4. View import summary report
python scripts/ingest_kaggle_datasets.py --report
```
