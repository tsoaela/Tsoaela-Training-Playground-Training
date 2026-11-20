import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, StudyGuide, RetreatEvent, ResearchPaper, ReadingProgress, AppNotification, ThemeMode } from '../types';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Monitor,
  Check,
  ChevronDown,
  Bell, 
  BellRing,
  Search, 
  X, 
  BookOpen, 
  FileText, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  ListChecks,
  Command,
  MapPin,
  Calendar,
  GraduationCap,
  ShieldCheck,
  Music,
  Camera,
  Video,
  User,
  LogIn,
  LogOut,
  WifiOff,
  Activity,
  ClipboardList,
  Briefcase,
  Lock,
  CheckCheck,
  Trash2,
  RefreshCw,
  Menu,
  Clock
} from 'lucide-react';
import { BackgroundSyncStatus } from '../types';
import { TTG_LOGO_URL } from '../utils/pdfBranding';

const RECENT_SEARCHES_STORAGE_KEY = 'ttg_recent_global_searches';
const MAX_RECENT_SEARCHES = 5;

function loadRecentSearchesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique: string[] = [];
    for (const entry of parsed) {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (
          trimmed &&
          !unique.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())
        ) {
          unique.push(trimmed);
        }
      }
      if (unique.length >= MAX_RECENT_SEARCHES) break;
    }
    return unique;
  } catch {
    return [];
  }
}

function persistRecentSearchesToStorage(queries: string[]): void {
  try {
    localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify(queries.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export type AppNavigationTab = 
  | 'education' 
  | 'activity'
  | 'faculty_portal'
  | 'music_store' 
  | 'photography_store' 
  | 'videography_store' 
  | 'book_store' 
  | 'billing' 
  | 'verify'
  | 'faq'
  | 'educare'
  | 'research'
  | 'digital_world'
  | 'careers'
  | 'retreats';

interface HeaderProps {
  activeTab: AppNavigationTab;
  setActiveTab: (tab: AppNavigationTab) => void;
  user: UserProfile;
  userRole?: UserRole;
  onOpenPaywall: () => void;
  theme: 'light' | 'dark';
  themeMode?: ThemeMode;
  onChangeThemeMode?: (mode: ThemeMode) => void;
  onToggleTheme: () => void;
  onOpenReminders?: () => void;
  activeRemindersCount?: number;
  studyGuides?: StudyGuide[];
  retreatEvents?: RetreatEvent[];
  researchPapers?: ResearchPaper[];
  readingProgress?: Record<string, ReadingProgress>;
  onNavigateToItem?: (type: 'study_guide' | 'retreat' | 'research', itemId: string) => void;
  onOpenExportReport?: () => void;
  onOpenAcademicPrompts?: () => void;
  onOpenAccreditation?: () => void;
  onOpenApplicationRegistration?: () => void;
  isAuthenticated?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  isOnline?: boolean;
  notifications?: AppNotification[];
  unreadNotificationCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onDismissNotification?: (id: string) => void;
  onClearNotifications?: () => void;
  onNotificationNavigate?: (notif: AppNotification) => void;
  pendingSyncCount?: number;
  syncStatus?: BackgroundSyncStatus;
  lastSyncedAt?: string | null;
  onTriggerManualSync?: () => void;
  isDeepWorkActive?: boolean;
  deepWorkRemainingSeconds?: number;
  onExitDeepWork?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  userRole = 'student',
  onOpenPaywall,
  theme,
  themeMode = theme,
  onChangeThemeMode,
  onToggleTheme,
  onOpenReminders,
  activeRemindersCount = 0,
  studyGuides = [],
  retreatEvents = [],
  researchPapers = [],
  readingProgress = {},
  onNavigateToItem,
  onOpenExportReport,
  onOpenAcademicPrompts,
  onOpenAccreditation,
  onOpenApplicationRegistration,
  isAuthenticated = false,
  onOpenAuthModal,
  onLogout,
  isOnline = true,
  notifications = [],
  unreadNotificationCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDismissNotification,
  onClearNotifications,
  onNotificationNavigate,
  pendingSyncCount = 0,
  syncStatus = 'idle',
  lastSyncedAt = null,
  onTriggerManualSync,
  isDeepWorkActive = false,
  deepWorkRemainingSeconds = 0,
  onExitDeepWork,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentSearchesFromStorage()
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'guides' | 'research' | 'retreats'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'assignment_graded' | 'chapter_added' | 'study_group_started'>('all');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const themeMenuContainerRef = useRef<HTMLDivElement>(null);

  const saveRecentSearch = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const next = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearchesToStorage(next);
      return next;
    });
  };

  const removeRecentSearch = (target: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item.toLowerCase() !== target.toLowerCase());
      persistRecentSearchesToStorage(next);
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    persistRecentSearchesToStorage([]);
  };

  const isInstructor = isAuthenticated && userRole === 'instructor';

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'all') return notifications;
    return notifications.filter(n => n.type === notifFilter);
  }, [notifications, notifFilter]);

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Global keyboard shortcut: Cmd+K / Ctrl+K or '/' to focus search (disabled during Deep Work)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDeepWorkActive) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      } else if (e.key === 'Escape' && isThemeMenuOpen) {
        setIsThemeMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isThemeMenuOpen, isDeepWorkActive]);

  // Click outside listener to dismiss search, notification & theme mode dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedDesktopSearch =
        searchContainerRef.current && searchContainerRef.current.contains(e.target as Node);
      const clickedMobileSearch =
        mobileSearchContainerRef.current &&
        mobileSearchContainerRef.current.contains(e.target as Node);
      if (!clickedDesktopSearch && !clickedMobileSearch) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (themeMenuContainerRef.current && !themeMenuContainerRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items across all three domains
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { guides: [], papers: [], retreats: [], all: [] };

    // 1. Search Study Guides
    const matchedGuides = studyGuides.filter(g => 
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.field && g.field.toLowerCase().includes(q)) ||
      (g.abstract && g.abstract.toLowerCase().includes(q)) ||
      (g.accreditor_name && g.accreditor_name.toLowerCase().includes(q)) ||
      g.chapters?.some(ch => ch.title.toLowerCase().includes(q))
    );

    // 2. Search Research Papers
    const matchedPapers = researchPapers.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      (p.abstract && p.abstract.toLowerCase().includes(q)) ||
      p.key_takeaways?.some(t => t.toLowerCase().includes(q))
    );

    // 3. Search Retreat Events
    const matchedRetreats = retreatEvents.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.tagline.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.key_modules?.some(m => m.toLowerCase().includes(q))
    );

    const all = [
      ...matchedGuides.map(g => ({ type: 'study_guide' as const, id: g.id, data: g })),
      ...matchedPapers.map(p => ({ type: 'research' as const, id: p.id, data: p })),
      ...matchedRetreats.map(r => ({ type: 'retreat' as const, id: r.id, data: r })),
    ];

    return {
      guides: matchedGuides,
      papers: matchedPapers,
      retreats: matchedRetreats,
      all,
    };
  }, [searchQuery, studyGuides, researchPapers, retreatEvents]);

  // Filtered list based on active filter chip
  const activeResultsList = useMemo(() => {
    if (searchFilter === 'guides') {
      return searchResults.guides.map(g => ({ type: 'study_guide' as const, id: g.id, data: g }));
    }
    if (searchFilter === 'research') {
      return searchResults.papers.map(p => ({ type: 'research' as const, id: p.id, data: p }));
    }
    if (searchFilter === 'retreats') {
      return searchResults.retreats.map(r => ({ type: 'retreat' as const, id: r.id, data: r }));
    }
    return searchResults.all;
  }, [searchResults, searchFilter]);

  const handleSelectItem = (type: 'study_guide' | 'retreat' | 'research', itemId: string) => {
    if (searchQuery.trim().length >= 2) {
      saveRecentSearch(searchQuery.trim());
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onNavigateToItem) {
      onNavigateToItem(type, itemId);
    } else {
      if (type === 'study_guide') setActiveTab('educare');
      else if (type === 'research') setActiveTab('research');
      else if (type === 'retreat') setActiveTab('retreats');
    }
  };

  const handleKeyDownResults = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < activeResultsList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeResultsList[selectedIndex]) {
        const item = activeResultsList[selectedIndex];
        handleSelectItem(item.type, item.id);
      } else if (searchQuery.trim().length >= 2) {
        saveRecentSearch(searchQuery.trim());
      }
    }
  };

  const popularQuickQueries = [
    'Quantum Cognitive',
    'Bali Retreat',
    'Autonomous Swarms',
    'Institutional DSP',
    'Quality-Verified Courses',
  ];

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-40 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
          
          {/* Zone 1: Brand wordmark & Offline Mode Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveTab('education')}
              className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-2.5"
            >
              <img
                src={TTG_LOGO_URL}
                alt="Tsoaela Training Ground Platform Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-auto rounded-lg object-contain bg-white px-1 py-0.5 ring-1 ring-stone-200 dark:ring-stone-700 shadow-xs shrink-0"
              />
              <span>TTG</span>
              <span className="hidden xl:inline text-xs font-semibold text-stone-500 dark:text-stone-400">
                Tsoaela Training Ground
              </span>
            </button>

            {/* Offline Mode & Background Sync Status Indicator */}
            {!isOnline ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 text-[11px] font-bold animate-pulse whitespace-nowrap shrink-0"
                title="Internet connection disconnected. Progress and assignments are cached locally and will sync automatically when reconnected."
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {pendingSyncCount > 0 ? `Offline · ${pendingSyncCount} Queued` : 'Offline Mode'}
                </span>
              </div>
            ) : (syncStatus === 'syncing' || pendingSyncCount > 0) ? (
              <button
                type="button"
                onClick={onTriggerManualSync}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                title={lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Sync queued study progress to database'}
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {syncStatus === 'syncing' ? 'Syncing...' : `Sync (${pendingSyncCount})`}
                </span>
              </button>
            ) : null}
          </div>

          {/* Global Search Bar (Center-Left, hidden during Deep Work) */}
          {isDeepWorkActive ? (
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/70 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deep Work Active</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-white">
                {String(Math.floor(Math.max(0, deepWorkRemainingSeconds) / 60)).padStart(2, '0')}:
                {String(Math.max(0, deepWorkRemainingSeconds) % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden sm:block">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownResults}
                placeholder="Search guides, research, retreats... (⌘K)"
                className="w-full pl-9 pr-16 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 focus:bg-white dark:focus:bg-stone-900 border border-transparent focus:border-purple-500 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-500 focus:outline-none transition-all shadow-inner"
              />
              <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
                {searchQuery ? (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 hover:text-stone-700 pointer-events-auto text-stone-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 font-semibold border border-stone-300 dark:border-stone-600">
                    ⌘K
                  </span>
                )}
              </div>
            </div>

            {/* Global Search Results Dropdown Popover */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Category Filter Chips */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSearchFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      searchFilter === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    All ({searchResults.all.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchFilter('guides')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      searchFilter === 'guides'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    Guides ({searchResults.guides.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchFilter('research')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      searchFilter === 'research'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    Research ({searchResults.papers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchFilter('retreats')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      searchFilter === 'retreats'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    Retreats ({searchResults.retreats.length})
                  </button>
                </div>

                {/* Results List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                  {searchQuery.trim() === '' ? (
                    <div className="p-4 space-y-4">
                      {recentSearches.length > 0 && (
                        <div className="space-y-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400 tracking-wider font-semibold flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>Recent Searches ({recentSearches.length}/5)</span>
                            </span>
                            <button
                              type="button"
                              onClick={clearRecentSearches}
                              className="text-[10px] font-semibold text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                            >
                              Clear
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {recentSearches.map((recentTerm) => (
                              <div
                                key={recentTerm}
                                className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(recentTerm);
                                    saveRecentSearch(recentTerm);
                                    setSelectedIndex(0);
                                    searchInputRef.current?.focus();
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Clock className="w-3 h-3 text-purple-500 shrink-0" />
                                  <span>{recentTerm}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeRecentSearch(recentTerm);
                                  }}
                                  aria-label={`Remove ${recentTerm} from recent searches`}
                                  className="px-1.5 py-1 text-purple-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase text-stone-400 tracking-wider font-semibold block">
                          Quick Exploration
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {popularQuickQueries.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSearchQuery(tag);
                                saveRecentSearch(tag);
                                setSelectedIndex(0);
                                searchInputRef.current?.focus();
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-stone-400 pt-1">
                          Type keywords to locate modules, peer-reviewed briefs, or immersive executive retreats across the platform.
                        </p>
                      </div>
                    </div>
                  ) : activeResultsList.length > 0 ? (
                    activeResultsList.map((item, idx) => {
                      const isSelected = idx === selectedIndex;

                      if (item.type === 'study_guide') {
                        const guide = item.data as StudyGuide;
                        const prog = readingProgress[guide.id];
                        const completedCount = prog?.completedChapters?.length || 0;
                        const isDone = prog?.isCompleted;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem('study_guide', guide.id)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                    Study Guide
                                  </span>
                                  {guide.is_accredited && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                      <Award className="w-2.5 h-2.5" />
                                      Accredited
                                    </span>
                                  )}
                                  {isDone ? (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ Completed
                                    </span>
                                  ) : completedCount > 0 ? (
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium font-mono">
                                      {completedCount}/{guide.chapters.length} Chapters
                                    </span>
                                  ) : null}
                                </div>
                                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                                  {guide.title}
                                </h4>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                                  {guide.category} · {guide.reading_time} · {guide.difficulty}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 opacity-60" />
                          </div>
                        );
                      }

                      if (item.type === 'research') {
                        const paper = item.data as ResearchPaper;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem('research', paper.id)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                    Research Brief
                                  </span>
                                  <span className="text-[9px] text-stone-400 font-mono">
                                    {paper.pages} Pages
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                                  {paper.title}
                                </h4>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                                  {paper.category} · Author: {paper.author}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 opacity-60" />
                          </div>
                        );
                      }

                      if (item.type === 'retreat') {
                        const retreat = item.data as RetreatEvent;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem('retreat', retreat.id)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                    Retreat
                                  </span>
                                  <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {retreat.location}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                                  {retreat.title}
                                </h4>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                                  {retreat.dates} · {retreat.tagline}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 opacity-60" />
                          </div>
                        );
                      }

                      return null;
                    })
                  ) : (
                    <div className="p-6 text-center text-stone-400 space-y-1">
                      <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                        No matches found for "{searchQuery}"
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Try searching for keywords like "cognitive", "retreat", "bali", "swarms", or "education".
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="p-2.5 px-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>Navigation: ↑↓ to navigate · ↵ to select</span>
                  <span>ESC to close</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Zone 2: Utility Icons, Notifications, Theme Toggle & Auth (Compact across mobile & desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {isDeepWorkActive && onExitDeepWork && (
              <button
                type="button"
                onClick={onExitDeepWork}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Deep Work</span>
              </button>
            )}

            {/* Desktop Secondary Quick Action: Apply & Register */}
            {!isDeepWorkActive && onOpenApplicationRegistration && (
              <button
                type="button"
                onClick={onOpenApplicationRegistration}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Course Admission & Institutional Category Registration"
              >
                <ClipboardList className="w-3.5 h-3.5 text-purple-200" />
                <span>Apply & Register</span>
              </button>
            )}

            {/* Course Alerts & Notifications Center */}
            {!isDeepWorkActive && (
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="relative p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Course alerts: graded assignments, new chapters, and study groups"
                aria-label="Course Notifications"
              >
                <BellRing className={`w-4 h-4 ${unreadNotificationCount > 0 ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                <AnimatePresence>
                  {unreadNotificationCount > 0 && (
                    <motion.span
                      key={unreadNotificationCount}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-purple-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                    >
                      {unreadNotificationCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                          Course Notifications
                        </h4>
                        <p className="text-[10px] text-stone-500">
                          Grades, syllabus chapters & registered study rooms
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                          <button
                            type="button"
                            onClick={onMarkAllNotificationsRead}
                            className="p-1.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg flex items-center gap-1"
                            title="Mark all as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Read all</span>
                          </button>
                        )}
                        {notifications.length > 0 && onClearNotifications && (
                          <button
                            type="button"
                            onClick={onClearNotifications}
                            className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                            title="Clear notifications"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-1 overflow-x-auto text-[10px]">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'assignment_graded', label: 'Grades' },
                        { id: 'chapter_added', label: 'Chapters' },
                        { id: 'study_group_started', label: 'Study Rooms' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNotifFilter(tab.id as any)}
                          className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap transition-colors ${
                            notifFilter === tab.id
                              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredNotifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400">
                          No course alerts in this category yet.
                        </div>
                      ) : (
                        filteredNotifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              onMarkNotificationRead?.(notif.id);
                              onNotificationNavigate?.(notif);
                              setIsNotifOpen(false);
                            }}
                            className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                              notif.read
                                ? 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                                : 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/80 dark:hover:bg-purple-950/40'
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              notif.type === 'assignment_graded'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : notif.type === 'chapter_added'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            }`}>
                              {notif.type === 'assignment_graded' ? (
                                <Award className="w-4 h-4" />
                              ) : notif.type === 'chapter_added' ? (
                                <BookOpen className="w-4 h-4" />
                              ) : (
                                <Video className="w-4 h-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                  {notif.title}
                                </span>
                                <span className="text-[10px] font-mono text-stone-400 shrink-0">
                                  {formatRelativeTime(notif.timestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[200px]">
                                  {notif.courseTitle}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                                )}
                              </div>
                            </div>

                            {onDismissNotification && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismissNotification(notif.id);
                                }}
                                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                                aria-label="Dismiss notification"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Reminders Bell Button (blocked during Deep Work) */}
            {!isDeepWorkActive && onOpenReminders && (
              <button
                type="button"
                onClick={onOpenReminders}
                className="relative p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="View & manage study reminders"
                aria-label="Study Reminders"
              >
                <Calendar className="w-4 h-4" />
                {activeRemindersCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-stone-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeRemindersCount}
                  </span>
                )}
              </button>
            )}

            {/* Theme Mode Persistence Indicator & Visual Preview Switcher */}
            <div ref={themeMenuContainerRef} className="relative">
              <div className="flex items-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/90 dark:bg-stone-800/90 p-0.5 shadow-2xs">
                {/* Quick Cycle Mode Button */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
                  title="Quick-cycle Theme Mode (System Default -> Light -> Dark)"
                  aria-label={`Quick cycle theme mode, currently ${themeMode === 'system' ? `System Default (${theme})` : themeMode}`}
                >
                  {/* Miniature Visual Theme Preview Frame */}
                  <span
                    aria-hidden="true"
                    className="relative w-6 h-4 rounded border border-stone-300 dark:border-stone-600 overflow-hidden shrink-0 flex"
                  >
                    {themeMode === 'system' ? (
                      <>
                        <span className="w-1/2 h-full bg-stone-50 flex flex-col justify-between p-0.5">
                          <span className="w-full h-0.5 bg-amber-500 rounded-full" />
                          <span className="w-2/3 h-0.5 bg-stone-400 rounded-full" />
                        </span>
                        <span className="w-1/2 h-full bg-stone-950 flex flex-col justify-between p-0.5">
                          <span className="w-full h-0.5 bg-amber-400 rounded-full" />
                          <span className="w-2/3 h-0.5 bg-stone-500 rounded-full" />
                        </span>
                      </>
                    ) : themeMode === 'dark' ? (
                      <span className="w-full h-full bg-stone-950 flex flex-col justify-between p-0.5">
                        <span className="w-full h-0.5 bg-amber-400 rounded-full" />
                        <span className="w-3/4 h-0.5 bg-stone-500 rounded-full" />
                      </span>
                    ) : (
                      <span className="w-full h-full bg-stone-50 flex flex-col justify-between p-0.5">
                        <span className="w-full h-0.5 bg-amber-500 rounded-full" />
                        <span className="w-3/4 h-0.5 bg-stone-400 rounded-full" />
                      </span>
                    )}
                  </span>

                  {themeMode === 'system' ? (
                    <Monitor className="w-3.5 h-3.5 text-stone-700 dark:text-stone-200 shrink-0" />
                  ) : themeMode === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}

                  <span className="hidden xl:inline text-[11px] font-semibold text-stone-800 dark:text-stone-100 capitalize">
                    {themeMode === 'system' ? 'System' : themeMode}
                  </span>
                  <span
                    className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                    title="Theme preference saved locally"
                  />
                </button>

                {/* Open Theme Preview & Selector Popover */}
                <button
                  type="button"
                  onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                  className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  title="Theme Mode preview & selection"
                  aria-label="Open Theme Mode visual selector"
                  aria-expanded={isThemeMenuOpen}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <AnimatePresence>
                {isThemeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-80 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50"
                  >
                    {/* Header & Persistence Status */}
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Theme Mode
                        </h4>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          {themeMode === 'system'
                            ? `System Default · Resolved ${theme === 'dark' ? 'Dark' : 'Light'}`
                            : `${themeMode === 'dark' ? 'Dark' : 'Light'} Mode active`}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Persisted</span>
                      </span>
                    </div>

                    {/* Visual Preview of Current Selection */}
                    <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        <span>Current Selection Preview</span>
                        <span>{theme === 'dark' ? 'Obsidian Canvas' : 'Alabaster Canvas'}</span>
                      </div>

                      <div
                        className={`rounded-xl border p-2.5 transition-colors ${
                          theme === 'dark'
                            ? 'bg-stone-950 border-stone-800 text-stone-100'
                            : 'bg-stone-50 border-stone-200 text-stone-900'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-current/10">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold tracking-tight">
                              TTG Learning Studio
                            </span>
                          </div>
                          <span className="text-[9px] font-mono opacity-70 capitalize">
                            {themeMode}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div
                            className={`col-span-2 rounded-lg p-2 space-y-1 border ${
                              theme === 'dark'
                                ? 'bg-stone-900 border-stone-800'
                                : 'bg-white border-stone-200'
                            }`}
                          >
                            <div className="h-1.5 w-3/4 rounded bg-current opacity-80" />
                            <div className="h-1 w-full rounded bg-current opacity-30" />
                            <div className="h-1 w-2/3 rounded bg-amber-500/80" />
                          </div>
                          <div
                            className={`rounded-lg p-2 flex flex-col justify-between border ${
                              theme === 'dark'
                                ? 'bg-stone-900 border-stone-800'
                                : 'bg-white border-stone-200'
                            }`}
                          >
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <div className="h-1 w-full rounded bg-current opacity-40" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3-Way Theme Mode Selector */}
                    <div className="p-2 space-y-1">
                      {(
                        [
                          {
                            mode: 'system' as const,
                            label: 'System Default',
                            desc: `Follows OS preference (currently ${theme})`,
                            Icon: Monitor,
                          },
                          {
                            mode: 'light' as const,
                            label: 'Light Mode',
                            desc: 'High-contrast alabaster study surface',
                            Icon: Sun,
                          },
                          {
                            mode: 'dark' as const,
                            label: 'Dark Mode',
                            desc: 'Low-glare obsidian focus environment',
                            Icon: Moon,
                          },
                        ]
                      ).map(({ mode, label, desc, Icon }) => {
                        const isActive = themeMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              if (onChangeThemeMode) {
                                onChangeThemeMode(mode);
                              } else {
                                onToggleTheme();
                              }
                              setIsThemeMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer border ${
                              isActive
                                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                                : 'bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Per-option Mini Swatch */}
                              <span
                                aria-hidden="true"
                                className="w-8 h-6 rounded-md border border-stone-300 dark:border-stone-700 overflow-hidden shrink-0 flex"
                              >
                                {mode === 'system' ? (
                                  <>
                                    <span className="w-1/2 h-full bg-stone-50 p-1 flex flex-col justify-between">
                                      <span className="h-1 w-full bg-amber-500 rounded-sm" />
                                      <span className="h-1 w-2/3 bg-stone-300 rounded-sm" />
                                    </span>
                                    <span className="w-1/2 h-full bg-stone-950 p-1 flex flex-col justify-between">
                                      <span className="h-1 w-full bg-amber-400 rounded-sm" />
                                      <span className="h-1 w-2/3 bg-stone-600 rounded-sm" />
                                    </span>
                                  </>
                                ) : mode === 'light' ? (
                                  <span className="w-full h-full bg-stone-50 p-1 flex flex-col justify-between">
                                    <span className="h-1 w-full bg-amber-500 rounded-sm" />
                                    <span className="h-1 w-3/4 bg-stone-300 rounded-sm" />
                                  </span>
                                ) : (
                                  <span className="w-full h-full bg-stone-950 p-1 flex flex-col justify-between">
                                    <span className="h-1 w-full bg-amber-400 rounded-sm" />
                                    <span className="h-1 w-3/4 bg-stone-600 rounded-sm" />
                                  </span>
                                )}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                                  <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>{label}</span>
                                </div>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                  {desc}
                                </p>
                              </div>
                            </div>

                            {isActive && (
                              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Authentication / User Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 pl-1 border-l border-stone-200 dark:border-stone-800">
                <div 
                  onClick={() => setActiveTab('billing')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors shadow-2xs"
                  title="View Profile & Subscriptions"
                >
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-[90px] truncate">{user.name}</span>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="hidden sm:block p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal?.('login')}
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In / Register</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Drawer Toggle (< lg screens) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Open platform menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Secondary Bar: Primary Navigation & Studio Actions (fits 1024px+ cleanly) */}
        <div className="hidden lg:flex items-center justify-between gap-4 lg:h-12 border-t border-stone-100 dark:border-stone-800">
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-sm font-medium min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('education')}
              className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'education' || activeTab === 'educare' || activeTab === 'research' || activeTab === 'digital_world' || activeTab === 'careers' || activeTab === 'retreats'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Education</span>
            </button>

            {!isDeepWorkActive && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('music_store')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'music_store'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Music Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('photography_store')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'photography_store'
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Photography</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('videography_store')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'videography_store'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Videography</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('book_store')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'book_store'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Book Library</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800/80 shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Activity</span>
            </button>

            {!isDeepWorkActive && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('faculty_portal')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'faculty_portal'
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Faculty Portal</span>
                  {!isInstructor && <Lock className="w-3 h-3 text-stone-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('verify')}
                  className={`whitespace-nowrap shrink-0 transition-all px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'verify'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verify &amp; Appeals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`whitespace-nowrap shrink-0 transition-colors px-2.5 py-1.5 text-xs cursor-pointer ${
                    activeTab === 'billing'
                      ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Billing
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={`whitespace-nowrap shrink-0 transition-colors px-2.5 py-1.5 text-xs cursor-pointer ${
                    activeTab === 'faq'
                      ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  FAQ
                </button>
              </>
            )}
          </nav>

          {/* Desktop Quick Studio Actions */}
          {isDeepWorkActive ? (
            <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
              <span>Distraction Shield Active · Marketplace, alerts &amp; secondary portals hidden</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              {onOpenAcademicPrompts && (
                <button
                  type="button"
                  onClick={onOpenAcademicPrompts}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition-all whitespace-nowrap cursor-pointer"
                  title="Open University Syllabus & Academic Prompt Studio"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Prompt Studio</span>
                </button>
              )}

              {onOpenAccreditation && (
                <button
                  type="button"
                  onClick={onOpenAccreditation}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all whitespace-nowrap cursor-pointer"
                  title="Free Institutional Accreditation & Productivity Registry"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Accreditation</span>
                </button>
              )}

              {onOpenExportReport && (
                <button
                  type="button"
                  onClick={onOpenExportReport}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-all whitespace-nowrap cursor-pointer"
                  title="Export student reading progress and chapter completion transcript"
                >
                  <ListChecks className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Export Progress</span>
                </button>
              )}

              {user.subscription_tier === 'free' && (
                <button
                  type="button"
                  onClick={onOpenPaywall}
                  className="flex px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-all whitespace-nowrap items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Tutoring Plans</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Bar Row + Results Popover (< sm screens, hidden during Deep Work) */}
        {!isDeepWorkActive && (
        <div ref={mobileSearchContainerRef} className="flex items-center sm:hidden h-11 pb-2 relative">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownResults}
              placeholder="Search guides, research, retreats..."
              className="w-full pl-9 pr-8 py-2 bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-purple-500 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-500 focus:outline-none"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 text-stone-400"
                aria-label="Clear mobile search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearchOpen && (searchQuery.trim() !== '' || recentSearches.length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
              {searchQuery.trim() === '' ? (
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400 tracking-wider font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Recent Searches ({recentSearches.length}/5)</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[10px] font-semibold text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((recentTerm) => (
                      <div
                        key={recentTerm}
                        className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(recentTerm);
                            saveRecentSearch(recentTerm);
                            setSelectedIndex(0);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-purple-800 dark:text-purple-200 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>{recentTerm}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(recentTerm);
                          }}
                          aria-label={`Remove ${recentTerm} from recent searches`}
                          className="px-1.5 py-1 text-purple-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeResultsList.length > 0 ? (
                activeResultsList.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item.type, item.id)}
                    className="w-full text-left p-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">
                        {(item.data as { title: string }).title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-500">
                  No matches found for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Mobile/Tablet Scrollable Quick Tabs Row (< lg screens, uses justify-start so nothing clips) */}
        <div className="flex lg:hidden items-center justify-start h-11 border-t border-stone-100 dark:border-stone-800 text-xs overflow-x-auto no-scrollbar gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
              activeTab === 'education' || activeTab === 'educare' || activeTab === 'research' || activeTab === 'digital_world' || activeTab === 'careers' || activeTab === 'retreats'
                ? 'font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>Education</span>
          </button>

          {!isDeepWorkActive && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('music_store')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'music_store'
                    ? 'font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-emerald-500" />
                <span>Music</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photography_store')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'photography_store'
                    ? 'font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                <span>Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videography_store')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'videography_store'
                    ? 'font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>Videos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('book_store')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'book_store'
                    ? 'font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                <span>Books</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
              activeTab === 'activity'
                ? 'font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>Activity</span>
          </button>

          {!isDeepWorkActive && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('faculty_portal')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'faculty_portal'
                    ? 'font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('verify')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === 'verify' ? 'font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200' : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verify</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg cursor-pointer ${
                  activeTab === 'billing' ? 'font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800' : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Billing
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`px-2.5 py-1.5 whitespace-nowrap shrink-0 rounded-lg cursor-pointer ${
                  activeTab === 'faq' ? 'font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800' : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                FAQ
              </button>
            </>
          )}
        </div>

        {/* Mobile Full Actions Drawer (< lg screens) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenApplicationRegistration && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenApplicationRegistration();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 font-bold rounded-xl bg-purple-700 text-white"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Apply &amp; Register</span>
                </button>
              )}

              {onOpenAccreditation && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAccreditation();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Accreditation</span>
                </button>
              )}

              {onOpenAcademicPrompts && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAcademicPrompts();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Prompt Studio</span>
                </button>
              )}

              {onOpenExportReport && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExportReport();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Export Progress</span>
                </button>
              )}

              {user.subscription_tier === 'free' && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPaywall();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 col-span-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Digital Educare Tutoring (Free Short Courses)</span>
                </button>
              )}
            </div>

            {/* Mobile Theme Mode Switcher */}
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="font-bold text-stone-700 dark:text-stone-300">Theme Mode</span>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  Saved ({themeMode})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { mode: 'system' as const, label: 'System', Icon: Monitor },
                    { mode: 'light' as const, label: 'Light', Icon: Sun },
                    { mode: 'dark' as const, label: 'Dark', Icon: Moon },
                  ]
                ).map(({ mode, label, Icon }) => {
                  const active = themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChangeThemeMode?.(mode)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border cursor-pointer ${
                        active
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isAuthenticated && onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({user.name})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
