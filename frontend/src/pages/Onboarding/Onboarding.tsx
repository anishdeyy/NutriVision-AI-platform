import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Scale,
  Flame,
  Salad,
  IndianRupee,
  MessageSquare
} from "lucide-react";

export const Onboarding: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"stepper" | "natural">("stepper");
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<string>("male");
  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [activity, setActivity] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("CUTTING");
  const [diet, setDiet] = useState<string>("VEGETARIAN");
  const [budget, setBudget] = useState<number>(150);
  const [region, setRegion] = useState<string>("North Indian");

  // Natural language state
  const [naturalPrompt, setNaturalPrompt] = useState<string>(
    "I'm 22, 68kg, 174cm, vegetarian except eggs, looking to cut fat with a ₹150/day budget and moderate gym training."
  );
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setAge(profile.age || 25);
      setGender(profile.gender || "male");
      setHeightCm(profile.height_cm || 172);
      setWeightKg(profile.weight_kg || 70);
      setActivity(profile.activity_level || "MODERATE");
      setGoal(profile.goal || "CUTTING");
      setDiet(profile.diet_type || "VEGETARIAN");
      setBudget(profile.budget_per_day || 150);
      setRegion(profile.region || "North Indian");
    }
  }, [profile]);

  // Mifflin-St Jeor formula calculation preview
  const calculatePreview = () => {
    const bmr = gender === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const mult = activity === "VERY_ACTIVE" ? 1.725 : activity === "MODERATE" ? 1.55 : activity === "LIGHT" ? 1.375 : 1.2;
    const tdee = bmr * mult;
    const calories = goal === "CUTTING" ? Math.round(tdee - 350) : goal === "BULKING" ? Math.round(tdee + 300) : Math.round(tdee);
    const protein = Math.round(weightKg * (goal === "BULKING" ? 2.2 : goal === "CUTTING" ? 2.0 : 1.6));
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round(Math.max(50, (calories - protein * 4 - fat * 9) / 4));
    const h_m = heightCm / 100;
    const bmi = (weightKg / (h_m * h_m)).toFixed(1);

    return { calories, protein, carbs, fat, bmi };
  };

  const targets = calculatePreview();

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await api.updateProfile({
        age,
        gender,
        height_cm: heightCm,
        weight_kg: weightKg,
        activity_level: activity,
        goal,
        diet_type: diet,
        budget_per_day: budget,
        region
      });
      await refreshProfile();
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseNatural = async () => {
    setIsParsing(true);
    try {
      const res = await api.parseProfileText(naturalPrompt);
      setParsedPreview(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParsed = () => {
    if (parsedPreview) {
      if (parsedPreview.age) setAge(parsedPreview.age);
      if (parsedPreview.weight_kg) setWeightKg(parsedPreview.weight_kg);
      if (parsedPreview.height_cm) setHeightCm(parsedPreview.height_cm);
      if (parsedPreview.goal) setGoal(parsedPreview.goal.toUpperCase());
      if (parsedPreview.diet_type) setDiet(parsedPreview.diet_type.toUpperCase());
      if (parsedPreview.budget_per_day) setBudget(parsedPreview.budget_per_day);
      if (parsedPreview.region) setRegion(parsedPreview.region);
    }
    setParsedPreview(null);
    setMode("stepper");
    setStep(4); // jump to review
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-2xl mx-auto">
      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setMode("stepper")}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mode === "stepper"
              ? "bg-[#3b9eff]/20 text-[#3b9eff] border border-[#3b9eff]/40 shadow-md"
              : "text-[#a8bcd8] hover:bg-white/5"
          }`}
        >
          Guided Setup (4 Steps)
        </button>
        <button
          onClick={() => setMode("natural")}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mode === "natural"
              ? "bg-[#7c5cfc]/20 text-[#a38bff] border border-[#7c5cfc]/40 shadow-md"
              : "text-[#a8bcd8] hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ffd60a]" /> AI Natural Language Setup
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#5082c8]/25 shadow-2xl relative">
        {mode === "natural" ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#a38bff]" />
              <h2 className="font-heading font-extrabold text-xl text-white">
                Conversational Profile Input
              </h2>
            </div>
            <p className="text-xs text-[#a8bcd8] mb-4">
              Describe your body metrics, goals, dietary habits, and daily budget in plain English or Hinglish. Gemini will structure it safely with explicit confirmation.
            </p>

            <textarea
              rows={4}
              value={naturalPrompt}
              onChange={(e) => setNaturalPrompt(e.target.value)}
              placeholder="e.g. I am 21, 65kg, 5'8, vegetarian except eggs, want to lose fat, around ₹150/day..."
              className="w-full bg-black/40 border border-white/10 focus:border-[#7c5cfc] rounded-2xl p-4 text-sm text-white placeholder-[#4a6080] outline-none"
            />

            <button
              onClick={handleParseNatural}
              disabled={isParsing}
              className="mt-4 w-full py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-[#7c5cfc] to-[#3b9eff] text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isParsing ? "Extracting with Gemini..." : <><Sparkles className="w-4 h-4 text-[#ffd60a]" /> Extract & Confirm Biometrics</>}
            </button>

            {/* Confirmation Box (Section 56 requirement: Never update health data silently!) */}
            {parsedPreview && (
              <div className="mt-6 p-5 rounded-2xl bg-black/60 border border-[#7c5cfc]/40 animate-fadeIn">
                <h4 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#00e5a0]" /> We Understood:
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/5">Age: <strong className="text-white">{parsedPreview.age || "25"} yrs</strong></div>
                  <div className="p-2 rounded-lg bg-white/5">Weight: <strong className="text-white">{parsedPreview.weight_kg || "70"} kg</strong></div>
                  <div className="p-2 rounded-lg bg-white/5">Height: <strong className="text-white">{parsedPreview.height_cm || "172"} cm</strong></div>
                  <div className="p-2 rounded-lg bg-white/5">Diet: <strong className="text-white">{parsedPreview.diet_type || "VEGETARIAN"}</strong></div>
                  <div className="p-2 rounded-lg bg-white/5">Goal: <strong className="text-white">{parsedPreview.goal || "CUTTING"}</strong></div>
                  <div className="p-2 rounded-lg bg-white/5">Budget: <strong className="text-white">₹{parsedPreview.budget_per_day || "150"}/day</strong></div>
                </div>
                <p className="text-[11px] text-[#a8bcd8] mt-2 italic">
                  "{parsedPreview.explanation}"
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleConfirmParsed}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#00e5a0] text-black hover:bg-[#00c58a] transition-colors"
                  >
                    Confirm & Apply
                  </button>
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-[#a8bcd8] hover:bg-white/20 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 text-xs font-bold ${
                    step === s
                      ? "text-[#3b9eff]"
                      : step > s
                      ? "text-[#00e5a0]"
                      : "text-[#4a6080]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                      step === s
                        ? "bg-[#3b9eff]/20 border border-[#3b9eff] text-[#3b9eff]"
                        : step > s
                        ? "bg-[#00e5a0]/20 border border-[#00e5a0] text-[#00e5a0]"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span className="hidden sm:inline">
                    {s === 1 ? "Biometrics" : s === 2 ? "Goal" : s === 3 ? "Diet" : "Targets"}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Biometrics */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="font-heading font-bold text-lg text-white">Your Biometrics</h3>
                <p className="text-xs text-[#a8bcd8]">Used for Mifflin-St Jeor metabolic energy equations.</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#0a1023] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Height (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Weight (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Physical Activity Level</label>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full bg-[#0a1023] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                  >
                    <option value="SEDENTARY">Sedentary (desk job, minimal exercise)</option>
                    <option value="LIGHT">Light Active (1-2 workouts/week)</option>
                    <option value="MODERATE">Moderate (3-5 workouts/week)</option>
                    <option value="VERY_ACTIVE">Very Active (heavy training / sports)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Goal */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="font-heading font-bold text-lg text-white">Your Nutritional Goal</h3>
                <p className="text-xs text-[#a8bcd8]">We optimize your caloric deficit/surplus and protein pacing accordingly.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "CUTTING", label: "Cutting (Fat Loss)", desc: "-350 kcal deficit with high protein density", icon: "🔥" },
                    { id: "MAINTAIN", label: "Maintenance", desc: "Energy equilibrium & metabolic health", icon: "⚖️" },
                    { id: "BULKING", label: "Lean Bulking", desc: "+300 kcal surplus for muscle hypertrophy", icon: "💪" },
                    { id: "GENERAL_HEALTH", label: "General Health", desc: "Micronutrient variety & gut fiber focus", icon: "🌱" }
                  ].map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        goal === g.id
                          ? "bg-[#3b9eff]/20 border-[#3b9eff] shadow-lg shadow-[#3b9eff]/15"
                          : "bg-black/30 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="text-2xl mb-1">{g.icon}</div>
                      <div className="font-heading font-bold text-sm text-white">{g.label}</div>
                      <div className="text-[11px] text-[#a8bcd8] mt-1">{g.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Diet & Economics */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="font-heading font-bold text-lg text-white">Dietary Habits & Budget</h3>
                <p className="text-xs text-[#a8bcd8]">We ensure recommendations match your cultural foods and budget limits.</p>

                <div>
                  <label className="text-xs text-[#a8bcd8] block mb-2 font-medium">Dietary Pattern</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "VEGETARIAN", label: "Vegetarian", icon: "🌿" },
                      { id: "EGGETARIAN", label: "Eggetarian", icon: "🥚" },
                      { id: "VEGAN", label: "Vegan", icon: "🌱" },
                      { id: "NON_VEGETARIAN", label: "Non-Vegetarian", icon: "🍗" }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDiet(d.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          diet === d.id
                            ? "bg-[#00e5a0]/15 border-[#00e5a0] text-white"
                            : "bg-black/30 border-white/5 text-[#a8bcd8] hover:bg-white/5"
                        }`}
                      >
                        <span className="text-xl">{d.icon}</span>
                        <span className="text-xs font-bold">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Daily Food Budget</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-[#4a6080] absolute left-3 top-3" />
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#a8bcd8] block mb-1 font-medium">Regional Food Style</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#0a1023] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b9eff]"
                    >
                      <option value="North Indian">North Indian</option>
                      <option value="South Indian">South Indian</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Maharashtrian">Maharashtrian</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kerala">Kerala</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Targets Review */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#00e5a0]/20 border border-[#00e5a0]/40 flex items-center justify-center text-[#00e5a0] mx-auto mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-white">
                  Targets Computed! 🎉
                </h3>
                <p className="text-xs text-[#a8bcd8]">
                  Calculated using Mifflin-St Jeor TDEE with {goal.toLowerCase()} adjustments.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                  <div className="p-3 rounded-2xl bg-black/40 border border-[#3b9eff]/30">
                    <span className="text-[10px] text-[#a8bcd8] uppercase font-bold block">Calories</span>
                    <span className="font-heading text-xl font-extrabold text-[#3b9eff]">{targets.calories}</span>
                    <span className="text-[10px] text-[#4a6080] block">kcal/day</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-[#ff8c42]/30">
                    <span className="text-[10px] text-[#ff8c42] uppercase font-bold block">Protein</span>
                    <span className="font-heading text-xl font-extrabold text-white">{targets.protein}g</span>
                    <span className="text-[10px] text-[#4a6080] block">2.0g/kg target</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-[#7c5cfc]/30">
                    <span className="text-[10px] text-[#a8bcd8] uppercase font-bold block">Carbs</span>
                    <span className="font-heading text-xl font-extrabold text-white">{targets.carbs}g</span>
                    <span className="text-[10px] text-[#4a6080] block">Complex whole grains</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-[#00e5a0]/30">
                    <span className="text-[10px] text-[#a8bcd8] uppercase font-bold block">Fats</span>
                    <span className="font-heading text-xl font-extrabold text-white">{targets.fat}g</span>
                    <span className="text-[10px] text-[#4a6080] block">Essential lipids</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#a8bcd8]">
                  BMI: <strong className="text-white">{targets.bmi}</strong> · {diet} · Daily Budget: <strong className="text-[#00e5a0]">₹{budget}</strong>
                </div>
              </div>
            )}

            {/* Stepper Navigation */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#a8bcd8] flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 rounded-xl font-heading font-bold text-xs bg-[#3b9eff] hover:bg-[#2e82d4] text-white shadow-lg shadow-[#3b9eff]/20 flex items-center gap-1.5 transition-all"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-[#3b9eff] to-[#00e5a0] hover:opacity-95 text-white shadow-xl shadow-[#00e5a0]/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : <>Launch Dashboard 🚀</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
