import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Food } from "../../types";
import {
  Scale,
  Sparkles,
  Plus,
  Trash2,
  Trophy,
  CheckCircle2,
  Flame,
  Dna,
  IndianRupee,
  Search,
  Zap,
  Layers
} from "lucide-react";

export const FoodComparison: React.FC = () => {
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([19, 15, 23, 22]); // Paneer, Soya Chunks, Tofu, Boiled Egg
  const [comparedFoods, setComparedFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddingFood, setIsAddingFood] = useState<boolean>(false);

  useEffect(() => {
    const fetchAllFoods = async () => {
      try {
        const res = await api.getFoods({ limit: 150 });
        setAllFoods(res.data);
      } catch (err) {
        console.error("Failed to load food directory:", err);
      }
    };
    fetchAllFoods();
  }, []);

  const runComparison = async (ids: number[]) => {
    if (ids.length === 0) {
      setComparedFoods([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.compareFoods(ids);
      setComparedFoods(res.data);
    } catch (err) {
      console.error("Failed to compare foods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFoodIds.length > 0) {
      runComparison(selectedFoodIds);
    }
  }, [selectedFoodIds]);

  const addFood = (foodId: number) => {
    if (!selectedFoodIds.includes(foodId) && selectedFoodIds.length < 5) {
      setSelectedFoodIds([...selectedFoodIds, foodId]);
    }
    setIsAddingFood(false);
    setSearchQuery("");
  };

  const removeFood = (foodId: number) => {
    setSelectedFoodIds(selectedFoodIds.filter((id) => id !== foodId));
  };

  const presets = [
    {
      name: "High-Protein Heavyweights",
      ids: [19, 15, 23, 22] // Paneer, Soya, Tofu, Eggs
    },
    {
      name: "Grains & Millets Clash",
      ids: [1, 2, 5, 8] // Roti, Rice, Oats, Quinoa/Millet
    },
    {
      name: "Lentils & Pulses Battle",
      ids: [11, 12, 13, 16] // Dal Tadka, Moong Dal, Chana Masala, Rajma
    }
  ];

  // Helper winners
  const highestProtein = comparedFoods.length > 0
    ? [...comparedFoods].sort((a, b) => b.protein - a.protein)[0]
    : null;

  const highestBioavailable = comparedFoods.length > 0
    ? [...comparedFoods].sort((a, b) => b.effective_protein - a.effective_protein)[0]
    : null;

  const bestValue = comparedFoods.length > 0
    ? [...comparedFoods].sort((a, b) => b.protein_per_rupee - a.protein_per_rupee)[0]
    : null;

  const filteredSearchFoods = allFoods.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedFoodIds.includes(f.id)
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3b9eff]/20 text-[#3b9eff] border border-[#3b9eff]/30">
              Biochemical Head-to-Head
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/30">
              Protein per Rupee Analysis
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-[#3b9eff]" />
            Side-by-Side Food Comparison
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare DIAAS bioavailability, amino acid completeness, and cost efficiency across any Indian foods.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedFoodIds(p.ids)}
              className="px-3 py-1.5 rounded-xl bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-xs font-medium text-slate-300 hover:border-[#3b9eff] hover:text-white transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Winner Highlights Banner */}
      {comparedFoods.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#3b9eff] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3b9eff]/20 flex items-center justify-center text-[#3b9eff] flex-shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Most Bioavailable Protein
              </div>
              <div className="text-sm font-bold text-white truncate">{highestBioavailable?.name}</div>
              <div className="text-xs text-[#3b9eff]">
                {highestBioavailable?.effective_protein}g effective protein / serving
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#00e5a0] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00e5a0]/20 flex items-center justify-center text-[#00e5a0] flex-shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Highest Protein Per ₹
              </div>
              <div className="text-sm font-bold text-white truncate">{bestValue?.name}</div>
              <div className="text-xs text-[#00e5a0]">
                {bestValue?.protein_per_rupee}g protein per ₹1 spent
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#7c5cfc] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/20 flex items-center justify-center text-[#7c5cfc] flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Peak Raw Protein
              </div>
              <div className="text-sm font-bold text-white truncate">{highestProtein?.name}</div>
              <div className="text-xs text-[#a78bfa]">
                {highestProtein?.protein}g raw protein / serving
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Food Selector Modal / Dropdown */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Comparing <span className="text-white font-bold">{comparedFoods.length}</span> foods (Max 5)
        </div>
        {selectedFoodIds.length < 5 && (
          <div className="relative">
            <button
              onClick={() => setIsAddingFood(!isAddingFood)}
              className="px-4 py-2 rounded-xl bg-[#3b9eff] hover:bg-[#2b88e8] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#3b9eff]/20"
            >
              <Plus className="w-4 h-4" /> Add Food to Compare
            </button>

            {isAddingFood && (
              <div className="absolute right-0 mt-2 w-80 bg-[#080c18] border border-[rgba(80,130,200,0.3)] rounded-2xl shadow-2xl p-3 z-50 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 146+ foods..."
                    className="w-full bg-[#020409] border border-[rgba(80,130,200,0.2)] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#3b9eff]"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredSearchFoods.slice(0, 10).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => addFood(f.id)}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#3b9eff]/10 text-xs flex items-center justify-between cursor-pointer group"
                    >
                      <span className="text-slate-200 group-hover:text-white font-medium">
                        {f.name}
                      </span>
                      <span className="text-slate-500 text-[10px]">{f.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Table / Matrix */}
      <div className="glass-panel rounded-3xl overflow-x-auto border border-[rgba(80,130,200,0.2)]">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[rgba(80,130,200,0.15)] bg-[#080c18]/80">
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-44">
                Attribute
              </th>
              {comparedFoods.map((food) => (
                <th key={food.id} className="p-4 text-center min-w-[150px]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-heading font-bold text-white text-base truncate">
                      {food.name}
                    </span>
                    <button
                      onClick={() => removeFood(food.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                      title="Remove food"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    {food.serving_size} · {food.category}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(80,130,200,0.1)] text-sm">
            {/* Calories */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff8c42]" /> Calories
              </td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center font-bold text-white">
                  {Math.round(f.calories)} kcal
                </td>
              ))}
            </tr>

            {/* Total Protein */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-2">
                <Dna className="w-4 h-4 text-[#3b9eff]" /> Raw Protein
              </td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center font-extrabold text-[#3b9eff]">
                  {f.protein}g
                </td>
              ))}
            </tr>

            {/* Effective Bioavailable Protein */}
            <tr className="hover:bg-[#080c18]/40 bg-[#3b9eff]/5">
              <td className="p-4 font-semibold text-[#93c5fd] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00e5a0]" /> Effective Bioavailable (DIAAS)
              </td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center">
                  <div className="font-extrabold text-[#00e5a0] text-base">{f.effective_protein}g</div>
                  <div className="text-[10px] text-slate-400">{f.bioavailability_label}</div>
                </td>
              ))}
            </tr>

            {/* Protein per Rupee */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#00e5a0]" /> Protein Per Rupee
              </td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center">
                  <div className="font-bold text-white">{f.protein_per_rupee} g / ₹</div>
                  <div className="text-[10px] text-slate-400">Est. ₹{f.price_estimate}</div>
                </td>
              ))}
            </tr>

            {/* Protein Density Ratio */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300">Protein Density (P:Cal)</td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center font-mono text-xs text-slate-300">
                  {f.protein_density_ratio}
                </td>
              ))}
            </tr>

            {/* Carbohydrates */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300">Carbohydrates</td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center text-slate-300">
                  {f.carbohydrates}g
                </td>
              ))}
            </tr>

            {/* Healthy Fats */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300">Fats</td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center text-slate-300">
                  {f.fat}g
                </td>
              ))}
            </tr>

            {/* Dietary Fiber */}
            <tr className="hover:bg-[#080c18]/40">
              <td className="p-4 font-semibold text-slate-300">Dietary Fiber</td>
              {comparedFoods.map((f) => (
                <td key={f.id} className="p-4 text-center text-slate-300">
                  {f.fiber}g
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default FoodComparison;
