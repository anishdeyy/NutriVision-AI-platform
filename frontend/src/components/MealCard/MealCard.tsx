import React from "react";
import { Meal } from "../../types";
import { Trash2, RefreshCw } from "lucide-react";

interface MealCardProps {
  meal: Meal;
  onDelete: (id: number) => void;
  onSwap: (id: number) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onDelete, onSwap }) => {
  const getMealEmoji = (type: string) => {
    switch (type) {
      case "BREAKFAST": return "🌅";
      case "LUNCH": return "☀️";
      case "DINNER": return "🌙";
      case "SNACK": return "☕";
      case "PRE_WORKOUT": return "⚡";
      case "POST_WORKOUT": return "💪";
      default: return "🍽";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-200 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{getMealEmoji(meal.meal_type)}</span>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 capitalize">
              {meal.meal_type.replace("_", " ").toLowerCase()}
            </h4>
            {meal.notes && <span className="text-[12px] text-slate-500">{meal.notes}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="font-heading font-bold text-sm text-slate-900 block">
              {Math.round(meal.total_calories)} kcal
            </span>
            <div className="text-[11px] text-slate-500">
              P: <strong className="text-blue-600">{meal.total_protein}g</strong> (eff: ~{meal.total_effective_protein}g)
            </div>
          </div>

          <button
            onClick={() => onSwap(meal.id)}
            title="Suggest AI Swaps"
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(meal.id)}
            title="Delete Meal"
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="mt-3 space-y-1.5">
        {meal.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.food.emoji || "🍛"}</span>
              <span className="text-slate-800 font-medium text-[13px]">{item.food.name}</span>
              <span className="text-[11px] text-slate-400">× {item.quantity} {item.serving_unit}</span>
            </div>
            <div className="text-slate-600 font-mono text-[12px]">
              <span>{Math.round(item.calories)} kcal</span>
              <span className="text-blue-600 font-semibold ml-2.5">P:{item.protein}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
