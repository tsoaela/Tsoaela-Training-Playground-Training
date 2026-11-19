import React, { useState, useMemo, useEffect } from 'react';
import { ResearchPaper, UserProfile } from '../types';
import { Lock, FileText, Sparkles, Send, CheckCircle2, ArrowUpRight, X, Shield, Bell, Check, Quote } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { ResearchCitationHelperModal } from './ResearchCitationHelperModal';
import { CATALOG_STATS } from '../data/mockData';
import {
  CatalogMultiFilterState,
  CatalogSortBy,
  CatalogSortDirection,
  EMPTY_CATALOG_FILTERS,
  filterAndSortResearchPapers,
  getResearchPaperNqfLevel,
} from '../utils/catalogOrganization';

interface ResearchCornerTabProps {
  user: UserProfile;
  researchPapers: ResearchPaper[];
  onOpenReminders?: (targetTitle?: string) => void;
  onTriggerPaywall: (featureName?: string, plan?: 'educare_pro' | 'research_pass') => void;
  targetPaperId?: string;
  onClearTargetPaper?: () => void;
  externalFilters?: CatalogMultiFilterState;
  sortBy?: CatalogSortBy;
  sortDirection?: CatalogSortDirection;
  onResetExternalFilters?: () => void;
}

export const ResearchCornerTab: React.FC<ResearchCornerTabProps> = ({
  user,
  researchPapers,
  onOpenReminders,
  onTriggerPaywall,
  targetPaperId,
  onClearTargetPaper,
  externalFilters = EMPTY_CATALOG_FILTERS,
  sortBy = 'recommended',
  sortDirection = 'desc',
  onResetExternalFilters,
}) => {
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [citationTargetPaper, setCitationTargetPaper] = useState<ResearchPaper | null>(null);
  const [citationTargetSynthesis, setCitationTargetSynthesis] = useState<string | null>(null);

  // Open paper when navigated from global search
  useEffect(() => {
    if (targetPaperId) {
      const found = researchPapers.find(p => p.id === targetPaperId);
      if (found) {
        setSelectedPaper(found);
        onClearTargetPaper?.();
      }
    }
  }, [targetPaperId, researchPapers, onClearTargetPaper]);
  const [readPapers, setReadPapers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_read_papers');
      return saved ? JSON.parse(saved) : ['rp_swarms_benchmarks'];
    } catch {
      return ['rp_swarms_benchmarks'];
    }
  });

  const togglePaperRead = (paperId: string) => {
    setReadPapers(prev => {
      const next = prev.includes(paperId) ? prev.filter(id => id !== paperId) : [...prev, paperId];
      try {
        localStorage.setItem('ttg_read_papers', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // AI Superagent state
  const [researchQuery, setResearchQuery] = useState('');
  const [researchMessages, setResearchMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: 'TTG Quantitative Research Bureau Superagent online. Formulate a query on autonomous agent benchmarks, sovereign compute clusters, or cross-border energy arbitrage.',
    },
  ]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const isSubscribedToResearch = user.subscription_tier === 'research_pass' || user.subscription_tier === 'all_access';

  // Available research categories
  const researchCategories = useMemo(() => [
    { id: 'all', label: 'All Dossiers' },
    { id: 'ai_benchmarks', label: 'AI Benchmarks & Swarms' },
    { id: 'Macroeconomics', label: 'Macroeconomics' },
    { id: 'Geopolitics & Energy', label: 'Geopolitics & Energy' },
    { id: 'Neuroscience & Leadership', label: 'Neuroscience & Leadership' },
    { id: 'free', label: 'Open Access ($0)' },
    { id: 'premium', label: 'Research Pass' },
  ], []);

  // Filter & sort research papers based on title, category, multi-select hub filters, and sort order
  const filteredPapers = useMemo(() => {
    const baseFiltered = researchPapers.filter(paper => {
      // Category filter
      if (selectedCategory === 'free' && paper.is_premium) return false;
      if (selectedCategory === 'premium' && !paper.is_premium) return false;
      if (selectedCategory === 'ai_benchmarks') {
        const isAi = paper.category.toLowerCase().includes('ai') || paper.is_ai_generated;
        if (!isAi) return false;
      } else if (selectedCategory !== 'all' && selectedCategory !== 'free' && selectedCategory !== 'premium') {
        const matchesCategory = paper.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesField = paper.field ? paper.field.toLowerCase().includes(selectedCategory.toLowerCase()) : false;
        if (!matchesCategory && !matchesField) return false;
      }

      // Search query filter: allows users to filter content by title or category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = paper.title.toLowerCase().includes(q);
        const matchesCategory = paper.category.toLowerCase().includes(q);
        const matchesField = paper.field ? paper.field.toLowerCase().includes(q) : false;
        const matchesAuthor = paper.author.toLowerCase().includes(q);
        const matchesAbstract = paper.abstract.toLowerCase().includes(q);
        const matchesMethodology = paper.methodology.toLowerCase().includes(q);
        const matchesTakeaways = paper.key_takeaways.some(t => t.toLowerCase().includes(q));
        return matchesTitle || matchesCategory || matchesField || matchesAuthor || matchesAbstract || matchesMethodology || matchesTakeaways;
      }

      return true;
    });

    return filterAndSortResearchPapers(
      baseFiltered,
      readPapers,
      externalFilters,
      sortBy,
      sortDirection
    );
  }, [researchPapers, selectedCategory, searchQuery, readPapers, externalFilters, sortBy, sortDirection]);

  const handleOpenPaper = (paper: ResearchPaper) => {
    if (paper.is_premium && !isSubscribedToResearch) {
      onTriggerPaywall(paper.title, 'research_pass');
    } else {
      setSelectedPaper(paper);
    }
  };

  const handleExecuteResearchSynthesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery.trim()) return;

    if (!isSubscribedToResearch) {
      onTriggerPaywall('Research Corner AI Superagent', 'research_pass');
      return;
    }

    const query = researchQuery;
    setResearchMessages(prev => [...prev, { sender: 'user', text: query }]);
    setResearchQuery('');
    setIsSynthesizing(true);

    setTimeout(() => {
      let analysis = '';
      const lower = query.toLowerCase();

      if (lower.includes('compute') || lower.includes('energy') || lower.includes('smr')) {
        analysis = `Executive Briefing · Sovereign Compute & Energy Synthesis:
1. Baseload Constraint: AI training cluster power demands have reached 140 kW/rack, rendering legacy commercial utility connections unviable.
2. SMR Integration: 28 dedicated small modular reactor colocation agreements have been signed across 4 sovereign jurisdictions.
3. Strategic Takeaway: Capital expenditure should prioritize long-term power purchase agreements (PPAs) over accelerator silicon acquisition, as energy access is the governing rate limiter through 2030.`;
      } else if (lower.includes('swarm') || lower.includes('agent') || lower.includes('benchmark')) {
        analysis = `Empirical Telemetry Analysis · Enterprise Swarm Reliability:
1. Multi-Model Arbitration: Heterogeneous agent architectures (combining reasoning models with deterministic schema validators) achieved a 98.7% task completion rate across 1.2M runs.
2. Error Mitigation: Cascading drift was compressed to 0.12% through hermetic intermediate representations.
3. Cost Compression: The blended cost per completed enterprise unit of work dropped by 92.3% ($0.32 vs $4.18 legacy baseline).`;
      } else {
        analysis = `Institutional Dossier Synthesis:
Based on TTG cross-sectional telemetry across Tier-1 sovereign funds and enterprise infrastructure deployments, capital allocations are pivoting toward vertical agentic platforms with proprietary verification layers. Recommended defensive posture: insist on verifiable benchmark reproducibility before committing expansion capital.`;
      }

      setResearchMessages(prev => [...prev, { sender: 'agent', text: analysis }]);
      setIsSynthesizing(false);
    }, 1000);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>TTG Institutional Intelligence</span>
          <span aria-hidden="true">·</span>
          <span>Quantitative Research Bureau</span>
          <span aria-hidden="true">·</span>
          <span>Peer-Reviewed Dossiers</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
              Research Corner & Quantitative Dossiers
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              Proprietary empirical benchmarks, sovereign compute infrastructure outlooks, and enterprise agent telemetry.
            </p>
          </div>

          {!isSubscribedToResearch && (
            <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-300 dark:border-stone-700 flex items-center gap-3 shrink-0">
              <Lock className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">Restricted Institutional Access</span>
                <span className="text-stone-500 dark:text-stone-400">Unlock Dossiers with Free Institutional Pass ($0.00)</span>
              </div>
              <button
                type="button"
                onClick={() => onTriggerPaywall('Institutional Research Papers', 'research_pass')}
                className="ml-2 px-3 py-1.5 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg whitespace-nowrap transition-colors"
              >
                Claim Free Pass
              </button>
            </div>
          )}
        </div>

        {/* Reusable SearchBar Component in Header Area */}
        <div className="mt-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Filter research dossiers by title, category, author, or field..."
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={researchCategories}
            totalResults={filteredPapers.length}
            totalAvailable={researchPapers.length}
            onResetFilters={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              onResetExternalFilters?.();
            }}
            stats={{
              curatedModules: CATALOG_STATS.curatedModules,
              studyGuides: CATALOG_STATS.studyGuides,
              studyFields: CATALOG_STATS.studyFields,
              hasAiCourses: true,
              customLabel: 'Empirical Intelligence & Verification',
            }}
          />
        </div>
      </div>

      {/* Research Papers Catalog or Empty Search State */}
      {filteredPapers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-12 text-center bg-stone-50/50 dark:bg-stone-900/40">
          <FileText className="w-8 h-8 text-stone-400 dark:text-stone-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            No research papers found matching active filters
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            Try searching for terms such as &ldquo;swarms&rdquo;, &ldquo;compute&rdquo;, or resetting your multi-select filters.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                onResetExternalFilters?.();
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              Reset Search & Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => {
            const isLocked = paper.is_premium && !isSubscribedToResearch;

            return (
              <div
                key={paper.id}
                className={`rounded-2xl border p-6 transition-all ${
                  isLocked 
                    ? 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/50 hover:border-stone-400 dark:hover:border-stone-700' 
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{paper.category}</span>
                      {paper.field && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-stone-500 dark:text-stone-400">{paper.field}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{paper.publication_date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{paper.pages} Pages</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                        NQF Level {getResearchPaperNqfLevel(paper)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{paper.author}</span>

                      {readPapers.includes(paper.id) && (
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 font-mono">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Dossier Read</span>
                        </span>
                      )}

                      {paper.is_premium ? (
                        isSubscribedToResearch ? (
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-stone-700 dark:text-stone-300" />
                            <span>Research Pass ($0)</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          Open Access
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                      {paper.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                      {paper.abstract}
                    </p>

                    {/* Quantitative Metric Strip */}
                    <div className="pt-3 flex flex-wrap gap-4 text-xs">
                      {paper.metric_summary.map((m, idx) => (
                        <div key={idx} className="bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700 px-3 py-1.5 rounded-lg">
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{m.label}</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">{m.value}</span>
                            {m.delta && (
                              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{m.delta}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex flex-col items-start lg:items-end justify-between shrink-0 gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCitationTargetSynthesis(null);
                          setCitationTargetPaper(paper);
                          setIsCitationModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Generate APA, MLA, or Harvard citation"
                      >
                        <Quote className="w-3.5 h-3.5" />
                        <span>Cite</span>
                      </button>
                      {onOpenReminders && (
                        <button
                          type="button"
                          onClick={() => onOpenReminders(paper.title)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Schedule reminder to review paper"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => onTriggerPaywall(paper.title, 'research_pass')}
                        className="px-4 py-2 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
                        <span>Unlock Free Pass ($0)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPaper(paper)}
                        className="px-4 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>{readPapers.includes(paper.id) ? 'Re-read Dossier' : 'Read Full Whitepaper'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Research Corner AI Superagent Section */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-800 dark:text-stone-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-400" />
              <span>Research Corner AI Superagent</span>
              <span aria-hidden="true">·</span>
              <span>Quantitative Dossier Synthesis</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Autonomous Intelligence Analyst
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
              Synthesize longitudinal datasets, simulate infrastructure CAPEX roadmaps, and extract empirical insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCitationTargetPaper(null);
                setCitationTargetSynthesis(
                  researchMessages.filter((m) => m.sender === 'agent').slice(-1)[0]?.text || null
                );
                setIsCitationModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Citation Helper</span>
            </button>

            {!isSubscribedToResearch && (
              <button
                type="button"
                onClick={() => onTriggerPaywall('Research AI Superagent', 'research_pass')}
                className="px-4 py-2 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Unlock AI Superagent with Free Pass ($0)</span>
              </button>
            )}
          </div>
        </div>

        {/* Locked Overlay or Live Synthesis Console */}
        {!isSubscribedToResearch ? (
          <div className="relative mt-6 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center bg-stone-50/70 dark:bg-stone-900/40">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Research AI Superagent Restricted
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                The Quantitative Research Superagent performs deep synthesis across 1.2M empirical agent runs and sovereign energy telemetry. Available through complimentary institutional grant ($0.00 / month).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onTriggerPaywall('Research AI Superagent', 'research_pass')}
                  className="px-5 py-2.5 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg shadow-sm transition-all"
                >
                  Activate Free Research Pass ($0.00)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Conversation Log */}
            <div className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs">
              {researchMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 mb-1">
                    {msg.sender === 'user' ? 'Analyst' : 'TTG Research Superagent'}
                  </div>
                  <div
                    className={`p-3.5 rounded-xl max-w-2xl leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 shadow-xs'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.sender === 'agent' && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setCitationTargetPaper(null);
                            setCitationTargetSynthesis(msg.text);
                            setIsCitationModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Quote className="w-3 h-3" />
                          <span>Generate APA / MLA / Harvard Citation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSynthesizing && (
                <div className="text-stone-400 dark:text-stone-500 text-xs italic">
                  Querying empirical telemetry tables and cross-referencing sovereign datasets...
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-stone-400 dark:text-stone-500 py-1">Sample dossier queries:</span>
              <button
                type="button"
                onClick={() => setResearchQuery('Analyze nuclear SMR colocations for 100k GPU training clusters')}
                className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                SMR nuclear colocation
              </button>
              <button
                type="button"
                onClick={() => setResearchQuery('Summarize cost reduction and drift compression in multi-agent swarms')}
                className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                Autonomous swarm drift telemetry
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleExecuteResearchSynthesis} className="flex gap-2">
              <input
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="Ask Research Superagent to synthesize empirical benchmarks..."
                className="flex-1 px-3.5 py-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
              <button
                type="submit"
                disabled={isSynthesizing}
                className="px-4 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>Synthesize</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Paper Reader Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
            onClick={() => setSelectedPaper(null)}
          />

          <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {selectedPaper.category} · {selectedPaper.publication_date} · {selectedPaper.pages} Pages
                </span>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{selectedPaper.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{selectedPaper.author}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCitationTargetSynthesis(null);
                    setCitationTargetPaper(selectedPaper);
                    setIsCitationModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Open Research Citation Helper"
                >
                  <Quote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cite Paper</span>
                </button>

                {onOpenReminders && (
                  <button
                    type="button"
                    onClick={() => onOpenReminders(selectedPaper.title)}
                    className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Set reminder for paper"
                  >
                    <Bell className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                    <span className="hidden sm:inline">Set Reminder</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => togglePaperRead(selectedPaper.id)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
                    readPapers.includes(selectedPaper.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{readPapers.includes(selectedPaper.id) ? 'Dossier Read' : 'Mark as Read'}</span>
                </button>

                <button
                  onClick={() => setSelectedPaper(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 space-y-2">
                <span className="font-bold uppercase tracking-wider text-[11px] block">Abstract</span>
                <p>{selectedPaper.abstract}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Methodology & Empirical Datasets</h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{selectedPaper.methodology}</p>
              </div>

              <div className="space-y-3 border-t border-stone-100 dark:border-stone-800 pt-4">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Key Empirical Takeaways</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  {selectedPaper.key_takeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-stone-900 dark:text-stone-100 font-bold">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Dataset Summary Metrics</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedPaper.metric_summary.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block">{m.label}</span>
                      <span className="text-sm font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified by TTG Research Bureau</span>
              </div>
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Citation Helper Modal */}
      <ResearchCitationHelperModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        researchPapers={researchPapers}
        initialPaper={citationTargetPaper}
        researchMessages={researchMessages}
        initialSynthesisText={citationTargetSynthesis}
      />

    </div>
  );
};
