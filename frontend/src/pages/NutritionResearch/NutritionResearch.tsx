import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { BookOpen, Search, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";

export const NutritionResearch: React.FC = () => {
  const [query, setQuery] = useState<string>("protein bioavailability DIAAS Indian vegetarian");
  const [results, setResults] = useState<any | null>(null);
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSources = async () => {
    try {
      const res = await api.listSources();
      setSourcesList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSources();
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.queryRAG(query, 3);
      setResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00e5a0]/15 text-[#00e5a0] mb-3">
          <BookOpen className="w-3.5 h-3.5" /> Research Mode (Section 54)
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Evidence Knowledge Base & Vector Retrieval
        </h1>
        <p className="text-xs text-[#a8bcd8] mt-1">
          Direct vector retrieval over scientific documents: ICMR-NIN 2024 Dietary Guidelines, FAO/WHO DIAAS studies, and clinical micronutrient reviews.
        </p>
      </div>

      {/* Query Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#4a6080] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scientific research topics (e.g. leucine threshold, iron inhibitors, phytates)..."
            className="w-full bg-black/40 border border-white/10 focus:border-[#00e5a0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a6080] outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-heading font-bold text-xs bg-[#00e5a0] hover:bg-[#00c58a] text-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? "Searching..." : <><Sparkles className="w-3.5 h-3.5" /> Retrieve Evidence</>}
        </button>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Retrieved Context */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <span>Retrieved Evidence Passages</span>
            <span className="text-xs font-normal text-[#4a6080]">(Cosine Similarity Matching)</span>
          </h3>

          {results ? (
            <div className="glass-panel rounded-3xl p-6 border border-[#00e5a0]/30 space-y-4 bg-gradient-to-b from-[#0a1525]/80 to-[#070e1c]/80">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 whitespace-pre-line text-xs leading-relaxed text-[#e8f0fe] font-mono">
                {results.context}
              </div>

              {/* Citations */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00e5a0] block mb-2">
                  Verified Scientific Citations
                </span>
                <div className="space-y-2">
                  {results.sources.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{s.title}</div>
                        <div className="text-[#a8bcd8] text-[11px] mt-0.5">{s.organization} · {s.year} · Topic: {s.topic}</div>
                        <div className="text-[10px] text-[#4a6080] mt-1 italic">{s.snippet}</div>
                      </div>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#3b9eff] hover:underline p-1">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-xs text-[#a8bcd8]">
              Perform a search above to inspect grounded knowledge context.
            </div>
          )}
        </div>

        {/* Indexed Knowledge Documents Repository */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-heading font-bold text-base text-white">
            Indexed Corpus ({sourcesList.length} Documents)
          </h3>

          <div className="space-y-3">
            {sourcesList.map((doc) => (
              <div key={doc.id} className="glass-panel rounded-2xl p-4 border border-white/10 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-white">{doc.title}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#3b9eff]/15 text-[#3b9eff]">
                    {doc.chunk_count} chunks
                  </span>
                </div>
                <div className="text-[11px] text-[#a8bcd8] mt-1">{doc.organization} ({doc.year})</div>
                <div className="text-[10px] text-[#4a6080] mt-1">{doc.document_type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
