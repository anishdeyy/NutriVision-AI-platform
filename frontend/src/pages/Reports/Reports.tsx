import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Download,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  HeartPulse,
  Filter,
  Check,
  Zap
} from "lucide-react";

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM">("DAILY");
  const [reports, setReports] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any | null>(null);
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [dailyData, setDailyData] = useState<any | null>(null);
  const [checkinData, setCheckinData] = useState<any | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Custom date range state
  const [customStart, setCustomStart] = useState<string>("2026-09-01");
  const [customEnd, setCustomEnd] = useState<string>("2026-09-18");

  const loadAllReportsData = async () => {
    setLoading(true);
    try {
      const [repRes, wkRes, moRes, dyRes, chkRes] = await Promise.all([
        api.listReports(),
        api.getWeeklyAnalytics(),
        api.getMonthlyAnalytics(),
        api.getTodaySummary(),
        api.getTodayCheckin()
      ]);
      setReports(repRes.data);
      setWeeklyData(wkRes.data);
      setMonthlyData(moRes.data);
      setDailyData(dyRes.data);
      setCheckinData(chkRes.data);
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReportsData();
  }, []);

  const handleGeneratePdf = async (typeToGenerate?: string) => {
    const reportType = typeToGenerate || activeTab;
    setGenerating(true);
    try {
      const res = await api.generateReport(reportType);
      setReports((prev) => [res.data, ...prev]);
      // Trigger instant download of the new report
      await handleDownload(res.data.id, res.data.pdf_filename);
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: number, filename?: string) => {
    setDownloadingId(id);
    try {
      await api.downloadReportBlob(id, filename);
    } catch (err) {
      console.error("PDF Download error:", err);
      // Fallback direct browser open with token parameter
      window.open(api.getReportDownloadUrl(id), "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Clinical Grade Audits
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ReportLab Engine
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Nutrition Intelligence Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic daily checkups, weekly performance reviews, monthly audits, and downloadable clinical PDF records.
          </p>
        </div>

        <button
          onClick={() => handleGeneratePdf(activeTab)}
          disabled={generating}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start md:self-center"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Current PDF
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: "DAILY", label: "Daily Checkup" },
          { id: "WEEKLY", label: "Weekly Review" },
          { id: "MONTHLY", label: "Monthly Audit" },
          { id: "CUSTOM", label: "Custom Range" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY CHECKUP */}
      {activeTab === "DAILY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
                  Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">
                  Today's Nutrition Checkup
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-200">
                  Score: {dailyData?.nutrition_score || 82} / 100
                </span>
              </div>
            </div>

            {/* Daily Nutrient Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Calories</span>
                <strong className="text-slate-900 text-lg">{dailyData?.calories.consumed || 2050}</strong>
                <span className="text-[11px] text-slate-400 block">/ {dailyData?.calories.target || 2150} kcal</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Protein</span>
                <strong className="text-blue-600 text-lg">{dailyData?.protein.consumed || 98.5}g</strong>
                <span className="text-[11px] text-slate-400 block">/ {dailyData?.protein.target || 110}g</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Effective P</span>
                <strong className="text-blue-700 text-lg">{dailyData?.effective_protein || 82.4}g</strong>
                <span className="text-[11px] text-slate-400 block">Quality Modeled</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Carbs</span>
                <strong className="text-amber-600 text-lg">{dailyData?.carbs.consumed || 232}g</strong>
                <span className="text-[11px] text-slate-400 block">/ {dailyData?.carbs.target || 240}g</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Dietary Fiber</span>
                <strong className="text-emerald-600 text-lg">{dailyData?.fiber.consumed || 26.4}g</strong>
                <span className="text-[11px] text-slate-400 block">/ {dailyData?.fiber.target || 30}g</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">Hydration</span>
                <strong className="text-sky-600 text-lg">{dailyData?.water_liters || 2.4}L</strong>
                <span className="text-[11px] text-slate-400 block">/ {dailyData?.water_target_liters || 2.8}L</span>
              </div>
            </div>

            {/* Daily Wellness Context */}
            {checkinData && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-blue-600" /> Daily Wellness Context
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
                  <div>Energy: <strong className="text-slate-900">{checkinData.energy_score}/5</strong></div>
                  <div>Hunger: <strong className="text-slate-900">{checkinData.hunger_score}/5</strong></div>
                  <div>Sleep: <strong className="text-slate-900">{checkinData.sleep_quality}</strong></div>
                  <div>Workout: <strong className="text-slate-900">{checkinData.workout_level}</strong></div>
                </div>
              </div>
            )}

            {/* Daily AI Observations */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">Today's Nutrition Check</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Calorie intake stayed comfortably within targeted energy limits.</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Protein reached 89% of daily goal with high leucine dairy staples.</span>
                </div>
              </div>
            </div>

            {/* Top Priority */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 text-sm block">Top Priority for Tonight</strong>
                <p className="text-xs text-amber-800 mt-0.5">
                  Add 1 cup of curd or roasted chana to close the remaining 11.5g protein gap without entering an unintended caloric surplus.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY REVIEW */}
      {activeTab === "WEEKLY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
                  Window: Last 7 Days Performance
                </span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">
                  Weekly Nutrition Performance Review
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-semibold">Average Adherence</span>
                <div className="text-2xl font-extrabold text-emerald-600">{weeklyData?.avg_score || 84} / 100</div>
              </div>
            </div>

            {/* 7-Day Averages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Calories</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{weeklyData?.avg_calories || 2060} kcal</div>
                <span className="text-xs text-emerald-600 font-medium">96% Target Match</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Protein</span>
                <div className="text-2xl font-bold text-blue-600 mt-1">{weeklyData?.avg_protein || 98.5}g</div>
                <span className="text-xs text-blue-600 font-medium">+9.6% vs last week</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Fiber</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">26.4g</div>
                <span className="text-xs text-amber-700 font-medium">+13.6% vs last week</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Consistency</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">7 / 7 Days</div>
                <span className="text-xs text-slate-500">100% Tracking Streak</span>
              </div>
            </div>

            {/* Week-over-Week Comparison */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-heading font-bold text-base text-slate-900">Week-over-Week Progression</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Average Energy Intake</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">2,110 → 2,060 kcal</div>
                  <span className="text-emerald-600 font-semibold">-50 kcal (Disciplined Deficit)</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Crude Protein Pacing</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">89.5g → 98.5g</div>
                  <span className="text-blue-600 font-semibold">+10.1% Improvement</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Adherence Composite Score</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">76 → 84 / 100</div>
                  <span className="text-emerald-600 font-semibold">+8 Points (High Consistency)</span>
                </div>
              </div>
            </div>

            {/* Best Day & Needs Improvement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Day: Tuesday
                </h4>
                <p className="text-xs text-emerald-900">
                  Reached 106g protein with 2,120 kcal. Yellow dal + paneer bhurji combination delivered optimal amino acid synergy.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Focus Area: Sunday
                </h4>
                <p className="text-xs text-amber-900">
                  Fiber intake dipped to 18g during restaurant meal. Supplementing with raw salad easily rectifies this pattern.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY AUDIT */}
      {activeTab === "MONTHLY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
                  Monthly Review: September 2026
                </span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">
                  Monthly Nutrition Intelligence Audit
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-semibold">Goal Adherence</span>
                <div className="text-2xl font-extrabold text-blue-600">88%</div>
              </div>
            </div>

            {/* Monthly Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Daily Calories</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{monthlyData?.avg_calories || 2050} kcal</div>
                <span className="text-xs text-slate-500">Target: 2,150 kcal</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Daily Protein</span>
                <div className="text-2xl font-bold text-blue-600 mt-1">{monthlyData?.avg_protein || 98.2}g</div>
                <span className="text-xs text-blue-600">Target: 110g</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Average Daily Fiber</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">26.1g</div>
                <span className="text-xs text-slate-500">ICMR Target: 30g</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-semibold block">Monthly Score</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{monthlyData?.avg_score || 83} / 100</div>
                <span className="text-xs text-emerald-600">High Consistency</span>
              </div>
            </div>

            {/* Meal Logging Consistency */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-heading font-bold text-base text-slate-900">30-Day Meal Logging Consistency</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block">Breakfast</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{monthlyData?.meal_consistency?.breakfast || 28} / 30 days</div>
                  <span className="text-emerald-600 font-semibold">93% Consistency</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block">Lunch</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{monthlyData?.meal_consistency?.lunch || 30} / 30 days</div>
                  <span className="text-emerald-600 font-semibold">100% Consistency</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block">Dinner</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{monthlyData?.meal_consistency?.dinner || 29} / 30 days</div>
                  <span className="text-emerald-600 font-semibold">97% Consistency</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500 block">Snacks</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{monthlyData?.meal_consistency?.snacks || 22} / 30 days</div>
                  <span className="text-slate-600 font-semibold">73% Consistency</span>
                </div>
              </div>
            </div>

            {/* Top Logged Foods & Protein Contributors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Top Logged Indian Foods</h4>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex justify-between"><span>1. Whole Wheat Chapati / Roti</span><strong>58 times</strong></li>
                  <li className="flex justify-between"><span>2. Yellow Dal Tadka</span><strong>28 times</strong></li>
                  <li className="flex justify-between"><span>3. Paneer Bhurji</span><strong>24 times</strong></li>
                  <li className="flex justify-between"><span>4. Boiled Eggs</span><strong>22 times</strong></li>
                  <li className="flex justify-between"><span>5. Homemade Curd / Yogurt</span><strong>20 times</strong></li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Next Month Action Protocol</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                    <span>Pair lentils with 1/2 lemon juice to enhance non-heme iron uptake.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                    <span>Add 1 bowl of raw sliced salad at dinner to bridge the 4g fiber target.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                    <span>Maintain daily hydration above 2.5L for optimal workout recovery.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM RANGE */}
      {activeTab === "CUSTOM" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-xl font-heading font-extrabold text-slate-900">Custom Date Range Audit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <button
                onClick={() => handleGeneratePdf("CUSTOM")}
                disabled={generating}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs cursor-pointer"
              >
                Generate Custom Range PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Reports Archive List */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" /> Downloadable PDF Documents Archive
        </h2>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            Loading generated reports archive...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center text-slate-500 border border-slate-200 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-400 stroke-1" />
            <p className="text-sm">No PDF reports generated yet.</p>
            <button
              onClick={() => handleGeneratePdf("WEEKLY")}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              Generate First PDF Report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              const summary = typeof rep.summary_data === "string" ? JSON.parse(rep.summary_data) : rep.summary_data;
              const isDownloading = downloadingId === rep.id;
              return (
                <div
                  key={rep.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{rep.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Generated on {new Date(rep.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })} · Type: <strong className="text-blue-600">{rep.report_type}</strong>
                      </div>
                      {summary && (
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                          <span>Avg Calories: <strong className="text-slate-900">{summary.avg_calories} kcal</strong></span>
                          <span>•</span>
                          <span>Avg Protein: <strong className="text-blue-600">{summary.avg_protein}g</strong></span>
                          <span>•</span>
                          <span>Score: <strong className="text-emerald-600">{summary.nutrition_score}/100</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleDownload(rep.id, rep.pdf_filename)}
                      disabled={isDownloading}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-blue-600" /> Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default Reports;
