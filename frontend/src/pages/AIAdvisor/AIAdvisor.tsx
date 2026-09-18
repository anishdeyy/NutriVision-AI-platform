import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { AIChatMessage, SourceCitation, RecommendationItem } from "../../types";
import {
  Sparkles,
  Send,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  Plus,
  Activity,
  AlertCircle
} from "lucide-react";

export const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am NutriVision AI, your evidence-grounded nutrition intelligence advisor. I have loaded your biometric profile, daily macro targets, and recent food logs. What nutrition inquiry can I solve for you today?",
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [includeRAG, setIncludeRAG] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<string>("ready");
  const [aiModel, setAiModel] = useState<string>("gemini-3.6-flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getAIHealth();
        if (res.data) {
          setAiStatus(res.data.status);
          setAiModel(res.data.model);
        }
      } catch (err) {
        setAiStatus("offline");
      }
    };
    checkHealth();
  }, []);

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isTyping) return;

    const userMsg: AIChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      const res = await api.chatAI(text, conversationId, includeRAG);
      const data = res.data;
      setConversationId(data.conversation_id);

      const asstMsg: AIChatMessage = {
        role: "assistant",
        content: data.answer,
        structured_data: data.recommendations,
        sources_cited: data.sources,
        clarifying_questions: data.clarifying_questions,
        limitations: data.limitations,
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (e: any) {
      console.error("AI Advisor request error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "NutriVision AI is temporarily reconnecting with the nutrition intelligence engine. Please retry in a few seconds.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const samplePrompts = [
    "How can I reach 110g protein on an Indian vegetarian cutting diet?",
    "Why does my energy crash 2 hours after white rice and dal?",
    "What are the best low-calorie, high bioavailable protein Indian foods?",
    "How does pairing lemon juice with lentils affect iron bioavailability?",
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-16px)]">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl text-slate-900">
                NutriVision AI Advisor
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {aiModel} • Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-variable reasoning • Grounded in ICMR-NIN & FAO nutrition literature
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={includeRAG}
              onChange={(e) => setIncludeRAG(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span>Ground with RAG Evidence</span>
          </label>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 my-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-3xl rounded-2xl p-5 text-[15px] leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-xs"
                  : "bg-white text-slate-800 rounded-tl-xs border border-slate-200"
              }`}
            >
              <div className="whitespace-pre-line">{m.content}</div>

              {/* Structured Recommendations Card */}
              {m.structured_data && m.structured_data.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                  <span className="text-xs uppercase font-bold text-blue-600 tracking-wider block">
                    Structured Actionable Recommendations
                  </span>
                  {m.structured_data.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-800"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {rec.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Confidence: {rec.confidence}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        <strong className="text-slate-900">Why:</strong> {rec.why}
                      </p>

                      <div className="text-sm text-emerald-800 font-medium">
                        <strong className="text-slate-900">How to implement:</strong> {rec.how_to_implement}
                      </div>

                      {/* Nutrition Impact */}
                      {rec.nutrition_impact && (
                        <div className="flex items-center gap-3 pt-2 text-xs font-mono text-slate-600 border-t border-slate-200/60">
                          <span>Calories: <strong>+{rec.nutrition_impact.calories} kcal</strong></span>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold">Protein: <strong>+{rec.nutrition_impact.protein}g</strong></span>
                          {rec.nutrition_impact.fiber ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-semibold">Fiber: <strong>+{rec.nutrition_impact.fiber}g</strong></span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Clarifying Questions */}
              {m.clarifying_questions && m.clarifying_questions.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800">
                    <HelpCircle className="w-4 h-4" /> Clarifying Questions to Refine Reasoning:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {m.clarifying_questions.map((q, qIdx) => (
                      <li key={qIdx} className="cursor-pointer hover:underline text-blue-700" onClick={() => handleSend(q)}>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scientific Sources Cited */}
              {m.sources_cited && m.sources_cited.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                    Evidence Sources Used (Scientific RAG)
                  </span>
                  <div className="space-y-1.5">
                    {m.sources_cited.map((s, sIdx) => (
                      <div key={sIdx} className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <div>
                          <strong className="text-slate-900">[{sIdx + 1}] {s.title}</strong> — {s.organization} ({s.year})
                        </div>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 ml-2 font-medium"
                          >
                            Read <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-3 rounded-2xl max-w-sm shadow-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            Analyzing profile metrics and retrieving scientific evidence...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 3 && (
        <div className="py-2 flex flex-wrap gap-2 flex-shrink-0">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 border border-slate-200 rounded-full px-3.5 py-1.5 transition-colors text-left shadow-xs cursor-pointer"
            >
              💡 {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar & Medical Notice */}
      <div className="pt-3 flex-shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything (e.g. How can I increase protein while staying under 2100 kcal?)"
            className="flex-1 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          NutriVision AI provides evidence-grounded educational guidance based on ICMR-NIN & FAO reference data. Not intended for clinical medical diagnoses or medication management.
        </p>
      </div>
    </div>
  );
};
export default AIAdvisor;
