import React, { useState } from "react";
import { Award, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { NutritionScoreResponse } from "../../types";

interface NutritionScoreProps {
  scoreData: NutritionScoreResponse | null;
}

export const NutritionScore: React.FC<NutritionScoreProps> = ({ scoreData }) => {
  const [expanded, setExpanded] = useState(false);

  if (!scoreData) return null;

  const score = scoreData.score;
  const ratingColor =
    score >= 85
      ? "text-emerald-700 border-emerald-200 bg-emerald-50"
      : score >= 70
      ? "text-blue-700 border-blue-200 bg-blue-50"
      : score >= 50
      ? "text-amber-700 border-amber-200 bg-amber-50"
      : "text-rose-700 border-rose-200 bg-rose-50";

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Daily Nutrition Score</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-3xl font-extrabold text-slate-900">{score}</span>
              <span className="text-sm text-slate-400">/ 100</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ml-1.5 ${ratingColor}`}>
                {scoreData.rating}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
        >
          {expanded ? "Hide Audit" : "Audit Breakdown"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="text-[14px] text-slate-600 mt-3 leading-relaxed">
        {scoreData.recommendation}
      </p>

      {/* Expandable Breakdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
          {scoreData.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between bg-slate-50 p-3 rounded-xl text-xs border border-slate-200/60">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">{item.category}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">{item.feedback}</div>
                </div>
              </div>
              <div className="font-mono font-bold text-slate-700 ml-2 flex-shrink-0">
                {item.points_earned}/{item.max_points} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
