import React, { useState } from "react";
import { Food } from "../../types";
import { X, Plus, Minus, Check, Sparkles, DollarSign } from "lucide-react";

interface FoodModalProps {
  food: Food | null;
  onClose: () => void;
  onLogMeal: (food: Food, quantity: number, mealType: string) => Promise<void>;
}

export const FoodModal: React.FC<FoodModalProps> = ({ food, onClose, onLogMeal }) => {
  const [quantity, setQuantity] = useState<number>(1.0);
  const [mealType, setMealType] = useState<string>("LUNCH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!food) return null;

  const currentCals = Math.round(food.calories * quantity);
  const currentPro = Math.round(food.protein * quantity * 10) / 10;
  const currentEffPro = Math.round(food.effective_protein * quantity * 10) / 10;
  const currentCarbs = Math.round(food.carbohydrates * quantity * 10) / 10;
  const currentFat = Math.round(food.fat * quantity * 10) / 10;
  const currentFiber = Math.round(food.fiber * quantity * 10) / 10;
  const currentPrice = Math.round(food.price_estimate * quantity);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onLogMeal(food, quantity, mealType);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl">
            {food.emoji || "🍛"}
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">{food.name}</h3>
            {food.regional_name && (
              <span className="text-xs text-slate-500 block">{food.regional_name}</span>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {food.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {food.bioavailability_label} ({Math.round(food.protein_quality_score * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Portion Size</span>
            <span className="text-sm font-bold text-slate-900">{food.serving_size}</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setQuantity(Math.max(0.5, Math.round((quantity - 0.5) * 10) / 10))}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-900 text-base px-2">{quantity}×</span>
            <button
              onClick={() => setQuantity(Math.round((quantity + 0.5) * 10) / 10)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Macro Grid Preview */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Calories</span>
            <span className="font-heading text-lg font-bold text-slate-900">{currentCals}</span>
            <span className="text-[10px] text-slate-400 block">kcal</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[11px] text-blue-700 uppercase font-semibold block">Protein</span>
            <span className="font-heading text-lg font-bold text-blue-700">{currentPro}g</span>
            <span className="text-[10px] text-blue-500 block">eff: ~{currentEffPro}g</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] text-amber-700 uppercase font-semibold block">Carbs</span>
            <span className="font-heading text-lg font-bold text-amber-700">{currentCarbs}g</span>
            <span className="text-[10px] text-amber-600 block">fib: {currentFiber}g</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-700 uppercase font-semibold block">Fats</span>
            <span className="font-heading text-lg font-bold text-emerald-700">{currentFat}g</span>
            <span className="text-[10px] text-emerald-600 block">₹{currentPrice}</span>
          </div>
        </div>

        {/* Meal Type Selection */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">Select Meal Period</label>
          <div className="grid grid-cols-4 gap-2">
            {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  mealType === t
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? "Logging Food..." : "Add to Today's Food Log"}
        </button>
      </div>
    </div>
  );
};
