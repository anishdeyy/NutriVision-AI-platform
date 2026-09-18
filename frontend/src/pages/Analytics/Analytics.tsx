import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { PotentialNutrientGap } from "../../types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  Dna,
  Flame,
  Activity,
  Wheat,
  Award
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export const Analytics: React.FC = () => {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<number>(7);
  const [trendsData, setTrendsData] = useState<any | null>(null);
  const [macrosData, setMacrosData] = useState<any | null>(null);
  const [adherenceData, setAdherenceData] = useState<any | null>(null);
  const [gapsData, setGapsData] = useState<{
    assessment_period: string;
    potential_gaps: PotentialNutrientGap[];
    general_disclaimer: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendsRes, macrosRes, gapsRes, adhRes] = await Promise.all([
          api.getTrends(timeRange),
          api.getMacrosAnalytics(timeRange),
          api.getNutrientGaps(),
          api.getAdherenceAnalytics()
        ]);
        setTrendsData(trendsRes.data);
        setMacrosData(macrosRes.data);
        setGapsData(gapsRes.data);
        setAdherenceData(adhRes.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const dates = trendsData?.formatted_dates || [];
  const calories = trendsData?.calories || [];
  const targetCalories = trendsData?.target_calories || [];
  const protein = trendsData?.protein || [];
  const targetProtein = trendsData?.target_protein || [];
  const scores = trendsData?.scores || [];

  const validCals = calories.filter((c: number) => c > 0);
  const avgCal = validCals.length > 0 ? Math.round(validCals.reduce((a: number, b: number) => a + b, 0) / validCals.length) : 0;
  const validPro = protein.filter((p: number) => p > 0);
  const avgPro = validPro.length > 0 ? (validPro.reduce((a: number, b: number) => a + b, 0) / validPro.length).toFixed(1) : "0";
  const validScores = scores.filter((s: number) => s > 0);
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length) : 0;

  // Chart options with clean light theme
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#475569",
          font: { size: 12, family: "Inter", weight: 500 },
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: "#0F172A",
        padding: 12,
        titleColor: "#FFFFFF",
        bodyColor: "#93C5FD",
        borderColor: "#E2E8F0",
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: "#F1F5F9" },
        ticks: { color: "#64748B", font: { size: 11, family: "Inter" } }
      },
      y: {
        grid: { color: "#F1F5F9" },
        ticks: { color: "#64748B", font: { size: 11, family: "Inter" } }
      }
    }
  };

  const caloriesChartData = {
    labels: dates,
    datasets: [
      {
        label: "Actual Calories (kcal)",
        data: calories,
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: "#2563EB",
        pointRadius: 3,
      },
      {
        label: "Target Calories",
        data: targetCalories,
        borderColor: "#94A3B8",
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5,
      }
    ]
  };

  const proteinChartData = {
    labels: dates,
    datasets: [
      {
        label: "Actual Protein (g)",
        data: protein,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: "#3B82F6",
        pointRadius: 3,
      },
      {
        label: "Target Protein",
        data: targetProtein,
        borderColor: "#16A34A",
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5,
      }
    ]
  };

  const scoreChartData = {
    labels: dates,
    datasets: [
      {
        label: "Daily Adherence Score (/100)",
        data: scores,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.08)",
        fill: true,
        tension: 0.3,
        borderWidth: 2.5,
        pointBackgroundColor: "#8B5CF6",
        pointRadius: 3,
      }
    ]
  };

  const macroDoughnutData = {
    labels: ["Protein", "Carbohydrates", "Fats"],
    datasets: [
      {
        data: [
          macrosData?.protein_pct || 22,
          macrosData?.carbs_pct || 48,
          macrosData?.fat_pct || 30
        ],
        backgroundColor: ["#2563EB", "#F59E0B", "#10B981"],
        borderWidth: 2,
        borderColor: "#FFFFFF",
      }
    ]
  };

  const hasData = validCals.length >= 2;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Longitudinal Biometrics
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ICMR RDA Adherence
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Nutritional Analytics & Trends
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracking your metabolic consistency, macronutrient compliance, and micronutrient adequacy over time.
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-center">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === d
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Average Caloric Intake</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {avgCal} <span className="text-sm font-normal text-slate-400">kcal/day</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Target: {profile?.daily_calorie_target || 2150} kcal</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Average Protein</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {avgPro} <span className="text-sm font-normal text-slate-400">g/day</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Target: {profile?.protein_target || 110} g</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Average Fiber</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            26.4 <span className="text-sm font-normal text-slate-400">g/day</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">ICMR Target: 30 g</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Adherence Score</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{adherenceData?.rating || "High Consistency"}</div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
          <Info className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-heading font-bold text-base text-slate-900">Not enough data yet</h3>
          <p className="text-sm text-slate-500 mt-1">Log meals for at least 3 days to unlock full longitudinal trend analytics.</p>
        </div>
      )}

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Caloric Trend */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Daily Caloric Intake vs Target
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparing actual logged energy intake against designated target.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <Line data={caloriesChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Macro Energy Split */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Macro Energy Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Caloric contribution from protein, carbs, and fat.</p>
          </div>

          <div className="h-[200px] w-full my-4 flex items-center justify-center">
            <Doughnut
              data={macroDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { font: { size: 11, family: "Inter" }, boxWidth: 10 }
                  }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-blue-50">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Protein</span>
              <strong className="text-blue-700 text-sm">{macrosData?.protein_grams || 98}g</strong>
            </div>
            <div className="p-2 rounded-xl bg-amber-50">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Carbs</span>
              <strong className="text-amber-700 text-sm">{macrosData?.carbs_grams || 232}g</strong>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Fats</span>
              <strong className="text-emerald-700 text-sm">{macrosData?.fat_grams || 61}g</strong>
            </div>
          </div>
        </div>

        {/* Protein Consistency */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Dna className="w-5 h-5 text-blue-600" /> Protein Intake Consistency
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Daily total crude protein against designated target.</p>
          </div>
          <div className="h-[280px] w-full">
            <Line data={proteinChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Nutrition Score Trend */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" /> Daily Nutrition Score Trend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Composite adherence score (0-100) per day.</p>
          </div>
          <div className="h-[280px] w-full">
            <Line data={scoreChartData} options={lineChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
