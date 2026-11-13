import React, { useRef, useEffect } from 'react';
import { Search, X, Sparkles, Filter, SlidersHorizontal, BookOpen } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
  count?: number;
}

export interface SearchBarStats {
  curatedModules?: number;
  studyGuides?: number;
  studyFields?: number;
  hasAiCourses?: boolean;
  customLabel?: string;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: (string | CategoryOption)[];
  totalResults?: number;
  totalAvailable?: number;
  onResetFilters?: () => void;
  stats?: SearchBarStats;
  showCategoryPills?: boolean; // segmented buttons, not static pills
  compact?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search by title, category, keywords, or topics...',
  selectedCategory = 'all',
  onCategoryChange,
  categories = [],
  totalResults,
  totalAvailable,
  onResetFilters,
  stats,
  showCategoryPills = true,
  compact = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Pressing "/" or "Cmd+K" / "Ctrl+K" focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if already typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (searchQuery) {
          onSearchChange('');
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onSearchChange]);

  // Normalize category options
  const normalizedCategories: CategoryOption[] = categories.map((cat) => {
    if (typeof cat === 'string') {
      return { id: cat, label: cat };
    }
    return cat;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || (selectedCategory && selectedCategory !== 'all');

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Optional Institutional Metrics Strip (Zero-Pill compliant clean typography) */}
      {stats && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono tracking-tight pb-1">
          {stats.curatedModules !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
              <span className="tabular-nums">{stats.curatedModules.toLocaleString()}</span>
              <span>Curated Study Modules</span>
            </span>
          )}
          {stats.studyGuides !== undefined && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1 font-semibold text-stone-800 dark:text-stone-200">
                <span className="tabular-nums">{stats.studyGuides.toLocaleString()}</span>
                <span>Study Guides</span>
              </span>
            </>
          )}
          {stats.studyFields !== undefined && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                <span className="tabular-nums font-bold">{stats.studyFields}</span>
                <span>Study Fields</span>
                {stats.hasAiCourses && (
                  <span className="text-purple-700 dark:text-purple-400 font-semibold">
                    (including AI COURSES · AI GENERATED)
                  </span>
                )}
              </span>
            </>
          )}
          {stats.customLabel && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span>{stats.customLabel}</span>
            </>
          )}
        </div>
      )}

      {/* Main Search & Category Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-xl group">
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-3 pointer-events-none group-focus-within:text-stone-800 dark:group-focus-within:text-stone-200 transition-colors" />
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            aria-label="Filter content by title or category"
            className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300 focus:border-stone-900 dark:focus:border-stone-300 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all shadow-xs"
          />

          {/* Right Action Cluster in Input: Clear button and keyboard shortcut */}
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Clear search query (Esc)"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded select-none pointer-events-none">
              /
            </kbd>
          </div>
        </div>

        {/* Category Dropdown or Selector (for mobile / compact) */}
        {onCategoryChange && normalizedCategories.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative md:hidden w-full">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                aria-label="Filter by category"
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300"
              >
                {normalizedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>

      {/* Segmented Category Filter Buttons (Functional Buttons, Zero-Pill Compliant) */}
      {showCategoryPills && onCategoryChange && normalizedCategories.length > 0 && (
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 text-xs w-fit">
            {normalizedCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                  }`}
                >
                  {cat.label.includes('AI') && (
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                  )}
                  <span>{cat.label}</span>
                  {cat.count !== undefined && (
                    <span className="text-[10px] font-mono tabular-nums opacity-60">
                      ({cat.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Feedback & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 pt-1">
        <div className="flex items-center gap-2">
          {totalResults !== undefined && (
            <span className="font-mono tabular-nums">
              Showing <span className="font-bold text-stone-900 dark:text-stone-100">{totalResults}</span>
              {totalAvailable !== undefined && (
                <> of <span className="font-medium">{totalAvailable}</span></>
              )} {totalResults === 1 ? 'entry' : 'entries'}
            </span>
          )}

          {searchQuery.trim() && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Matching &ldquo;<span className="font-semibold text-stone-800 dark:text-stone-200">{searchQuery}</span>&rdquo;
              </span>
            </>
          )}

          {selectedCategory && selectedCategory !== 'all' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-stone-700 dark:text-stone-300">
                Category: <span className="font-semibold capitalize">{selectedCategory.replace(/_/g, ' ')}</span>
              </span>
            </>
          )}
        </div>

        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>Reset filters</span>
          </button>
        )}
      </div>

    </div>
  );
};
