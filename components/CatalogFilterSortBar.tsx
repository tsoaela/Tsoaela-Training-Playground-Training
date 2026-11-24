import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  ChevronDown,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  CatalogFormatFilter,
  CatalogMultiFilterState,
  CatalogProgressStatus,
  CatalogSortBy,
  CatalogSortDirection,
  countActiveCatalogFilters,
} from '../utils/catalogOrganization';

interface CatalogFilterSortBarProps {
  mode: 'educare' | 'research';
  filters: CatalogMultiFilterState;
  onFiltersChange: (next: CatalogMultiFilterState) => void;
  sortBy: CatalogSortBy;
  onSortByChange: (sort: CatalogSortBy) => void;
  sortDirection: CatalogSortDirection;
  onSortDirectionChange: (dir: CatalogSortDirection) => void;
  availableNqfLevels: number[];
  availableCategories: string[];
  onResetAll: () => void;
}

const FORMAT_LABELS: Record<CatalogFormatFilter, string> = {
  short_free: 'Short-Term (Free Lessons)',
  long_paid: 'Long-Term (R145 / Course)',
  quality_verified: 'Quality-Verified (Internal QA)',
  open_access: 'Open Access ($0)',
  research_pass: 'Research Pass',
};

const PROGRESS_LABELS: Record<CatalogProgressStatus, string> = {
  not_started: 'Not Started (0%)',
  in_progress: 'In Progress (1–99%)',
  completed: 'Completed (100%)',
};

export const CatalogFilterSortBar: React.FC<CatalogFilterSortBarProps> = ({
  mode,
  filters,
  onFiltersChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  availableNqfLevels,
  availableCategories,
  onResetAll,
}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilterMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setIsFilterMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isFilterMenuOpen]);

  const activeFilterCount = countActiveCatalogFilters(filters);

  const toggleNqfLevel = (level: number) => {
    const exists = filters.nqfLevels.includes(level);
    onFiltersChange({
      ...filters,
      nqfLevels: exists
        ? filters.nqfLevels.filter((l) => l !== level)
        : [...filters.nqfLevels, level].sort((a, b) => a - b),
    });
  };

  const toggleCategory = (category: string) => {
    const exists = filters.categories.includes(category);
    onFiltersChange({
      ...filters,
      categories: exists
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  };

  const toggleFormat = (fmt: CatalogFormatFilter) => {
    const exists = filters.formats.includes(fmt);
    onFiltersChange({
      ...filters,
      formats: exists
        ? filters.formats.filter((f) => f !== fmt)
        : [...filters.formats, fmt],
    });
  };

  const toggleProgressStatus = (status: CatalogProgressStatus) => {
    const exists = filters.progressStatuses.includes(status);
    onFiltersChange({
      ...filters,
      progressStatuses: exists
        ? filters.progressStatuses.filter((s) => s !== status)
        : [...filters.progressStatuses, status],
    });
  };

  const formatOptions: CatalogFormatFilter[] =
    mode === 'educare'
      ? ['short_free', 'long_paid', 'quality_verified']
      : ['open_access', 'research_pass', 'quality_verified'];

  const progressOptions: CatalogProgressStatus[] =
    mode === 'educare'
      ? ['not_started', 'in_progress', 'completed']
      : ['not_started', 'completed'];

  const handleSortChange = (nextSort: CatalogSortBy) => {
    onSortByChange(nextSort);
    if (nextSort === 'alphabetical') {
      onSortDirectionChange('asc');
    } else if (nextSort === 'nqf_level' || nextSort === 'progress') {
      onSortDirectionChange('desc');
    }
  };

  const directionLabel =
    sortBy === 'alphabetical'
      ? sortDirection === 'asc'
        ? 'A → Z'
        : 'Z → A'
      : sortDirection === 'desc'
      ? 'High → Low'
      : 'Low → High';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Context & Multi-Select Dropdown Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                {mode === 'educare'
                  ? 'Study Guides Organizer'
                  : 'Research Catalog Organizer'}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Multi-select NQF levels, domains &amp; progress · Sort your{' '}
                {mode === 'educare' ? 'study guides' : 'research dossiers'}
              </span>
            </div>

            <div className="relative" ref={menuContainerRef}>
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                aria-expanded={isFilterMenuOpen}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isFilterMenuOpen || activeFilterCount > 0
                    ? 'bg-[#052e16] text-[#bef264] border-[#84cc16]/60'
                    : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  Multi-Select Filters
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isFilterMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isFilterMenuOpen && (
                <div
                  role="region"
                  aria-label="Multi-select catalog filters"
                  className="absolute left-0 mt-2 w-[min(92vw,680px)] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl z-40 p-5 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Multi-Select Catalog Filters
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Combine multiple NQF levels, categories, formats, and completion states simultaneously.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={onResetAll}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                        >
                          Clear All ({activeFilterCount})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterMenuOpen(false)}
                        aria-label="Close filter menu"
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Column 1: NQF Level */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        NQF Level
                      </span>
                      <div className="space-y-1.5">
                        {availableNqfLevels.map((lvl) => {
                          const checked = filters.nqfLevels.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => toggleNqfLevel(lvl)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 border transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              )}
                              <span className="font-mono tabular-nums">NQF Level {lvl}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Categories */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Domains &amp; Categories
                      </span>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {availableCategories.map((cat) => {
                          const checked = filters.categories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 border transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              )}
                              <span className="truncate">{cat}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 3: Format & Pricing */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Format &amp; Access
                      </span>
                      <div className="space-y-1.5">
                        {formatOptions.map((fmt) => {
                          const checked = filters.formats.includes(fmt);
                          return (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => toggleFormat(fmt)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 border transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              )}
                              <span>{FORMAT_LABELS[fmt]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 4: Progress % */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Progress Status
                      </span>
                      <div className="space-y-1.5">
                        {progressOptions.map((status) => {
                          const checked = filters.progressStatuses.includes(status);
                          const label =
                            mode === 'research' && status === 'completed'
                              ? 'Dossier Read (100%)'
                              : mode === 'research' && status === 'not_started'
                              ? 'Unread (0%)'
                              : PROGRESS_LABELS[status];
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => toggleProgressStatus(status)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 border transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              )}
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Sorting Menu + Direction Toggle + Reset */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label
              htmlFor="hub-catalog-sort-select"
              className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span>Sort by:</span>
            </label>

            <select
              id="hub-catalog-sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as CatalogSortBy)}
              aria-label="Sort catalog"
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 cursor-pointer"
            >
              <option value="recommended">Default Order</option>
              <option value="nqf_level">NQF Level</option>
              <option value="alphabetical">Alphabetical (A–Z)</option>
              <option value="progress">Progress %</option>
            </select>

            {sortBy !== 'recommended' && (
              <button
                type="button"
                onClick={() =>
                  onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')
                }
                title="Toggle sort direction"
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {sortDirection === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>{directionLabel}</span>
              </button>
            )}

            {(activeFilterCount > 0 || sortBy !== 'recommended') && (
              <button
                type="button"
                onClick={onResetAll}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Multi-Select Interactive Filter Removers */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
            <span className="text-stone-500 dark:text-stone-400 font-medium mr-1">
              Active filters:
            </span>
            {filters.nqfLevels.map((lvl) => (
              <button
                key={`nqf-${lvl}`}
                type="button"
                onClick={() => toggleNqfLevel(lvl)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-semibold inline-flex items-center gap-1 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
              >
                <span>NQF Level {lvl}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            {filters.categories.map((cat) => (
              <button
                key={`cat-${cat}`}
                type="button"
                onClick={() => toggleCategory(cat)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-semibold inline-flex items-center gap-1 hover:bg-indigo-100 cursor-pointer whitespace-nowrap"
              >
                <span>{cat}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            {filters.formats.map((fmt) => (
              <button
                key={`fmt-${fmt}`}
                type="button"
                onClick={() => toggleFormat(fmt)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold inline-flex items-center gap-1 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
              >
                <span>{FORMAT_LABELS[fmt]}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            {filters.progressStatuses.map((status) => (
              <button
                key={`prog-${status}`}
                type="button"
                onClick={() => toggleProgressStatus(status)}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-semibold inline-flex items-center gap-1 hover:bg-purple-100 cursor-pointer whitespace-nowrap"
              >
                <span>{PROGRESS_LABELS[status]}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
