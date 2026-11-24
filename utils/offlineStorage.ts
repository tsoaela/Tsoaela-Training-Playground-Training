import { useState, useEffect } from 'react';
import { StudyGuide } from '../types';

const OFFLINE_CACHE_NAME = 'ttg-critical-content-v1';
const OFFLINE_LOCAL_STORAGE_KEY = 'ttg_offline_cached_guides';
const OFFLINE_CACHED_IDS_KEY = 'ttg_offline_cached_ids';

/**
 * Check if the browser currently has network access.
 */
export function getIsOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * React hook to listen for online and offline status changes.
 */
export function useOnlineStatus(): { isOnline: boolean; wasOffline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(getIsOnline());
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(getIsOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Cache an array of critical study guides into Cache API and localStorage.
 */
export async function cacheAllStudyGuidesLocally(guides: StudyGuide[]): Promise<boolean> {
  if (!guides || guides.length === 0) return false;

  try {
    // 1. Persist to localStorage for instantaneous synchronous retrieval
    localStorage.setItem(OFFLINE_LOCAL_STORAGE_KEY, JSON.stringify(guides));
    const cachedIds = guides.map(g => g.id);
    localStorage.setItem(OFFLINE_CACHED_IDS_KEY, JSON.stringify(cachedIds));

    // 2. Persist to Cache API if available
    if ('caches' in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      for (const guide of guides) {
        const url = `/api/study-guides/${guide.id}`;
        const response = new Response(JSON.stringify(guide), {
          headers: {
            'Content-Type': 'application/json',
            'X-TTG-Offline-Cache': 'true',
            'X-Cached-At': new Date().toISOString(),
          },
        });
        await cache.put(url, response);
      }
    }

    return true;
  } catch (err) {
    console.warn('Failed to cache critical study guides locally:', err);
    return false;
  }
}

/**
 * Retrieve all study guides from the offline local cache.
 */
export function getCachedOfflineGuides(): StudyGuide[] {
  try {
    const raw = localStorage.getItem(OFFLINE_LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a specific guide is available in offline storage.
 */
export function isGuideCachedOffline(guideId: string): boolean {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHED_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(guideId);
  } catch {
    return false;
  }
}

/**
 * Cache an individual study guide when viewed or downloaded.
 */
export async function saveGuideToOfflineCache(guide: StudyGuide): Promise<void> {
  try {
    const existing = getCachedOfflineGuides();
    const updated = existing.some(g => g.id === guide.id)
      ? existing.map(g => g.id === guide.id ? guide : g)
      : [guide, ...existing];

    await cacheAllStudyGuidesLocally(updated);
  } catch (err) {
    console.warn('Could not save individual guide to offline cache:', err);
  }
}
