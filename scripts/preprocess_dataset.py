#!/usr/bin/env python3
"""
NutriVision - Indian Food Dataset Preprocessor
================================================
Downloads the Kaggle Indian Food Nutrition dataset and converts it
to a JSON format compatible with the Android app.

Usage:
    pip install kagglehub pandas
    python preprocess_dataset.py

Output:
    indian_foods.json  →  copy to app/src/main/assets/
"""

import json
import re

# ── Try Kaggle download, else use sample ──────────────────────────────────────
try:
    import kagglehub
    import pandas as pd

    print("📥 Downloading dataset from Kaggle...")
    path = kagglehub.dataset_download("batthulavinay/indian-food-nutrition")
    print(f"✅ Downloaded to: {path}")

    import os
    csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
    if not csv_files:
        raise FileNotFoundError("No CSV found")

    df = pd.read_csv(os.path.join(path, csv_files[0]))
    print(f"📊 Loaded {len(df)} rows, columns: {list(df.columns)}")

except Exception as e:
    print(f"⚠️  Could not download dataset: {e}")
    print("   Using sample data for demonstration.")
    df = None

# ── Bioavailability scoring ───────────────────────────────────────────────────

HIGH_BIO = {"egg", "chicken", "fish", "turkey", "paneer", "milk", "curd",
            "yogurt", "whey", "mutton", "lamb", "prawn", "tuna", "salmon"}
MED_BIO  = {"dal", "lentil", "rajma", "chana", "chickpea", "soya", "tofu",
            "moong", "masoor", "toor", "urad", "legume"}

def bioavailability_score(food_name: str) -> float:
    lower = food_name.lower()
    if any(h in lower for h in HIGH_BIO): return 0.90
    if any(m in lower for m in MED_BIO):  return 0.65
    return 0.45

def bioavailability_label(score: float) -> str:
    if score >= 0.80: return "High"
    if score >= 0.60: return "Medium"
    return "Low"

# ── Column name normalisation ─────────────────────────────────────────────────

COLUMN_MAP = {
    # calories
    "energy": "calories", "energy_kcal": "calories", "calories": "calories",
    "energy (kcal)": "calories", "kcal": "calories",
    # protein
    "protein": "protein", "protein (g)": "protein", "protein_g": "protein",
    # fat
    "fat": "fat", "fat (g)": "fat", "total fat": "fat", "fat_g": "fat",
    # carbs
    "carbohydrates": "carbs", "carbs": "carbs", "carbohydrate": "carbs",
    "carbohydrates (g)": "carbs", "carbs_g": "carbs",
    # fiber
    "fiber": "fiber", "dietary fiber": "fiber", "fibre": "fiber", "fiber (g)": "fiber",
    # food name
    "food": "food_name", "name": "food_name", "food_name": "food_name",
    "item": "food_name", "food item": "food_name",
}

def normalise_columns(df):
    rename = {}
    for col in df.columns:
        key = col.strip().lower()
        if key in COLUMN_MAP:
            rename[col] = COLUMN_MAP[key]
    return df.rename(columns=rename)

# ── Process dataframe ─────────────────────────────────────────────────────────

def process_df(df):
    df = normalise_columns(df)

    # Ensure required columns exist
    for col in ["food_name", "calories", "protein", "fat", "carbs"]:
        if col not in df.columns:
            df[col] = 0 if col != "food_name" else "Unknown"
    if "fiber"    not in df.columns: df["fiber"]    = 0
    if "category" not in df.columns: df["category"] = "General"

    # Clean numeric cols
    for col in ["calories", "protein", "fat", "carbs", "fiber"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).round(2)

    # Clean food name
    df["food_name"] = df["food_name"].astype(str).str.strip().str.title()

    # Remove rows with 0 calories and empty names
    df = df[(df["calories"] > 0) & (df["food_name"].str.len() > 1)]

    # Add bioavailability
    df["bioavailability_score"] = df["food_name"].apply(bioavailability_score)
    df["bioavailability_label"] = df["bioavailability_score"].apply(bioavailability_label)

    # Deduplicate by food name (keep highest calorie entry)
    df = df.sort_values("calories", ascending=False)
    df = df.drop_duplicates(subset=["food_name"], keep="first")

    return df.reset_index(drop=True)

# ── Convert to JSON ───────────────────────────────────────────────────────────

def df_to_json(df) -> list:
    foods = []
    for idx, row in df.iterrows():
        foods.append({
            "food_name":            str(row["food_name"]),
            "calories":             float(row.get("calories", 0)),
            "protein":              float(row.get("protein", 0)),
            "fat":                  float(row.get("fat", 0)),
            "carbs":                float(row.get("carbs", 0)),
            "fiber":                float(row.get("fiber", 0)),
            "category":             str(row.get("category", "General")),
            "bioavailability_score":float(row.get("bioavailability_score", 0.45)),
            "bioavailability_label":str(row.get("bioavailability_label", "Low")),
        })
    return foods

# ── Sample fallback ───────────────────────────────────────────────────────────

SAMPLE_DATA = [
    {"food_name": "Chapati", "calories": 227, "protein": 7.8, "fat": 1.0, "carbs": 49.4, "fiber": 2.5, "category": "Bread"},
    {"food_name": "Dal Tadka", "calories": 80, "protein": 5.0, "fat": 2.0, "carbs": 12.0, "fiber": 3.5, "category": "Dal"},
    {"food_name": "Chicken Curry", "calories": 165, "protein": 17.0, "fat": 9.0, "carbs": 6.0, "fiber": 0.5, "category": "Non-Veg"},
    {"food_name": "Steamed Rice", "calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28.2, "fiber": 0.4, "category": "Rice"},
    {"food_name": "Paneer Butter Masala", "calories": 164, "protein": 7.5, "fat": 9.5, "carbs": 13.0, "fiber": 2.0, "category": "Curry"},
]

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if df is not None:
        processed = process_df(df)
        foods = df_to_json(processed)
        print(f"✅ Processed {len(foods)} unique food items")
    else:
        # Enrich sample data with bioavailability
        foods = []
        for item in SAMPLE_DATA:
            score = bioavailability_score(item["food_name"])
            foods.append({**item,
                "bioavailability_score": score,
                "bioavailability_label": bioavailability_label(score)
            })
        print(f"✅ Using {len(foods)} sample food items")

    output_path = "indian_foods.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, ensure_ascii=False, indent=2)

    print(f"\n📦 Output saved to: {output_path}")
    print(f"   → Copy to: app/src/main/assets/indian_foods.json")
    print(f"\n📊 Sample entries:")
    for food in foods[:3]:
        print(f"   {food['food_name']}: {food['calories']} cal, "
              f"P:{food['protein']}g, Bio:{food['bioavailability_label']}")

if __name__ == "__main__":
    main()
