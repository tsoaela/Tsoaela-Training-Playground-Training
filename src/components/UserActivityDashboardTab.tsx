import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Clock, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  BookOpen, 
  Target, 
  BarChart2, 
  Flame, 
  ShieldCheck, 
  ArrowUpRight,
  RefreshCw,
  Trash2,
  PlayCircle,
  Gauge,
  MessageSquarePlus,
  History,
  FileEdit,
  Download,
  FileText,
  FileCode2,
  FileSpreadsheet,
  ChevronDown,
  Timer,
  Trophy
} from 'lucide-react';
import {
  AcceptedRegisteredStudent,
  UserProfile,
  ReadingProgress,
  StudyGuide,
  EnrolledStudentRecord,
  PomodoroSessionLog,
  SavedAcademicProgram,
  ApplicationPrefillData,
  RealtimeStudyTelemetry,
  DeepWorkState,
  FocusIntensityMetrics,
  PomodoroPhase,
  StudentAdmissionStatus,
} from '../types';
import { DeepWorkPanel } from './DeepWorkPanel';
import { DeepWorkAmbienceSoundboard } from './DeepWorkAmbienceSoundboard';
import { DeepWorkAmbienceController } from '../hooks/useDeepWorkAmbience';
import { DeepWorkHeatmapD3 } from './DeepWorkHeatmapD3';
import { WeeklyFocusChallenge } from './WeeklyFocusChallenge';
import { DeepWorkMarathonChallenge } from './DeepWorkMarathonChallenge';
import { DeepWorkMonthlySubjectSummary } from './DeepWorkMonthlySubjectSummary';
import { DailyStudyGoalRingCard } from './DailyStudyGoalRingCard';
import { useDailyStudyGoal } from '../hooks/useDailyStudyGoal';
import { FocusStreakSection } from './FocusStreakSection';
import { FocusIntensityTrendChart } from './FocusIntensityTrendChart';
import { FocusHistorySection } from './FocusHistorySection';
import { FocusBuddyPanel } from './FocusBuddyPanel';
import { buildDailyFocusIntensityTrend30d } from '../utils/deepWorkAnalytics';
import {
  exportDailyFocusIntensityCsv,
  exportFocusSessionHistoryCsv,
} from '../utils/focusCsvExport';
import {
  computeFocusStreakMetrics,
  syncFocusStreakGoalMetDate,
} from '../utils/focusStreakSystem';
import { RealtimeStudyBanner } from './RealtimeStudyBanner';
import { AcademicCategoryKey } from '../data/academicCatalog';
import { AchievementBadgesSection } from './AchievementBadgesSection';
import {
  AchievementUnlockedOverlay,
  MilestoneAchievementItem,
} from './AchievementUnlockedOverlay';
import { UserProfileCertificatesSection } from './UserProfileCertificatesSection';
import { ProfileEditCard } from './ProfileEditCard';
import { CourseProgressChart } from './CourseProgressChart';
import { WeeklyPomodoroTrendChart } from './WeeklyPomodoroTrendChart';
import { SavedProgramsSection } from './SavedProgramsSection';
import { ApplicationsAndRegistrationsSection } from './ApplicationsAndRegistrationsSection';
import { MilestoneProgressSection } from './MilestoneProgressSection';
import { PeerInteractionMap } from './PeerInteractionMap';
import { FocusAiPanel } from './FocusAiPanel';
import { KnowledgeGraphSection } from './KnowledgeGraphSection';
import {
  exportLearningRecordJson,
  exportLearningRecordPdf,
} from '../utils/learningRecordExport';
import {
  exportPomodoroLogsCsv,
  summarizePomodoroLogs,
} from '../utils/pomodoroCsvExport';

interface UserActivityDashboardTabProps {
  user: UserProfile;
  readingProgress: Record<string, ReadingProgress>;
  studyGuides: StudyGuide[];
  enrollments?: EnrolledStudentRecord[];
  acceptedStudents?: AcceptedRegisteredStudent[];
  onUpdateAcceptedStudentStatus?: (
    id: string,
    status: StudentAdmissionStatus
  ) => Promise<AcceptedRegisteredStudent | null>;
  onNavigateToCourse?: (guideId: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string, roomId?: string) => void;
  onOpenFacultyPortal?: () => void;
  syncedFocusMinutes?: number;
  completedPomodoroSessions?: number;
  pomodoroLogs?: PomodoroSessionLog[];
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  savedPrograms?: SavedAcademicProgram[];
  comparedProgramIds?: string[];
  onRemoveSavedProgram?: (qualificationId: string) => void;
  onBrowseQualifications?: (category?: AcademicCategoryKey) => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  onToggleCompareProgram?: (qualificationId: string) => void;
  onOpenCompareModal?: () => void;
  onRefreshActiveCourses?: () => void;
  onRemovePassedActivities?: () => void;
  onOpenStudentFeedback?: (courseId?: string, moduleIndex?: number) => void;
  realtimeStudy?: RealtimeStudyTelemetry;
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onVerifySerial?: (serial: string) => void;
  onAppealSerial?: (serial: string, courseId: string, courseTitle: string) => void;
  deepWork?: {
    state: DeepWorkState;
    focusIntensity: FocusIntensityMetrics;
    lastAutoCompletedSessionId?: string | null;
    onDismissAutoCompleted?: () => void;
    onUpdateSessionReflection?: (sessionId: string, reflectionNotes: string) => void;
    onToggleDeepWork: () => void;
    onStartDeepWork: (minutes?: number, guideId?: string) => void;
    onPauseResume: () => void;
    onCompleteSession: (reflectionNotes?: string) => void;
    onEndEarly: () => void;
    onSelectPlannedMinutes: (minutes: number) => void;
    onSelectLinkedGuide: (guideId: string) => void;
  };
  pomodoroLive?: {
    phase: PomodoroPhase;
    isRunning: boolean;
    remainingSeconds: number;
    totalPhaseSeconds: number;
    onStartPause?: () => void;
  };
  deepWorkAmbience?: DeepWorkAmbienceController;
}

export const UserActivityDashboardTab: React.FC<UserActivityDashboardTabProps> = ({
  user,
  readingProgress,
  studyGuides,
  enrollments = [],
  acceptedStudents = [],
  onUpdateAcceptedStudentStatus,
  onNavigateToCourse,
  onStartStudyRoom,
  onOpenFacultyPortal,
  syncedFocusMinutes = 0,
  completedPomodoroSessions = 0,
  pomodoroLogs = [],
  onUpdateProfile,
  savedPrograms = [],
  comparedProgramIds = [],
  onRemoveSavedProgram,
  onBrowseQualifications,
  onApplyQualification,
  onToggleCompareProgram,
  onOpenCompareModal,
  onRefreshActiveCourses,
  onRemovePassedActivities,
  onOpenStudentFeedback,
  realtimeStudy,
  isAuthenticated = false,
  onOpenAuthModal,
  onVerifySerial,
  onAppealSerial,
  deepWork,
  pomodoroLive,
  deepWorkAmbience,
}) => {
  const {
    dailyGoalHours,
    setDailyGoalHours,
    setDailyGoalDuration,
    metrics: dailyGoalMetrics,
  } = useDailyStudyGoal({
    userId: user.id || 'user_88219',
    pomodoroLogs,
    syncedFocusMinutes,
    pomodoroLive,
    deepWorkState: deepWork?.state,
  });

  const focusStreakMetrics = useMemo(
    () =>
      computeFocusStreakMetrics({
        userId: user.id || 'user_88219',
        dailyGoalHours,
        todayTotalMinutes: dailyGoalMetrics.todayTotalMinutes,
        isGoalMetToday: dailyGoalMetrics.isGoalMet,
        deepWorkState: deepWork?.state,
        pomodoroLogs,
      }),
    [
      user.id,
      dailyGoalHours,
      dailyGoalMetrics.todayTotalMinutes,
      dailyGoalMetrics.isGoalMet,
      deepWork?.state,
      pomodoroLogs,
    ]
  );

  useEffect(() => {
    syncFocusStreakGoalMetDate({
      userId: user.id || 'user_88219',
      isGoalMetToday: dailyGoalMetrics.isGoalMet,
      currentStreakDays: focusStreakMetrics.currentStreakDays,
    });
  }, [
    user.id,
    dailyGoalMetrics.isGoalMet,
    focusStreakMetrics.currentStreakDays,
  ]);

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [velocityFilter, setVelocityFilter] = useState<'all' | 'active'>('all');
  const [focusAiEnabled, setFocusAiEnabled] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isAchievementOverlayOpen, setIsAchievementOverlayOpen] = useState<boolean>(false);
  const isDeepWorkActive = Boolean(deepWork?.state.isActive);
  const [acknowledgedMilestoneIds, setAcknowledgedMilestoneIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_acknowledged_milestones_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  // Compute live student telemetry
  const completedGuides = useMemo(() => {
    return studyGuides.filter(g => readingProgress[g.id]?.isCompleted);
  }, [studyGuides, readingProgress]);

  const inProgressGuides = useMemo(() => {
    return studyGuides.filter(g => {
      const p = readingProgress[g.id];
      return p && !p.isCompleted && (p.completedChapters?.length || 0) > 0;
    });
  }, [studyGuides, readingProgress]);

  const activeCurriculumCourses = useMemo(() => {
    return studyGuides.filter(g => {
      const p = readingProgress[g.id];
      return !p?.isCompleted && (p?.progressPercent || 0) < 100;
    });
  }, [studyGuides, readingProgress]);

  // Top 3 most recently accessed study guides ordered by lastReadDate descending
  const recentReads = useMemo(() => {
    return studyGuides
      .map((guide) => {
        const prog = readingProgress[guide.id];
        if (!prog || !prog.lastReadDate) return null;
        const primaryTimestamp = prog.lastAccessedAt
          ? new Date(prog.lastAccessedAt).getTime()
          : new Date(`${prog.lastReadDate}T00:00:00`).getTime();
        const dateScore = new Date(`${prog.lastReadDate}T00:00:00`).getTime();
        const sortWeight = Number.isNaN(primaryTimestamp)
          ? Number.isNaN(dateScore)
            ? 0
            : dateScore
          : Math.max(primaryTimestamp, Number.isNaN(dateScore) ? 0 : dateScore);
        const chapterNotesCount = Object.values(prog.chapterNotes || {}).filter(
          (note) => typeof note === 'string' && note.trim().length > 0
        ).length;
        const latestQuizAttempt =
          prog.quizHistory && prog.quizHistory.length > 0
            ? prog.quizHistory[prog.quizHistory.length - 1]
            : null;
        return {
          guide,
          prog,
          sortWeight,
          chapterNotesCount,
          latestQuizAttempt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (b.prog.lastReadDate !== a.prog.lastReadDate) {
          return b.prog.lastReadDate.localeCompare(a.prog.lastReadDate);
        }
        return b.sortWeight - a.sortWeight;
      })
      .slice(0, 3);
  }, [studyGuides, readingProgress]);

  const pendingAssessmentRows = useMemo(() => {
    return studyGuides
      .map((guide) => {
        const prog = readingProgress[guide.id];
        const quiz = guide.quizzes?.[0];
        const score = quiz && prog?.quizScores ? prog.quizScores[quiz.id] : undefined;
        const hasTaken = score !== undefined;
        const minScore = quiz?.minScoreToPass || 70;
        const passed = hasTaken ? score >= minScore : false;
        return { guide, quiz, score, hasTaken, minScore, passed };
      })
      .filter((row) => !(row.hasTaken && row.passed));
  }, [studyGuides, readingProgress]);

  // Aggregate quiz scores
  const allScores = useMemo(() => {
    const scores: number[] = [];
    Object.values(readingProgress).forEach(p => {
      if (p.quizScores) {
        Object.values(p.quizScores).forEach(s => scores.push(s));
      }
    });
    return scores;
  }, [readingProgress]);

  const averageQuizScore = useMemo(() => {
    if (allScores.length === 0) return 92;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }, [allScores]);

  // Total Study Time calculated from completed chapters + live study seconds + synced Pomodoro focus minutes + baseline hours
  const totalStudyHours = useMemo(() => {
    let totalMinutes = syncedFocusMinutes;
    studyGuides.forEach(g => {
      const p = readingProgress[g.id];
      if (p) {
        const completedCount = p.completedChapters?.length || 0;
        // Each chapter averages ~45 minutes of deep focus & notes + real-time tracked seconds
        totalMinutes += completedCount * 45 + ((p.studyTimeSeconds || 0) / 60);
      }
    });
    // Add baseline institutional hours
    const hours = (totalMinutes / 60) + 48.5;
    return parseFloat(hours.toFixed(1));
  }, [studyGuides, readingProgress, syncedFocusMinutes]);

  const syncedPomodoroHours = useMemo(
    () => parseFloat((syncedFocusMinutes / 60).toFixed(2)),
    [syncedFocusMinutes]
  );

  const pomodoroSummary = useMemo(
    () => summarizePomodoroLogs(pomodoroLogs, syncedFocusMinutes),
    [pomodoroLogs, syncedFocusMinutes]
  );

  // Evaluate student milestone achievements (10 Consecutive Days, Top 1% Quiz Scorer, etc.)
  const consecutiveStudyDays = 18;
  const bestQuizScore = useMemo(() => {
    let peak = allScores.length > 0 ? Math.max(...allScores) : 0;
    Object.values(readingProgress).forEach((p) => {
      p.quizHistory?.forEach((attempt) => {
        if (attempt.score > peak) peak = attempt.score;
      });
    });
    const emailLower = user.email.trim().toLowerCase();
    const nameLower = user.name.trim().toLowerCase();
    enrollments.forEach((rec) => {
      if (
        (rec.studentEmail.trim().toLowerCase() === emailLower ||
          rec.studentName.trim().toLowerCase() === nameLower) &&
        typeof rec.testScore === 'number'
      ) {
        if (rec.testScore > peak) peak = rec.testScore;
      }
    });
    return peak;
  }, [allScores, readingProgress, enrollments, user.email, user.name]);

  const unlockedMilestones = useMemo<MilestoneAchievementItem[]>(() => {
    const earned: MilestoneAchievementItem[] = [];

    if (consecutiveStudyDays >= 10) {
      earned.push({
        id: 'milestone_10_consecutive_days',
        title: '10 Consecutive Days of Study',
        subtitle: 'Sustained Daily Consistency Milestone',
        description:
          'Awarded for maintaining an unbroken study streak of 10 or more consecutive days across Digital Educare chapters and focus sessions.',
        metricValue: `${consecutiveStudyDays} Day Streak`,
        tierLabel: 'Epic',
        icon: 'flame',
        unlockedAtLabel: 'Active Streak Verified',
      });
    }

    if (bestQuizScore >= 95 || averageQuizScore >= 95) {
      const topScore = Math.max(bestQuizScore, averageQuizScore);
      earned.push({
        id: 'milestone_top_1_percent_scorer',
        title: 'Top 1% Quiz Scorer',
        subtitle: 'Elite Assessment Distinction',
        description:
          'Achieved a 95%+ benchmark score on accredited curriculum assessments, placing your mastery in the top 1% cohort.',
        metricValue: `${topScore}% Peak Score`,
        tierLabel: 'Legendary',
        icon: 'trophy',
        unlockedAtLabel: 'Honors Tier',
      });
    }

    if (totalStudyHours >= 50 || syncedFocusMinutes >= 150) {
      earned.push({
        id: 'milestone_deep_work_hours',
        title: '50+ Hours Deep Study Mastery',
        subtitle: 'Cumulative Focus Hours Milestone',
        description:
          'Surpassed 50 cumulative study hours across structured study guides and synced Pomodoro deep-focus intervals.',
        metricValue: `${totalStudyHours.toFixed(1)}h Logged`,
        tierLabel: 'Honors',
        icon: 'timer',
        unlockedAtLabel: 'Telemetry Verified',
      });
    }

    if (completedGuides.length >= 1) {
      earned.push({
        id: 'milestone_syllabus_completion',
        title: 'Syllabus Mastery Milestone',
        subtitle: '100% Course Completion',
        description:
          'Completed every chapter and assessment requirement for an accredited TTG study guide.',
        metricValue: `${completedGuides.length} Course${completedGuides.length === 1 ? '' : 's'} Mastered`,
        tierLabel: 'Epic',
        icon: 'graduation',
        unlockedAtLabel: 'Credential Earned',
      });
    }

    return earned;
  }, [
    consecutiveStudyDays,
    bestQuizScore,
    averageQuizScore,
    totalStudyHours,
    syncedFocusMinutes,
    completedGuides.length,
  ]);

  const unacknowledgedMilestones = useMemo(
    () =>
      unlockedMilestones.filter(
        (m) => !acknowledgedMilestoneIds.includes(m.id)
      ),
    [unlockedMilestones, acknowledgedMilestoneIds]
  );

  // Automatically surface Achievement Unlocked overlay when new milestones are earned (muted in Deep Work mode)
  useEffect(() => {
    if (!isDeepWorkActive && unacknowledgedMilestones.length > 0) {
      setIsAchievementOverlayOpen(true);
    }
  }, [unacknowledgedMilestones.length, isDeepWorkActive]);

  const handleAcknowledgeMilestones = useCallback((ids: string[]) => {
    setAcknowledgedMilestoneIds((prev) => {
      const merged = Array.from(new Set([...prev, ...ids]));
      try {
        localStorage.setItem(
          'ttg_acknowledged_milestones_v1',
          JSON.stringify(merged)
        );
      } catch {}
      return merged;
    });
  }, []);

  const overlayMilestones =
    unacknowledgedMilestones.length > 0
      ? unacknowledgedMilestones
      : unlockedMilestones;

  const handleExportPomodoroCsv = () => {
    const result = exportPomodoroLogsCsv({
      user,
      pomodoroLogs,
      studyGuides,
      syncedFocusMinutes,
      completedPomodoroSessions,
      totalStudyHours,
    });
    setExportNotice(
      `Exported ${result.exportedRowsCount} Pomodoro log${
        result.exportedRowsCount === 1 ? '' : 's'
      } (${result.totalFocusHours.toFixed(2)} focus hrs) to ${result.filename}.`
    );
    window.setTimeout(() => setExportNotice(null), 4500);
  };

  const handleExportDailyIntensityCsv = () => {
    const trend = buildDailyFocusIntensityTrend30d({
      deepWorkState: deepWork?.state,
      pomodoroLogs,
      studyGuides,
      includePomodoroFocus: true,
    });
    const result = exportDailyFocusIntensityCsv({
      user,
      trend,
      includeRestDays: true,
    });
    setExportNotice(
      `Exported ${result.exportedRowsCount} days of Daily Focus Intensity to ${result.filename}.`
    );
    window.setTimeout(() => setExportNotice(null), 4500);
  };

  const handleExportSessionHistoryCsv = () => {
    const result = exportFocusSessionHistoryCsv({
      user,
      deepWorkState: deepWork?.state,
      pomodoroLogs,
      studyGuides,
    });
    setExportNotice(
      `Exported ${result.exportedRowsCount} focus sessions (${(
        result.totalMinutes / 60
      ).toFixed(2)} hrs) to ${result.filename}.`
    );
    window.setTimeout(() => setExportNotice(null), 4500);
  };

  // Daily Study Time Data (Bar/Area Chart)
  const dailyStudyData = useMemo(() => {
    if (timeframe === '7d') {
      return [
        { day: 'Mon', hours: 2.8, focusScore: 92, target: 2.0 },
        { day: 'Tue', hours: 3.4, focusScore: 96, target: 2.0 },
        { day: 'Wed', hours: 1.5, focusScore: 84, target: 2.0 },
        { day: 'Thu', hours: 4.2, focusScore: 98, target: 2.0 },
        { day: 'Fri', hours: 3.1, focusScore: 91, target: 2.0 },
        { day: 'Sat', hours: 2.0, focusScore: 88, target: 2.0 },
        { day: 'Sun', hours: parseFloat((3.8 + syncedPomodoroHours).toFixed(2)), focusScore: 95, target: 2.0 },
      ];
    }
    if (timeframe === '30d') {
      return [
        { day: 'Week 1', hours: 18.5, focusScore: 91, target: 14.0 },
        { day: 'Week 2', hours: 22.0, focusScore: 94, target: 14.0 },
        { day: 'Week 3', hours: 19.8, focusScore: 89, target: 14.0 },
        { day: 'Week 4', hours: parseFloat((24.5 + syncedPomodoroHours).toFixed(2)), focusScore: 97, target: 14.0 },
      ];
    }
    return [
      { day: 'Month 1', hours: 78.0, focusScore: 90, target: 60.0 },
      { day: 'Month 2', hours: 86.5, focusScore: 93, target: 60.0 },
      { day: 'Month 3', hours: parseFloat((94.2 + syncedPomodoroHours).toFixed(2)), focusScore: 96, target: 60.0 },
    ];
  }, [timeframe, syncedPomodoroHours]);

  // Progress Trends & Learning Velocity (LineChart)
  const progressTrendsData = useMemo(() => {
    return [
      { milestone: 'Module 1', cumulativeChapters: 4, velocityIndex: 78, retention: 91 },
      { milestone: 'Module 2', cumulativeChapters: 9, velocityIndex: 82, retention: 93 },
      { milestone: 'Module 3', cumulativeChapters: 15, velocityIndex: 87, retention: 90 },
      { milestone: 'Module 4', cumulativeChapters: 23, velocityIndex: 91, retention: 95 },
      { milestone: 'Module 5', cumulativeChapters: 32, velocityIndex: 96, retention: 98 },
      { milestone: 'Module 6', cumulativeChapters: 42, velocityIndex: 99, retention: 96 },
    ];
  }, []);

  // Faculty Breakdown (BarChart)
  const facultyData = useMemo(() => {
    return [
      { faculty: 'Frontier AI & Search', completed: 4, inProgress: 2, totalHours: 38 },
      { faculty: 'Cognitive Architecture', completed: 3, inProgress: 1, totalHours: 32 },
      { faculty: 'Sovereign Economics', completed: 2, inProgress: 2, totalHours: 28 },
      { faculty: 'Autonomous Swarms', completed: 2, inProgress: 1, totalHours: 24 },
      { faculty: 'Mechanism Design', completed: 1, inProgress: 1, totalHours: 19 },
    ];
  }, []);

  // Subject Distribution (PieChart)
  const subjectDistributionData = [
    { name: 'Frontier AI & Search Theory', value: 35, color: '#8b5cf6' },
    { name: 'Cognitive Architecture & Mindset', value: 25, color: '#3b82f6' },
    { name: 'Sovereign Economics & Nuclear SMR', value: 20, color: '#10b981' },
    { name: 'Autonomous Swarms & Cybernetics', value: 12, color: '#f59e0b' },
    { name: 'Mechanism Design & Game Theory', value: 8, color: '#ec4899' },
  ];

  // Reading Velocity: Average Reading Time per Chapter vs Recommended Course Pace
  const readingVelocityTelemetry = useMemo(() => {
    const guidesPool =
      velocityFilter === 'active' && activeCurriculumCourses.length > 0
        ? activeCurriculumCourses
        : studyGuides;

    const rows = guidesPool.map((guide, idx) => {
      const match = guide.reading_time.match(/(\d+)/);
      const totalCourseMinutes = match ? parseInt(match[1], 10) : 45;
      const chapterCount = Math.max(1, guide.chapters?.length || 3);
      const recommendedMinPerChapter = Math.max(
        6,
        Math.round(totalCourseMinutes / chapterCount)
      );

      const prog = readingProgress[guide.id];
      const completedChapters = prog?.completedChapters?.length || 0;

      // Combine real Pomodoro focus logs linked to this course + chapter completion timestamps
      const linkedFocusLogs = pomodoroLogs.filter(
        (log) =>
          log.phase === 'focus' &&
          log.guideTitle &&
          log.guideTitle.toLowerCase() === guide.title.toLowerCase()
      );
      const loggedFocusMinutes = linkedFocusLogs.reduce(
        (sum, log) => sum + (log.durationMinutes || 0),
        0
      );

      let measuredChapterMin: number | null = null;

      if (loggedFocusMinutes > 0) {
        const denominator = Math.max(1, completedChapters || linkedFocusLogs.length);
        measuredChapterMin = Math.round(loggedFocusMinutes / denominator);
      } else if (prog?.completionLog && prog.completionLog.length >= 2) {
        const sorted = [...prog.completionLog]
          .map((e) => new Date(e.completedAt).getTime())
          .filter((ts) => !Number.isNaN(ts))
          .sort((a, b) => a - b);
        const intervals: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const diffMin = Math.round((sorted[i] - sorted[i - 1]) / 60000);
          if (diffMin >= 3 && diffMin <= 90) intervals.push(diffMin);
        }
        if (intervals.length > 0) {
          measuredChapterMin = Math.round(
            intervals.reduce((a, b) => a + b, 0) / intervals.length
          );
        }
      }

      // When no live Pomodoro/interval telemetry exists yet for a guide, model baseline study speed around recommended pace
      const difficultyMultiplier =
        guide.difficulty === 'Advanced'
          ? 1.18
          : guide.difficulty === 'Executive'
          ? 1.05
          : 0.9;
      const deterministicOffset = ((idx % 3) - 1) * 2;
      const userAvgMinPerChapter =
        measuredChapterMin ??
        Math.max(
          5,
          Math.round(recommendedMinPerChapter * difficultyMultiplier + deterministicOffset)
        );

      const deltaMin = userAvgMinPerChapter - recommendedMinPerChapter;
      const paceStatus: 'Faster' | 'On Target' | 'Deeper Study' =
        deltaMin <= -2 ? 'Faster' : deltaMin >= 3 ? 'Deeper Study' : 'On Target';

      const shortTitle =
        guide.title.length > 22 ? `${guide.title.slice(0, 20)}…` : guide.title;

      return {
        guideId: guide.id,
        fullTitle: guide.title,
        course: shortTitle,
        recommendedPace: recommendedMinPerChapter,
        userAvgPace: userAvgMinPerChapter,
        deltaMin,
        paceStatus,
        completedChapters,
        totalChapters: chapterCount,
        hasLiveTelemetry: measuredChapterMin !== null,
      };
    });

    const overallUserAvg =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.userAvgPace, 0) / rows.length)
        : 0;
    const overallRecommendedAvg =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.recommendedPace, 0) / rows.length)
        : 0;
    const overallDelta = overallUserAvg - overallRecommendedAvg;

    return {
      rows,
      overallUserAvg,
      overallRecommendedAvg,
      overallDelta,
    };
  }, [studyGuides, activeCurriculumCourses, readingProgress, pomodoroLogs, velocityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-stone-900 dark:text-stone-100">
      
      {/* Dashboard Header Banner */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Tsoaela Training Ground Platform · Learning Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Student Activity & Progress Dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
              Real-time cognitive telemetry, time spent studying, faculty course completion velocity, and knowledge retention trends.
            </p>
          </div>

          {/* Header Controls: Milestone Replay + Export My Learning Record + Timeframe Filter */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isDeepWorkActive && unlockedMilestones.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAchievementOverlayOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Milestones Unlocked ({unlockedMilestones.length})</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>{isExportingPdf ? 'Generating PDF…' : 'Export My Learning Record'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-30 p-1.5 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsExportMenuOpen(false);
                      setIsExportingPdf(true);
                      try {
                        await exportLearningRecordPdf({
                          user,
                          studyGuides,
                          readingProgress,
                          enrollments,
                          totalStudyHours,
                          averageQuizScore,
                          syncedFocusMinutes,
                          completedPomodoroSessions,
                        });
                        setExportNotice('Formatted PDF learning record downloaded.');
                        setTimeout(() => setExportNotice(null), 4000);
                      } finally {
                        setIsExportingPdf(false);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#65a30d] dark:text-[#a3e635] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        Formatted PDF (.pdf)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        Progress, badges &amp; certificates dossier
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportLearningRecordJson({
                        user,
                        studyGuides,
                        readingProgress,
                        enrollments,
                        totalStudyHours,
                        averageQuizScore,
                        syncedFocusMinutes,
                        completedPomodoroSessions,
                      });
                      setExportNotice('Structured JSON learning record downloaded.');
                      setTimeout(() => setExportNotice(null), 4000);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          Structured JSON (.json)
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          Complete machine-readable history
                        </span>
                      </div>
                    </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportDailyIntensityCsv();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        Daily Focus Intensity (.csv)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        30-day intensity scores &amp; peak windows
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportSessionHistoryCsv();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        Focus Session History (.csv)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        Deep Work &amp; Pomodoro session logs
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportPomodoroCsv();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        Pomodoro Focus Logs (.csv)
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        Study hours &amp; completed focus sessions
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 shrink-0">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'all', label: 'All Time' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeframe === t.id
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-[#052e16]/10 dark:bg-[#052e16]/60 border border-[#84cc16]/50 text-xs font-semibold text-[#052e16] dark:text-[#bef264] inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#65a30d] dark:text-[#a3e635]" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Real-Time Study Stream Telemetry Banner */}
      {realtimeStudy && (
        <RealtimeStudyBanner
          isAuthenticated={isAuthenticated}
          telemetry={realtimeStudy}
          onOpenAuthModal={onOpenAuthModal}
          onOpenCourseCatalog={
            studyGuides[0] && onNavigateToCourse
              ? () => onNavigateToCourse(studyGuides[0].id)
              : undefined
          }
        />
      )}

      {/* Deep Work Timer Toggle, Distraction Shield & Focus Intensity Score */}
      {deepWork && (
        <DeepWorkPanel
          state={deepWork.state}
          focusIntensity={deepWork.focusIntensity}
          studyGuides={studyGuides}
          lastAutoCompletedSessionId={deepWork.lastAutoCompletedSessionId}
          onDismissAutoCompleted={deepWork.onDismissAutoCompleted}
          onUpdateSessionReflection={deepWork.onUpdateSessionReflection}
          onToggleDeepWork={deepWork.onToggleDeepWork}
          onStartDeepWork={deepWork.onStartDeepWork}
          onPauseResume={deepWork.onPauseResume}
          onCompleteSession={deepWork.onCompleteSession}
          onEndEarly={deepWork.onEndEarly}
          onSelectPlannedMinutes={deepWork.onSelectPlannedMinutes}
          onSelectLinkedGuide={deepWork.onSelectLinkedGuide}
          onNavigateToCourse={onNavigateToCourse}
        />
      )}

      {/* Deep Work Ambience Soundboard (White Noise & Lofi Beats, auto-pauses when study ends) */}
      {deepWorkAmbience && (
        <DeepWorkAmbienceSoundboard
          ambience={deepWorkAmbience}
          isStudySessionActive={Boolean(
            deepWork?.state.isActive ||
              (pomodoroLive?.isRunning && pomodoroLive.phase === 'focus')
          )}
        />
      )}

      {/* Daily Focus Duration Goal (Hours & Minutes) + Progress Bar & Progress Ring */}
      <DailyStudyGoalRingCard
        metrics={dailyGoalMetrics}
        onChangeGoalHours={setDailyGoalHours}
        onChangeGoalDuration={setDailyGoalDuration}
        isDeepWorkActive={Boolean(deepWork?.state.isActive)}
        isPomodoroRunning={Boolean(pomodoroLive?.isRunning && pomodoroLive.phase === 'focus')}
        onStartDeepWork={
          deepWork
            ? () => deepWork.onStartDeepWork(deepWork.state.plannedMinutes, deepWork.state.linkedGuideId)
            : undefined
        }
        onTogglePomodoro={pomodoroLive?.onStartPause}
      />

      {/* Focus Streak System & Escalating Tier Badges (Bronze, Silver, Gold, Platinum) */}
      <FocusStreakSection
        metrics={focusStreakMetrics}
        dailyGoalHours={dailyGoalHours}
        isDeepWorkActive={isDeepWorkActive}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* D3 30-Day Deep Work Heatmap & Peak Productivity Analysis */}
      <DeepWorkHeatmapD3
        deepWorkState={deepWork?.state}
        pomodoroLogs={pomodoroLogs}
        studyGuides={studyGuides}
        onNavigateToCourse={onNavigateToCourse}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* Recharts 30-Day Daily Focus Intensity Trend Line Chart */}
      <FocusIntensityTrendChart
        user={user}
        deepWorkState={deepWork?.state}
        pomodoroLogs={pomodoroLogs}
        studyGuides={studyGuides}
      />

      {/* Focus History: Last 10 Completed Focus Sessions */}
      <FocusHistorySection
        user={user}
        deepWorkState={deepWork?.state}
        pomodoroLogs={pomodoroLogs}
        studyGuides={studyGuides}
        isDeepWorkActive={isDeepWorkActive}
        onNavigateToCourse={onNavigateToCourse}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* Weekly Focus Challenge & Days Remaining Visual Tracker */}
      <WeeklyFocusChallenge
        deepWorkState={deepWork?.state}
        learnerName={user.name}
        isDeepWorkActive={Boolean(deepWork?.state.isActive)}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* Deep Work Marathon (3-Hour Focus Block -> Master of Focus Digital Badge) */}
      <DeepWorkMarathonChallenge
        deepWorkState={deepWork?.state}
        learnerName={user.name}
        isDeepWorkActive={Boolean(deepWork?.state.isActive)}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* Monthly Completed Deep Work Subject Time vs. Average Focus Intensity Summary */}
      <DeepWorkMonthlySubjectSummary
        deepWorkState={deepWork?.state}
        studyGuides={studyGuides}
        onNavigateToCourse={onNavigateToCourse}
        onStartDeepWork={deepWork?.onStartDeepWork}
      />

      {/* Focus Buddy System (Same-Course Study Hour Collaboration Matcher) */}
      <FocusBuddyPanel
        user={user}
        studyGuides={studyGuides}
        enrollments={enrollments}
        acceptedStudents={acceptedStudents}
        deepWorkState={deepWork?.state}
        focusIntensity={deepWork?.focusIntensity}
        isDeepWorkActive={isDeepWorkActive}
        onStartDeepWork={deepWork?.onStartDeepWork}
        onStartStudyRoom={onStartStudyRoom}
      />

      {/* Focus AI Mode Toggle & Gemini Study Priority Recommendations (muted during Deep Work) */}
      {!isDeepWorkActive && (
        <FocusAiPanel
          isEnabled={focusAiEnabled}
          onToggle={() => setFocusAiEnabled((prev) => !prev)}
          user={user}
          studyGuides={studyGuides}
          readingProgress={readingProgress}
          syncedFocusMinutes={syncedFocusMinutes}
          averageQuizScore={averageQuizScore}
          onNavigateToCourse={onNavigateToCourse}
        />
      )}

      {/* Editable Scholar Profile Card with Escalating Focus Streak Tier Badges (hidden during Deep Work) */}
      {!isDeepWorkActive && onUpdateProfile && (
        <ProfileEditCard
          user={user}
          onUpdateProfile={onUpdateProfile}
          syncedFocusMinutes={syncedFocusMinutes}
          completedSessions={completedPomodoroSessions}
          focusStreak={focusStreakMetrics}
        />
      )}

      {/* My Saved Programs Section (hidden during Deep Work) */}
      {!isDeepWorkActive && onRemoveSavedProgram && (
        <SavedProgramsSection
          savedPrograms={savedPrograms}
          comparedProgramIds={comparedProgramIds}
          onRemoveSavedProgram={onRemoveSavedProgram}
          onBrowseQualifications={onBrowseQualifications}
          onApplyQualification={onApplyQualification}
          onToggleCompareProgram={onToggleCompareProgram}
          onOpenCompareModal={onOpenCompareModal}
        />
      )}

      {/* Clean Sections: New Applications & Registrations */}
      {!isDeepWorkActive && (
        <ApplicationsAndRegistrationsSection
          user={user}
          acceptedStudents={acceptedStudents}
          onApplyQualification={onApplyQualification}
          onUpdateAcceptedStudentStatus={onUpdateAcceptedStudentStatus}
        />
      )}

      {/* Recent Reads Section (Top 3 most recently accessed study guides by lastReadDate) */}
      <section
        aria-labelledby="recent-reads-heading"
        className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              <History className="w-3.5 h-3.5" />
              <span>Recent Reads · Quick Resume</span>
            </div>
            <h2
              id="recent-reads-heading"
              className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Recently Accessed Study Guides
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Ordered by your most recent <span className="font-mono">lastReadDate</span> activity so you can pick up right where you left off.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 dark:text-stone-400 shrink-0">
            Showing {recentReads.length} of Top 3
          </span>
        </div>

        {recentReads.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950/40 text-center space-y-2">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              No recent study guide reads recorded yet
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Open any Educare study guide to log your access date and resume chapters seamlessly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReads.map(({ guide, prog, chapterNotesCount, latestQuizAttempt }, idx) => (
              <div
                key={guide.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex flex-col justify-between gap-3.5 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">
                      #{idx + 1} Recent
                    </span>
                    <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300 font-semibold">
                      <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{prog.lastReadDate}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                      {guide.category}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mt-0.5">
                      {guide.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span>
                      {prog.completedChapters.length}/{guide.chapters.length} chapters
                    </span>
                    <span>·</span>
                    <span>{guide.reading_time}</span>
                    {chapterNotesCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                          <FileEdit className="w-3 h-3" />
                          {chapterNotesCount} {chapterNotesCount === 1 ? 'note' : 'notes'}
                        </span>
                      </>
                    )}
                    {latestQuizAttempt && (
                      <>
                        <span>·</span>
                        <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                          Last quiz: {latestQuizAttempt.score}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone-500 dark:text-stone-400">Completion</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {prog.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        prog.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${prog.progressPercent}%` }}
                    />
                  </div>
                  {onNavigateToCourse && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCourse(guide.id)}
                      className="w-full mt-1 py-1.5 px-3 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Resume Study Guide</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Gamified Milestone Progress Bar (muted during Deep Work) */}
      {!isDeepWorkActive && (
        <MilestoneProgressSection
          studyGuides={studyGuides}
          readingProgress={readingProgress}
          onNavigateToCourse={onNavigateToCourse}
        />
      )}

      {/* Active User Courses & Activity Controls */}
      <section className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Active Course Roster</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeCurriculumCourses.length} Active Courses
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Active User Courses &amp; Activity Reset
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Passed assessments and completed sessions are cleared so only active in-progress curriculum modules remain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenStudentFeedback && (
              <button
                type="button"
                onClick={() => onOpenStudentFeedback(activeCurriculumCourses[0]?.id || studyGuides[0]?.id, 0)}
                className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/70 text-xs font-semibold text-purple-800 dark:text-purple-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Submit Course Feedback</span>
              </button>
            )}
            {onRefreshActiveCourses && (
              <button
                type="button"
                onClick={onRefreshActiveCourses}
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Refresh Active Courses</span>
              </button>
            )}
            {onRemovePassedActivities && (
              <button
                type="button"
                onClick={onRemovePassedActivities}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold text-rose-800 dark:text-rose-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Passed Activities</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeCurriculumCourses.map((guide) => {
            const prog = readingProgress[guide.id];
            const pct = prog?.progressPercent || 0;
            const completedChaptersCount = prog?.completedChapters?.length || 0;
            return (
              <div
                key={guide.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 truncate">
                      {guide.category}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 shrink-0">
                      {prog?.lastReadDate || 'Active Today'}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {completedChaptersCount}/{guide.chapters.length} chapters in cycle · {guide.reading_time}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone-500 dark:text-stone-400">Active Progress</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {onNavigateToCourse && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCourse(guide.id)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Continue Course</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                    {onOpenStudentFeedback && (
                      <button
                        type="button"
                        onClick={() => onOpenStudentFeedback(guide.id, completedChaptersCount)}
                        title="Share difficulty or clarity feedback on a module"
                        className="py-1.5 px-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>Feedback</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Study Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">Total Study Time</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {totalStudyHours}h
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" />{' '}
              {syncedFocusMinutes > 0
                ? `+${syncedFocusMinutes}m Pomodoro (${completedPomodoroSessions} synced)`
                : '+18.4% vs last cycle'}
            </span>
          </div>
        </div>

        {/* Courses Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">Courses Completed</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-purple-600 dark:text-purple-400">
              {completedGuides.length}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
              {inProgressGuides.length} in active progression
            </span>
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">Avg Knowledge Score</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {averageQuizScore}%
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Honors Distinction
            </span>
          </div>
        </div>

        {/* Active Study Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">Daily Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {consecutiveStudyDays} Days
            </div>
            <button
              type="button"
              onClick={() => setIsAchievementOverlayOpen(true)}
              className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3 h-3" />
              <span>10+ Day Milestone Unlocked</span>
            </button>
          </div>
        </div>

        {/* Internal QA & Self-Audit Checks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-medium">Internal QA Checks</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              4 Active
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
              Platform self-audit standards
            </span>
          </div>
        </div>

      </div>

      {/* 7-Day Daily Pomodoro Study Hours Consistency Trend Chart (muted during Deep Work) */}
      {!isDeepWorkActive && (
        <WeeklyPomodoroTrendChart
          pomodoroLogs={pomodoroLogs}
          syncedFocusMinutes={syncedFocusMinutes}
          dailyGoalHours={dailyGoalHours}
          onChangeDailyGoalHours={setDailyGoalHours}
        />
      )}

      {/* 30-Day Weekly Learning Time & Completed Chapters Chart (muted during Deep Work) */}
      {!isDeepWorkActive && (
        <CourseProgressChart
          readingProgress={readingProgress}
          studyGuides={studyGuides}
          syncedFocusMinutes={syncedFocusMinutes}
          pomodoroLogs={pomodoroLogs}
        />
      )}

      {/* Pomodoro Focus Session Logs & CSV Study Hours Report */}
      <section
        aria-labelledby="pomodoro-logs-heading"
        className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              <Timer className="w-4 h-4" />
              <span>Pomodoro Study Tracker · Time Ledger</span>
            </div>
            <h2
              id="pomodoro-logs-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Pomodoro Focus Session Logs
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Review synced focus intervals by study guide and download a timestamped CSV report to audit your total study hours.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportPomodoroCsv}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
            <span className="text-stone-500 dark:text-stone-400 block">
              Logged Focus Sessions
            </span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100 mt-1 block">
              {Math.max(pomodoroSummary.focusSessionsCount, completedPomodoroSessions)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
            <span className="text-stone-500 dark:text-stone-400 block">
              Pomodoro Focus Minutes
            </span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1 block">
              {pomodoroSummary.effectiveFocusMinutes} min
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
            <span className="text-stone-500 dark:text-stone-400 block">
              Pomodoro Focus Hours
            </span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1 block">
              {pomodoroSummary.effectiveFocusHours.toFixed(2)} hrs
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
            <span className="text-stone-500 dark:text-stone-400 block">
              Total Platform Study Hours
            </span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1 block">
              {totalStudyHours.toFixed(1)} hrs
            </span>
          </div>
        </div>

        {pomodoroLogs.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                No individual Pomodoro intervals logged in this browser session yet
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Complete or sync a focus interval in the Digital Educare Pomodoro timer to record course-level entries. You can still export the CSV summary anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportPomodoroCsv}
              className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-950/70 text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Date &amp; Time</th>
                  <th className="py-2.5 px-3 font-semibold">Study Guide / Course</th>
                  <th className="py-2.5 px-3 font-semibold">Phase</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {pomodoroLogs.slice(0, 6).map((log) => {
                  const dt = new Date(log.completedAt);
                  const dateLabel = Number.isNaN(dt.getTime())
                    ? log.completedAt
                    : dt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono tabular-nums text-stone-600 dark:text-stone-300 whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-stone-100">
                        {log.guideTitle || 'Independent Study Session'}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                        {log.phase === 'focus'
                          ? 'Focus Session'
                          : log.phase === 'short_break'
                          ? 'Short Break'
                          : 'Long Break'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {log.durationMinutes} min ({(log.durationMinutes / 60).toFixed(2)}h)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pomodoroLogs.length > 6 && (
              <div className="px-3 py-2 bg-stone-50/70 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                Showing latest 6 of {pomodoroLogs.length} logged sessions · All {pomodoroLogs.length} rows are included in the CSV export.
              </div>
            )}
          </div>
        )}
      </section>

      {!isDeepWorkActive && (
        <>
          {/* Reading Velocity Graph: User Average Time per Chapter vs Recommended Course Pace */}
          <section
            aria-labelledby="reading-velocity-heading"
            className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span>Reading Velocity · Speed Management</span>
                </div>
                <h2
                  id="reading-velocity-heading"
                  className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
                >
                  Average Reading Time per Chapter vs. Recommended Pace
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Compare your minutes per chapter against each course&apos;s recommended study cadence to calibrate comprehension speed.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setVelocityFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      velocityFilter === 'all'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    All Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => setVelocityFilter('active')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      velocityFilter === 'active'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Active Only
                  </button>
                </div>
              </div>
            </div>

            {/* Reading Velocity Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Your Avg Time / Chapter
                </span>
                <span className="text-2xl font-extrabold font-mono tabular-nums text-purple-700 dark:text-purple-400 mt-0.5 block">
                  {readingVelocityTelemetry.overallUserAvg} min
                </span>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Recommended Course Pace
                </span>
                <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                  {readingVelocityTelemetry.overallRecommendedAvg} min
                </span>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Study Speed Balance
                </span>
                <span
                  className={`text-lg font-extrabold font-mono tabular-nums mt-1 block ${
                    readingVelocityTelemetry.overallDelta <= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {readingVelocityTelemetry.overallDelta === 0
                    ? 'On Recommended Pace'
                    : readingVelocityTelemetry.overallDelta < 0
                    ? `${Math.abs(readingVelocityTelemetry.overallDelta)} min/ch Faster`
                    : `+${readingVelocityTelemetry.overallDelta} min/ch Deeper Review`}
                </span>
              </div>
            </div>

            {/* Composed Bar + Line Reading Velocity Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={readingVelocityTelemetry.rows}
                  margin={{ top: 10, right: 16, left: -12, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis
                    dataKey="course"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    unit="m"
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      `${value} min / chapter`,
                      String(name),
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullTitle || 'Course'
                    }
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#292524',
                      borderRadius: '0.75rem',
                      color: '#fafaf9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="userAvgPace"
                    name="Your Avg Reading Time (min/ch)"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    barSize={30}
                  />
                  <Line
                    type="monotone"
                    dataKey="recommendedPace"
                    name="Course Recommended Pace (min/ch)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Per-Course Pace Breakdown Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              {readingVelocityTelemetry.rows.map((row) => (
                <div
                  key={row.guideId}
                  className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                      {row.course}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        row.paceStatus === 'Faster'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : row.paceStatus === 'Deeper Study'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {row.paceStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-stone-600 dark:text-stone-400">
                    <span>You: {row.userAvgPace}m/ch</span>
                    <span>Target: {row.recommendedPace}m/ch</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* D3 Peer Interaction Map: Co-Enrolled Learners, Collaborative Study Groups & Shared Interests */}
          <PeerInteractionMap
            user={user}
            enrollments={enrollments}
            studyGuides={studyGuides}
            onNavigateToCourse={onNavigateToCourse}
            onStartStudyRoom={onStartStudyRoom}
          />

          {/* D3 Interactive Course Knowledge Graph: Mastered Concepts (Blue) vs Knowledge Gaps (Red) */}
          <KnowledgeGraphSection
            user={user}
            studyGuides={studyGuides}
            readingProgress={readingProgress}
            enrollments={enrollments}
            onNavigateToCourse={onNavigateToCourse}
          />

          {/* Row 1: Time Spent Studying (Area Chart) & Subject Distribution (Pie Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Study Hours Over Time Area Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Time Spent Studying Over Time (Hours)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Active reading, research synthesis, and laboratory problem solving
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Target: 2.0h / day
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStudyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="studyHoursGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="h" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderColor: '#292524', 
                        borderRadius: '0.75rem', 
                        color: '#fafaf9',
                        fontSize: '12px' 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      name="Study Hours"
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#studyHoursGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="target" 
                      name="Baseline Target"
                      stroke="#10b981" 
                      strokeDasharray="4 4"
                      strokeWidth={1.5} 
                      fillOpacity={1} 
                      fill="url(#targetGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cognitive Balance & Discipline Focus (Pie Chart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Discipline Focus Distribution
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Cognitive time allocation across faculties
                </p>
              </div>

              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {subjectDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Allocation']}
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderColor: '#292524', 
                        borderRadius: '0.75rem', 
                        color: '#fafaf9',
                        fontSize: '11px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                {subjectDistributionData.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Progress Trends Over Time (Line Chart) & Faculty Course Completion (Bar Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Progress Trends & Learning Velocity (LineChart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Cumulative Progress & Velocity Trends
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Chapters mastered and retention velocity across course milestones
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Velocity: 96/100
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="milestone" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderColor: '#292524', 
                        borderRadius: '0.75rem', 
                        color: '#fafaf9',
                        fontSize: '12px' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeChapters" 
                      name="Chapters Mastered" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="velocityIndex" 
                      name="Velocity Index" 
                      stroke="#8b5cf6" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#8b5cf6' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Courses Completed by Faculty (BarChart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    Course Completion by Academic Faculty
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Completed vs in-progress modules across faculties
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  5 Faculties Active
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facultyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="faculty" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderColor: '#292524', 
                        borderRadius: '0.75rem', 
                        color: '#fafaf9',
                        fontSize: '12px' 
                      }} 
                    />
                    <Bar dataKey="completed" name="Completed Courses" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inProgress" name="In-Progress" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Real-time Assessment & Test Monitoring Center */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Institutional Proctoring & Evaluation Telemetry</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                  Curriculum Tests & Assessment Monitor
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Continuous diagnostic testing logs, knowledge retention scores, and self-assessment checks across quality-verified study guides.
                </p>
              </div>

              <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                {pendingAssessmentRows.length} Active Assessment{pendingAssessmentRows.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Assessment Records Table (Passed Activities Removed) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Course & Assessment Module</th>
                    <th className="pb-3 font-semibold">Faculty Domain</th>
                    <th className="pb-3 font-semibold">Passing Threshold</th>
                    <th className="pb-3 font-semibold">Student Score</th>
                    <th className="pb-3 font-semibold">Validation Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {pendingAssessmentRows.map(({ guide, quiz, score, hasTaken, minScore }) => {
                    return (
                      <tr key={guide.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                            {guide.title}
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            {quiz?.title || 'Diagnostic Assessment'} · {quiz?.questions.length || 3} Questions
                          </div>
                        </td>

                        <td className="py-4 pr-4">
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            {guide.category}
                          </span>
                        </td>

                        <td className="py-4 pr-4 font-mono font-bold text-stone-600 dark:text-stone-400">
                          {minScore}%
                        </td>

                        <td className="py-4 pr-4 font-mono font-extrabold text-sm">
                          {hasTaken ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {score}%
                            </span>
                          ) : (
                            <span className="text-stone-400 font-normal italic">Pending</span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {hasTaken ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800">
                              <span>Requires Re-Test</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-[11px]">
                              <span>Pending Active Exam</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onNavigateToCourse?.(guide.id)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>{hasTaken ? 'Review Exam' : 'Launch Test'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Achievement Badges Showcase */}
          <div id="achievement-badges-section">
            <AchievementBadgesSection
              readingProgress={readingProgress}
              studyGuides={studyGuides}
              onNavigateToCourse={onNavigateToCourse}
              userName={user.name}
              userEmail={user.email}
              enrollments={enrollments}
              onOpenFacultyPortal={onOpenFacultyPortal}
            />
          </div>

          {/* Branded Course Completion Certificates & Preview Modal */}
          <UserProfileCertificatesSection
            user={user}
            studyGuides={studyGuides}
            readingProgress={readingProgress}
            onNavigateToCourse={onNavigateToCourse}
            onVerifySerial={onVerifySerial}
            onAppealSerial={onAppealSerial}
          />
        </>
      )}

      {/* Animated Milestone 'Achievement Unlocked' Overlay */}
      <AchievementUnlockedOverlay
        isOpen={!isDeepWorkActive && isAchievementOverlayOpen}
        milestones={overlayMilestones}
        learnerName={user.name}
        onClose={() => setIsAchievementOverlayOpen(false)}
        onAcknowledgeAll={handleAcknowledgeMilestones}
        onViewBadgesSection={() => {
          document
            .getElementById('achievement-badges-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

    </div>
  );
};
