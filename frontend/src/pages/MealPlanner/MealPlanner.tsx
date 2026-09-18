import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Calendar,
  IndianRupee,
  MapPin,
  Sparkles,
  ShoppingBag,
  Flame,
  Dna,
  ChevronRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export const MealPlanner: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [days, setDays] = useState<number>(7);
  const [budget, setBudget] = useState<number>(150);
  const [region, setRegion] = useState<string>("North Indian");
  const [plan, setPlan] = useState<any | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const regionalOptions = [
    "North Indian",
    "South Indian",
    "Punjabi",
    "Bengali",
    "Gujarati",
    "Maharashtrian",
    "Kerala",
    "Tamil",
    "Andhra",
    "Rajasthani"
  ];

  const budgetPresets = [
    { label: "Ultra Budget", value: 100, desc: "Dal, Soya, Eggs/Sprouts, Seasonal Greens" },
    { label: "Smart Value", value: 150, desc: "Paneer/Eggs, Curd, Pulses, Multi-millet" },
    { label: "Optimal Pro", value: 200, desc: "High-protein dairy, Tofu/Chicken, Nuts" },
    { label: "Performance", value: 300, desc: "Greek yogurt, Whey, Quality lean sources" }
  ];

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.generateMealPlan(days, budget, region);
      setPlan(res.data);
      setActiveDayIndex(0);
    } catch (err: any) {
      console.error("Meal plan generation error:", err);
      setError(err.response?.data?.detail || "Failed to generate plan. Please verify profile targets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      if (profile.budget_per_day) setBudget(profile.budget_per_day);
      if (profile.region) setRegion(profile.region);
      handleGeneratePlan();
    }
  }, [profile]);

  const activeDay = plan?.days?.[activeDayIndex];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7c5cfc]/20 text-[#a78bfa] border border-[#7c5cfc]/30">
              AI Evidence-Grounded Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3b9eff]/20 text-[#3b9eff] border border-[#3b9eff]/30">
              ICMR-NIN Compliant
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#3b9eff]" />
            Personalized Meal Planner
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Optimized for {profile?.goal?.replace("_", " ") || "Health"} · {profile?.diet_type?.replace("_", " ") || "Diet"} · DIAAS Bioavailability
          </p>
        </div>

        {plan && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sessionStorage.setItem("nv_active_plan", JSON.stringify(plan));
                navigate("/grocery");
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a0]/20 to-[#3b9eff]/20 border border-[#00e5a0]/40 text-[#00e5a0] hover:text-white hover:border-[#00e5a0] transition-all font-semibold text-sm flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Generate Grocery Checklist
            </button>
          </div>
        )}
      </div>

      {/* Control Configuration Bar */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Plan Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    days === d
                      ? "bg-[#3b9eff] border-[#3b9eff] text-white shadow-md shadow-[#3b9eff]/20"
                      : "bg-[#080c18] border-[rgba(80,130,200,0.2)] text-slate-300 hover:border-[#3b9eff]/40"
                  }`}
                >
                  {d} {d === 1 ? "Day" : "Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Mode Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Budget Per Day (₹)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {budgetPresets.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBudget(b.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    budget === b.value
                      ? "bg-[#00e5a0] border-[#00e5a0] text-black shadow-md shadow-[#00e5a0]/20"
                      : "bg-[#080c18] border-[rgba(80,130,200,0.2)] text-slate-300 hover:border-[#00e5a0]/40"
                  }`}
                >
                  ₹{b.value}
                </button>
              ))}
            </div>
          </div>

          {/* Regional Preset Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Regional Cuisine
            </label>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.3)] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
              >
                {regionalOptions.map((r) => (
                  <option key={r} value={r} className="bg-[#080c18] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[rgba(80,130,200,0.1)]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-[#7c5cfc]" />
            AI combines local food market pricing with leucine-timed nutrient density.
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#3b9eff] hover:bg-[#2b88e8] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3b9eff]/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate Plan
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Plan Details & Overview */}
      {plan && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-xs text-slate-400 uppercase">Avg Calories / Day</div>
              <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-1">
                {plan.average_daily_calories} <span className="text-xs text-slate-400">kcal</span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-xs text-slate-400 uppercase">Avg Protein / Day</div>
              <div className="text-2xl font-bold text-[#3b9eff] mt-1 flex items-baseline gap-1">
                {plan.average_daily_protein} <span className="text-xs text-slate-400">g</span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-xs text-slate-400 uppercase">Avg Cost / Day</div>
              <div className="text-2xl font-bold text-[#00e5a0] mt-1 flex items-baseline gap-1">
                ₹{plan.average_daily_cost} <span className="text-xs text-slate-400">/ day</span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-xs text-slate-400 uppercase">Dietary Alignment</div>
              <div className="text-sm font-semibold text-[#a78bfa] mt-1 truncate">
                {plan.region_mode} · {plan.duration_days}D
              </div>
            </div>
          </div>

          {/* Days Tabs */}
          {plan.days?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {plan.days.map((d: any, idx: number) => (
                <button
                  key={d.day_number}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    activeDayIndex === idx
                      ? "bg-[#3b9eff]/20 border-[#3b9eff] text-white"
                      : "bg-[#080c18] border-[rgba(80,130,200,0.15)] text-slate-400 hover:text-white"
                  }`}
                >
                  {d.day_name}
                  <span className="ml-2 text-xs opacity-75">({Math.round(d.total_calories)} kcal)</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Day View */}
          {activeDay && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    {activeDay.day_name} Schedule
                  </h2>
                  <p className="text-xs text-slate-400">
                    Total: {Math.round(activeDay.total_calories)} kcal · {Math.round(activeDay.total_protein)}g protein · ₹{Math.round(activeDay.total_cost)} cost
                  </p>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeDay.meals?.map((meal: any, mIdx: number) => (
                  <div key={mIdx} className="glass-panel p-5 rounded-2xl space-y-4 border border-[rgba(80,130,200,0.2)]">
                    <div className="flex items-center justify-between border-b border-[rgba(80,130,200,0.1)] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b9eff]" />
                        <h3 className="font-bold text-white text-base">{meal.meal_type}</h3>
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                          <Clock className="w-3.5 h-3.5" />
                          {meal.time_hint}
                        </span>
                      </div>
                      <div className="text-xs font-semibold px-2 py-1 rounded bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30">
                        ₹{meal.meal_cost}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {meal.items?.map((item: any, iIdx: number) => (
                        <div key={iIdx} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-[#080c18]/60 border border-[rgba(80,130,200,0.1)]">
                          <div>
                            <div className="font-medium text-slate-200">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.portion}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">{Math.round(item.calories)} kcal</div>
                            <div className="text-xs font-semibold text-[#3b9eff]">{item.protein}g P</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[rgba(80,130,200,0.1)]">
                      <span>Total: {Math.round(meal.meal_calories)} kcal</span>
                      <span className="text-[#3b9eff] font-semibold">{Math.round(meal.meal_protein)}g Protein</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MealPlanner;
