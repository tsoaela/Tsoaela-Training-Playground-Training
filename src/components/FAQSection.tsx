import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Ticket,
  Radio,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CreditCard,
  GraduationCap,
  Scale,
  Building2,
  Compass,
  FolderOpen,
} from 'lucide-react';
import { FAQ_ITEMS, FAQCategory } from '../data/mockData';

interface FAQSectionProps {
  onNavigateTab?: (tab: 'educare' | 'research' | 'digital_world' | 'retreats' | 'billing' | 'faq') => void;
  onSelectTab?: (tab: 'educare' | 'research' | 'digital_world' | 'retreats' | 'billing' | 'faq') => void;
  onOpenPaywall?: () => void;
}

const CATEGORY_CONFIG: Array<{
  key: FAQCategory;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  accentClass: string;
}> = [
  {
    key: 'Accreditation & Legitimacy',
    label: 'Accreditation & Legitimacy',
    subtitle: 'Institutional relationships, regulatory compliance, provider vetting & certificate verification',
    icon: ShieldCheck,
    accentClass: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    key: 'Account',
    label: 'Account',
    subtitle: 'Saved programs, study progress, reminders & $0 institutional grant access',
    icon: UserCheck,
    accentClass: 'text-purple-700 dark:text-purple-400',
  },
  {
    key: 'Stripe Payments',
    label: 'Stripe Payments',
    subtitle: 'Stripe Checkout, retreats ticketing, invoices, tax receipts & refunds',
    icon: CreditCard,
    accentClass: 'text-amber-700 dark:text-amber-400',
  },
  {
    key: 'Academic Credits',
    label: 'Academic Credits',
    subtitle: 'NQF credit outlines, qualification comparison & transfer articulation',
    icon: GraduationCap,
    accentClass: 'text-blue-700 dark:text-blue-400',
  },
  {
    key: 'Courses & Retreats',
    label: 'Courses & Retreats',
    subtitle: 'Digital World media briefings, Research Corner & residential sanctuaries',
    icon: Compass,
    accentClass: 'text-stone-700 dark:text-stone-300',
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({
  onNavigateTab,
  onSelectTab,
}) => {
  const navigate = onSelectTab || onNavigateTab;
  const [selectedCategory, setSelectedCategory] = useState<'All' | FAQCategory>('All');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<FAQCategory[]>([
    'Accreditation & Legitimacy',
    'Account',
  ]);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>([
    'faq_acc_1',
    'faq_acc_4',
  ]);

  const normalizedQuery = faqSearchQuery.trim().toLowerCase();

  const groupedFaqs = useMemo(() => {
    const activeCats =
      selectedCategory === 'All'
        ? CATEGORY_CONFIG
        : CATEGORY_CONFIG.filter((c) => c.key === selectedCategory);

    return activeCats
      .map((cat) => {
        const items = FAQ_ITEMS.filter((item) => {
          if (item.category !== cat.key) return false;
          if (!normalizedQuery) return true;
          return (
            item.question.toLowerCase().includes(normalizedQuery) ||
            item.answer.toLowerCase().includes(normalizedQuery) ||
            cat.label.toLowerCase().includes(normalizedQuery)
          );
        });
        return { ...cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [selectedCategory, normalizedQuery]);

  const toggleCategoryAccordion = (categoryKey: FAQCategory) => {
    setOpenCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((c) => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const toggleQuestionAccordion = (id: string) => {
    setExpandedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setOpenCategories(groupedFaqs.map((g) => g.key));
    setExpandedQuestionIds(groupedFaqs.flatMap((g) => g.items.map((i) => i.id)));
  };

  const collapseAll = () => {
    setOpenCategories([]);
    setExpandedQuestionIds([]);
  };

  const totalMatchingQuestions = groupedFaqs.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>Support &amp; Knowledge Base</span>
          <span aria-hidden="true">·</span>
          <span>Frequently Asked Questions</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
            $0 Subscription Grant Policy
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Platform FAQ &amp; Accreditation Disclosures
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Clear answers grouped by topic covering Accreditation &amp; Legitimacy, Account tools, Stripe Payments, Academic Credits, and Courses &amp; Retreats.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 shrink-0 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">
              100% Free · $0 Subscription Fees
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated 'Accreditation & Legitimacy' Subsection */}
      <section
        id="faq-accreditation-legitimacy"
        aria-labelledby="faq-accreditation-heading"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs"
      >
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Governance &amp; Trust Disclosure
              </span>
              <h3
                id="faq-accreditation-heading"
                className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100"
              >
                Accreditation &amp; Legitimacy
              </h3>
            </div>
          </div>

          {navigate && (
            <button
              type="button"
              onClick={() => navigate('educare')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Inspect Accreditation Workflow in Educare</span>
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Transparent Status Callout */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                Current Status: Non-Accredited Internal Learning Platform
              </div>
              <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                TTG does <strong>not</strong> currently hold statutory higher-education accreditation or degree-granting authority. All completion certificates and serial numbers represent internal self-study records rather than university credits or government-recognized diplomas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Relationship with Academic Institutions</span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                Faculty categories and NQF-style credit ranges are structured as educational reference maps aligned with public disciplinary benchmarks. Formal credit transfer always requires an independent articulation agreement with an accredited university.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Regulatory Compliance</span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                To maintain honest regulatory compliance, TTG prohibits misleading "accredited degree" claims, separates paid event/media checkout from free learning grants, and discloses statutory councils (e.g., CHEA, QAA, ABET, WFME) for reference verification.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Course Provider Verification</span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                Submitted study guides undergo internal syllabus rubric checks, citation audits, and assessment review before publication. External third-party institutional auditing and signed Open Badges 3.0 APIs are required before issuing externally verifiable credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar & Category Quick Filter */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
              placeholder="Search questions (e.g., Stripe, credits, accreditation, certificates)..."
              className="w-full pl-10 pr-8 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery('')}
                aria-label="Clear FAQ search"
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
              {totalMatchingQuestions} {totalMatchingQuestions === 1 ? 'question' : 'questions'} in{' '}
              {groupedFaqs.length} {groupedFaqs.length === 1 ? 'category' : 'categories'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-200 cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-200 cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === 'All'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            All Categories ({FAQ_ITEMS.length})
          </button>
          {CATEGORY_CONFIG.map((cat) => {
            const count = FAQ_ITEMS.filter((i) => i.category === cat.key).length;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.key);
                  if (!openCategories.includes(cat.key)) {
                    setOpenCategories((prev) => [...prev, cat.key]);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-purple-400'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Category-Grouped Collapsible Accordions */}
      <div className="space-y-4">
        {groupedFaqs.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 space-y-2">
            <HelpCircle className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              No FAQ entries found matching &ldquo;{faqSearchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setFaqSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Search &amp; Filters
            </button>
          </div>
        ) : (
          groupedFaqs.map((group) => {
            const GroupIcon = group.icon;
            const isCategoryOpen =
              Boolean(normalizedQuery) ||
              selectedCategory !== 'All' ||
              openCategories.includes(group.key);

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs"
              >
                {/* Category Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleCategoryAccordion(group.key)}
                  aria-expanded={isCategoryOpen}
                  className="w-full px-5 py-4 bg-stone-50/80 dark:bg-stone-950/70 hover:bg-stone-100/70 dark:hover:bg-stone-900 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center shrink-0 ${group.accentClass}`}
                    >
                      <GroupIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                          {group.label}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                          {group.items.length} {group.items.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate sm:whitespace-normal">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 shrink-0">
                    {isCategoryOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Question Accordions Inside Category */}
                {isCategoryOpen && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 border-t border-stone-200 dark:border-stone-800">
                    {group.items.map((faq) => {
                      const isQuestionExpanded =
                        Boolean(normalizedQuery) || expandedQuestionIds.includes(faq.id);

                      return (
                        <div key={faq.id} className="bg-white dark:bg-stone-900">
                          <button
                            type="button"
                            onClick={() => toggleQuestionAccordion(faq.id)}
                            aria-expanded={isQuestionExpanded}
                            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors cursor-pointer"
                          >
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              {faq.question}
                            </h4>
                            <span className="text-stone-400 dark:text-stone-500 shrink-0">
                              {isQuestionExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </button>

                          {isQuestionExpanded && (
                            <div className="px-5 pb-4 pt-0 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-3">
                              <p>{faq.answer}</p>

                              {navigate && faq.targetTab && (
                                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3 flex-wrap">
                                  {faq.targetTab === 'educare' && (
                                    <button
                                      type="button"
                                      onClick={() => navigate('educare')}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      <span>Open Educare &amp; Academic Directory</span>
                                    </button>
                                  )}
                                  {faq.targetTab === 'billing' && (
                                    <button
                                      type="button"
                                      onClick={() => navigate('billing')}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Open Invoices &amp; Billing</span>
                                    </button>
                                  )}
                                  {faq.targetTab === 'retreats' && (
                                    <button
                                      type="button"
                                      onClick={() => navigate('retreats')}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                                    >
                                      <Ticket className="w-3.5 h-3.5" />
                                      <span>Explore TTG Retreats</span>
                                    </button>
                                  )}
                                  {faq.targetTab === 'digital_world' && (
                                    <button
                                      type="button"
                                      onClick={() => navigate('digital_world')}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                                    >
                                      <Radio className="w-3.5 h-3.5" />
                                      <span>Open Digital World &amp; Art Media</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Footer Note */}
      <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 flex items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-stone-400 shrink-0" />
          <span>
            Want to inspect field-specific regulatory councils? Hover or click the <strong>Verified Accreditation</strong> badge on any qualification card.
          </span>
        </div>
      </div>
    </div>
  );
};
