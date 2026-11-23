import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  BookOpen,
  Gauge,
  EyeOff,
  Clock,
  ArrowUpRight,
  FileText,
  X,
} from 'lucide-react';
import {
  DeepWorkState,
  FocusIntensityMetrics,
  StudyGuide,
} from '../types';

export interface DeepWorkPanelProps {
  state: DeepWorkState;
  focusIntensity: FocusIntensityMetrics;
  studyGuides: StudyGuide[];
  lastAutoCompletedSessionId?: string | null;
  onDismissAutoCompleted?: () => void;
  onUpdateSessionReflection?: (sessionId: string, reflectionNotes: string) => void;
  onToggleDeepWork: () => void;
  onStartDeepWork: (minutes?: number, guideId?: string) => void;
  onPauseResume: () => void;
  onCompleteSession: (reflectionNotes?: string) => void;
  onEndEarly: () => void;
  onSelectPlannedMinutes: (minutes: number) => void;
  onSelectLinkedGuide: (guideId: string) => void;
  onNavigateToCourse?: (guideId: string) => void;
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const DeepWorkPanel: React.FC<DeepWorkPanelProps> = ({
  state,
  focusIntensity,
  studyGuides,
  lastAutoCompletedSessionId = null,
  onDismissAutoCompleted,
  onUpdateSessionReflection,
  onToggleDeepWork,
  onStartDeepWork,
  onPauseResume,
  onCompleteSession,
  onEndEarly,
  onSelectPlannedMinutes,
  onSelectLinkedGuide,
  onNavigateToCourse,
}) => {
  const [completionDialogMode, setCompletionDialogMode] = useState<
    'closed' | 'complete_now' | 'post_complete' | 'edit_existing'
  >('closed');
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState<string>('');
  const [reflectionSavedToast, setReflectionSavedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAutoCompletedSessionId) return;
    const rec = state.sessionsHistory.find((s) => s.id === lastAutoCompletedSessionId);
    if (!rec) return;
    setTargetSessionId(rec.id);
    setReflectionDraft(rec.reflectionNotes || '');
    setCompletionDialogMode('post_complete');
  }, [lastAutoCompletedSessionId, state.sessionsHistory]);

  const totalSeconds = Math.max(60, state.plannedMinutes * 60);
  const elapsedSeconds = Math.max(0, totalSeconds - state.remainingSeconds);
  const elapsedMinutesLive = Math.max(1, Math.round(elapsedSeconds / 60));
  const progressPercent = state.isActive
    ? Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100)))
    : 0;

  const activeGuide =
    studyGuides.find((g) => g.id === state.linkedGuideId) || studyGuides[0];

  const targetHistorySession = targetSessionId
    ? state.sessionsHistory.find((s) => s.id === targetSessionId) || null
    : null;

  const presets = [
    { minutes: 25, label: '25m Sprint' },
    { minutes: 50, label: '50m Deep Block' },
    { minutes: 90, label: '90m Ultradian' },
    { minutes: 180, label: '180m Marathon' },
  ];

  const handleOpenCompleteDialog = () => {
    setTargetSessionId(null);
    setReflectionDraft('');
    setCompletionDialogMode('complete_now');
  };

  const handleCloseDialog = () => {
    if (completionDialogMode === 'post_complete') {
      onDismissAutoCompleted?.();
    }
    setCompletionDialogMode('closed');
    setTargetSessionId(null);
    setReflectionDraft('');
  };

  const handleSaveAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = reflectionDraft.trim();
    if (completionDialogMode === 'complete_now') {
      onCompleteSession(cleaned);
      setCompletionDialogMode('closed');
      setReflectionDraft('');
      setReflectionSavedToast(
        cleaned
          ? 'Deep Work block completed with key takeaways saved.'
          : 'Deep Work block completed & logged.'
      );
      window.setTimeout(() => setReflectionSavedToast(null), 4000);
      return;
    }

    if (
      (completionDialogMode === 'post_complete' ||
        completionDialogMode === 'edit_existing') &&
      targetSessionId
    ) {
      onUpdateSessionReflection?.(targetSessionId, cleaned);
      if (completionDialogMode === 'post_complete') {
        onDismissAutoCompleted?.();
      }
      setCompletionDialogMode('closed');
      setTargetSessionId(null);
      setReflectionDraft('');
      setReflectionSavedToast('Session reflection saved to your Deep Work log.');
      window.setTimeout(() => setReflectionSavedToast(null), 4000);
    }
  };

  const handleSkipComplete = () => {
    if (completionDialogMode === 'complete_now') {
      onCompleteSession();
      setCompletionDialogMode('closed');
      setReflectionDraft('');
      setReflectionSavedToast('Deep Work block completed & logged.');
      window.setTimeout(() => setReflectionSavedToast(null), 3500);
    } else {
      handleCloseDialog();
    }
  };

  const appendPromptStarter = (prefix: string) => {
    setReflectionDraft((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed}\n${prefix} ` : `${prefix} `;
    });
  };

  return (
    <section
      aria-labelledby="deep-work-heading"
      className={`rounded-2xl border p-6 space-y-5 transition-colors shadow-xs ${
        state.isActive
          ? 'bg-stone-950 text-stone-100 border-emerald-700/70'
          : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800'
      }`}
    >
      {/* Top Bar: Title + Toggle Switch */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          state.isActive
            ? 'border-stone-800'
            : 'border-stone-200 dark:border-stone-800'
        }`}
      >
        <div className="space-y-1">
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
              state.isActive
                ? 'text-emerald-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {state.isActive
                ? 'Deep Work Shield Active · Distractions Blocked'
                : 'Cognitive Protection · Deep Work Timer'}
            </span>
          </div>
          <h2
            id="deep-work-heading"
            className="text-xl font-bold tracking-tight"
          >
            Deep Work Focus Mode &amp; Focus Intensity
          </h2>
          <p
            className={`text-xs max-w-2xl ${
              state.isActive
                ? 'text-stone-400'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            Suppresses non-essential navigation, store feeds, course alert popups, and social overlays while calculating your real-time Focus Intensity from completed study blocks.
          </p>
        </div>

        {/* Accessible Deep Work Toggle Control */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={state.isActive}
            onClick={onToggleDeepWork}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer border ${
              state.isActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
            }`}
          >
            {state.isActive ? (
              <>
                <ShieldOff className="w-4 h-4" />
                <span>Deep Work: ON (Exit)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Enable Deep Work</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Timer & Controls (Left) + Focus Intensity Scoreboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Timer, Target Course & Block Controls */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 flex flex-col justify-between gap-4 ${
            state.isActive
              ? 'bg-stone-900 border-stone-800'
              : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {presets.map((preset) => {
                const selected = state.plannedMinutes === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    disabled={state.isActive}
                    onClick={() => onSelectPlannedMinutes(preset.minutes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? state.isActive
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : state.isActive
                        ? 'bg-stone-950 text-stone-400 border-stone-800'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <span
              className={`text-[11px] font-mono tabular-nums ${
                state.isActive
                  ? 'text-emerald-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {state.isActive
                ? state.isPaused
                  ? 'Session Paused'
                  : 'Locking Distractions'
                : 'Ready to Start'}
            </span>
          </div>

          {/* Countdown & Course Picker */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span
                className={`text-[11px] uppercase tracking-wider font-semibold block mb-1 ${
                  state.isActive
                    ? 'text-stone-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Remaining Deep Block
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight">
                {formatCountdown(state.remainingSeconds)}
              </div>
            </div>

            <div className="flex-1 sm:max-w-xs space-y-1">
              <label
                htmlFor="deep-work-guide-select"
                className={`text-[11px] font-semibold flex items-center gap-1 ${
                  state.isActive
                    ? 'text-stone-300'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Linked Study Guide</span>
              </label>
              <select
                id="deep-work-guide-select"
                value={state.linkedGuideId}
                onChange={(e) => onSelectLinkedGuide(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                  state.isActive
                    ? 'bg-stone-950 border-stone-700 text-stone-100'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                }`}
              >
                {studyGuides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span
                className={
                  state.isActive
                    ? 'text-stone-400'
                    : 'text-stone-500 dark:text-stone-400'
                }
              >
                Block Completion Progress
              </span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div
              className={`h-2 w-full rounded-full overflow-hidden ${
                state.isActive
                  ? 'bg-stone-800'
                  : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!state.isActive ? (
              <button
                type="button"
                onClick={() => onStartDeepWork(state.plannedMinutes, state.linkedGuideId)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start {state.plannedMinutes}m Deep Work Block</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPauseResume}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer border border-stone-700"
                >
                  {state.isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenCompleteDialog}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete &amp; Log Block</span>
                </button>

                <button
                  type="button"
                  onClick={onEndEarly}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-rose-950/60 text-rose-300 border border-rose-800/60 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>End Early</span>
                </button>
              </>
            )}

            {activeGuide && onNavigateToCourse && (
              <button
                type="button"
                onClick={() => onNavigateToCourse(activeGuide.id)}
                className={`ml-auto px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  state.isActive
                    ? 'border-stone-700 bg-stone-950 hover:bg-stone-800 text-stone-200'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200'
                }`}
              >
                <span>Open Study Guide</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Focus Intensity Score & Session Completion Breakdown */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 flex flex-col justify-between gap-4 ${
            state.isActive
              ? 'bg-stone-900 border-stone-800'
              : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                  state.isActive
                    ? 'text-emerald-400'
                    : 'text-purple-700 dark:text-purple-400'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Focus Intensity Score</span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  state.isActive
                    ? 'text-stone-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                Derived from completed vs. interrupted sessions
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold font-mono tabular-nums text-emerald-500">
                {focusIntensity.score}
                <span className="text-sm font-semibold opacity-60">/100</span>
              </div>
              <span
                className={`text-[11px] font-bold block ${
                  focusIntensity.tierLabel === 'Interrupted · Rebuilding'
                    ? 'text-rose-500'
                    : focusIntensity.score >= 76
                    ? 'text-emerald-500'
                    : 'text-amber-500'
                }`}
              >
                {focusIntensity.tierLabel}
              </span>
            </div>
          </div>

          {/* 3 Scoring Drivers */}
          <div className="space-y-2.5 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={
                    state.isActive
                      ? 'text-stone-300'
                      : 'text-stone-600 dark:text-stone-300'
                  }
                >
                  Session Completion Rate (50%)
                </span>
                <span className="font-mono tabular-nums font-bold">
                  {focusIntensity.sessionCompletionRate}%
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${
                  state.isActive ? 'bg-stone-800' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${focusIntensity.sessionCompletionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={
                    state.isActive
                      ? 'text-stone-300'
                      : 'text-stone-600 dark:text-stone-300'
                  }
                >
                  Avg Block Depth ({focusIntensity.avgCompletedBlockMinutes}m · 30%)
                </span>
                <span className="font-mono tabular-nums font-bold">
                  {focusIntensity.blockDepthScore}%
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${
                  state.isActive ? 'bg-stone-800' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${focusIntensity.blockDepthScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={
                    state.isActive
                      ? 'text-stone-300'
                      : 'text-stone-600 dark:text-stone-300'
                  }
                >
                  Distraction-Free Continuity (20%)
                </span>
                <span className="font-mono tabular-nums font-bold">
                  {focusIntensity.distractionShieldScore}%
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${
                  state.isActive ? 'bg-stone-800' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${focusIntensity.distractionShieldScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div
            className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono tabular-nums ${
              state.isActive
                ? 'border-stone-800 text-stone-400'
                : 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
            }`}
          >
            <span>
              {focusIntensity.completedSessionsCount} Completed ·{' '}
              {focusIntensity.interruptedSessionsCount} Interrupted
            </span>
            {state.isActive && (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <EyeOff className="w-3.5 h-3.5" />
                <span>{state.suppressedDistractionsCount} alerts shielded</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Distraction Blocker Notice when Deep Work is ON */}
      {state.isActive && (
        <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Distraction Shield Engaged:</strong> Store marketplaces, global search bar, course alert popups, TAI assistant popover, peer social graphs, and achievement overlays are muted until this Deep Work block finishes or you exit.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400 whitespace-nowrap shrink-0 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{state.plannedMinutes}m Target</span>
          </span>
        </div>
      )}

      {reflectionSavedToast && (
        <div className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{reflectionSavedToast}</span>
        </div>
      )}

      {/* Recent Deep Work Sessions Audit Strip */}
      {state.sessionsHistory.length > 0 && (
        <div
          className={`pt-3 border-t space-y-2 ${
            state.isActive
              ? 'border-stone-800'
              : 'border-stone-200 dark:border-stone-800'
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              state.isActive
                ? 'text-stone-400'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            Recent Deep Work Blocks &amp; Key Takeaways
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {state.sessionsHistory.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                  state.isActive
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{rec.guideTitle}</p>
                    <p
                      className={`text-[11px] font-mono tabular-nums ${
                        state.isActive
                          ? 'text-stone-400'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {rec.elapsedMinutes}/{rec.plannedMinutes} min
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                      rec.status === 'completed'
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {rec.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Ended Early</span>
                      </>
                    )}
                  </span>
                </div>

                {rec.reflectionNotes ? (
                  <div
                    className={`text-[11px] leading-relaxed rounded-md px-2.5 py-1.5 border ${
                      state.isActive
                        ? 'bg-stone-950/80 border-stone-800 text-stone-300'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-1">
                      Takeaway:
                    </span>
                    <span className="line-clamp-2">{rec.reflectionNotes}</span>
                  </div>
                ) : null}

                {rec.status === 'completed' && onUpdateSessionReflection && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSessionId(rec.id);
                        setReflectionDraft(rec.reflectionNotes || '');
                        setCompletionDialogMode('edit_existing');
                      }}
                      className={`text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        state.isActive
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>{rec.reflectionNotes ? 'Edit Takeaways' : 'Add Takeaways'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Work Session Completion & Reflection Dialog */}
      {completionDialogMode !== 'closed' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dw-completion-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {completionDialogMode === 'edit_existing'
                      ? 'Deep Work Block Reflection'
                      : 'Deep Work Session Completed'}
                  </span>
                </div>
                <h3
                  id="dw-completion-dialog-title"
                  className="text-lg font-bold tracking-tight"
                >
                  {completionDialogMode === 'edit_existing'
                    ? 'Update Key Takeaways & Reflections'
                    : 'Capture Key Takeaways & Reflections'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                aria-label="Close completion dialog"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAndComplete} className="p-5 space-y-4">
              {/* Session Telemetry Summary */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-3 sm:col-span-1 min-w-0">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    Study Guide
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100 truncate block">
                    {targetHistorySession?.guideTitle ||
                      activeGuide?.title ||
                      'Deep Work Block'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    Focus Duration
                  </span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                    {targetHistorySession
                      ? `${targetHistorySession.elapsedMinutes}/${targetHistorySession.plannedMinutes} min`
                      : `${Math.max(state.plannedMinutes, elapsedMinutesLive)} min`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    Distractions Blocked
                  </span>
                  <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                    {targetHistorySession
                      ? targetHistorySession.distractionsBlockedCount
                      : state.suppressedDistractionsCount}{' '}
                    shielded
                  </span>
                </div>
              </div>

              {/* Reflection Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="deep-work-reflection-textarea"
                    className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Key Takeaways &amp; Study Reflections</span>
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                    {reflectionDraft.length}/600
                  </span>
                </div>

                <textarea
                  id="deep-work-reflection-textarea"
                  rows={4}
                  maxLength={600}
                  value={reflectionDraft}
                  onChange={(e) => setReflectionDraft(e.target.value)}
                  placeholder="Jot down key takeaways, core concepts mastered, or next actions while this focus block is fresh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs leading-relaxed text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mr-1">
                    Quick prompts:
                  </span>
                  {[
                    { label: '+ Key Concept', prefix: '• Key takeaway:' },
                    { label: '+ Next Step', prefix: '• Next focus step:' },
                    { label: '+ Open Question', prefix: '• Question to revisit:' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => appendPromptStarter(chip.prefix)}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-[11px] font-semibold text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-end gap-2">
                {completionDialogMode === 'complete_now' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseDialog}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                    >
                      Keep Focusing
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipComplete}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer transition-colors"
                    >
                      Skip Notes &amp; Complete
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Reflection &amp; Complete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseDialog}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Reflections</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
