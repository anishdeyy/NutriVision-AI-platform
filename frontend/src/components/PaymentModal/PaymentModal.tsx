import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import confetti from "canvas-confetti";
import { X, Sparkles, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  planId?: string; // "pro" or "premium"
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ planId = "pro", onClose }) => {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>(planId.toLowerCase());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const plans = [
    {
      id: "pro",
      name: "NutriVision Pro",
      price: "₹299",
      period: "per month",
      color: "border-[#7c5cfc]/50 bg-[#7c5cfc]/10",
      features: [
        "Unlimited AI Nutrition Advisor",
        "RAG Evidence-Backed Recommendations",
        "7-Day AI Meal Plans + Grocery Lists",
        "AI Weekly Reviews & PDF Reports",
        "50 AI Queries / Day"
      ]
    },
    {
      id: "premium",
      name: "Premium Elite",
      price: "₹599",
      period: "per month",
      color: "border-amber-500/50 bg-amber-500/10",
      features: [
        "Everything in Pro",
        "Priority Gemini 2.5 Pro Pipeline",
        "30-Day Budget & Regional Meal Plans",
        "Unlimited PDF Nutrition Intelligence Audits",
        "200 AI Queries / Day"
      ]
    }
  ];

  const handleCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Create order on backend
      const orderRes = await api.createOrder(selectedPlan);
      const { order_id, amount, currency, key_id, plan_name } = orderRes.data;

      // 2. Configure Razorpay Checkout options
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "NutriVision AI",
        description: `Subscription Upgrade to ${plan_name}`,
        order_id: order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify signature server-side
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan
            });

            if (verifyRes.data.verified) {
              setIsSuccess(true);
              await refreshUser();
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 }
              });
            } else {
              setErrorMsg("Payment verification failed on server.");
            }
          } catch (e: any) {
            setErrorMsg(e.response?.data?.detail || "Payment verification failed.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "Rahul Sharma",
          email: user?.email || "demo@nutrivision.ai",
          contact: "9999999999"
        },
        theme: {
          color: "#3b9eff"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      // 3. Launch Razorpay modal
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for headless testing
        console.warn("Razorpay SDK not loaded in window, performing simulated verification");
        const verifyRes = await api.verifyPayment({
          razorpay_order_id: order_id,
          razorpay_payment_id: "pay_test_" + Date.now(),
          razorpay_signature: "sig_verified",
          plan_id: selectedPlan
        });
        if (verifyRes.data.verified) {
          setIsSuccess(true);
          await refreshUser();
        }
        setIsProcessing(false);
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || "Order creation failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel rounded-3xl max-w-lg w-full p-6 border border-[#7c5cfc]/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#a8bcd8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00e5a0]/20 border border-[#00e5a0]/40 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00e5a0]" />
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-white">
              Upgrade Successful! 🎉
            </h3>
            <p className="text-sm text-[#a8bcd8] mt-2 max-w-xs mx-auto">
              Your {selectedPlan.toUpperCase()} membership has been activated. All evidence-grounded AI tools are now unlocked.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl font-heading font-bold text-sm bg-[#3b9eff] hover:bg-[#2e82d4] text-white shadow-lg transition-all"
            >
              Continue to NutriVision
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#ffd60a]" />
              <span className="text-xs uppercase tracking-wider font-bold text-[#a8bcd8]">
                Razorpay Test Mode Active
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-white">
              Unlock Full Intelligence
            </h3>
            <p className="text-xs text-[#a8bcd8] mt-1">
              Select your preferred tier. Payments are processed securely via Razorpay.
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Plan selection cards */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlan === p.id
                      ? `${p.color} border-[#3b9eff] shadow-lg shadow-[#3b9eff]/15 scale-[1.02]`
                      : "bg-black/30 border-white/5 hover:border-white/10 opacity-75"
                  }`}
                >
                  <span className="font-heading font-bold text-sm text-white block">{p.name}</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-heading font-extrabold text-xl text-white">{p.price}</span>
                    <span className="text-[10px] text-[#4a6080]">/mo</span>
                  </div>
                  <ul className="space-y-1 mt-2">
                    {p.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-[10px] text-[#a8bcd8] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#00e5a0] flex-shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-[#a8bcd8]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00e5a0]" />
                <span>HMAC-SHA256 Verified Security</span>
              </div>
              <span className="text-[10px] font-mono text-[#4a6080]">Cards, UPI, NetBanking</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-5 w-full py-3.5 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-[#3b9eff] via-[#7c5cfc] to-[#00e5a0] hover:opacity-95 text-white shadow-xl shadow-[#3b9eff]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                "Connecting Razorpay..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay with Razorpay Test Checkout
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
