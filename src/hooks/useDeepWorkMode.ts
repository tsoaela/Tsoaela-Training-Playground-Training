import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DeepWorkSessionRecord,
  DeepWorkState,
  FocusIntensityMetrics,
  PomodoroSessionLog,
  ReadingProgress,
  StudyGuide,
} from '../types';

const DEEP_WORK_STORAGE_KEY = 'ttg_deep_work_state_v1';

interface UseDeepWorkModeOptions {
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  syncedFocusMinutes: number;
  completedPomodoroSessions: number;
  pomodoroLogs: PomodoroSessionLog[];
  onCompleteSession?: (minutes: number, guideId: string, guideTitle: string) => void;
}

function createInitialState(defaultGuideId: string): DeepWorkState {
  const plannedMinutes = 50;
  return {
    isActive: false,
    isPaused: false,
    plannedMinutes,
    remainingSeconds: plannedMinutes * 60,
    targetEndAt: null,
    linkedGuideId: defaultGuideId,
    startedAt: null,
    suppressedDistractionsCount: 0,
    sessionsHistory: [],
  };
}

function loadDeepWorkState(defaultGuideId: string): DeepWorkState {
  try {
    const raw = localStorage.getItem(DEEP_WORK_STORAGE_KEY);
    if (!raw) return createInitialState(defaultGuideId);
    const parsed = JSON.parse(raw) as Partial<DeepWorkState>;
    const plannedMinutes =
      typeof parsed.plannedMinutes === 'number' && parsed.plannedMinutes >= 15
        ? parsed.plannedMinutes
        : 50;

    if (parsed.isActive && !parsed.isPaused && parsed.targetEndAt) {
      const remaining = Math.max(0, Math.ceil((parsed.targetEndAt - Date.now()) / 1000));
      return {
        isActive: remaining > 0,
        isPaused: false,
        plannedMinutes,
        remainingSeconds: remaining > 0 ? remaining : plannedMinutes * 60,
        targetEndAt: remaining > 0 ? parsed.targetEndAt : null,
        linkedGuideId: parsed.linkedGuideId || defaultGuideId,
        startedAt: remaining > 0 ? parsed.startedAt || new Date().toISOString() : null,
        suppressedDistractionsCount: Number(parsed.suppressedDistractionsCount) || 0,
        sessionsHistory: Array.isArray(parsed.sessionsHistory) ? parsed.sessionsHistory : [],
      };
    }

    return {
      isActive: Boolean(parsed.isActive),
      isPaused: Boolean(parsed.isPaused),
      plannedMinutes,
      remainingSeconds:
        typeof parsed.remainingSeconds === 'number' && parsed.remainingSeconds > 0
          ? parsed.remainingSeconds
          : plannedMinutes * 60,
      targetEndAt: parsed.targetEndAt ?? null,
      linkedGuideId: parsed.linkedGuideId || defaultGuideId,
      startedAt: parsed.startedAt ?? null,
      suppressedDistractionsCount: Number(parsed.suppressedDistractionsCount) || 0,
      sessionsHistory: Array.isArray(parsed.sessionsHistory) ? parsed.sessionsHistory : [],
    };
  } catch {
    return createInitialState(defaultGuideId);
  }
}

export function useDeepWorkMode({
  studyGuides,
  readingProgress,
  syncedFocusMinutes,
  completedPomodoroSessions,
  pomodoroLogs,
  onCompleteSession,
}: UseDeepWorkModeOptions) {
  const defaultGuideId = studyGuides[0]?.id || 'sg_ai_test_time_search';
  const [state, setState] = useState<DeepWorkState>(() => loadDeepWorkState(defaultGuideId));

  const studyGuidesRef = useRef(studyGuides);
  studyGuidesRef.current = studyGuides;

  const onCompleteSessionRef = useRef(onCompleteSession);
  onCompleteSessionRef.current = onCompleteSession;

  const resolveGuideTitle = useCallback((guideId: string) => {
    return (
      studyGuidesRef.current.find((g) => g.id === guideId)?.title ||
      'Deep Work Study Block'
    );
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DEEP_WORK_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  // Countdown ticker when Deep Work is active and unpaused
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;

    const tick = () => {
      let completedPayload: {
        minutes: number;
        guideId: string;
        guideTitle: string;
      } | null = null;

      setState((prev) => {
        if (!prev.isActive || prev.isPaused || !prev.targetEndAt) return prev;
        const remaining = Math.max(0, Math.ceil((prev.targetEndAt - Date.now()) / 1000));
        if (remaining > 0) {
          if (remaining === prev.remainingSeconds) return prev;
          return { ...prev, remainingSeconds: remaining };
        }

        const guideTitle = resolveGuideTitle(prev.linkedGuideId);
        const nowIso = new Date().toISOString();
        const completedRecord: DeepWorkSessionRecord = {
          id: `dw_${Date.now()}`,
          guideId: prev.linkedGuideId,
          guideTitle,
          plannedMinutes: prev.plannedMinutes,
          elapsedMinutes: prev.plannedMinutes,
          status: 'completed',
          startedAt: prev.startedAt || nowIso,
          endedAt: nowIso,
          distractionsBlockedCount: prev.suppressedDistractionsCount,
        };

        completedPayload = {
          minutes: prev.plannedMinutes,
          guideId: prev.linkedGuideId,
          guideTitle,
        };

        return {
          ...prev,
          isActive: false,
          isPaused: false,
          remainingSeconds: prev.plannedMinutes * 60,
          targetEndAt: null,
          startedAt: null,
          suppressedDistractionsCount: 0,
          sessionsHistory: [completedRecord, ...prev.sessionsHistory].slice(0, 60),
        };
      });

      if (completedPayload) {
        const { minutes, guideId, guideTitle } = completedPayload;
        window.setTimeout(() => {
          onCompleteSessionRef.current?.(minutes, guideId, `${guideTitle} (Deep Work)`);
        }, 0);
      }
    };

    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [state.isActive, state.isPaused, resolveGuideTitle]);

  const startDeepWork = useCallback((customMinutes?: number, customGuideId?: string) => {
    setState((prev) => {
      const minutes = customMinutes ?? prev.plannedMinutes;
      const guideId = customGuideId ?? prev.linkedGuideId;
      const durationSeconds = Math.max(60, minutes * 60);
      return {
        ...prev,
        isActive: true,
        isPaused: false,
        plannedMinutes: minutes,
        remainingSeconds: durationSeconds,
        targetEndAt: Date.now() + durationSeconds * 1000,
        linkedGuideId: guideId,
        startedAt: new Date().toISOString(),
        suppressedDistractionsCount: 0,
      };
    });
  }, []);

  const pauseResumeDeepWork = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive) return prev;
      if (prev.isPaused) {
        const remaining = Math.max(1, prev.remainingSeconds);
        return {
          ...prev,
          isPaused: false,
          targetEndAt: Date.now() + remaining * 1000,
        };
      }
      const remaining = prev.targetEndAt
        ? Math.max(1, Math.ceil((prev.targetEndAt - Date.now()) / 1000))
        : prev.remainingSeconds;
      return {
        ...prev,
        isPaused: true,
        remainingSeconds: remaining,
        targetEndAt: null,
      };
    });
  }, []);

  const completeDeepWorkSession = useCallback(() => {
    let completedPayload: {
      minutes: number;
      guideId: string;
      guideTitle: string;
    } | null = null;

    setState((prev) => {
      if (!prev.isActive) return prev;
      const totalSeconds = Math.max(60, prev.plannedMinutes * 60);
      const elapsedSeconds = Math.max(0, totalSeconds - prev.remainingSeconds);
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60) || prev.plannedMinutes);
      const guideTitle = resolveGuideTitle(prev.linkedGuideId);
      const nowIso = new Date().toISOString();

      const completedRecord: DeepWorkSessionRecord = {
        id: `dw_${Date.now()}`,
        guideId: prev.linkedGuideId,
        guideTitle,
        plannedMinutes: prev.plannedMinutes,
        elapsedMinutes,
        status: 'completed',
        startedAt: prev.startedAt || nowIso,
        endedAt: nowIso,
        distractionsBlockedCount: prev.suppressedDistractionsCount,
      };

      completedPayload = {
        minutes: elapsedMinutes,
        guideId: prev.linkedGuideId,
        guideTitle,
      };

      return {
        ...prev,
        isActive: false,
        isPaused: false,
        remainingSeconds: prev.plannedMinutes * 60,
        targetEndAt: null,
        startedAt: null,
        suppressedDistractionsCount: 0,
        sessionsHistory: [completedRecord, ...prev.sessionsHistory].slice(0, 60),
      };
    });

    if (completedPayload) {
      const { minutes, guideId, guideTitle } = completedPayload;
      window.setTimeout(() => {
        onCompleteSessionRef.current?.(minutes, guideId, `${guideTitle} (Deep Work)`);
      }, 0);
    }
  }, [resolveGuideTitle]);

  const endDeepWorkEarly = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive) return prev;
      const totalSeconds = Math.max(60, prev.plannedMinutes * 60);
      const elapsedSeconds = Math.max(0, totalSeconds - prev.remainingSeconds);
      const elapsedMinutes = Math.max(0, Math.round(elapsedSeconds / 60));
      const nowIso = new Date().toISOString();

      // Only record as interrupted if user already started (> 15 seconds elapsed)
      const nextHistory =
        elapsedSeconds >= 15
          ? [
              {
                id: `dw_int_${Date.now()}`,
                guideId: prev.linkedGuideId,
                guideTitle: resolveGuideTitle(prev.linkedGuideId),
                plannedMinutes: prev.plannedMinutes,
                elapsedMinutes: Math.max(1, elapsedMinutes),
                status: 'interrupted' as const,
                startedAt: prev.startedAt || nowIso,
                endedAt: nowIso,
                distractionsBlockedCount: prev.suppressedDistractionsCount,
              },
              ...prev.sessionsHistory,
            ].slice(0, 60)
          : prev.sessionsHistory;

      return {
        ...prev,
        isActive: false,
        isPaused: false,
        remainingSeconds: prev.plannedMinutes * 60,
        targetEndAt: null,
        startedAt: null,
        suppressedDistractionsCount: 0,
        sessionsHistory: nextHistory,
      };
    });
  }, [resolveGuideTitle]);

  const toggleDeepWork = useCallback(() => {
    if (state.isActive) {
      endDeepWorkEarly();
    } else {
      startDeepWork();
    }
  }, [state.isActive, endDeepWorkEarly, startDeepWork]);

  const setPlannedMinutes = useCallback((minutes: number) => {
    const safeMinutes = Math.min(120, Math.max(15, minutes));
    setState((prev) => {
      if (prev.isActive) return prev;
      return {
        ...prev,
        plannedMinutes: safeMinutes,
        remainingSeconds: safeMinutes * 60,
        targetEndAt: null,
      };
    });
  }, []);

  const setLinkedGuideId = useCallback((guideId: string) => {
    setState((prev) => ({
      ...prev,
      linkedGuideId: guideId,
    }));
  }, []);

  const incrementBlockedDistractions = useCallback((amount = 1) => {
    setState((prev) => {
      if (!prev.isActive) return prev;
      return {
        ...prev,
        suppressedDistractionsCount: prev.suppressedDistractionsCount + amount,
      };
    });
  }, []);

  // Deterministic Focus Intensity Score (0-100) anchored on study session completion
  const focusIntensity = useMemo<FocusIntensityMetrics>(() => {
    const deepCompleted = state.sessionsHistory.filter((s) => s.status === 'completed');
    const deepInterrupted = state.sessionsHistory.filter((s) => s.status === 'interrupted');

    const pomodoroFocusLogs = pomodoroLogs.filter((l) => l.phase === 'focus');
    const completedSessionsCount =
      deepCompleted.length + Math.max(completedPomodoroSessions, pomodoroFocusLogs.length);
    const interruptedSessionsCount = deepInterrupted.length;
    const totalAttempted = completedSessionsCount + interruptedSessionsCount;

    // 1. Session Completion Rate (50% weight)
    const guideProgressValues = Object.values(readingProgress).map((p) => p.progressPercent || 0);
    const avgCurriculumCompletion =
      guideProgressValues.length > 0
        ? guideProgressValues.reduce((a, b) => a + b, 0) / guideProgressValues.length
        : 65;

    const sessionCompletionRate =
      totalAttempted > 0
        ? Math.round((completedSessionsCount / totalAttempted) * 100)
        : Math.round(Math.min(88, Math.max(58, avgCurriculumCompletion)));

    // 2. Sustained Block Depth (30% weight) - compares average completed block minutes vs 45m benchmark
    const completedDeepMinutes = deepCompleted.reduce((sum, s) => sum + s.elapsedMinutes, 0);
    const totalFocusMinutes = Math.max(syncedFocusMinutes, completedDeepMinutes);
    const avgCompletedBlockMinutes =
      completedSessionsCount > 0 && totalFocusMinutes > 0
        ? Math.round(totalFocusMinutes / completedSessionsCount)
        : state.isActive
        ? state.plannedMinutes
        : Math.min(45, Math.max(20, Math.round(totalFocusMinutes || 25)));

    const blockDepthScore = Math.min(
      100,
      Math.max(30, Math.round((avgCompletedBlockMinutes / 45) * 100))
    );

    // 3. Distraction-Free Continuity Shield (20% weight)
    const activeShieldBonus = state.isActive ? 14 : 0;
    const completedRatioPenalty = interruptedSessionsCount * 12;
    const baseShield =
      completedSessionsCount > 0
        ? Math.min(96, 72 + completedSessionsCount * 6)
        : 64;
    const distractionShieldScore = Math.min(
      100,
      Math.max(25, baseShield + activeShieldBonus - completedRatioPenalty)
    );

    const score = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          sessionCompletionRate * 0.5 +
            blockDepthScore * 0.3 +
            distractionShieldScore * 0.2
        )
      )
    );

    let tierLabel: FocusIntensityMetrics['tierLabel'] = 'Steady Cadence';
    if (
      totalAttempted > 0 &&
      interruptedSessionsCount > completedSessionsCount &&
      score < 60
    ) {
      tierLabel = 'Interrupted · Rebuilding';
    } else if (score >= 90) {
      tierLabel = 'Peak Deep Flow';
    } else if (score >= 76) {
      tierLabel = 'High Focus';
    } else if (score >= 60) {
      tierLabel = 'Steady Cadence';
    } else {
      tierLabel = 'Building Momentum';
    }

    return {
      score,
      tierLabel,
      sessionCompletionRate,
      blockDepthScore,
      distractionShieldScore,
      completedSessionsCount,
      interruptedSessionsCount,
      avgCompletedBlockMinutes,
    };
  }, [
    state.sessionsHistory,
    state.isActive,
    state.plannedMinutes,
    pomodoroLogs,
    completedPomodoroSessions,
    syncedFocusMinutes,
    readingProgress,
  ]);

  return {
    state,
    focusIntensity,
    toggleDeepWork,
    startDeepWork,
    pauseResumeDeepWork,
    completeDeepWorkSession,
    endDeepWorkEarly,
    setPlannedMinutes,
    setLinkedGuideId,
    incrementBlockedDistractions,
  };
}
