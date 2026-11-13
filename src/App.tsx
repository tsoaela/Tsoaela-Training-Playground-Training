import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  UserRole,
  SubscriptionTier, 
  Booking, 
  InvoiceReceipt,
  ReadingProgress,
  Reminder,
  StudyGuide,
  EnrolledStudentRecord,
  PeerReviewEntry,
  AppNotification,
  OfflineAssignmentSubmission
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
import { useNotifications } from './hooks/useNotifications';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { useOnlineStatus, cacheAllStudyGuidesLocally } from './utils/offlineStorage';
import { AuthorDocument, MusicTrack, PhotoItem, VideoItem, BookItem, ApplicationCategory, ApplicationPrefillData } from './types';
import { CheckCircle2, ShieldCheck, Award, BookOpen, Video, X } from 'lucide-react';

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('ttg_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Sync theme class to document element
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('ttg_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    try {
      document.documentElement.classList.add('theme-transitioning');
      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 420);
    } catch {}
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

  // Dynamic Study Guides State (including AI Courses)
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_study_guides');
      return saved ? JSON.parse(saved) : STUDY_GUIDES;
    } catch {
      return STUDY_GUIDES;
    }
  });

  // Reading Progress State (Prompt 5: reading process tracking)
  const [readingProgress, setReadingProgress] = useState<Record<string, ReadingProgress>>(() => {
    try {
      const saved = localStorage.getItem('ttg_reading_progress');
      return saved ? JSON.parse(saved) : INITIAL_READING_PROGRESS;
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

  // Active navigation tab (Compiled Education Platform + Multi-Modal Stores)
  const [activeTab, setActiveTab] = useState<AppNavigationTab>('education');

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
        return {
          ...rec,
          peerReviews: rec.peerReviews ?? seedMatch?.peerReviews ?? [],
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('student');
    try {
      localStorage.removeItem('ttg_is_authenticated');
      localStorage.removeItem('ttg_user_role');
    } catch {}
    setToastMessage('Signed out. Browsing as Guest.');
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

  // Free Institutional Accreditation & Productivity Registration Modal State
  const [isAccreditationPortalOpen, setIsAccreditationPortalOpen] = useState(false);

  // Course & Multi-Category Application Registration Modal State
  const [isApplicationRegistrationOpen, setIsApplicationRegistrationOpen] = useState(false);
  const [applicationInitialCategory, setApplicationInitialCategory] = useState<ApplicationCategory>('course_educare');
  const [applicationPrefill, setApplicationPrefill] = useState<ApplicationPrefillData | null>(null);

  // Study Group Live Video Room State
  const [activeStudyRoom, setActiveStudyRoom] = useState<{ courseTitle: string; courseId: string } | null>(null);

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
    setToastMessage(`Institutional accreditation verified! ID: ${registrationId}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Quick navigation targets from Global Search
  const [targetStudyGuideId, setTargetStudyGuideId] = useState<string | null>(null);
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
  const handlePurchaseTrack = (track: MusicTrack) => {
    requireAuth(() => {
      const newInvoice: InvoiceReceipt = {
        id: `inv_music_${Date.now()}`,
        invoice_number: `INV-AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `Track License: ${track.title} by ${track.artist}`,
        amount: track.price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_track_${Date.now()}`,
        items: [{ description: `${track.title} · 24-bit 96kHz Master & Stems`, quantity: 1, unit_price: track.price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased "${track.title}" ($${track.price.toFixed(2)})! High-res WAV & stems token added to receipt.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase and download "${track.title}" by ${track.artist}.`);
  };

  const handlePurchasePhoto = (photo: PhotoItem, licenseType: 'Personal' | 'Commercial' | 'Extended') => {
    requireAuth(() => {
      const price = licenseType === 'Personal' ? photo.pricePersonal : licenseType === 'Commercial' ? photo.priceCommercial : photo.priceExtended;
      const newInvoice: InvoiceReceipt = {
        id: `inv_photo_${Date.now()}`,
        invoice_number: `INV-PHO-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${licenseType} Photo License: ${photo.title}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_photo_${Date.now()}`,
        items: [{ description: `${photo.title} (${photo.megapixels}MP RAW + TIFF) · ${licenseType} License`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${licenseType} License for "${photo.title}" ($${price.toFixed(2)})! High-res RAW downloaded.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase the ${licenseType} license for "${photo.title}".`);
  };

  const handlePurchaseVideo = (video: VideoItem, licenseType: 'Standard' | 'Broadcast') => {
    requireAuth(() => {
      const price = licenseType === 'Standard' ? video.priceStandard : video.priceBroadcast;
      const newInvoice: InvoiceReceipt = {
        id: `inv_video_${Date.now()}`,
        invoice_number: `INV-VID-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${licenseType} Video License: ${video.title}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_video_${Date.now()}`,
        items: [{ description: `${video.title} (${video.resolution} ${video.codec}) · ${licenseType} License`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${licenseType} License for "${video.title}" ($${price.toFixed(2)})! Master ProRes token granted.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, `Sign in or register to purchase the ${licenseType} license for "${video.title}".`);
  };

  const handlePurchaseBook = (book: BookItem, format: 'eBook' | 'Print' | 'Audiobook') => {
    requireAuth(() => {
      const price = format === 'eBook' ? book.priceEbook : format === 'Print' ? book.pricePrint : (book.priceAudiobook || 14.99);
      const newInvoice: InvoiceReceipt = {
        id: `inv_book_${Date.now()}`,
        invoice_number: `INV-BOK-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: `${format} of "${book.title}" by ${book.author}`,
        amount: price,
        currency: 'USD',
        status: 'Paid',
        category: 'Subscription',
        payment_method: 'Stripe Instant Checkout',
        payment_intent_id: `pi_book_${Date.now()}`,
        items: [{ description: `"${book.title}" · ${format} Edition (ISBN: ${book.isbn})`, quantity: 1, unit_price: price }]
      };
      setInvoices(prev => [newInvoice, ...prev]);
      setToastMessage(`Purchased ${format} of "${book.title}" ($${price.toFixed(2)})! Complete manuscript unlocked.`);
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
    setStudyGuides(prev => [newGuide, ...prev]);
    registerCourse(newGuide.id);
    triggerToast(`✨ AI Course Generated: "${newGuide.title}" added to curriculum!`);
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
      triggerToast(`Enrolled in "${guide.title}"! Course Leaderboard unlocked.`);
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

  // Reading Progress Handler
  const handleUpdateReadingProgress = (
    guideId: string, 
    chapterIdx: number, 
    totalChapters: number, 
    notes?: string,
    quizScore?: number,
    badgeId?: string
  ) => {
    registerCourse(guideId);

    const current = readingProgress[guideId] || {
      guideId,
      completedChapters: [],
      progressPercent: 0,
      lastReadDate: new Date().toISOString().slice(0, 10),
      isCompleted: false,
      notes: '',
      quizScores: {},
      unlockedBadges: [],
      completionLog: [],
    };

    let newCompleted = [...current.completedChapters];
    let newCompletionLog = [...(current.completionLog || [])];
    if (chapterIdx >= 0) {
      if (newCompleted.includes(chapterIdx)) {
        newCompleted = newCompleted.filter(idx => idx !== chapterIdx);
        newCompletionLog = newCompletionLog.filter(entry => entry.chapterIdx !== chapterIdx);
      } else {
        newCompleted.push(chapterIdx);
        newCompletionLog.push({
          chapterIdx,
          completedAt: new Date().toISOString(),
        });
      }
    }

    const progressPercent = Math.round((newCompleted.length / totalChapters) * 100);
    const isCompleted = progressPercent >= 100;

    // Handle quiz results
    const newQuizScores = { ...(current.quizScores || {}) };
    if (quizScore !== undefined) {
      newQuizScores['default'] = quizScore;
    }

    // Handle badges
    const newBadges = [...(current.unlockedBadges || [])];
    if (badgeId && !newBadges.includes(badgeId)) {
      newBadges.push(badgeId);
    }

    const updatedProgress: ReadingProgress = {
      guideId,
      completedChapters: newCompleted.sort((a, b) => a - b),
      progressPercent,
      lastReadDate: new Date().toISOString().slice(0, 10),
      isCompleted: isCompleted || current.isCompleted,
      notes: notes !== undefined ? notes : current.notes,
      quizScores: newQuizScores,
      unlockedBadges: newBadges,
      completionLog: newCompletionLog,
    };

    setReadingProgress(prev => ({
      ...prev,
      [guideId]: updatedProgress,
    }));

    // Enqueue updated progress for immediate or offline-deferred database synchronization
    queueStudyProgress(guideId, updatedProgress);

    if (quizScore !== undefined) {
      setEnrollments(prev =>
        prev.map(rec =>
          rec.courseId === guideId &&
          (rec.studentEmail.toLowerCase() === user.email.toLowerCase() ||
            rec.studentName.toLowerCase() === user.name.toLowerCase())
            ? {
                ...rec,
                progressPercent: Math.max(rec.progressPercent, progressPercent),
                testScore: Math.max(rec.testScore ?? 0, quizScore),
              }
            : rec
        )
      );
      const matchedGuide = studyGuides.find(g => g.id === guideId);
      notifyAssignmentGraded({
        courseId: guideId,
        courseTitle: matchedGuide?.title || 'Course Module',
        assignmentTitle: 'Module Assessment & Quiz',
        score: quizScore,
        feedback: quizScore >= 70 ? 'Passing threshold achieved.' : 'Review module invariants and retry.',
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
    triggerToast(`🎉 Subscription confirmed via Stripe! You now have full access to ${newPlan.replace('_', ' ').toUpperCase()}.`);
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
      
      {/* Live Course Alert Banner (from useNotifications hook) */}
      <AnimatePresence>
        {activeAlert && (
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
            onStartStudyRoom={(title, id) => {
              requireAuth(() => {
                setActiveStudyRoom({ courseTitle: title, courseId: id });
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
          />
        )}

        {activeTab === 'music_store' && (
          <MusicStoreTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onPurchaseTrack={handlePurchaseTrack}
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
            onOpenFacultyPortal={() => setActiveTab('faculty_portal')}
            syncedFocusMinutes={pomodoro.syncedFocusMinutes}
            completedPomodoroSessions={pomodoro.completedSessions}
            pomodoroLogs={pomodoro.sessionLogs}
            onUpdateProfile={handleUpdateProfile}
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
              src="/assets/aistudio/InShot_20260522_150628190_3d2729ca.jpg"
              alt="Tai-one Digital Developer Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40 shrink-0"
            />
            <span className="font-bold text-stone-900 dark:text-stone-100">TTG</span>
            <span>·</span>
            <span>Tai-one Digital Developer · Tsoaela Training Ground Platform</span>
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

      {/* Stripe Checkout Modal (Prompt 1 Subscription & Prompt 2 Retreat Booking) */}
      <StripeCheckoutModal
        isOpen={isStripeCheckoutOpen}
        checkoutData={checkoutData}
        onClose={() => {
          setIsStripeCheckoutOpen(false);
          setCheckoutData(null);
        }}
        onSuccessSubscription={handleSubscriptionSuccess}
        onSuccessBooking={handleBookingSuccess}
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
      />

      {/* University Syllabus & Academic Prompt Studio Modal */}
      <AcademicPromptsHubModal
        isOpen={isAcademicPromptsOpen}
        onClose={() => setIsAcademicPromptsOpen(false)}
        user={user}
        onInsertIntoEditor={handleInsertIntoEditor}
      />

      {/* Free Institutional Accreditation & Productivity Registration Portal */}
      <AccreditationPortalModal
        isOpen={isAccreditationPortalOpen}
        onClose={() => setIsAccreditationPortalOpen(false)}
        user={user}
        onAccreditationSuccess={handleAccreditationSuccess}
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
          setToastMessage(`Enrolled! Registration ID: ${reg.registrationNumber}`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Study Group Live Video Room Modal (WebRTC P2P Room) */}
      {activeStudyRoom && (
        <StudyGroupVideoRoomModal
          isOpen={!!activeStudyRoom}
          onClose={() => setActiveStudyRoom(null)}
          courseTitle={activeStudyRoom.courseTitle}
          courseId={activeStudyRoom.courseId}
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

    </div>
  );
}
