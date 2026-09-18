import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  ShoppingBag,
  CheckSquare,
  Square,
  IndianRupee,
  Sparkles,
  Printer,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Share2,
  CheckCircle2
} from "lucide-react";

interface GroceryItem {
  category: string;
  item_name: string;
  total_quantity: string;
  estimated_cost_inr: number;
  is_purchased: boolean;
}

export const Grocery: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const loadGroceryFromPlan = async () => {
    setLoading(true);
    setError("");
    try {
      let planData: any = null;
      const stored = sessionStorage.getItem("nv_active_plan");
      if (stored) {
        planData = JSON.parse(stored);
      } else {
        // Generate a 7-day default plan for user
        const planRes = await api.generateMealPlan(7, profile?.budget_per_day || 150, profile?.region || "North Indian");
        planData = planRes.data;
        sessionStorage.setItem("nv_active_plan", JSON.stringify(planData));
      }

      const res = await api.generateGroceryList(planData);
      const fetchedItems: GroceryItem[] = res.data.items.map((it: any) => ({
        ...it,
        is_purchased: false,
      }));
      setItems(fetchedItems);
    } catch (err: any) {
      console.error("Grocery fetch error:", err);
      setError("Unable to generate grocery list. Please make sure a meal plan is configured.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroceryFromPlan();
  }, []);

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, is_purchased: !it.is_purchased } : it))
    );
  };

  const categories = ["ALL", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter(
    (it) => activeCategory === "ALL" || it.category === activeCategory
  );

  const totalCost = items.reduce((acc, curr) => acc + curr.estimated_cost_inr, 0);
  const purchasedCost = items
    .filter((i) => i.is_purchased)
    .reduce((acc, curr) => acc + curr.estimated_cost_inr, 0);
  const purchasedCount = items.filter((i) => i.is_purchased).length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/30">
              Zero Food Waste
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7c5cfc]/20 text-[#a78bfa] border border-[#7c5cfc]/30">
              Bulk Indian Wholesale Pricing
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-[#00e5a0]" />
            Weekly Grocery Checklist
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated staple quantities directly calculated from your personalized active meal plan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-slate-300 hover:text-white hover:border-[#3b9eff] transition-all font-semibold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print List
          </button>
          <button
            onClick={loadGroceryFromPlan}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#00e5a0] hover:bg-[#00c98c] text-black font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#00e5a0]/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Sync Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Estimated Basket</div>
          <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-1">
            ₹{Math.round(totalCost)}
            <span className="text-xs text-slate-400 font-normal">/ 7-day supply</span>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Purchased Progress</div>
          <div className="text-3xl font-extrabold text-[#00e5a0] mt-1 flex items-baseline gap-1">
            {purchasedCount} <span className="text-xs text-slate-400 font-normal">/ {items.length} items</span>
          </div>
          <div className="w-full bg-[#080c18] rounded-full h-1.5 mt-3 overflow-hidden border border-[rgba(80,130,200,0.15)]">
            <div
              className="bg-[#00e5a0] h-full rounded-full transition-all duration-300"
              style={{ width: `${items.length > 0 ? (purchasedCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase font-semibold">Cart Spent vs Target</div>
          <div className="text-3xl font-extrabold text-[#3b9eff] mt-1 flex items-baseline gap-1">
            ₹{Math.round(purchasedCost)} <span className="text-xs text-slate-400 font-normal">checked out</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Remaining: ₹{Math.max(0, Math.round(totalCost - purchasedCost))}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === cat
                ? "bg-[#00e5a0] border-[#00e5a0] text-black shadow-md shadow-[#00e5a0]/20"
                : "bg-[#080c18] border-[rgba(80,130,200,0.2)] text-slate-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grocery Items List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-[rgba(80,130,200,0.2)]">
        <div className="p-4 bg-[#080c18]/80 border-b border-[rgba(80,130,200,0.15)] flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Item & Quantity</span>
          <span>Category & Cost</span>
        </div>

        <div className="divide-y divide-[rgba(80,130,200,0.1)]">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00e5a0]" />
              Synthesizing whole-week bulk pantry checklist...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-4">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-500 stroke-1" />
              <p>No grocery items generated yet.</p>
              <button
                onClick={() => navigate("/meal-planner")}
                className="px-5 py-2.5 rounded-xl bg-[#3b9eff] text-white font-semibold text-sm inline-flex items-center gap-2"
              >
                Go to Meal Planner <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const originalIndex = items.findIndex(
                (i) => i.item_name === item.item_name && i.category === item.category
              );
              return (
                <div
                  key={idx}
                  onClick={() => toggleItem(originalIndex)}
                  className={`p-4 flex items-center justify-between transition-all cursor-pointer hover:bg-[#080c18]/60 ${
                    item.is_purchased ? "opacity-50 bg-[#080c18]/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-[#00e5a0] transition-colors"
                    >
                      {item.is_purchased ? (
                        <CheckSquare className="w-5 h-5 text-[#00e5a0]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <span
                        className={`text-sm font-semibold ${
                          item.is_purchased ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {item.item_name}
                      </span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Quantity: <span className="text-slate-300 font-medium">{item.total_quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-slate-300 font-medium">
                      {item.category}
                    </span>
                    <div className="text-sm font-bold text-[#00e5a0] mt-1">
                      ₹{Math.round(item.estimated_cost_inr)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default Grocery;
