import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  Gauge,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { DeepWorkState, StudyGuide } from '../types';
import { buildMonthlySubjectDeepWorkSummary } from '../utils/deepWorkAnalytics';

export interface DeepWorkMonthlySubjectSummaryProps {
  deepWorkState?: DeepWorkState;
  studyGuides: StudyGuide[];
  onNavigateToCourse?: (guideId: string) => void;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
}

function formatMinutesAsHrsMins(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h 00m`;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
}

function formatSessionDate(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DeepWorkMonthlySubjectSummary: React.FC<
  DeepWorkMonthlySubjectSummaryProps
> = ({ deepWorkState, studyGuides, onNavigateToCourse, onStartDeepWork }) => {
  const initialSummary = useMemo(
    () =>
      buildMonthlySubjectDeepWorkSummary({
        deepWorkState,
        studyGuides,
      }),
    [deepWorkState, studyGuides]
  );

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    initialSummary.monthKey
  );
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  const summary = useMemo(
    () =>
      buildMonthlySubjectDeepWorkSummary({
        deepWorkState,
        studyGuides,
        selectedMonthKey,
      }),
    [deepWorkState, studyGuides, selectedMonthKey]
  );

  const maxSubjectMinutes = useMemo(() => {
    if (summary.subjects.length === 0) return 60;
    return Math.max(...summary.subjects.map((s) => s.totalMinutes), 60);
  }, [summary.subjects]);

  const filteredSessions = useMemo(() => {
    if (selectedSubjectFilter === 'all') return summary.completedSessions;
    return summary.completedSessions.filter(
      (s) => s.subjectName === selectedSubjectFilter
    );
  }, [summary.completedSessions, selectedSubjectFilter]);

  return (
    <section
      aria-labelledby="deep-work-monthly-summary-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header Row & Month Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Monthly Deep Work Audit</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400 font-medium">
              {summary.monthLabel}
            </span>
          </div>
          <h2
            id="deep-work-monthly-summary-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Completed Sessions: Subject Time vs. Focus Intensity
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Compares accumulated completed Deep Work duration per academic subject against average Focus Intensity scores across the selected calendar month.
          </p>
        </div>

        {/* Interactive Month Selector */}
        <div
          role="tablist"
          aria-label="Select Deep Work summary month"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-xs self-start lg:self-auto"
        >
          {summary.availableMonths.map((m) => (
            <button
              key={m.monthKey}
              type="button"
              role="tab"
              aria-selected={summary.monthKey === m.monthKey}
              onClick={() => {
                setSelectedMonthKey(m.monthKey);
                setSelectedSubjectFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-colors font-mono tabular-nums ${
                summary.monthKey === m.monthKey
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {m.monthLabel} ({m.count})
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Summary Strip (Single Elevation Hairline Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-stone-800 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50">
        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Completed Time ({summary.monthLabel})</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {formatMinutesAsHrsMins(summary.totalCompletedMinutes)}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
            {summary.totalCompletedHours.toFixed(2)} hrs total
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Avg Monthly Focus Intensity</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
            {summary.monthlyAvgFocusIntensity}
            <span className="text-sm font-semibold opacity-65">/100</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
            Across {summary.totalCompletedSessions} completed block{summary.totalCompletedSessions === 1 ? '' : 's'}
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Completion Reliability</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {summary.totalCompletedSessions + summary.totalInterruptedSessions > 0
              ? Math.round(
                  (summary.totalCompletedSessions /
                    (summary.totalCompletedSessions +
                      summary.totalInterruptedSessions)) *
                    100
                )
              : 0}
            %
          </div>
          <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
            {summary.totalCompletedSessions} completed · {summary.totalInterruptedSessions} early exit
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Highest Intensity Subject</span>
          </div>
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate pt-1">
            {summary.topSubjectByIntensity || 'No subjects logged'}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 truncate">
            Most hours: {summary.topSubjectByTime || '—'}
          </div>
        </div>
      </div>

      {/* Empty State vs Populated Dual-Metric Comparison */}
      {summary.subjects.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            No completed Deep Work blocks logged for {summary.monthLabel} yet.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Start and complete a Deep Work study block to populate your monthly subject time vs. Focus Intensity comparison.
          </p>
          {onStartDeepWork && (
            <button
              type="button"
              onClick={() => onStartDeepWork(50)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start 50m Deep Work Block</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Time Spent per Subject vs. Avg Focus Intensity Dual Comparison Chart & Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                Subject Breakdown: Time Spent vs. Average Focus Intensity Score
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" aria-hidden="true" />
                  <span>Time Spent (hrs)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" aria-hidden="true" />
                  <span>Avg Focus Intensity (/100)</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/70 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-3 text-right">Sessions</th>
                    <th className="py-2.5 px-3 text-right">Time Spent</th>
                    <th className="py-2.5 px-4 min-w-[220px]">
                      Time Spent vs. Intensity Visual
                    </th>
                    <th className="py-2.5 px-3 text-right">Avg Intensity</th>
                    <th className="py-2.5 px-4 text-right">Avg Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 dark:divide-stone-800">
                  {summary.subjects.map((sub) => {
                    const timeWidthPct = Math.max(
                      6,
                      Math.round((sub.totalMinutes / maxSubjectMinutes) * 100)
                    );
                    const intensityPct = Math.max(6, sub.avgFocusIntensityScore);
                    const isSelected = selectedSubjectFilter === sub.subjectName;

                    return (
                      <tr
                        key={sub.subjectName}
                        onClick={() =>
                          setSelectedSubjectFilter((prev) =>
                            prev === sub.subjectName ? 'all' : sub.subjectName
                          )
                        }
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-950/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100">
                            {sub.subjectName}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[240px]">
                            {sub.coursesCovered.join(' · ')}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                          {sub.completedSessionsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatMinutesAsHrsMins(sub.totalMinutes)}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">
                            {sub.shareOfMonthPercent}% of month
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <svg
                              width="100%"
                              height="7"
                              className="block rounded-full bg-stone-200 dark:bg-stone-800"
                              aria-label={`${sub.subjectName} time spent ${sub.totalHours} hours`}
                            >
                              <rect
                                x="0"
                                y="0"
                                width={`${timeWidthPct}%`}
                                height="7"
                                rx="3.5"
                                fill="#10b981"
                              />
                            </svg>
                            <svg
                              width="100%"
                              height="7"
                              className="block rounded-full bg-stone-200 dark:bg-stone-800"
                              aria-label={`${sub.subjectName} average focus intensity ${sub.avgFocusIntensityScore} out of 100`}
                            >
                              <rect
                                x="0"
                                y="0"
                                width={`${intensityPct}%`}
                                height="7"
                                rx="3.5"
                                fill="#6366f1"
                              />
                            </svg>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span
                            className={`font-extrabold ${
                              sub.avgFocusIntensityScore >= 85
                                ? 'text-indigo-700 dark:text-indigo-400'
                                : sub.avgFocusIntensityScore >= 70
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {sub.avgFocusIntensityScore}/100
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-600 dark:text-stone-400">
                          {sub.avgBlockMinutes}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Completed Sessions Detailed Log with Subject Filter */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Filter className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  Completed Deep Work Sessions Log ({filteredSessions.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                    selectedSubjectFilter === 'all'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  All Subjects
                </button>
                {summary.subjects.map((sub) => (
                  <button
                    key={sub.subjectName}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub.subjectName)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      selectedSubjectFilter === sub.subjectName
                        ? 'bg-emerald-700 text-white'
                        : 'border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {sub.subjectName}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/70 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                    <th className="py-2.5 px-4">Completed At</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Study Guide</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 px-3 text-right">Intensity</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 dark:divide-stone-800">
                  {filteredSessions.slice(0, 12).map((rec) => {
                    const matchedGuide = studyGuides.find(
                      (g) =>
                        g.id === rec.guideId ||
                        g.title.toLowerCase() === rec.guideTitle.toLowerCase()
                    );
                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-stone-50 dark:hover:bg-stone-950/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-stone-600 dark:text-stone-400 whitespace-nowrap">
                          {formatSessionDate(rec.startedAt)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-800 dark:text-stone-200 whitespace-nowrap">
                          {rec.subjectName}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300 max-w-[260px] truncate">
                          {rec.guideTitle}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {rec.elapsedMinutes}m
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                          {rec.sessionFocusIntensity}/100
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {matchedGuide && onNavigateToCourse ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToCourse(matchedGuide.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                            >
                              <span>Open Guide</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-stone-400">
                              {rec.distractionsBlockedCount} shielded
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
