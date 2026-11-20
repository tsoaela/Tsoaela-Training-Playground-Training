import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Play,
  ShieldCheck,
  Target,
  Timer,
} from 'lucide-react';
import { DailyStudyGoalMetrics } from '../types';

interface DailyStudyGoalRingCardProps {
  metrics: DailyStudyGoalMetrics;
  onChangeGoalHours: (hours: number) => void;
  isDeepWorkActive?: boolean;
  isPomodoroRunning?: boolean;
  onStartDeepWork?: () => void;
  onTogglePomodoro?: () => void;
}

const GOAL_PRESETS = [1.0, 1.5, 2.0, 3.0, 4.0];

function formatMinutesLabel(totalMins: number): string {
  const safe = Math.max(0, Math.round(totalMins));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export const DailyStudyGoalRingCard: React.FC<DailyStudyGoalRingCardProps> = ({
  metrics,
  onChangeGoalHours,
  isDeepWorkActive = false,
  isPomodoroRunning = false,
  onStartDeepWork,
  onTogglePomodoro,
}) => {
  const [customGoalInput, setCustomGoalInput] = useState<string>(
    metrics.dailyGoalHours.toFixed(1)
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setCustomGoalInput(metrics.dailyGoalHours.toFixed(1));
  }, [metrics.dailyGoalHours]);

  // SVG Ring Geometry
  const size = 176;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, metrics.completionPercent));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const handleApplyCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customGoalInput);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(12, Math.max(0.5, parsed));
    onChangeGoalHours(clamped);
    setSavedNotice(`Daily target updated to ${clamped.toFixed(1)}h`);
    window.setTimeout(() => setSavedNotice(null), 2600);
  };

  const handleSelectPreset = (hours: number) => {
    onChangeGoalHours(hours);
    setSavedNotice(`Daily target set to ${hours.toFixed(1)}h`);
    window.setTimeout(() => setSavedNotice(null), 2200);
  };

  const isLiveTicking = isDeepWorkActive || isPomodoroRunning;

  return (
    <section
      aria-labelledby="daily-study-goal-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            <Target className="w-3.5 h-3.5" />
            <span>Daily Study Hour Goal</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-stone-500 dark:text-stone-400 normal-case font-medium">
              Synced with Pomodoro &amp; Deep Work Timers
            </span>
          </div>
          <h2
            id="daily-study-goal-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Today’s Study Target &amp; Progress Ring
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Set your daily focus target in hours. Every completed or active Pomodoro interval and Deep Work block updates your progress ring in real time.
          </p>
        </div>

        {/* Explicit Status Pair (Icon + Label) */}
        <div className="flex items-center gap-2 shrink-0">
          {metrics.isGoalMet ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Daily Goal Reached</span>
            </span>
          ) : isLiveTicking ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Timer Live · Accumulating Today</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{formatMinutesLabel(metrics.remainingMinutes)} Remaining Today</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Left Ring + Right Controls & Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Progress Ring */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
              role="img"
              aria-label={`Daily study goal progress: ${metrics.completionPercent}% (${metrics.todayTotalHours} of ${metrics.dailyGoalHours} hours)`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-stone-200 dark:text-stone-800"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={metrics.isGoalMet ? '#10b981' : '#7c3aed'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <span
                className={`text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                  metrics.isGoalMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-900 dark:text-stone-100'
                }`}
              >
                {metrics.completionPercent}%
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-stone-700 dark:text-stone-300 mt-0.5">
                {metrics.todayTotalHours.toFixed(2)} / {metrics.dailyGoalHours.toFixed(1)}h
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {metrics.isGoalMet
                  ? metrics.surplusMinutes > 0
                    ? `+${formatMinutesLabel(metrics.surplusMinutes)} bonus`
                    : 'Target achieved'
                  : `${formatMinutesLabel(metrics.remainingMinutes)} left`}
              </span>
            </div>
          </div>

          <div className="mt-3 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 text-center">
            {metrics.todayTotalMinutes.toFixed(0)} min logged today · Target{' '}
            {Math.round(metrics.dailyGoalHours * 60)} min
          </div>
        </div>

        {/* Right: Goal Setter + Integrated Timer Breakdown */}
        <div className="lg:col-span-8 space-y-5">
          {/* Breakdown Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="font-medium">Pomodoro Focus Today</span>
                <Timer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {formatMinutesLabel(metrics.pomodoroMinutesToday)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                {isPomodoroRunning ? 'Live focus running' : 'Pomodoro sessions'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="font-medium">Deep Work Blocks Today</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatMinutesLabel(metrics.deepWorkMinutesToday)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                {isDeepWorkActive ? 'Shield engaged live' : 'Shielded deep blocks'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="font-medium">Goal Status</span>
                <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-purple-700 dark:text-purple-400">
                {metrics.isGoalMet
                  ? '100%+'
                  : formatMinutesLabel(metrics.remainingMinutes)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                {metrics.isGoalMet ? 'Daily objective satisfied' : 'Left to reach target'}
              </span>
            </div>
          </div>

          {/* Goal Configuration Controls */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Configure Daily Study Hour Goal
              </span>
              {savedNotice && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savedNotice}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {GOAL_PRESETS.map((preset) => {
                  const isActive = Math.abs(metrics.dailyGoalHours - preset) < 0.05;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {preset.toFixed(1)}h
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <form
                onSubmit={handleApplyCustomGoal}
                className="flex items-center gap-2 shrink-0"
              >
                <label
                  htmlFor="daily-study-goal-input"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap"
                >
                  Custom (hrs):
                </label>
                <input
                  id="daily-study-goal-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  Save Goal
                </button>
              </form>
            </div>

            {/* Direct Timer Launchers */}
            {(onStartDeepWork || onTogglePomodoro) && (
              <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center gap-2">
                {onStartDeepWork && !isDeepWorkActive && (
                  <button
                    type="button"
                    onClick={onStartDeepWork}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Start Deep Work Block</span>
                  </button>
                )}
                {onTogglePomodoro && (
                  <button
                    type="button"
                    onClick={onTogglePomodoro}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isPomodoroRunning ? 'Pause Pomodoro Focus' : 'Start Pomodoro Focus'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
