import React from "react";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { DailyNutritionSummary } from "../../types";

interface AIInsightProps {
  summary: DailyNutritionSummary | null;
  onWhatToEat: () => void;
  onFixMyDay: () => void;
}

export const AIInsight: React.FC<AIInsightProps> = ({ summary, onWhatToEat, onFixMyDay }) => {
  if (!summary) return null;

  const proPercent = summary.protein.percentage;
  const calPercent = summary.calories.percentage;
  const proRem = summary.protein.remaining;
  const calRem = summary.calories.remaining;

  let insightTitle = "Balanced Daily Intake";
  let insightText = "Your macronutrients are pacing evenly with your designated caloric budget today.";
  let alertBadge = null;

  if (proPercent < 60 && calPercent > 70) {
    insightTitle = "Protein Density Attention";
    insightText = `You have consumed ${calPercent}% of your calories, but only ${proPercent}% of your protein target. Focus on lean, high-density protein for dinner (such as paneer bhurji, boiled eggs, or soya chunks) without excess simple carbohydrates.`;
    alertBadge = "Protein Lagging";
  } else if (calRem < 300 && proRem > 25) {
    insightTitle = "Calorie Budget Constrained";
    insightText = `You have only ${calRem} kcal remaining but need ~${proRem}g protein. Select an isolated protein addition (such as boiled egg whites, roasted chana, or curd) to meet your target without an unintended surplus.`;
    alertBadge = "Calorie Limit";
  } else if (summary.fiber.percentage < 40 && calPercent > 50) {
    insightTitle = "Fiber Intake Low";
    insightText = `Dietary fiber is currently ${summary.fiber.consumed}g / 30g. Incorporate a cucumber-tomato salad, roasted makhana, or sprouted moong in your evening meal to stimulate satiety hormones and digestive health.`;
    alertBadge = "Fiber Gap";
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-heading font-bold text-base text-slate-900">AI Daily Intelligence</span>
        </div>
        {alertBadge && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {alertBadge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-base font-semibold text-slate-900">{insightTitle}</h4>
        <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
          {insightText}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
        <button
          onClick={onWhatToEat}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          🍽 What should I eat now? <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onFixMyDay}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          ⚡ Fix My Day Strategy
        </button>
      </div>
    </div>
  );
};
