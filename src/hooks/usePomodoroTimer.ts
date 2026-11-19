import { useState, useEffect, useCallback, useRef } from 'react';
import { PomodoroIntervalConfig, PomodoroPhase, PomodoroSessionLog } from '../types';

const CONFIG_STORAGE_KEY = 'ttg_pomodoro_config';
const TIMER_STORAGE_KEY = 'ttg_pomodoro_timer_state';
const STATS_STORAGE_KEY = 'ttg_pomodoro_stats';

const DEFAULT_CONFIG: PomodoroIntervalConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartNext: false,
};

interface PersistedTimerState {
  phase: PomodoroPhase;
  isRunning: boolean;
  remainingSeconds: number;
  targetEndAt: number | null;
  linkedGuideId: string;
  cycleCount: number;
}

interface PersistedPomodoroStats {
  syncedFocusMinutes: number;
  completedSessions: number;
  logs: PomodoroSessionLog[];
}

function getPhaseDurationSeconds(phase: PomodoroPhase, config: PomodoroIntervalConfig): number {
  if (phase === 'focus') return Math.max(1, config.focusMinutes) * 60;
  if (phase === 'short_break') return Math.max(1, config.shortBreakMinutes) * 60;
  return Math.max(1, config.longBreakMinutes) * 60;
}

export function usePomodoroTimer(
  defaultGuideId: string,
  getGuideTitle: (guideId: string) => string | undefined,
  onFocusSynced?: (minutes: number, guideTitle?: string) => void
) {
  const [config, setConfig] = useState<PomodoroIntervalConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [stats, setStats] = useState<PersistedPomodoroStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          syncedFocusMinutes: Number(parsed.syncedFocusMinutes) || 0,
          completedSessions: Number(parsed.completedSessions) || 0,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        };
      }
    } catch {}
    return {
      syncedFocusMinutes: 0,
      completedSessions: 0,
      logs: [],
    };
  });

  const [timerState, setTimerState] = useState<PersistedTimerState>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed: PersistedTimerState = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndAt) {
          const remaining = Math.max(0, Math.ceil((parsed.targetEndAt - Date.now()) / 1000));
          return {
            ...parsed,
            remainingSeconds: remaining,
          };
        }
        return parsed;
      }
    } catch {}
    return {
      phase: 'focus',
      isRunning: false,
      remainingSeconds: DEFAULT_CONFIG.focusMinutes * 60,
      targetEndAt: null,
      linkedGuideId: defaultGuideId,
      cycleCount: 0,
    };
  });

  const onFocusSyncedRef = useRef(onFocusSynced);
  onFocusSyncedRef.current = onFocusSynced;

  const getGuideTitleRef = useRef(getGuideTitle);
  getGuideTitleRef.current = getGuideTitle;

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch {}
  }, [timerState]);

  const recordCompletedFocus = useCallback((minutes: number, guideId: string) => {
    const safeMinutes = Math.max(1, Math.round(minutes));
    const guideTitle = getGuideTitleRef.current(guideId) || 'Independent Study Session';
    const newLog: PomodoroSessionLog = {
      id: `pomo_${Date.now()}`,
      phase: 'focus',
      durationMinutes: safeMinutes,
      guideTitle,
      completedAt: new Date().toISOString(),
    };
    setStats(prev => ({
      syncedFocusMinutes: prev.syncedFocusMinutes + safeMinutes,
      completedSessions: prev.completedSessions + 1,
      logs: [newLog, ...prev.logs].slice(0, 500),
    }));
    onFocusSyncedRef.current?.(safeMinutes, guideTitle);
  }, []);

  // Drift-resistant interval tick
  useEffect(() => {
    if (!timerState.isRunning) return;

    const tick = () => {
      setTimerState(prev => {
        if (!prev.isRunning || !prev.targetEndAt) return prev;
        const remaining = Math.max(0, Math.ceil((prev.targetEndAt - Date.now()) / 1000));
        if (remaining > 0) {
          if (remaining === prev.remainingSeconds) return prev;
          return { ...prev, remainingSeconds: remaining };
        }

        // Phase completed
        let nextCycleCount = prev.cycleCount;
        let nextPhase: PomodoroPhase = 'focus';
        if (prev.phase === 'focus') {
          nextCycleCount = prev.cycleCount + 1;
          nextPhase =
            nextCycleCount % Math.max(2, config.sessionsBeforeLongBreak) === 0
              ? 'long_break'
              : 'short_break';
          // Sync completed focus session minutes automatically
          setTimeout(() => {
            recordCompletedFocus(config.focusMinutes, prev.linkedGuideId);
          }, 0);
        } else {
          nextPhase = 'focus';
        }

        const nextDuration = getPhaseDurationSeconds(nextPhase, config);
        return {
          ...prev,
          phase: nextPhase,
          cycleCount: nextCycleCount,
          isRunning: config.autoStartNext,
          remainingSeconds: nextDuration,
          targetEndAt: config.autoStartNext ? Date.now() + nextDuration * 1000 : null,
        };
      });
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [timerState.isRunning, config, recordCompletedFocus]);

  const startPause = useCallback(() => {
    setTimerState(prev => {
      if (prev.isRunning) {
        const remaining = prev.targetEndAt
          ? Math.max(1, Math.ceil((prev.targetEndAt - Date.now()) / 1000))
          : prev.remainingSeconds;
        return {
          ...prev,
          isRunning: false,
          remainingSeconds: remaining,
          targetEndAt: null,
        };
      }
      const remaining = Math.max(1, prev.remainingSeconds);
      return {
        ...prev,
        isRunning: true,
        targetEndAt: Date.now() + remaining * 1000,
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      remainingSeconds: getPhaseDurationSeconds(prev.phase, config),
      targetEndAt: null,
    }));
  }, [config]);

  const selectPhase = useCallback(
    (phase: PomodoroPhase) => {
      const duration = getPhaseDurationSeconds(phase, config);
      setTimerState(prev => ({
        ...prev,
        phase,
        isRunning: false,
        remainingSeconds: duration,
        targetEndAt: null,
      }));
    },
    [config]
  );

  const skipPhase = useCallback(() => {
    setTimerState(prev => {
      const nextPhase: PomodoroPhase =
        prev.phase === 'focus'
          ? (prev.cycleCount + 1) % Math.max(2, config.sessionsBeforeLongBreak) === 0
            ? 'long_break'
            : 'short_break'
          : 'focus';
      const nextDuration = getPhaseDurationSeconds(nextPhase, config);
      return {
        ...prev,
        phase: nextPhase,
        cycleCount: prev.phase === 'focus' ? prev.cycleCount + 1 : prev.cycleCount,
        isRunning: false,
        remainingSeconds: nextDuration,
        targetEndAt: null,
      };
    });
  }, [config]);

  const setLinkedGuideId = useCallback((guideId: string) => {
    setTimerState(prev => ({ ...prev, linkedGuideId: guideId }));
  }, []);

  const updateConfig = useCallback((partial: Partial<PomodoroIntervalConfig>) => {
    setConfig(prev => {
      const next: PomodoroIntervalConfig = {
        focusMinutes: Math.min(90, Math.max(1, partial.focusMinutes ?? prev.focusMinutes)),
        shortBreakMinutes: Math.min(30, Math.max(1, partial.shortBreakMinutes ?? prev.shortBreakMinutes)),
        longBreakMinutes: Math.min(60, Math.max(1, partial.longBreakMinutes ?? prev.longBreakMinutes)),
        sessionsBeforeLongBreak: Math.min(8, Math.max(2, partial.sessionsBeforeLongBreak ?? prev.sessionsBeforeLongBreak)),
        autoStartNext: partial.autoStartNext ?? prev.autoStartNext,
      };
      setTimerState(curr => {
        if (curr.isRunning) return curr;
        return {
          ...curr,
          remainingSeconds: getPhaseDurationSeconds(curr.phase, next),
          targetEndAt: null,
        };
      });
      return next;
    });
  }, []);

  // Manual sync of currently elapsed focus time (at least 1 minute) or full completed focus session
  const syncElapsedFocusSession = useCallback(() => {
    const totalFocusSeconds = getPhaseDurationSeconds('focus', config);
    const elapsedSeconds =
      timerState.phase === 'focus'
        ? Math.max(0, totalFocusSeconds - timerState.remainingSeconds)
        : 0;
    const minutesToSync = elapsedSeconds >= 60 ? Math.round(elapsedSeconds / 60) : config.focusMinutes;
    recordCompletedFocus(minutesToSync, timerState.linkedGuideId);

    if (timerState.phase === 'focus') {
      const duration = getPhaseDurationSeconds('focus', config);
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        remainingSeconds: duration,
        targetEndAt: null,
        cycleCount: prev.cycleCount + 1,
      }));
    }
  }, [config, timerState.phase, timerState.remainingSeconds, timerState.linkedGuideId, recordCompletedFocus]);

  const totalPhaseSeconds = getPhaseDurationSeconds(timerState.phase, config);
  const elapsedFocusMinutes =
    timerState.phase === 'focus'
      ? Math.floor(Math.max(0, totalPhaseSeconds - timerState.remainingSeconds) / 60)
      : 0;

  const clearCompletedSessionLogs = useCallback(() => {
    setStats(prev => ({
      ...prev,
      logs: [],
    }));
  }, []);

  return {
    phase: timerState.phase,
    isRunning: timerState.isRunning,
    remainingSeconds: timerState.remainingSeconds,
    totalPhaseSeconds,
    elapsedFocusMinutes,
    linkedGuideId: timerState.linkedGuideId,
    cycleCount: timerState.cycleCount,
    config,
    syncedFocusMinutes: stats.syncedFocusMinutes,
    completedSessions: stats.completedSessions,
    sessionLogs: stats.logs,
    startPause,
    resetTimer,
    selectPhase,
    skipPhase,
    setLinkedGuideId,
    updateConfig,
    syncElapsedFocusSession,
    clearCompletedSessionLogs,
  };
}
