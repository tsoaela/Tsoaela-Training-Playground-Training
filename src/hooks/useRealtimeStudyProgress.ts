import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveStudySessionSnapshot,
  ReadingProgress,
  RealtimeStudyTelemetry,
} from '../types';

export interface UseRealtimeStudyProgressParams {
  isAuthenticated: boolean;
  userId: string;
  selectedCourseId: string | null;
  selectedCourseTitle: string | null;
  activeChapterIdx: number;
  currentProgressPercent: number;
  baseCourseStudySeconds: number;
  onTickStudySeconds: (courseId: string, deltaSeconds: number, activeChapterIdx?: number) => void;
  onHydrateServerProgress?: (serverProgress: Record<string, ReadingProgress>) => void;
}

export function useRealtimeStudyProgress({
  isAuthenticated,
  userId,
  selectedCourseId,
  selectedCourseTitle,
  activeChapterIdx,
  currentProgressPercent,
  baseCourseStudySeconds,
  onTickStudySeconds,
  onHydrateServerProgress,
}: UseRealtimeStudyProgressParams) {
  const isLiveActive = Boolean(isAuthenticated && selectedCourseId);
  const [sseStatus, setSseStatus] = useState<
    'disconnected' | 'connecting' | 'live' | 'reconnecting'
  >('disconnected');
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);
  const [serverTotalCourseSeconds, setServerTotalCourseSeconds] = useState<number>(
    baseCourseStudySeconds
  );

  const pendingDeltaSecondsRef = useRef<number>(0);
  const sessionSecondsRef = useRef<number>(0);
  const activeChapterRef = useRef<number>(activeChapterIdx);
  const progressPctRef = useRef<number>(currentProgressPercent);
  const onTickRef = useRef(onTickStudySeconds);
  const onHydrateRef = useRef(onHydrateServerProgress);

  activeChapterRef.current = activeChapterIdx;
  progressPctRef.current = currentProgressPercent;
  onTickRef.current = onTickStudySeconds;
  onHydrateRef.current = onHydrateServerProgress;

  // Keep server total synced with local base seconds when switching courses
  useEffect(() => {
    setServerTotalCourseSeconds(baseCourseStudySeconds);
  }, [baseCourseStudySeconds, selectedCourseId]);

  // Hydrate server study progress once whenever the user authenticates
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;

    fetch(`/api/sync/state?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (
          data.readingProgress &&
          typeof data.readingProgress === 'object' &&
          onHydrateRef.current
        ) {
          onHydrateRef.current(data.readingProgress);
        }
      })
      .catch(() => {
        // Silent offline fallback: local storage remains intact
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  const sendHeartbeat = useCallback(
    async (
      courseId: string,
      courseTitle: string,
      opts?: { keepalive?: boolean; isClosing?: boolean }
    ) => {
      const deltaToFlush = pendingDeltaSecondsRef.current;
      pendingDeltaSecondsRef.current = 0;

      try {
        const res = await fetch('/api/study-progress/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: Boolean(opts?.keepalive),
          body: JSON.stringify({
            userId,
            courseId,
            courseTitle,
            activeChapterIdx: activeChapterRef.current,
            progressPercent: progressPctRef.current,
            deltaSeconds: deltaToFlush,
            sessionSeconds: sessionSecondsRef.current,
            isActive: !opts?.isClosing,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            snapshot?: LiveStudySessionSnapshot;
          };
          if (data?.snapshot) {
            setLastHeartbeatAt(data.snapshot.lastHeartbeatAt);
            setServerTotalCourseSeconds((prev) =>
              Math.max(prev, data.snapshot?.totalCourseStudySeconds || 0)
            );
          }
        } else {
          // Restore un-flushed delta if request failed
          pendingDeltaSecondsRef.current += deltaToFlush;
        }
      } catch {
        pendingDeltaSecondsRef.current += deltaToFlush;
      }
    },
    [userId]
  );

  // Real-time SSE connection + 1s timer + 5s heartbeat ONLY when logged in AND course selected
  useEffect(() => {
    if (!isLiveActive || !selectedCourseId) {
      setSseStatus('disconnected');
      setSessionElapsedSeconds(0);
      sessionSecondsRef.current = 0;
      pendingDeltaSecondsRef.current = 0;
      return;
    }

    const courseId = selectedCourseId;
    const courseTitle = selectedCourseTitle || courseId;
    sessionSecondsRef.current = 0;
    pendingDeltaSecondsRef.current = 0;
    setSessionElapsedSeconds(0);
    setSseStatus('connecting');

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(
        `/api/study-progress/stream?userId=${encodeURIComponent(userId)}`
      );

      eventSource.addEventListener('connected', () => {
        setSseStatus('live');
      });

      eventSource.addEventListener('study_progress', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as {
            snapshot?: LiveStudySessionSnapshot;
          };
          if (payload?.snapshot && payload.snapshot.courseId === courseId) {
            setLastHeartbeatAt(payload.snapshot.lastHeartbeatAt);
            setServerTotalCourseSeconds((prev) =>
              Math.max(prev, payload.snapshot?.totalCourseStudySeconds || 0)
            );
          }
        } catch {
          // Ignore malformed SSE event
        }
      });

      eventSource.onerror = () => {
        setSseStatus('reconnecting');
      };
    } catch {
      setSseStatus('reconnecting');
    }

    // Immediate opening heartbeat so server knows course study session started
    void sendHeartbeat(courseId, courseTitle);

    const tickInterval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      sessionSecondsRef.current += 1;
      pendingDeltaSecondsRef.current += 1;
      setSessionElapsedSeconds(sessionSecondsRef.current);
      onTickRef.current(courseId, 1, activeChapterRef.current);
    }, 1000);

    const heartbeatInterval = window.setInterval(() => {
      if (pendingDeltaSecondsRef.current > 0) {
        void sendHeartbeat(courseId, courseTitle);
      }
    }, 5000);

    const handlePageHide = () => {
      if (pendingDeltaSecondsRef.current > 0) {
        void sendHeartbeat(courseId, courseTitle, { keepalive: true, isClosing: true });
      }
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(heartbeatInterval);
      window.removeEventListener('pagehide', handlePageHide);
      if (pendingDeltaSecondsRef.current > 0 || sessionSecondsRef.current > 0) {
        void sendHeartbeat(courseId, courseTitle, { keepalive: true, isClosing: true });
      }
      eventSource?.close();
      setSseStatus('disconnected');
    };
  }, [isLiveActive, selectedCourseId, selectedCourseTitle, userId, sendHeartbeat]);

  const flushHeartbeatNow = useCallback(async () => {
    if (!isLiveActive || !selectedCourseId) return;
    await sendHeartbeat(selectedCourseId, selectedCourseTitle || selectedCourseId);
  }, [isLiveActive, selectedCourseId, selectedCourseTitle, sendHeartbeat]);

  const telemetry: RealtimeStudyTelemetry = {
    isLiveActive,
    sseStatus,
    activeCourseId: isLiveActive ? selectedCourseId : null,
    activeCourseTitle: isLiveActive ? selectedCourseTitle : null,
    activeChapterIdx,
    sessionElapsedSeconds,
    totalCourseStudySeconds: Math.max(baseCourseStudySeconds, serverTotalCourseSeconds),
    lastHeartbeatAt,
  };

  return {
    telemetry,
    flushHeartbeatNow,
  };
}
