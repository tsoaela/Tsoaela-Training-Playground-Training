import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lock, BookOpen, Clock, Sparkles, Send, CheckCircle2, ChevronRight, X, ArrowUpRight, Search, Bell, CheckSquare, Square, RotateCcw, FileEdit, Award, Plus, Cpu, BarChart, Trophy, Star, ShieldCheck, Download, MessageSquare, MessageSquarePlus, ListOrdered, Library, FileText, Type, Save, WifiOff, Check, CheckCheck, Wand2, AlertCircle, AlertTriangle, Info, FileDown, Heading1, Heading2, Quote, Eraser, GraduationCap, Video, Trash2, Layers, QrCode } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { CourseLeaderboardWidget } from './CourseLeaderboardWidget';
import { AcademicDirectorySection } from './AcademicDirectorySection';
import { AcademicCategoryKey, AcademicFaculty, AcademicQualificationLevel } from '../data/academicCatalog';
import { CATALOG_STATS, STUDENT_BADGES, GLOBAL_LEADERBOARD, LIBRARY_RESOURCES, STUDY_ACTIVITY, INITIAL_DOCUMENTS } from '../data/mockData';
import { StudyGuide, UserProfile, ReadingProgress, ReadingProgressUpdateOptions, ChapterQuizPerformance, Quiz, StudentBadge, MediaItem, AuthorDocument, StudyActivity, OfflineAssignmentSubmission, EnrolledStudentRecord, ApplicationPrefillData, RealtimeStudyTelemetry } from '../types';
import { QuizHistoryTimeline } from './QuizHistoryTimeline';
import { ReadingProgress as ReadingProgressIndicator } from './ReadingProgress';
import { analyzeDocumentText, applySuggestion, fixAllSafeSuggestions, calculateReadability, TextSuggestion } from '../utils/textQualityEngine';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CourseCertificateModal } from './CourseCertificateModal';
import { CourseCertificatesGalleryModal } from './CourseCertificatesGalleryModal';
import { QctoBlueprintModal } from './QctoBlueprintModal';
import { CourseQrShareModal } from './CourseQrShareModal';
import { EDUCATION_COURSES } from '../data/artMediaData';
import { formatCertificateSerial, getCertificateForStudyGuide, resolveCertificateByCategory } from '../data/certificatesData';
import { loadLogoDataUrl, getFittedLogoSize } from '../utils/pdfBranding';
import {
  CatalogMultiFilterState,
  CatalogSortBy,
  CatalogSortDirection,
  EMPTY_CATALOG_FILTERS,
  filterAndSortStudyGuides,
  getStudyGuideNqfLevel,
} from '../utils/catalogOrganization';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface EducareTabProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onUpdateProgress: (guideId: string, chapterIdx: number, totalChapters: number, notes?: string, quizScore?: number, badgeId?: string, options?: ReadingProgressUpdateOptions) => void;
  onOpenReminders: (targetTitle?: string) => void;
  onTriggerPaywall: (featureName?: string, plan?: 'educare_pro' | 'research_pass') => void;
  onAddStudyGuide?: (guide: StudyGuide) => void;
  onRemoveStudyGuide?: (guideId: string) => void;
  targetGuideId?: string;
  targetChapterIdx?: number | null;
  targetLaunchQuizId?: string | null;
  onClearTargetGuide?: () => void;
  onOpenExportReport?: () => void;
  onOpenAcademicPrompts?: () => void;
  onOpenAccreditation?: () => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  pendingEditorDocument?: Partial<AuthorDocument> | null;
  onClearPendingDocument?: () => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string, roomId?: string) => void;
  isAuthenticated?: boolean;
  onRequireAuth?: (action: () => void, message: string) => void;
  onSubmitAssignment?: (courseId: string, courseTitle: string, assignmentTitle: string, content: string) => void;
  offlineAssignments?: OfflineAssignmentSubmission[];
  enrollments?: EnrolledStudentRecord[];
  onEnrollInCourse?: (guide: StudyGuide) => void;
  selectedAcademicCategory?: 'all' | AcademicCategoryKey;
  onSelectAcademicCategory?: (category: 'all' | AcademicCategoryKey) => void;
  savedProgramIds?: string[];
  onToggleSaveProgram?: (qual: AcademicQualificationLevel, faculty?: AcademicFaculty) => void;
  comparedProgramIds?: string[];
  onToggleCompareProgram?: (qualId: string) => void;
  onClearComparedPrograms?: () => void;
  onOpenCompareModal?: () => void;
  onOpenSavedProgramsProfile?: () => void;
  onOpenStudentFeedback?: (courseId?: string, moduleIndex?: number) => void;
  onActiveStudyContextChange?: (context: { courseTitle?: string; chapterTitle?: string } | null) => void;
  unlockedLongCourseIds?: string[];
  onUnlockLongCourse?: (guide: StudyGuide) => void;
  externalFilters?: CatalogMultiFilterState;
  sortBy?: CatalogSortBy;
  sortDirection?: CatalogSortDirection;
  onResetExternalFilters?: () => void;
  realtimeStudy?: RealtimeStudyTelemetry;
  onSelectedGuideChange?: (guideId: string | null, chapterIdx?: number) => void;
  onVerifySerial?: (serial: string) => void;
  onAppealCourse?: (courseId: string, courseTitle: string, serial?: string) => void;
}

export const EducareTab: React.FC<EducareTabProps> = ({
  user,
  studyGuides,
  readingProgress,
  onUpdateProgress,
  onOpenReminders,
  onTriggerPaywall,
  onAddStudyGuide,
  onRemoveStudyGuide,
  targetGuideId,
  targetChapterIdx = null,
  targetLaunchQuizId = null,
  onClearTargetGuide,
  onOpenExportReport,
  onOpenAcademicPrompts,
  onOpenAccreditation,
  onApplyQualification,
  pendingEditorDocument,
  onClearPendingDocument,
  onStartStudyRoom,
  isAuthenticated = false,
  onRequireAuth,
  onSubmitAssignment,
  offlineAssignments = [],
  enrollments = [],
  onEnrollInCourse,
  selectedAcademicCategory,
  onSelectAcademicCategory,
  savedProgramIds = [],
  onToggleSaveProgram,
  comparedProgramIds = [],
  onToggleCompareProgram,
  onClearComparedPrograms,
  onOpenCompareModal,
  onOpenSavedProgramsProfile,
  onOpenStudentFeedback,
  onActiveStudyContextChange,
  unlockedLongCourseIds = [],
  onUnlockLongCourse,
  externalFilters = EMPTY_CATALOG_FILTERS,
  sortBy = 'recommended',
  sortDirection = 'desc',
  onResetExternalFilters,
  realtimeStudy,
  onSelectedGuideChange,
  onVerifySerial,
  onAppealCourse,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGuide, setActiveGuide] = useState<StudyGuide | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  useEffect(() => {
    if (activeGuide) {
      const savedIdx = readingProgress[activeGuide.id]?.activeChapterIdx;
      const resolvedIdx = typeof savedIdx === 'number' ? savedIdx : 0;
      setActiveChapterIdx(resolvedIdx);
      onSelectedGuideChange?.(activeGuide.id, resolvedIdx);
    } else {
      onSelectedGuideChange?.(null, 0);
    }
  }, [activeGuide?.id]);

  useEffect(() => {
    if (activeGuide) {
      onSelectedGuideChange?.(activeGuide.id, activeChapterIdx);
    }
  }, [activeChapterIdx, activeGuide?.id]);

  useEffect(() => {
    if (!onActiveStudyContextChange) return;
    if (activeGuide) {
      onActiveStudyContextChange({
        courseTitle: activeGuide.title,
        chapterTitle: activeGuide.chapters?.[activeChapterIdx]?.title || activeGuide.chapters?.[0]?.title,
      });
    } else {
      onActiveStudyContextChange(null);
    }
  }, [activeGuide, activeChapterIdx, onActiveStudyContextChange]);
  const [expandedLeaderboardGuideId, setExpandedLeaderboardGuideId] = useState<string | null>(null);
  const [guideNote, setGuideNote] = useState<string>('');
  const [isNoteSaved, setIsNoteSaved] = useState<boolean>(false);
  const [expandedChapterNoteIdx, setExpandedChapterNoteIdx] = useState<number | null>(null);
  const [chapterNoteDrafts, setChapterNoteDrafts] = useState<Record<number, string>>({});
  const [savedChapterNoteIdx, setSavedChapterNoteIdx] = useState<number | null>(null);
  const [isAiCourseModalOpen, setIsAiCourseModalOpen] = useState(false);
  const [aiCourseTopic, setAiCourseTopic] = useState('');
  const [isGeneratingAiCourse, setIsGeneratingAiCourse] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [assignmentTitleInput, setAssignmentTitleInput] = useState('');
  const [assignmentBodyInput, setAssignmentBodyInput] = useState('');
  const [assignmentSubmittedNotice, setAssignmentSubmittedNotice] = useState<string | null>(null);
  const [certificateGuide, setCertificateGuide] = useState<StudyGuide | null>(null);
  const [isCertificatesGalleryOpen, setIsCertificatesGalleryOpen] = useState(false);
  const [blueprintGuide, setBlueprintGuide] = useState<StudyGuide | null>(null);
  const [qrShareGuide, setQrShareGuide] = useState<StudyGuide | null>(null);
  const [highlightedChapterIdx, setHighlightedChapterIdx] = useState<number | null>(null);
  const readerBodyRef = useRef<HTMLDivElement>(null);
  const pendingChapterIdxRef = useRef<number | null>(null);
  const pendingLaunchQuizIdRef = useRef<string | null>(null);

  // PDF Report Generation
  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    const logoDataUrl = await loadLogoDataUrl();
    const doc = new jsPDF();
    
    // Header with Tsoaela Logo
    const fitted = getFittedLogoSize(32, 18);
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 14, 12, fitted.width, fitted.height);
    }
    const headerX = logoDataUrl ? 14 + fitted.width + 6 : 14;
    doc.setFontSize(18);
    doc.text('TTG Educare Student Progress Report', headerX, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Student: ${user.name} (${user.email})`, headerX, 27);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()} · TTG - Tsoaela Training Ground Platform`, 14, 36);
    doc.text(`Tier: ${user.subscription_tier.replace('_', ' ').toUpperCase()}`, 14, 41);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Curriculum Summary', 14, 55);
    
    const completedGuides = studyGuides.filter(g => readingProgress[g.id]?.isCompleted);
    const badges = studyGuides.flatMap(g => readingProgress[g.id]?.unlockedBadges || []);
    const uniqueBadges = Array.from(new Set(badges));

    const summaryData = [
      ['Total Modules Available', studyGuides.length.toString()],
      ['Modules Completed', completedGuides.length.toString()],
      ['Professional Badges Earned', uniqueBadges.length.toString()],
    ];

    (doc as any).autoTable({
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [26, 43, 76] }
    });

    // Course Progress Table
    doc.text('Detailed Course Progress', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const courseData = studyGuides.map(g => {
      const progress = readingProgress[g.id];
      const scores = progress?.quizScores ? Object.values(progress.quizScores) : [];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 'N/A';
      return [
        g.title,
        g.category,
        progress ? `${progress.progressPercent}%` : '0%',
        progress?.isCompleted ? 'Completed' : 'In Progress',
        avgScore !== 'N/A' ? `${avgScore}%` : 'N/A'
      ];
    });

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Title', 'Category', 'Progress', 'Status', 'Avg Quiz Score']],
      body: courseData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('TTG - Tsoaela Training Ground Platform', 14, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`TTG_Report_${user.name.replace(' ', '_')}.pdf`);
    setIsGeneratingReport(false);
  };

  // Offline Mode Detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Open target guide if navigated from global search or Next Best Step banner
  useEffect(() => {
    if (targetGuideId) {
      const found = studyGuides.find(g => g.id === targetGuideId);
      if (found) {
        pendingChapterIdxRef.current = targetChapterIdx ?? null;
        pendingLaunchQuizIdRef.current = targetLaunchQuizId ?? null;
        handleOpenGuide(found);
        onClearTargetGuide?.();
      }
    }
  }, [targetGuideId, targetChapterIdx, targetLaunchQuizId, studyGuides, onClearTargetGuide, isAuthenticated]);

  // Scroll cleanly to deep-linked chapter when activeGuide renders
  useEffect(() => {
    if (!activeGuide || highlightedChapterIdx === null) return;
    const scrollTimer = window.setTimeout(() => {
      const el = readerBodyRef.current?.querySelector(
        `[data-chapter-index="${highlightedChapterIdx}"]`
      );
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    const clearTimer = window.setTimeout(() => {
      setHighlightedChapterIdx(null);
    }, 4500);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [activeGuide, highlightedChapterIdx]);

  // Document Editor State
  const [documents, setDocuments] = useState<AuthorDocument[]>(INITIAL_DOCUMENTS);
  const [activeDocument, setActiveDocument] = useState<AuthorDocument | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isQualityPanelOpen, setIsQualityPanelOpen] = useState(true);
  const [qualityFilter, setQualityFilter] = useState<'all' | 'spelling' | 'grammar' | 'wordiness' | 'style'>('all');
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set());
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically load and open document if dispatched from Academic Prompt Studio
  useEffect(() => {
    if (pendingEditorDocument) {
      const newDoc: AuthorDocument = {
        id: pendingEditorDocument.id || `doc_${Date.now()}`,
        title: pendingEditorDocument.title || 'Academic Draft',
        content: pendingEditorDocument.content || '',
        format: pendingEditorDocument.format || 'text',
        last_modified: new Date().toISOString().slice(0, 10),
        word_count: (pendingEditorDocument.content || '').split(/\s+/).filter(Boolean).length,
      };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocument(newDoc);
      setIsEditorOpen(true);
      onClearPendingDocument?.();
    }
  }, [pendingEditorDocument, onClearPendingDocument]);

  const handleSaveDocument = (doc: AuthorDocument) => {
    setDocuments(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) return prev.map(d => d.id === doc.id ? doc : d);
      return [doc, ...prev];
    });
    setActiveDocument(doc);
  };

  // Real-time Text Quality & Grammar Analysis
  const textQualityAnalysis = useMemo(() => {
    if (!activeDocument?.content) {
      return { suggestions: [] as TextSuggestion[], stats: calculateReadability('') };
    }
    return analyzeDocumentText(activeDocument.content);
  }, [activeDocument?.content]);

  const activeSuggestions = useMemo(() => {
    return textQualityAnalysis.suggestions.filter(s => {
      if (dismissedSuggestionIds.has(s.id)) return false;
      if (qualityFilter === 'all') return true;
      if (qualityFilter === 'spelling') return s.type === 'spelling';
      if (qualityFilter === 'grammar') return s.type === 'grammar';
      if (qualityFilter === 'wordiness') return s.type === 'wordiness';
      if (qualityFilter === 'style') return s.type === 'style' || s.type === 'punctuation';
      return true;
    });
  }, [textQualityAnalysis.suggestions, dismissedSuggestionIds, qualityFilter]);

  const handleApplySuggestion = (suggestion: TextSuggestion) => {
    if (!activeDocument) return;
    const updatedContent = applySuggestion(activeDocument.content, suggestion);
    const updatedWords = updatedContent.split(/\s+/).filter(Boolean).length;
    setActiveDocument({
      ...activeDocument,
      content: updatedContent,
      word_count: updatedWords,
    });
  };

  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestionIds(prev => new Set([...prev, id]));
  };

  const handleFixAllSafe = () => {
    if (!activeDocument) return;
    const updatedContent = fixAllSafeSuggestions(activeDocument.content, textQualityAnalysis.suggestions);
    const updatedWords = updatedContent.split(/\s+/).filter(Boolean).length;
    setActiveDocument({
      ...activeDocument,
      content: updatedContent,
      word_count: updatedWords,
    });
  };

  const handleInsertFormatting = (prefix: string, suffix: string = '') => {
    if (!activeDocument || !editorTextareaRef.current) return;
    const textarea = editorTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeDocument.content;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    setActiveDocument({
      ...activeDocument,
      content: newContent,
      word_count: newContent.split(/\s+/).filter(Boolean).length,
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  // Service-Side Headless PDF Generation & Export
  const handleExportHeadlessPdf = async () => {
    if (!activeDocument) return;
    setIsExportingPdf(true);
    setExportFeedback(null);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeDocument.title || 'Untitled Document',
          content: activeDocument.content || '',
          author: user.name || 'Institutional Scholar',
          format: activeDocument.format,
          lastModified: activeDocument.last_modified,
          wordCount: textQualityAnalysis.stats.wordCount,
          gradeLevel: textQualityAnalysis.stats.gradeLevel,
          fleschReadingLevel: textQualityAnalysis.stats.fleschReadingLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      const sanitizedFilename = (activeDocument.title || 'document')
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .substring(0, 50);
      anchor.download = `${sanitizedFilename}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setExportFeedback({
        type: 'success',
        message: `Headless PDF service generated and downloaded: ${sanitizedFilename}.pdf`,
      });
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (err: any) {
      console.warn('Headless PDF export fallback triggered:', err);
      // Client-side fallback using jsPDF with Tsoaela Logo
      try {
        const logoDataUrl = await loadLogoDataUrl();
        const fallbackPdf = new jsPDF();
        const fitted = getFittedLogoSize(30, 16);
        if (logoDataUrl) {
          fallbackPdf.addImage(logoDataUrl, 'JPEG', 14, 12, fitted.width, fitted.height);
        }
        const titleX = logoDataUrl ? 14 + fitted.width + 6 : 14;
        fallbackPdf.setFont('helvetica', 'bold');
        fallbackPdf.setFontSize(18);
        fallbackPdf.text(activeDocument.title || 'Untitled Document', titleX, 21);
        
        fallbackPdf.setFont('helvetica', 'normal');
        fallbackPdf.setFontSize(9);
        fallbackPdf.setTextColor(100, 100, 100);
        fallbackPdf.text(`TTG - Tsoaela Training Ground Platform · Author: ${user.name} | Date: ${activeDocument.last_modified} | Words: ${textQualityAnalysis.stats.wordCount}`, 14, 32);
        
        fallbackPdf.setDrawColor(200, 200, 200);
        fallbackPdf.line(14, 36, 196, 36);

        fallbackPdf.setFont('helvetica', 'normal');
        fallbackPdf.setFontSize(10);
        fallbackPdf.setTextColor(30, 30, 30);
        const splitText = fallbackPdf.splitTextToSize(activeDocument.content || '(Empty document)', 180);
        fallbackPdf.text(splitText, 14, 44);

        const safeFilename = (activeDocument.title || 'document').replace(/[^a-zA-Z0-9_\-]/g, '_');
        fallbackPdf.save(`${safeFilename}.pdf`);

        setExportFeedback({
          type: 'success',
          message: 'Document exported as PDF via backup engine.',
        });
        setTimeout(() => setExportFeedback(null), 5000);
      } catch (fallbackError: any) {
        setExportFeedback({
          type: 'error',
          message: `PDF generation failed: ${err?.message || 'Unknown error'}`,
        });
      }
    } finally {
      setIsExportingPdf(false);
    }
  };


  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuizQuestionIdx, setCurrentQuizQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    weakChapters?: ChapterQuizPerformance[];
  } | null>(null);

  // Available category options for filtering
  const educareCategories = useMemo(() => [
    { id: 'all', label: 'All Courses' },
    { id: 'accredited', label: 'Quality-Verified' },
    { id: 'short_term', label: 'Short-Term (Free Lessons)' },
    { id: 'long_term', label: 'Long-Term (R145 / Course)' },
    { id: 'free', label: 'Free Short Courses (R0)' },
    { id: 'premium', label: 'Long-Term Courses (R145)' },
  ], []);

  // AI Superagent state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: 'Greetings. I am your Digital Educare Cognitive Tutoring Assistant. Select any decision framework, mental model, or self-paced lesson concept to deconstruct together.',
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isLongTermCourseLocked = (guide: StudyGuide) =>
    guide.duration_type === 'long_term' && !unlockedLongCourseIds.includes(guide.id);

  // Filter & sort study guides based on category, search query, multi-select hub filters, and sort selection
  const filteredGuides = useMemo(() => {
    const baseFiltered = studyGuides.filter(guide => {
      // Category filter
      if (selectedCategory === 'free' && guide.duration_type === 'long_term') return false;
      if (selectedCategory === 'premium' && guide.duration_type !== 'long_term') return false;
      if (selectedCategory === 'accredited' && !guide.is_accredited) return false;
      if (selectedCategory === 'short_term' && guide.duration_type !== 'short_term') return false;
      if (selectedCategory === 'long_term' && guide.duration_type !== 'long_term') return false;
      
      if (
        selectedCategory !== 'all' && 
        selectedCategory !== 'free' && 
        selectedCategory !== 'premium' && 
        selectedCategory !== 'accredited' &&
        selectedCategory !== 'short_term' &&
        selectedCategory !== 'long_term'
      ) {
        const matchesCategory = guide.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesField = guide.field ? guide.field.toLowerCase().includes(selectedCategory.toLowerCase()) : false;
        if (!matchesCategory && !matchesField) return false;
      }

      // Search query filter: allows users to filter content by title or category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = guide.title.toLowerCase().includes(q);
        const matchesCategory = guide.category.toLowerCase().includes(q);
        const matchesField = guide.field ? guide.field.toLowerCase().includes(q) : false;
        const matchesAbstract = guide.abstract.toLowerCase().includes(q);
        const matchesOutcomes = guide.learning_outcomes.some(o => o.toLowerCase().includes(q));
        const matchesChapters = guide.chapters.some(c => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q));
        return matchesTitle || matchesCategory || matchesField || matchesAbstract || matchesOutcomes || matchesChapters;
      }

      return true;
    });

    return filterAndSortStudyGuides(
      baseFiltered,
      readingProgress,
      externalFilters,
      sortBy,
      sortDirection
    );
  }, [studyGuides, selectedCategory, searchQuery, readingProgress, externalFilters, sortBy, sortDirection]);

  // Chart Data: Completion progress across short-term and long-term courses
  const completionStats = useMemo(() => {
    const shortTerm = studyGuides.filter(g => g.duration_type === 'short_term');
    const longTerm = studyGuides.filter(g => g.duration_type === 'long_term');

    const getAvgProgress = (guides: StudyGuide[]) => {
      if (guides.length === 0) return 0;
      const totalProgress = guides.reduce((acc, g) => {
        const progress = readingProgress[g.id]?.progressPercent || 0;
        return acc + progress;
      }, 0);
      return Math.round(totalProgress / guides.length);
    };

    return [
      { name: 'Short-Term (Free)', progress: getAvgProgress(shortTerm), count: shortTerm.length, color: '#10b981' },
      { name: 'Long-Term (R145)', progress: getAvgProgress(longTerm), count: longTerm.length, color: '#6366f1' },
    ];
  }, [studyGuides, readingProgress]);

  const accreditationStats = useMemo(() => {
    const accredited = studyGuides.filter(g => g.is_accredited);
    const nonAccredited = studyGuides.filter(g => !g.is_accredited);

    const getCompletedCount = (guides: StudyGuide[]) => 
      guides.filter(g => readingProgress[g.id]?.isCompleted).length;

    return [
      { name: 'Quality-Verified', value: getCompletedCount(accredited), total: accredited.length, fill: '#f59e0b' },
      { name: 'Standard', value: getCompletedCount(nonAccredited), total: nonAccredited.length, fill: '#78716c' },
    ];
  }, [studyGuides, readingProgress]);


  const handleGenerateAiCourse = (topic: string) => {
    if (!topic.trim()) return;
    setIsGeneratingAiCourse(true);
    setTimeout(() => {
      const generatedTitle = topic.trim().charAt(0).toUpperCase() + topic.trim().slice(1);
      const newGuide: StudyGuide = {
        id: `sg_ai_custom_${Date.now()}`,
        title: generatedTitle,
        category: 'Frontier AI & Systems',
        field: 'Custom AI Curriculum',
        reading_time: '45 min read',
        difficulty: 'Advanced',
        is_premium: false,
        course_price_zar: 0,
        pacing_mode: 'self_paced',
        is_accredited: true,
        accreditor_name: 'TTG - Tsoaela Training Ground Platform',
        duration_type: 'short_term',
        duration_label: 'Self-Paced · Short Course (Free)',
        abstract: `Autonomous curriculum synthesizing frontier principles, formal invariants, and operational workflows for ${generatedTitle}.`,
        learning_outcomes: [
          `Deconstruct core theoretical foundations of ${generatedTitle}`,
          'Map error-compounding thresholds and mitigation circuit breakers',
          'Deploy reproducible evaluation pipelines with verifiable benchmark scores',
        ],
        chapters: [
          {
            title: `01. Theoretical Foundations & Axioms of ${generatedTitle}`,
            content: `Deconstructing ${generatedTitle} from first principles. By formulating the challenge as a constrained optimization problem over state transitions, we isolate failure modes before running high-cost execution passes.`,
          },
          {
            title: `02. Implementation Architecture & Error Shielding`,
            content: `Designing the operational graph. Every intermediate state transition must be validated by deterministic schema checkers before mutating state or triggering external side-effects.`,
          },
          {
            title: `03. Empirical Telemetry & Continuous Evaluation`,
            content: `Benchmark validation across 10,000 synthetic test runs. Analyzing loss landscapes, latency tails, and inference token throughput across distributed clusters.`,
          },
        ],
        certificate: resolveCertificateByCategory({
          id: `sg_ai_custom_${Date.now()}`,
          title: generatedTitle,
          category: 'Frontier AI & Systems',
          field: 'Custom AI Curriculum',
          accreditor: 'TTG - Tsoaela Training Ground Platform',
        }),
      };

      if (onAddStudyGuide) {
        onAddStudyGuide(newGuide);
      }
      setIsGeneratingAiCourse(false);
      setIsAiCourseModalOpen(false);
      setAiCourseTopic('');
      setSelectedCategory('all');
    }, 1000);
  };

  const handleOpenGuide = (guide: StudyGuide) => {
    // Active student validation: Must be authenticated to access course curriculum
    if (!isAuthenticated && onRequireAuth) {
      onRequireAuth(() => {
        handleOpenGuideInternal(guide);
      }, `Sign in or register your student account to validate enrollment and access "${guide.title}".`);
      return;
    }

    handleOpenGuideInternal(guide);
  };

  const handleOpenGuideInternal = (guide: StudyGuide) => {
    if (isLongTermCourseLocked(guide)) {
      pendingChapterIdxRef.current = null;
      pendingLaunchQuizIdRef.current = null;
      if (onUnlockLongCourse) {
        onUnlockLongCourse(guide);
      } else {
        onTriggerPaywall(guide.title, 'educare_pro');
      }
    } else {
      setActiveGuide(guide);
      const existing = readingProgress[guide.id];
      setGuideNote(existing?.notes || '');
      setIsNoteSaved(false);
      setChapterNoteDrafts(existing?.chapterNotes ? { ...existing.chapterNotes } : {});
      setExpandedChapterNoteIdx(null);
      setSavedChapterNoteIdx(null);

      const requestedChapter = pendingChapterIdxRef.current;
      const requestedQuizId = pendingLaunchQuizIdRef.current;
      pendingChapterIdxRef.current = null;
      pendingLaunchQuizIdRef.current = null;

      if (
        typeof requestedChapter === 'number' &&
        requestedChapter >= 0 &&
        requestedChapter < guide.chapters.length
      ) {
        setHighlightedChapterIdx(requestedChapter);
      }

      if (requestedQuizId && guide.quizzes && guide.quizzes.length > 0) {
        const matchedQuiz =
          guide.quizzes.find((q) => q.id === requestedQuizId) ||
          guide.quizzes[guide.quizzes.length - 1];
        if (matchedQuiz) {
          handleStartQuiz(matchedQuiz);
        }
      }

      onUpdateProgress(
        guide.id,
        -1,
        guide.chapters.length,
        undefined,
        undefined,
        undefined,
        { touchAccessOnly: true }
      );
    }
  };

  const handleSaveGuideNote = () => {
    if (!activeGuide) return;
    // Call progress update to save notes
    onUpdateProgress(activeGuide.id, -1, activeGuide.chapters.length, guideNote);
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2500);
  };

  const handleSaveChapterNote = (chapterIdx: number) => {
    if (!activeGuide) return;
    const noteText = chapterNoteDrafts[chapterIdx] ?? '';
    onUpdateProgress(
      activeGuide.id,
      -1,
      activeGuide.chapters.length,
      undefined,
      undefined,
      undefined,
      {
        chapterNote: {
          chapterIdx,
          notes: noteText,
        },
      }
    );
    setSavedChapterNoteIdx(chapterIdx);
    setTimeout(() => {
      setSavedChapterNoteIdx((prev) => (prev === chapterIdx ? null : prev));
    }, 2500);
  };

  const handleAskSuperagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt;
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiPrompt('');
    setIsAiLoading(true);

    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('negotiat') || lower.includes('game theory')) {
        reply = `In high-stakes negotiation mechanism design, the first axiom is asymmetric informational parity. Rather than debating price, isolate the counterparty's reservation price through costly signaling: offer two non-linear package choices where option A yields maximum speed with premium escrow, and option B grants deferred equity milestones. This forces truth-revelation without escalating antagonism.`;
      } else if (lower.includes('system') || lower.includes('principle')) {
        reply = `To strip this operational knot down to first principles: map out the exact latency between decision issuance and operational feedback. In 84% of institutional bottlenecks, perceived 'execution friction' is merely feedback latency disguised as incompetence. Eliminate intermediate narrative reporting and establish direct telemetry.`;
      } else {
        reply = `Analyzing query through the TTG Decision Architecture: Consider the second-order consequences over a 3-year horizon. If this decision fails, what structural invariant was violated? Ensure your downside is bounded by hard contractual constraints before optimizing for speculative upside.`;
      }

      setAiMessages(prev => [...prev, { sender: 'agent', text: reply }]);
      setIsAiLoading(false);
    }, 900);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuizQuestionIdx(0);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleQuizAnswer = (questionId: string, answerIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || !activeGuide) return;

    let correctCount = 0;
    const totalChapters = Math.max(1, activeGuide.chapters.length);
    const chapterStatsMap: Record<number, { correct: number; total: number }> = {};

    activeQuiz.questions.forEach((q, qIdx) => {
      const isCorrect = quizAnswers[q.id] === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
      }
      const mappedChapterIdx =
        typeof q.chapterIdx === 'number'
          ? Math.min(Math.max(0, totalChapters - 1), q.chapterIdx)
          : qIdx % totalChapters;

      if (!chapterStatsMap[mappedChapterIdx]) {
        chapterStatsMap[mappedChapterIdx] = { correct: 0, total: 0 };
      }
      chapterStatsMap[mappedChapterIdx].total += 1;
      if (isCorrect) {
        chapterStatsMap[mappedChapterIdx].correct += 1;
      }
    });

    const chapterBreakdown: ChapterQuizPerformance[] = Object.entries(chapterStatsMap)
      .map(([idxStr, stat]) => {
        const chIdx = Number(idxStr);
        return {
          chapterIdx: chIdx,
          chapterTitle: activeGuide.chapters[chIdx]?.title || `Chapter ${chIdx + 1}`,
          correct: stat.correct,
          total: stat.total,
          accuracyPct: Math.round((stat.correct / Math.max(1, stat.total)) * 100),
        };
      })
      .sort((a, b) => a.accuracyPct - b.accuracyPct || a.chapterIdx - b.chapterIdx);

    const weakChapterIndices = chapterBreakdown
      .filter((c) => c.accuracyPct < activeQuiz.minScoreToPass)
      .map((c) => c.chapterIdx);

    const score = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const passed = score >= activeQuiz.minScoreToPass;

    setQuizResult({
      score,
      passed,
      weakChapters: chapterBreakdown.filter((c) => c.accuracyPct < 100),
    });

    onUpdateProgress(
      activeGuide.id,
      -1,
      activeGuide.chapters.length,
      undefined,
      score,
      passed ? activeQuiz.badgeId : undefined,
      {
        quizAttempt: {
          quizId: activeQuiz.id,
          quizTitle: activeQuiz.title,
          score,
          minScoreToPass: activeQuiz.minScoreToPass,
          passed,
          correctCount,
          totalQuestions: activeQuiz.questions.length,
          weakChapterIndices,
          chapterBreakdown,
        },
      }
    );
  };

  const handleCloseQuiz = () => {
    setActiveQuiz(null);
    setQuizResult(null);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>TTG Digital Educare Tutoring</span>
          <span aria-hidden="true">·</span>
          <span>Self-Paced Lessons</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Finish at Your Own Pace</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{studyGuides.length} Courses Available</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
              Digital Educare Tutoring &amp; Self-Paced Courses
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              Flexible digital tutoring built so you finish every course at your own pace. Short-term course lessons are 100% free (R0), and comprehensive long-term courses are R145 per course.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenExportReport || handleDownloadReport}
              disabled={isGeneratingReport}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isGeneratingReport ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span>Export Progress Report</span>
            </button>

            {onOpenAcademicPrompts && (
              <button
                type="button"
                onClick={onOpenAcademicPrompts}
                className="px-3.5 py-2 text-xs font-semibold text-purple-800 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
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
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                title="Internal Quality Assurance & Curriculum Self-Audit"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Internal QA ($0)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCertificatesGalleryOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-[#bef264] bg-[#052e16] hover:bg-[#064e3b] border border-[#84cc16]/60 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Browse Course Certificates Designed by Category"
            >
              <Award className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Course Certificates</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiCourseModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Generate AI Course</span>
            </button>

            <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/90 dark:border-emerald-800/80 flex items-center gap-2.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  Short Courses: Free · Long-Term: R145
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">
                  Self-paced tutoring · Finish at your own pace
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reusable SearchBar Component in Header Area */}
        <div className="mt-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Filter tutoring courses by title, category, field, or keywords..."
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={educareCategories}
            totalResults={filteredGuides.length}
            totalAvailable={studyGuides.length}
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
            }}
          />
        </div>
      </div>

      {/* Progress Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-stone-400" />
                Self-Paced Tutoring Mastery
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Aggregated reading completion across free short-term and R145 long-term tutoring courses.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-stone-600 dark:text-stone-400">Short-Term (Free)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-stone-600 dark:text-stone-400">Long-Term (R145)</span>
              </div>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={completionStats} layout="vertical" margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:stroke-stone-800" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 p-2 rounded-lg text-[10px] shadow-xl border border-stone-800">
                          <p className="font-bold">{data.name}</p>
                          <p className="font-mono">{data.progress}% Mastery · {data.count} Guides</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={32}>
                  {completionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-4">
            {completionStats.map((stat) => (
              <div key={stat.name}>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-stone-500 dark:text-stone-400">{stat.name}</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">{stat.progress}%</span>
                </div>
                <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ width: `${stat.progress}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            Curriculum QA Status
          </h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-6">
            Internal quality-check completion.
          </p>

          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={accreditationStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {accreditationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2 rounded-lg text-[10px] shadow-xl">
                          <p className="font-bold">{data.name}</p>
                          <p className="font-mono">{data.value}/{data.total} Completed</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100 font-mono">
                {accreditationStats[0].value}
              </span>
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-tighter">QA Checked</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {accreditationStats.map((stat) => (
              <div key={stat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.fill }}></div>
                  <span className="text-stone-600 dark:text-stone-400">{stat.name}</span>
                </div>
                <span className="font-mono text-stone-500">{stat.value}/{stat.total}</span>
              </div>
            ))}
          </div>

          {/* Global Leaderboard Section */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-4">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              Global Leaderboard
            </h3>
            <div className="space-y-3">
              {GLOBAL_LEADERBOARD.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    entry.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-xs font-mono font-bold ${entry.rank <= 3 ? 'text-amber-500' : 'text-stone-400'}`}>
                      {entry.rank.toString().padStart(2, '0')}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{entry.name}</span>
                      <span className="text-[10px] text-stone-500">{entry.badges_count} Badges · {entry.completed_courses} Completed</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                    {entry.total_score}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-[10px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 uppercase tracking-widest transition-colors">
              View Full Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Learning Heatmap */}
      <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Weekly Learning Activity
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Study intensity over the last 7 days.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 2, 5, 8, 10].map(v => (
                <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(245, 158, 11, ${v/10})`, border: '1px solid rgba(245, 158, 11, 0.2)' }}></div>
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
        <div className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={STUDY_ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-stone-800" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#78716c' }} />
              <YAxis hide domain={[0, 10]} />
              <Tooltip 
                cursor={{ fill: '#fafaf9', opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as StudyActivity;
                    return (
                      <div className="bg-stone-900 text-white p-2 rounded-lg text-[10px] shadow-xl">
                        <p className="font-bold">{data.day} · {data.date}</p>
                        <p className="font-mono">Intensity: {data.intensity}/10</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="intensity" radius={[4, 4, 0, 0]} barSize={40}>
                {STUDY_ACTIVITY.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#f59e0b" fillOpacity={0.2 + (entry.intensity / 12)} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Library & Document Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Library */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Library className="w-4 h-4 text-emerald-500" />
              Resource Library
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              {LIBRARY_RESOURCES.length} Materials
            </span>
          </div>
          <div className="space-y-3">
            {LIBRARY_RESOURCES.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center">
                    {item.media_type === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                    {item.media_type === 'template' && <Type className="w-5 h-5 text-blue-500" />}
                    {item.media_type === 'book' && <BookOpen className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{item.title}</h4>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-stone-400">{item.file_size}</span>
                  <button className="p-2 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Editor / Authoring Tool */}
        <div className="p-6 bg-stone-900 text-white rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-purple-400" />
              Authoring Studio
            </h3>
            <button 
              onClick={() => {
                setActiveDocument({ id: `doc_${Date.now()}`, title: 'Untitled Draft', content: '', format: 'text', last_modified: new Date().toISOString().slice(0,10), word_count: 0 });
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
            >
              <Plus className="w-3 h-3" />
              New Draft
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {documents.length > 0 ? documents.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => { setActiveDocument(doc); setIsEditorOpen(true); }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold">{doc.title}</h4>
                  <span className="text-[10px] opacity-40">{doc.last_modified}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-60 font-mono">
                  <span>{doc.word_count} words</span>
                  <span className="uppercase">{doc.format}</span>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <FileText className="w-8 h-8 mb-2" />
                <p className="text-xs">No active drafts found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-6 left-6 z-[100] animate-bounce">
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-500 text-white rounded-xl shadow-2xl border-2 border-white dark:border-stone-800">
            <WifiOff className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase leading-none">Offline Mode</span>
              <span className="text-[9px] font-medium opacity-90">Viewing cached curriculum</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>AI Study Partner</span>
                <span aria-hidden="true">·</span>
                <span>Context-Aware Mentor</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Deep-Knowledge Cognitive Assistant
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
                Immediate explanations for specific modules. Currently analyzing: <span className="font-semibold text-stone-900 dark:text-stone-100">{activeGuide ? activeGuide.title : 'Global Curriculum'}</span>
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
              Free Digital Tutoring Included
            </span>
          </div>
          
          {/* Chat Interface (Simplified version of the superagent UI but context-specific) */}
          <div className="mt-6 space-y-4">
             <div className="space-y-3 max-h-64 overflow-y-auto p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 shadow-xs">
                  I am initialized with the context of {activeGuide ? `"${activeGuide.title}"` : "the full TTG syllabus"}. How can I clarify your current study session?
                </div>
                {/* User messages would go here */}
             </div>
             <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Ask about ${activeGuide ? activeGuide.title : 'any study guide'}...`}
                  className="flex-1 px-3.5 py-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>
        </div>

        {/* Recent Achievements / Sidebar for AI Partner */}
        <div className="p-6 bg-indigo-600 text-white rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4">Study Insights</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Mastery Level</p>
                  <p className="text-sm font-bold">Systems Adept</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">Avg. Score</p>
                  <p className="text-sm font-bold font-mono">92%</p>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full mt-8 py-2.5 bg-white text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors">
            Analyze Knowledge Gaps
          </button>
        </div>
      </div>

      {/* Grid of Study Guides or Empty Search State */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-12 text-center bg-stone-50/50 dark:bg-stone-900/40">
          <BookOpen className="w-8 h-8 text-stone-400 dark:text-stone-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            No study guides found matching &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, searching for broader concepts like &ldquo;game theory&rdquo;, or reset the active filter.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => {
            const isLongTerm = guide.duration_type === 'long_term';
            const isLocked = isLongTermCourseLocked(guide);
            const coursePriceZar = guide.course_price_zar || 145;
            const progress = readingProgress[guide.id];
            const completedCount = progress?.completedChapters?.length || 0;
            const progressPercent = progress?.progressPercent || 0;
            const isCompleted = progressPercent >= 100 || progress?.isCompleted;
            const nqfLevel = getStudyGuideNqfLevel(guide);

            return (
              <div
                key={guide.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isLocked 
                    ? 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 hover:border-amber-400 dark:hover:border-amber-600' 
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-700 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{guide.category}</span>
                      {guide.field && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-stone-500 dark:text-stone-400">{guide.field}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{guide.reading_time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                        NQF Level {nqfLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isCompleted ? (
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Finished</span>
                        </span>
                      ) : progressPercent > 0 ? (
                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{progressPercent}% Done</span>
                        </span>
                      ) : null}

                      {isLongTerm ? (
                        !isLocked ? (
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Unlocked · Self-Paced</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1 font-mono tabular-nums">
                            <Lock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>R{coursePriceZar} / Course · Self-Paced</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Free Lessons · Self-Paced
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    {guide.title}
                  </h3>
                  
                  <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                    {guide.abstract}
                  </p>

                  {guide.is_accredited && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Quality-Checked · {guide.accreditor_name}</span>
                      </span>
                    </div>
                  )}

                  {/* Reading Progress Indicator Bar */}
                  <div className="mt-3.5">
                    <ReadingProgressIndicator
                      guideId={guide.id}
                      courseTitle={guide.title}
                      completedCount={completedCount}
                      totalCount={guide.chapters.length}
                      progressPercent={progressPercent}
                      isCompleted={Boolean(isCompleted)}
                      variant="card"
                      enableConfetti
                      confettiVariant="contained"
                    />
                  </div>

                  {/* Learning outcomes preview */}
                  <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                      Core Learning Outcomes
                    </span>
                    {guide.learning_outcomes.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">›</span>
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* Attached Category Certificate Strip */}
                  {(() => {
                    const certSpec = getCertificateForStudyGuide(guide);
                    if (!certSpec) return null;
                    return (
                      <div className="mt-3.5 px-3 py-2 rounded-xl bg-[#022c22] text-[#ecfccb] border border-[#84cc16]/45 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Award className="w-3.5 h-3.5 text-[#bef264] shrink-0" />
                          <span className="truncate font-semibold">{certSpec.credentialTitle}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#a3e635] shrink-0">
                          {certSpec.credentialCodePrefix}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Row */}
                <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                      {guide.chapters.length} Chapters
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenReminders(guide.title)}
                      className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 p-1 rounded transition-colors"
                      title="Set study reminder for this guide"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    {onOpenStudentFeedback && (
                      <button
                        type="button"
                        onClick={() => {
                          const completedCountForGuide = readingProgress[guide.id]?.completedChapters?.length || 0;
                          const targetIdx =
                            completedCountForGuide > 0
                              ? Math.min(guide.chapters.length - 1, completedCountForGuide - 1)
                              : 0;
                          onOpenStudentFeedback(guide.id, targetIdx);
                        }}
                        className="text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded transition-colors cursor-pointer"
                        title="Submit module difficulty or clarity feedback for faculty"
                        aria-label={`Submit module feedback for ${guide.title}`}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onRemoveStudyGuide && guide.id.startsWith('sg_ai_custom_') && (
                      <button
                        type="button"
                        onClick={() => onRemoveStudyGuide(guide.id)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Remove custom course"
                        aria-label={`Remove ${guide.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {(guide.category === 'Frontier AI & Systems' || guide.is_ai_generated) && (
                      <button
                        type="button"
                        onClick={() => setBlueprintGuide(guide)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer whitespace-nowrap"
                        title="View QCTO Occupational Skills Programme Blueprint (NQF level, notional hours, and KM/PM/WM modules)"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>QCTO Blueprint</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrShareGuide(guide);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      title={`Generate shareable QR code for ${guide.title}`}
                      aria-label={`Generate QR Code for ${guide.title}`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Generate QR Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCertificateGuide(guide)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      title={`View attached ${guide.category} certificate`}
                    >
                      <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span>Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLeaderboardGuideId((prev) =>
                          prev === guide.id ? null : guide.id
                        )
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        expandedLeaderboardGuideId === guide.id
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                      title="Toggle Top 5 Course Leaderboard (enrolled students only)"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Leaderboard</span>
                    </button>

                    {onStartStudyRoom && !isLocked && (
                      <button
                        type="button"
                        onClick={() => onStartStudyRoom(guide.title, guide.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors cursor-pointer"
                        title="Start or join WebRTC study video room for this course"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Study Room</span>
                      </button>
                    )}

                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() =>
                          onUnlockLongCourse
                            ? onUnlockLongCourse(guide)
                            : onTriggerPaywall(guide.title, 'educare_pro')
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg transition-colors cursor-pointer font-mono tabular-nums"
                      >
                        <Lock className="w-3 h-3 text-amber-300 dark:text-amber-600" />
                        <span>Unlock Course (R{coursePriceZar})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenGuide(guide)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                      >
                        <span>{progressPercent > 0 ? 'Continue Reading' : 'Start Reading'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {expandedLeaderboardGuideId === guide.id && (
                  <div className="mt-4 pt-4 border-t border-stone-200/70 dark:border-stone-800">
                    <CourseLeaderboardWidget
                      studyGuide={guide}
                      enrollments={enrollments}
                      user={user}
                      isAuthenticated={isAuthenticated}
                      readingProgress={readingProgress}
                      onRequireAuth={onRequireAuth}
                      onEnrollInCourse={onEnrollInCourse}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Individual Academic Faculties, Specializations & Qualification Levels */}
      <AcademicDirectorySection
        selectedCategory={selectedAcademicCategory}
        onSelectCategory={onSelectAcademicCategory}
        onOpenAccreditation={onOpenAccreditation}
        onApplyQualification={onApplyQualification}
        onGenerateStudyGuide={(topic) => {
          setAiCourseTopic(topic);
          setIsAiCourseModalOpen(true);
        }}
        onFilterCatalogByProgram={(term) => setSearchQuery(term)}
        savedProgramIds={savedProgramIds}
        onToggleSaveProgram={onToggleSaveProgram}
        comparedProgramIds={comparedProgramIds}
        onToggleCompareProgram={onToggleCompareProgram}
        onClearComparedPrograms={onClearComparedPrograms}
        onOpenCompareModal={onOpenCompareModal}
        onOpenSavedProgramsProfile={onOpenSavedProgramsProfile}
      />

      {/* Educare AI Superagent Section */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Educare AI Superagent</span>
              <span aria-hidden="true">·</span>
              <span>Socratic Decision Assistant</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Interactive Cognitive Architecture Superagent
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
              Pressure-test leadership assumptions, simulate negotiation counter-moves, and apply mental models in real time.
            </p>
          </div>

          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Self-Paced Tutoring Active</span>
          </span>
        </div>

        {/* Interactive Tutoring Chat */}
        <div className="mt-6 space-y-4">
            {/* Conversation Log */}
            <div className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs">
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 mb-1">
                    {msg.sender === 'user' ? 'You' : 'Educare Superagent'}
                  </div>
                  <div
                    className={`p-3 rounded-xl max-w-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="text-stone-400 dark:text-stone-500 text-xs italic">
                  Synthesizing cognitive frameworks...
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-stone-400 dark:text-stone-500 py-1">Try prompt:</span>
              <button
                type="button"
                onClick={() => setAiPrompt('Deconstruct a multi-party negotiation using mechanism design')}
                className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                Multi-party negotiation design
              </button>
              <button
                type="button"
                onClick={() => setAiPrompt('Audit feedback delay cascades in engineering throughput')}
                className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                Feedback delay cascades
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskSuperagent} className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask the Educare Superagent a strategic question..."
                className="flex-1 px-3.5 py-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="px-4 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
      </div>

      {/* Guide Detail Modal / Reader with Interactive Reading Process & Notes */}
      {activeGuide && (() => {
        const progress = readingProgress[activeGuide.id];
        const completedChapters = progress?.completedChapters || [];
        const completedCount = completedChapters.length;
        const totalCount = activeGuide.chapters.length;
        const percent = Math.round((completedCount / totalCount) * 100);
        const isAllDone = completedCount === totalCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-stone-950/75 backdrop-blur-md"
              onClick={() => setActiveGuide(null)}
            />

            <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 max-h-[90vh] flex flex-col">
              
              {/* Reader Header */}
              <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {activeGuide.category} · Self-Paced Tutoring · Finish at your own pace
                    </span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{activeGuide.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(activeGuide.category === 'Frontier AI & Systems' || activeGuide.is_ai_generated) && (
                      <button
                        type="button"
                        onClick={() => setBlueprintGuide(activeGuide)}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                        title="View QCTO Occupational Skills Programme Blueprint"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="hidden sm:inline">QCTO Blueprint</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCertificateGuide(activeGuide)}
                      className="px-3 py-1.5 text-xs font-bold text-[#bef264] bg-[#052e16] hover:bg-[#064e3b] border border-[#84cc16]/60 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="View or download attached category certificate"
                    >
                      <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                      <span className="hidden sm:inline">Certificate</span>
                    </button>

                    {onStartStudyRoom && (
                      <button
                        type="button"
                        onClick={() => onStartStudyRoom(activeGuide.title, activeGuide.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Start live WebRTC video study group for this course"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-200" />
                        <span>Study Group Room</span>
                      </button>
                    )}

                    {onOpenStudentFeedback && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenStudentFeedback(
                            activeGuide.id,
                            completedChapters.length > 0
                              ? Math.min(activeGuide.chapters.length - 1, completedChapters.length - 1)
                              : 0
                          )
                        }
                        className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Share module difficulty or clarity feedback with faculty"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">Module Feedback</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenReminders(activeGuide.title)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Set reminder for this study guide"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="hidden sm:inline">Set Reminder</span>
                    </button>

                    <button
                      onClick={() => setActiveGuide(null)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Reading Progress Bar, Markdown Notes Export & 100% Milestone Confetti */}
                <ReadingProgressIndicator
                  guideId={activeGuide.id}
                  courseTitle={activeGuide.title}
                  completedCount={completedCount}
                  totalCount={totalCount}
                  progressPercent={percent}
                  isCompleted={Boolean(progress?.isCompleted || isAllDone)}
                  variant="reader"
                  enableConfetti
                  confettiVariant="viewport"
                  chapters={activeGuide.chapters}
                  chapterNotes={progress?.chapterNotes}
                  generalNotes={progress?.notes}
                  completionLog={progress?.completionLog}
                  studyGuides={studyGuides}
                  allReadingProgress={readingProgress}
                  learnerName={user.name}
                  realtimeStudy={realtimeStudy}
                />
              </div>

              {/* Reader Body with Chapters & Interactive Completion */}
              <div
                ref={readerBodyRef}
                className="p-5 sm:p-8 overflow-y-auto space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed"
              >
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-semibold block mb-1">Executive Summary</span>
                  {activeGuide.abstract}
                </div>

                {/* Chapter list with checklist */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                      Curriculum Chapters ({activeGuide.chapters.length})
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      Click checkmark to track your progress
                    </span>
                  </div>

                  {activeGuide.chapters.map((chapter, idx) => {
                    const isChapterDone = completedChapters.includes(idx);
                    const savedChapterNote = progress?.chapterNotes?.[idx] || '';
                    const isChapterNoteExpanded = expandedChapterNoteIdx === idx;
                    const draftNote = chapterNoteDrafts[idx] ?? savedChapterNote;
                    const isFocusedChapter = highlightedChapterIdx === idx;

                    return (
                      <div 
                        key={idx} 
                        data-chapter-index={idx}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isFocusedChapter
                            ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-950/30'
                            : isChapterDone
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChapterIdx(idx);
                                onUpdateProgress(activeGuide.id, idx, totalCount, guideNote, undefined, undefined, {
                                  activeChapterIdx: idx,
                                });
                              }}
                              className={`p-1 rounded transition-colors mt-0.5 ${
                                isChapterDone 
                                  ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700' 
                                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                              }`}
                              title={isChapterDone ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {isChapterDone ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <h4 className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                              Chapter {idx + 1}: {chapter.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setChapterNoteDrafts((prev) => ({
                                  ...prev,
                                  [idx]: prev[idx] ?? savedChapterNote,
                                }));
                                setExpandedChapterNoteIdx((prev) => (prev === idx ? null : idx));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                                savedChapterNote.trim()
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                              }`}
                            >
                              <FileEdit className="w-3 h-3" />
                              <span>
                                {isChapterNoteExpanded
                                  ? 'Close Notes'
                                  : savedChapterNote.trim()
                                  ? 'Edit Summary'
                                  : 'Add Summary'}
                              </span>
                            </button>

                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold shrink-0 ${
                              isChapterDone
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                            }`}>
                              {isChapterDone ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed pl-7">
                          {chapter.content}
                        </p>

                        {/* Saved Chapter Summary Preview */}
                        {!isChapterNoteExpanded && savedChapterNote.trim() && (
                          <div className="ml-7 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-xs text-stone-700 dark:text-stone-300 flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 block">
                                Chapter {idx + 1} Personal Study Summary
                              </span>
                              <p className="leading-relaxed italic">&ldquo;{savedChapterNote}&rdquo;</p>
                            </div>
                          </div>
                        )}

                        {/* Inline Chapter Summary Editor */}
                        {isChapterNoteExpanded && (
                          <div className="ml-7 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                                <FileEdit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Chapter {idx + 1} Study Summary</span>
                              </span>
                              {savedChapterNoteIdx === idx && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Saved to ReadingProgress
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={2}
                              value={draftNote}
                              onChange={(e) =>
                                setChapterNoteDrafts((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value,
                                }))
                              }
                              placeholder={`Write your personal study summary for Chapter ${idx + 1}: ${chapter.title}...`}
                              className="w-full p-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-600"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedChapterNoteIdx(null)}
                                className="px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveChapterNote(idx)}
                                className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors cursor-pointer"
                              >
                                Save Chapter Summary
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Personal Study Notes Section */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                      <FileEdit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Personal Study Notes & Key Takeaways</span>
                    </div>
                    {isNoteSaved && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved to profile
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={guideNote}
                    onChange={(e) => setGuideNote(e.target.value)}
                    placeholder="Record key reflections, frameworks, or meeting applications from this study guide..."
                    className="w-full p-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveGuideNote}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                    >
                      Save Study Notes
                    </button>
                  </div>
                </div>

                {/* Course Quiz History Timeline */}
                <QuizHistoryTimeline
                  guide={activeGuide}
                  progress={progress}
                  onStartQuiz={handleStartQuiz}
                />

                {/* Course Assignment Submission (Offline-Ready & Auto-Synced) */}
                {onSubmitAssignment && (
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Module Assignment Submission</span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {isOnline ? 'Direct DB Sync Active' : 'Offline Cache Queue · Auto-syncs on reconnect'}
                      </span>
                    </div>

                    {(() => {
                      const guideSubmissions = offlineAssignments.filter(a => a.courseId === activeGuide.id);
                      const latestSub = guideSubmissions[0];
                      return latestSub ? (
                        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-semibold text-stone-900 dark:text-stone-100 block truncate">
                              Latest: {latestSub.assignmentTitle}
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400">
                              Submitted {new Date(latestSub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          <span className={`text-[11px] font-semibold shrink-0 ${
                            latestSub.syncedToDatabase
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}>
                            {latestSub.syncedToDatabase ? 'Synced to DB' : 'Queued for Sync'}
                          </span>
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={assignmentTitleInput}
                        onChange={(e) => setAssignmentTitleInput(e.target.value)}
                        placeholder={`Assignment title (e.g., ${activeGuide.title.slice(0, 28)} Applied Lab)`}
                        className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <textarea
                        rows={3}
                        value={assignmentBodyInput}
                        onChange={(e) => setAssignmentBodyInput(e.target.value)}
                        placeholder="Write your quantitative analysis, proof derivations, or research synthesis..."
                        className="w-full p-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {assignmentSubmittedNotice ? (
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {assignmentSubmittedNotice}
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            Works seamlessly offline and syncs automatically upon reconnect.
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!assignmentBodyInput.trim()) return;
                            const resolvedTitle = assignmentTitleInput.trim() || `${activeGuide.title} Coursework Lab`;
                            onSubmitAssignment(activeGuide.id, activeGuide.title, resolvedTitle, assignmentBodyInput.trim());
                            setAssignmentTitleInput('');
                            setAssignmentBodyInput('');
                            setAssignmentSubmittedNotice(
                              isOnline
                                ? 'Assignment submitted & synchronized to database.'
                                : 'Saved offline — queued for automatic sync when online.'
                            );
                            setTimeout(() => setAssignmentSubmittedNotice(null), 5000);
                          }}
                          disabled={!assignmentBodyInput.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          Submit Assignment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Course Leaderboard (Enrolled Students Only) */}
                <CourseLeaderboardWidget
                  studyGuide={activeGuide}
                  enrollments={enrollments}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  readingProgress={readingProgress}
                  onRequireAuth={onRequireAuth}
                  onEnrollInCourse={onEnrollInCourse}
                />

              </div>

              {/* Reader Footer */}
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                  Self-paced progress auto-saved · {completedCount}/{totalCount} Completed
                </span>
                  <div className="flex items-center gap-2">
                    {activeGuide.quizzes && activeGuide.quizzes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleStartQuiz(activeGuide.quizzes![0])}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Start Knowledge Quiz</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveGuide(null)}
                      className="px-4 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg transition-colors"
                    >
                      Close Reader
                    </button>
                  </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Interactive Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
            onClick={handleCloseQuiz}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-6">
            {!quizResult ? (
              <>
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Interactive Assessment</span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">{activeQuiz.title}</h3>
                  </div>
                  <button onClick={handleCloseQuiz} className="text-stone-400 hover:text-stone-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {activeQuiz.questions.map((q, qIdx) => (
                    <div key={q.id} className={qIdx === currentQuizQuestionIdx ? 'block' : 'hidden'}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-stone-500">Question {qIdx + 1} of {activeQuiz.questions.length}</span>
                        <div className="w-24 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all" 
                            style={{ width: `${((qIdx + 1) / activeQuiz.questions.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">{q.text}</h4>
                      
                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleQuizAnswer(q.id, oIdx)}
                            className={`w-full p-4 text-left text-sm rounded-xl border transition-all flex items-center justify-between group ${
                              quizAnswers[q.id] === oIdx
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200'
                                : 'border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span>{option}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              quizAnswers[q.id] === oIdx 
                                ? 'border-indigo-600 bg-indigo-600' 
                                : 'border-stone-300 dark:border-stone-600 group-hover:border-stone-400'
                            }`}>
                              {quizAnswers[q.id] === oIdx && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-stone-800">
                  <button
                    disabled={currentQuizQuestionIdx === 0}
                    onClick={() => setCurrentQuizQuestionIdx(prev => prev - 1)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  
                  {currentQuizQuestionIdx === activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(quizAnswers).length < activeQuiz.questions.length}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                    >
                      Submit Assessment
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuizQuestionIdx(prev => prev + 1)}
                      className="px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {quizResult.passed ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {quizResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                  </h3>
                  <p className="text-sm text-stone-500 mt-2">
                    You scored <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{quizResult.score}%</span>. 
                    Minimum required: {activeQuiz.minScoreToPass}%.
                  </p>
                </div>

                {quizResult.passed && activeQuiz.badgeId && (() => {
                  const badge = STUDENT_BADGES.find(b => b.id === activeQuiz.badgeId);
                  return (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 animate-bounceIn">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-14 h-14 rounded-xl bg-stone-900 overflow-hidden flex items-center justify-center shadow-sm border border-amber-200 dark:border-amber-800 shrink-0">
                          {badge?.image_url ? (
                            <img
                              src={badge.image_url}
                              alt={`${badge.title} crest`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Star className="w-6 h-6 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">New Badge Unlocked · {badge?.rarity}</span>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{badge?.title}</h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">{badge?.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-6 flex flex-col gap-2">
                  {quizResult.passed && activeGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        const g = activeGuide;
                        handleCloseQuiz();
                        setCertificateGuide(g);
                      }}
                      className="w-full py-3 bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/70 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-[#a3e635]" />
                      <span>Open Attached Course Certificate</span>
                    </button>
                  )}
                  {!quizResult.passed && (
                    <>
                      {quizResult.weakChapters && quizResult.weakChapters.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left space-y-2 mb-1">
                          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                            Recommended Chapters to Review ({quizResult.weakChapters.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {quizResult.weakChapters.map((wc) => (
                              <button
                                key={wc.chapterIdx}
                                type="button"
                                onClick={() => {
                                  handleCloseQuiz();
                                  setHighlightedChapterIdx(wc.chapterIdx);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                              >
                                Ch. {wc.chapterIdx + 1}: {wc.chapterTitle} ({wc.accuracyPct}%)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleStartQuiz(activeQuiz)}
                        className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-bold shadow-lg"
                      >
                        Retry Assessment
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCloseQuiz}
                    className="w-full py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl text-sm font-bold border border-stone-200 dark:border-stone-700"
                  >
                    Return to Curriculum
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive AI Course Generator Modal */}
      {isAiCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-md"
            onClick={() => !isGeneratingAiCourse && setIsAiCourseModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Generate Custom AI Course
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiCourseModalOpen(false)}
                disabled={isGeneratingAiCourse}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Synthesize a brand new institutional study guide across any of the <span className="font-semibold text-stone-800 dark:text-stone-200">{CATALOG_STATS.studyFields} study fields</span>. The Educare engine will generate a structured 3-chapter syllabus, learning outcomes, and technical exercises.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                Course Subject / Research Topic:
              </label>
              <input
                type="text"
                value={aiCourseTopic}
                onChange={(e) => setAiCourseTopic(e.target.value)}
                placeholder="e.g. Test-Time Search Algorithms, Quantum Annealing, Synthetic Biology..."
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />

              {/* Quick Prompt Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                <span className="text-stone-400 dark:text-stone-500 py-0.5">Presets:</span>
                {[
                  'Transformer KV Cache Eviction',
                  'Byzantine Fault Tolerant Swarms',
                  'Sovereign Energy Grid Interconnects',
                  'Cognitive Biometrics & Gamma Synchronization',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAiCourseTopic(preset)}
                    className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiCourseModalOpen(false)}
                disabled={isGeneratingAiCourse}
                className="px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAiCourse(aiCourseTopic)}
                disabled={!aiCourseTopic.trim() || isGeneratingAiCourse}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGeneratingAiCourse ? (
                  <>
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Course...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Course ($0)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Interactive Document Editor Modal */}
      {isEditorOpen && activeDocument && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl"
            onClick={() => setIsEditorOpen(false)}
          />

          <div className="relative w-full max-w-6xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 flex flex-col h-[90vh]">
            {/* Editor Header */}
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70 dark:bg-stone-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={activeDocument.title}
                    onChange={(e) => setActiveDocument({...activeDocument, title: e.target.value})}
                    className="bg-transparent border-none focus:ring-0 text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 p-0 w-56 sm:w-80"
                    placeholder="Document Title"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                    <span>{textQualityAnalysis.stats.wordCount} words</span>
                    <span>·</span>
                    <span>{textQualityAnalysis.stats.readingTimeMinutes} min read</span>
                    <span>·</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{textQualityAnalysis.stats.fleschReadingLevel}</span>
                    <span>·</span>
                    <select 
                      value={activeDocument.format}
                      onChange={(e) => setActiveDocument({...activeDocument, format: e.target.value as any})}
                      className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-bold text-stone-700 dark:text-stone-300 hover:text-purple-600"
                    >
                      <option value="pdf">PDF Doc (.pdf)</option>
                      <option value="word">Word Doc (.docx)</option>
                      <option value="text">Text File (.txt)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Real-time Quality Pill Toggle */}
                <button
                  type="button"
                  onClick={() => setIsQualityPanelOpen(!isQualityPanelOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isQualityPanelOpen
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                  }`}
                  title="Toggle Real-Time Spellcheck & Grammar Engine"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Quality: {textQualityAnalysis.stats.overallQualityScore}%</span>
                  {activeSuggestions.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-mono">
                      {activeSuggestions.length}
                    </span>
                  )}
                </button>

                {/* Service-Side Headless PDF Export Button */}
                <button
                  type="button"
                  onClick={handleExportHeadlessPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                  title="Export current document as a formatted PDF using headless server service"
                >
                  {isExportingPdf ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Export Formatted PDF</span>
                    </>
                  )}
                </button>

                {/* Save Draft */}
                <button 
                  type="button"
                  onClick={() => {
                    handleSaveDocument({
                      ...activeDocument,
                      last_modified: new Date().toISOString().slice(0, 10),
                      word_count: textQualityAnalysis.stats.wordCount,
                    });
                    setIsEditorOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {exportFeedback && (
              <div className={`px-4 py-2 text-xs flex items-center justify-between font-medium border-b ${
                exportFeedback.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}>
                <div className="flex items-center gap-2">
                  {exportFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  <span>{exportFeedback.message}</span>
                </div>
                <button onClick={() => setExportFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editor Workspace Split View */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-stone-900">
              {/* Left Column: Rich Textarea & Format Tools */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-stone-100 dark:border-stone-800">
                {/* Secondary Writing Toolbar */}
                <div className="p-2.5 px-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between text-stone-500 text-xs">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('# ')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded font-bold"
                      title="Insert Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('## ')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded font-bold"
                      title="Insert Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-800 mx-1" />
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('**', '**')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded font-bold"
                      title="Bold"
                    >
                      B
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('*', '*')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded italic font-serif"
                      title="Italic"
                    >
                      I
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('<u>', '</u>')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded underline"
                      title="Underline"
                    >
                      U
                    </button>
                    <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-800 mx-1" />
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('- ')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded"
                      title="Bullet List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleInsertFormatting('> ')}
                      className="p-1.5 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded"
                      title="Blockquote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sample Test Template loader */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const template = `# Institutional Framework for Quantum Cognitive Architecture\nBy ${user.name} · TTG Educare Directorate\n\nIn order to acheive optimal cognitive synthesis, the system must accomodate multiple neural modalities. Due to the fact that past history demonstrates fragmented learning, we must seperate foundational paradigms from ephemeral heuristics.\n\nThere is a large number of students who has the ability to master advanced systems if the enviroment is consistant. We was observing that basic fundamentals must be reinforced untill true fluency is achieved.\n\n> First and foremost, cognitive clarity is the end result of disciplined thought.`;
                        setActiveDocument({
                          ...activeDocument,
                          title: 'Quantum Cognitive Architecture & Framework',
                          content: template,
                          word_count: template.split(/\s+/).filter(Boolean).length,
                        });
                      }}
                      className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
                      title="Load a pre-built academic draft with typos & style examples to test the spellcheck engine"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Load Sample Test Draft</span>
                    </button>
                  </div>
                </div>

                {/* Primary Textarea Editor */}
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                  <textarea
                    ref={editorTextareaRef}
                    value={activeDocument.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setActiveDocument({
                        ...activeDocument,
                        content: newContent,
                        word_count: newContent.split(/\s+/).filter(Boolean).length,
                      });
                    }}
                    placeholder="Begin your institutional deconstruction, research paper, or monograph here... Type freely, our real-time spellcheck and grammar engine will assist in real-time."
                    className="w-full h-full min-h-[360px] bg-transparent border-none focus:ring-0 text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed resize-none font-serif outline-none"
                    spellCheck={false}
                  />
                </div>

                {/* Editor Bottom Bar */}
                <div className="p-3 px-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono">
                  <div className="flex items-center gap-4">
                    <span>{textQualityAnalysis.stats.characterCount} characters</span>
                    <span>{textQualityAnalysis.stats.sentenceCount} sentences</span>
                    <span>Avg {textQualityAnalysis.stats.avgWordsPerSentence} words/sentence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Headless PDF Service Ready</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-Time Spellcheck & Grammar Engine Panel */}
              {isQualityPanelOpen && (
                <div className="w-full md:w-80 lg:w-96 flex flex-col bg-stone-50/60 dark:bg-stone-950/60 border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800 overflow-hidden">
                  {/* Assistant Header */}
                  <div className="p-4 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                          Real-Time Assistant
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold">
                        Client NLP
                      </span>
                    </div>

                    {/* Overall Score Meter */}
                    <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Overall Quality Score</span>
                        <span className={`text-xs font-mono font-bold ${
                          textQualityAnalysis.stats.overallQualityScore >= 90
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : textQualityAnalysis.stats.overallQualityScore >= 75
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {textQualityAnalysis.stats.overallQualityScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 rounded-full ${
                            textQualityAnalysis.stats.overallQualityScore >= 90
                              ? 'bg-emerald-500'
                              : textQualityAnalysis.stats.overallQualityScore >= 75
                              ? 'bg-purple-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${textQualityAnalysis.stats.overallQualityScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 font-mono">
                        <span>Ease: {textQualityAnalysis.stats.fleschScore}/100</span>
                        <span>Grade: {textQualityAnalysis.stats.gradeLevel}</span>
                      </div>
                    </div>

                    {/* Fix All Safe Button */}
                    {activeSuggestions.some(s => s.type === 'spelling' || s.type === 'punctuation' || s.type === 'grammar') && (
                      <button
                        type="button"
                        onClick={handleFixAllSafe}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Fix All Spelling & Punctuation</span>
                      </button>
                    )}

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 text-[10px]">
                      {(['all', 'spelling', 'grammar', 'wordiness', 'style'] as const).map((filterKey) => {
                        const count = filterKey === 'all' 
                          ? textQualityAnalysis.suggestions.length 
                          : textQualityAnalysis.suggestions.filter(s => s.type === filterKey || (filterKey === 'style' && s.type === 'punctuation')).length;
                        return (
                          <button
                            key={filterKey}
                            type="button"
                            onClick={() => setQualityFilter(filterKey)}
                            className={`px-2 py-1 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
                              qualityFilter === filterKey
                                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold'
                                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                            }`}
                          >
                            {filterKey} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeSuggestions.length > 0 ? (
                      activeSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              suggestion.type === 'spelling'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : suggestion.type === 'grammar'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : suggestion.type === 'wordiness'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            }`}>
                              {suggestion.categoryLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDismissSuggestion(suggestion.id)}
                              className="text-stone-400 hover:text-stone-600 text-[10px] font-medium"
                              title="Dismiss suggestion"
                            >
                              Ignore
                            </button>
                          </div>

                          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                            {suggestion.message}
                          </p>

                          {/* Replacement Comparison */}
                          <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl text-xs font-mono">
                            <span className="line-through text-rose-500 opacity-80">{suggestion.originalText}</span>
                            <span className="text-stone-400">→</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{suggestion.suggestedText}</span>
                          </div>

                          {suggestion.explanation && (
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                              {suggestion.explanation}
                            </p>
                          )}

                          {/* Quick Accept Button */}
                          <button
                            type="button"
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="w-full flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all border border-emerald-200 dark:border-emerald-800"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Replace</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                          <CheckCheck className="w-6 h-6" />
                        </div>
                        <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                          Publication Quality Achieved
                        </h5>
                        <p className="text-[11px] text-stone-500">
                          No spelling or grammar errors detected. Text conforms to institutional rhetorical standards.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Certificates Catalog Gallery (All Courses by Category) */}
      <CourseCertificatesGalleryModal
        isOpen={isCertificatesGalleryOpen}
        onClose={() => setIsCertificatesGalleryOpen(false)}
        user={user}
        studyGuides={studyGuides}
        educationCourses={EDUCATION_COURSES}
        readingProgress={readingProgress}
      />

      {/* Individual Study Guide Certificate Viewer */}
      {(() => {
        if (!certificateGuide) return null;
        const cert = getCertificateForStudyGuide(certificateGuide);
        if (!cert) return null;
        const prog = readingProgress[certificateGuide.id];
        const scores = prog?.quizScores
          ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
          : [];
        const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
        const pct = prog?.progressPercent || 0;
        const isEarned = Boolean(prog?.isCompleted || pct >= 100 || (bestScore !== undefined && bestScore >= 70));
        const serialNumber = formatCertificateSerial(cert.credentialCodePrefix, certificateGuide.id, user.id);

        return (
          <CourseCertificateModal
            isOpen={Boolean(certificateGuide)}
            onClose={() => setCertificateGuide(null)}
            certificate={cert}
            courseTitle={certificateGuide.title}
            recipientName={user.name || 'Academic Scholar'}
            serialNumber={serialNumber}
            issueDate={new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            progressPercent={pct}
            quizScore={bestScore}
            isEarned={isEarned}
          />
        );
      })()}

      {/* QCTO Occupational Skills Programme Blueprint Modal */}
      <QctoBlueprintModal
        isOpen={Boolean(blueprintGuide)}
        guide={blueprintGuide}
        allAiGuides={studyGuides.filter(
          (g) => g.category === 'Frontier AI & Systems' || g.is_ai_generated
        )}
        onSelectGuide={(nextGuide) => setBlueprintGuide(nextGuide)}
        onClose={() => setBlueprintGuide(null)}
      />

      {/* Share Course QR Code Modal */}
      <CourseQrShareModal
        guide={qrShareGuide}
        onClose={() => setQrShareGuide(null)}
      />
    </div>
  );
};
