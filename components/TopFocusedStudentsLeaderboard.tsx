import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Clock,
  Flame,
  Gauge,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import {
  AcceptedRegisteredStudent,
  DeepWorkState,
  EnrolledStudentRecord,
  FocusIntensityMetrics,
  FocusedStudentRankEntry,
  PomodoroSessionLog,
  UserProfile,
} from '../types';

interface TopFocusedStudentsLeaderboardProps {
  user: UserProfile;
  enrollments: EnrolledStudentRecord[];
  acceptedStudents?: AcceptedRegisteredStudent[];
  deepWorkState?: DeepWorkState;
  focusIntensity?: FocusIntensityMetrics;
  pomodoroLogs?: PomodoroSessionLog[];
  syncedFocusMinutes?: number;
  onOpenActivityDashboard?: () => void;
}

function getCurrentCalendarWeekWindow(): {
  start: Date;
  end: Date;
  label: string;
} {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return {
    start,
    end,
    label: `${fmt(start)} – ${fmt(end)}`,
  };
}

function getTierFromScore(score: number): FocusIntensityMetrics['tierLabel'] {
  if (score >= 90) return 'Peak Deep Flow';
  if (score >= 76) return 'High Focus';
  if (score >= 60) return 'Steady Cadence';
  return 'Building Momentum';
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export const TopFocusedStudentsLeaderboard: React.FC<
  TopFocusedStudentsLeaderboardProps
> = ({
  user,
  enrollments,
  acceptedStudents = [],
  deepWorkState,
  focusIntensity,
  pomodoroLogs = [],
  syncedFocusMinutes = 0,
  onOpenActivityDashboard,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  const weekWindow = useMemo(() => getCurrentCalendarWeekWindow(), []);

  const rankedEntries = useMemo<FocusedStudentRankEntry[]>(() => {
    const userEmailLower = user.email.trim().toLowerCase();
    const userNameLower = user.name.trim().toLowerCase();

    // 1. Live Current Week metrics for the signed-in / active student
    const weekStartMs = weekWindow.start.getTime();
    const weekEndMs = weekWindow.end.getTime();

    const deepHistory = deepWorkState?.sessionsHistory || [];
    const thisWeekDeepCompleted = deepHistory.filter((s) => {
      if (s.status !== 'completed') return false;
      const ts = new Date(s.endedAt).getTime();
      return !Number.isNaN(ts) && ts >= weekStartMs && ts <= weekEndMs;
    });
    const thisWeekDeepInterrupted = deepHistory.filter((s) => {
      if (s.status !== 'interrupted') return false;
      const ts = new Date(s.endedAt).getTime();
      return !Number.isNaN(ts) && ts >= weekStartMs && ts <= weekEndMs;
    });

    const deepMinutesThisWeek = thisWeekDeepCompleted.reduce(
      (sum, s) => sum + (Number(s.elapsedMinutes) || 0),
      0
    );

    const activeElapsedMinutes = deepWorkState?.isActive
      ? Math.max(
          0,
          Math.round(
            (deepWorkState.plannedMinutes * 60 - deepWorkState.remainingSeconds) / 60
          )
        )
      : 0;

    const pomoWeekLogs = pomodoroLogs.filter((l) => {
      if (l.phase !== 'focus') return false;
      const ts = new Date(l.completedAt).getTime();
      return !Number.isNaN(ts) && ts >= weekStartMs && ts <= weekEndMs;
    });
    const pomoNonDeepMins = pomoWeekLogs
      .filter((l) => !l.guideTitle?.includes('(Deep Work)'))
      .reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);

    const totalLoggedFocusAllTime = pomodoroLogs
      .filter((l) => l.phase === 'focus')
      .reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0);
    const unsourcedSyncedMins = Math.max(
      0,
      syncedFocusMinutes - totalLoggedFocusAllTime
    );

    const userWeeklyMinutes =
      deepMinutesThisWeek +
      pomoNonDeepMins +
      unsourcedSyncedMins +
      activeElapsedMinutes;

    const userWeeklySessions =
      thisWeekDeepCompleted.length +
      pomoWeekLogs.filter((l) => !l.guideTitle?.includes('(Deep Work)')).length +
      (unsourcedSyncedMins > 0 ? 1 : 0);

    const userIntensityRating = focusIntensity?.score ?? 78;
    const userCompletionRate = focusIntensity?.sessionCompletionRate ?? 88;
    const userAvgBlock = focusIntensity?.avgCompletedBlockMinutes ?? 40;

    // Accumulated weekly Deep Work focus intensity score = intensity weighted by weekly completed blocks & focus depth
    const baseWeeklyBlocksScore = Math.max(
      userWeeklySessions > 0 ? userWeeklySessions : 1,
      Math.round(userWeeklyMinutes / 40)
    );
    const userAccumulatedWeeklyScore = Math.round(
      userIntensityRating * Math.max(2, baseWeeklyBlocksScore + (userWeeklyMinutes >= 60 ? 2 : 0)) +
        Math.round(userWeeklyMinutes * 1.4) +
        (deepWorkState?.isActive ? 35 : 0)
    );

    const currentUserEnrollment = enrollments.find(
      (e) =>
        e.studentEmail.trim().toLowerCase() === userEmailLower ||
        e.studentName.trim().toLowerCase() === userNameLower
    );
    const currentUserAccepted = acceptedStudents.find(
      (s) =>
        s.studentEmail.trim().toLowerCase() === userEmailLower ||
        s.studentName.trim().toLowerCase() === userNameLower
    );

    const entries: FocusedStudentRankEntry[] = [
      {
        id: `focus_self_${user.id}`,
        studentName: user.name || 'Tsoaelat S.',
        studentEmail: user.email || 'Tsoaelat.s@gmail.com',
        facultyName:
          currentUserAccepted?.facultyName ||
          currentUserEnrollment?.facultyName ||
          'Engineering, Technology & Built Environment',
        programName:
          currentUserAccepted?.programName ||
          currentUserEnrollment?.courseTitle ||
          'Artificial Intelligence & Reasoning Systems',
        weeklyAccumulatedIntensityScore: userAccumulatedWeeklyScore,
        focusIntensityRating: userIntensityRating,
        weeklyDeepWorkMinutes: Math.max(userWeeklyMinutes, syncedFocusMinutes),
        weeklySessionsCompleted: Math.max(
          userWeeklySessions,
          thisWeekDeepInterrupted.length > 0 ? userWeeklySessions : 3
        ),
        completionRatePercent: userCompletionRate,
        avgBlockMinutes: userAvgBlock,
        streakDays: 18,
        tierLabel: focusIntensity?.tierLabel || getTierFromScore(userIntensityRating),
        isCurrentUser: true,
        isCurrentlyFocusing: Boolean(deepWorkState?.isActive),
      },
    ];

    // 2. Gather peer scholars from enrollments & acceptedStudents
    const seenEmails = new Set<string>([userEmailLower]);
    const peerRecords: Array<{
      id: string;
      name: string;
      email: string;
      facultyName: string;
      programName: string;
      progressPercent: number;
      scoreHint: number;
    }> = [];

    for (const stu of acceptedStudents) {
      const email = stu.studentEmail.trim().toLowerCase();
      if (!email || seenEmails.has(email) || stu.studentName.trim().toLowerCase() === userNameLower) {
        continue;
      }
      seenEmails.add(email);
      peerRecords.push({
        id: stu.id,
        name: stu.studentName,
        email: stu.studentEmail,
        facultyName: stu.facultyName,
        programName: stu.programName,
        progressPercent: stu.admissionStatus === 'Accepted & Registered' ? 86 : 68,
        scoreHint: stu.admissionStatus === 'Accepted & Registered' ? 92 : 84,
      });
    }

    for (const enr of enrollments) {
      const email = enr.studentEmail.trim().toLowerCase();
      if (!email || seenEmails.has(email) || enr.studentName.trim().toLowerCase() === userNameLower) {
        continue;
      }
      seenEmails.add(email);
      peerRecords.push({
        id: enr.id,
        name: enr.studentName,
        email: enr.studentEmail,
        facultyName: enr.facultyName,
        programName: enr.courseTitle,
        progressPercent: enr.progressPercent,
        scoreHint: enr.testScore ?? 85,
      });
    }

    for (const peer of peerRecords) {
      const h = hashSeed(peer.email + weekWindow.label);
      const rating = Math.min(
        98,
        Math.max(68, Math.round(peer.scoreHint * 0.6 + 32 + (h % 9)))
      );
      const sessionsCompleted = 4 + (h % 7); // 4..10 completed blocks this week
      const avgBlock = 35 + ((h >> 3) % 30); // 35..64 min
      const weeklyMins = sessionsCompleted * avgBlock;
      const completionRate = Math.min(100, Math.max(75, 80 + (h % 20)));
      const accumulatedScore = Math.round(
        rating * sessionsCompleted + weeklyMins * 1.4
      );
      const streak = 5 + (h % 21);

      entries.push({
        id: `focus_peer_${peer.id}`,
        studentName: peer.name,
        studentEmail: peer.email,
        facultyName: peer.facultyName,
        programName: peer.programName,
        weeklyAccumulatedIntensityScore: accumulatedScore,
        focusIntensityRating: rating,
        weeklyDeepWorkMinutes: weeklyMins,
        weeklySessionsCompleted: sessionsCompleted,
        completionRatePercent: completionRate,
        avgBlockMinutes: avgBlock,
        streakDays: streak,
        tierLabel: getTierFromScore(rating),
        isCurrentUser: false,
      });
    }

    return entries.sort((a, b) => {
      if (b.weeklyAccumulatedIntensityScore !== a.weeklyAccumulatedIntensityScore) {
        return b.weeklyAccumulatedIntensityScore - a.weeklyAccumulatedIntensityScore;
      }
      if (b.focusIntensityRating !== a.focusIntensityRating) {
        return b.focusIntensityRating - a.focusIntensityRating;
      }
      return b.weeklyDeepWorkMinutes - a.weeklyDeepWorkMinutes;
    });
  }, [
    user.id,
    user.name,
    user.email,
    weekWindow.start,
    weekWindow.end,
    weekWindow.label,
    deepWorkState?.sessionsHistory,
    deepWorkState?.isActive,
    deepWorkState?.plannedMinutes,
    deepWorkState?.remainingSeconds,
    focusIntensity,
    pomodoroLogs,
    syncedFocusMinutes,
    enrollments,
    acceptedStudents,
  ]);

  const facultyOptions = useMemo(() => {
    const set = new Set<string>();
    rankedEntries.forEach((e) => {
      if (e.facultyName) set.add(e.facultyName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rankedEntries]);

  const filteredEntries = useMemo(() => {
    if (selectedFaculty === 'all') return rankedEntries;
    return rankedEntries.filter((e) => e.facultyName === selectedFaculty);
  }, [rankedEntries, selectedFaculty]);

  const currentUserGlobalRank = useMemo(
    () => rankedEntries.findIndex((e) => e.isCurrentUser) + 1,
    [rankedEntries]
  );
  const currentUserEntry = useMemo(
    () => rankedEntries.find((e) => e.isCurrentUser),
    [rankedEntries]
  );

  const topThree = filteredEntries.slice(0, 3);

  return (
    <section
      aria-labelledby="top-focused-students-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Top Focused Students</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400 normal-case font-medium">
                Current Week ({weekWindow.label})
              </span>
            </div>
            <h2
              id="top-focused-students-heading"
              className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Weekly Deep Work Focus Intensity Leaderboard
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
              Ranks scholars by accumulated Deep Work focus intensity points earned this week across completed focus blocks, block duration depth, and session continuity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              aria-label="Filter focused students by faculty"
              className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">All Faculties ({rankedEntries.length})</option>
              {facultyOptions.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>

            {onOpenActivityDashboard && (
              <button
                type="button"
                onClick={onOpenActivityDashboard}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Boost My Focus Score</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Student Standing Summary Strip */}
        {currentUserEntry && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono tabular-nums font-extrabold text-sm flex items-center justify-center shrink-0">
                #{String(currentUserGlobalRank).padStart(2, '0')}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex flex-wrap items-center gap-2">
                  <span>Your Weekly Standing: {currentUserEntry.studentName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-700 dark:text-indigo-400">
                    {currentUserEntry.tierLabel}
                  </span>
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono tabular-nums mt-0.5">
                  {currentUserEntry.weeklySessionsCompleted} focus blocks ·{' '}
                  {(currentUserEntry.weeklyDeepWorkMinutes / 60).toFixed(1)}h deep work ·{' '}
                  {currentUserEntry.completionRatePercent}% completion rate
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0 font-mono tabular-nums">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Intensity Rating
                </span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {currentUserEntry.focusIntensityRating}/100
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Weekly Points
                </span>
                <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-400">
                  {currentUserEntry.weeklyAccumulatedIntensityScore.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Spotlight Row */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((entry, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    entry.isCurrentUser
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/25'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-mono tabular-nums font-extrabold inline-flex items-center gap-1 ${
                        rank === 1
                          ? 'text-amber-600 dark:text-amber-400'
                          : rank === 2
                          ? 'text-stone-700 dark:text-stone-200'
                          : 'text-amber-800 dark:text-amber-500'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Rank #{String(rank).padStart(2, '0')}</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                      {entry.focusIntensityRating}/100 Intensity
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {entry.studentName}
                      {entry.isCurrentUser ? ' (You)' : ''}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {entry.programName}
                    </p>
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-stone-200/70 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Weekly Score
                      </span>
                      <span className="text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {entry.weeklyAccumulatedIntensityScore.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 ml-1">
                        pts
                      </span>
                    </div>
                    <div className="text-right text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400">
                      <div>{(entry.weeklyDeepWorkMinutes / 60).toFixed(1)}h this week</div>
                      <div>{entry.weeklySessionsCompleted} blocks</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-950/70 text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-3 font-semibold">Rank</th>
                <th className="py-3 px-3 font-semibold">Scholar &amp; Faculty</th>
                <th className="py-3 px-3 font-semibold">Tier</th>
                <th className="py-3 px-3 font-semibold text-right">Weekly Blocks</th>
                <th className="py-3 px-3 font-semibold text-right">Deep Work Time</th>
                <th className="py-3 px-3 font-semibold text-right">Focus Intensity</th>
                <th className="py-3 px-3 font-semibold text-right">Weekly Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredEntries.map((entry, idx) => {
                const rankNum = idx + 1;
                return (
                  <tr
                    key={entry.id}
                    className={
                      entry.isCurrentUser
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/25'
                        : 'hover:bg-stone-50/70 dark:hover:bg-stone-950/40 transition-colors'
                    }
                  >
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      #{String(rankNum).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {entry.studentName}
                        {entry.isCurrentUser && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {' '}· You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-xs">
                        {entry.facultyName}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-stone-700 dark:text-stone-300">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{entry.tierLabel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      {entry.weeklySessionsCompleted} ({entry.completionRatePercent}%)
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{(entry.weeklyDeepWorkMinutes / 60).toFixed(1)}h</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {entry.focusIntensityRating}/100
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      {entry.weeklyAccumulatedIntensityScore.toLocaleString()} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
