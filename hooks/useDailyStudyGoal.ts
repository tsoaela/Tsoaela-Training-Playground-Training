import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DailyStudyGoalMetrics,
  DeepWorkState,
  PomodoroPhase,
  PomodoroSessionLog,
} from '../types';

const DAILY_GOAL_STORAGE_PREFIX = 'ttg_daily_study_goal_hours_v1';

function toLocalDateKey(dateInput: Date | string): string | null {
  const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(dt.getTime())) return null;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface UseDailyStudyGoalOptions {
  userId?: string;
  pomodoroLogs: PomodoroSessionLog[];
  syncedFocusMinutes: number;
  pomodoroLive?: {
    phase: PomodoroPhase;
    isRunning: boolean;
    remainingSeconds: number;
    totalPhaseSeconds: number;
  };
  deepWorkState?: DeepWorkState;
}

export function useDailyStudyGoal({
  userId = 'user_88219',
  pomodoroLogs,
  syncedFocusMinutes,
  pomodoroLive,
  deepWorkState,
}: UseDailyStudyGoalOptions) {
  const storageKey = `${DAILY_GOAL_STORAGE_PREFIX}_${userId}`;

  const [dailyGoalHours, setDailyGoalHoursState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed >= 0.25 && parsed <= 12) {
          return parseFloat((Math.round(parsed * 60) / 60).toFixed(4));
        }
      }
    } catch {
      // ignore storage errors
    }
    return 2.0;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed >= 0.25 && parsed <= 12) {
          setDailyGoalHoursState(parseFloat((Math.round(parsed * 60) / 60).toFixed(4)));
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const setDailyGoalHours = useCallback(
    (nextHours: number) => {
      const totalMins = Math.min(720, Math.max(15, Math.round((Number(nextHours) || 2.0) * 60)));
      const normalized = parseFloat((totalMins / 60).toFixed(4));
      setDailyGoalHoursState(normalized);
      try {
        localStorage.setItem(storageKey, String(normalized));
      } catch {
        // ignore storage quota errors
      }
    },
    [storageKey]
  );

  const setDailyGoalDuration = useCallback(
    (hours: number, minutes: number) => {
      const safeHours = Math.max(0, Math.min(12, Math.floor(Number(hours) || 0)));
      const safeMinutes = Math.max(0, Math.min(59, Math.floor(Number(minutes) || 0)));
      const totalMins = Math.min(720, Math.max(15, safeHours * 60 + safeMinutes));
      const normalized = parseFloat((totalMins / 60).toFixed(4));
      setDailyGoalHoursState(normalized);
      try {
        localStorage.setItem(storageKey, String(normalized));
      } catch {
        // ignore storage quota errors
      }
    },
    [storageKey]
  );

  const metrics = useMemo<DailyStudyGoalMetrics>(() => {
    const todayKey = toLocalDateKey(new Date()) || '';
    const focusLogs = pomodoroLogs.filter((l) => l.phase === 'focus');

    let loggedPomodoroMinutesToday = 0;
    let loggedDeepWorkFromPomoToday = 0;

    for (const log of focusLogs) {
      const logKey = toLocalDateKey(log.completedAt);
      if (logKey !== todayKey) continue;
      const mins = Math.max(0, Number(log.durationMinutes) || 0);
      if (log.guideTitle && log.guideTitle.includes('(Deep Work)')) {
        loggedDeepWorkFromPomoToday += mins;
      } else {
        loggedPomodoroMinutesToday += mins;
      }
    }

    // Reconcile any unsourced syncedFocusMinutes if logs array does not account for all synced minutes
    const totalLoggedFocusMins = focusLogs.reduce(
      (sum, log) => sum + (Number(log.durationMinutes) || 0),
      0
    );
    const unsourcedSyncedMinutes = Math.max(0, syncedFocusMinutes - totalLoggedFocusMins);
    loggedPomodoroMinutesToday += unsourcedSyncedMinutes;

    // Reconcile completed Deep Work sessions recorded today in deepWorkState
    let deepWorkHistoryMinutesToday = 0;
    if (deepWorkState?.sessionsHistory) {
      for (const session of deepWorkState.sessionsHistory) {
        if (session.status !== 'completed') continue;
        const sessionKey = toLocalDateKey(session.endedAt);
        if (sessionKey === todayKey) {
          deepWorkHistoryMinutesToday += Math.max(0, Number(session.elapsedMinutes) || 0);
        }
      }
    }
    const completedDeepWorkMinutesToday = Math.max(
      loggedDeepWorkFromPomoToday,
      deepWorkHistoryMinutesToday
    );

    // Live active timer seconds (Pomodoro Focus + Deep Work active block)
    const activePomodoroSeconds =
      pomodoroLive && pomodoroLive.isRunning && pomodoroLive.phase === 'focus'
        ? Math.max(0, pomodoroLive.totalPhaseSeconds - pomodoroLive.remainingSeconds)
        : 0;

    const activeDeepWorkSeconds = deepWorkState?.isActive
      ? Math.max(0, deepWorkState.plannedMinutes * 60 - deepWorkState.remainingSeconds)
      : 0;

    const activeLiveSecondsToday = activePomodoroSeconds + activeDeepWorkSeconds;

    const pomodoroMinutesToday = parseFloat(
      (loggedPomodoroMinutesToday + activePomodoroSeconds / 60).toFixed(1)
    );
    const deepWorkMinutesToday = parseFloat(
      (completedDeepWorkMinutesToday + activeDeepWorkSeconds / 60).toFixed(1)
    );

    const todayTotalMinutes = parseFloat(
      (pomodoroMinutesToday + deepWorkMinutesToday).toFixed(1)
    );
    const todayTotalHours = parseFloat((todayTotalMinutes / 60).toFixed(2));
    const goalMinutes = Math.min(720, Math.max(15, Math.round(dailyGoalHours * 60)));

    const completionPercent = Math.min(
      100,
      Math.max(0, Math.round((todayTotalMinutes / goalMinutes) * 100))
    );
    const remainingMinutes = Math.max(0, Math.round(goalMinutes - todayTotalMinutes));
    const surplusMinutes = Math.max(0, Math.round(todayTotalMinutes - goalMinutes));

    return {
      dailyGoalHours,
      dailyGoalMinutes: goalMinutes,
      todayTotalMinutes,
      todayTotalHours,
      pomodoroMinutesToday,
      deepWorkMinutesToday,
      activeLiveSecondsToday,
      completionPercent,
      remainingMinutes,
      surplusMinutes,
      isGoalMet: todayTotalMinutes >= goalMinutes,
    };
  }, [
    dailyGoalHours,
    pomodoroLogs,
    syncedFocusMinutes,
    pomodoroLive?.phase,
    pomodoroLive?.isRunning,
    pomodoroLive?.remainingSeconds,
    pomodoroLive?.totalPhaseSeconds,
    deepWorkState?.isActive,
    deepWorkState?.plannedMinutes,
    deepWorkState?.remainingSeconds,
    deepWorkState?.sessionsHistory,
  ]);

  return {
    dailyGoalHours,
    dailyGoalMinutes: metrics.dailyGoalMinutes,
    setDailyGoalHours,
    setDailyGoalDuration,
    metrics,
  };
}
