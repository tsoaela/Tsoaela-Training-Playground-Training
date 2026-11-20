import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  UserRole,
  SubscriptionTier, 
  Booking, 
  InvoiceReceipt,
  ReadingProgress,
  ReadingProgressUpdateOptions,
  QuizAttemptEntry,
  Reminder,
  StudyGuide,
  EnrolledStudentRecord,
  PeerReviewEntry,
  CourseModuleFeedback,
  AppNotification,
  OfflineAssignmentSubmission,
  SavedAcademicProgram,
  ThemeMode
} from './types';
import { 
  INITIAL_USER, 
  RETREAT_EVENTS, 
  STUDY_GUIDES, 
  RESEARCH_PAPERS, 
  INITIAL_BOOKINGS, 
  INITIAL_INVOICES,
  INITIAL_READING_PROGRESS,
  INITIAL_REMINDERS
} from './data/mockData';
import { Header, AppNavigationTab } from './components/Header';
import { EducationPlatformHub } from './components/EducationPlatformHub';
import { MusicStoreTab } from './components/MusicStoreTab';
import { PhotographyStoreTab } from './components/PhotographyStoreTab';
import { VideographyStoreTab } from './components/VideographyStoreTab';
import { BookStoreTab } from './components/BookStoreTab';
import { AuthModal } from './components/AuthModal';
import { initGoogleAuth, googleSignOut } from './services/googleAuth';
import { BillingDashboardTab } from './components/BillingDashboardTab';
import { FAQSection } from './components/FAQSection';
import { PaywallModal } from './components/PaywallModal';
import { StripeCheckoutModal, CheckoutMode } from './components/StripeCheckoutModal';
import { StripeCustomerPortalModal } from './components/StripeCustomerPortalModal';
import { ReceiptModal } from './components/ReceiptModal';
import { RemindersModal } from './components/RemindersModal';
import { ReadingProgressExportModal } from './components/ReadingProgressExportModal';
import { AcademicPromptsHubModal } from './components/AcademicPromptsHubModal';
import { AccreditationPortalModal } from './components/AccreditationPortalModal';
import { INITIAL_FACULTY_ENROLLMENTS } from './data/facultyData';
import { UserActivityDashboardTab } from './components/UserActivityDashboardTab';
import { FacultyPortalTab } from './components/FacultyPortalTab';
import { ApplicationRegistrationModal } from './components/ApplicationRegistrationModal';
import { StudyGroupVideoRoomModal } from './components/StudyGroupVideoRoomModal';
import { ProgramComparisonModal } from './components/ProgramComparisonModal';
import {
  StudentFeedbackModal,
  SubmitCourseFeedbackPayload,
} from './components/StudentFeedbackModal';
import { ResearchCornerAiTutorSidebar } from './components/ResearchCornerAiTutorSidebar';
import {
  AcademicCategoryKey,
  AcademicFaculty,
  AcademicQualificationLevel,
  buildSavedAcademicProgram,
} from './data/academicCatalog';
import { useNotifications } from './hooks/useNotifications';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { useRealtimeStudyProgress } from './hooks/useRealtimeStudyProgress';
import { useDeepWorkMode } from './hooks/useDeepWorkMode';
import { useDeepWorkAmbience } from './hooks/useDeepWorkAmbience';
import { useAcceptedStudents } from './hooks/useAcceptedStudents';
import { FACULTY_LECTURE_SERIES } from './data/lecturesAndSyllabuses';
import { CertificateVerificationTab } from './components/CertificateVerificationTab';
import { formatCertificateSerial, getCertificateForStudyGuide } from './data/certificatesData';
import { useOnlineStatus, cacheAllStudyGuidesLocally } from './utils/offlineStorage';
import { AuthorDocument, MusicTrack, MusicLicenseTier, PhotoItem, VideoItem, BookItem, ApplicationCategory, ApplicationPrefillData } from './types';
import { CheckCircle2, ShieldCheck, Award, BookOpen, Video, X } from 'lucide-react';
import { TTG_LOGO_URL } from './utils/pdfBranding';
import { recordPlatformSaleForCreator } from './utils/creatorStoreSystem';

function extractVerifySerialFromLocation(): string | null {
  try {
    const pathMatch = window.location.pathname.match(/^\/verify\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]).trim().toUpperCase();
    }
    const paramSerial = new URLSearchParams(window.location.search).get('verify');
    if (paramSerial && paramSerial.trim()) {
      return paramSerial.trim().toUpperCase();
    }
  } catch {
    // Ignore restricted location access
  }
  return null;
}

export default function App() {
  // Persisted Theme Mode ('system' | 'light' | 'dark') with live OS scheme listener
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('ttg_theme_mode');
      if (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark') {
        return savedMode;
      }
      const legacyTheme = localStorage.getItem('ttg_theme');
      if (legacyTheme === 'dark' || legacyTheme === 'light') {
        return legacyTheme;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (event: MediaQueryListEvent) => {
        setSystemPrefersDark(event.matches);
      };
      setSystemPrefersDark(mediaQuery.matches);
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // Ignore environments without matchMedia
    }
  }, []);

  const theme: 'light' | 'dark' =
    themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  // Sync resolved theme class and persist selected ThemeMode to localStorage
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('ttg_theme_mode', themeMode);
      localStorage.setItem('ttg_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme, themeMode]);

  const handleChangeThemeMode = (nextMode: ThemeMode) => {
    try {
      document.documentElement.classList.add('theme-transitioning');
      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 420);
    } catch {}
    setThemeMode(nextMode);
  };

  const toggleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const nextIdx = (order.indexOf(themeMode) + 1) % order.length;
    handleChangeThemeMode(order[nextIdx]);
  };

  // Load state from localStorage or initial mock data
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ttg_user_profile');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [invoices, setInvoices] = useState<InvoiceReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_invoices');
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const isRemovedSyntheticReasoningCourse = (g: StudyGuide) =>
    /^(ai courses?( \(ai generated\))?)$/i.test((g.category || '').trim()) &&
    g.field === 'Synthetic Reasoning & AI Systems' &&
    g.reading_time === '45 min read';

  const normalizeStudyGuideBranding = (g: StudyGuide): StudyGuide => {
    const normalizedCategory = /^(ai courses?( \(ai generated\))?)$/i.test((g.category || '').trim())
      ? 'Frontier AI & Systems'
      : g.category;
    const rawAccreditor = g.certificate?.accreditor || '';
    const cleanedAccreditor =
      !rawAccreditor || /^(ai course generated)$/i.test(rawAccreditor.trim())
        ? 'TTG Internal Accreditation Board (Accredited Internal)'
        : rawAccreditor;
    const rawCertCategoryKey = g.certificate?.categoryKey || '';
    const cleanedCertCategoryKey = /^(ai courses?( \(ai generated\))?)$/i.test(rawCertCategoryKey.trim())
      ? 'Frontier AI & Systems'
      : rawCertCategoryKey;
    const isLongTerm = g.duration_type === 'long_term';
    const coursePriceZar = isLongTerm ? (g.course_price_zar && g.course_price_zar > 0 ? g.course_price_zar : 145) : 0;
    const normalizedDurationLabel = isLongTerm
      ? 'Self-Paced · Long-Term Course (R145)'
      : 'Self-Paced · Short Course (Free)';

    return {
      ...g,
      category: normalizedCategory,
      is_premium: isLongTerm,
      course_price_zar: coursePriceZar,
      pacing_mode: 'self_paced',
      duration_label: normalizedDurationLabel,
      ...(g.certificate
        ? {
            certificate: {
              ...g.certificate,
              accreditor: cleanedAccreditor,
              ...(cleanedCertCategoryKey ? { categoryKey: cleanedCertCategoryKey } : {}),
            },
          }
        : {}),
    };
  };

  // Dynamic Study Guides State (including Digital Educare Self-Paced Catalog)
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_study_guides');
      if (!saved) return STUDY_GUIDES;
      const parsed: StudyGuide[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return STUDY_GUIDES;
      const normalizedParsed = parsed
        .filter((g) => !isRemovedSyntheticReasoningCourse(g))
        .map(normalizeStudyGuideBranding);
      const existingIds = new Set(normalizedParsed.map((g) => g.id));
      const missingCanonical = STUDY_GUIDES.filter((g) => !existingIds.has(g.id));
      return [...normalizedParsed, ...missingCanonical];
    } catch {
      return STUDY_GUIDES;
    }
  });

  // Individually unlocked Long-Term Tutoring Courses (R145 ZAR per course)
  const [unlockedLongCourseIds, setUnlockedLongCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_unlocked_long_courses');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_unlocked_long_courses', JSON.stringify(unlockedLongCourseIds));
    } catch (e) {
      console.error(e);
    }
  }, [unlockedLongCourseIds]);

  // Reading Progress State (Prompt 5: reading process tracking)
  const [readingProgress, setReadingProgress] = useState<Record<string, ReadingProgress>>(() => {
    try {
      const saved = localStorage.getItem('ttg_reading_progress');
      if (!saved) return INITIAL_READING_PROGRESS;
      const parsed: Record<string, ReadingProgress> = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return INITIAL_READING_PROGRESS;
      const merged: Record<string, ReadingProgress> = { ...parsed };
      Object.entries(INITIAL_READING_PROGRESS).forEach(([guideId, seed]) => {
        const existing = merged[guideId];
        if (!existing) {
          merged[guideId] = seed;
        } else {
          merged[guideId] = {
            ...existing,
            chapterNotes:
              existing.chapterNotes && Object.keys(existing.chapterNotes).length > 0
                ? existing.chapterNotes
                : seed.chapterNotes,
            quizHistory:
              existing.quizHistory && existing.quizHistory.length > 0
                ? existing.quizHistory
                : seed.quizHistory,
            lastAccessedAt: existing.lastAccessedAt || seed.lastAccessedAt,
          };
        }
      });
      return merged;
    } catch {
      return INITIAL_READING_PROGRESS;
    }
  });

  // Reminders State (Prompt 5: reminders)
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_reminders');
      return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  });

  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [reminderTargetTitle, setReminderTargetTitle] = useState('');

  // Active navigation tab (supports direct /verify/:serial entry URLs)
  const [verifySerialTarget, setVerifySerialTarget] = useState<string | null>(() =>
    extractVerifySerialFromLocation()
  );
  const [appealPrefillTarget, setAppealPrefillTarget] = useState<{
    courseId?: string | null;
    courseTitle?: string | null;
    serialNumber?: string | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<AppNavigationTab>(() =>
    extractVerifySerialFromLocation() ? 'verify' : 'education'
  );

  // Selected study course tracking for real-time progress streaming
  const [selectedStudyGuideId, setSelectedStudyGuideId] = useState<string | null>(null);
  const [selectedStudyChapterIdx, setSelectedStudyChapterIdx] = useState<number>(0);

  useEffect(() => {
    const handlePopState = () => {
      const serial = extractVerifySerialFromLocation();
      if (serial) {
        setVerifySerialTarget(serial);
        setActiveTab('verify');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // User Authentication & RBAC Role State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ttg_is_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem('ttg_user_role') as UserRole | null;
      return savedRole || user.role || 'student';
    } catch {
      return 'student';
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authGuardMessage, setAuthGuardMessage] = useState<string | undefined>(undefined);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  // Faculty Student Enrollments State (persisted for Instructor grading, Course Leaderboards & Peer Reviews)
  const [enrollments, setEnrollments] = useState<EnrolledStudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_faculty_enrollments');
      if (!saved) return INITIAL_FACULTY_ENROLLMENTS;
      const parsed: EnrolledStudentRecord[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_FACULTY_ENROLLMENTS;
      const existingIds = new Set(parsed.map(r => r.id));
      const mergedExisting = parsed.map(rec => {
        const seedMatch = INITIAL_FACULTY_ENROLLMENTS.find(s => s.id === rec.id);
        const existingReviews = Array.isArray(rec.peerReviews) ? rec.peerReviews : [];
        const existingReviewIds = new Set(existingReviews.map(r => r.id));
        const missingSeedReviews = (seedMatch?.peerReviews || []).filter(
          sr => !existingReviewIds.has(sr.id)
        );
        return {
          ...rec,
          peerReviews: [...existingReviews, ...missingSeedReviews],
          courseFeedback:
            rec.courseFeedback && rec.courseFeedback.length > 0
              ? rec.courseFeedback
              : (seedMatch?.courseFeedback ?? []),
        };
      });
      const missingSeeds = INITIAL_FACULTY_ENROLLMENTS.filter(s => !existingIds.has(s.id));
      return [...mergedExisting, ...missingSeeds];
    } catch {
      return INITIAL_FACULTY_ENROLLMENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_faculty_enrollments', JSON.stringify(enrollments));
    } catch (e) {
      console.error(e);
    }
  }, [enrollments]);

  const acceptedStudentsHook = useAcceptedStudents();

  // Custom Hook Notification System (graded assignments, new chapters, study groups in registered courses)
  const {
    notifications,
    unreadCount,
    registerCourse,
    notifyAssignmentGraded,
    notifyNewChapterAdded,
    notifyStudyGroupInitiated,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    removePassedNotifications,
    activeAlert,
    dismissActiveAlert,
  } = useNotifications(studyGuides.map(g => g.id));

  const requireAuth = (action: () => void, guardMessage: string) => {
    if (isAuthenticated) {
      action();
    } else {
      setAuthGuardMessage(guardMessage);
      setPendingAuthAction(() => action);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (userProfile: UserProfile) => {
    const resolvedRole: UserRole = userProfile.role || 'student';
    setUser(userProfile);
    setUserRole(resolvedRole);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    try {
      localStorage.setItem('ttg_user_role', resolvedRole);
    } catch {}
    setToastMessage(`Welcome back, ${userProfile.name} (${resolvedRole})!`);
    setTimeout(() => setToastMessage(null), 4000);
    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    }
  };

  // Keep Firebase Google OAuth session synchronized on app load
  useEffect(() => {
    const unsubscribe = initGoogleAuth((googleUser) => {
      setUser((prev) => {
        const emailAddr = googleUser.email || prev.email;
        const displayName =
          googleUser.displayName ||
          prev.name ||
          emailAddr.split('@')[0];
        const next: UserProfile = {
          ...prev,
          id: googleUser.uid,
          name: displayName,
          email: emailAddr,
          photoUrl: googleUser.photoURL || prev.photoUrl,
          authProvider: 'google',
        };
        try {
          localStorage.setItem('ttg_is_authenticated', 'true');
          localStorage.setItem('ttg_user_profile', JSON.stringify(next));
        } catch {}
        return next;
      });
      setIsAuthenticated(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('student');
    setSelectedStudyGuideId(null);
    setSelectedStudyChapterIdx(0);
    void googleSignOut();
    try {
      localStorage.removeItem('ttg_is_authenticated');
      localStorage.removeItem('ttg_user_role');
    } catch {}
    setToastMessage('Signed out. Real-time study sync paused — browsing as Guest.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modals state
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTarget, setPaywallTarget] = useState<string | undefined>(undefined);
  const [paywallRecommendedPlan, setPaywallRecommendedPlan] = useState<'educare_pro' | 'research_pass'>('educare_pro');

  const [isStripeCheckoutOpen, setIsStripeCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutMode | null>(null);

  const [isStripePortalOpen, setIsStripePortalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<InvoiceReceipt | null>(null);

  // Student Reading Progress & Chapter Report Export Modal State
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);

  // University Syllabus & Academic Prompts Studio Modal State
  const [isAcademicPromptsOpen, setIsAcademicPromptsOpen] = useState(false);

  // Student Course Module Feedback Modal State
  const [studentFeedbackModalState, setStudentFeedbackModalState] = useState<{
    isOpen: boolean;
    courseId?: string;
    moduleIndex?: number;
  }>({ isOpen: false });

  // Active Study Guide Context for Persistent TAI Tutor
  const [activeStudyContext, setActiveStudyContext] = useState<{
    courseTitle?: string;
    chapterTitle?: string;
  } | null>(null);

  // Free Institutional Accreditation & Productivity Registration Modal State
  const [isAccreditationPortalOpen, setIsAccreditationPortalOpen] = useState(false);

  // Course & Multi-Category Application Registration Modal State
  const [isApplicationRegistrationOpen, setIsApplicationRegistrationOpen] = useState(false);
  const [applicationInitialCategory, setApplicationInitialCategory] = useState<ApplicationCategory>('course_educare');
  const [applicationPrefill, setApplicationPrefill] = useState<ApplicationPrefillData | null>(null);

  // Study Group Live Video Room State
  const [activeStudyRoom, setActiveStudyRoom] = useState<{
    courseTitle: string;
    courseId: string;
    roomId?: string;
  } | null>(null);

  // Network and Offline Storage Status (Service Worker & Cache API Strategy)
  const { isOnline } = useOnlineStatus();

  // Offline-Completed Assignment Submissions (persisted locally & auto-synced when online)
  const [offlineAssignments, setOfflineAssignments] = useState<OfflineAssignmentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_offline_assignments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_offline_assignments', JSON.stringify(offlineAssignments));
    } catch (e) {
      console.error(e);
    }
  }, [offlineAssignments]);

  // Background Synchronization Service: pushes locally cached study progress & offline assignments to /api/sync
  const {
    pendingCount: pendingSyncCount,
    unsyncedNotesCount,
    syncStatus,
    lastSyncedAt,
    queueStudyProgress,
    queueAssignmentSubmission,
    triggerManualSync,
  } = useBackgroundSync(isOnline, user.id, (result) => {
    setOfflineAssignments(prev =>
      prev.map(item =>
        item.syncedToDatabase
          ? item
          : {
              ...item,
              syncedToDatabase: true,
              syncedAt: result.serverTimestamp || new Date().toISOString(),
            }
      )
    );
    if (result.syncedCount > 0) {
      setToastMessage(
        `Background sync complete: ${result.syncedCount} cached record${result.syncedCount > 1 ? 's' : ''} pushed to database.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  });

  // Cache all critical study guides locally on initial load for offline resilience
  useEffect(() => {
    cacheAllStudyGuidesLocally(studyGuides);
  }, [studyGuides]);

  // Auto-persist earned completion certificates to the server Verification Ledger
  const issuedLedgerKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    studyGuides.forEach((guide) => {
      const prog = readingProgress[guide.id];
      if (!prog) return;
      const scores = prog.quizScores
        ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
        : [];
      const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
      const pct = prog.progressPercent || 0;
      const passThreshold = guide.quizzes?.[0]?.minScoreToPass ?? 70;
      const isEarned = Boolean(
        prog.isCompleted || pct >= 100 || (bestScore !== undefined && bestScore >= passThreshold)
      );
      if (!isEarned || guide.is_accredited === false) return;

      const certSpec = getCertificateForStudyGuide(guide);
      if (!certSpec) return;
      const serial = formatCertificateSerial(certSpec.credentialCodePrefix, guide.id, user.id);
      const dedupeKey = `${serial}:${pct}:${bestScore ?? ''}:${user.name}`;
      if (issuedLedgerKeysRef.current.has(dedupeKey)) return;
      issuedLedgerKeysRef.current.add(dedupeKey);

      fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: serial,
          courseId: guide.id,
          courseTitle: guide.title,
          categoryKey: certSpec.categoryKey,
          credentialTitle: certSpec.credentialTitle,
          accreditor: certSpec.accreditor,
          accreditationTier: certSpec.accreditationTier,
          isAccredited: true,
          recipientName: user.name || 'Academic Scholar',
          recipientEmail: user.email || 'scholar@ttg-platform.local',
          userId: user.id || 'user_88219',
          issueDate: prog.lastReadDate || new Date().toISOString().slice(0, 10),
          progressPercent: pct,
          quizScore: bestScore,
        }),
      }).catch(() => {
        issuedLedgerKeysRef.current.delete(dedupeKey);
      });
    });
  }, [readingProgress, studyGuides, user.id, user.name, user.email]);

  const handleSelectedStudyGuideChange = useCallback(
    (guideId: string | null, chapterIdx?: number) => {
      setSelectedStudyGuideId(guideId);
      if (typeof chapterIdx === 'number') {
        setSelectedStudyChapterIdx(chapterIdx);
      } else if (!guideId) {
        setSelectedStudyChapterIdx(0);
      }
    },
    []
  );

  const handleTickRealtimeStudySeconds = useCallback(
    (courseId: string, deltaSeconds: number, chapterIdx?: number) => {
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.slice(0, 10);
      setReadingProgress((prev) => {
        const existing = prev[courseId] || {
          guideId: courseId,
          completedChapters: [],
          progressPercent: 0,
          lastReadDate: todayDate,
          lastAccessedAt: nowIso,
          isCompleted: false,
          studyTimeSeconds: 0,
        };
        return {
          ...prev,
          [courseId]: {
            ...existing,
            studyTimeSeconds: (existing.studyTimeSeconds || 0) + deltaSeconds,
            activeChapterIdx:
              typeof chapterIdx === 'number' ? chapterIdx : existing.activeChapterIdx,
            lastAccessedAt: nowIso,
            lastReadDate: todayDate,
          },
        };
      });
    },
    []
  );

  const handleHydrateServerReadingProgress = useCallback(
    (serverProgress: Record<string, ReadingProgress>) => {
      setReadingProgress((prev) => {
        const merged = { ...prev };
        Object.entries(serverProgress).forEach(([guideId, remote]) => {
          const local = merged[guideId];
          if (!local) {
            merged[guideId] = remote;
          } else {
            const chapterSet = new Set([
              ...(local.completedChapters || []),
              ...(remote.completedChapters || []),
            ]);
            merged[guideId] = {
              ...remote,
              ...local,
              completedChapters: Array.from(chapterSet).sort((a, b) => a - b),
              progressPercent: Math.max(local.progressPercent || 0, remote.progressPercent || 0),
              studyTimeSeconds: Math.max(local.studyTimeSeconds || 0, remote.studyTimeSeconds || 0),
              isCompleted: Boolean(local.isCompleted || remote.isCompleted),
            };
          }
        });
        return merged;
      });
    },
    []
  );

  const selectedStudyGuideObj = studyGuides.find((g) => g.id === selectedStudyGuideId) || null;
  const activeSelectedProgress = selectedStudyGuideId
    ? readingProgress[selectedStudyGuideId]
    : undefined;

  // Real-Time Study Progress: activates strictly when logged in AND a course is selected
  const { telemetry: realtimeStudyTelemetry } = useRealtimeStudyProgress({
    isAuthenticated,
    userId: user.id || 'user_88219',
    selectedCourseId: selectedStudyGuideId,
    selectedCourseTitle: selectedStudyGuideObj?.title || null,
    activeChapterIdx: selectedStudyChapterIdx,
    currentProgressPercent: activeSelectedProgress?.progressPercent || 0,
    baseCourseStudySeconds: activeSelectedProgress?.studyTimeSeconds || 0,
    onTickStudySeconds: handleTickRealtimeStudySeconds,
    onHydrateServerProgress: handleHydrateServerReadingProgress,
  });

  const handleOpenVerifySerial = (serial?: string) => {
    const clean = serial?.trim().toUpperCase() || null;
    if (clean) {
      setVerifySerialTarget(clean);
      try {
        window.history.replaceState({}, '', `/verify/${encodeURIComponent(clean)}`);
      } catch {}
    } else {
      setVerifySerialTarget(null);
    }
    setActiveTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAppealForCourse = (serial: string, courseId: string, courseTitle: string) => {
    setVerifySerialTarget(serial);
    setAppealPrefillTarget({ serialNumber: serial, courseId, courseTitle });
    setActiveTab('verify');
    window.setTimeout(() => {
      document
        .getElementById('learner-appeals-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Pending Document to load into Document Editor
  const [pendingEditorDocument, setPendingEditorDocument] = useState<Partial<AuthorDocument> | null>(null);

  // Global toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent Pomodoro Study Session Timer synchronized with User Profile learning stats
  const pomodoro = usePomodoroTimer(
    studyGuides[0]?.id || 'general',
    (guideId) => studyGuides.find((g) => g.id === guideId)?.title,
    (minutes, guideTitle) => {
      setToastMessage(
        `Synced +${minutes}m Pomodoro focus session (${guideTitle || 'Study'}) to your Learning Dashboard.`
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  );

  // Deep Work Mode Timer, Distraction Shield & Focus Intensity Score
  const deepWork = useDeepWorkMode({
    studyGuides,
    readingProgress,
    syncedFocusMinutes: pomodoro.syncedFocusMinutes,
    completedPomodoroSessions: pomodoro.completedSessions,
    pomodoroLogs: pomodoro.sessionLogs,
    onCompleteSession: (minutes, guideId, guideTitle) => {
      pomodoro.recordExternalFocusSession(minutes, guideId, guideTitle);
    },
  });

  // Deep Work Ambience Soundboard (auto-pauses when study session ends)
  const deepWorkAmbience = useDeepWorkAmbience({
    isDeepWorkActive: deepWork.state.isActive,
    isDeepWorkPaused: deepWork.state.isPaused,
    pomodoroPhase: pomodoro.phase,
    isPomodoroRunning: pomodoro.isRunning,
    onAutoPause: (reason) => {
      setToastMessage(reason);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const blockedAlertIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (deepWork.state.isActive && activeAlert && !blockedAlertIdsRef.current.has(activeAlert.id)) {
      blockedAlertIdsRef.current.add(activeAlert.id);
      deepWork.incrementBlockedDistractions(1);
      dismissActiveAlert();
    }
  }, [deepWork.state.isActive, activeAlert, deepWork.incrementBlockedDistractions, dismissActiveAlert]);

  // Saved Academic Programs (Bookmarked Qualifications) & Side-by-Side Comparison (up to 3)
  const [savedPrograms, setSavedPrograms] = useState<SavedAcademicProgram[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_saved_programs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [comparedQualificationIds, setComparedQualificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_compared_programs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch {
      return [];
    }
  });

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [requestedAcademicCategory, setRequestedAcademicCategory] = useState<'all' | AcademicCategoryKey | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_saved_programs', JSON.stringify(savedPrograms));
    } catch (e) {
      console.error(e);
    }
  }, [savedPrograms]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_compared_programs', JSON.stringify(comparedQualificationIds));
    } catch (e) {
      console.error(e);
    }
  }, [comparedQualificationIds]);

  const savedProgramIds = savedPrograms.map((p) => p.qualificationId);

  const handleToggleSaveProgram = (qual: AcademicQualificationLevel, faculty?: AcademicFaculty) => {
    const exists = savedPrograms.some((p) => p.qualificationId === qual.id);
    if (exists) {
      setSavedPrograms((prev) => prev.filter((p) => p.qualificationId !== qual.id));
      triggerToast(`Removed "${qual.qualificationType}" from My Saved Programs.`);
    } else {
      const entry = buildSavedAcademicProgram(qual, faculty);
      setSavedPrograms((prev) => [entry, ...prev]);
      triggerToast(`Bookmarked "${qual.qualificationType}" to My Saved Programs.`);
    }
  };

  const handleRemoveSavedProgram = (qualificationId: string) => {
    const target = savedPrograms.find((p) => p.qualificationId === qualificationId);
    setSavedPrograms((prev) => prev.filter((p) => p.qualificationId !== qualificationId));
    if (target) {
      triggerToast(`Removed "${target.qualificationType}" from My Saved Programs.`);
    }
  };

  const handleToggleCompareProgram = (qualificationId: string) => {
    setComparedQualificationIds((prev) => {
      if (prev.includes(qualificationId)) {
        return prev.filter((id) => id !== qualificationId);
      }
      if (prev.length >= 3) {
        triggerToast('You can compare up to 3 programs at a time. Remove one first.');
        return prev;
      }
      return [...prev, qualificationId];
    });
  };

  const handleBrowseQualifications = (category?: AcademicCategoryKey) => {
    setRequestedAcademicCategory(category || 'all');
    setActiveTab('education');
  };

  const handleOpenSavedProgramsProfile = () => {
    setActiveTab('activity');
    window.setTimeout(() => {
      document
        .getElementById('my-saved-programs-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
  };

  const refreshActiveCoursesAndCleanPassed = (showToast = true) => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Refresh study guides from canonical catalog while keeping valid AI-generated courses
    const canonicalMap = new Map(STUDY_GUIDES.map((g) => [g.id, g]));
    const refreshedGuides: StudyGuide[] = [
      ...STUDY_GUIDES,
      ...studyGuides.filter(
        (g) =>
          g.is_ai_generated &&
          !canonicalMap.has(g.id) &&
          !isRemovedSyntheticReasoningCourse(g)
      ),
    ];
    setStudyGuides(refreshedGuides);
    cacheAllStudyGuidesLocally(refreshedGuides);

    // 2. Clean passed quiz/course activities while retaining unlocked achievement badges and active progress
    const cleanedProgress: Record<string, ReadingProgress> = {};
    refreshedGuides.forEach((guide) => {
      const prevProg = readingProgress[guide.id];
      const totalChapters = Math.max(1, guide.chapters.length);
      const minPassScore = guide.quizzes?.[0]?.minScoreToPass || 70;

      if (!prevProg) {
        return;
      }

      const filteredQuizScores: Record<string, number> = {};
      if (prevProg.quizScores) {
        Object.entries(prevProg.quizScores).forEach(([quizId, score]) => {
          const matchingQuiz = guide.quizzes?.find((q) => q.id === quizId);
          const threshold = matchingQuiz?.minScoreToPass || minPassScore;
          if (typeof score === 'number' && score < threshold) {
            filteredQuizScores[quizId] = score;
          }
        });
      }

      const wasCompleted = prevProg.isCompleted || prevProg.progressPercent >= 100;
      const activeChapters = wasCompleted
        ? []
        : (prevProg.completedChapters || []).filter((idx) => idx >= 0 && idx < totalChapters);
      const recalculatedPercent = wasCompleted
        ? 0
        : Math.round((activeChapters.length / totalChapters) * 100);

      cleanedProgress[guide.id] = {
        ...prevProg,
        completedChapters: activeChapters,
        progressPercent: recalculatedPercent,
        isCompleted: false,
        lastReadDate: prevProg.lastReadDate || todayStr,
        quizScores: filteredQuizScores,
        quizHistory: (prevProg.quizHistory || []).filter((attempt) => !attempt.passed),
        completionLog: wasCompleted ? [] : prevProg.completionLog || [],
      };
    });
    setReadingProgress(cleanedProgress);

    // 3. Refresh active enrollments and clear passed scores on the active user's records
    setEnrollments((prev) =>
      prev.map((rec) => {
        const isCurrentUser =
          rec.studentEmail.toLowerCase() === user.email.toLowerCase() ||
          rec.studentName.toLowerCase() === user.name.toLowerCase();
        const refreshedPct = cleanedProgress[rec.courseId]?.progressPercent ?? rec.progressPercent;
        if (!isCurrentUser) {
          return {
            ...rec,
            progressPercent: refreshedPct < 100 ? refreshedPct : 45,
          };
        }
        return {
          ...rec,
          progressPercent: recalculatedSafePct(refreshedPct),
          testScore: rec.testScore !== undefined && rec.testScore >= 70 ? undefined : rec.testScore,
          assignmentScore:
            rec.assignmentScore !== undefined && rec.assignmentScore >= 70
              ? undefined
              : rec.assignmentScore,
          assignmentStatus:
            rec.assignmentStatus === 'Graded' && (rec.assignmentScore ?? 0) >= 70
              ? 'Not Submitted'
              : rec.assignmentStatus,
        };
      })
    );

    // 4. Remove expired one-time reminders & passed notifications/session logs
    setReminders((prev) =>
      prev.filter((r) => !(r.frequency === 'Once' && r.date < todayStr))
    );
    removePassedNotifications();
    pomodoro.clearCompletedSessionLogs();

    if (showToast) {
      triggerToast('Active user courses refreshed and passed activities removed.');
    }
  };

  function recalculatedSafePct(pct: number): number {
    return Number.isFinite(pct) && pct >= 0 && pct < 100 ? pct : 0;
  }

  // One-time startup refresh so stale passed activities & removed courses in localStorage are cleaned automatically
  useEffect(() => {
    try {
      const migrated = localStorage.getItem('ttg_courses_refreshed_v1');
      if (!migrated) {
        refreshActiveCoursesAndCleanPassed(false);
        localStorage.setItem('ttg_courses_refreshed_v1', 'true');
      }
      const purgedSynthetic = localStorage.getItem('ttg_removed_synthetic_reasoning_v1');
      if (!purgedSynthetic) {
        const activeIds = new Set(studyGuides.map((g) => g.id));
        setReadingProgress((prev) => {
          const next: Record<string, ReadingProgress> = {};
          Object.entries(prev).forEach(([id, entry]) => {
            if (activeIds.has(id) || !id.startsWith('sg_ai_custom_')) {
              next[id] = entry;
            }
          });
          return next;
        });
        setEnrollments((prev) =>
          prev.filter((rec) => activeIds.has(rec.courseId) || !rec.courseId.startsWith('sg_ai_custom_'))
        );
        localStorage.setItem('ttg_removed_synthetic_reasoning_v1', 'true');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    const previousEmail = user.email;
    const previousName = user.name;
    setUser((prev) => ({
      ...prev,
      ...updates,
    }));
    if (updates.name || updates.email) {
      setEnrollments((prev) =>
        prev.map((rec) =>
          rec.studentEmail.toLowerCase() === previousEmail.toLowerCase() ||
          rec.studentName.toLowerCase() === previousName.toLowerCase()
            ? {
                ...rec,
                studentName: updates.name || rec.studentName,
                studentEmail: updates.email || rec.studentEmail,
              }
            : rec
        )
      );
    }
    setToastMessage('User profile updated and saved.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenApplicationRegistration = (
    category: ApplicationCategory = 'course_educare',
    prefill: ApplicationPrefillData | null = null
  ) => {
    setApplicationInitialCategory(category);
    setApplicationPrefill(prefill);
    setIsApplicationRegistrationOpen(true);
  };

  const handleInsertIntoEditor = (doc: Partial<AuthorDocument>) => {
    setActiveTab('education');
    setPendingEditorDocument(doc);
    setIsAcademicPromptsOpen(false);
    setToastMessage(`Draft "${doc.title}" loaded into Authoring Studio`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAccreditationSuccess = (registrationId: string) => {
    setToastMessage(`Internal QA self-audit recorded! Ref: ${registrationId}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Quick navigation targets from Global Search or shared QR course deep-link (?course=<id>)
  const [targetStudyGuideId, setTargetStudyGuideId] = useState<string | null>(() => {
    try {
      const courseParam = new URLSearchParams(window.location.search).get('course');
      return courseParam && courseParam.trim() ? courseParam.trim() : null;
    } catch {
      return null;
    }
  });
  const [targetResearchPaperId, setTargetResearchPaperId] = useState<string | null>(null);
  const [targetRetreatEventId, setTargetRetreatEventId] = useState<string | null>(null);

  const handleNavigateToItem = (type: 'study_guide' | 'retreat' | 'research', itemId: string) => {
    setActiveTab('education');
    if (type === 'study_guide') {
      setTargetStudyGuideId(itemId);
    } else if (type === 'research') {
      setTargetResearchPaperId(itemId);
    } else if (type === 'retreat') {
      setTargetRetreatEventId(itemId);
    }
  };

  // Store Purchase Handlers with Auth Guards & Instant Receipt Tokens
  const handlePurchaseTrack = (
    track: MusicTrack,
    licenseTier: MusicLicenseTier = 'Personal Master',
    priceOverride?: number,
    onCompleted?: (invoiceNumber: string, finalAmount: number) => void
  ) => {
    const finalPrice = typeof priceOverride === 'number' ? priceOverride : track.price;
    requireAuth(() => {
      const invoiceNumber = `INV-AUD-${Math.floor(1000 + Math.random() * 9000)}`;
      const saleOutcome = recordPlatformSaleForCreator({
        platform: 'music',
        creatorName: track.artist,
        creatorId: track.artistId,
        grossAmount: finalPrice,
      });
      const feeNote = saleOutcome.split?.isPostThresholdFeeActive
        ? ` · Includes 5% Site Service Fee ($${saleOutcome.split.siteOwnerServiceFee.toFixed(2)})`
        : '';
      const newInvoice: InvoiceReceipt = {
        id: `inv_music_${Date.now()}`,
        invoice_number: invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        description: `Music License (${licenseTier}): ${track.title} by ${track.artist}${feeNote}`,
        amount: finalPrice,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_track_${Date.now()}`,
        items: [{ description: `${track.title} · ${track.format} (${licenseTier})`, quantity: 1, unit_price: finalPrice }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      onCompleted?.(invoiceNumber, finalPrice);
      setToastMessage(`Purchased "${track.title}" (${licenseTier} · $${finalPrice.toFixed(2)})!${feeNote} High-res WAV & license certificate unlocked.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase and download "${track.title}" by ${track.artist}.`);
  };

  const handlePurchaseMusicCart = (
    cartEntries: { track: MusicTrack; licenseTier: MusicLicenseTier; unitPrice: number }[],
    onCompleted?: (invoiceNumber: string) => void
  ) => {
    if (cartEntries.length === 0) return;
    const totalAmount = Number(cartEntries.reduce((sum, e) => sum + e.unitPrice, 0).toFixed(2));
    requireAuth(() => {
      const invoiceNumber = `INV-AUD-${Math.floor(1000 + Math.random() * 9000)}`;
      let totalSiteFees = 0;
      cartEntries.forEach((entry) => {
        const res = recordPlatformSaleForCreator({
          platform: 'music',
          creatorName: entry.track.artist,
          creatorId: entry.track.artistId,
          grossAmount: entry.unitPrice,
        });
        if (res.split?.isPostThresholdFeeActive) {
          totalSiteFees += res.split.siteOwnerServiceFee;
        }
      });
      const feeNote = totalSiteFees > 0 ? ` · 5% Site Service Fee paid ($${totalSiteFees.toFixed(2)})` : '';
      const newInvoice: InvoiceReceipt = {
        id: `inv_music_cart_${Date.now()}`,
        invoice_number: invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        description: `Music Store Order (${cartEntries.length} ${cartEntries.length === 1 ? 'release' : 'releases'})${feeNote}`,
        amount: totalAmount,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_music_bag_${Date.now()}`,
        items: cartEntries.map(e => ({
          description: `${e.track.title} (${e.track.artist}) · ${e.licenseTier}`,
          quantity: 1,
          unit_price: e.unitPrice,
        }))
      };
      setInvoices(prev => [newInvoice, ...prev]);
      onCompleted?.(invoiceNumber);
      setToastMessage(`Order ${invoiceNumber} complete ($${totalAmount.toFixed(2)})!${feeNote} All ${cartEntries.length} WAV masters unlocked.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to complete checkout for ${cartEntries.length} studio music releases.`);
  };

  const handlePurchasePhoto = (photo: PhotoItem, licenseType: 'Personal' | 'Commercial' | 'Extended') => {
    requireAuth(() => {
      const price = licenseType === 'Personal' ? photo.pricePersonal : licenseType === 'Commercial' ? photo.priceCommercial : photo.priceExtended;
      const saleOutcome = recordPlatformSaleForCreator({
        platform: 'photography',
        creatorName: photo.photographer,
        creatorId: photo.photographerId,
        grossAmount: price,
      });
      const feeNote = saleOutcome.split?.isPostThresholdFeeActive
        ? ` · Includes 5% Site Service Fee ($${saleOutcome.split.siteOwnerServiceFee.toFixed(2)})`
        : '';
      const newInvoice: InvoiceReceipt = {
        id: `inv_photo_${Date.now()}`,
        invoice_number: `INV-PHO-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${licenseType} Photo License: ${photo.title}${feeNote}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_photo_${Date.now()}`,
        items: [{ description: `${photo.title} (${photo.megapixels}MP RAW + TIFF) · ${licenseType} License`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${licenseType} License for "${photo.title}" ($${price.toFixed(2)})!${feeNote} High-res RAW downloaded.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase the ${licenseType} license for "${photo.title}".`);
  };

  const handlePurchaseVideo = (video: VideoItem, licenseType: 'Standard' | 'Broadcast') => {
    requireAuth(() => {
      const price = licenseType === 'Standard' ? video.priceStandard : video.priceBroadcast;
      const saleOutcome = recordPlatformSaleForCreator({
        platform: 'videography',
        creatorName: video.creator,
        creatorId: video.creatorId,
        grossAmount: price,
      });
      const feeNote = saleOutcome.split?.isPostThresholdFeeActive
        ? ` · Includes 5% Site Service Fee ($${saleOutcome.split.siteOwnerServiceFee.toFixed(2)})`
        : '';
      const newInvoice: InvoiceReceipt = {
        id: `inv_video_${Date.now()}`,
        invoice_number: `INV-VID-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${licenseType} Video License: ${video.title}${feeNote}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_video_${Date.now()}`,
        items: [{ description: `${video.title} (${video.resolution} ${video.codec}) · ${licenseType} License`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${licenseType} License for "${video.title}" ($${price.toFixed(2)})!${feeNote} Master ProRes token granted.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase the ${licenseType} license for "${video.title}".`);
  };

  const handlePurchaseBook = (book: BookItem, format: 'eBook' | 'Print' | 'Audiobook') => {
    requireAuth(() => {
      const price = format === 'eBook' ? book.priceEbook : format === 'Print' ? book.pricePrint : (book.priceAudiobook || 14.99);
      const saleOutcome = recordPlatformSaleForCreator({
        platform: 'bookstore',
        creatorName: book.author,
        creatorId: book.authorId,
        grossAmount: price,
      });
      const feeNote = saleOutcome.split?.isPostThresholdFeeActive
        ? ` · Includes 5% Site Service Fee ($${saleOutcome.split.siteOwnerServiceFee.toFixed(2)})`
        : '';
      const newInvoice: InvoiceReceipt = {
        id: `inv_book_${Date.now()}`,
        invoice_number: `INV-BOK-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${format} of "${book.title}" by ${book.author}${feeNote}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_book_${Date.now()}`,
        items: [{ description: `"${book.title}" · ${format} Edition (ISBN: ${book.isbn})`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${format} of "${book.title}" ($${price.toFixed(2)})!${feeNote} Complete manuscript unlocked.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase "${book.title}".`);
  };

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ttg_user_profile', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_bookings', JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.error(e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_study_guides', JSON.stringify(studyGuides));
    } catch (e) {
      console.error(e);
    }
  }, [studyGuides]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_reading_progress', JSON.stringify(readingProgress));
    } catch (e) {
      console.error(e);
    }
  }, [readingProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('ttg_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.error(e);
    }
  }, [reminders]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddStudyGuide = (newGuide: StudyGuide) => {
    const normalizedGuide = normalizeStudyGuideBranding(newGuide);
    setStudyGuides(prev => [normalizedGuide, ...prev]);
    registerCourse(normalizedGuide.id);
    triggerToast(`✨ New Course Added: "${normalizedGuide.title}" is now available in your curriculum!`);
  };

  const handleRemoveStudyGuide = (guideId: string) => {
    const target = studyGuides.find((g) => g.id === guideId);
    setStudyGuides((prev) => prev.filter((g) => g.id !== guideId));
    setReadingProgress((prev) => {
      if (!(guideId in prev)) return prev;
      const next = { ...prev };
      delete next[guideId];
      return next;
    });
    setEnrollments((prev) => prev.filter((rec) => rec.courseId !== guideId));
    if (target) {
      triggerToast(`Removed course "${target.title}".`);
    }
  };

  // Faculty Portal Syllabus Update & Grading Handlers
  const handleUpdateStudyGuide = (updatedGuide: StudyGuide) => {
    setStudyGuides(prev => prev.map(g => (g.id === updatedGuide.id ? updatedGuide : g)));
  };

  const handleNewChapterAdded = (courseId: string, courseTitle: string, chapterTitle: string) => {
    notifyNewChapterAdded({ courseId, courseTitle, chapterTitle, force: true });
  };

  const handleGradeAssignment = (enrollmentId: string, score: number, feedback: string) => {
    const target = enrollments.find(e => e.id === enrollmentId);
    setEnrollments(prev =>
      prev.map(rec =>
        rec.id === enrollmentId
          ? {
              ...rec,
              assignmentStatus: 'Graded',
              assignmentScore: score,
              testScore: rec.testScore ?? score,
              instructorFeedback: feedback || rec.instructorFeedback,
            }
          : rec
      )
    );
    if (target) {
      notifyAssignmentGraded({
        courseId: target.courseId,
        courseTitle: target.courseTitle,
        assignmentTitle: target.assignmentTitle,
        score,
        feedback,
        studentName: target.studentName,
        force: true,
      });
    }
  };

  const handleAddPeerReview = (
    enrollmentId: string,
    reviewInput: Omit<PeerReviewEntry, 'id' | 'createdAt'>
  ) => {
    const newEntry: PeerReviewEntry = {
      id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...reviewInput,
      createdAt: new Date().toISOString(),
    };

    const updatedEnrollments = enrollments.map(rec =>
      rec.id === enrollmentId
        ? {
            ...rec,
            peerReviews: [newEntry, ...(rec.peerReviews || [])],
          }
        : rec
    );
    setEnrollments(updatedEnrollments);

    // Check Community Mentor badge criteria (> 10 constructive peer reviews authored in Faculty Portal)
    const reviewerEmail = (reviewInput.reviewerEmail || user.email).trim().toLowerCase();
    const reviewerName = (reviewInput.reviewerName || user.name).trim().toLowerCase();
    let totalConstructiveReviews = 0;

    updatedEnrollments.forEach(rec => {
      (rec.peerReviews || []).forEach(review => {
        if (!(review.critique || '').trim()) return;
        const emailMatch = reviewerEmail && (review.reviewerEmail || '').trim().toLowerCase() === reviewerEmail;
        const nameMatch = reviewerName && (review.reviewerName || '').trim().toLowerCase() === reviewerName;
        if (emailMatch || nameMatch) {
          totalConstructiveReviews += 1;
        }
      });
    });

    if (totalConstructiveReviews > 10) {
      const targetGuideId =
        updatedEnrollments.find(rec => rec.id === enrollmentId)?.courseId ||
        studyGuides[0]?.id ||
        'sg_foundations_systems';
      const alreadyHasMentorBadge = Object.values(readingProgress).some(p =>
        (p.unlockedBadges || []).includes('badge_community_mentor')
      );
      if (!alreadyHasMentorBadge) {
        const existingProg = readingProgress[targetGuideId] || {
          guideId: targetGuideId,
          completedChapters: [],
          progressPercent: 0,
          lastReadDate: new Date().toISOString().slice(0, 10),
          isCompleted: false,
          notes: '',
          quizScores: {},
          unlockedBadges: [],
          completionLog: [],
        };
        const updatedProgress: ReadingProgress = {
          ...existingProg,
          lastReadDate: new Date().toISOString().slice(0, 10),
          unlockedBadges: [...(existingProg.unlockedBadges || []), 'badge_community_mentor'],
        };
        setReadingProgress(prev => ({
          ...prev,
          [targetGuideId]: updatedProgress,
        }));
        queueStudyProgress(targetGuideId, updatedProgress);
        triggerToast(
          `Community Mentor badge unlocked! (${totalConstructiveReviews} constructive peer reviews submitted)`
        );
      }
    }
  };

  const handleEnrollInCourse = (guide: StudyGuide) => {
    requireAuth(() => {
      registerCourse(guide.id);
      setEnrollments(prev => {
        const alreadyEnrolled = prev.some(
          e =>
            e.courseId === guide.id &&
            (e.studentEmail.toLowerCase() === user.email.toLowerCase() ||
              e.studentName.toLowerCase() === user.name.toLowerCase())
        );
        if (alreadyEnrolled) return prev;
        const scoresObj = readingProgress[guide.id]?.quizScores;
        const scoreVals = scoresObj
          ? Object.values(scoresObj).filter((v): v is number => typeof v === 'number')
          : [];
        const bestQuizScore = scoreVals.length > 0 ? Math.max(...scoreVals) : undefined;
        const newRecord: EnrolledStudentRecord = {
          id: `enr_${guide.id}_${Date.now()}`,
          studentName: user.name,
          studentEmail: user.email,
          courseId: guide.id,
          courseTitle: guide.title,
          facultyName: guide.field || guide.category,
          qualificationLevel: 'Enrolled TTG Scholar',
          enrolledDate: new Date().toISOString().slice(0, 10),
          progressPercent: readingProgress[guide.id]?.progressPercent || 0,
          testScore: bestQuizScore,
          assignmentTitle: `${guide.title} Applied Assessment`,
          assignmentStatus: 'Not Submitted',
          peerReviews: [],
        };
        return [newRecord, ...prev];
      });
      const matchedLecture = FACULTY_LECTURE_SERIES.find(
        (l) => l.linkedGuideId === guide.id
      );
      void acceptedStudentsHook.addStudent({
        studentName: user.name,
        studentEmail: user.email,
        admissionStatus: 'Accepted & Registered',
        facultyId:
          matchedLecture?.facultyKey === 'Business'
            ? 'business_commerce_law'
            : 'eng_tech_built',
        facultyName: guide.field || guide.category,
        departmentName: matchedLecture?.departmentName || guide.category,
        programName: guide.title,
        qualificationLevel:
          matchedLecture?.nqfLevel || 'Enrolled TTG Scholar',
        assignedCourseId: guide.id,
        assignedCourseTitle: matchedLecture?.title || guide.title,
        leadLecturerName: matchedLecture?.lecturerName || 'TTG Faculty Chair',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: new Date().toISOString().slice(0, 10),
        registeredDate: new Date().toISOString().slice(0, 10),
        accreditor: guide.accreditor_name || 'Free Productivity Accreditation Council (FPAC)',
      });
      triggerToast(`Enrolled in "${guide.title}"! Course Leaderboard & Registration unlocked.`);
    }, `Sign in to enroll in "${guide.title}" and access its Top 5 Course Leaderboard.`);
  };

  const handleNotificationNavigate = (notif: AppNotification) => {
    if (notif.type === 'study_group_started') {
      requireAuth(() => {
        setActiveStudyRoom({ courseTitle: notif.courseTitle, courseId: notif.courseId });
      }, 'Sign in or register to join live study group video rooms.');
      return;
    }
    setTargetStudyGuideId(notif.courseId);
    setActiveTab('educare');
  };

  const handleSubmitCourseAssignment = (
    courseId: string,
    courseTitle: string,
    assignmentTitle: string,
    content: string
  ) => {
    const newSubmission: OfflineAssignmentSubmission = {
      id: `assign_${Date.now()}`,
      userId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      courseId,
      courseTitle,
      assignmentTitle,
      content,
      completedOffline: !navigator.onLine,
      submittedAt: new Date().toISOString(),
      syncedToDatabase: false,
    };

    setOfflineAssignments(prev => [newSubmission, ...prev]);

    setEnrollments(prev => {
      const existingIdx = prev.findIndex(
        e => e.courseId === courseId && e.studentEmail.toLowerCase() === user.email.toLowerCase()
      );
      if (existingIdx >= 0) {
        return prev.map((rec, i) =>
          i === existingIdx
            ? {
                ...rec,
                assignmentTitle,
                assignmentStatus: 'Pending Grading',
              }
            : rec
        );
      }
      return [
        {
          id: `enr_${Date.now()}`,
          studentName: user.name,
          studentEmail: user.email,
          courseId,
          courseTitle,
          facultyName: 'Tsoaela Institutional Curriculum',
          qualificationLevel: 'Enrolled Learner',
          enrolledDate: new Date().toISOString().slice(0, 10),
          progressPercent: readingProgress[courseId]?.progressPercent || 25,
          assignmentTitle,
          assignmentStatus: 'Pending Grading',
        },
        ...prev,
      ];
    });

    queueAssignmentSubmission(newSubmission);
  };

  const handleOpenStudentFeedback = (courseId?: string, moduleIndex?: number) => {
    setStudentFeedbackModalState({
      isOpen: true,
      courseId,
      moduleIndex: moduleIndex ?? 0,
    });
  };

  const handleSubmitCourseFeedback = (payload: SubmitCourseFeedbackPayload) => {
    const newFeedback: CourseModuleFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentName: user.name,
      studentEmail: user.email,
      courseId: payload.courseId,
      courseTitle: payload.courseTitle,
      moduleIndex: payload.moduleIndex,
      moduleTitle: payload.moduleTitle,
      difficultyRating: payload.difficultyRating,
      clarityRating: payload.clarityRating,
      focusArea: payload.focusArea,
      comment: payload.comment,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const matchedGuide = studyGuides.find(g => g.id === payload.courseId);

    setEnrollments(prev => {
      const userEmailLower = user.email.trim().toLowerCase();
      const userNameLower = user.name.trim().toLowerCase();
      const existingIdx = prev.findIndex(
        e =>
          e.courseId === payload.courseId &&
          ((userEmailLower && e.studentEmail.toLowerCase() === userEmailLower) ||
            (userNameLower && e.studentName.toLowerCase() === userNameLower))
      );

      if (existingIdx >= 0) {
        return prev.map((rec, i) =>
          i === existingIdx
            ? {
                ...rec,
                courseFeedback: [newFeedback, ...(rec.courseFeedback || [])],
              }
            : rec
        );
      }

      const newRecord: EnrolledStudentRecord = {
        id: `enr_${payload.courseId}_${Date.now()}`,
        studentName: user.name,
        studentEmail: user.email,
        courseId: payload.courseId,
        courseTitle: payload.courseTitle,
        facultyName: matchedGuide?.field || matchedGuide?.category || 'Tsoaela Institutional Curriculum',
        qualificationLevel: 'Enrolled TTG Scholar',
        enrolledDate: new Date().toISOString().slice(0, 10),
        progressPercent: readingProgress[payload.courseId]?.progressPercent || 0,
        assignmentTitle: `${payload.courseTitle} Applied Assessment`,
        assignmentStatus: 'Not Submitted',
        peerReviews: [],
        courseFeedback: [newFeedback],
      };
      return [newRecord, ...prev];
    });

    triggerToast(`Module feedback saved for "${payload.moduleTitle}" and sent to Faculty Review.`);
  };

  // Reading Progress Handler
  const handleUpdateReadingProgress = (
    guideId: string,
    chapterIdx: number,
    totalChapters: number,
    notes?: string,
    quizScore?: number,
    badgeId?: string,
    options?: ReadingProgressUpdateOptions
  ) => {
    registerCourse(guideId);
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.slice(0, 10);

    const current = readingProgress[guideId] || {
      guideId,
      completedChapters: [],
      progressPercent: 0,
      lastReadDate: todayDate,
      lastAccessedAt: nowIso,
      isCompleted: false,
      notes: '',
      chapterNotes: {},
      quizScores: {},
      quizHistory: [],
      unlockedBadges: [],
      completionLog: [],
    };

    let newCompleted = [...current.completedChapters];
    let newCompletionLog = [...(current.completionLog || [])];
    const existingChapterNotes = { ...(current.chapterNotes || {}) };

    if (options?.chapterNote) {
      const targetIdx = options.chapterNote.chapterIdx;
      const trimmedOrRaw = options.chapterNote.notes;
      existingChapterNotes[targetIdx] = trimmedOrRaw;
      newCompletionLog = newCompletionLog.map((entry) =>
        entry.chapterIdx === targetIdx ? { ...entry, notes: trimmedOrRaw } : entry
      );
    }

    if (chapterIdx >= 0) {
      if (newCompleted.includes(chapterIdx)) {
        newCompleted = newCompleted.filter(idx => idx !== chapterIdx);
        newCompletionLog = newCompletionLog.filter(entry => entry.chapterIdx !== chapterIdx);
      } else {
        newCompleted.push(chapterIdx);
        newCompletionLog.push({
          chapterIdx,
          completedAt: nowIso,
          ...(existingChapterNotes[chapterIdx] ? { notes: existingChapterNotes[chapterIdx] } : {}),
        });
      }
    }

    const safeTotal = Math.max(1, totalChapters);
    const progressPercent = Math.round((newCompleted.length / safeTotal) * 100);
    const isCompleted = progressPercent >= 100;

    // Handle quiz results & full attempt history timeline
    const newQuizScores = { ...(current.quizScores || {}) };
    const newQuizHistory: QuizAttemptEntry[] = [...(current.quizHistory || [])];
    const submittedAttempt = options?.quizAttempt;
    const effectiveScore = submittedAttempt ? submittedAttempt.score : quizScore;

    if (submittedAttempt) {
      const attemptEntry: QuizAttemptEntry = {
        id: `qa_${guideId}_${Date.now()}`,
        quizId: submittedAttempt.quizId,
        quizTitle: submittedAttempt.quizTitle,
        score: submittedAttempt.score,
        minScoreToPass: submittedAttempt.minScoreToPass,
        passed: submittedAttempt.passed,
        correctCount: submittedAttempt.correctCount,
        totalQuestions: submittedAttempt.totalQuestions,
        attemptedAt: nowIso,
        ...(submittedAttempt.weakChapterIndices
          ? { weakChapterIndices: submittedAttempt.weakChapterIndices }
          : {}),
        ...(submittedAttempt.chapterBreakdown
          ? { chapterBreakdown: submittedAttempt.chapterBreakdown }
          : {}),
      };
      newQuizHistory.push(attemptEntry);
      newQuizScores[submittedAttempt.quizId] = submittedAttempt.score;
    } else if (quizScore !== undefined) {
      newQuizScores['default'] = quizScore;
    }

    // Handle badges (only unlock if no quizAttempt failed)
    const newBadges = [...(current.unlockedBadges || [])];
    const canUnlockBadge = !submittedAttempt || submittedAttempt.passed;
    if (badgeId && canUnlockBadge && !newBadges.includes(badgeId)) {
      newBadges.push(badgeId);
    }

    const updatedProgress: ReadingProgress = {
      guideId,
      completedChapters: newCompleted.sort((a, b) => a - b),
      progressPercent,
      lastReadDate: todayDate,
      lastAccessedAt: nowIso,
      isCompleted: chapterIdx >= 0 ? isCompleted : isCompleted || current.isCompleted,
      studyTimeSeconds: current.studyTimeSeconds || 0,
      activeChapterIdx:
        typeof options?.activeChapterIdx === 'number'
          ? options.activeChapterIdx
          : current.activeChapterIdx,
      notes: notes !== undefined ? notes : current.notes,
      chapterNotes: existingChapterNotes,
      quizScores: newQuizScores,
      quizHistory: newQuizHistory,
      unlockedBadges: newBadges,
      completionLog: newCompletionLog,
    };

    setReadingProgress(prev => ({
      ...prev,
      [guideId]: updatedProgress,
    }));

    // Enqueue updated progress for immediate or offline-deferred database synchronization
    queueStudyProgress(guideId, updatedProgress, options?.chapterNote?.chapterIdx);

    if (effectiveScore !== undefined) {
      setEnrollments(prev =>
        prev.map(rec =>
          rec.courseId === guideId &&
          (rec.studentEmail.toLowerCase() === user.email.toLowerCase() ||
            rec.studentName.toLowerCase() === user.name.toLowerCase())
            ? {
                ...rec,
                progressPercent: Math.max(rec.progressPercent, progressPercent),
                testScore: Math.max(rec.testScore ?? 0, effectiveScore),
              }
            : rec
        )
      );
      const matchedGuide = studyGuides.find(g => g.id === guideId);
      const minPass = submittedAttempt?.minScoreToPass ?? 70;
      notifyAssignmentGraded({
        courseId: guideId,
        courseTitle: matchedGuide?.title || 'Course Module',
        assignmentTitle: submittedAttempt?.quizTitle || 'Module Assessment & Quiz',
        score: effectiveScore,
        feedback:
          effectiveScore >= minPass
            ? 'Passing threshold achieved.'
            : 'Attempt logged to Quiz History — review modules and retry.',
        force: true,
      });
    }
  };

  // Reminders Handlers
  const handleAddReminder = (newReminderData: Omit<Reminder, 'id'>) => {
    const newRem: Reminder = {
      id: `rem_${Date.now()}`,
      ...newReminderData,
    };
    setReminders(prev => [newRem, ...prev]);
    triggerToast(`⏰ Reminder set: "${newRem.title}"`);
  };

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    triggerToast('Reminder removed.');
  };

  const handleOpenReminders = (targetTitle?: string) => {
    setReminderTargetTitle(targetTitle || '');
    setIsRemindersOpen(true);
  };

  // Trigger Paywall Modal (Prompt 1)
  const handleOpenPaywall = (targetFeature?: string, recommended?: 'educare_pro' | 'research_pass') => {
    setPaywallTarget(targetFeature);
    if (recommended) {
      setPaywallRecommendedPlan(recommended);
    }
    setIsPaywallOpen(true);
  };

  // From Paywall: User clicked "Upgrade Now" to trigger Stripe Checkout session (Prompt 1)
  const handleTriggerStripeCheckout = (plan: 'educare_pro' | 'research_pass' | 'all_access') => {
    setIsPaywallOpen(false);
    setCheckoutData({
      type: 'subscription',
      plan,
      billingCycle: 'monthly',
    });
    setIsStripeCheckoutOpen(true);
  };

  // From TTG Retreats: User clicked "Book Seat" to process one-time Stripe checkout (Prompt 2)
  const handleInitiateBookingCheckout = (mode: CheckoutMode) => {
    setCheckoutData(mode);
    setIsStripeCheckoutOpen(true);
  };

  // Subscription Checkout Success Handler (Prompt 1)
  const handleSubscriptionSuccess = (
    newPlan: SubscriptionTier, 
    billingCycle: 'monthly' | 'annual', 
    receipt: InvoiceReceipt
  ) => {
    setUser(prev => ({
      ...prev,
      subscription_tier: newPlan,
      plan_status: 'Active',
      billing_interval: billingCycle,
      renewal_date: '2026-12-07',
    }));

    setInvoices(prev => [receipt, ...prev]);
    triggerToast(`Tutoring access activated! Short-term courses are open for free self-paced learning.`);
  };

  // Long-Term Tutoring Course Unlock Success Handler (R145 ZAR per course)
  const handleCoursePurchaseSuccess = (guide: StudyGuide, receipt: InvoiceReceipt) => {
    setUnlockedLongCourseIds((prev) => (prev.includes(guide.id) ? prev : [...prev, guide.id]));
    setInvoices((prev) => [receipt, ...prev]);
    registerCourse(guide.id);
    setEnrollments((prev) => {
      const alreadyEnrolled = prev.some(
        (e) =>
          e.courseId === guide.id &&
          (e.studentEmail.toLowerCase() === user.email.toLowerCase() ||
            e.studentName.toLowerCase() === user.name.toLowerCase())
      );
      if (alreadyEnrolled) return prev;
      const newRecord: EnrolledStudentRecord = {
        id: `enr_${guide.id}_${Date.now()}`,
        studentName: user.name,
        studentEmail: user.email,
        courseId: guide.id,
        courseTitle: guide.title,
        facultyName: guide.field || guide.category,
        qualificationLevel: 'Self-Paced Tutoring Learner',
        enrolledDate: new Date().toISOString().slice(0, 10),
        progressPercent: readingProgress[guide.id]?.progressPercent || 0,
        assignmentTitle: `${guide.title} Applied Assessment`,
        assignmentStatus: 'Not Submitted',
        peerReviews: [],
      };
      return [newRecord, ...prev];
    });
    const priceZar = guide.course_price_zar || 145;
    triggerToast(`Unlocked "${guide.title}" (R${priceZar.toFixed(2)})! Self-paced lessons are now open — finish at your own pace.`);
  };

  // Retreat Booking Checkout Success Handler (Prompt 2)
  const handleBookingSuccess = (newBooking: Booking, receipt: InvoiceReceipt) => {
    // Prompt 2: "Upon success, add an entry to the Bookings table and set payment_status to 'Paid'."
    setBookings(prev => [newBooking, ...prev]);
    setInvoices(prev => [receipt, ...prev]);
    triggerToast(`🎟️ Seat reserved! Added to Bookings table with payment_status 'Paid' (Ref: ${newBooking.id})`);
  };

  // Stripe Customer Portal Plan/Status Updates (Prompt 3)
  const handleCustomerPortalUpdateSubscription = (newTier: SubscriptionTier, status: 'Active' | 'Canceled') => {
    setUser(prev => ({
      ...prev,
      subscription_tier: newTier,
      plan_status: newTier === 'free' ? 'None' : status,
    }));
  };

  const handleCustomerPortalUpdatePayment = (last4: string, brand: string) => {
    setUser(prev => ({
      ...prev,
      payment_method: {
        ...prev.payment_method,
        last4,
        brand,
      },
    }));
  };

  // Quick Persona / Tier simulation switcher
  const handleSimulateTierChange = (tier: SubscriptionTier) => {
    setUser(prev => ({
      ...prev,
      subscription_tier: tier,
      plan_status: tier === 'free' ? 'None' : 'Active',
    }));
    triggerToast(`Account tier switched to: ${tier.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Live Course Alert Banner (from useNotifications hook, suppressed during Deep Work) */}
      <AnimatePresence>
        {!deepWork.state.isActive && activeAlert && (
          <motion.div
            key={activeAlert.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-5 sm:left-5 z-50 max-w-sm bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800/80 rounded-2xl shadow-2xl p-4 flex items-start gap-3"
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              activeAlert.type === 'assignment_graded'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : activeAlert.type === 'chapter_added'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
            }`}>
              {activeAlert.type === 'assignment_graded' && <Award className="w-4 h-4" />}
              {activeAlert.type === 'chapter_added' && <BookOpen className="w-4 h-4" />}
              {activeAlert.type === 'study_group_started' && <Video className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Course Alert
                </span>
                <button
                  type="button"
                  onClick={dismissActiveAlert}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                {activeAlert.title}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-snug line-clamp-2">
                {activeAlert.message}
              </p>
              <button
                type="button"
                onClick={() => {
                  markAsRead(activeAlert.id);
                  handleNotificationNavigate(activeAlert);
                  dismissActiveAlert();
                }}
                className="mt-2 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Open Course & View →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-5 sm:right-5 sm:max-w-md z-50 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 sm:px-5 py-3 rounded-xl shadow-xl border border-stone-800 dark:border-stone-200 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-stone-400 dark:text-stone-600 hover:text-white dark:hover:text-stone-900 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Navigation (Top Bar Contract Compliant with Global Search & Export) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        userRole={userRole}
        onOpenPaywall={() => handleOpenPaywall()}
        theme={theme}
        themeMode={themeMode}
        onChangeThemeMode={handleChangeThemeMode}
        onToggleTheme={toggleTheme}
        onOpenReminders={() => handleOpenReminders()}
        activeRemindersCount={reminders.filter(r => r.isEnabled).length}
        studyGuides={studyGuides}
        retreatEvents={RETREAT_EVENTS}
        researchPapers={RESEARCH_PAPERS}
        readingProgress={readingProgress}
        onNavigateToItem={handleNavigateToItem}
        onOpenExportReport={() => setIsExportReportModalOpen(true)}
        onOpenAcademicPrompts={() => setIsAcademicPromptsOpen(true)}
        onOpenAccreditation={() => setIsAccreditationPortalOpen(true)}
        onOpenApplicationRegistration={() => handleOpenApplicationRegistration('course_educare')}
        isAuthenticated={isAuthenticated}
        onOpenAuthModal={(mode) => {
          setAuthGuardMessage(undefined);
          setPendingAuthAction(null);
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        isOnline={isOnline}
        notifications={notifications}
        unreadNotificationCount={unreadCount}
        onMarkNotificationRead={markAsRead}
        onMarkAllNotificationsRead={markAllAsRead}
        onDismissNotification={dismissNotification}
        onClearNotifications={clearAll}
        onNotificationNavigate={handleNotificationNavigate}
        pendingSyncCount={pendingSyncCount}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerManualSync={triggerManualSync}
        isDeepWorkActive={deepWork.state.isActive}
        deepWorkRemainingSeconds={deepWork.state.remainingSeconds}
        onExitDeepWork={deepWork.endDeepWorkEarly}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-16">
        {(activeTab === 'education' || activeTab === 'educare' || activeTab === 'research' || activeTab === 'digital_world' || activeTab === 'careers' || activeTab === 'retreats') && (
          <EducationPlatformHub
            user={user}
            studyGuides={studyGuides}
            researchPapers={RESEARCH_PAPERS}
            retreatEvents={RETREAT_EVENTS}
            bookings={bookings}
            invoices={invoices}
            readingProgress={readingProgress}
            initialSubTab={
              activeTab === 'research' ? 'research' :
              activeTab === 'digital_world' ? 'digital_world' :
              activeTab === 'careers' ? 'careers' :
              activeTab === 'retreats' ? 'retreats' : 'educare'
            }
            onUpdateReadingProgress={handleUpdateReadingProgress}
            onOpenReminders={handleOpenReminders}
            onTriggerPaywall={handleOpenPaywall}
            onAddStudyGuide={handleAddStudyGuide}
            onRemoveStudyGuide={handleRemoveStudyGuide}
            onInitiateBookingCheckout={handleInitiateBookingCheckout}
            onViewReceipt={(invId) => {
              const found = invoices.find(i => i.id === invId || i.invoice_number === invId);
              if (found) setViewingReceipt(found);
            }}
            targetStudyGuideId={targetStudyGuideId}
            targetResearchPaperId={targetResearchPaperId}
            targetRetreatEventId={targetRetreatEventId}
            onClearTargetGuide={() => setTargetStudyGuideId(null)}
            onClearTargetPaper={() => setTargetResearchPaperId(null)}
            onClearTargetEvent={() => setTargetRetreatEventId(null)}
            onOpenExportReport={() => setIsExportReportModalOpen(true)}
            onOpenAcademicPrompts={() => setIsAcademicPromptsOpen(true)}
            onOpenAccreditation={() => setIsAccreditationPortalOpen(true)}
            onApplyQualification={(prefill) =>
              handleOpenApplicationRegistration(prefill.category || 'course_educare', prefill)
            }
            pendingEditorDocument={pendingEditorDocument}
            onClearPendingDocument={() => setPendingEditorDocument(null)}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onStartStudyRoom={(title, id, roomId) => {
              requireAuth(() => {
                setActiveStudyRoom({ courseTitle: title, courseId: id, roomId });
                notifyStudyGroupInitiated({
                  courseId: id,
                  courseTitle: title,
                  hostName: user.name,
                });
              }, 'Sign in or register to join live study group video rooms.');
            }}
            onSubmitAssignment={handleSubmitCourseAssignment}
            offlineAssignments={offlineAssignments}
            enrollments={enrollments}
            onEnrollInCourse={handleEnrollInCourse}
            pomodoro={pomodoro}
            onOpenActivityDashboard={() => setActiveTab('activity')}
            savedProgramIds={savedProgramIds}
            onToggleSaveProgram={handleToggleSaveProgram}
            comparedProgramIds={comparedQualificationIds}
            onToggleCompareProgram={handleToggleCompareProgram}
            onClearComparedPrograms={() => setComparedQualificationIds([])}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onOpenSavedProgramsProfile={handleOpenSavedProgramsProfile}
            requestedAcademicCategory={requestedAcademicCategory}
            onClearRequestedAcademicCategory={() => setRequestedAcademicCategory(null)}
            onOpenStudentFeedback={handleOpenStudentFeedback}
            onActiveStudyContextChange={setActiveStudyContext}
            unlockedLongCourseIds={unlockedLongCourseIds}
            onUnlockLongCourse={(guide) =>
              handleInitiateBookingCheckout({
                type: 'course',
                guide,
                priceZar: guide.course_price_zar || 145,
              })
            }
            realtimeStudy={realtimeStudyTelemetry}
            onSelectedGuideChange={handleSelectedStudyGuideChange}
            onOpenVerificationPortal={handleOpenVerifySerial}
            onOpenAuthModal={() => {
              setAuthGuardMessage('Sign in to activate real-time study streaming and persistent server progress.');
              setPendingAuthAction(null);
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            acceptedStudents={acceptedStudentsHook.students}
            isLoadingAcceptedStudents={acceptedStudentsHook.isLoading}
            onAddAcceptedStudent={acceptedStudentsHook.addStudent}
            onUpdateAcceptedStudentStatus={acceptedStudentsHook.updateStudentStatus}
            deepWork={{
              state: deepWork.state,
              focusIntensity: deepWork.focusIntensity,
            }}
          />
        )}

        {activeTab === 'music_store' && (
          <MusicStoreTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onPurchaseTrack={handlePurchaseTrack}
            onPurchaseMusicCart={handlePurchaseMusicCart}
          />
        )}

        {activeTab === 'photography_store' && (
          <PhotographyStoreTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onPurchasePhoto={handlePurchasePhoto}
          />
        )}

        {activeTab === 'videography_store' && (
          <VideographyStoreTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onPurchaseVideo={handlePurchaseVideo}
          />
        )}

        {activeTab === 'book_store' && (
          <BookStoreTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onPurchaseBook={handlePurchaseBook}
          />
        )}

        {activeTab === 'activity' && (
          <UserActivityDashboardTab
            user={user}
            readingProgress={readingProgress}
            studyGuides={studyGuides}
            enrollments={enrollments}
            onNavigateToCourse={(guideId) => {
              setTargetStudyGuideId(guideId);
              setActiveTab('educare');
            }}
            onStartStudyRoom={(title, id, roomId) => {
              requireAuth(() => {
                setActiveStudyRoom({ courseTitle: title, courseId: id, roomId });
                notifyStudyGroupInitiated({
                  courseId: id,
                  courseTitle: title,
                  hostName: user.name,
                });
              }, 'Sign in or register to join live study group video rooms.');
            }}
            onOpenFacultyPortal={() => setActiveTab('faculty_portal')}
            syncedFocusMinutes={pomodoro.syncedFocusMinutes}
            completedPomodoroSessions={pomodoro.completedSessions}
            pomodoroLogs={pomodoro.sessionLogs}
            onUpdateProfile={handleUpdateProfile}
            savedPrograms={savedPrograms}
            comparedProgramIds={comparedQualificationIds}
            onRemoveSavedProgram={handleRemoveSavedProgram}
            onBrowseQualifications={handleBrowseQualifications}
            onApplyQualification={(prefill) =>
              handleOpenApplicationRegistration(prefill.category || 'course_educare', prefill)
            }
            onToggleCompareProgram={handleToggleCompareProgram}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onRefreshActiveCourses={() => refreshActiveCoursesAndCleanPassed(true)}
            onRemovePassedActivities={() => refreshActiveCoursesAndCleanPassed(true)}
            onOpenStudentFeedback={handleOpenStudentFeedback}
            realtimeStudy={realtimeStudyTelemetry}
            isAuthenticated={isAuthenticated}
            onOpenAuthModal={() => {
              setAuthGuardMessage('Sign in to stream real-time study hours to your dashboard.');
              setPendingAuthAction(null);
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onVerifySerial={(serial) => handleOpenVerifySerial(serial)}
            onAppealSerial={handleOpenAppealForCourse}
            deepWork={{
              state: deepWork.state,
              focusIntensity: deepWork.focusIntensity,
              onToggleDeepWork: deepWork.toggleDeepWork,
              onStartDeepWork: deepWork.startDeepWork,
              onPauseResume: deepWork.pauseResumeDeepWork,
              onCompleteSession: deepWork.completeDeepWorkSession,
              onEndEarly: deepWork.endDeepWorkEarly,
              onSelectPlannedMinutes: deepWork.setPlannedMinutes,
              onSelectLinkedGuide: deepWork.setLinkedGuideId,
            }}
            pomodoroLive={{
              phase: pomodoro.phase,
              isRunning: pomodoro.isRunning,
              remainingSeconds: pomodoro.remainingSeconds,
              totalPhaseSeconds: pomodoro.totalPhaseSeconds,
              onStartPause: pomodoro.startPause,
            }}
            deepWorkAmbience={deepWorkAmbience}
          />
        )}

        {activeTab === 'faculty_portal' && (
          <FacultyPortalTab
            user={user}
            userRole={userRole}
            isAuthenticated={isAuthenticated}
            studyGuides={studyGuides}
            enrollments={enrollments}
            onOpenAuthModal={() => {
              setAuthGuardMessage('Sign in or switch to an Instructor account to unlock the Faculty Portal.');
              setPendingAuthAction(null);
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onUpdateStudyGuide={handleUpdateStudyGuide}
            onNewChapterAdded={handleNewChapterAdded}
            onGradeAssignment={handleGradeAssignment}
            onAddPeerReview={handleAddPeerReview}
            onVerifySerial={(serial) => handleOpenVerifySerial(serial)}
            acceptedStudents={acceptedStudentsHook.students}
            isLoadingAcceptedStudents={acceptedStudentsHook.isLoading}
            onAddAcceptedStudent={acceptedStudentsHook.addStudent}
            onUpdateAcceptedStudentStatus={acceptedStudentsHook.updateStudentStatus}
          />
        )}

        {activeTab === 'verify' && (
          <CertificateVerificationTab
            user={user}
            isAuthenticated={isAuthenticated}
            studyGuides={studyGuides}
            initialSerial={verifySerialTarget}
            initialAppealCourseId={appealPrefillTarget?.courseId}
            initialAppealCourseTitle={appealPrefillTarget?.courseTitle}
            onClearInitialSerial={() => setVerifySerialTarget(null)}
            onRequireAuth={requireAuth}
            onOpenAccreditationModal={() => setIsAccreditationPortalOpen(true)}
          />
        )}

        {activeTab === 'billing' && (
          <BillingDashboardTab
            user={user}
            invoices={invoices}
            readingProgress={readingProgress}
            studyGuides={studyGuides}
            enrollments={enrollments}
            onNavigateToCourse={(guideId) => {
              setTargetStudyGuideId(guideId);
              setActiveTab('educare');
            }}
            onOpenFacultyPortal={() => setActiveTab('faculty_portal')}
            onOpenStripePortal={() => setIsStripePortalOpen(true)}
            onOpenPaywall={() => handleOpenPaywall()}
            onViewReceipt={(inv) => setViewingReceipt(inv)}
            onSimulateTierChange={handleSimulateTierChange}
            onOpenReminders={() => handleOpenReminders()}
            onOpenFAQ={() => setActiveTab('faq')}
            onUpdateProfile={handleUpdateProfile}
            syncedFocusMinutes={pomodoro.syncedFocusMinutes}
            completedPomodoroSessions={pomodoro.completedSessions}
            savedPrograms={savedPrograms}
            comparedProgramIds={comparedQualificationIds}
            onRemoveSavedProgram={handleRemoveSavedProgram}
            onBrowseQualifications={handleBrowseQualifications}
            onApplyQualification={(prefill) =>
              handleOpenApplicationRegistration(prefill.category || 'course_educare', prefill)
            }
            onToggleCompareProgram={handleToggleCompareProgram}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
          />
        )}

        {activeTab === 'faq' && (
          <FAQSection
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenPaywall={() => handleOpenPaywall()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 text-stone-500 dark:text-stone-400 text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={TTG_LOGO_URL}
              alt="Tsoaela Training Ground Platform Logo"
              referrerPolicy="no-referrer"
              className="h-9 w-auto rounded-lg object-contain bg-white px-1 py-0.5 ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
            />
            <span className="font-bold text-stone-900 dark:text-stone-100">TTG</span>
            <span>·</span>
            <span>TTG - Tsoaela Training Ground Platform</span>
            <span>·</span>
            <span>All Rights Reserved 2026</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
              Stripe Infrastructure Connected
            </span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('digital_world')}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Digital World
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('billing')}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Billing & Subscriptions
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('faq')}
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              FAQ
            </button>
          </div>
        </div>
      </footer>

      {/* Paywall Modal (Prompt 1) */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onTriggerStripeCheckout={handleTriggerStripeCheckout}
        targetFeature={paywallTarget}
        recommendedPlan={paywallRecommendedPlan}
      />

      {/* Stripe Checkout Modal (Long-Term Course Unlocks R145 & Retreat Bookings) */}
      <StripeCheckoutModal
        isOpen={isStripeCheckoutOpen}
        checkoutData={checkoutData}
        onClose={() => {
          setIsStripeCheckoutOpen(false);
          setCheckoutData(null);
        }}
        onSuccessSubscription={handleSubscriptionSuccess}
        onSuccessBooking={handleBookingSuccess}
        onSuccessCourseUnlock={handleCoursePurchaseSuccess}
      />

      {/* Stripe Customer Portal Modal (Prompt 3) */}
      <StripeCustomerPortalModal
        isOpen={isStripePortalOpen}
        onClose={() => setIsStripePortalOpen(false)}
        user={user}
        invoices={invoices}
        onUpdateSubscription={handleCustomerPortalUpdateSubscription}
        onUpdatePaymentMethod={handleCustomerPortalUpdatePayment}
      />

      {/* Receipt & Invoice Modal (Prompt 3 & Prompt 5) */}
      <ReceiptModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />

      {/* Reminders Modal (Prompt 5) */}
      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
        initialTargetTitle={reminderTargetTitle}
      />

      {/* Student Reading Progress & Completed Chapters Transcript Export Modal */}
      <ReadingProgressExportModal
        isOpen={isExportReportModalOpen}
        onClose={() => setIsExportReportModalOpen(false)}
        user={user}
        studyGuides={studyGuides}
        readingProgress={readingProgress}
        isOnline={isOnline}
        unsyncedNotesCount={unsyncedNotesCount}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onTriggerSync={() => void triggerManualSync()}
      />

      {/* University Syllabus & Academic Prompt Studio Modal */}
      <AcademicPromptsHubModal
        isOpen={isAcademicPromptsOpen}
        onClose={() => setIsAcademicPromptsOpen(false)}
        user={user}
        onInsertIntoEditor={handleInsertIntoEditor}
      />

      {/* Free Institutional Accreditation & Tai-One W3C Certification Portal */}
      <AccreditationPortalModal
        isOpen={isAccreditationPortalOpen}
        onClose={() => setIsAccreditationPortalOpen(false)}
        user={user}
        studyGuides={studyGuides}
        onAccreditationSuccess={handleAccreditationSuccess}
        onOpenVerificationPortal={() => handleOpenVerifySerial()}
      />

      {/* Course & Multi-Category Application & Registration Modal */}
      <ApplicationRegistrationModal
        isOpen={isApplicationRegistrationOpen}
        onClose={() => {
          setIsApplicationRegistrationOpen(false);
          setApplicationPrefill(null);
        }}
        user={user}
        initialCategory={applicationInitialCategory}
        initialPrefill={applicationPrefill}
        onRegistrationComplete={(reg) => {
          void acceptedStudentsHook.addStudent({
            registrationNumber: reg.registrationNumber,
            studentName: reg.applicantName,
            studentEmail: reg.applicantEmail,
            admissionStatus:
              reg.status === 'Under Institutional Review'
                ? 'Accepted'
                : 'Accepted & Registered',
            facultyId: applicationPrefill?.facultyId || 'eng_tech_built',
            facultyName:
              reg.categoryTitle || 'Engineering, Technology & Built Environment',
            departmentName: reg.category,
            programName:
              applicationPrefill?.programName || reg.trackType,
            qualificationLevel: reg.qualificationLevel,
            assignedCourseId: FACULTY_LECTURE_SERIES[0]?.id,
            assignedCourseTitle: FACULTY_LECTURE_SERIES[0]?.title,
            leadLecturerName: FACULTY_LECTURE_SERIES[0]?.lecturerName,
            cohortTerm: '2026 Academic Cohort',
            acceptedDate: new Date().toISOString().slice(0, 10),
            registeredDate: new Date().toISOString().slice(0, 10),
            accreditor: reg.accreditor,
            standingNotes: reg.statementOfIntent,
          });
          setToastMessage(`Enrolled! Registration ID: ${reg.registrationNumber}`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Study Group Live Video & Real-Time Shared Notes Room Modal */}
      {activeStudyRoom && (
        <StudyGroupVideoRoomModal
          isOpen={!!activeStudyRoom}
          onClose={() => setActiveStudyRoom(null)}
          courseTitle={activeStudyRoom.courseTitle}
          courseId={activeStudyRoom.courseId}
          roomId={activeStudyRoom.roomId}
          user={user}
        />
      )}

      {/* User Registration & Authentication Modal (Sign In / Register Guard) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authModalMode}
        guardMessage={authGuardMessage}
      />

      {/* Side-by-Side Academic Program Comparison Modal (up to 3 programs) */}
      <ProgramComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedQualificationIds={comparedQualificationIds}
        savedProgramIds={savedProgramIds}
        onRemoveFromCompare={(qualId) =>
          setComparedQualificationIds((prev) => prev.filter((id) => id !== qualId))
        }
        onClearAllCompare={() => setComparedQualificationIds([])}
        onToggleSaveProgram={handleToggleSaveProgram}
        onApplyQualification={(prefill) =>
          handleOpenApplicationRegistration(prefill.category || 'course_educare', prefill)
        }
      />

      {/* Student Module Difficulty & Clarity Feedback Modal */}
      <StudentFeedbackModal
        isOpen={studentFeedbackModalState.isOpen}
        onClose={() => setStudentFeedbackModalState((prev) => ({ ...prev, isOpen: false }))}
        studyGuides={studyGuides}
        enrollments={enrollments}
        user={user}
        initialCourseId={studentFeedbackModalState.courseId}
        initialModuleIndex={studentFeedbackModalState.moduleIndex}
        onSubmitCourseFeedback={handleSubmitCourseFeedback}
      />

      {/* Persistent TAI Tutor Floating Sidebar (hidden during Deep Work) */}
      {!deepWork.state.isActive && (
        <ResearchCornerAiTutorSidebar
          activePageLabel={
            activeTab === 'educare' || activeTab === 'education'
              ? 'Educare Study Guides'
              : activeTab === 'research'
              ? 'Research Corner'
              : activeTab === 'digital_world'
              ? 'Digital World Academy'
              : activeTab === 'activity'
              ? 'User Activity Dashboard'
              : activeTab === 'faculty_portal'
              ? 'Faculty Portal'
              : activeTab === 'careers'
              ? 'Career Roadmap'
              : activeTab === 'retreats'
              ? 'TTG Retreats'
              : 'TTG Learning Platform'
          }
          activeStudyContext={activeStudyContext}
        />
      )}

    </div>
  );
}
