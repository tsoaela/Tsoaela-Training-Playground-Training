import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BackgroundSyncStatus,
  OfflineAssignmentSubmission,
  ReadingProgress,
  SyncQueueItem,
} from '../types';
import {
  enqueueAssignmentSubmissionSync,
  enqueueStudyProgressSync,
  flushSyncQueue,
  FlushSyncResult,
  getLastSyncedAt,
  getSyncQueue,
} from '../services/backgroundSyncService';

export function useBackgroundSync(
  isOnline: boolean,
  userId: string,
  onSyncCompleted?: (result: FlushSyncResult) => void
) {
  const [queuedItems, setQueuedItems] = useState<SyncQueueItem[]>(() => getSyncQueue());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastSyncedAt());
  const [syncStatus, setSyncStatus] = useState<BackgroundSyncStatus>(() => {
    const initial = getSyncQueue();
    if (!isOnline) return initial.length > 0 ? 'queued_offline' : 'idle';
    return initial.length > 0 ? 'syncing' : 'idle';
  });

  const isFlushingRef = useRef(false);
  const wasOfflineRef = useRef(!isOnline);
  const onSyncCompletedRef = useRef(onSyncCompleted);
  onSyncCompletedRef.current = onSyncCompleted;

  const performSync = useCallback(async () => {
    if (isFlushingRef.current) return;
    const currentQueue = getSyncQueue();
    if (currentQueue.length === 0) {
      setSyncStatus('idle');
      return;
    }

    if (!navigator.onLine) {
      setSyncStatus('queued_offline');
      return;
    }

    isFlushingRef.current = true;
    setSyncStatus('syncing');

    const result = await flushSyncQueue(userId);
    const updatedQueue = getSyncQueue();
    setQueuedItems(updatedQueue);

    if (result.error) {
      setSyncStatus(navigator.onLine ? 'error' : 'queued_offline');
    } else {
      if (result.serverTimestamp) {
        setLastSyncedAt(result.serverTimestamp);
      }
      setSyncStatus(updatedQueue.length > 0 ? 'queued_offline' : 'synced');
      if (result.syncedCount > 0) {
        onSyncCompletedRef.current?.(result);
      }
    }

    isFlushingRef.current = false;
  }, [userId]);

  // Automatically push cached study progress & offline assignments when connection is restored
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setSyncStatus((prev) =>
        queuedItems.length > 0 ? 'queued_offline' : prev === 'syncing' ? 'queued_offline' : 'idle'
      );
      return;
    }

    const pending = getSyncQueue();
    if (pending.length > 0) {
      void performSync();
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
    }
  }, [isOnline, queuedItems.length, performSync]);

  // Also listen directly to browser 'online' event for immediate reconnection trigger
  useEffect(() => {
    const handleOnlineReconnect = () => {
      if (getSyncQueue().length > 0) {
        void performSync();
      }
    };
    window.addEventListener('online', handleOnlineReconnect);
    return () => window.removeEventListener('online', handleOnlineReconnect);
  }, [performSync]);

  // Retry timer if items remain queued while online
  useEffect(() => {
    if (!isOnline || queuedItems.length === 0) return;
    const timer = window.setInterval(() => {
      if (navigator.onLine && getSyncQueue().length > 0) {
        void performSync();
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [isOnline, queuedItems.length, performSync]);

  const queueStudyProgress = useCallback(
    (guideId: string, progress: ReadingProgress) => {
      const updated = enqueueStudyProgressSync(userId, guideId, progress);
      setQueuedItems(updated);
      if (navigator.onLine) {
        void performSync();
      } else {
        setSyncStatus('queued_offline');
      }
    },
    [userId, performSync]
  );

  const queueAssignmentSubmission = useCallback(
    (submission: OfflineAssignmentSubmission) => {
      const updated = enqueueAssignmentSubmissionSync(submission);
      setQueuedItems(updated);
      if (navigator.onLine) {
        void performSync();
      } else {
        setSyncStatus('queued_offline');
      }
    },
    [performSync]
  );

  return {
    queuedItems,
    pendingCount: queuedItems.length,
    syncStatus,
    lastSyncedAt,
    queueStudyProgress,
    queueAssignmentSubmission,
    triggerManualSync: performSync,
  };
}
