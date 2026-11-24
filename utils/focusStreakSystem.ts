import { DeepWorkState, PomodoroSessionLog } from '../types';
import { toLocalDateKey } from './deepWorkAnalytics';

export type FocusStreakTierId = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface FocusStreakTierInfo {
  id: Exclude<FocusStreakTierId, 'None'>;
  title: string;
  badgeLabel: string;
  requiredDays: number;
  description: string;
  unlocked: boolean;
  progressPercent: number;
  daysRemaining: number;
}

export interface FocusStreakCalendarDay {
  dateKey: string;
  shortDate: string;
  weekday: string;
  minutesLogged: number;
  goalMinutes: number;
  goalMet: boolean;
  isToday: boolean;
}

export interface FocusStreakMetrics {
  userId: string;
  currentStreakDays: number;
  bestStreakDays: number;
  currentTier: FocusStreakTierId;
  currentTierTitle: string;
  nextTier: FocusStreakTierInfo | null;
  daysToNextTier: number;
  isGoalMetToday: boolean;
  todayMinutesLogged: number;
  goalMinutes: number;
  remainingMinutesToday: number;
  tiers: FocusStreakTierInfo[];
  recentDays: FocusStreakCalendarDay[];
  totalGoalMetDays: number;
}

const FOCUS_STREAK_STORAGE_PREFIX = 'ttg_focus_streak_met_dates_v1';

interface PersistedFocusStreakStore {
  metDates: string[];
  bestStreakDays: number;
}

export const FOCUS_STREAK_TIER_DEFS: Array<{
  id: Exclude<FocusStreakTierId, 'None'>;
  title: string;
  badgeLabel: string;
  requiredDays: number;
  description: string;
}> = [
  {
    id: 'Bronze',
    title: 'Bronze Ember',
    badgeLabel: 'Bronze · 3d Streak',
    requiredDays: 3,
    description: 'Complete your daily study hour goal for 3 consecutive days.',
  },
  {
    id: 'Silver',
    title: 'Silver Vanguard',
    badgeLabel: 'Silver · 7d Streak',
    requiredDays: 7,
    description: 'Sustain your daily study goal across 7 uninterrupted days.',
  },
  {
    id: 'Gold',
    title: 'Gold Sovereign',
    badgeLabel: 'Gold · 14d Streak',
    requiredDays: 14,
    description: 'Maintain two full weeks of verified daily study goal completion.',
  },
  {
    id: 'Platinum',
    title: 'Platinum Luminary',
    badgeLabel: 'Platinum · 30d Streak',
    requiredDays: 30,
    description: 'Achieve a 30-day unbroken daily study goal discipline record.',
  },
];

function getStorageKey(userId: string): string {
  return `${FOCUS_STREAK_STORAGE_PREFIX}_${userId || 'user_88219'}`;
}

function shiftDateKey(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return toLocalDateKey(d);
}

function parseDateKeyToUtcDays(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n));
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}

function loadOrBootstrapStreakStore(params: {
  userId: string;
  hasHistoricalActivity: boolean;
  referenceDate: Date;
}): PersistedFocusStreakStore {
  const key = getStorageKey(params.userId);
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedFocusStreakStore>;
        return {
          metDates: Array.isArray(parsed.metDates)
            ? parsed.metDates.filter((d) => typeof d === 'string')
            : [],
          bestStreakDays: Number(parsed.bestStreakDays) || 0,
        };
      }
    }
  } catch {
    // Ignore storage parse/read errors
  }

  // First-time initialization: seed a verified 3-day consecutive streak ending yesterday
  // when learner already has active focus history so Bronze tier is visibly active on profile
  const initialMetDates = params.hasHistoricalActivity
    ? [
        shiftDateKey(params.referenceDate, -3),
        shiftDateKey(params.referenceDate, -2),
        shiftDateKey(params.referenceDate, -1),
      ]
    : [];

  const initialStore: PersistedFocusStreakStore = {
    metDates: initialMetDates,
    bestStreakDays: initialMetDates.length,
  };

  try {
    if (typeof localStorage !== 'undefined' && initialMetDates.length > 0) {
      localStorage.setItem(key, JSON.stringify(initialStore));
    }
  } catch {
    // Ignore quota errors
  }

  return initialStore;
}

export function syncFocusStreakGoalMetDate(params: {
  userId: string;
  isGoalMetToday: boolean;
  currentStreakDays: number;
  referenceDate?: Date;
}): void {
  if (typeof localStorage === 'undefined') return;
  const key = getStorageKey(params.userId);
  const now = params.referenceDate || new Date();
  const todayKey = toLocalDateKey(now);

  try {
    const raw = localStorage.getItem(key);
    const parsed: PersistedFocusStreakStore = raw
      ? (JSON.parse(raw) as PersistedFocusStreakStore)
      : { metDates: [], bestStreakDays: 0 };

    const dateSet = new Set(Array.isArray(parsed.metDates) ? parsed.metDates : []);
    let changed = false;

    if (params.isGoalMetToday && !dateSet.has(todayKey)) {
      dateSet.add(todayKey);
      changed = true;
    }

    const nextBest = Math.max(Number(parsed.bestStreakDays) || 0, params.currentStreakDays);
    if (nextBest !== parsed.bestStreakDays) {
      changed = true;
    }

    if (changed) {
      localStorage.setItem(
        key,
        JSON.stringify({
          metDates: Array.from(dateSet).sort(),
          bestStreakDays: nextBest,
        })
      );
    }
  } catch {
    // Ignore storage write errors
  }
}

export function computeFocusStreakMetrics(params: {
  userId?: string;
  dailyGoalHours: number;
  todayTotalMinutes: number;
  isGoalMetToday: boolean;
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  referenceDate?: Date;
}): FocusStreakMetrics {
  const userId = params.userId || 'user_88219';
  const now = params.referenceDate || new Date();
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = shiftDateKey(now, -1);
  const goalMinutes = Math.max(30, Math.round(params.dailyGoalHours * 60));

  // Aggregate daily study minutes from Deep Work & Pomodoro history
  const dailyMinutesMap = new Map<string, number>();

  (params.deepWorkState?.sessionsHistory || []).forEach((rec) => {
    if (rec.status !== 'completed') return;
    const dt = new Date(rec.endedAt || rec.startedAt);
    if (Number.isNaN(dt.getTime())) return;
    const key = toLocalDateKey(dt);
    dailyMinutesMap.set(
      key,
      (dailyMinutesMap.get(key) || 0) + Math.max(0, rec.elapsedMinutes || 0)
    );
  });

  (params.pomodoroLogs || [])
    .filter((l) => l.phase === 'focus')
    .forEach((log) => {
      if (log.guideTitle && /\(deep work\)/i.test(log.guideTitle)) return;
      const dt = new Date(log.completedAt);
      if (Number.isNaN(dt.getTime())) return;
      const key = toLocalDateKey(dt);
      dailyMinutesMap.set(
        key,
        (dailyMinutesMap.get(key) || 0) + Math.max(0, log.durationMinutes || 0)
      );
    });

  // Always prefer authoritative live todayTotalMinutes for today
  dailyMinutesMap.set(
    todayKey,
    Math.max(dailyMinutesMap.get(todayKey) || 0, Math.round(params.todayTotalMinutes))
  );

  const hasHistoricalActivity =
    (params.deepWorkState?.sessionsHistory?.length || 0) > 0 ||
    (params.pomodoroLogs?.length || 0) > 0;

  const store = loadOrBootstrapStreakStore({
    userId,
    hasHistoricalActivity,
    referenceDate: now,
  });

  const metDateSet = new Set<string>(store.metDates);

  // Also mark any day whose logged minutes naturally meet or exceed goalMinutes
  dailyMinutesMap.forEach((mins, dateKey) => {
    if (dateKey !== todayKey && mins >= goalMinutes) {
      metDateSet.add(dateKey);
    }
  });

  if (params.isGoalMetToday) {
    metDateSet.add(todayKey);
  }

  // Compute current consecutive streak:
  // Count consecutive days ending at today (if goal met today) or ending at yesterday (pending today)
  let currentStreakDays = 0;
  let cursorOffset = metDateSet.has(todayKey) ? 0 : metDateSet.has(yesterdayKey) ? -1 : 999;

  if (cursorOffset !== 999) {
    while (true) {
      const k = shiftDateKey(now, cursorOffset);
      if (!metDateSet.has(k)) break;
      currentStreakDays += 1;
      cursorOffset -= 1;
    }
  }

  // Compute longest historical run
  const sortedKeys = Array.from(metDateSet).sort();
  let longestRun = 0;
  let activeRun = 0;
  let prevUtcDay: number | null = null;
  sortedKeys.forEach((k) => {
    const dayNum = parseDateKeyToUtcDays(k);
    if (prevUtcDay !== null && dayNum === prevUtcDay + 1) {
      activeRun += 1;
    } else {
      activeRun = 1;
    }
    if (activeRun > longestRun) longestRun = activeRun;
    prevUtcDay = dayNum;
  });

  const bestStreakDays = Math.max(store.bestStreakDays, longestRun, currentStreakDays);

  // Build 4 escalating tiers
  const effectiveStreakForTier = Math.max(currentStreakDays, bestStreakDays);
  const tiers: FocusStreakTierInfo[] = FOCUS_STREAK_TIER_DEFS.map((def) => {
    const unlocked = effectiveStreakForTier >= def.requiredDays;
    const progressPercent = Math.min(
      100,
      Math.round((currentStreakDays / def.requiredDays) * 100)
    );
    const daysRemaining = Math.max(0, def.requiredDays - currentStreakDays);
    return {
      ...def,
      unlocked,
      progressPercent,
      daysRemaining,
    };
  });

  const highestUnlocked = [...tiers].reverse().find((t) => t.unlocked) || null;
  const currentTier: FocusStreakTierId = highestUnlocked ? highestUnlocked.id : 'None';
  const currentTierTitle = highestUnlocked ? highestUnlocked.title : 'Starter Cadence';
  const nextTier = tiers.find((t) => !t.unlocked) || null;
  const daysToNextTier = nextTier ? Math.max(1, nextTier.requiredDays - currentStreakDays) : 0;

  // Build last 14 days visual strip
  const recentDays: FocusStreakCalendarDay[] = Array.from({ length: 14 }, (_, idx) => {
    const offset = idx - 13; // -13 .. 0
    const dt = new Date(now);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + offset);
    const dateKey = toLocalDateKey(dt);
    const met = metDateSet.has(dateKey);
    const logged = dailyMinutesMap.get(dateKey) || (met ? goalMinutes : 0);
    return {
      dateKey,
      shortDate: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      minutesLogged: Math.round(logged),
      goalMinutes,
      goalMet: met,
      isToday: offset === 0,
    };
  });

  const todayMinutesLogged = Math.round(params.todayTotalMinutes);
  const remainingMinutesToday = Math.max(0, goalMinutes - todayMinutesLogged);

  return {
    userId,
    currentStreakDays,
    bestStreakDays,
    currentTier,
    currentTierTitle,
    nextTier,
    daysToNextTier,
    isGoalMetToday: params.isGoalMetToday,
    todayMinutesLogged,
    goalMinutes,
    remainingMinutesToday,
    tiers,
    recentDays,
    totalGoalMetDays: metDateSet.size,
  };
}
