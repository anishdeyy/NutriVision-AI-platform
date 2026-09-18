import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  Utensils,
  BookOpen,
  Calendar,
  BarChart2,
  FileText,
  CreditCard,
  User as UserIcon,
  LogOut,
  Shield,
  Layers,
  Search,
  Database,
  Menu,
  X
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Utensils },
    { to: "/food-log", label: "Food Log", icon: Search },
    { to: "/food-explorer", label: "Database", icon: Database },
    { to: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
    { to: "/research", label: "Evidence", icon: BookOpen },
    { to: "/meal-planner", label: "Planner", icon: Calendar },
    { to: "/analytics", label: "Analytics", icon: BarChart2 },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/compare", label: "Compare", icon: Layers },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              🌿
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                NutriVision<span className="text-blue-600">.AI</span>
              </span>
              <span className="text-[11px] text-slate-500 tracking-wider uppercase font-semibold">
                Nutrition Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <div className="hidden xl:flex items-center gap-1 text-[14px]">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium ${
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {/* Right side controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Plan badge */}
                <Link
                  to="/pricing"
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    user?.plan === "PREMIUM"
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : user?.plan === "PRO"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {user?.plan || "FREE"}
                </Link>

                {user?.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Admin Dashboard"
                  >
                    <Shield className="w-4 h-4 text-orange-600" />
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Profile"
                >
                  <UserIcon className="w-4 h-4 text-slate-600" />
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await demoLogin();
                    navigate("/dashboard");
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  ⚡ Try Demo
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-200 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                        active
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1.5"
                  >
                    <UserIcon className="w-4 h-4" /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm font-medium text-red-600 flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  onClick={async () => {
                    await demoLogin();
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  ⚡ Try Demo
                </button>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
