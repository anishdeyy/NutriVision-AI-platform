import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  PieChart,
  DollarSign,
  Lock,
  CheckCircle2,
  Brain,
  Scale,
  Database,
  Check
} from "lucide-react";

export const Landing: React.FC = () => {
  const { demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    await demoLogin();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Hero Section */}
      <div className="text-center pt-10 pb-12 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-6">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Darukaa Challenge • Evidence-Grounded AI Nutrition Intelligence
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-slate-900 tracking-tight leading-[1.15]">
          Eat Smarter. Track Better. <br />
          <span className="text-blue-600">
            Scientifically Grounded.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Not a generic calorie counter. NutriVision AI reasons over your biometrics, actual Indian meals, bioavailable protein (DIAAS), and peer-reviewed scientific nutrition databases (ICMR-NIN & WHO).
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Start Tracking Free <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDemo}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            ⚡ Try Instant Demo (Rahul Sharma)
          </button>
        </div>

        {/* Highlight Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> 1,730+ Indian Foods with Micro-nutrients
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-600" /> True Bioavailability (DIAAS) Scoring
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-600" /> RAG-Grounded Scientific Evidence
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Razorpay Test Monetization
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900">Multi-Variable Reasoning</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Connects at least 3 variables simultaneously: Caloric Deficit + Indian Vegetarian Diet + Low Protein + Budget Constraints to generate combined, non-obvious recommendations.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900">RAG Evidence Retrieval</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Integrated with ICMR-NIN dietary guidelines, FAO protein evaluations, and PubMed studies. Every AI recommendation cites real, retrievable scientific sources.
          </p>
        </div>

        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900">Bioavailability Multipliers</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Distinguishes crude protein from tissue-effective protein. Accounts for antinutritional factors (phytates, tannins) and demonstrates soaking and sprouting advantages.
          </p>
        </div>
      </div>

      {/* Workflow Section */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs text-center space-y-8">
        <div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            The NutriVision AI Workflow
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            From biometric profile and natural language meals to Gemini reasoning and automated grocery planning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-2xl block mb-2">📊</span>
            <strong className="text-slate-900 block text-sm font-bold">1. Profile & TDEE</strong>
            <p className="text-xs text-slate-500 mt-1">Mifflin-St Jeor target computation with macro splits.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-2xl block mb-2">🍛</span>
            <strong className="text-slate-900 block text-sm font-bold">2. Natural Meal Log</strong>
            <p className="text-xs text-slate-500 mt-1">"2 rotis, paneer, and dal" parsed into verified DB items.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-2xl block mb-2">🧬</span>
            <strong className="text-slate-900 block text-sm font-bold">3. Knowledge RAG</strong>
            <p className="text-xs text-slate-500 mt-1">Grounded in ICMR-NIN & FAO research papers.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-2xl block mb-2">💳</span>
            <strong className="text-slate-900 block text-sm font-bold">4. Razorpay Pro</strong>
            <p className="text-xs text-slate-500 mt-1">Instant subscription unlock & clinical PDF reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Landing;
