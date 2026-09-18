# NutriVision AI — Unified Nutrition Data Dictionary

This document defines the schema, units, normalization transformations, validation rules, and confidence classifications for all nutrition entities in NutriVision AI.

---

## 1. Core Principles

1. **Zero Fabrication Policy**: If a dataset or source does not provide a specific micronutrient (e.g. Vitamin B12, Folate, Iron), it is preserved as `NULL`. Under no circumstances are missing micronutrients replaced with random or generated values.
2. **Separation of Evidence and Data**:
   - **Structured Food Records**: Stored in PostgreSQL / SQLite (`foods`, `food_sources`, `dataset_sources`). Attributed to `"NutriVision Food Database (Kaggle Dataset)"` or `"Curated Baseline"`.
   - **Scientific Research**: Stored in the vector/RAG knowledge base (`knowledge_base/documents`). Attributed to peer-reviewed sources (`ICMR-NIN`, `FAO/WHO`, `PubMed`).
3. **Strict Lineage & Idempotency**: Every imported row generates a deterministic SHA-256 hash stored in `food_sources` alongside its raw JSON representation.

---

## 2. Table: `foods`

| Field | Type | Unit | Default | Missing Value Behavior | Description & Validation |
|---|---|---|---|---|---|
| `id` | `INTEGER` | — | Auto | Non-null primary key | Unique canonical food identifier |
| `name` | `VARCHAR(200)` | — | Required | Error | Display name of the dish / food item |
| `canonical_name` | `VARCHAR(200)` | — | `name` | Falls back to `name` | Clean standardized reference name |
| `normalized_name` | `VARCHAR(200)` | — | Indexed | Lowercase trimmed | Normalized slug for deduplication (alphanumeric lowercase) |
| `regional_name` | `VARCHAR(150)` | — | `""` | `""` | Native language or regional moniker (e.g. "Roti / Chapati") |
| `category` | `VARCHAR(100)` | — | `"General"` | `"General"` | Dish categorization (Grains, Dairy, Legumes, Traditional) |
| `serving_size` | `VARCHAR(100)` | — | `"100g"` | `"100g"` | Standard portion reference unit |
| `serving_weight_g` | `FLOAT` | Grams (g) | `100.0` | `100.0` | Gram weight of a standard serving |
| `calories` | `FLOAT` | Kilocalories (kcal) | `0.0` | Required $\ge 0$ | Total metabolizable energy per serving |
| `protein` | `FLOAT` | Grams (g) | `0.0` | Required $\ge 0$ | Total unadjusted raw protein |
| `carbohydrates` | `FLOAT` | Grams (g) | `0.0` | $\ge 0$ | Total available carbohydrates |
| `fat` | `FLOAT` | Grams (g) | `0.0` | $\ge 0$ | Total lipid content |
| `fiber` | `FLOAT` | Grams (g) | `0.0` | $\ge 0$ | Total dietary fiber |
| `sugar` | `FLOAT` | Grams (g) | `NULL` | Preserved as `NULL` | Free and intrinsic sugars |
| `sodium_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Elemental sodium content |
| `cholesterol_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Dietary cholesterol |
| `calcium_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Bioavailable and non-bioavailable calcium |
| `iron_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Total elemental iron (heme + non-heme) |
| `magnesium_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Magnesium |
| `potassium_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Potassium |
| `vitamin_a_mcg` | `FLOAT` | Micrograms (µg) | `NULL` | Preserved as `NULL` | Vitamin A (RAE) |
| `vitamin_c_mg` | `FLOAT` | Milligrams (mg) | `NULL` | Preserved as `NULL` | Ascorbic acid |
| `vitamin_d_iu` | `FLOAT` | International Units | `NULL` | Preserved as `NULL` | Ergocalciferol / Cholecalciferol |
| `b12_mcg` | `FLOAT` | Micrograms (µg) | `NULL` | Preserved as `NULL` | Cobalamin |
| `folate_mcg` | `FLOAT` | Micrograms (µg) | `NULL` | Preserved as `NULL` | Dietary folate equivalents |
| `omega_3_g` | `FLOAT` | Grams (g) | `NULL` | Preserved as `NULL` | Alpha-linolenic acid (ALA) & marine fatty acids |
| `vegetarian` | `BOOLEAN` | — | `TRUE` | `TRUE` | Lacto-vegetarian compliance |
| `vegan` | `BOOLEAN` | — | `FALSE` | `FALSE` | 100% plant-based without dairy/eggs/honey |
| `contains_egg` | `BOOLEAN` | — | `FALSE` | `FALSE` | Contains avian eggs |
| `protein_quality_score` | `FLOAT` | Ratio ($0.40 - 1.0$) | `0.50` | `0.50` | DIAAS / PDCAAS bioavailability multiplier |
| `bioavailability_label` | `VARCHAR(20)` | — | `"Medium"` | `"Medium"` | Qualitative rating (`High`, `Medium`, `Plant-based (Low)`) |
| `price_estimate` | `FLOAT` | INR (₹) | `20.0` | `NULL` | Estimated retail preparation cost per portion |
| `data_confidence` | `VARCHAR(30)` | — | `"SOURCE_IMPORTED"` | `"SOURCE_IMPORTED"` | Confidence level (`CURATED`, `SOURCE_IMPORTED`, `USER_ENTERED`) |
| `nutrition_consistency_flag` | `VARCHAR(20)` | — | `"VALID"` | `"VALID"` | Energy balance heuristic flag (`VALID`, `WARNING`, `REVIEW`) |
| `source_count` | `INTEGER` | Count | `1` | `1` | Total independent datasets/records referencing this item |

---

## 3. Derived Biochemical Metrics

### Effective Bioavailable Protein
$$\text{Effective Protein (g)} = \text{protein} \times \text{protein\_quality\_score}$$
* Reflects true ileal amino acid digestibility following ICMR-NIN DIAAS protocols.

### Protein Density Ratio
$$\text{Protein Density} = \frac{\text{protein (g)}}{\text{calories (kcal)}} \times 100$$
* Measures protein yield per 100 kcal consumed. Essential for calorie-restricted cutting diets.

### Protein-per-Rupee
$$\text{Protein per Rupee} = \frac{\text{protein (g)}}{\text{price\_estimate (₹)}}$$
* Quantifies cost efficiency for student and budget-conscious meal plans.

---

## 4. Table: `food_sources` (Provenance Layer)

| Field | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `food_id` | `INTEGER` | Foreign key linking to `foods.id` (`ON DELETE CASCADE`) |
| `source_type` | `VARCHAR(50)` | `"KAGGLE"`, `"EXISTING_NUTRIVISION"`, or `"USER_ENTERED"` |
| `source_identifier` | `VARCHAR(150)` | Dataset name (e.g. `batthulavinay/indian-food-nutrition`) |
| `source_file` | `VARCHAR(200)` | Origin file within dataset (e.g. `Indian_Food_Nutrition_Processed.csv`) |
| `original_row_number` | `INTEGER` | 1-indexed row number in the source file |
| `source_record_hash` | `VARCHAR(64)` | SHA-256 checksum of raw parsed row values |
| `original_data` | `TEXT / JSONB` | Complete original key-value mapping as provided in raw file |
| `imported_at` | `DATETIME` | UTC timestamp of ingestion |

---

## 5. Table: `dataset_sources` (Registry Layer)

| Field | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `dataset_name` | `VARCHAR(150)` | Friendly title (e.g. `"Indian Food Nutrition"`) |
| `kaggle_identifier` | `VARCHAR(150)` | Kaggle Hub URI (e.g. `batthulavinay/indian-food-nutrition`) |
| `version` | `VARCHAR(50)` | Version tag or release hash |
| `download_path` | `VARCHAR(300)` | Filesystem location returned by `kagglehub.dataset_download()` |
| `downloaded_at` | `DATETIME` | UTC timestamp of download |
| `row_count` | `INTEGER` | Total rows imported / enriched |
| `file_count` | `INTEGER` | Number of data files discovered in the package |
| `status` | `VARCHAR(50)` | `"ACTIVE"`, `"PENDING"`, or `"ARCHIVED"` |
| `metadata_json` | `TEXT / JSONB` | Ingestion statistics, mapped/unmapped columns, and warning tallies |

---

## 6. Confidence Tier Definitions

1. **`CURATED`**:
   - Manually verified by nutrition data engineers against Indian Food Composition Tables (IFCT 2017) and ICMR-NIN 2024.
   - Includes verified DIAAS scores, preparation multipliers, and estimated regional pricing.
2. **`SOURCE_IMPORTED`**:
   - Ingested from external Kaggle or public repositories through the automated pipeline.
   - Verified for non-negative values and calorie consistency ($4P + 4C + 9F \approx Calories$).
   - May contain `NULL` for unrecorded micronutrients.
3. **`USER_ENTERED`**:
   - Custom food items or recipes created directly by users.
   - Isolated from platform-wide search recommendations until validated.
