import axios from "axios";
import {
  User, UserProfile, Food, Meal, DailyNutritionSummary,
  NutritionScoreResponse, PotentialNutrientGap, AIChatMessage,
  PlanInfo
} from "../types";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("nv_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        localStorage.removeItem("nv_token");
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (data: any) => API.post("/auth/login", data),
  register: (data: any) => API.post("/auth/register", data),
  getMe: () => API.get<User>("/auth/me"),

  // Profile
  getProfile: () => API.get<UserProfile>("/profile"),
  updateProfile: (data: any) => API.put<UserProfile>("/profile", data),
  parseProfileText: (prompt: string) => API.post("/profile/parse-natural-language", { prompt }),

  // Foods
  getFoods: (params?: any) => API.get<Food[]>("/foods", { params }),
  getFoodById: (id: number) => API.get<Food>(`/foods/${id}`),
  compareFoods: (food_ids: number[]) => API.post("/foods/compare", { food_ids }),
  getProteinOptimizer: (diet_type: string, max_calories?: number) =>
    API.get<Food[]>("/foods/protein-optimizer", { params: { diet_type, max_calories } }),

  // Meals
  getMeals: (meal_date?: string) => API.get<Meal[]>("/meals", { params: { meal_date } }),
  createMeal: (data: any) => API.post<Meal>("/meals", data),
  deleteMeal: (id: number) => API.delete(`/meals/${id}`),
  parseMealText: (text: string) => API.post("/meals/parse", { text }),
  getMealSwaps: (meal_id: number) => API.post("/meals/swap-options", { meal_id }),

  // Nutrition
  getTodaySummary: (target_date?: string) => API.get<DailyNutritionSummary>("/nutrition/today", { params: { target_date } }),
  getNutritionScore: (target_date?: string) => API.get<NutritionScoreResponse>("/nutrition/score", { params: { target_date } }),
  getNutrientGaps: () => API.get<{ assessment_period: string; potential_gaps: PotentialNutrientGap[]; general_disclaimer: string }>("/nutrition/gaps"),
  getHistory: (days: number = 7) => API.get("/nutrition/history", { params: { days } }),

  // AI & Reasoning
  chatAI: (message: string, conversation_id?: number, include_rag: boolean = true) =>
    API.post("/ai/chat", { message, conversation_id, include_rag }),
  listConversations: () => API.get("/ai/conversations"),
  getConversation: (id: number) => API.get(`/ai/conversations/${id}`),
  whatShouldIEat: (meal_type?: string) => API.post("/ai/what-should-i-eat", { meal_type }),
  fixMyDay: () => API.post("/ai/fix-my-day"),
  getWeeklyReview: () => API.post("/ai/weekly-review"),
  generateRecipe: (ingredients: string[], cooking_time_mins?: number) =>
    API.post("/ai/recipe", { available_ingredients: ingredients, cooking_time_mins }),
  analyzeImage: (image_base64?: string) => API.post("/ai/analyze-image", { image_base64 }),

  // RAG Knowledge Base
  queryRAG: (query: string, top_k: number = 3) => API.post("/rag/query", { query, top_k }),
  listSources: () => API.get("/rag/sources"),
  reindexRAG: () => API.post("/rag/index"),

  // Meal Plans & Grocery
  generateMealPlan: (days: number, budget_per_day?: number, region?: string) =>
    API.post("/meal-plans/generate", { days, budget_per_day, region }),
  generateGroceryList: (plan: any) => API.post("/meal-plans/grocery", plan),

  // Reports & PDF Downloads
  generateReport: (report_type: string = "WEEKLY") => API.post("/reports/generate", { report_type }),
  listReports: () => API.get("/reports"),
  getReportDownloadUrl: (id: number) => {
    const token = localStorage.getItem("nv_token") || "";
    return `/api/reports/${id}/download?token=${encodeURIComponent(token)}`;
  },
  downloadReportBlob: async (id: number, filename?: string) => {
    const res = await API.get(`/reports/${id}/download`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || `NutriVision_Report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },

  // Daily Checkin
  getTodayCheckin: () => API.get("/checkins/today"),
  saveCheckin: (data: any) => API.post("/checkins", data),
  getCheckinHistory: (days: number = 30) => API.get("/checkins/history", { params: { days } }),

  // Analytics Engine
  getTrends: (days: number = 7) => API.get("/analytics/trends", { params: { days } }),
  getDailyAnalytics: () => API.get("/analytics/daily"),
  getWeeklyAnalytics: () => API.get("/analytics/weekly"),
  getMonthlyAnalytics: () => API.get("/analytics/monthly"),
  getMacrosAnalytics: (days: number = 7) => API.get("/analytics/macros", { params: { days } }),
  getAdherenceAnalytics: () => API.get("/analytics/adherence"),
  getScoreTrend: (days: number = 14) => API.get("/analytics/nutrition-score", { params: { days } }),

  // AI Health Check
  getAIHealth: () => API.get("/ai/health"),

  // Payments & Subscriptions
  getPlans: () => API.get<PlanInfo[]>("/payments/plans"),
  createOrder: (plan_id: string) => API.post("/payments/create-order", { plan_id }),
  verifyPayment: (data: any) => API.post("/payments/verify", data),
  getSubscription: () => API.get("/payments/subscription"),

  // Admin & Data Management
  getAdminStats: () => API.get("/admin/stats"),
  getAdminUsers: () => API.get("/admin/users"),
  getAdminPayments: () => API.get("/admin/payments"),
  getDatasets: () => API.get("/admin/datasets"),
  importDatasets: () => API.post("/admin/datasets/import"),
  getDataQuality: () => API.get("/admin/data-quality"),
  getFoodProvenance: (id: number) => API.get(`/foods/${id}/sources`),
  getFoodStats: () => API.get("/foods/stats"),
};

export default api;
