import { PomodoroSessionLog, StudyGuide, UserProfile } from '../types';

export interface PomodoroCsvExportInput {
  user: UserProfile;
  pomodoroLogs: PomodoroSessionLog[];
  studyGuides: StudyGuide[];
  syncedFocusMinutes: number;
  completedPomodoroSessions: number;
  totalStudyHours: number;
}

export interface PomodoroCsvExportResult {
  filename: string;
  exportedRowsCount: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
}

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function summarizePomodoroLogs(
  pomodoroLogs: PomodoroSessionLog[],
  syncedFocusMinutes: number
) {
  const focusLogs = pomodoroLogs.filter((log) => log.phase === 'focus');
  const loggedFocusMinutes = focusLogs.reduce(
    (sum, log) => sum + Math.max(0, Number(log.durationMinutes) || 0),
    0
  );
  const effectiveFocusMinutes = Math.max(loggedFocusMinutes, syncedFocusMinutes);
  return {
    focusSessionsCount: focusLogs.length,
    totalLogsCount: pomodoroLogs.length,
    loggedFocusMinutes,
    effectiveFocusMinutes,
    effectiveFocusHours: Number((effectiveFocusMinutes / 60).toFixed(2)),
  };
}

function makeSlug(name: string): string {
  return (name || 'Scholar')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

function formatPhaseLabel(phase: PomodoroSessionLog['phase']): string {
  if (phase === 'focus') return 'Focus Session';
  if (phase === 'short_break') return 'Short Break';
  return 'Long Break';
}

export function buildPomodoroLogsCsvContent(input: PomodoroCsvExportInput): {
  csvContent: string;
  exportedRowsCount: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
} {
  const {
    user,
    pomodoroLogs,
    studyGuides,
    syncedFocusMinutes,
    completedPomodoroSessions,
    totalStudyHours,
  } = input;

  const chronologicalLogs = [...pomodoroLogs].sort((a, b) => {
    const ta = new Date(a.completedAt).getTime();
    const tb = new Date(b.completedAt).getTime();
    if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
    return ta - tb;
  });

  const headers = [
    'Session ID',
    'Scholar Name',
    'Scholar Email',
    'Date',
    'Time',
    'Course / Study Guide',
    'Course ID',
    'Category',
    'Phase',
    'Duration (Minutes)',
    'Duration (Hours)',
    'Cumulative Focus Minutes',
    'Cumulative Focus Hours',
    'Completed At (ISO)',
  ];

  const rows: (string | number)[][] = [headers];

  let cumulativeFocusMinutes = 0;

  chronologicalLogs.forEach((log) => {
    const durationMin = Math.max(0, Number(log.durationMinutes) || 0);
    const durationHours = Number((durationMin / 60).toFixed(2));
    if (log.phase === 'focus') {
      cumulativeFocusMinutes += durationMin;
    }

    const parsedDate = new Date(log.completedAt);
    const isValidDate = !Number.isNaN(parsedDate.getTime());
    const dateStr = isValidDate ? parsedDate.toISOString().slice(0, 10) : '';
    const timeStr = isValidDate
      ? parsedDate.toTimeString().slice(0, 8)
      : '';

    const normalizedTitle = (log.guideTitle || '').trim().toLowerCase();
    const matchedGuide = normalizedTitle
      ? studyGuides.find((g) => g.title.trim().toLowerCase() === normalizedTitle)
      : undefined;

    rows.push([
      log.id,
      user.name || 'Scholar',
      user.email || '',
      dateStr,
      timeStr,
      log.guideTitle || 'Independent Study Session',
      matchedGuide?.id || 'general',
      matchedGuide?.category || 'General Study',
      formatPhaseLabel(log.phase),
      durationMin,
      durationHours.toFixed(2),
      cumulativeFocusMinutes,
      (cumulativeFocusMinutes / 60).toFixed(2),
      log.completedAt,
    ]);
  });

  const effectiveFocusMinutes = Math.max(cumulativeFocusMinutes, syncedFocusMinutes);
  const effectiveFocusHours = Number((effectiveFocusMinutes / 60).toFixed(2));

  // Append blank separator and summary rows for spreadsheet clarity
  rows.push([]);
  rows.push([
    'SUMMARY',
    user.name || 'Scholar',
    user.email || '',
    new Date().toISOString().slice(0, 10),
    '',
    `Logged Sessions: ${chronologicalLogs.length} (Synced Focus Sessions: ${completedPomodoroSessions})`,
    '',
    'Pomodoro Study Report',
    'All Focus Sessions',
    effectiveFocusMinutes,
    effectiveFocusHours.toFixed(2),
    effectiveFocusMinutes,
    effectiveFocusHours.toFixed(2),
    `Combined Platform Study Hours: ${totalStudyHours.toFixed(1)}h`,
  ]);

  const csvBody = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\r\n');

  // UTF-8 BOM ensures clean accented characters & units in Excel / Numbers / Google Sheets
  const csvContent = `\uFEFF${csvBody}`;

  return {
    csvContent,
    exportedRowsCount: chronologicalLogs.length,
    totalFocusMinutes: effectiveFocusMinutes,
    totalFocusHours: effectiveFocusHours,
  };
}

export function exportPomodoroLogsCsv(
  input: PomodoroCsvExportInput
): PomodoroCsvExportResult {
  const { csvContent, exportedRowsCount, totalFocusMinutes, totalFocusHours } =
    buildPomodoroLogsCsvContent(input);

  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `TTG_Pomodoro_Focus_Logs_${makeSlug(input.user.name)}_${datePart}.csv`;

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

  return {
    filename,
    exportedRowsCount,
    totalFocusMinutes,
    totalFocusHours,
  };
}
