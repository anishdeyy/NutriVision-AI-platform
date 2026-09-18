import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldAlert,
  Users,
  CreditCard,
  Database,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Server,
  Layers,
  Activity,
  DownloadCloud
} from "lucide-react";

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"telemetry" | "datasets" | "quality">("telemetry");

  const [stats, setStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [datasetsList, setDatasetsList] = useState<any[]>([]);
  const [dataQuality, setDataQuality] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [importingDatasets, setImportingDatasets] = useState<boolean>(false);
  const [reindexing, setReindexing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, pRes, dRes, qRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminPayments(),
        api.getDatasets(),
        api.getDataQuality()
      ]);
      setStats(sRes.data);
      setUsersList(uRes.data);
      setPaymentsList(pRes.data);
      setDatasetsList(dRes.data);
      setDataQuality(qRes.data);
    } catch (err: any) {
      console.error("Admin data load error:", err);
      setError("Admin access required. Please sign in with admin credentials (admin@nutrivision.ai).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRunKaggleImport = async () => {
    setImportingDatasets(true);
    setActionSuccess("");
    try {
      const res = await api.importDatasets();
      setActionSuccess(
        `Kaggle Ingestion Complete: ${res.data.report?.summary?.total_records_inserted || 0} new foods inserted, ${res.data.report?.summary?.total_records_updated || 0} enriched.`
      );
      loadAdminData();
    } catch (err: any) {
      console.error("Import error:", err);
      setError("Dataset import failed. Please check server logs.");
    } finally {
      setImportingDatasets(false);
    }
  };

  const handleReindexRag = async () => {
    setReindexing(true);
    setActionSuccess("");
    try {
      const res = await api.reindexRAG();
      setActionSuccess(
        `Corpus re-indexed: ${res.data.indexed_chunks_count} chunks embedded into cosine vector store.`
      );
      loadAdminData();
    } catch (err) {
      console.error("Reindex error:", err);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(80,130,200,0.15)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Admin & Governance Console
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3b9eff]/20 text-[#3b9eff] border border-[#3b9eff]/30">
              Darukaa Evaluation Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
            NutriVision Operations & Data Platform
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform activity, Kaggle dataset registry, and RAG knowledge base administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunKaggleImport}
            disabled={importingDatasets}
            className="px-4 py-2.5 rounded-xl bg-[#00e5a0] hover:bg-[#00c98c] text-black font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#00e5a0]/20 disabled:opacity-50 cursor-pointer"
          >
            <DownloadCloud className={`w-4 h-4 ${importingDatasets ? "animate-spin" : ""}`} />
            {importingDatasets ? "Ingesting Kaggle Datasets..." : "Ingest Kaggle Datasets"}
          </button>
          <button
            onClick={handleReindexRag}
            disabled={reindexing}
            className="px-4 py-2.5 rounded-xl bg-[#7c5cfc] hover:bg-[#6847ec] text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#7c5cfc]/25 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${reindexing ? "animate-spin" : ""}`} />
            {reindexing ? "Embedding Corpus..." : "Re-Index RAG"}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#00e5a0]/15 border border-[#00e5a0]/30 text-[#00e5a0] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex gap-2 border-b border-[rgba(80,130,200,0.15)] pb-3">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "telemetry"
              ? "bg-[#3b9eff] text-white shadow-md shadow-[#3b9eff]/20"
              : "bg-[#080c18] text-slate-400 hover:text-white"
          }`}
        >
          Platform Telemetry
        </button>
        <button
          onClick={() => setActiveTab("datasets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "datasets"
              ? "bg-[#3b9eff] text-white shadow-md shadow-[#3b9eff]/20"
              : "bg-[#080c18] text-slate-400 hover:text-white"
          }`}
        >
          Kaggle Dataset Management
        </button>
        <button
          onClick={() => setActiveTab("quality")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "quality"
              ? "bg-[#3b9eff] text-white shadow-md shadow-[#3b9eff]/20"
              : "bg-[#080c18] text-slate-400 hover:text-white"
          }`}
        >
          Data Quality & Completeness
        </button>
      </div>

      {/* TAB 1: Platform Telemetry */}
      {activeTab === "telemetry" && (
        <div className="space-y-8">
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Users</div>
                <div className="text-2xl font-extrabold text-white mt-1">{stats.total_users}</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Pro Members</div>
                <div className="text-2xl font-extrabold text-[#3b9eff] mt-1">{stats.pro_subscribers}</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Premium Members</div>
                <div className="text-2xl font-extrabold text-[#a78bfa] mt-1">{stats.premium_subscribers}</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue</div>
                <div className="text-2xl font-extrabold text-[#00e5a0] mt-1">₹{stats.total_revenue_inr}</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Meals Logged</div>
                <div className="text-2xl font-extrabold text-white mt-1">{stats.total_meals_logged}</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Indexed Foods</div>
                <div className="text-2xl font-extrabold text-[#ff8c42] mt-1">{stats.total_foods_indexed}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Users Table */}
            <div className="glass-panel p-6 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3b9eff]" /> Registered Platform Users
                </h2>
                <span className="text-xs text-slate-400">{usersList.length} members</span>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[rgba(80,130,200,0.15)] text-slate-400">
                      <th className="pb-2">User</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2 text-right">Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(80,130,200,0.1)]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[#080c18]/50">
                        <td className="py-2.5 font-medium text-white">{u.name}</td>
                        <td className="py-2.5 text-slate-400 truncate max-w-[140px]">{u.email}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-[10px] text-slate-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.plan === "PRO"
                                ? "bg-[#3b9eff]/20 text-[#3b9eff]"
                                : u.plan === "PREMIUM"
                                ? "bg-[#7c5cfc]/20 text-[#a78bfa]"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {u.plan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Table */}
            <div className="glass-panel p-6 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#00e5a0]" /> Razorpay Orders & Transactions
                </h2>
                <span className="text-xs text-slate-400">{paymentsList.length} logs</span>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[rgba(80,130,200,0.15)] text-slate-400">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Plan</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(80,130,200,0.1)]">
                    {paymentsList.map((p) => (
                      <tr key={p.id} className="hover:bg-[#080c18]/50">
                        <td className="py-2.5 font-mono text-[11px] text-slate-300">
                          {p.razorpay_order_id}
                        </td>
                        <td className="py-2.5 font-semibold text-white">{p.plan}</td>
                        <td className="py-2.5 text-[#00e5a0] font-bold">
                          ₹{Math.round(p.amount / 100)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === "paid"
                                ? "bg-[#00e5a0]/20 text-[#00e5a0]"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kaggle Dataset Management */}
      {activeTab === "datasets" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#3b9eff]" /> External Kaggle Datasets Registry
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active external datasets downloaded via KaggleHub and integrated into the PostgreSQL unified food schema.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[rgba(80,130,200,0.15)] text-slate-400">
                    <th className="p-3">Dataset Name</th>
                    <th className="p-3">Kaggle Identifier</th>
                    <th className="p-3">Rows</th>
                    <th className="p-3">Files</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Last Downloaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(80,130,200,0.1)]">
                  {datasetsList.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[#080c18]/50">
                      <td className="p-3 font-semibold text-white">{ds.dataset_name}</td>
                      <td className="p-3 font-mono text-[#93c5fd]">{ds.kaggle_identifier}</td>
                      <td className="p-3 font-bold text-[#00e5a0]">{ds.row_count} rows</td>
                      <td className="p-3 text-slate-300">{ds.file_count}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00e5a0]/15 text-[#00e5a0] border border-[#00e5a0]/30">
                          {ds.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400">
                        {new Date(ds.downloaded_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Quality & Completeness */}
      {activeTab === "quality" && dataQuality && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 uppercase">Curated Baseline Foods</div>
              <div className="text-2xl font-bold text-[#3b9eff] mt-1">{dataQuality.curated_foods}</div>
              <div className="text-[10px] text-slate-500">Hand-verified DIAAS</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 uppercase">Kaggle Imported Foods</div>
              <div className="text-2xl font-bold text-[#a78bfa] mt-1">{dataQuality.imported_foods}</div>
              <div className="text-[10px] text-slate-500">Kaggle Ingested</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 uppercase">With Micronutrients</div>
              <div className="text-2xl font-bold text-[#00e5a0] mt-1">{dataQuality.foods_with_micronutrients}</div>
              <div className="text-[10px] text-slate-500">Fe, Ca, Folate, Vit C</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl">
              <div className="text-[11px] text-slate-400 uppercase">Validated Energy Balance</div>
              <div className="text-2xl font-bold text-white mt-1">
                {dataQuality.consistency_flags?.VALID || 0}
              </div>
              <div className="text-[10px] text-slate-500">4P + 4C + 9F consistent</div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Nutrient Completeness Rates across 1,730+ Foods
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {Object.entries(dataQuality.completeness_rates).map(([nutr, rate]: any) => (
                <div key={nutr} className="p-3 bg-[#080c18] rounded-xl border border-[rgba(80,130,200,0.15)] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-300 font-semibold">{nutr}</span>
                    <span className="font-bold text-[#3b9eff]">{rate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#3b9eff] to-[#00e5a0] h-full rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
