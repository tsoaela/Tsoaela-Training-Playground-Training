import { RegisteredStudyGroup } from '../types';

export interface StudyStreakDayCell {
  dateKey: string;
  shortDay: string;
  dayNumber: string;
  fullLabel: string;
  isActive: boolean;
  isToday: boolean;
  attendeeCount: number;
}

export interface StudyGroupStreakStats {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  attendedToday: boolean;
  isStreakAtRisk: boolean;
  recentDays: StudyStreakDayCell[];
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftLocalDateKey(baseDateKey: string, deltaDays: number): string {
  const [y, m, d] = baseDateKey.split('-').map((n) => Number(n));
  const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
  return getLocalDateKey(dt);
}

const SHORT_DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const FULL_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeStudyGroupStreak(
  group: Pick<RegisteredStudyGroup, 'activeAttendanceDates' | 'attendanceByDate'>,
  referenceDateKey: string = getLocalDateKey(),
  windowDays: number = 7
): StudyGroupStreakStats {
  const rawDates = Array.isArray(group.activeAttendanceDates)
    ? group.activeAttendanceDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    : [];
  const activeSet = new Set(rawDates);
  const attendanceMap = group.attendanceByDate || {};

  const attendedToday = activeSet.has(referenceDateKey);
  const yesterdayKey = shiftLocalDateKey(referenceDateKey, -1);
  const attendedYesterday = activeSet.has(yesterdayKey);

  // Count consecutive days ending today (or ending yesterday if today isn't logged yet)
  let currentStreak = 0;
  let cursorKey = attendedToday ? referenceDateKey : attendedYesterday ? yesterdayKey : '';
  while (cursorKey && activeSet.has(cursorKey)) {
    currentStreak += 1;
    cursorKey = shiftLocalDateKey(cursorKey, -1);
  }

  // Compute longest consecutive streak across all recorded dates
  const sortedDates = Array.from(activeSet).sort();
  let bestStreak = 0;
  let running = 0;
  let prevKey: string | null = null;
  for (const dateKey of sortedDates) {
    if (prevKey && shiftLocalDateKey(prevKey, 1) === dateKey) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > bestStreak) {
      bestStreak = running;
    }
    prevKey = dateKey;
  }

  const recentDays: StudyStreakDayCell[] = [];
  for (let offset = -(windowDays - 1); offset <= 0; offset++) {
    const dateKey = shiftLocalDateKey(referenceDateKey, offset);
    const [y, m, d] = dateKey.split('-').map((n) => Number(n));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const isActive = activeSet.has(dateKey);
    const recordedAttendees = Array.isArray(attendanceMap[dateKey])
      ? attendanceMap[dateKey].length
      : isActive
      ? 1
      : 0;

    recentDays.push({
      dateKey,
      shortDay: SHORT_DAY_LABELS[dt.getDay()] || '',
      dayNumber: String(dt.getDate()),
      fullLabel: `${FULL_MONTH_LABELS[dt.getMonth()] || ''} ${dt.getDate()}`,
      isActive,
      isToday: offset === 0,
      attendeeCount: recordedAttendees,
    });
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalActiveDays: activeSet.size,
    attendedToday,
    isStreakAtRisk: !attendedToday && attendedYesterday,
    recentDays,
  };
}
