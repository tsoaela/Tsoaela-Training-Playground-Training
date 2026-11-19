import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Compass,
  GitBranch,
  GraduationCap,
  Lock,
  Play,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import {
  EnrolledStudentRecord,
  ReadingProgress,
  StudyGuide,
  UserProfile,
} from '../types';
import { getStudyGuideNqfLevel } from '../utils/catalogOrganization';

interface StudyRoadmapProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  enrollments: EnrolledStudentRecord[];
  unlockedLongCourseIds?: string[];
  onOpenGuide: (guideId: string) => void;
  onUnlockLongCourse?: (guide: StudyGuide) => void;
  onEnrollInCourse?: (guide: StudyGuide) => void;
}

interface RoadmapNode {
  guide: StudyGuide;
  stage: 1 | 2 | 3;
  stageLabel: string;
  nqfLevel: number;
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  isUnlocked: boolean;
  prerequisiteIds: string[];
  recommendedNextIds: string[];
  longTermSequenceOrder?: number;
  sequencingRationale: string;
}

function buildCoursePrerequisiteIds(
  guide: StudyGuide,
  allGuides: StudyGuide[]
): string[] {
  const byId = new Set(allGuides.map((g) => g.id));

  if (guide.id === 'sg_foundations_systems') {
    return [];
  }

  if (guide.id === 'sg_ai_test_time_search') {
    return byId.has('sg_foundations_systems') ? ['sg_foundations_systems'] : [];
  }

  if (guide.id === 'sg_ai_swarm_consensus') {
    const reqs: string[] = [];
    if (byId.has('sg_foundations_systems')) reqs.push('sg_foundations_systems');
    if (byId.has('sg_ai_test_time_search')) reqs.push('sg_ai_test_time_search');
    return reqs;
  }

  if (guide.id === 'sg_long_term_leadership') {
    return byId.has('sg_foundations_systems') ? ['sg_foundations_systems'] : [];
  }

  if (guide.id === 'sg_long_term_applied_systems') {
    const reqs: string[] = [];
    if (byId.has('sg_foundations_systems')) reqs.push('sg_foundations_systems');
    if (byId.has('sg_ai_swarm_consensus')) reqs.push('sg_ai_swarm_consensus');
    if (byId.has('sg_long_term_leadership')) reqs.push('sg_long_term_leadership');
    return reqs;
  }

  // Fallback for AI-generated or custom courses
  if (guide.duration_type === 'long_term') {
    const foundation = allGuides.find(
      (g) => g.duration_type === 'short_term' && g.difficulty === 'Foundational' && g.id !== guide.id
    );
    return foundation ? [foundation.id] : [];
  }

  if (guide.difficulty === 'Advanced' || guide.difficulty === 'Executive') {
    const foundation = allGuides.find(
      (g) => g.duration_type === 'short_term' && g.difficulty === 'Foundational' && g.id !== guide.id
    );
    return foundation ? [foundation.id] : [];
  }

  return [];
}

function buildSequencingRationale(guide: StudyGuide, longTermSequenceOrder?: number): string {
  if (guide.id === 'sg_foundations_systems') {
    return 'Entry axiom module: establishes first-principles decomposition and feedback boundary analysis required by all advanced and long-term tracks.';
  }
  if (guide.id === 'sg_ai_test_time_search') {
    return 'Builds on foundational systems thinking to explore inference-time compute allocation and process reward verification.';
  }
  if (guide.id === 'sg_ai_swarm_consensus') {
    return 'Extends single-model search verification into multi-agent quorum protocols and distributed fault tolerance.';
  }
  if (guide.id === 'sg_long_term_leadership') {
    return `Suggested Long-Term Track #${longTermSequenceOrder ?? 1}: take first among R145 long-term courses to frame 7-year governance horizons before deep mechanism engineering.`;
  }
  if (guide.id === 'sg_long_term_applied_systems') {
    return `Suggested Long-Term Track #${longTermSequenceOrder ?? 2}: follow Global Institutional Leadership and Swarm Consensus with hands-on incentive-compatible mechanism design.`;
  }
  if (guide.duration_type === 'long_term') {
    return `Suggested Long-Term Track #${longTermSequenceOrder ?? 3}: self-paced R145 specialization sequenced after completing foundational short-term modules.`;
  }
  return 'Self-paced specialization module aligned with your current NQF progression.';
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({
  user,
  studyGuides,
  readingProgress,
  enrollments,
  unlockedLongCourseIds = [],
  onOpenGuide,
  onUnlockLongCourse,
  onEnrollInCourse,
}) => {
  const [scope, setScope] = useState<'enrolled' | 'all'>('enrolled');
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  const roadmapNodes = useMemo<RoadmapNode[]>(() => {
    const longTermOrdered = studyGuides
      .filter((g) => g.duration_type === 'long_term')
      .sort((a, b) => {
        if (a.id === 'sg_long_term_leadership') return -1;
        if (b.id === 'sg_long_term_leadership') return 1;
        if (a.id === 'sg_long_term_applied_systems') return -1;
        if (b.id === 'sg_long_term_applied_systems') return 1;
        return getStudyGuideNqfLevel(a) - getStudyGuideNqfLevel(b);
      });

    const longTermOrderMap = new Map<string, number>();
    longTermOrdered.forEach((g, idx) => longTermOrderMap.set(g.id, idx + 1));

    const userEmail = user.email.trim().toLowerCase();
    const userName = user.name.trim().toLowerCase();

    const baseNodes = studyGuides.map((guide) => {
      const progress = readingProgress[guide.id];
      const totalChapters = guide.chapters?.length || 1;
      const completedChapters = progress?.completedChapters?.length || 0;
      const progressPercent = Math.min(100, Math.round(progress?.progressPercent || 0));
      const isCompleted = Boolean(progress?.isCompleted || progressPercent >= 100);

      const hasFacultyEnrollment = enrollments.some(
        (e) =>
          e.courseId === guide.id &&
          (e.studentEmail.trim().toLowerCase() === userEmail ||
            e.studentName.trim().toLowerCase() === userName)
      );

      const hasStartedReading = Boolean(progress && (completedChapters > 0 || progressPercent > 0 || isCompleted));
      const isLongTermUnlocked =
        guide.duration_type === 'short_term' ||
        unlockedLongCourseIds.includes(guide.id) ||
        user.subscription_tier === 'educare_pro' ||
        user.subscription_tier === 'all_access';

      const isEnrolled =
        hasFacultyEnrollment ||
        hasStartedReading ||
        (guide.duration_type === 'long_term' && unlockedLongCourseIds.includes(guide.id));

      const stage: 1 | 2 | 3 =
        guide.duration_type === 'long_term'
          ? 3
          : guide.difficulty === 'Foundational'
          ? 1
          : 2;

      const stageLabel =
        stage === 1
          ? 'Stage 1 · Foundations'
          : stage === 2
          ? 'Stage 2 · Core Specializations'
          : 'Stage 3 · Long-Term Sequence';

      const longTermSequenceOrder = longTermOrderMap.get(guide.id);
      const prerequisiteIds = buildCoursePrerequisiteIds(guide, studyGuides);

      return {
        guide,
        stage,
        stageLabel,
        nqfLevel: getStudyGuideNqfLevel(guide),
        progressPercent,
        completedChapters,
        totalChapters,
        isCompleted,
        isEnrolled,
        isUnlocked: isLongTermUnlocked,
        prerequisiteIds,
        recommendedNextIds: [] as string[],
        longTermSequenceOrder,
        sequencingRationale: buildSequencingRationale(guide, longTermSequenceOrder),
      };
    });

    // Populate forward links ("leads to")
    for (const node of baseNodes) {
      node.recommendedNextIds = baseNodes
        .filter((candidate) => candidate.prerequisiteIds.includes(node.guide.id))
        .map((candidate) => candidate.guide.id);
    }

    return baseNodes;
  }, [studyGuides, readingProgress, enrollments, unlockedLongCourseIds, user.email, user.name, user.subscription_tier]);

  const nodeById = useMemo(() => {
    const map = new Map<string, RoadmapNode>();
    roadmapNodes.forEach((n) => map.set(n.guide.id, n));
    return map;
  }, [roadmapNodes]);

  const enrolledNodes = useMemo(
    () => roadmapNodes.filter((n) => n.isEnrolled),
    [roadmapNodes]
  );

  // When scope === 'enrolled', display all enrolled courses plus any direct unmet prerequisites
  // or next long-term sequence targets so learners can see prerequisites and continuation steps
  const visibleNodes = useMemo(() => {
    if (scope === 'all' || enrolledNodes.length === 0) {
      return roadmapNodes;
    }

    const visibleIds = new Set<string>(enrolledNodes.map((n) => n.guide.id));
    // Include prerequisites of enrolled courses so prerequisites highlight cleanly
    enrolledNodes.forEach((n) => {
      n.prerequisiteIds.forEach((pid) => visibleIds.add(pid));
    });
    // Include suggested long-term courses in sequence so users can plan ahead
    roadmapNodes
      .filter((n) => n.stage === 3)
      .forEach((n) => visibleIds.add(n.guide.id));

    return roadmapNodes.filter((n) => visibleIds.has(n.guide.id));
  }, [scope, roadmapNodes, enrolledNodes]);

  const stages = useMemo(
    () => [
      {
        stage: 1 as const,
        title: '1. Foundational Prerequisites',
        subtitle: 'Free Short Courses · Entry Axioms',
        nodes: visibleNodes.filter((n) => n.stage === 1),
      },
      {
        stage: 2 as const,
        title: '2. Core Specializations',
        subtitle: 'Free Short Courses · Technical Depth',
        nodes: visibleNodes.filter((n) => n.stage === 2),
      },
      {
        stage: 3 as const,
        title: '3. Long-Term Course Sequence',
        subtitle: 'R145 / Course · Self-Paced Mastery',
        nodes: visibleNodes
          .filter((n) => n.stage === 3)
          .sort(
            (a, b) =>
              (a.longTermSequenceOrder ?? 99) - (b.longTermSequenceOrder ?? 99)
          ),
      },
    ],
    [visibleNodes]
  );

  const selectedNode = useMemo(() => {
    if (selectedGuideId && nodeById.has(selectedGuideId)) {
      return nodeById.get(selectedGuideId)!;
    }
    return (
      enrolledNodes.find((n) => !n.isCompleted) ||
      enrolledNodes[0] ||
      roadmapNodes.find((n) => n.stage === 3) ||
      roadmapNodes[0] ||
      null
    );
  }, [selectedGuideId, nodeById, enrolledNodes, roadmapNodes]);

  const summaryStats = useMemo(() => {
    const completedEnrolled = enrolledNodes.filter((n) => n.isCompleted).length;
    const longTermNodes = roadmapNodes.filter((n) => n.stage === 3);
    const unlockedLongTerm = longTermNodes.filter((n) => n.isUnlocked).length;
    const completedLongTerm = longTermNodes.filter((n) => n.isCompleted).length;

    const avgEnrolledProgress =
      enrolledNodes.length > 0
        ? Math.round(
            enrolledNodes.reduce((sum, n) => sum + n.progressPercent, 0) /
              enrolledNodes.length
          )
        : 0;

    return {
      enrolledCount: enrolledNodes.length,
      completedEnrolled,
      avgEnrolledProgress,
      longTermTotal: longTermNodes.length,
      unlockedLongTerm,
      completedLongTerm,
    };
  }, [enrolledNodes, roadmapNodes]);

  if (roadmapNodes.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section
        aria-label="Study Roadmap Progression Visualization"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <GitBranch className="w-4 h-4" />
              <span>Study Roadmap &amp; Course Sequencing</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Your Enrolled Progression &amp; Long-Term Tutoring Sequence
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl">
              Maps all enrolled study guides from foundational prerequisites into suggested self-paced R145 long-term courses. Select any node to inspect prerequisite readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1">
              <button
                type="button"
                onClick={() => setScope('enrolled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  scope === 'enrolled'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Enrolled &amp; Next Sequence ({enrolledNodes.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  scope === 'all'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Full Curriculum ({roadmapNodes.length})
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-100 dark:divide-stone-800 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="px-5 py-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Enrolled Courses
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {summaryStats.enrolledCount}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {summaryStats.completedEnrolled} completed
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Active Mastery Avg
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {summaryStats.avgEnrolledProgress}%
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                self-paced progress
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Long-Term Sequence
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                {summaryStats.unlockedLongTerm}/{summaryStats.longTermTotal}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                R145 tracks unlocked
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Recommended Next Step
            </span>
            <div className="mt-0.5 text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
              {selectedNode ? selectedNode.guide.title : 'Select a course node'}
            </div>
          </div>
        </div>

        {/* 3-Stage Progression Map */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch relative">
            {stages.map((col, colIdx) => (
              <div
                key={col.stage}
                className="relative flex flex-col rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 p-4 space-y-3"
              >
                {/* Stage Column Header */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-200/80 dark:border-stone-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                      {col.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {col.subtitle}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 tabular-nums shrink-0">
                    {col.nodes.length} {col.nodes.length === 1 ? 'Course' : 'Courses'}
                  </span>
                </div>

                {/* Course Nodes inside Stage */}
                <div className="space-y-3 flex-1">
                  {col.nodes.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500 dark:text-stone-400">
                      No courses mapped in this stage under the current filter.
                    </div>
                  ) : (
                    col.nodes.map((node, nodeIdx) => {
                      const isSelected = selectedNode?.guide.id === node.guide.id;
                      const prereqsMetCount = node.prerequisiteIds.filter(
                        (pid) => nodeById.get(pid)?.isCompleted
                      ).length;
                      const allPrereqsMet =
                        node.prerequisiteIds.length === 0 ||
                        prereqsMetCount === node.prerequisiteIds.length;

                      return (
                        <React.Fragment key={node.guide.id}>
                          {/* Sequential connector between Long-Term Courses */}
                          {col.stage === 3 && nodeIdx > 0 && (
                            <div className="flex items-center justify-center gap-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                              <ArrowDown className="w-3.5 h-3.5" />
                              <span>Suggested Next in Long-Term Sequence</span>
                            </div>
                          )}

                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedGuideId(node.guide.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedGuideId(node.guide.id);
                              }
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                              isSelected
                                ? 'bg-white dark:bg-stone-900 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                                : node.isCompleted
                                ? 'bg-white dark:bg-stone-900 border-emerald-200 dark:border-emerald-900/70 hover:border-emerald-400'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                            }`}
                          >
                            {/* Node Top Meta */}
                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                {node.stage === 3 && node.longTermSequenceOrder && (
                                  <span className="font-bold text-amber-700 dark:text-amber-400">
                                    Seq #{node.longTermSequenceOrder}
                                  </span>
                                )}
                                {node.stage === 3 && node.longTermSequenceOrder && (
                                  <span className="text-stone-400">·</span>
                                )}
                                <span className="text-stone-500 dark:text-stone-400">
                                  NQF {node.nqfLevel}
                                </span>
                                <span className="text-stone-400">·</span>
                                <span
                                  className={
                                    node.isEnrolled
                                      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                      : 'text-stone-500 dark:text-stone-400'
                                  }
                                >
                                  {node.isEnrolled ? 'Enrolled' : 'Recommended'}
                                </span>
                              </div>

                              <span className="shrink-0 flex items-center gap-1 font-semibold">
                                {node.isCompleted ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    100%
                                  </span>
                                ) : !node.isUnlocked ? (
                                  <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    R145
                                  </span>
                                ) : (
                                  <span className="text-stone-700 dark:text-stone-300 tabular-nums">
                                    {node.progressPercent}%
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Course Title */}
                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                              {node.guide.title}
                            </h4>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  node.isCompleted
                                    ? 'bg-emerald-500'
                                    : node.progressPercent > 0
                                    ? 'bg-amber-500'
                                    : 'bg-stone-300 dark:bg-stone-700'
                                }`}
                                style={{ width: `${node.progressPercent}%` }}
                              />
                            </div>

                            {/* Prerequisite Readiness Line */}
                            <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                              {node.prerequisiteIds.length === 0 ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>No prerequisites · Open start</span>
                                </span>
                              ) : (
                                <span
                                  className={`font-medium inline-flex items-center gap-1 ${
                                    allPrereqsMet
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-amber-700 dark:text-amber-400'
                                  }`}
                                >
                                  <CircleDot className="w-3 h-3 shrink-0" />
                                  <span>
                                    Prerequisites: {prereqsMetCount}/{node.prerequisiteIds.length}{' '}
                                    {allPrereqsMet ? 'Ready' : 'In Progress'}
                                  </span>
                                </span>
                              )}

                              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>

                {/* Desktop Connector Arrow between Stage Columns */}
                {colIdx < stages.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex items-center justify-center absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 shadow-2xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Course Prerequisite & Sequencing Inspector */}
          {selectedNode && (
            <div className="mt-5 p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  <span className="font-bold text-stone-900 dark:text-stone-100 uppercase">
                    {selectedNode.stageLabel}
                  </span>
                  <span>·</span>
                  <span>NQF Level {selectedNode.nqfLevel}</span>
                  <span>·</span>
                  <span>
                    {selectedNode.guide.duration_type === 'long_term'
                      ? 'Long-Term Track (R145 · Self-Paced)'
                      : 'Short Course (Free · Self-Paced)'}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {selectedNode.completedChapters}/{selectedNode.totalChapters} Chapters ({selectedNode.progressPercent}%)
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {selectedNode.guide.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {selectedNode.sequencingRationale}
                  </p>
                </div>

                {/* Prerequisites & Next Sequence Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mr-1">
                      Prerequisites:
                    </span>
                    {selectedNode.prerequisiteIds.length === 0 ? (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        None required — begin immediately
                      </span>
                    ) : (
                      selectedNode.prerequisiteIds.map((pid) => {
                        const prereq = nodeById.get(pid);
                        if (!prereq) return null;
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setSelectedGuideId(pid)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              prereq.isCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                            }`}
                          >
                            {prereq.isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Compass className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px]">
                              {prereq.guide.title}
                            </span>
                            <span className="font-mono text-[10px] opacity-80 tabular-nums">
                              {prereq.progressPercent}%
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Action CTA Cluster */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!selectedNode.isUnlocked && onUnlockLongCourse ? (
                  <button
                    type="button"
                    onClick={() => onUnlockLongCourse(selectedNode.guide)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Long-Term Course (R145)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenGuide(selectedNode.guide.id)}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {selectedNode.progressPercent > 0 ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Continue Study Guide</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Start Study Guide</span>
                      </>
                    )}
                  </button>
                )}

                {!selectedNode.isEnrolled &&
                  selectedNode.guide.duration_type === 'short_term' &&
                  onEnrollInCourse && (
                    <button
                      type="button"
                      onClick={() => onEnrollInCourse(selectedNode.guide)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Enroll Free</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
