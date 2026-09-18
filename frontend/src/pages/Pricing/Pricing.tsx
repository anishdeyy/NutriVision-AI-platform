import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import confetti from "canvas-confetti";
import {
  Zap,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Pricing: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.getPlans();
        setPlans(res.data);
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;

    setProcessingPlan(planId);
    setMessage(null);

    try {
      // Step 1: Create Order on backend
      const orderRes = await api.createOrder(planId);
      const { order_id, amount, currency, key_id, plan_name } = orderRes.data;

      // Step 2: Open Razorpay Modal
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "NutriVision AI",
        description: `Upgrade to ${plan_name}`,
        order_id: order_id,
        prefill: {
          name: user?.name || "NutriVision Member",
          email: user?.email || "demo@nutrivision.ai",
        },
        theme: {
          color: "#3b9eff",
        },
        handler: async (response: any) => {
          try {
            // Step 3: Verify signature on backend
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Trigger celebratory confetti
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            setMessage({
              type: "success",
              text: `🎉 Successfully upgraded to ${plan_name}! All premium intelligence features unlocked.`
            });

            if (refreshUser) refreshUser();
          } catch (verifyErr) {
            console.error("Signature verification failed:", verifyErr);
            setMessage({
              type: "error",
              text: "Payment verification failed. Please contact support."
            });
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setMessage({
          type: "error",
          text: "Razorpay SDK is not loaded. Please refresh your browser."
        });
      }
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Unable to initiate checkout. Please try again."
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const featureMatrix = [
    { name: "Indian Food Database (146+ items)", free: "Full", pro: "Full", premium: "Full" },
    { name: "DIAAS Bioavailability & Effective Protein", free: "Basic", pro: "Full", premium: "Full" },
    { name: "AI Nutrition Reasoning (Gemini 2.5)", free: "3 / day", pro: "Unlimited", premium: "Unlimited" },
    { name: "Scientific RAG Citations (ICMR-NIN, FAO)", free: false, pro: true, premium: true },
    { name: "Personalized Multi-Day Meal Planner", free: "1 Day", pro: "7 Days", premium: "30 Days" },
    { name: "Automated Weekly Grocery Checklist", free: false, pro: true, premium: true },
    { name: "Downloadable Clinical PDF Reports", free: false, pro: "Weekly", premium: "Weekly & Monthly" },
    { name: "Direct Nutritionist Review", free: false, pro: false, premium: true },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#3b9eff]/15 text-[#3b9eff] border border-[#3b9eff]/30">
          <Sparkles className="w-3.5 h-3.5" /> Razorpay Test Environment Ready
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">
          Invest in Your Cellular Health & Longevity
        </h1>
        <p className="text-sm text-slate-400">
          Transparent, evidence-based nutrition intelligence built for the Indian metabolism. Upgrade or cancel anytime.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 max-w-xl mx-auto ${
            message.type === "success"
              ? "bg-[#00e5a0]/15 border-[#00e5a0]/40 text-[#00e5a0]"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => {
          const isCurrent = user?.plan?.toLowerCase() === p.id.toLowerCase();
          const isPopular = p.is_popular;

          return (
            <div
              key={p.id}
              className={`relative glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all ${
                isPopular
                  ? "border-[#3b9eff] shadow-xl shadow-[#3b9eff]/15 scale-105 z-10"
                  : "border-[rgba(80,130,200,0.2)] hover:border-[#3b9eff]/40"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#3b9eff] to-[#7c5cfc] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular for Darukaa Challenge
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-heading font-extrabold text-white">{p.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00e5a0]/20 text-[#00e5a0] border border-[#00e5a0]/30">
                      Active Tier
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹{p.price_inr}</span>
                  <span className="text-xs text-slate-400">/{p.interval}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {p.features.map((f: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-[#00e5a0] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[rgba(80,130,200,0.15)]">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-[#080c18] border border-[rgba(80,130,200,0.2)] text-slate-400 text-xs font-bold cursor-not-allowed"
                  >
                    Current Active Plan
                  </button>
                ) : p.id === "free" ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-[#080c18] text-slate-400 text-xs font-bold"
                  >
                    Default Free Tier
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.id)}
                    disabled={processingPlan === p.id}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? "bg-[#3b9eff] hover:bg-[#2b88e8] text-white shadow-lg shadow-[#3b9eff]/25"
                        : "bg-[#7c5cfc] hover:bg-[#6847ec] text-white shadow-lg shadow-[#7c5cfc]/25"
                    }`}
                  >
                    {processingPlan === p.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Launching Razorpay...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Upgrade to {p.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(80,130,200,0.2)] space-y-6">
        <h2 className="text-xl font-heading font-extrabold text-white text-center">
          Compare Features & Clinical Capabilities
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[rgba(80,130,200,0.15)] text-xs uppercase tracking-wider text-slate-400">
                <th className="p-3">Platform Capability</th>
                <th className="p-3 text-center">Free</th>
                <th className="p-3 text-center text-[#3b9eff]">Pro (₹299)</th>
                <th className="p-3 text-center text-[#a78bfa]">Premium (₹599)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(80,130,200,0.1)] text-xs">
              {featureMatrix.map((feat, idx) => (
                <tr key={idx} className="hover:bg-[#080c18]/40">
                  <td className="p-3 font-medium text-slate-200">{feat.name}</td>
                  <td className="p-3 text-center text-slate-400">
                    {typeof feat.free === "boolean" ? (
                      feat.free ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00e5a0] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 mx-auto" />
                      )
                    ) : (
                      feat.free
                    )}
                  </td>
                  <td className="p-3 text-center font-semibold text-[#3b9eff]">
                    {typeof feat.pro === "boolean" ? (
                      feat.pro ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00e5a0] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 mx-auto" />
                      )
                    ) : (
                      feat.pro
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-[#a78bfa]">
                    {typeof feat.premium === "boolean" ? (
                      feat.premium ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00e5a0] mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 mx-auto" />
                      )
                    ) : (
                      feat.premium
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Pricing;
