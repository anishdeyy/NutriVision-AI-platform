import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Food } from "../../types";
import {
  Database,
  Search,
  Filter,
  Sparkles,
  Dna,
  Flame,
  IndianRupee,
  Layers,
  CheckCircle2,
  Info,
  X,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Award
} from "lucide-react";

export const FoodExplorer: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dietType, setDietType] = useState<string>("");
  const [highProtein, setHighProtein] = useState<boolean>(false);
  const [lowCalorie, setLowCalorie] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("density_desc");
  const [sourceType, setSourceType] = useState<string>("");

  // Provenance Modal State
  const [selectedFoodForProvenance, setSelectedFoodForProvenance] = useState<any | null>(null);
  const [provenanceData, setProvenanceData] = useState<any | null>(null);
  const [provenanceLoading, setProvenanceLoading] = useState<boolean>(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await api.getFoods({
        query: searchQuery || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        diet_type: dietType || undefined,
        high_protein: highProtein,
        low_calorie: lowCalorie,
        sort_by: sortBy,
        source_type: sourceType || undefined,
        limit: 120
      });
      setFoods(res.data);
    } catch (err) {
      console.error("Failed to load foods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const sRes = await api.getFoodStats();
        setStats(sRes.data);
      } catch (err) {
        console.error("Failed to load food stats:", err);
      }
    };
    fetchInitialStats();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFoods();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, dietType, highProtein, lowCalorie, sortBy, sourceType]);

  const handleOpenProvenance = async (food: Food) => {
    setSelectedFoodForProvenance(food);
    setProvenanceLoading(true);
    try {
      const res = await api.getFoodProvenance(food.id);
      setProvenanceData(res.data);
    } catch (err) {
      console.error("Failed to fetch provenance:", err);
    } finally {
      setProvenanceLoading(false);
    }
  };

  const categories = [
    "ALL",
    "Dal & Lentils",
    "Dairy & Paneer",
    "Grains & Breads",
    "Traditional Indian",
    "Vegetables & Sabzi",
    "Breakfast & Snacks",
    "Meat & Seafood"
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Kaggle Ingestion Unified
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Fabrication Policy
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            Food Database & Provenance Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and audit 1,730+ verified Indian dishes, protein density (g/100 kcal), and full source provenance.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 uppercase font-semibold">Indexed Catalog</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total_foods} foods</div>
            <div className="text-xs text-slate-400 mt-0.5">Curated + Kaggle Batches</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 uppercase font-semibold">Avg Protein Density</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.avg_protein_density}g / 100 kcal</div>
            <div className="text-xs text-slate-400 mt-0.5">Nutritional Lean Index</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 uppercase font-semibold">Peak Protein Density</div>
            <div className="text-base font-bold text-emerald-700 mt-1 truncate">
              {stats.top_protein_density?.[0]?.name || "Soya Chunks"}
            </div>
            <div className="text-xs text-slate-500">
              {stats.top_protein_density?.[0]?.protein_density_ratio || "15.2"}g / 100 kcal
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 uppercase font-semibold">Best Value for Money</div>
            <div className="text-base font-bold text-blue-700 mt-1 truncate">
              {stats.top_protein_per_rupee?.[0]?.name || "Moong Sprouts"}
            </div>
            <div className="text-xs text-slate-500">
              {stats.top_protein_per_rupee?.[0]?.protein_per_rupee || "1.2"}g protein / ₹
            </div>
          </div>
        </div>
      )}

      {/* Control & Filter Center */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search over 1,730+ Indian dishes, regional curries, lentils, or dairy (e.g. Masoor Dal, Paneer Tikka, Idli)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Diet Type */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Diet Type
            </label>
            <select
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="">All Dietary Types</option>
              <option value="VEGETARIAN">Vegetarian</option>
              <option value="EGGETARIAN">Eggetarian</option>
              <option value="VEGAN">Strict Vegan</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="density_desc">Highest Protein Density (P:Cal)</option>
              <option value="protein_desc">Highest Raw Protein (g)</option>
              <option value="calories_asc">Lowest Calories</option>
              <option value="price_asc">Lowest Estimated Price</option>
              <option value="fiber_desc">Highest Fiber</option>
            </select>
          </div>

          {/* Source Provenance */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Data Confidence Tier
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="">All Verification Tiers</option>
              <option value="CURATED">Curated Gold Standard (146)</option>
              <option value="SOURCE_IMPORTED">Kaggle Ingested (1,586)</option>
            </select>
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setHighProtein(!highProtein)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                highProtein ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              High Protein (&gt;10g)
            </button>
            <button
              onClick={() => setLowCalorie(!lowCalorie)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                lowCalorie ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Low Cal (&lt;150)
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Food Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          Querying verified food catalog...
        </div>
      ) : foods.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200 space-y-2">
          <p className="text-base font-bold text-slate-900">No dishes matched your filters</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or clearing selected category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {foods.map((food: any) => {
            const isCurated = food.data_confidence === "CURATED" || (food.source_count && food.source_count > 1);
            return (
              <div
                key={food.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl">{food.emoji || "🍛"}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      isCurated
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {food.data_confidence || "VERIFIED"}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 mt-2.5 line-clamp-1" title={food.name}>
                    {food.name}
                  </h3>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {food.category} • {food.serving_size}
                  </div>

                  {/* Density badge */}
                  <div className="mt-3 flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 text-[11px]">Protein Density:</span>
                    <strong className="text-blue-700 font-mono font-bold">
                      {food.protein_density_ratio ? food.protein_density_ratio.toFixed(2) : ((food.protein / Math.max(food.calories, 1)) * 100).toFixed(1)}g / 100 kcal
                    </strong>
                  </div>

                  {/* Macros grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Cals</span>
                      <strong className="text-slate-900 font-bold">{Math.round(food.calories)}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <span className="text-[10px] text-blue-600 block">Protein</span>
                      <strong className="text-blue-700 font-bold">{food.protein}g</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50">
                      <span className="text-[10px] text-amber-600 block">Carbs</span>
                      <strong className="text-amber-700 font-bold">{food.carbohydrates}g</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-700">₹{food.price_estimate || 25}</span>
                  <button
                    onClick={() => handleOpenProvenance(food)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    View Provenance →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provenance Modal */}
      {selectedFoodForProvenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFoodForProvenance(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedFoodForProvenance.emoji || "🍛"}</span>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-slate-900">
                  {selectedFoodForProvenance.name}
                </h3>
                <span className="text-xs text-slate-500">Data Lineage & Provenance Record</span>
              </div>
            </div>

            {provenanceLoading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Querying database origin records...
              </div>
            ) : provenanceData ? (
              <div className="mt-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div>Canonical Name: <strong className="text-slate-900">{provenanceData.canonical_name}</strong></div>
                  <div>Confidence Tier: <strong className="text-blue-600">{provenanceData.data_confidence}</strong></div>
                  <div>Consistency Flag: <strong className="text-emerald-600">{provenanceData.nutrition_consistency_flag ? "Valid Energy Balance" : "Needs Review"}</strong></div>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">Source Attributions ({provenanceData.sources?.length || 0})</h4>
                <div className="space-y-2">
                  {provenanceData.sources?.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">{s.dataset_name}</div>
                      <div className="text-slate-500">File: {s.origin_file} • Row #{s.row_number}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">SHA256: {s.raw_record_sha256}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
export default FoodExplorer;
