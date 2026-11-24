import { DeepWorkState, PomodoroSessionLog, StudyGuide, UserProfile } from '../types';
import { escapeCsvCell } from './pomodoroCsvExport';
import { DailyFocusIntensityTrend30d } from './deepWorkAnalytics';

function makeSlug(name?: string): string {
  return (name || 'Scholar')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

function triggerCsvDownload(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildDailyFocusIntensityCsvContent(params: {
  user: Partial<UserProfile>;
  trend: DailyFocusIntensityTrend30d;
  includeRestDays?: boolean;
}): {
  csvContent: string;
  exportedRowsCount: number;
} {
  const { user, trend, includeRestDays = true } = params;

  const headers = [
    'Date (YYYY-MM-DD)',
    'Weekday',
    'Daily Focus Intensity (0-100)',
    '7-Day Rolling Baseline',
    'Completed Focus Minutes',
    'Interrupted Minutes',
    'Total Study Minutes',
    'Total Study Hours',
    'Completed & Logged Blocks',
    'Peak Study Window',
    'Top Linked Course',
  ];

  const rows: (string | number)[][] = [headers];

  const sourcePoints = includeRestDays
    ? trend.points
    : trend.points.filter((p) => p.dailyFocusIntensity !== null);

  sourcePoints.forEach((pt) => {
    rows.push([
      pt.dateKey,
      pt.weekday,
      pt.dailyFocusIntensity !== null ? pt.dailyFocusIntensity : 0,
      pt.rolling7DayAvg !== null ? pt.rolling7DayAvg : '',
      pt.completedMinutes,
      pt.interruptedMinutes,
      pt.totalMinutes,
      (pt.totalMinutes / 60).toFixed(2),
      pt.sessionsCount,
      pt.peakSlotLabel || 'Rest Day',
      pt.topCourseTitle || 'No Sessions',
    ]);
  });

  rows.push([]);
  rows.push([
    'SUMMARY (30-DAY WINDOW)',
    user.name || 'Scholar',
    trend.avgIntensity30d,
    '',
    sourcePoints.reduce((s, p) => s + p.completedMinutes, 0),
    sourcePoints.reduce((s, p) => s + p.interruptedMinutes, 0),
    sourcePoints.reduce((s, p) => s + p.totalMinutes, 0),
    (sourcePoints.reduce((s, p) => s + p.totalMinutes, 0) / 60).toFixed(2),
    sourcePoints.reduce((s, p) => s + p.sessionsCount, 0),
    `${trend.peakProductivityWindowLabel} (${trend.peakProductivityWindowRange})`,
    trend.peakDayLabel ? `Peak Day: ${trend.peakDayLabel} (${trend.peakDayScore}/100)` : '',
  ]);

  const csvBody = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\r\n');

  return {
    csvContent: `\uFEFF${csvBody}`,
    exportedRowsCount: sourcePoints.length,
  };
}

export function exportDailyFocusIntensityCsv(params: {
  user: Partial<UserProfile>;
  trend: DailyFocusIntensityTrend30d;
  includeRestDays?: boolean;
}): { filename: string; exportedRowsCount: number } {
  const { csvContent, exportedRowsCount } = buildDailyFocusIntensityCsvContent(params);
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `TTG_Daily_Focus_Intensity_${makeSlug(params.user.name)}_${datePart}.csv`;
  triggerCsvDownload(csvContent, filename);
  return { filename, exportedRowsCount };
}

export interface UnifiedFocusSessionHistoryEntry {
  id: string;
  source: 'Deep Work' | 'Pomodoro';
  status: 'completed' | 'interrupted';
  courseId: string;
  courseTitle: string;
  category: string;
  plannedMinutes: number;
  durationMinutes: number;
  distractionsBlockedCount: number;
  startedAt: string;
  completedAt: string;
  completedAtMs: number;
  reflectionNotes?: string;
}

export function buildUnifiedFocusSessionHistory(params: {
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides?: StudyGuide[];
  onlyCompleted?: boolean;
}): UnifiedFocusSessionHistoryEntry[] {
  const {
    deepWorkState,
    pomodoroLogs = [],
    studyGuides = [],
    onlyCompleted = true,
  } = params;

  const entries: UnifiedFocusSessionHistoryEntry[] = [];

  (deepWorkState?.sessionsHistory || []).forEach((rec) => {
    if (onlyCompleted && rec.status !== 'completed') return;
    const guide = studyGuides.find(
      (g) =>
        g.id === rec.guideId ||
        g.title.trim().toLowerCase() === (rec.guideTitle || '').trim().toLowerCase()
    );
    const ts = new Date(rec.endedAt || rec.startedAt).getTime();
    entries.push({
      id: rec.id,
      source: 'Deep Work',
      status: rec.status,
      courseId: guide?.id || rec.guideId,
      courseTitle: guide?.title || rec.guideTitle || 'Deep Work Focus Block',
      category: guide?.category || 'Deep Work Study',
      plannedMinutes: rec.plannedMinutes,
      durationMinutes: Math.max(1, rec.elapsedMinutes || 0),
      distractionsBlockedCount: rec.distractionsBlockedCount || 0,
      startedAt: rec.startedAt,
      completedAt: rec.endedAt || rec.startedAt,
      completedAtMs: Number.isNaN(ts) ? 0 : ts,
      reflectionNotes: rec.reflectionNotes,
    });
  });

  pomodoroLogs
    .filter((l) => l.phase === 'focus')
    .forEach((log) => {
      if (log.guideTitle && /\(deep work\)/i.test(log.guideTitle)) return;
      const cleanTitle = (log.guideTitle || '').trim();
      const guide = cleanTitle
        ? studyGuides.find((g) => g.title.trim().toLowerCase() === cleanTitle.toLowerCase())
        : undefined;
      const ts = new Date(log.completedAt).getTime();
      entries.push({
        id: `pomo_${log.id}`,
        source: 'Pomodoro',
        status: 'completed',
        courseId: guide?.id || 'general',
        courseTitle: guide?.title || cleanTitle || 'Pomodoro Focus Interval',
        category: guide?.category || 'Focused Study',
        plannedMinutes: Math.max(15, log.durationMinutes || 25),
        durationMinutes: Math.max(1, log.durationMinutes || 25),
        distractionsBlockedCount: 0,
        startedAt: log.completedAt,
        completedAt: log.completedAt,
        completedAtMs: Number.isNaN(ts) ? 0 : ts,
      });
    });

  return entries.sort((a, b) => b.completedAtMs - a.completedAtMs);
}

export function buildFocusSessionHistoryCsvContent(params: {
  user: Partial<UserProfile>;
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides?: StudyGuide[];
}): {
  csvContent: string;
  exportedRowsCount: number;
  totalMinutes: number;
} {
  const { user, deepWorkState, pomodoroLogs = [], studyGuides = [] } = params;
  const entries = buildUnifiedFocusSessionHistory({
    deepWorkState,
    pomodoroLogs,
    studyGuides,
    onlyCompleted: false,
  });

  const headers = [
    'Session ID',
    'Scholar Name',
    'Scholar Email',
    'Mode',
    'Status',
    'Linked Course Title',
    'Course ID',
    'Subject / Category',
    'Duration (Minutes)',
    'Planned Minutes',
    'Distractions Blocked',
    'Completion Date',
    'Completion Timestamp (ISO)',
    'Key Takeaways / Reflections',
  ];

  const rows: (string | number)[][] = [headers];
  let totalMinutes = 0;

  entries.forEach((item) => {
    totalMinutes += item.durationMinutes;
    const dt = new Date(item.completedAt);
    const dateLabel = Number.isNaN(dt.getTime())
      ? item.completedAt
      : dt.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    rows.push([
      item.id,
      user.name || 'Scholar',
      user.email || '',
      item.source,
      item.status === 'completed' ? 'Completed' : 'Ended Early',
      item.courseTitle,
      item.courseId,
      item.category,
      item.durationMinutes,
      item.plannedMinutes,
      item.distractionsBlockedCount,
      dateLabel,
      item.completedAt,
      item.reflectionNotes || '',
    ]);
  });

  const csvBody = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\r\n');

  return {
    csvContent: `\uFEFF${csvBody}`,
    exportedRowsCount: entries.length,
    totalMinutes,
  };
}

export function exportFocusSessionHistoryCsv(params: {
  user: Partial<UserProfile>;
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides?: StudyGuide[];
}): { filename: string; exportedRowsCount: number; totalMinutes: number } {
  const { csvContent, exportedRowsCount, totalMinutes } =
    buildFocusSessionHistoryCsvContent(params);
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `TTG_Focus_Session_History_${makeSlug(params.user.name)}_${datePart}.csv`;
  triggerCsvDownload(csvContent, filename);
  return { filename, exportedRowsCount, totalMinutes };
}
