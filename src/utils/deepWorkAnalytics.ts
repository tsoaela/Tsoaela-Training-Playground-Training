import {
  DeepWorkSessionRecord,
  DeepWorkState,
  PomodoroSessionLog,
  StudyGuide,
} from '../types';

export interface DeepWorkHourSlot {
  slotIndex: number;
  label: string;
  shortLabel: string;
  startHour: number;
  endHour: number;
}

export const THREE_HOUR_WINDOWS: DeepWorkHourSlot[] = [
  { slotIndex: 0, label: '00:00 – 03:00', shortLabel: '00–03', startHour: 0, endHour: 3 },
  { slotIndex: 1, label: '03:00 – 06:00', shortLabel: '03–06', startHour: 3, endHour: 6 },
  { slotIndex: 2, label: '06:00 – 09:00', shortLabel: '06–09', startHour: 6, endHour: 9 },
  { slotIndex: 3, label: '09:00 – 12:00', shortLabel: '09–12', startHour: 9, endHour: 12 },
  { slotIndex: 4, label: '12:00 – 15:00', shortLabel: '12–15', startHour: 12, endHour: 15 },
  { slotIndex: 5, label: '15:00 – 18:00', shortLabel: '15–18', startHour: 15, endHour: 18 },
  { slotIndex: 6, label: '18:00 – 21:00', shortLabel: '18–21', startHour: 18, endHour: 21 },
  { slotIndex: 7, label: '21:00 – 24:00', shortLabel: '21–24', startHour: 21, endHour: 24 },
];

export const HOURLY_WINDOWS: DeepWorkHourSlot[] = Array.from({ length: 24 }, (_, hr) => ({
  slotIndex: hr,
  label: `${String(hr).padStart(2, '0')}:00 – ${String(hr + 1).padStart(2, '0')}:00`,
  shortLabel: `${String(hr).padStart(2, '0')}h`,
  startHour: hr,
  endHour: hr + 1,
}));

export interface DeepWorkDayColumn {
  dateKey: string; // YYYY-MM-DD local
  shortDate: string; // e.g. Mar 14
  weekday: string; // Mon, Tue...
  dayNumber: number;
  isToday: boolean;
  totalMinutes: number;
  sessionsCount: number;
}

export interface DeepWorkHeatmapCell {
  id: string;
  dateKey: string;
  shortDate: string;
  weekday: string;
  slotIndex: number;
  slotLabel: string;
  totalMinutes: number;
  completedMinutes: number;
  interruptedMinutes: number;
  sessionsCount: number;
  completedCount: number;
  interruptedCount: number;
  distractionsBlocked: number;
  topCourseTitle: string | null;
  topCourseId: string | null;
  sessions: Array<{
    id: string;
    guideId: string;
    guideTitle: string;
    elapsedMinutes: number;
    status: 'completed' | 'interrupted' | 'live';
    startedAt: string;
  }>;
}

export interface DeepWorkHeatmapSummary {
  days: DeepWorkDayColumn[];
  slots: DeepWorkHourSlot[];
  cells: DeepWorkHeatmapCell[];
  maxCellMinutes: number;
  totalMinutes30d: number;
  totalHours30d: number;
  totalSessions30d: number;
  completedSessions30d: number;
  completionDisciplinePercent: number;
  activeDaysCount: number;
  peakWindowLabel: string;
  peakWindowMinutes: number;
  peakSingleHourLabel: string;
  peakSingleHourMinutes: number;
  peakSlotIndex: number;
  avgMinutesPerActiveDay: number;
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDeepWorkHeatmapData(params: {
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides?: StudyGuide[];
  resolution: '3h' | '1h';
  includePomodoroFocus?: boolean;
}): DeepWorkHeatmapSummary {
  const {
    deepWorkState,
    pomodoroLogs = [],
    studyGuides = [],
    resolution,
    includePomodoroFocus = false,
  } = params;

  const slots = resolution === '3h' ? THREE_HOUR_WINDOWS : HOURLY_WINDOWS;

  // Build 30-day rolling calendar ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DeepWorkDayColumn[] = [];
  const dayMap = new Map<string, DeepWorkDayColumn>();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - offset);
    const dateKey = toLocalDateKey(dt);
    const col: DeepWorkDayColumn = {
      dateKey,
      shortDate: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: dt.getDate(),
      isToday: offset === 0,
      totalMinutes: 0,
      sessionsCount: 0,
    };
    days.push(col);
    dayMap.set(dateKey, col);
  }

  // Initialize every cell
  const cellMap = new Map<string, DeepWorkHeatmapCell>();
  for (const day of days) {
    for (const slot of slots) {
      const id = `${day.dateKey}__${slot.slotIndex}`;
      cellMap.set(id, {
        id,
        dateKey: day.dateKey,
        shortDate: day.shortDate,
        weekday: day.weekday,
        slotIndex: slot.slotIndex,
        slotLabel: slot.label,
        totalMinutes: 0,
        completedMinutes: 0,
        interruptedMinutes: 0,
        sessionsCount: 0,
        completedCount: 0,
        interruptedCount: 0,
        distractionsBlocked: 0,
        topCourseTitle: null,
        topCourseId: null,
        sessions: [],
      });
    }
  }

  // Hourly minutes accumulator across all 30 days to compute peak single hour + peak 3h window
  const hourlyTotals = new Array<number>(24).fill(0);
  const window3hTotals = new Array<number>(8).fill(0);

  const appendEvent = (event: {
    id: string;
    guideId: string;
    guideTitle: string;
    elapsedMinutes: number;
    status: 'completed' | 'interrupted' | 'live';
    startedAt: string;
    distractionsBlocked: number;
  }) => {
    const dt = new Date(event.startedAt);
    if (Number.isNaN(dt.getTime())) return;
    const dateKey = toLocalDateKey(dt);
    const dayCol = dayMap.get(dateKey);
    if (!dayCol) return;

    const hour = dt.getHours();
    const safeMinutes = Math.max(1, Math.round(event.elapsedMinutes));
    hourlyTotals[hour] += safeMinutes;
    window3hTotals[Math.floor(hour / 3)] += safeMinutes;

    const slotIdx = resolution === '3h' ? Math.floor(hour / 3) : hour;
    const cell = cellMap.get(`${dateKey}__${slotIdx}`);
    if (!cell) return;

    cell.totalMinutes += safeMinutes;
    if (event.status === 'interrupted') {
      cell.interruptedMinutes += safeMinutes;
      cell.interruptedCount += 1;
    } else {
      cell.completedMinutes += safeMinutes;
      cell.completedCount += 1;
    }
    cell.sessionsCount += 1;
    cell.distractionsBlocked += event.distractionsBlocked;
    cell.sessions.push({
      id: event.id,
      guideId: event.guideId,
      guideTitle: event.guideTitle,
      elapsedMinutes: safeMinutes,
      status: event.status,
      startedAt: event.startedAt,
    });

    dayCol.totalMinutes += safeMinutes;
    dayCol.sessionsCount += 1;
  };

  const history = deepWorkState?.sessionsHistory || [];
  history.forEach((rec) => {
    appendEvent({
      id: rec.id,
      guideId: rec.guideId,
      guideTitle: rec.guideTitle,
      elapsedMinutes: rec.elapsedMinutes,
      status: rec.status,
      startedAt: rec.startedAt,
      distractionsBlocked: rec.distractionsBlockedCount || 0,
    });
  });

  // Include active Deep Work session elapsed progress in real time
  if (deepWorkState?.isActive && deepWorkState.startedAt) {
    const totalSecs = Math.max(60, deepWorkState.plannedMinutes * 60);
    const elapsedSecs = Math.max(0, totalSecs - deepWorkState.remainingSeconds);
    const liveMinutes = Math.floor(elapsedSecs / 60);
    if (liveMinutes >= 1) {
      const linkedGuide = studyGuides.find((g) => g.id === deepWorkState.linkedGuideId);
      appendEvent({
        id: 'dw_live_active',
        guideId: deepWorkState.linkedGuideId,
        guideTitle: linkedGuide?.title || 'Active Deep Work Block',
        elapsedMinutes: liveMinutes,
        status: 'live',
        startedAt: deepWorkState.startedAt,
        distractionsBlocked: deepWorkState.suppressedDistractionsCount || 0,
      });
    }
  }

  // Optionally layer standard Pomodoro focus logs not already captured by Deep Work
  if (includePomodoroFocus) {
    pomodoroLogs
      .filter((log) => log.phase === 'focus')
      .forEach((log) => {
        if (log.guideTitle && /\(deep work\)/i.test(log.guideTitle)) {
          return;
        }
        const matchedGuide = studyGuides.find(
          (g) => log.guideTitle && g.title.toLowerCase() === log.guideTitle.toLowerCase()
        );
        appendEvent({
          id: `pom_${log.id}`,
          guideId: matchedGuide?.id || 'pomodoro_focus',
          guideTitle: log.guideTitle || 'Pomodoro Focus Interval',
          elapsedMinutes: log.durationMinutes,
          status: 'completed',
          startedAt: log.completedAt,
          distractionsBlocked: 0,
        });
      });
  }

  // Resolve top course per cell
  let maxCellMinutes = 0;
  const cells: DeepWorkHeatmapCell[] = [];
  cellMap.forEach((cell) => {
    if (cell.totalMinutes > maxCellMinutes) {
      maxCellMinutes = cell.totalMinutes;
    }
    if (cell.sessions.length > 0) {
      const byCourse = new Map<string, { title: string; minutes: number }>();
      cell.sessions.forEach((s) => {
        const cur = byCourse.get(s.guideId) || { title: s.guideTitle, minutes: 0 };
        cur.minutes += s.elapsedMinutes;
        byCourse.set(s.guideId, cur);
      });
      let bestId: string | null = null;
      let bestTitle: string | null = null;
      let bestMin = -1;
      byCourse.forEach((val, key) => {
        if (val.minutes > bestMin) {
          bestMin = val.minutes;
          bestId = key;
          bestTitle = val.title;
        }
      });
      cell.topCourseId = bestId;
      cell.topCourseTitle = bestTitle;
    }
    cells.push(cell);
  });

  const totalMinutes30d = days.reduce((s, d) => s + d.totalMinutes, 0);
  const totalSessions30d = days.reduce((s, d) => s + d.sessionsCount, 0);
  const completedSessions30d = cells.reduce((s, c) => s + c.completedCount, 0);
  const activeDaysCount = days.filter((d) => d.totalMinutes > 0).length;

  // Peak 3-hour window
  let peakWindowIdx = 3; // Default 09:00-12:00
  let peakWindowMinutes = -1;
  window3hTotals.forEach((mins, idx) => {
    if (mins > peakWindowMinutes) {
      peakWindowMinutes = mins;
      peakWindowIdx = idx;
    }
  });

  // Peak single hour
  let peakHour = 9;
  let peakSingleHourMinutes = -1;
  hourlyTotals.forEach((mins, hr) => {
    if (mins > peakSingleHourMinutes) {
      peakSingleHourMinutes = mins;
      peakHour = hr;
    }
  });

  const peakSlotIndex = resolution === '3h' ? peakWindowIdx : peakHour;

  return {
    days,
    slots,
    cells,
    maxCellMinutes: Math.max(30, maxCellMinutes),
    totalMinutes30d,
    totalHours30d: parseFloat((totalMinutes30d / 60).toFixed(1)),
    totalSessions30d,
    completedSessions30d,
    completionDisciplinePercent:
      totalSessions30d > 0
        ? Math.round((completedSessions30d / totalSessions30d) * 100)
        : 100,
    activeDaysCount,
    peakWindowLabel: THREE_HOUR_WINDOWS[peakWindowIdx]?.label || '09:00 – 12:00',
    peakWindowMinutes: Math.max(0, peakWindowMinutes),
    peakSingleHourLabel: `${String(peakHour).padStart(2, '0')}:00 – ${String(
      (peakHour + 1) % 24
    ).padStart(2, '0')}:00`,
    peakSingleHourMinutes: Math.max(0, peakSingleHourMinutes),
    peakSlotIndex,
    avgMinutesPerActiveDay:
      activeDaysCount > 0 ? Math.round(totalMinutes30d / activeDaysCount) : 0,
  };
}

export interface WeeklyChallengeMilestone {
  id: string;
  targetHours: number;
  title: string;
  badgeTitle: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Obsidian';
  subtitle: string;
  rewardNarrative: string;
  unlocked: boolean;
  progressPercent: number;
  remainingMinutes: number;
}

export interface WeeklyFocusChallengeMetrics {
  weekKey: string;
  weekRangeLabel: string;
  daysRemainingInWeek: number;
  weeklyMinutes: number;
  weeklyHours: number;
  weeklyCompletedBlocks: number;
  weeklyInterruptedBlocks: number;
  weeklyDistractionsBlocked: number;
  liveSessionMinutesAdded: number;
  milestones: WeeklyChallengeMilestone[];
  unlockedCount: number;
  nextMilestone: WeeklyChallengeMilestone | null;
  primaryTargetHours: number; // 10 Hours of Deep Work
  primaryProgressPercent: number;
}

function getMondayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export function computeWeeklyFocusChallengeMetrics(params: {
  deepWorkState?: DeepWorkState;
  sessionsHistory?: DeepWorkSessionRecord[];
}): WeeklyFocusChallengeMetrics {
  const now = new Date();
  const monday = getMondayStart(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayTs = monday.getTime();
  const sundayTs = sunday.getTime();

  const weekKey = toLocalDateKey(monday);
  const weekRangeLabel = `${monday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${sunday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor((todayMidnight.getTime() - mondayTs) / 86400000);
  const daysRemainingInWeek = Math.max(1, 7 - daysElapsed);

  const history = params.sessionsHistory ?? params.deepWorkState?.sessionsHistory ?? [];

  let weeklyMinutes = 0;
  let weeklyCompletedBlocks = 0;
  let weeklyInterruptedBlocks = 0;
  let weeklyDistractionsBlocked = 0;

  history.forEach((rec) => {
    const dt = new Date(rec.startedAt);
    const ts = dt.getTime();
    if (Number.isNaN(ts) || ts < mondayTs || ts > sundayTs) return;
    weeklyMinutes += Math.max(0, rec.elapsedMinutes || 0);
    weeklyDistractionsBlocked += rec.distractionsBlockedCount || 0;
    if (rec.status === 'completed') {
      weeklyCompletedBlocks += 1;
    } else {
      weeklyInterruptedBlocks += 1;
    }
  });

  let liveSessionMinutesAdded = 0;
  if (params.deepWorkState?.isActive) {
    const totalSecs = Math.max(60, params.deepWorkState.plannedMinutes * 60);
    const elapsedSecs = Math.max(0, totalSecs - params.deepWorkState.remainingSeconds);
    liveSessionMinutesAdded = Math.floor(elapsedSecs / 60);
    weeklyMinutes += liveSessionMinutesAdded;
    weeklyDistractionsBlocked += params.deepWorkState.suppressedDistractionsCount || 0;
  }

  const weeklyHours = parseFloat((weeklyMinutes / 60).toFixed(2));

  const milestoneSpecs: Array<{
    id: string;
    targetHours: number;
    title: string;
    badgeTitle: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Obsidian';
    subtitle: string;
    rewardNarrative: string;
  }> = [
    {
      id: 'dwc_2h',
      targetHours: 2,
      title: '2 Hours of Deep Work',
      badgeTitle: 'Ignition Sprint Crest',
      tier: 'Bronze',
      subtitle: 'Weekly Deep Focus Threshold · 120 min',
      rewardNarrative: 'Builds weekly cognitive momentum with two uninterrupted focus blocks.',
    },
    {
      id: 'dwc_5h',
      targetHours: 5,
      title: '5 Hours of Deep Work',
      badgeTitle: 'Flow Architect Emblem',
      tier: 'Silver',
      subtitle: 'Halfway Mastery Milestone · 300 min',
      rewardNarrative: 'Sustained distraction-free mastery across multiple curriculum sessions.',
    },
    {
      id: 'dwc_10h',
      targetHours: 10,
      title: '10 Hours of Deep Work',
      badgeTitle: 'Deep Work Vanguard Seal',
      tier: 'Gold',
      subtitle: 'Flagship Weekly Challenge · 600 min',
      rewardNarrative:
        'Premier digital badge awarded for completing 10 hours of shielded Deep Work in a single week.',
    },
    {
      id: 'dwc_15h',
      targetHours: 15,
      title: '15 Hours of Deep Work',
      badgeTitle: 'Ultradian Grandmaster Medallion',
      tier: 'Obsidian',
      subtitle: 'Elite Research Cohort Distinction · 900 min',
      rewardNarrative: 'Top-tier scholar endurance badge for sustained weekly deep-focus discipline.',
    },
  ];

  const milestones: WeeklyChallengeMilestone[] = milestoneSpecs.map((spec) => {
    const targetMinutes = spec.targetHours * 60;
    const unlocked = weeklyMinutes >= targetMinutes;
    const progressPercent = Math.min(100, Math.round((weeklyMinutes / targetMinutes) * 100));
    const remainingMinutes = Math.max(0, Math.round(targetMinutes - weeklyMinutes));
    return {
      ...spec,
      unlocked,
      progressPercent,
      remainingMinutes,
    };
  });

  const unlockedCount = milestones.filter((m) => m.unlocked).length;
  const nextMilestone = milestones.find((m) => !m.unlocked) || null;
  const primaryTargetHours = 10;
  const primaryProgressPercent = Math.min(
    100,
    Math.round((weeklyMinutes / (primaryTargetHours * 60)) * 100)
  );

  return {
    weekKey,
    weekRangeLabel,
    daysRemainingInWeek,
    weeklyMinutes,
    weeklyHours,
    weeklyCompletedBlocks,
    weeklyInterruptedBlocks,
    weeklyDistractionsBlocked,
    liveSessionMinutesAdded,
    milestones,
    unlockedCount,
    nextMilestone,
    primaryTargetHours,
    primaryProgressPercent,
  };
}

// ----------------------------------------------------
// Deep Work Marathon (3-Hour Focus Block -> Master of Focus Badge)
// ----------------------------------------------------

export const MARATHON_BLOCK_MINUTES = 180; // 3 hours

export interface DeepWorkMarathonMetrics {
  targetBlockMinutes: number;
  completedMarathonBlocks: number;
  bestSingleBlockMinutes: number;
  liveActiveMinutes: number;
  isLiveMarathonBlock: boolean;
  progressMinutesTowardMarathon: number;
  progressPercent: number;
  masterOfFocusUnlocked: boolean;
  marathonTotalMinutes: number;
  latestMarathonDate: string | null;
  marathonSessions: DeepWorkSessionRecord[];
}

export function computeDeepWorkMarathonMetrics(params: {
  deepWorkState?: DeepWorkState;
}): DeepWorkMarathonMetrics {
  const { deepWorkState } = params;
  const history = deepWorkState?.sessionsHistory || [];
  const completedSessions = history.filter((s) => s.status === 'completed');

  const marathonSessions = completedSessions.filter(
    (s) => s.elapsedMinutes >= MARATHON_BLOCK_MINUTES
  );
  const completedMarathonBlocks = marathonSessions.length;
  const marathonTotalMinutes = marathonSessions.reduce(
    (sum, s) => sum + s.elapsedMinutes,
    0
  );

  const bestHistoricalMinutes = completedSessions.reduce(
    (max, s) => Math.max(max, s.elapsedMinutes || 0),
    0
  );

  let liveActiveMinutes = 0;
  const isLiveMarathonBlock = Boolean(
    deepWorkState?.isActive && deepWorkState.plannedMinutes >= MARATHON_BLOCK_MINUTES
  );

  if (deepWorkState?.isActive) {
    const totalSecs = Math.max(60, deepWorkState.plannedMinutes * 60);
    const elapsedSecs = Math.max(0, totalSecs - deepWorkState.remainingSeconds);
    liveActiveMinutes = Math.floor(elapsedSecs / 60);
  }

  const bestSingleBlockMinutes = Math.max(bestHistoricalMinutes, liveActiveMinutes);
  const progressMinutesTowardMarathon =
    completedMarathonBlocks > 0
      ? MARATHON_BLOCK_MINUTES
      : isLiveMarathonBlock
      ? Math.min(MARATHON_BLOCK_MINUTES, Math.max(liveActiveMinutes, 1))
      : Math.min(MARATHON_BLOCK_MINUTES, bestSingleBlockMinutes);

  const progressPercent = Math.min(
    100,
    Math.round((progressMinutesTowardMarathon / MARATHON_BLOCK_MINUTES) * 100)
  );

  return {
    targetBlockMinutes: MARATHON_BLOCK_MINUTES,
    completedMarathonBlocks,
    bestSingleBlockMinutes,
    liveActiveMinutes,
    isLiveMarathonBlock,
    progressMinutesTowardMarathon,
    progressPercent,
    masterOfFocusUnlocked: completedMarathonBlocks >= 1,
    marathonTotalMinutes,
    latestMarathonDate: marathonSessions[0]?.endedAt || null,
    marathonSessions,
  };
}

// ----------------------------------------------------
// Monthly Completed Deep Work Subject Summary
// (Time Spent per Subject vs. Avg Focus Intensity Scores)
// ----------------------------------------------------

export interface CompletedDeepWorkSessionDetail {
  id: string;
  guideId: string;
  guideTitle: string;
  subjectName: string;
  elapsedMinutes: number;
  plannedMinutes: number;
  sessionFocusIntensity: number;
  distractionsBlockedCount: number;
  startedAt: string;
  endedAt: string;
}

export interface SubjectDeepWorkMonthlySummary {
  subjectName: string;
  completedSessionsCount: number;
  interruptedSessionsCount: number;
  totalMinutes: number;
  totalHours: number;
  avgBlockMinutes: number;
  avgFocusIntensityScore: number;
  shareOfMonthPercent: number;
  totalDistractionsBlocked: number;
  primaryGuideId: string;
  coursesCovered: string[];
}

export interface MonthlySubjectDeepWorkSummary {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. November 2026
  availableMonths: Array<{ monthKey: string; monthLabel: string; count: number }>;
  totalCompletedSessions: number;
  totalInterruptedSessions: number;
  totalCompletedMinutes: number;
  totalCompletedHours: number;
  monthlyAvgFocusIntensity: number;
  topSubjectByTime: string | null;
  topSubjectByIntensity: string | null;
  subjects: SubjectDeepWorkMonthlySummary[];
  completedSessions: CompletedDeepWorkSessionDetail[];
}

function getMonthKey(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map((n) => Number(n));
  const dt = new Date(y || 2026, (m || 1) - 1, 1);
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function resolveSubjectForDeepWorkSession(
  guideId: string,
  guideTitle: string,
  studyGuides: StudyGuide[]
): string {
  const matched = studyGuides.find(
    (g) =>
      g.id === guideId ||
      g.title.toLowerCase() === (guideTitle || '').trim().toLowerCase()
  );
  if (matched?.category) {
    return matched.category;
  }
  const text = `${guideId} ${guideTitle}`.toLowerCase();
  if (
    text.includes('search') ||
    text.includes('swarm') ||
    text.includes('consensus') ||
    text.includes('lrm') ||
    text.includes('ai') ||
    text.includes('agent')
  ) {
    return 'Frontier AI & Systems';
  }
  if (
    text.includes('cognitive') ||
    text.includes('first_principles') ||
    text.includes('first-principles') ||
    text.includes('systems')
  ) {
    return 'Cognitive Models';
  }
  if (
    text.includes('econ') ||
    text.includes('sovereign') ||
    text.includes('energy') ||
    text.includes('fiscal')
  ) {
    return 'Sovereign Economics';
  }
  if (text.includes('curriculum') || text.includes('pedagogy')) {
    return 'Education & Pedagogy';
  }
  return 'General Academic Study';
}

function computeSingleSessionFocusIntensity(params: {
  elapsedMinutes: number;
  plannedMinutes: number;
  distractionsBlockedCount: number;
  subjectCompletionRate: number;
}): number {
  const planned = Math.max(15, params.plannedMinutes || 50);
  const ratio = Math.min(1, Math.max(0.2, params.elapsedMinutes / planned));
  const completionComponent = (ratio * 0.55 + (params.subjectCompletionRate / 100) * 0.45) * 100;
  const blockDepthComponent = Math.min(
    100,
    Math.max(45, Math.round((params.elapsedMinutes / 45) * 86))
  );
  // Shielded distractions during completed blocks verify active protection continuity
  const shieldComponent = Math.min(
    100,
    82 + Math.min(18, (params.distractionsBlockedCount || 0) * 4)
  );

  return Math.min(
    100,
    Math.max(
      40,
      Math.round(
        completionComponent * 0.5 +
          blockDepthComponent * 0.3 +
          shieldComponent * 0.2
      )
    )
  );
}

export function buildMonthlySubjectDeepWorkSummary(params: {
  deepWorkState?: DeepWorkState;
  studyGuides: StudyGuide[];
  selectedMonthKey?: string;
}): MonthlySubjectDeepWorkSummary {
  const { deepWorkState, studyGuides, selectedMonthKey } = params;
  const history = deepWorkState?.sessionsHistory || [];

  const currentMonthKey = getMonthKey(new Date());
  const monthCounts = new Map<string, number>();
  monthCounts.set(currentMonthKey, 0);

  history.forEach((rec) => {
    const dt = new Date(rec.startedAt);
    if (Number.isNaN(dt.getTime())) return;
    const mk = getMonthKey(dt);
    if (rec.status === 'completed') {
      monthCounts.set(mk, (monthCounts.get(mk) || 0) + 1);
    } else if (!monthCounts.has(mk)) {
      monthCounts.set(mk, 0);
    }
  });

  const availableMonths = Array.from(monthCounts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mk, count]) => ({
      monthKey: mk,
      monthLabel: formatMonthLabel(mk),
      count,
    }));

  const activeMonthKey =
    selectedMonthKey && monthCounts.has(selectedMonthKey)
      ? selectedMonthKey
      : currentMonthKey;

  const monthRecords = history.filter((rec) => {
    const dt = new Date(rec.startedAt);
    return !Number.isNaN(dt.getTime()) && getMonthKey(dt) === activeMonthKey;
  });

  // Group all month records by subject first so completion rate reflects interrupted vs completed blocks per subject
  const subjectBuckets = new Map<
    string,
    {
      completed: DeepWorkSessionRecord[];
      interrupted: DeepWorkSessionRecord[];
    }
  >();

  monthRecords.forEach((rec) => {
    const subjectName = resolveSubjectForDeepWorkSession(
      rec.guideId,
      rec.guideTitle,
      studyGuides
    );
    const bucket = subjectBuckets.get(subjectName) || {
      completed: [],
      interrupted: [],
    };
    if (rec.status === 'completed') {
      bucket.completed.push(rec);
    } else {
      bucket.interrupted.push(rec);
    }
    subjectBuckets.set(subjectName, bucket);
  });

  const totalCompletedMinutes = monthRecords
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Math.max(1, r.elapsedMinutes || 0), 0);

  const totalCompletedSessions = monthRecords.filter(
    (r) => r.status === 'completed'
  ).length;
  const totalInterruptedSessions = monthRecords.filter(
    (r) => r.status === 'interrupted'
  ).length;

  const completedSessions: CompletedDeepWorkSessionDetail[] = [];
  const subjects: SubjectDeepWorkMonthlySummary[] = [];

  subjectBuckets.forEach((bucket, subjectName) => {
    if (bucket.completed.length === 0) return;

    const totalAttempts = bucket.completed.length + bucket.interrupted.length;
    const subjectCompletionRate =
      totalAttempts > 0
        ? Math.round((bucket.completed.length / totalAttempts) * 100)
        : 100;

    let subjectMinutes = 0;
    let subjectDistractions = 0;
    let intensitySum = 0;
    const coursesSet = new Set<string>();

    bucket.completed.forEach((rec) => {
      const elapsed = Math.max(1, rec.elapsedMinutes || 0);
      const distractions = rec.distractionsBlockedCount || 0;
      const intensity = computeSingleSessionFocusIntensity({
        elapsedMinutes: elapsed,
        plannedMinutes: rec.plannedMinutes,
        distractionsBlockedCount: distractions,
        subjectCompletionRate,
      });

      subjectMinutes += elapsed;
      subjectDistractions += distractions;
      intensitySum += intensity;
      coursesSet.add(rec.guideTitle);

      completedSessions.push({
        id: rec.id,
        guideId: rec.guideId,
        guideTitle: rec.guideTitle,
        subjectName,
        elapsedMinutes: elapsed,
        plannedMinutes: rec.plannedMinutes,
        sessionFocusIntensity: intensity,
        distractionsBlockedCount: distractions,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
      });
    });

    const avgFocusIntensityScore = Math.round(
      intensitySum / bucket.completed.length
    );

    subjects.push({
      subjectName,
      completedSessionsCount: bucket.completed.length,
      interruptedSessionsCount: bucket.interrupted.length,
      totalMinutes: subjectMinutes,
      totalHours: parseFloat((subjectMinutes / 60).toFixed(2)),
      avgBlockMinutes: Math.round(subjectMinutes / bucket.completed.length),
      avgFocusIntensityScore,
      shareOfMonthPercent:
        totalCompletedMinutes > 0
          ? Math.round((subjectMinutes / totalCompletedMinutes) * 100)
          : 0,
      totalDistractionsBlocked: subjectDistractions,
      primaryGuideId: bucket.completed[0]?.guideId || '',
      coursesCovered: Array.from(coursesSet),
    });
  });

  subjects.sort((a, b) => b.totalMinutes - a.totalMinutes);
  completedSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const monthlyAvgFocusIntensity =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((s, item) => s + item.sessionFocusIntensity, 0) /
            completedSessions.length
        )
      : 0;

  const topSubjectByTime = subjects[0]?.subjectName || null;
  const topSubjectByIntensity =
    subjects.length > 0
      ? [...subjects].sort(
          (a, b) => b.avgFocusIntensityScore - a.avgFocusIntensityScore
        )[0].subjectName
      : null;

  return {
    monthKey: activeMonthKey,
    monthLabel: formatMonthLabel(activeMonthKey),
    availableMonths,
    totalCompletedSessions,
    totalInterruptedSessions,
    totalCompletedMinutes,
    totalCompletedHours: parseFloat((totalCompletedMinutes / 60).toFixed(2)),
    monthlyAvgFocusIntensity,
    topSubjectByTime,
    topSubjectByIntensity,
    subjects,
    completedSessions,
  };
}

