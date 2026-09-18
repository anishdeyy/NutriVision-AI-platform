import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { CheckCircle2, HeartPulse, Moon, Dumbbell, Droplets, Sparkles } from "lucide-react";

export const DailyCheckinCard: React.FC = () => {
  const [energy, setEnergy] = useState<number>(3);
  const [hunger, setHunger] = useState<number>(3);
  const [sleep, setSleep] = useState<string>("Average");
  const [workout, setWorkout] = useState<string>("Moderate");
  const [waterMl, setWaterMl] = useState<number>(2200);
  const [notes, setNotes] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await api.getTodayCheckin();
        if (res.data) {
          setEnergy(res.data.energy_score);
          setHunger(res.data.hunger_score);
          setSleep(res.data.sleep_quality);
          setWorkout(res.data.workout_level);
          setWaterMl(res.data.water_ml);
          setNotes(res.data.notes || "");
          setSaved(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchToday();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saveCheckin({
        energy_score: energy,
        hunger_score: hunger,
        sleep_quality: sleep,
        workout_level: workout,
        water_ml: waterMl,
        notes
      });
      setSaved(true);
    } catch (err) {
      console.error("Save checkin failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <HeartPulse className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">Daily Wellness Check-in</h3>
            <p className="text-xs text-slate-500">How did you feel today? Context for your nutrition reports.</p>
          </div>
        </div>

        {saved && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Checked in
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Energy Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ⚡ Energy Level (1-5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEnergy(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    energy === val
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Hunger Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              🍽 Hunger Level (1-5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setHunger(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hunger === val
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sleep Quality */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Moon className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Sleep Quality
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {["Poor", "Average", "Good", "Great"].map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => setSleep(sq)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sleep === sq
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Workout Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Dumbbell className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Workout Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {["No", "Light", "Moderate", "Hard"].map((wl) => (
                <button
                  key={wl}
                  type="button"
                  onClick={() => setWorkout(wl)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    workout === wl
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {wl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Observations (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Felt great post-workout, digested lunch well"
            className="w-full px-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Saving..." : saved ? "Update Today's Check-in" : "Save Today's Check-in"}
          </button>
        </div>
      </form>
    </div>
  );
};
