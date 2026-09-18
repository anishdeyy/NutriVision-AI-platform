import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsLoading(true);
    try {
      await demoLogin();
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg("Demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
      <div className="glass-panel rounded-3xl max-w-md w-full p-8 border border-[#5082c8]/25 shadow-2xl relative">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b9eff] to-[#7c5cfc] flex items-center justify-center text-xl mx-auto shadow-lg shadow-[#3b9eff]/20 mb-3">
            🌿
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Welcome Back</h2>
          <p className="text-xs text-[#a8bcd8] mt-1">
            Access your evidence-grounded nutrition intelligence
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#a8bcd8] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#4a6080] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-black/40 border border-white/10 focus:border-[#3b9eff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a6080] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#a8bcd8] block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#4a6080] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 focus:border-[#3b9eff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a6080] outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-[#3b9eff] to-[#7c5cfc] hover:opacity-95 text-white shadow-lg shadow-[#3b9eff]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 text-[11px] text-[#4a6080] bg-[#0a1023] uppercase font-bold tracking-wider">
            Or quick demo
          </span>
        </div>

        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl font-heading font-bold text-xs bg-[#7c5cfc]/20 hover:bg-[#7c5cfc]/30 text-[#a38bff] border border-[#7c5cfc]/40 flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" /> Continue with Demo User (Rahul Sharma)
        </button>

        <p className="text-xs text-center text-[#a8bcd8] mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#3b9eff] font-semibold hover:underline">
            Register free
          </Link>
        </p>
      </div>
    </div>
  );
};
