import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  Play,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { DeepWorkState, PomodoroSessionLog, StudyGuide, UserProfile } from '../types';
import {
  buildUnifiedFocusSessionHistory,
  exportFocusSessionHistoryCsv,
} from '../utils/focusCsvExport';

interface FocusHistorySectionProps {
  user: UserProfile;
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides: StudyGuide[];
  isDeepWorkActive?: boolean;
  onNavigateToCourse?: (guideId: string) => void;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
}

function formatCompletionDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const FocusHistorySection: React.FC<FocusHistorySectionProps> = ({
  user,
  deepWorkState,
  pomodoroLogs = [],
  studyGuides,
  isDeepWorkActive = false,
  onNavigateToCourse,
  onStartDeepWork,
}) => {
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Deep Work' | 'Pomodoro'>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const allCompletedSessions = useMemo(
    () =>
      buildUnifiedFocusSessionHistory({
        deepWorkState,
        pomodoroLogs,
        studyGuides,
        onlyCompleted: true,
      }),
    [deepWorkState, pomodoroLogs, studyGuides]
  );

  const lastTenCompleted = useMemo(() => {
    const filtered =
      sourceFilter === 'all'
        ? allCompletedSessions
        : allCompletedSessions.filter((s) => s.source === sourceFilter);
    return filtered.slice(0, 10);
  }, [allCompletedSessions, sourceFilter]);

  const totalMinutesLastTen = useMemo(
    () => lastTenCompleted.reduce((sum, item) => sum + item.durationMinutes, 0),
    [lastTenCompleted]
  );

  const handleExportHistoryCsv = () => {
    const result = exportFocusSessionHistoryCsv({
      user,
      deepWorkState,
      pomodoroLogs,
      studyGuides,
    });
    setExportNotice(
      `Exported ${result.exportedRowsCount} focus session rows (${result.filename}).`
    );
    window.setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <section
      aria-labelledby="focus-history-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <History className="w-3.5 h-3.5" />
            <span>Focus History</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono normal-case tabular-nums text-stone-500 dark:text-stone-400 font-medium">
              Last {lastTenCompleted.length} Completed Sessions ·{' '}
              {(totalMinutesLastTen / 60).toFixed(1)}h Logged
            </span>
          </div>
          <h2
            id="focus-history-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Last 10 Completed Focus Sessions
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Detailed chronological ledger of your most recent completed Deep Work blocks and Pomodoro focus intervals, showing duration, completion date, and linked study guide.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Source Filter */}
          <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700 text-xs">
            {(['all', 'Deep Work', 'Pomodoro'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSourceFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  sourceFilter === tab
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab === 'all' ? 'All Completed' : tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportHistoryCsv}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Session History CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Focus History List */}
      {lastTenCompleted.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-950/40 text-center space-y-3">
          <Clock className="w-7 h-7 text-stone-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              No completed focus sessions in this filter yet
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Complete a Deep Work block or Pomodoro focus interval to record it in your Focus History ledger.
            </p>
          </div>
          {onStartDeepWork && !isDeepWorkActive && (
            <button
              type="button"
              onClick={() => onStartDeepWork(50)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start 50m Deep Work Session</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th className="py-2.5 pr-4">#</th>
                <th className="py-2.5 pr-4">Linked Course Title</th>
                <th className="py-2.5 pr-4">Mode</th>
                <th className="py-2.5 pr-4">Duration</th>
                <th className="py-2.5 pr-4">Completion Date</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {lastTenCompleted.map((session, idx) => {
                const isNavigable =
                  onNavigateToCourse &&
                  session.courseId &&
                  session.courseId !== 'general' &&
                  studyGuides.some((g) => g.id === session.courseId);

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-950/50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono tabular-nums text-stone-500 dark:text-stone-400 align-top">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    <td className="py-3 pr-4 align-top max-w-md">
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                            {session.courseTitle}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
                            {session.category}
                            {session.distractionsBlockedCount > 0 && (
                              <span className="font-mono">
                                {' '}
                                · {session.distractionsBlockedCount} shielded
                              </span>
                            )}
                          </div>
                          {session.reflectionNotes && (
                            <div className="mt-1 text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 rounded-md px-2 py-1 inline-flex items-start gap-1.5">
                              <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{session.reflectionNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          session.source === 'Deep Work'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {session.source === 'Deep Work' ? (
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Timer className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{session.source}</span>
                      </span>
                    </td>

                    <td className="py-3 pr-4 align-top whitespace-nowrap font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                      {session.durationMinutes} min
                    </td>

                    <td className="py-3 pr-4 align-top whitespace-nowrap font-mono tabular-nums text-stone-600 dark:text-stone-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{formatCompletionDateTime(session.completedAt)}</span>
                      </span>
                    </td>

                    <td className="py-3 text-right align-top whitespace-nowrap">
                      {isNavigable ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToCourse?.(session.courseId)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Open Course</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-stone-400">Logged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
