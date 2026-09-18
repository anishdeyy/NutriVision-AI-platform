import React from "react";

interface NutritionRingProps {
  consumed: number;
  target: number;
  size?: number;
}

export const NutritionRing: React.FC<NutritionRingProps> = ({ consumed, target, size = 220 }) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const remaining = Math.max(0, target - consumed);

  return (
    <div className="relative flex flex-col items-center justify-center p-2" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Calories</span>
        <div className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight my-0.5">
          {consumed.toLocaleString()}
        </div>
        <span className="text-xs text-slate-400">
          / {target.toLocaleString()} kcal
        </span>
        <div className="mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {remaining > 0 ? `${remaining} kcal left` : "Target Met"}
        </div>
      </div>
    </div>
  );
};
