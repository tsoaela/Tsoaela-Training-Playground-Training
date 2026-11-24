import { useState, useEffect, useCallback, useRef } from 'react';
import { PomodoroPhase } from '../types';
import {
  AMBIENCE_TRACKS,
  deepWorkAmbienceEngine,
} from '../utils/deepWorkAmbienceEngine';

const STORAGE_KEY = 'ttg_deep_work_ambience_prefs_v1';

interface StoredAmbiencePrefs {
  masterVolume: number;
  trackVolumes: Record<string, number>;
  autoPauseOnSessionEnd: boolean;
  preferredTrackIds: string[];
}

const DEFAULT_TRACK_VOLUMES: Record<string, number> = Object.fromEntries(
  AMBIENCE_TRACKS.map((t) => [t.id, t.defaultVolume])
);

const DEFAULT_PREFS: StoredAmbiencePrefs = {
  masterVolume: 0.72,
  trackVolumes: DEFAULT_TRACK_VOLUMES,
  autoPauseOnSessionEnd: true,
  preferredTrackIds: ['lofi_late_night', 'midnight_rain'],
};

export interface DeepWorkAmbienceController {
  activeTrackIds: string[];
  pausedTrackIds: string[];
  trackVolumes: Record<string, number>;
  masterVolume: number;
  isMuted: boolean;
  isPlaying: boolean;
  autoPauseOnSessionEnd: boolean;
  lastAutoPauseReason: string | null;
  toggleTrack: (trackId: string) => void;
  applyPreset: (trackIds: string[]) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  pausePlayback: (reason?: string) => void;
  resumePlayback: () => void;
  stopAll: () => void;
  setAutoPauseOnSessionEnd: (enabled: boolean) => void;
  clearAutoPauseReason: () => void;
}

interface UseDeepWorkAmbienceParams {
  isDeepWorkActive: boolean;
  isDeepWorkPaused: boolean;
  pomodoroPhase: PomodoroPhase;
  isPomodoroRunning: boolean;
  onAutoPause?: (reason: string) => void;
}

export function useDeepWorkAmbience({
  isDeepWorkActive,
  pomodoroPhase,
  isPomodoroRunning,
  onAutoPause,
}: UseDeepWorkAmbienceParams): DeepWorkAmbienceController {
  const [prefs, setPrefs] = useState<StoredAmbiencePrefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          masterVolume:
            typeof parsed.masterVolume === 'number'
              ? Math.min(1, Math.max(0, parsed.masterVolume))
              : DEFAULT_PREFS.masterVolume,
          trackVolumes: {
            ...DEFAULT_TRACK_VOLUMES,
            ...(parsed.trackVolumes && typeof parsed.trackVolumes === 'object'
              ? parsed.trackVolumes
              : {}),
          },
          autoPauseOnSessionEnd:
            typeof parsed.autoPauseOnSessionEnd === 'boolean'
              ? parsed.autoPauseOnSessionEnd
              : true,
          preferredTrackIds:
            Array.isArray(parsed.preferredTrackIds) && parsed.preferredTrackIds.length > 0
              ? parsed.preferredTrackIds
              : DEFAULT_PREFS.preferredTrackIds,
        };
      }
    } catch {}
    return DEFAULT_PREFS;
  });

  // Active playing layers (never auto-plays on page load; requires explicit user gesture)
  const [activeTrackIds, setActiveTrackIds] = useState<string[]>([]);
  const [pausedTrackIds, setPausedTrackIds] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastAutoPauseReason, setLastAutoPauseReason] = useState<string | null>(null);

  const onAutoPauseRef = useRef(onAutoPause);
  onAutoPauseRef.current = onAutoPause;

  // Persist user preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  // Keep Web Audio engine synchronized with React state
  useEffect(() => {
    deepWorkAmbienceEngine.syncActiveTracks(
      activeTrackIds,
      prefs.trackVolumes,
      prefs.masterVolume,
      isMuted
    );
  }, [activeTrackIds, prefs.trackVolumes, prefs.masterVolume, isMuted]);

  const pausePlayback = useCallback((reason?: string) => {
    setActiveTrackIds((curr) => {
      if (curr.length > 0) {
        setPausedTrackIds(curr);
      }
      return [];
    });
    if (reason) {
      setLastAutoPauseReason(reason);
    }
  }, []);

  const resumePlayback = useCallback(() => {
    setLastAutoPauseReason(null);
    setActiveTrackIds((curr) => {
      if (curr.length > 0) return curr;
      if (pausedTrackIds.length > 0) return pausedTrackIds;
      return prefs.preferredTrackIds;
    });
    setPausedTrackIds([]);
  }, [pausedTrackIds, prefs.preferredTrackIds]);

  const stopAll = useCallback(() => {
    setActiveTrackIds([]);
    setPausedTrackIds([]);
    setLastAutoPauseReason(null);
  }, []);

  const toggleTrack = useCallback((trackId: string) => {
    setLastAutoPauseReason(null);
    setPausedTrackIds([]);
    setActiveTrackIds((prev) => {
      const exists = prev.includes(trackId);
      const next = exists ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      if (next.length > 0) {
        setPrefs((p) => ({ ...p, preferredTrackIds: next }));
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback((trackIds: string[]) => {
    const valid = trackIds.filter((id) => AMBIENCE_TRACKS.some((t) => t.id === id));
    if (valid.length === 0) return;
    setLastAutoPauseReason(null);
    setPausedTrackIds([]);
    setIsMuted(false);
    setActiveTrackIds(valid);
    setPrefs((p) => ({ ...p, preferredTrackIds: valid }));
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const clamped = Math.min(1, Math.max(0, volume));
    setPrefs((prev) => ({
      ...prev,
      trackVolumes: {
        ...prev.trackVolumes,
        [trackId]: clamped,
      },
    }));
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    const clamped = Math.min(1, Math.max(0, volume));
    setPrefs((prev) => ({
      ...prev,
      masterVolume: clamped,
    }));
    if (clamped > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setAutoPauseOnSessionEnd = useCallback((enabled: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      autoPauseOnSessionEnd: enabled,
    }));
    if (!enabled) {
      setLastAutoPauseReason(null);
    }
  }, []);

  const clearAutoPauseReason = useCallback(() => {
    setLastAutoPauseReason(null);
  }, []);

  // Automatically pause ambience when an active Deep Work or Pomodoro study session ends
  const isPomodoroFocusing = Boolean(isPomodoroRunning && pomodoroPhase === 'focus');
  const prevStudyStateRef = useRef<{
    deepWorkActive: boolean;
    pomodoroFocusing: boolean;
  }>({
    deepWorkActive: isDeepWorkActive,
    pomodoroFocusing: isPomodoroFocusing,
  });

  useEffect(() => {
    const prev = prevStudyStateRef.current;
    prevStudyStateRef.current = {
      deepWorkActive: isDeepWorkActive,
      pomodoroFocusing: isPomodoroFocusing,
    };

    const deepWorkJustEnded = prev.deepWorkActive && !isDeepWorkActive;
    const pomodoroFocusJustEnded = prev.pomodoroFocusing && !isPomodoroFocusing;

    if (!prefs.autoPauseOnSessionEnd) return;
    if (activeTrackIds.length === 0) return;

    // Only auto-pause when the study session that ended leaves no active study focus timer running
    if (deepWorkJustEnded && !isPomodoroFocusing) {
      const reason = 'Ambience auto-paused when your Deep Work study session ended.';
      pausePlayback(reason);
      onAutoPauseRef.current?.(reason);
    } else if (pomodoroFocusJustEnded && !isDeepWorkActive) {
      const reason =
        pomodoroPhase !== 'focus'
          ? 'Ambience auto-paused as your Pomodoro focus block transitioned to break.'
          : 'Ambience auto-paused when your Pomodoro study session ended.';
      pausePlayback(reason);
      onAutoPauseRef.current?.(reason);
    }
  }, [
    isDeepWorkActive,
    isPomodoroFocusing,
    pomodoroPhase,
    prefs.autoPauseOnSessionEnd,
    activeTrackIds.length,
    pausePlayback,
  ]);

  return {
    activeTrackIds,
    pausedTrackIds,
    trackVolumes: prefs.trackVolumes,
    masterVolume: prefs.masterVolume,
    isMuted,
    isPlaying: activeTrackIds.length > 0 && !isMuted,
    autoPauseOnSessionEnd: prefs.autoPauseOnSessionEnd,
    lastAutoPauseReason,
    toggleTrack,
    applyPreset,
    setTrackVolume,
    setMasterVolume,
    toggleMute,
    pausePlayback,
    resumePlayback,
    stopAll,
    setAutoPauseOnSessionEnd,
    clearAutoPauseReason,
  };
}
