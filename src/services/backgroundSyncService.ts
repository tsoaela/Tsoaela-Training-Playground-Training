import {
  OfflineAssignmentSubmission,
  ReadingProgress,
  SyncQueueItem,
} from '../types';

const SYNC_QUEUE_KEY = 'ttg_sync_queue_v1';
const LAST_SYNC_AT_KEY = 'ttg_last_synced_at_v1';
const SYNC_CACHE_NAME = 'ttg-sync-cache-v1';

export interface FlushSyncResult {
  syncedCount: number;
  syncedProgressCount: number;
  syncedAssignmentCount: number;
  remainingCount: number;
  serverTimestamp: string | null;
  error?: string;
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_AT_KEY);
  } catch {
    return null;
  }
}

async function mirrorQueueToCacheApi(queue: SyncQueueItem[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(SYNC_CACHE_NAME);
    const response = new Response(JSON.stringify({ queue, cachedAt: new Date().toISOString() }), {
      headers: {
        'Content-Type': 'application/json',
        'X-TTG-Sync-Queue': 'true',
      },
    });
    await cache.put('/api/sync/pending-queue', response);
  } catch {
    // Cache API unavailable or quota constrained
  }
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    void mirrorQueueToCacheApi(queue);
  } catch (err) {
    console.warn('Unable to persist background sync queue:', err);
  }
}

async function registerServiceWorkerBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (registration as unknown as {
      sync?: { register: (tag: string) => Promise<void> };
    }).sync;
    if (syncManager) {
      await syncManager.register('ttg-progress-sync');
    }
  } catch {
    // Background Sync API not supported in this browser; online listener fallback handles flush
  }
}

export function enqueueStudyProgressSync(
  userId: string,
  guideId: string,
  progress: ReadingProgress
): SyncQueueItem[] {
  const existing = getSyncQueue();
  // Coalesce latest study_progress snapshot per userId + guideId so queue stays compact
  const filtered = existing.filter(
    (item) => !(item.type === 'study_progress' && item.userId === userId && item.courseId === guideId)
  );
  const nextItem: SyncQueueItem = {
    id: `sync_prog_${guideId}_${Date.now()}`,
    type: 'study_progress',
    userId,
    courseId: guideId,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    progressPayload: progress,
  };
  const nextQueue = [nextItem, ...filtered];
  saveSyncQueue(nextQueue);
  void registerServiceWorkerBackgroundSync();
  return nextQueue;
}

export function enqueueAssignmentSubmissionSync(
  submission: OfflineAssignmentSubmission
): SyncQueueItem[] {
  const existing = getSyncQueue();
  const nextItem: SyncQueueItem = {
    id: `sync_assign_${submission.id}`,
    type: 'assignment_submission',
    userId: submission.userId,
    courseId: submission.courseId,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    assignmentPayload: submission,
  };
  const nextQueue = [nextItem, ...existing.filter((i) => i.id !== nextItem.id)];
  saveSyncQueue(nextQueue);
  void registerServiceWorkerBackgroundSync();
  return nextQueue;
}

export async function flushSyncQueue(userId: string): Promise<FlushSyncResult> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    return {
      syncedCount: 0,
      syncedProgressCount: 0,
      syncedAssignmentCount: 0,
      remainingCount: 0,
      serverTimestamp: getLastSyncedAt(),
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      syncedCount: 0,
      syncedProgressCount: 0,
      syncedAssignmentCount: 0,
      remainingCount: queue.length,
      serverTimestamp: getLastSyncedAt(),
      error: 'Offline — retained in local sync queue',
    };
  }

  const progressItems = queue.filter((i) => i.type === 'study_progress' && i.progressPayload);
  const assignmentItems = queue.filter((i) => i.type === 'assignment_submission' && i.assignmentPayload);

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        readingProgressUpdates: progressItems.map((i) => ({
          guideId: i.courseId,
          progress: i.progressPayload,
        })),
        offlineAssignments: assignmentItems.map((i) => i.assignmentPayload),
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync endpoint returned HTTP ${response.status}`);
    }

    const result = await response.json();
    const flushedIds = new Set(queue.map((i) => i.id));
    // Re-read queue in case another write arrived mid-flight
    const latestQueue = getSyncQueue();
    const remainingQueue = latestQueue.filter((item) => !flushedIds.has(item.id));
    saveSyncQueue(remainingQueue);

    const serverTimestamp = result.serverTimestamp || new Date().toISOString();
    try {
      localStorage.setItem(LAST_SYNC_AT_KEY, serverTimestamp);
    } catch {}

    return {
      syncedCount: result.syncedItemsCount || queue.length,
      syncedProgressCount: result.syncedProgressCount || progressItems.length,
      syncedAssignmentCount: result.syncedAssignmentCount || assignmentItems.length,
      remainingCount: remainingQueue.length,
      serverTimestamp,
    };
  } catch (err: any) {
    const retried = queue.map((item) => ({
      ...item,
      retryCount: item.retryCount + 1,
    }));
    saveSyncQueue(retried);
    return {
      syncedCount: 0,
      syncedProgressCount: 0,
      syncedAssignmentCount: 0,
      remainingCount: retried.length,
      serverTimestamp: getLastSyncedAt(),
      error: err?.message || 'Network unavailable',
    };
  }
}
