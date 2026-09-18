from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True, nullable=False)
    canonical_name = Column(String(200), index=True, nullable=True)
    normalized_name = Column(String(200), index=True, nullable=False)
    regional_name = Column(String(150), default="")
    category = Column(String(100), index=True, default="General")
    serving_size = Column(String(100), default="100g")
    serving_weight_g = Column(Float, default=100.0)
    emoji = Column(String(10), default="🍲")
    description = Column(Text, default="")
    
    # Macros per serving / 100g
    calories = Column(Float, index=True, default=0.0)
    protein = Column(Float, index=True, default=0.0)
    carbohydrates = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)
    sugar = Column(Float, nullable=True, default=None)
    sodium_mg = Column(Float, nullable=True, default=None)
    cholesterol_mg = Column(Float, nullable=True, default=None)
    
    # Micronutrients per serving / 100g (NULL if not in source; no fabrication)
    calcium_mg = Column(Float, nullable=True, default=None)
    iron_mg = Column(Float, nullable=True, default=None)
    magnesium_mg = Column(Float, nullable=True, default=None)
    potassium_mg = Column(Float, nullable=True, default=None)
    vitamin_a_mcg = Column(Float, nullable=True, default=None)
    vitamin_c_mg = Column(Float, nullable=True, default=None)
    vitamin_d_iu = Column(Float, nullable=True, default=None)
    b12_mcg = Column(Float, nullable=True, default=None)
    folate_mcg = Column(Float, nullable=True, default=None)
    omega_3_g = Column(Float, nullable=True, default=None)
    
    # Classification & Dietary Flags
    vegetarian = Column(Boolean, default=True)
    vegan = Column(Boolean, default=False)
    contains_egg = Column(Boolean, default=False)
    common_allergens = Column(String(250), default="")
    
    # Bioavailability and Protein Quality
    protein_quality_score = Column(Float, default=0.5)  # 0.40 to 1.0
    bioavailability_label = Column(String(20), default="Medium")  # High, Medium, Low
    
    # Economics & Provenance
    price_estimate = Column(Float, nullable=True, default=20.0)  # INR per serving
    data_confidence = Column(String(30), default="CURATED")  # CURATED, SOURCE_IMPORTED, USER_ENTERED
    nutrition_consistency_flag = Column(String(20), default="VALID")  # VALID, WARNING, REVIEW
    source_count = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sources = relationship("FoodSource", back_populates="food", cascade="all, delete-orphan")

    @property
    def effective_protein(self) -> float:
        score = self.protein_quality_score if self.protein_quality_score is not None else 0.5
        return round((self.protein or 0.0) * score, 1)

    @property
    def protein_per_rupee(self) -> float:
        if self.price_estimate and self.price_estimate > 0:
            return round((self.protein or 0.0) / self.price_estimate, 2)
        return 0.0

    @property
    def protein_density_ratio(self) -> float:
        # Grams of protein per 100 kcal
        if self.calories and self.calories > 0:
            return round(((self.protein or 0.0) / self.calories) * 100.0, 2)
        return 0.0

# Composite indexes for high-speed queries
Index("idx_foods_protein_calories", Food.protein, Food.calories)
Index("idx_foods_normalized_name", Food.normalized_name)
Index("idx_foods_category", Food.category)
