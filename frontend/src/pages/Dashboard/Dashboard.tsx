import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { DailyNutritionSummary, NutritionScoreResponse, Meal, Food } from "../../types";
import { NutritionRing } from "../../components/NutritionRing/NutritionRing";
import { MacroBars } from "../../components/MacroBars/MacroBars";
import { AIInsight } from "../../components/AIInsight/AIInsight";
import { NutritionScore } from "../../components/NutritionScore/NutritionScore";
import { MealCard } from "../../components/MealCard/MealCard";
import { DailyCheckinCard } from "../../components/DailyCheckin/DailyCheckinCard";
import {
  Droplets,
  Plus,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  X,
  Flame,
  Dna,
  Wheat,
  Activity
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [scoreData, setScoreData] = useState<NutritionScoreResponse | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [whatToEatData, setWhatToEatData] = useState<any | null>(null);
  const [fixMyDayData, setFixMyDayData] = useState<any | null>(null);
  const [swapsData, setSwapsData] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Water tracking state
  const [waterLiters, setWaterLiters] = useState<number>(2.2);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, scoreRes, mealsRes] = await Promise.all([
        api.getTodaySummary(),
        api.getNutritionScore(),
        api.getMeals()
      ]);
      setSummary(sumRes.data);
      setScoreData(scoreRes.data);
      setMeals(mealsRes.data);
      if (sumRes.data.water_liters) {
        setWaterLiters(sumRes.data.water_liters);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteMeal = async (id: number) => {
    try {
      await api.deleteMeal(id);
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatToEat = async () => {
    setActionLoading(true);
    try {
      const res = await api.whatShouldIEat();
      setWhatToEatData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFixMyDay = async () => {
    setActionLoading(true);
    try {
      const res = await api.fixMyDay();
      setFixMyDayData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowSwaps = async (mealId: number) => {
    setActionLoading(true);
    try {
      const res = await api.getMealSwaps(mealId);
      setSwapsData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddWater = () => {
    setWaterLiters((prev) => Math.round((prev + 0.25) * 100) / 100);
  };

  const userName = user?.name?.split(" ")[0] || "Rahul";
  const calConsumed = summary?.calories.consumed || 2050;
  const calTarget = summary?.calories.target || 2150;
  const proConsumed = summary?.protein.consumed || 98.5;
  const proTarget = summary?.protein.target || 110;
  const fibConsumed = summary?.fiber.consumed || 26.4;
  const fibTarget = summary?.fiber.target || 30;
  const waterTarget = summary?.water_target_liters || 2.8;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Greeting Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Good morning, {userName} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[14px] text-slate-600 mt-2 font-medium">
            <span>Goal: <strong className="text-blue-600 capitalize font-semibold">{profile?.goal?.toLowerCase() || "Cutting"}</strong></span>
            <span>•</span>
            <span>Daily target: <strong className="text-slate-900 font-semibold">{calTarget.toLocaleString()} kcal</strong></span>
            <span>•</span>
            <span>Budget: <strong className="text-emerald-600 font-semibold">₹{profile?.budget_per_day || 150}/day</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/food-log"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Food
          </Link>
          <Link
            to="/ai-advisor"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" /> Ask AI Advisor
          </Link>
        </div>
      </div>

      {/* Four Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Calories</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-extrabold text-slate-900">
              {calConsumed.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {calTarget.toLocaleString()} kcal</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>Progress: {Math.round((calConsumed / Math.max(calTarget, 1)) * 100)}%</span>
              <span className="font-semibold text-emerald-600">On Track</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((calConsumed / calTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Protein</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Dna className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-extrabold text-slate-900">
              {proConsumed} <span className="text-sm font-normal text-slate-400">/ {proTarget} g</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>Progress: {Math.round((proConsumed / Math.max(proTarget, 1)) * 100)}%</span>
              <span className="font-semibold text-blue-600">89% Met</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((proConsumed / proTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fiber Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Fiber</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-extrabold text-slate-900">
              {fibConsumed} <span className="text-sm font-normal text-slate-400">/ {fibTarget} g</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>Progress: {Math.round((fibConsumed / Math.max(fibTarget, 1)) * 100)}%</span>
              <span className="font-semibold text-indigo-600">Good Pacing</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((fibConsumed / fibTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Hydration</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-heading text-3xl font-extrabold text-slate-900">
              {waterLiters} <span className="text-sm font-normal text-slate-400">/ {waterTarget} L</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>Progress: {Math.round((waterLiters / Math.max(waterTarget, 1)) * 100)}%</span>
              <button
                onClick={handleAddWater}
                className="font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
              >
                +250 ml
              </button>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((waterLiters / waterTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Macro Bars, AI Daily Intelligence, Daily Check-in */}
        <div className="lg:col-span-7 space-y-6">
          {/* Calorie Ring & Macro Bars Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-around gap-6">
            <NutritionRing
              consumed={calConsumed}
              target={calTarget}
            />

            <div className="w-full sm:flex-1">
              {summary && (
                <MacroBars
                  protein={summary.protein}
                  effectiveProtein={summary.effective_protein}
                  carbs={summary.carbs}
                  fat={summary.fat}
                  fiber={summary.fiber}
                />
              )}
            </div>
          </div>

          {/* AI Dynamic Insight Card */}
          <AIInsight
            summary={summary}
            onWhatToEat={handleWhatToEat}
            onFixMyDay={handleFixMyDay}
          />

          {/* Daily Wellness Check-in Card */}
          <DailyCheckinCard />
        </div>

        {/* Right Column: Nutrition Score & Logged Meals */}
        <div className="lg:col-span-5 space-y-6">
          <NutritionScore scoreData={scoreData} />

          {/* Today's Logged Meals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-900">Today's Meals</h3>
              <Link to="/food-log" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Full Log <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {meals.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <span className="text-4xl block mb-2">🍽</span>
                <h4 className="font-heading font-bold text-base text-slate-900">No Meals Logged Today</h4>
                <p className="text-sm text-slate-500 mt-1">Add your breakfast, lunch or evening snacks to track your targets.</p>
                <Link
                  to="/food-log"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Log First Meal
                </Link>
              </div>
            ) : (
              meals.map((m) => (
                <MealCard
                  key={m.id}
                  meal={m}
                  onDelete={handleDeleteMeal}
                  onSwap={handleShowSwaps}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: "🍽 What should I eat now?" */}
      {whatToEatData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setWhatToEatData(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 flex items-center gap-2">
              🍽 Recommended Next Options
            </h3>
            <p className="text-sm text-slate-600 mt-1">{whatToEatData.situation_summary}</p>

            <div className="mt-5 space-y-3">
              {whatToEatData.options.map((opt: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-base text-slate-900">{opt.food_name}</span>
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {opt.calories} kcal · P:{opt.protein}g
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{opt.why_selected}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: "Fix My Day Strategy" */}
      {fixMyDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setFixMyDayData(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 flex items-center gap-2">
              ⚡ Fix My Nutrition Strategy
            </h3>
            <div className="mt-2 text-sm text-slate-600 space-y-1">
              <div>Status: <strong className="text-slate-900">{fixMyDayData.current_status}</strong></div>
              <div>Gap: <strong className="text-orange-600">{fixMyDayData.protein_deficit}g protein needed</strong></div>
            </div>
            <p className="text-sm text-slate-800 mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 leading-relaxed font-medium">
              {fixMyDayData.recommended_evening_strategy}
            </p>

            <div className="mt-4 space-y-2.5">
              {fixMyDayData.action_plan_meals.map((opt: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{opt.food_name}</span>
                    <span className="text-xs text-slate-500">{opt.portion}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-900 font-bold block">{opt.calories} kcal</span>
                    <span className="text-blue-600 font-semibold">P: {opt.protein}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Meal Swaps */}
      {swapsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSwapsData(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 flex items-center gap-2">
              🔄 AI Meal Swaps
            </h3>
            <p className="text-sm text-slate-600 mt-1">Smart replacements with higher bioavailable protein or lower caloric density.</p>

            <div className="mt-4 space-y-3">
              {swapsData.map((swap: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900">{swap.name}</h4>
                    <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {swap.calories} kcal · P:{swap.protein}g
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{swap.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
