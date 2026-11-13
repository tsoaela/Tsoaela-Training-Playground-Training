import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReadingProgress, OfflineAssignmentSubmission } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE_PATH = path.join(DB_DIR, 'ttg-sync-db.json');

interface SyncDatabaseSchema {
  users: Record<
    string,
    {
      readingProgress: Record<string, ReadingProgress>;
      assignments: Record<string, OfflineAssignmentSubmission>;
      lastSyncedAt: string;
    }
  >;
  syncEventsCount: number;
  updatedAt: string;
}

const DEFAULT_DB: SyncDatabaseSchema = {
  users: {},
  syncEventsCount: 0,
  updatedAt: new Date().toISOString(),
};

async function readDb(): Promise<SyncDatabaseSchema> {
  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as SyncDatabaseSchema;
    return parsed && typeof parsed === 'object' ? parsed : { ...DEFAULT_DB };
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function writeDb(db: SyncDatabaseSchema): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getSyncedUserState(userId: string) {
  const db = await readDb();
  const userRecord = db.users[userId] || {
    readingProgress: {},
    assignments: {},
    lastSyncedAt: null,
  };
  return {
    userId,
    readingProgress: userRecord.readingProgress,
    assignments: Object.values(userRecord.assignments),
    lastSyncedAt: userRecord.lastSyncedAt,
    totalSyncEvents: db.syncEventsCount,
  };
}

export interface BackgroundSyncRequestPayload {
  userId: string;
  readingProgressUpdates?: Array<{
    guideId: string;
    progress: ReadingProgress;
  }>;
  offlineAssignments?: OfflineAssignmentSubmission[];
}

export async function applyBackgroundSyncBatch(payload: BackgroundSyncRequestPayload) {
  const db = await readDb();
  const userId = payload.userId || 'anonymous';
  const now = new Date().toISOString();

  if (!db.users[userId]) {
    db.users[userId] = {
      readingProgress: {},
      assignments: {},
      lastSyncedAt: now,
    };
  }

  let syncedProgressCount = 0;
  let syncedAssignmentCount = 0;

  if (Array.isArray(payload.readingProgressUpdates)) {
    for (const item of payload.readingProgressUpdates) {
      if (item?.guideId && item?.progress) {
        db.users[userId].readingProgress[item.guideId] = {
          ...item.progress,
        };
        syncedProgressCount += 1;
      }
    }
  }

  if (Array.isArray(payload.offlineAssignments)) {
    for (const sub of payload.offlineAssignments) {
      if (sub?.id) {
        db.users[userId].assignments[sub.id] = {
          ...sub,
          syncedToDatabase: true,
          syncedAt: now,
        };
        syncedAssignmentCount += 1;
      }
    }
  }

  db.users[userId].lastSyncedAt = now;
  db.syncEventsCount += 1;
  db.updatedAt = now;

  await writeDb(db);

  return {
    ok: true,
    userId,
    syncedProgressCount,
    syncedAssignmentCount,
    syncedItemsCount: syncedProgressCount + syncedAssignmentCount,
    serverTimestamp: now,
    totalStoredGuides: Object.keys(db.users[userId].readingProgress).length,
    totalStoredAssignments: Object.keys(db.users[userId].assignments).length,
  };
}
