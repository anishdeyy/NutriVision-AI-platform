import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar/Navbar";

// Pages
import { Landing } from "./pages/Landing/Landing";
import { Login } from "./pages/Login/Login";
import { Register } from "./pages/Register/Register";
import { Onboarding } from "./pages/Onboarding/Onboarding";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { FoodLog } from "./pages/FoodLog/FoodLog";
import { AIAdvisor } from "./pages/AIAdvisor/AIAdvisor";
import { NutritionResearch } from "./pages/NutritionResearch/NutritionResearch";
import { MealPlanner } from "./pages/MealPlanner/MealPlanner";
import { Grocery } from "./pages/Grocery/Grocery";
import { Recipes } from "./pages/Recipes/Recipes";
import { FoodComparison } from "./pages/FoodComparison/FoodComparison";
import { Analytics } from "./pages/Analytics/Analytics";
import { Reports } from "./pages/Reports/Reports";
import { Pricing } from "./pages/Pricing/Pricing";
import { FoodExplorer } from "./pages/FoodExplorer/FoodExplorer";
import { Profile } from "./pages/Profile/Profile";
import { Admin } from "./pages/Admin/Admin";

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020409]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#3b9eff] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Initializing NutriVision AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020409] text-[#e8f0fe] flex flex-col selection:bg-[#3b9eff] selection:text-white">
      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Protected Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-log"
            element={
              <ProtectedRoute>
                <FoodLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-explorer"
            element={
              <ProtectedRoute>
                <FoodExplorer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-advisor"
            element={
              <ProtectedRoute>
                <AIAdvisor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <NutritionResearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meal-planner"
            element={
              <ProtectedRoute>
                <MealPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery"
            element={
              <ProtectedRoute>
                <Grocery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <FoodComparison />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
