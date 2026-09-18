import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Food } from "../../types";
import { FoodModal } from "../../components/FoodModal/FoodModal";
import {
  Search,
  Sparkles,
  Filter,
  Plus,
  ArrowRight,
  Check,
  Zap,
  Info,
  CheckCircle2
} from "lucide-react";

export const FoodLog: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [highProteinOnly, setHighProteinOnly] = useState<boolean>(false);
  const [lowCalOnly, setLowCalOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Natural language parsing state
  const [naturalText, setNaturalText] = useState<string>("2 rotis, 100g paneer and a bowl of dal");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const categories = ["All", "Bread", "Dal", "Curry", "Rice", "Dairy", "South Indian", "Snack", "Non-Veg", "Health Food"];

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await api.getFoods({
        query: searchQuery || undefined,
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        high_protein: highProteinOnly,
        low_calorie: lowCalOnly,
        limit: 80
      });
      setFoods(res.data);
    } catch (e) {
      console.error("Foods fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFoods();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, highProteinOnly, lowCalOnly]);

  const handleParseNaturalMeal = async () => {
    if (!naturalText.trim()) return;
    setIsParsing(true);
    try {
      const res = await api.parseMealText(naturalText);
      setParsedResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLogParsedMeal = async () => {
    if (!parsedResult || !parsedResult.parsed_items.length) return;
    try {
      await api.createMeal({
        meal_type: "LUNCH",
        notes: `Smart Log: "${naturalText}"`,
        items: parsedResult.parsed_items.map((it: any) => ({
          food_id: it.food_id,
          quantity: it.quantity,
          serving_unit: it.unit
        }))
      });
      setParsedResult(null);
      setNaturalText("");
      setLogSuccessMessage("Meal successfully logged to your daily tracker! ✅");
      setTimeout(() => setLogSuccessMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <h1 className="font-heading font-extrabold text-3xl text-slate-900 tracking-tight">
          Food Database & Meal Logger 🍛
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search over 1,730+ verified Indian foods with true bioavailability scores or use conversational natural language logging.
        </p>
      </div>

      {logSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {logSuccessMessage}
        </div>
      )}

      {/* Smart Natural Language Meal Logger Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Smart Natural Language Meal Logger
          </h3>
        </div>
        <p className="text-sm text-slate-600">
          Describe what you ate in plain language. Gemini parses items and portions, and grounds the nutrition in verified database values.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={naturalText}
            onChange={(e) => setNaturalText(e.target.value)}
            placeholder="e.g. 2 rotis, 100g paneer and a bowl of dal"
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
          <button
            onClick={handleParseNaturalMeal}
            disabled={isParsing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {isParsing ? "Parsing with Gemini..." : <><Sparkles className="w-4 h-4" /> Parse Meal</>}
          </button>
        </div>

        {/* Parsed Result Preview */}
        {parsedResult && (
          <div className="mt-4 p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-blue-200">
              <span className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Foods Confirmation
              </span>
              <span className="font-mono text-xs text-slate-700">
                Total: <strong className="text-slate-900">{parsedResult.total_calories} kcal</strong> • P: <strong className="text-blue-700">{parsedResult.total_protein}g</strong>
              </span>
            </div>

            <div className="space-y-2">
              {parsedResult.parsed_items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white border border-blue-100">
                  <span className="text-slate-900 font-medium text-sm">{it.food_name} × {it.quantity} {it.unit}</span>
                  <span className="font-mono text-slate-600 font-semibold">{it.matched_calories} kcal • P:{it.matched_protein}g</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogParsedMeal}
              className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Confirm & Log to Today's Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian foods (e.g. Paneer, Roti, Dal, Chicken, Sprouts...)"
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setHighProteinOnly(!highProteinOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                highProteinOnly ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              High Protein (&gt;10g)
            </button>
            <button
              onClick={() => setLowCalOnly(!lowCalOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                lowCalOnly ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Low Calorie (&lt;150 kcal)
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {foods.map((food) => (
          <div
            key={food.id}
            onClick={() => setSelectedFood(food)}
            className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-3xl group-hover:scale-105 transition-transform">{food.emoji || "🍛"}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {Math.round(food.protein_quality_score * 100)}% Bio
                </span>
              </div>

              <h4 className="font-heading font-bold text-base text-slate-900 mt-2.5 group-hover:text-blue-600 transition-colors">
                {food.name}
              </h4>
              {food.regional_name && (
                <span className="text-xs text-slate-500 block truncate">{food.regional_name}</span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <strong className="text-slate-900 font-mono text-sm">{food.calories}</strong> <span className="text-slate-400">kcal</span>
                <span className="text-blue-600 ml-2 font-mono font-semibold">P: {food.protein}g</span>
              </div>
              <span className="text-emerald-700 font-mono font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded">₹{food.price_estimate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Food Log Modal */}
      {selectedFood && (
        <FoodModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onLogMeal={async (food, qty, mealType) => {
            await api.createMeal({
              meal_type: mealType,
              items: [{ food_id: food.id, quantity: qty, serving_unit: food.serving_size }]
            });
            setLogSuccessMessage(`${food.name} added to your daily log! ✅`);
            setTimeout(() => setLogSuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
export default FoodLog;
