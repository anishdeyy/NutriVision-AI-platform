import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { UserProfile } from "../../types";
import {
  User,
  Activity,
  Target,
  Scale,
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Flame,
  Dna,
  Droplets
} from "lucide-react";

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    age: 25,
    gender: "male",
    height_cm: 175,
    weight_kg: 72,
    target_weight: 70,
    goal: "CUTTING",
    diet_type: "VEGETARIAN",
    activity_level: "MODERATE",
    budget_per_day: 150,
    region: "North Indian",
    allergies: "None",
    food_intolerances: "None",
  });

  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [parsingAi, setParsingAi] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        target_weight: profile.target_weight || profile.weight_kg,
        goal: profile.goal,
        diet_type: profile.diet_type,
        activity_level: profile.activity_level,
        budget_per_day: profile.budget_per_day || 150,
        region: profile.region || "North Indian",
        allergies: profile.allergies || "None",
        food_intolerances: profile.food_intolerances || "None",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.updateProfile(formData);
      if (refreshProfile) await refreshProfile();
      setMessage({
        type: "success",
        text: "Biometric profile and nutritional targets updated successfully!",
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setParsingAi(true);
    setMessage(null);

    try {
      const res = await api.parseProfileText(aiPrompt);
      const extracted = res.data.extracted_profile;
      if (extracted) {
        setFormData((prev) => ({
          ...prev,
          ...(extracted.age && { age: extracted.age }),
          ...(extracted.gender && { gender: extracted.gender }),
          ...(extracted.height_cm && { height_cm: extracted.height_cm }),
          ...(extracted.weight_kg && { weight_kg: extracted.weight_kg }),
          ...(extracted.goal && { goal: extracted.goal }),
          ...(extracted.diet_type && { diet_type: extracted.diet_type }),
          ...(extracted.activity_level && { activity_level: extracted.activity_level }),
          ...(extracted.budget_per_day && { budget_per_day: extracted.budget_per_day }),
          ...(extracted.region && { region: extracted.region }),
        }));
        setMessage({
          type: "success",
          text: "AI successfully extracted and updated your profile attributes! Click Save Changes to commit.",
        });
      }
    } catch (err) {
      console.error("AI parse failed:", err);
      setMessage({
        type: "error",
        text: "Could not parse your prompt. Please adjust the input or fill the fields manually.",
      });
    } finally {
      setParsingAi(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3b9eff]/20 text-[#3b9eff] border border-[#3b9eff]/30">
            Mifflin-St Jeor Engine
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/30">
            Personalized Targets
          </span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
          <User className="w-8 h-8 text-[#3b9eff]" />
          Biometric Profile & Targets
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          NutriVision continuously recalculates your metabolic requirements when your weight, goals, or lifestyle change.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
            message.type === "success"
              ? "bg-[#00e5a0]/15 border-[#00e5a0]/40 text-[#00e5a0]"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Computed Targets Dashboard */}
      {profile && (
        <div className="glass-panel p-6 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7c5cfc]" /> Active Calibrated Targets
            </h2>
            <div className="text-xs text-slate-400">
              BMI: <strong className="text-white">{profile.bmi || 23.5}</strong> ({profile.bmi_category || "Normal Weight"})
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-[#080c18] rounded-2xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] text-slate-400 uppercase">Daily Calories</div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {profile.daily_calorie_target}
              </div>
              <div className="text-[10px] text-slate-500">kcal / day</div>
            </div>
            <div className="p-3 bg-[#080c18] rounded-2xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] text-[#3b9eff] uppercase">Target Protein</div>
              <div className="text-xl font-extrabold text-[#3b9eff] mt-0.5">
                {profile.protein_target}g
              </div>
              <div className="text-[10px] text-slate-500">Bioavailable</div>
            </div>
            <div className="p-3 bg-[#080c18] rounded-2xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] text-[#ff8c42] uppercase">Carbohydrates</div>
              <div className="text-xl font-extrabold text-[#ff8c42] mt-0.5">
                {profile.carb_target}g
              </div>
              <div className="text-[10px] text-slate-500">Complex Energy</div>
            </div>
            <div className="p-3 bg-[#080c18] rounded-2xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] text-[#ff4d8d] uppercase">Healthy Fats</div>
              <div className="text-xl font-extrabold text-[#ff4d8d] mt-0.5">
                {profile.fat_target}g
              </div>
              <div className="text-[10px] text-slate-500">Hormonal Health</div>
            </div>
            <div className="p-3 bg-[#080c18] rounded-2xl border border-[rgba(80,130,200,0.15)] text-center">
              <div className="text-[10px] text-[#00e5a0] uppercase">Water Target</div>
              <div className="text-xl font-extrabold text-[#00e5a0] mt-0.5">
                {profile.water_target_liters}L
              </div>
              <div className="text-[10px] text-slate-500">Hydration</div>
            </div>
          </div>
        </div>
      )}

      {/* Natural Language AI Profile Updater */}
      <div className="glass-panel p-6 rounded-3xl border border-[#7c5cfc]/30 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7c5cfc]" />
          <h3 className="font-heading font-bold text-white text-base">
            Natural Language Profile Updater (Gemini 2.5)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Describe your changes in natural language: e.g., "I just weighed in at 74kg, started training 5 days a week for bulking, and switched to an Eggetarian diet with a ₹200 daily budget."
        </p>
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Type your lifestyle update..."
            className="flex-1 bg-[#080c18] border border-[rgba(80,130,200,0.3)] rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c5cfc] resize-none"
          />
          <button
            onClick={handleAiParse}
            disabled={parsingAi || !aiPrompt.trim()}
            className="px-5 rounded-2xl bg-[#7c5cfc] hover:bg-[#6847ec] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#7c5cfc]/20"
          >
            {parsingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Parse with AI
          </button>
        </div>
      </div>

      {/* Biometric Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-6">
        <h3 className="text-lg font-heading font-bold text-white">Manual Biometrics & Preferences</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Age (Years)
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={formData.height_cm}
              onChange={(e) => setFormData({ ...formData, height_cm: Number(e.target.value) })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.target_weight}
              onChange={(e) => setFormData({ ...formData, target_weight: Number(e.target.value) })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Nutritional Goal
            </label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            >
              <option value="CUTTING">Fat Loss (Cutting -300 to -500 kcal)</option>
              <option value="MAINTAIN">Metabolic Maintenance</option>
              <option value="BULKING">Lean Muscle Gain (Bulking +300 kcal)</option>
              <option value="GENERAL_HEALTH">Longevity & Energy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Diet Type
            </label>
            <select
              value={formData.diet_type}
              onChange={(e) => setFormData({ ...formData, diet_type: e.target.value as any })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            >
              <option value="VEGETARIAN">Vegetarian (Dairy-inclusive)</option>
              <option value="EGGETARIAN">Eggetarian (Vegetarian + Eggs)</option>
              <option value="VEGAN">Strict Vegan (100% Plant-based)</option>
              <option value="NON_VEGETARIAN">Non-Vegetarian</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Activity Level
            </label>
            <select
              value={formData.activity_level}
              onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            >
              <option value="SEDENTARY">Sedentary (Desk job, minimal movement)</option>
              <option value="LIGHT">Light Activity (1-3 days exercise)</option>
              <option value="MODERATE">Moderate Activity (3-5 days gym/sports)</option>
              <option value="VERY_ACTIVE">Very Active (6-7 days heavy training)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Daily Food Budget (₹)
            </label>
            <input
              type="number"
              value={formData.budget_per_day}
              onChange={(e) => setFormData({ ...formData, budget_per_day: Number(e.target.value) })}
              className="w-full bg-[#080c18] border border-[rgba(80,130,200,0.25)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b9eff]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-[#3b9eff] hover:bg-[#2b88e8] text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#3b9eff]/25 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Recalculate Targets
          </button>
        </div>
      </form>
    </div>
  );
};
export default Profile;
