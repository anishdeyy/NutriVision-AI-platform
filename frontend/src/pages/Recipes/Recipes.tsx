import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ChefHat,
  Sparkles,
  Clock,
  Flame,
  Dna,
  IndianRupee,
  Plus,
  X,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export const Recipes: React.FC = () => {
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState<string[]>([
    "Paneer",
    "Spinach",
    "Tomato",
    "Onion"
  ]);
  const [ingredientInput, setIngredientInput] = useState<string>("");
  const [cookingTime, setCookingTime] = useState<number>(20);
  const [mealType, setMealType] = useState<string>("Lunch");
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [logSuccess, setLogSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const suggestedIngredients = [
    "Paneer",
    "Soya Chunks",
    "Eggs",
    "Moong Dal",
    "Greek Curd",
    "Oats",
    "Tofu",
    "Sprouts",
    "Spinach",
    "Rajma"
  ];

  const handleAddIngredient = (name: string) => {
    if (!ingredients.includes(name)) {
      setIngredients([...ingredients, name]);
    }
    setIngredientInput("");
  };

  const handleRemoveIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i !== name));
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length === 0) {
      setError("Please add at least one staple ingredient.");
      return;
    }
    setLoading(true);
    setError("");
    setLogSuccess(false);

    try {
      const res = await api.generateRecipe(ingredients, cookingTime);
      setRecipe(res.data);
    } catch (err: any) {
      console.error("Recipe generation error:", err);
      setError("Failed to create recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogAsMeal = async () => {
    if (!recipe) return;
    try {
      // Find food or create custom meal item
      await api.createMeal({
        meal_type: mealType.toUpperCase(),
        notes: `Cooked Recipe: ${recipe.recipe_name}`,
        items: [
          {
            food_id: 1, // Fallback base item
            quantity: 1,
            serving_unit: "recipe portion"
          }
        ]
      });
      setLogSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Failed to log recipe as meal:", err);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7c5cfc]/20 text-[#a78bfa] border border-[#7c5cfc]/30">
              Verified Food Intelligence
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/30">
              DIAAS Bioavailability Optimized
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-[#7c5cfc]" />
            AI Pantry Recipe Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Input whatever is in your kitchen right now. NutriVision builds high-protein, cost-effective Indian recipes.
          </p>
        </div>
      </div>

      {/* Inputs Configuration */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        {/* Ingredient Tagging */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What's in your pantry or fridge?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ingredientInput.trim()) {
                  e.preventDefault();
                  handleAddIngredient(ingredientInput.trim());
                }
              }}
              placeholder="Type ingredient (e.g., Besan, Broccoli, Paneer) and press Enter"
              className="flex-1 bg-[#080c18] border border-[rgba(80,130,200,0.3)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c5cfc]"
            />
            <button
              onClick={() => ingredientInput.trim() && handleAddIngredient(ingredientInput.trim())}
              className="px-4 py-2.5 rounded-xl bg-[#7c5cfc] hover:bg-[#6847ec] text-white font-semibold text-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">Quick staples:</span>
            {suggestedIngredients.map((s) => (
              <button
                key={s}
                onClick={() => handleAddIngredient(s)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-slate-300 hover:border-[#7c5cfc] hover:text-white transition-all cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>

          {/* Current Ingredient Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {ingredients.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7c5cfc]/15 text-[#c4b5fd] border border-[#7c5cfc]/30"
              >
                {item}
                <button
                  onClick={() => handleRemoveIngredient(item)}
                  className="hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Options: Time & Meal Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[rgba(80,130,200,0.1)]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Max Prep & Cook Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 45].map((t) => (
                <button
                  key={t}
                  onClick={() => setCookingTime(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    cookingTime === t
                      ? "bg-[#7c5cfc] border-[#7c5cfc] text-white shadow-md shadow-[#7c5cfc]/20"
                      : "bg-[#080c18] border-[rgba(80,130,200,0.2)] text-slate-300 hover:border-[#7c5cfc]/40"
                  }`}
                >
                  {t} mins
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["Breakfast", "Lunch", "Snack", "Dinner"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMealType(m)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    mealType === m
                      ? "bg-[#3b9eff] border-[#3b9eff] text-white shadow-md shadow-[#3b9eff]/20"
                      : "bg-[#080c18] border-[rgba(80,130,200,0.2)] text-slate-300 hover:border-[#3b9eff]/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerateRecipe}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#3b9eff] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7c5cfc]/25 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Inventing Healthy Recipe..." : "Generate AI Recipe"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Generated Recipe View */}
      {recipe && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(80,130,200,0.25)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
            <div>
              <div className="text-xs font-bold uppercase text-[#7c5cfc] tracking-wider mb-1">
                Verified Kitchen Protocol
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                {recipe.recipe_name}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#3b9eff]" /> {recipe.cook_time_mins} mins total
                </span>
                <span>·</span>
                <span>{recipe.servings} serving</span>
                <span>·</span>
                <span className="text-[#00e5a0] font-semibold">₹{recipe.estimated_cost_inr} est. cost</span>
              </div>
            </div>

            <button
              onClick={handleLogAsMeal}
              disabled={logSuccess}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                logSuccess
                  ? "bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/40"
                  : "bg-[#3b9eff] hover:bg-[#2b88e8] text-white shadow-lg shadow-[#3b9eff]/25"
              }`}
            >
              {logSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Added to Today's Log!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Log this Meal
                </>
              )}
            </button>
          </div>

          {/* Macro Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#080c18] p-3 rounded-xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Calories</div>
              <div className="text-lg font-bold text-white mt-0.5">{recipe.calories_per_serving}</div>
              <div className="text-[10px] text-slate-500">kcal</div>
            </div>
            <div className="bg-[#080c18] p-3 rounded-xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#3b9eff]">Protein</div>
              <div className="text-lg font-bold text-[#3b9eff] mt-0.5">{recipe.protein_per_serving}g</div>
              <div className="text-[10px] text-slate-500">Bioavailable</div>
            </div>
            <div className="bg-[#080c18] p-3 rounded-xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#ff8c42]">Carbs</div>
              <div className="text-lg font-bold text-[#ff8c42] mt-0.5">{recipe.carbs_per_serving}g</div>
              <div className="text-[10px] text-slate-500">Complex</div>
            </div>
            <div className="bg-[#080c18] p-3 rounded-xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#ff4d8d]">Fats</div>
              <div className="text-lg font-bold text-[#ff4d8d] mt-0.5">{recipe.fat_per_serving}g</div>
              <div className="text-[10px] text-slate-500">Healthy</div>
            </div>
            <div className="bg-[#080c18] p-3 rounded-xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#00e5a0]">Fiber</div>
              <div className="text-lg font-bold text-[#00e5a0] mt-0.5">{recipe.fiber_per_serving}g</div>
              <div className="text-[10px] text-slate-500">Digestive</div>
            </div>
          </div>

          {/* Ingredients & Instructions 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Ingredients Required
              </h3>
              <div className="space-y-2">
                {recipe.ingredients?.map((ing: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[#080c18] border border-[rgba(80,130,200,0.15)]"
                  >
                    <span className="text-slate-200 font-medium">{ing.item}</span>
                    <span className="text-[#3b9eff] font-bold">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Preparation Instructions
              </h3>
              <div className="space-y-2.5">
                {recipe.instructions?.map((inst: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#080c18]/80 border border-[rgba(80,130,200,0.15)] text-xs leading-relaxed text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#7c5cfc]/20 text-[#a78bfa] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <p>{inst}</p>
                  </div>
                ))}
              </div>

              {recipe.nutrition_notes && (
                <div className="p-3.5 rounded-xl bg-[#3b9eff]/10 border border-[#3b9eff]/20 text-xs text-[#93c5fd]">
                  💡 <span className="font-semibold text-white">Scientific Note:</span> {recipe.nutrition_notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Recipes;
