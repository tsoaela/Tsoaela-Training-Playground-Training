import React, { useState, useMemo } from 'react';
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
  FileEdit
} from 'lucide-react';
import {
  UserProfile,
  ReadingProgress,
  StudyGuide,
  EnrolledStudentRecord,
  PomodoroSessionLog,
  SavedAcademicProgram,
  ApplicationPrefillData,
} from '../types';
import { AcademicCategoryKey } from '../data/academicCatalog';
import { AchievementBadgesSection } from './AchievementBadgesSection';
import { UserProfileCertificatesSection } from './UserProfileCertificatesSection';
import { ProfileEditCard } from './ProfileEditCard';
import { CourseProgressChart } from './CourseProgressChart';
import { SavedProgramsSection } from './SavedProgramsSection';
import { MilestoneProgressSection } from './MilestoneProgressSection';
import { PeerInteractionMap } from './PeerInteractionMap';
import { FocusAiPanel } from './FocusAiPanel';
import { KnowledgeGraphSection } from './KnowledgeGraphSection';

interface UserActivityDashboardTabProps {
  user: UserProfile;
  readingProgress: Record<string, ReadingProgress>;
  studyGuides: StudyGuide[];
  enrollments?: EnrolledStudentRecord[];
  onNavigateToCourse?: (guideId: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string) => void;
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
}

export const UserActivityDashboardTab: React.FC<UserActivityDashboardTabProps> = ({
  user,
  readingProgress,
  studyGuides,
  enrollments = [],
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
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [velocityFilter, setVelocityFilter] = useState<'all' | 'active'>('all');
  const [focusAiEnabled, setFocusAiEnabled] = useState<boolean>(false);

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

  // Total Study Time calculated from completed chapters + synced Pomodoro focus minutes + baseline hours
  const totalStudyHours = useMemo(() => {
    let totalMinutes = syncedFocusMinutes;
    studyGuides.forEach(g => {
      const p = readingProgress[g.id];
      if (p) {
        const completedCount = p.completedChapters?.length || 0;
        // Each chapter averages ~45 minutes of deep focus & notes
        totalMinutes += completedCount * 45;
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

      {/* Focus AI Mode Toggle & Gemini Study Priority Recommendations */}
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

      {/* Editable Scholar Profile Card */}
      {onUpdateProfile && (
        <ProfileEditCard
          user={user}
          onUpdateProfile={onUpdateProfile}
          syncedFocusMinutes={syncedFocusMinutes}
          completedSessions={completedPomodoroSessions}
        />
      )}

      {/* My Saved Programs Section (Bookmarked Academic Qualifications) */}
      {onRemoveSavedProgram && (
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

      {/* Gamified Milestone Progress Bar (Chapters + Unlocked Badges & Certificates Highlight) */}
      <MilestoneProgressSection
        studyGuides={studyGuides}
        readingProgress={readingProgress}
        onNavigateToCourse={onNavigateToCourse}
      />

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
              18 Days
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
              Top 5% consistency rank
            </span>
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

      {/* 30-Day Weekly Learning Time & Completed Chapters Chart */}
      <CourseProgressChart
        readingProgress={readingProgress}
        studyGuides={studyGuides}
        syncedFocusMinutes={syncedFocusMinutes}
        pomodoroLogs={pomodoroLogs}
      />

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
      <AchievementBadgesSection
        readingProgress={readingProgress}
        studyGuides={studyGuides}
        onNavigateToCourse={onNavigateToCourse}
        userName={user.name}
        userEmail={user.email}
        enrollments={enrollments}
        onOpenFacultyPortal={onOpenFacultyPortal}
      />

      {/* Branded Course Completion Certificates & Preview Modal */}
      <UserProfileCertificatesSection
        user={user}
        studyGuides={studyGuides}
        readingProgress={readingProgress}
        onNavigateToCourse={onNavigateToCourse}
      />

    </div>
  );
};
