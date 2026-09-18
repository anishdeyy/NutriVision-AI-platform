import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { PaymentModal } from "../PaymentModal/PaymentModal";

interface PremiumGateProps {
  feature: string;
  requiredPlan?: "PRO" | "PREMIUM";
  children: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  requiredPlan = "PRO",
  children,
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState<boolean>(false);

  const plan = user?.plan || "FREE";
  const hasAccess =
    plan === "PREMIUM" || (requiredPlan === "PRO" && plan === "PRO");

  if (hasAccess) {
    return <>{children}</>;
  }

  const priceText = requiredPlan === "PREMIUM" ? "₹599/month" : "₹299/month";
  const planName = requiredPlan === "PREMIUM" ? "Premium Elite" : "Pro";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#7c5cfc]/30 p-8 text-center glass-panel bg-gradient-to-b from-[#0e1630]/90 to-[#080c18]/90">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#7c5cfc]/20 border border-[#7c5cfc]/40 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-[#a38bff]" />
      </div>

      <h3 className="font-heading font-extrabold text-xl text-white">
        🔒 {feature}
      </h3>
      <p className="text-xs text-[#a8bcd8] max-w-md mx-auto mt-2 leading-relaxed">
        This feature requires a NutriVision {planName} membership. Unlock scientific RAG evidence reasoning, multi-week audits, and custom meal planning.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-[#3b9eff] to-[#7c5cfc] hover:opacity-95 text-white shadow-lg shadow-[#7c5cfc]/25 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#ffd60a]" /> Upgrade to {planName} ({priceText})
        </button>
      </div>

      {showModal && (
        <PaymentModal
          planId={requiredPlan.toLowerCase()}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};
