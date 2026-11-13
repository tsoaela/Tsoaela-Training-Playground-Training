import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, X, Sparkles, BookOpen, FileText, Ticket, Radio } from 'lucide-react';
import { FAQ_ITEMS, FAQItem } from '../data/mockData';

interface FAQSectionProps {
  onNavigateTab?: (tab: 'educare' | 'research' | 'digital_world' | 'retreats' | 'billing' | 'faq') => void;
  onSelectTab?: (tab: 'educare' | 'research' | 'digital_world' | 'retreats' | 'billing' | 'faq') => void;
  onOpenPaywall?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onNavigateTab, onSelectTab, onOpenPaywall }) => {
  const navigate = onSelectTab || onNavigateTab;
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('faq_1');

  const categories = ['All', 'Membership & $0 Fees', 'Digital World & Art Media', 'Educare & Reading', 'Research Corner', 'TTG Retreats', 'Receipts & Billing'];

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (faqSearchQuery.trim()) {
        const q = faqSearchQuery.toLowerCase().trim();
        return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, faqSearchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>Support & Knowledge Base</span>
          <span aria-hidden="true">·</span>
          <span>Frequently Asked Questions</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">$0 Subscription Grant Policy</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Platform FAQ & Policies
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Answers regarding our complimentary $0 subscription policy, reading progress tracking, study reminders, and official tax receipts.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 shrink-0 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">
              100% Free · $0 Subscription Fees
            </span>
          </div>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="w-full pl-10 pr-8 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
            No FAQ entries found matching &ldquo;{faqSearchQuery}&rdquo;. Try another search term.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;

            return (
              <div
                key={faq.id}
                className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-stone-50/70 dark:hover:bg-stone-850/60 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      {faq.category}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      {faq.question}
                    </h4>
                  </div>

                  <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800">
                    <p>{faq.answer}</p>
                    
                    {navigate && (
                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 flex-wrap">
                        {faq.category.includes('Digital') && (
                          <button
                            type="button"
                            onClick={() => navigate('digital_world')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>Open Digital World & Art Media</span>
                          </button>
                        )}
                        {faq.category.includes('Educare') && (
                          <button
                            type="button"
                            onClick={() => navigate('educare')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Go to Educare & Track Progress</span>
                          </button>
                        )}
                        {faq.category.includes('Retreats') && (
                          <button
                            type="button"
                            onClick={() => navigate('retreats')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 dark:text-stone-100 hover:underline"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Explore Upcoming Retreats</span>
                          </button>
                        )}
                        {faq.category.includes('Billing') && (
                          <button
                            type="button"
                            onClick={() => navigate('billing')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 dark:text-stone-100 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Invoices & Receipts</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
