import React from "react";
import { MacroProgress } from "../../types";
import { Info } from "lucide-react";

interface MacroBarsProps {
  protein: MacroProgress;
  effectiveProtein: number;
  carbs: MacroProgress;
  fat: MacroProgress;
  fiber: MacroProgress;
}

export const MacroBars: React.FC<MacroBarsProps> = ({
  protein,
  effectiveProtein,
  carbs,
  fat,
  fiber,
}) => {
  const bars = [
    {
      label: "Protein",
      current: protein.consumed,
      target: protein.target,
      unit: "g",
      barColor: "bg-blue-600",
      badge: `Effective: ~${effectiveProtein}g`,
      badgeTooltip: "Adjusted using DIAAS/PDCAAS bioavailability models for Indian diets",
      percent: protein.percentage,
    },
    {
      label: "Carbohydrates",
      current: carbs.consumed,
      target: carbs.target,
      unit: "g",
      barColor: "bg-amber-500",
      percent: carbs.percentage,
    },
    {
      label: "Healthy Fats",
      current: fat.consumed,
      target: fat.target,
      unit: "g",
      barColor: "bg-emerald-500",
      percent: fat.percentage,
    },
    {
      label: "Dietary Fiber",
      current: fiber.consumed,
      target: fiber.target,
      unit: "g",
      barColor: "bg-indigo-500",
      percent: fiber.percentage,
    },
  ];

  return (
    <div className="space-y-4">
      {bars.map((b, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <span>{b.label}</span>
              {b.badge && (
                <span
                  title={b.badgeTooltip}
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 cursor-help flex items-center gap-1"
                >
                  {b.badge}
                  <Info className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="text-slate-600 text-sm">
              <strong className="text-slate-900 font-bold">{b.current}</strong> / {b.target} {b.unit}
              <span className="text-xs text-slate-400 ml-1.5 font-medium">({b.percent}%)</span>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${b.barColor}`}
              style={{ width: `${Math.min(100, b.percent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
