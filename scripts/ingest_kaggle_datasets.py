import os
import sys
import re
import json
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import kagglehub

# Ensure project root in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.food import Food
from backend.app.models.food_source import FoodSource
from backend.app.models.dataset_source import DatasetSource

REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
REPORT_FILE = REPORTS_DIR / "dataset_import_report.json"

# Column Alias Mapping Layer
COLUMN_ALIASES = {
    "food_name": [
        "food", "food_name", "food name", "dish", "dish_name", "dish name",
        "item", "item_name", "food_item", "item name", "food item"
    ],
    "calories": [
        "calories", "calorie", "calories (kcal)", "kcal", "energy", "energy_kcal",
        "energy (kcal)", "cal"
    ],
    "protein_g": [
        "protein", "protein_g", "protein (g)", "protein grams", "protein(g)"
    ],
    "carbohydrates_g": [
        "carbohydrates", "carbohydrates (g)", "carbs", "carbohydrate", "carbohydrates_g",
        "carbs (g)", "carb"
    ],
    "fat_g": [
        "fat", "fat (g)", "fat_g", "fats (g)", "total_fat", "total fat"
    ],
    "fiber_g": [
        "fiber", "fiber (g)", "fibre", "fibre (g)", "dietary_fiber", "dietary fiber"
    ],
    "sugar_g": [
        "sugar", "sugar (g)", "free sugar (g)", "sugars (g)", "total sugars", "sugars"
    ],
    "sodium_mg": [
        "sodium", "sodium (mg)", "na (mg)", "salt_mg"
    ],
    "calcium_mg": [
        "calcium", "calcium (mg)", "ca (mg)"
    ],
    "iron_mg": [
        "iron", "iron (mg)", "fe (mg)"
    ],
    "vitamin_c_mg": [
        "vitamin c", "vitamin c (mg)", "vit c (mg)", "vitamin_c"
    ],
    "folate_mcg": [
        "folate", "folate (µg)", "folate (mcg)", "folate (ug)", "folate (g)", "folic_acid"
    ],
    "cholesterol_mg": [
        "cholesterol", "cholesterol (mg)"
    ],
    "category": [
        "category", "food_category", "meal_type", "type", "dish_type"
    ]
}

def clean_column_name(col: str) -> str:
    """Strip non-ascii and normalize column name."""
    col = str(col).strip()
    return re.sub(r"[^\x00-\x7F]+", "", col).strip()

def map_column(col_name: str) -> Optional[str]:
    """Map raw column name to standardized field using alias dictionary."""
    normalized = clean_column_name(col_name).lower()
    for standard_col, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if normalized == clean_column_name(alias).lower():
                return standard_col
    return None

def parse_numeric(value: Any) -> Optional[float]:
    """
    Safely parse numeric value from strings like '120 kcal', '12 g', '<5', '-', 'N/A'.
    Never silently turns missing or invalid data into 0.0.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return None
        return float(value)

    val_str = str(value).strip()
    if val_str.lower() in {"", "na", "n/a", "none", "-", "null", "nil", "?"}:
        return None

    # Handle comparisons like '<5' or '>10'
    match = re.search(r"-?\d+(?:\.\d+)?", val_str)
    if not match:
        return None
    try:
        return float(match.group())
    except (ValueError, TypeError):
        return None

def normalize_food_name(name: str) -> str:
    """
    Normalize food name: lowercase, trim, remove punctuation, collapse whitespace.
    """
    if not name:
        return ""
    cleaned = re.sub(r"[^\w\s]", " ", str(name).lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def create_source_hash(record: Dict[str, Any]) -> str:
    """Generate SHA-256 hash from normalized source fields for strict idempotency."""
    payload = json.dumps(record, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def check_nutrition_consistency(cals: Optional[float], pro: Optional[float], carb: Optional[float], fat: Optional[float]) -> str:
    """
    Check if reported calories approximately align with 4P + 4C + 9F.
    Flags WARNING if discrepancy is significant.
    """
    if cals is None or pro is None or carb is None or fat is None:
        return "VALID"
    if cals < 10:
        return "VALID"

    expected = (pro * 4.0) + (carb * 4.0) + (fat * 9.0)
    diff = abs(expected - cals)
    if diff > 120 and cals > 150:
        return "WARNING"
    return "VALID"

def discover_files(dataset_path: str) -> List[Path]:
    """Recursively discover supported data files in dataset directory."""
    root = Path(dataset_path)
    supported_extensions = {".csv", ".xlsx", ".xls", ".json", ".parquet"}
    return [f for f in root.rglob("*") if f.is_file() and f.suffix.lower() in supported_extensions]

def load_data_file(file_path: Path) -> Tuple[pd.DataFrame, int]:
    """
    Load data file into pandas with fallback error handling for unquoted commas.
    Returns (DataFrame, raw_lines_count).
    """
    ext = file_path.suffix.lower()
    raw_lines = 0

    if ext == ".csv":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_lines = sum(1 for _ in f) - 1

        try:
            # First attempt standard parse
            df = pd.read_csv(file_path, encoding="utf-8")
        except Exception:
            try:
                # Second attempt with latin-1
                df = pd.read_csv(file_path, encoding="latin-1")
            except Exception:
                # Third attempt: robust python engine skipping bad unquoted rows
                df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip", engine="python")
        return df, raw_lines

    elif ext in {".xlsx", ".xls"}:
        df = pd.read_excel(file_path)
        return df, len(df)
    elif ext == ".json":
        df = pd.read_json(file_path)
        return df, len(df)
    elif ext == ".parquet":
        df = pd.read_parquet(file_path)
        return df, len(df)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def inspect_dataset(dataset_name: str, identifier: str, local_path: str) -> Dict[str, Any]:
    """Inspect dataset schema, row counts, missing rates, and sample rows."""
    files = discover_files(local_path)
    print(f"\n============================================================")
    print(f"Dataset: {dataset_name} ({identifier})")
    print(f"Path: {local_path}")
    print(f"Discovered Files: {len(files)}")
    print(f"============================================================")

    dataset_summary = {
        "dataset_name": dataset_name,
        "kaggle_identifier": identifier,
        "download_path": local_path,
        "files": []
    }

    for f in files:
        df, raw_count = load_data_file(f)
        missing_pct = {col: round(float(df[col].isna().mean() * 100), 1) for col in df.columns}
        
        file_info = {
            "filename": f.name,
            "extension": f.suffix,
            "size_bytes": f.stat().st_size,
            "rows": len(df),
            "columns": list(df.columns),
            "column_types": {col: str(df[col].dtype) for col in df.columns},
            "missing_percentages": missing_pct,
            "sample_rows": df.head(2).to_dict(orient="records")
        }
        dataset_summary["files"].append(file_info)

        print(f"\n📁 File: {f.name} ({f.suffix}) — Size: {f.stat().st_size} bytes")
        print(f"   Rows: {len(df)} | Columns: {len(df.columns)}")
        print(f"   Columns: {', '.join(list(df.columns)[:8])}...")
        print(f"   Missing rates:")
        for c, m in list(missing_pct.items())[:6]:
            print(f"     - {c}: {m}% missing")

    return dataset_summary

def download_all_datasets() -> Dict[str, str]:
    """Download Kaggle datasets via KaggleHub and return local paths."""
    print("Initiating KaggleHub dataset downloads...")
    p1 = kagglehub.dataset_download("batthulavinay/indian-food-nutrition")
    p2 = kagglehub.dataset_download("adilshamim8/daily-food-and-nutrition-dataset")
    return {
        "batthulavinay/indian-food-nutrition": p1,
        "adilshamim8/daily-food-and-nutrition-dataset": p2
    }

def ensure_database_schema():
    """Ensure newly added columns and tables exist in database (SQLite/PostgreSQL)."""
    from sqlalchemy import text, inspect
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            # SQLite pragma column check
            res = conn.execute(text("PRAGMA table_info(foods)")).fetchall()
            if res:
                existing_cols = {r[1] for r in res}
                cols_to_add = [
                    ("canonical_name", "TEXT"),
                    ("normalized_name", "TEXT"),
                    ("description", "TEXT"),
                    ("cholesterol_mg", "FLOAT"),
                    ("magnesium_mg", "FLOAT"),
                    ("potassium_mg", "FLOAT"),
                    ("folate_mcg", "FLOAT"),
                    ("data_confidence", "VARCHAR(30) DEFAULT 'CURATED'"),
                    ("nutrition_consistency_flag", "VARCHAR(20) DEFAULT 'VALID'"),
                    ("source_count", "INTEGER DEFAULT 1")
                ]
                for c_name, c_type in cols_to_add:
                    if c_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE foods ADD COLUMN {c_name} {c_type}"))
                conn.commit()
        except Exception as e:
            print("Schema migration notice:", e)

def process_and_import(
    dry_run: bool = False,
    rebuild: bool = False
) -> Dict[str, Any]:
    """
    Main ingestion pipeline:
    DOWNLOAD -> DISCOVER -> INSPECT -> NORMALIZE -> VALIDATE -> DEDUPLICATE -> LOAD -> REPORT
    """
    paths = download_all_datasets()
    ensure_database_schema()
    db = SessionLocal()

    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "dry_run": dry_run,
        "datasets": {},
        "summary": {
            "total_records_processed": 0,
            "total_records_inserted": 0,
            "total_records_updated": 0,
            "total_duplicates_detected": 0,
            "validation_warnings": 0,
            "curated_foods_registered": 0
        }
    }

    try:
        # Step 1: Migrate existing curated foods into provenance registry
        print("\nChecking existing curated NutriVision foods...")
        existing_foods = db.query(Food).all()
        known_foods: Dict[str, Food] = {}

        for f in existing_foods:
            f.canonical_name = f.canonical_name or f.name
            f.normalized_name = f.normalized_name or normalize_food_name(f.name)
            f.data_confidence = f.data_confidence or "CURATED"
            known_foods[f.normalized_name] = f

            # Check if provenance source exists
            rec_hash = create_source_hash({
                "name": f.name,
                "calories": f.calories,
                "protein": f.protein
            })
            existing_source = db.query(FoodSource).filter(FoodSource.source_record_hash == rec_hash).first()
            if not existing_source:
                src = FoodSource(
                    food_id=f.id,
                    source_type="EXISTING_NUTRIVISION",
                    source_identifier="nutrivision/curated_indian_food_db",
                    source_file="seed_foods.py",
                    original_row_number=f.id,
                    source_record_hash=rec_hash,
                    original_data=json.dumps({
                        "name": f.name,
                        "category": f.category,
                        "calories": f.calories,
                        "protein": f.protein,
                        "bioavailability_label": f.bioavailability_label,
                        "protein_quality_score": f.protein_quality_score
                    })
                )
                if not dry_run:
                    db.add(src)
                report["summary"]["curated_foods_registered"] += 1

        if not dry_run:
            db.commit()
        print(f"✅ Existing Curated Foods Active: {len(existing_foods)}")

        # Step 2: Ingest Kaggle datasets in deterministic order
        dataset_meta = [
            ("Indian Food Nutrition", "batthulavinay/indian-food-nutrition", paths["batthulavinay/indian-food-nutrition"], 0.70),
            ("Daily Food and Nutrition", "adilshamim8/daily-food-and-nutrition-dataset", paths["adilshamim8/daily-food-and-nutrition-dataset"], 0.65)
        ]

        for ds_name, identifier, local_path, default_quality in dataset_meta:
            print(f"\nProcessing {ds_name}...")
            files = discover_files(local_path)
            ds_report = {
                "dataset_name": ds_name,
                "files_count": len(files),
                "rows_processed": 0,
                "rows_imported": 0,
                "rows_updated": 0,
                "duplicates": 0,
                "warnings": 0,
                "mapped_columns": [],
                "unmapped_columns": []
            }

            # Register Dataset Source
            if not dry_run:
                ds_reg = db.query(DatasetSource).filter(DatasetSource.kaggle_identifier == identifier).first()
                if not ds_reg:
                    ds_reg = DatasetSource(
                        dataset_name=ds_name,
                        kaggle_identifier=identifier,
                        download_path=local_path,
                        file_count=len(files),
                        status="ACTIVE"
                    )
                    db.add(ds_reg)
                    db.commit()
                    db.refresh(ds_reg)

            for f in files:
                df, raw_count = load_data_file(f)
                ds_report["rows_processed"] += len(df)
                report["summary"]["total_records_processed"] += len(df)

                # Column mapping
                col_map = {}
                for col in df.columns:
                    mapped = map_column(col)
                    if mapped:
                        col_map[col] = mapped
                        if mapped not in ds_report["mapped_columns"]:
                            ds_report["mapped_columns"].append(mapped)
                    else:
                        if col not in ds_report["unmapped_columns"]:
                            ds_report["unmapped_columns"].append(col)

                print(f"Mapped {len(col_map)}/{len(df.columns)} columns in {f.name}: {col_map}")

                for row_idx, row in df.iterrows():
                    raw_dict = row.to_dict()
                    rec_hash = create_source_hash(raw_dict)

                    # Extract mapped fields
                    food_name_raw = None
                    cals_raw = None
                    pro_raw = None
                    carb_raw = None
                    fat_raw = None
                    fib_raw = None
                    sug_raw = None
                    sod_raw = None
                    chol_raw = None
                    calc_raw = None
                    iron_raw = None
                    vit_c_raw = None
                    folate_raw = None
                    cat_raw = None

                    for col, standard in col_map.items():
                        val = row[col]
                        if standard == "food_name":
                            food_name_raw = val
                        elif standard == "calories":
                            cals_raw = parse_numeric(val)
                        elif standard == "protein_g":
                            pro_raw = parse_numeric(val)
                        elif standard == "carbohydrates_g":
                            carb_raw = parse_numeric(val)
                        elif standard == "fat_g":
                            fat_raw = parse_numeric(val)
                        elif standard == "fiber_g":
                            fib_raw = parse_numeric(val)
                        elif standard == "sugar_g":
                            sug_raw = parse_numeric(val)
                        elif standard == "sodium_mg":
                            sod_raw = parse_numeric(val)
                        elif standard == "cholesterol_mg":
                            chol_raw = parse_numeric(val)
                        elif standard == "calcium_mg":
                            calc_raw = parse_numeric(val)
                        elif standard == "iron_mg":
                            iron_raw = parse_numeric(val)
                        elif standard == "vitamin_c_mg":
                            vit_c_raw = parse_numeric(val)
                        elif standard == "folate_mcg":
                            folate_raw = parse_numeric(val)
                        elif standard == "category":
                            cat_raw = str(val).strip() if pd.notna(val) else None

                    if not food_name_raw or pd.isna(food_name_raw):
                        continue

                    food_name_str = str(food_name_raw).strip()
                    norm_name = normalize_food_name(food_name_str)
                    if not norm_name or len(norm_name) < 2:
                        continue

                    # Validation checks
                    cals = max(0.0, cals_raw) if cals_raw is not None else 0.0
                    pro = max(0.0, pro_raw) if pro_raw is not None else 0.0
                    carb = max(0.0, carb_raw) if carb_raw is not None else 0.0
                    fat = max(0.0, fat_raw) if fat_raw is not None else 0.0
                    fib = max(0.0, fib_raw) if fib_raw is not None else 0.0

                    consistency = check_nutrition_consistency(cals, pro, carb, fat)
                    if consistency == "WARNING":
                        ds_report["warnings"] += 1
                        report["summary"]["validation_warnings"] += 1

                    # Check for existing food by normalized name in memory cache or database
                    existing_food = known_foods.get(norm_name)
                    if not existing_food:
                        existing_food = db.query(Food).filter(Food.normalized_name == norm_name).first()
                        if existing_food:
                            known_foods[norm_name] = existing_food

                    if existing_food:
                        ds_report["duplicates"] += 1
                        report["summary"]["total_duplicates_detected"] += 1

                        if not dry_run:
                            # Update missing micronutrients without overwriting curated values
                            if existing_food.calcium_mg is None and calc_raw is not None:
                                existing_food.calcium_mg = calc_raw
                            if existing_food.iron_mg is None and iron_raw is not None:
                                existing_food.iron_mg = iron_raw
                            if existing_food.folate_mcg is None and folate_raw is not None:
                                existing_food.folate_mcg = folate_raw
                            if existing_food.sugar is None and sug_raw is not None:
                                existing_food.sugar = sug_raw
                            if existing_food.sodium_mg is None and sod_raw is not None:
                                existing_food.sodium_mg = sod_raw
                            if existing_food.cholesterol_mg is None and chol_raw is not None:
                                existing_food.cholesterol_mg = chol_raw

                            existing_food.source_count = (existing_food.source_count or 1) + 1

                            # Link provenance
                            src_exists = db.query(FoodSource).filter(FoodSource.source_record_hash == rec_hash).first()
                            if not src_exists:
                                db.add(FoodSource(
                                    food_id=existing_food.id,
                                    source_type="KAGGLE",
                                    source_identifier=identifier,
                                    source_file=f.name,
                                    original_row_number=int(row_idx) + 1,
                                    source_record_hash=rec_hash,
                                    original_data=json.dumps(raw_dict, default=str)
                                ))
                        ds_report["rows_updated"] += 1
                        report["summary"]["total_records_updated"] += 1

                    else:
                        # New canonical food insertion
                        bio_score = default_quality
                        bio_label = "High" if bio_score >= 0.8 else ("Medium" if bio_score >= 0.6 else "Plant-based (Low)")

                        new_food = Food(
                            name=food_name_str,
                            canonical_name=food_name_str,
                            normalized_name=norm_name,
                            category=cat_raw or "Indian Traditional",
                            serving_size="100g",
                            serving_weight_g=100.0,
                            calories=round(cals, 1),
                            protein=round(pro, 1),
                            carbohydrates=round(carb, 1),
                            fat=round(fat, 1),
                            fiber=round(fib, 1),
                            sugar=sug_raw,
                            sodium_mg=sod_raw,
                            cholesterol_mg=chol_raw,
                            calcium_mg=calc_raw,
                            iron_mg=iron_raw,
                            vitamin_c_mg=vit_c_raw,
                            folate_mcg=folate_raw,
                            protein_quality_score=bio_score,
                            bioavailability_label=bio_label,
                            price_estimate=35.0,
                            data_confidence="SOURCE_IMPORTED",
                            nutrition_consistency_flag=consistency,
                            source_count=1
                        )
                        known_foods[norm_name] = new_food

                        if not dry_run:
                            db.add(new_food)
                            db.flush()  # Obtain new_food.id

                            db.add(FoodSource(
                                food_id=new_food.id,
                                source_type="KAGGLE",
                                source_identifier=identifier,
                                source_file=f.name,
                                original_row_number=int(row_idx) + 1,
                                source_record_hash=rec_hash,
                                original_data=json.dumps(raw_dict, default=str)
                            ))

                        ds_report["rows_imported"] += 1
                        report["summary"]["total_records_inserted"] += 1

            if not dry_run:
                db.commit()
                # Update registry row count
                ds_reg = db.query(DatasetSource).filter(DatasetSource.kaggle_identifier == identifier).first()
                if ds_reg:
                    ds_reg.row_count = ds_report["rows_imported"] + ds_report["rows_updated"]
                    ds_reg.metadata_json = json.dumps({
                        "mapped_columns": ds_report["mapped_columns"],
                        "unmapped_columns": ds_report["unmapped_columns"],
                        "warnings": ds_report["warnings"],
                        "duplicates": ds_report["duplicates"]
                    })
                    db.commit()

            report["datasets"][identifier] = ds_report

        print("\nSaving dataset import report to:", REPORT_FILE)
        with open(REPORT_FILE, "w", encoding="utf-8") as rf:
            json.dump(report, rf, indent=2)

    finally:
        db.close()

    print_import_summary(report)
    return report

def print_import_summary(report: Dict[str, Any]):
    """Pretty-print the standardized import report."""
    print("\n" + "=" * 60)
    print("🌿 NutriVision AI — Kaggle Nutrition Dataset Ingestion Report")
    print("=" * 60)
    print(f"Execution Mode: {'DRY RUN (No database writes committed)' if report['dry_run'] else 'PRODUCTION IMPORT'}")
    print(f"Timestamp:      {report['timestamp']}")
    print("-" * 60)

    for ident, d in report["datasets"].items():
        print(f"Dataset:         {d['dataset_name']} ({ident})")
        print(f"Files Found:     {d['files_count']}")
        print(f"Rows Processed:  {d['rows_processed']}")
        print(f"Rows Imported:   {d['rows_imported']}")
        print(f"Rows Updated:    {d['rows_updated']}")
        print(f"Duplicates:      {d['duplicates']}")
        print(f"Validation Warn: {d['warnings']}")
        print("-" * 60)

    s = report["summary"]
    print("AGGREGATE TOTALS:")
    print(f"  Total Records Processed:     {s['total_records_processed']}")
    print(f"  Total New Foods Inserted:    {s['total_records_inserted']}")
    print(f"  Existing Records Enriched:   {s['total_records_updated']}")
    print(f"  Curated Baseline Foods:      {s['curated_foods_registered']}")
    print(f"  Duplicates Detected:         {s['total_duplicates_detected']}")
    print(f"  Validation Warnings:         {s['validation_warnings']}")
    print("=" * 60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="NutriVision AI Kaggle Nutrition Ingestion Pipeline")
    parser.add_argument("--inspect", action="store_true", help="Inspect dataset files, row counts, and schema dtypes")
    parser.add_argument("--dry-run", action="store_true", help="Execute normalization & validation pipeline without DB writes")
    parser.add_argument("--import", dest="do_import", action="store_true", help="Execute live database import & provenance logging")
    parser.add_argument("--report", action="store_true", help="Display previous dataset import report")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild imported nutrition records")

    args = parser.parse_args()

    if args.report:
        if REPORT_FILE.exists():
            with open(REPORT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            print_import_summary(data)
        else:
            print("No previous report found at:", REPORT_FILE)
        return

    if args.inspect:
        paths = download_all_datasets()
        inspect_dataset("Indian Food Nutrition", "batthulavinay/indian-food-nutrition", paths["batthulavinay/indian-food-nutrition"])
        inspect_dataset("Daily Food and Nutrition", "adilshamim8/daily-food-and-nutrition-dataset", paths["adilshamim8/daily-food-and-nutrition-dataset"])
        return

    if args.dry_run:
        process_and_import(dry_run=True, rebuild=args.rebuild)
        return

    if args.do_import:
        process_and_import(dry_run=False, rebuild=args.rebuild)
        return

    # Default if no arguments provided: print help
    parser.print_help()

if __name__ == "__main__":
    main()
