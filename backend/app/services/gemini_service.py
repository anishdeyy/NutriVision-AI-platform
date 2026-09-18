import json
import re
import httpx
from typing import Dict, Any, List, Optional
from backend.app.config import settings

class GeminiService:
    def __init__(self):
        api_key = settings.GEMINI_API_KEY.get_secret_value() if hasattr(settings.GEMINI_API_KEY, "get_secret_value") else str(settings.GEMINI_API_KEY)
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        self.api_key = api_key
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def _call_gemini_api(self, prompt: str, system_instruction: Optional[str] = None, json_mode: bool = True) -> str:
        models_to_try = [
            self.model,
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.6-flash"
        ]
        # Deduplicate while preserving order
        seen = set()
        candidate_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        
        last_error = None
        for model in candidate_models:
            url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"
            payload: Dict[str, Any] = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.2,
                    "topP": 0.85,
                    "maxOutputTokens": 2048,
                }
            }
            
            if json_mode:
                payload["generationConfig"]["responseMimeType"] = "application/json"

            if system_instruction:
                payload["systemInstruction"] = {
                    "role": "system",
                    "parts": [{"text": system_instruction}]
                }

            async with httpx.AsyncClient(timeout=45.0) as client:
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code != 200:
                        if json_mode:
                            payload["generationConfig"].pop("responseMimeType", None)
                            retry_resp = await client.post(url, json=payload)
                            if retry_resp.status_code == 200:
                                data = retry_resp.json()
                                return data["candidates"][0]["content"]["parts"][0]["text"]
                        last_error = Exception(f"Gemini API returned status {response.status_code}: {response.text}")
                        # Try next fallback model
                        continue
                    
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as e:
                    last_error = e
                    continue

        print(f"[GeminiService Error]: All fallback models failed. Last error: {last_error}")
        raise last_error

    def _extract_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        try:
            return json.loads(text)
        except Exception:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end+1])
                except:
                    pass
            start_arr = text.find("[")
            end_arr = text.rfind("]")
            if start_arr != -1 and end_arr != -1:
                try:
                    return json.loads(text[start_arr:end_arr+1])
                except:
                    pass
            return {
                "answer": text,
                "recommendations": [],
                "clarifying_questions": [],
                "limitations": ["Output could not be fully parsed into structured schema."]
            }

    async def generate_nutrition_advice(
        self,
        user_message: str,
        user_context: Dict[str, Any],
        retrieved_evidence: str,
        conversation_history: List[Dict[str, str]],
        candidate_foods: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-variable reasoning connecting user metrics + food DB + retrieved knowledge.
        Enforces medical safety, structured response schema, and database-grounded values.
        """
        system_instruction = """
You are NutriVision AI, an advanced evidence-grounded AI Nutrition Intelligence Analyst.
You are helping Indian diet followers optimize their health, body composition, and nutrition.

CORE PRINCIPLES & ATTRIBUTION RULES:
1. Zero Nutrition Fabrication: Never invent numerical macro or calorie values. When citing specific foods, use the exact values from CANDIDATE FOODS (PostgreSQL Database).
2. Clear Source Attribution:
   - For food nutritional values, attribute to: "NutriVision Food Database (Kaggle Dataset)".
   - For physiological mechanisms and guidelines, attribute to: "Scientific Evidence (ICMR-NIN, FAO, PubMed)".
   - NEVER call Kaggle food rows "scientific evidence" unless backed by clinical literature.
3. Multi-Metric Reasoning: Synthesize Goal + Targets + Current Deficit + Budget + Bioavailability simultaneously.
4. Medical Safety: Never diagnose disease or prescribe drugs. Distinguish dietary guidance from clinical medical care.
5. Clarifying Questions: If crucial data is missing, offer 1-2 targeted clarifying questions.

REQUIRED JSON OUTPUT FORMAT:
{
  "answer": "Clear, evidence-grounded analysis connecting user metrics with database food choices.",
  "recommendations": [
    {
      "title": "Actionable strategy title",
      "why": "Scientific rationale combining user variables and nutritional mechanisms",
      "nutrition_impact": {
        "calories": 220,
        "protein": 22,
        "carbs": 14,
        "fat": 8,
        "fiber": 5
      },
      "how_to_implement": "Specific practical food choices and verified portions",
      "time_horizon": "Today",
      "confidence": "High"
    }
  ],
  "clarifying_questions": ["Question 1 (if needed)"],
  "limitations": ["Dietary estimate based on verified database; individual metabolic absorption varies."]
}
"""

        prompt = f"""
USER CONTEXT:
- Age: {user_context.get('age', 25)} yrs, Gender: {user_context.get('gender', 'male')}
- Height: {user_context.get('height_cm', 170)} cm, Weight: {user_context.get('weight_kg', 70)} kg (BMI: {user_context.get('bmi', 24.2)})
- Goal: {user_context.get('goal', 'MAINTAIN')}, Diet: {user_context.get('diet_type', 'VEGETARIAN')}
- Daily Targets: Calories {user_context.get('daily_calorie_target', 2000)} kcal, Protein {user_context.get('protein_target', 100)}g, Carbs {user_context.get('carb_target', 250)}g, Fat {user_context.get('fat_target', 65)}g, Fiber {user_context.get('fiber_target', 30)}g
- Today's Consumed: Calories {user_context.get('today_calories', 0)} kcal, Protein {user_context.get('today_protein', 0)}g
- Remaining Needed: Calories {max(0, user_context.get('daily_calorie_target', 2000) - user_context.get('today_calories', 0))} kcal, Protein {max(0.0, user_context.get('protein_target', 100) - user_context.get('today_protein', 0))}g
- Budget: ₹{user_context.get('budget_per_day', 150)}/day, Region: {user_context.get('region', 'North Indian')}
- Allergies/Preferences: {user_context.get('allergies', 'None')}

VERIFIED CANDIDATE FOODS FROM DATABASE (USE THESE EXACT NUMBERS):
{json.dumps(candidate_foods[:25], indent=2) if candidate_foods else 'Use standard verified Indian food database items.'}

RETRIEVED SCIENTIFIC EVIDENCE (ICMR-NIN / PUBMED / FAO GUIDELINES):
{retrieved_evidence if retrieved_evidence else 'Standard ICMR-NIN guidelines apply.'}

CONVERSATION HISTORY:
{json.dumps(conversation_history[-4:], indent=2) if conversation_history else 'New consultation.'}

USER'S INQUIRY:
"{user_message}"

Respond strictly with valid JSON conforming to the schema.
"""
        raw_output = await self._call_gemini_api(prompt, system_instruction=system_instruction, json_mode=True)
        return self._extract_json(raw_output)

    async def recommend_grounded_foods(
        self,
        user_profile: Dict[str, Any],
        remaining_targets: Dict[str, Any],
        candidate_foods: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Selects and ranks candidate foods from the PostgreSQL database to fulfill remaining targets.
        Gemini never fabricates numerical values; numbers come strictly from the provided candidate list.
        """
        system_instruction = """
You are NutriVision AI Recommender. Select the top 3 best meal options from the provided CANDIDATE FOODS to fulfill the user's remaining nutritional targets.
Do NOT invent food items or alter their calories, protein, or cost. Use the exact numbers from the candidates.
Attribute nutrition values to: "NutriVision Food Database (Kaggle Dataset)".
"""
        prompt = f"""
USER PROFILE:
- Goal: {user_profile.get('goal')}, Diet: {user_profile.get('diet_type')}, Budget: ₹{user_profile.get('budget_per_day')}/day

REMAINING TARGETS:
- Calories remaining: {remaining_targets.get('calories')} kcal
- Protein remaining: {remaining_targets.get('protein')}g
- Fiber remaining: {remaining_targets.get('fiber')}g

VERIFIED CANDIDATE FOODS:
{json.dumps(candidate_foods, indent=2)}

Return a JSON object:
{{
  "recommendations": [
    {{
      "food_name": "Food Name from candidates",
      "serving": "Portion size",
      "calories": 150.0,
      "protein": 15.0,
      "why_recommended": "Reasoning based on budget, bioavailable protein, and remaining deficit."
    }}
  ]
}}
"""
        raw = await self._call_gemini_api(prompt, system_instruction=system_instruction, json_mode=True)
        return self._extract_json(raw)

    async def parse_natural_language_meal(self, text: str, available_foods: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extracts food names and serving quantities from natural text and matches them against database food items.
        """
        food_catalog_sample = [
            {"id": f.get("id"), "name": f.get("name"), "unit": f.get("serving_size") or f.get("serving_unit", "100g")}
            for f in available_foods[:80]
        ]
        
        prompt = f"""
Given the user's meal description: "{text}"
Match each mentioned item to the closest food item in this Indian food database:
{json.dumps(food_catalog_sample)}

Return a JSON array of matches:
[
  {{
    "food_id": 19,
    "food_name": "Paneer Butter Masala",
    "quantity": 1.0,
    "unit": "bowl",
    "confidence": 0.95
  }}
]
"""
        raw = await self._call_gemini_api(prompt, json_mode=True)
        result = self._extract_json(raw)
        return result if isinstance(result, list) else []

    async def parse_natural_language_profile(self, prompt_text: str) -> Dict[str, Any]:
        """
        Parses unconstrained user bio text into structured profile variables.
        """
        prompt = f"""
Extract nutritional profile attributes from this user description:
"{prompt_text}"

Return JSON matching this exact structure:
{{
  "age": 25,
  "gender": "male",
  "height_cm": 175.0,
  "weight_kg": 74.0,
  "goal": "BULKING",
  "diet_type": "EGGETARIAN",
  "activity_level": "MODERATE",
  "budget_per_day": 200.0,
  "region": "North Indian",
  "allergies": "None"
}}
Omit keys that are not mentioned in the text. Valid goals: CUTTING, MAINTAIN, BULKING, GENERAL_HEALTH.
Valid diets: VEGETARIAN, EGGETARIAN, VEGAN, NON_VEGETARIAN.
"""
        raw = await self._call_gemini_api(prompt, json_mode=True)
        return self._extract_json(raw)

gemini_service = GeminiService()
