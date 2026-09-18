from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FoodBase(BaseModel):
    name: str
    canonical_name: Optional[str] = None
    normalized_name: Optional[str] = None
    regional_name: Optional[str] = ""
    category: Optional[str] = "General"
    serving_size: Optional[str] = "100g"
    serving_weight_g: Optional[float] = 100.0
    emoji: Optional[str] = "🍲"
    description: Optional[str] = ""
    calories: float
    protein: float
    carbohydrates: float
    fat: float
    fiber: Optional[float] = 0.0
    sugar: Optional[float] = None
    sodium_mg: Optional[float] = None
    cholesterol_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    iron_mg: Optional[float] = None
    magnesium_mg: Optional[float] = None
    potassium_mg: Optional[float] = None
    vitamin_a_mcg: Optional[float] = None
    vitamin_c_mg: Optional[float] = None
    vitamin_d_iu: Optional[float] = None
    b12_mcg: Optional[float] = None
    folate_mcg: Optional[float] = None
    omega_3_g: Optional[float] = None
    vegetarian: Optional[bool] = True
    vegan: Optional[bool] = False
    contains_egg: Optional[bool] = False
    common_allergens: Optional[str] = ""
    protein_quality_score: Optional[float] = 0.5
    bioavailability_label: Optional[str] = "Medium"
    price_estimate: Optional[float] = 20.0
    data_confidence: Optional[str] = "CURATED"
    nutrition_consistency_flag: Optional[str] = "VALID"
    source_count: Optional[int] = 1

class FoodCreate(FoodBase):
    pass

class FoodResponse(FoodBase):
    id: int
    effective_protein: float
    protein_per_rupee: float
    protein_density_ratio: float

    class Config:
        from_attributes = True

class FoodSourceResponse(BaseModel):
    id: int
    food_id: int
    source_type: str
    source_identifier: str
    source_file: str
    original_row_number: Optional[int] = None
    source_record_hash: str
    original_data: Dict[str, Any]
    imported_at: datetime

    class Config:
        from_attributes = True

class FoodProvenanceResponse(BaseModel):
    food_id: int
    food_name: str
    canonical_name: Optional[str]
    category: str
    data_confidence: str
    nutrition_consistency_flag: str
    source_count: int
    sources: List[FoodSourceResponse]

class DatasetSourceResponse(BaseModel):
    id: int
    dataset_name: str
    kaggle_identifier: str
    version: str
    download_path: str
    downloaded_at: datetime
    row_count: int
    file_count: int
    status: str
    metadata: Dict[str, Any]

class DataQualityResponse(BaseModel):
    total_foods: int
    curated_foods: int
    imported_foods: int
    foods_with_micronutrients: int
    foods_with_price: int
    completeness_rates: Dict[str, float]
    consistency_flags: Dict[str, int]
    source_distribution: Dict[str, int]

class FoodComparisonRequest(BaseModel):
    food_ids: List[int]

class FoodComparisonItem(BaseModel):
    id: int
    name: str
    category: str
    serving_size: str
    calories: float
    protein: float
    effective_protein: float
    carbohydrates: float
    fat: float
    fiber: float
    price_estimate: float
    protein_per_rupee: float
    protein_density_ratio: float
    bioavailability_label: str

class FoodStatsResponse(BaseModel):
    total_foods: int
    category_counts: Dict[str, int]
    avg_protein_density: float
    top_protein_per_rupee: List[FoodResponse]
    top_protein_density: List[FoodResponse]
