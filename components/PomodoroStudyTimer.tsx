import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Coffee,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  PomodoroIntervalConfig,
  PomodoroPhase,
  PomodoroSessionLog,
  RealtimeStudyTelemetry,
  StudyGuide,
} from '../types';
import { formatStudyDuration } from './RealtimeStudyBanner';

export interface PomodoroStudyTimerProps {
  phase: PomodoroPhase;
  isRunning: boolean;
  remainingSeconds: number;
  totalPhaseSeconds: number;
  elapsedFocusMinutes: number;
  linkedGuideId: string;
  cycleCount: number;
  config: PomodoroIntervalConfig;
  syncedFocusMinutes: number;
  completedSessions: number;
  sessionLogs: PomodoroSessionLog[];
  studyGuides: StudyGuide[];
  onStartPause: () => void;
  onReset: () => void;
  onSelectPhase: (phase: PomodoroPhase) => void;
  onSkipPhase: () => void;
  onSelectGuide: (guideId: string) => void;
  onUpdateConfig: (partial: Partial<PomodoroIntervalConfig>) => void;
  onSyncSession: () => void;
  onOpenActivityDashboard?: () => void;
  realtimeStudy?: RealtimeStudyTelemetry;
}

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const PomodoroStudyTimer: React.FC<PomodoroStudyTimerProps> = ({
  phase,
  isRunning,
  remainingSeconds,
  totalPhaseSeconds,
  elapsedFocusMinutes,
  linkedGuideId,
  cycleCount,
  config,
  syncedFocusMinutes,
  completedSessions,
  sessionLogs,
  studyGuides,
  onStartPause,
  onReset,
  onSelectPhase,
  onSkipPhase,
  onSelectGuide,
  onUpdateConfig,
  onSyncSession,
  onOpenActivityDashboard,
  realtimeStudy,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalPhaseSeconds - remainingSeconds) / Math.max(1, totalPhaseSeconds)) * 100))
  );

  const syncLabel =
    phase === 'focus' && elapsedFocusMinutes >= 1
      ? `Sync +${elapsedFocusMinutes}m`
      : `Log ${config.focusMinutes}m Focus`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs overflow-hidden transition-colors">
        {/* Progress hairline */}
        <div className="h-1 w-full bg-stone-100 dark:bg-stone-800">
          <div
            className={`h-full transition-all duration-300 ${
              phase === 'focus'
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-amber-500 dark:bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Compact Timer Bar */}
        <div className="px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Countdown + Phase Switcher */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl border ${
                  phase === 'focus'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                }`}
              >
                {phase === 'focus' ? <Clock className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums tracking-tight text-stone-900 dark:text-stone-100">
                    {formatClock(remainingSeconds)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {phase === 'focus' ? 'Deep Focus' : phase === 'short_break' ? 'Short Break' : 'Long Break'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Cycle {cycleCount + 1} · {syncedFocusMinutes}m synced to profile ({completedSessions}{' '}
                  {completedSessions === 1 ? 'session' : 'sessions'})
                </p>
              </div>
            </div>

            {/* Phase Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-[11px]">
              {(
                [
                  { id: 'focus', label: `Focus ${config.focusMinutes}m` },
                  { id: 'short_break', label: `Break ${config.shortBreakMinutes}m` },
                  { id: 'long_break', label: `Long ${config.longBreakMinutes}m` },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPhase(item.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    phase === item.id
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {realtimeStudy?.isLiveActive && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-mono tabular-nums text-emerald-800 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
                <span>Course Sync {formatStudyDuration(realtimeStudy.sessionElapsedSeconds)}</span>
              </div>
            )}
          </div>

          {/* Right: Linked Course + Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Target Course Select */}
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 py-1.5 max-w-[230px]">
              <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <select
                value={linkedGuideId}
                onChange={(e) => onSelectGuide(e.target.value)}
                aria-label="Study Guide for Pomodoro Session"
                className="bg-transparent text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none truncate max-w-[185px] cursor-pointer"
              >
                <option value="general" className="bg-white dark:bg-stone-900">
                  General Study Focus
                </option>
                {studyGuides.map((g) => (
                  <option key={g.id} value={g.id} className="bg-white dark:bg-stone-900">
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Start / Pause */}
            <button
              type="button"
              onClick={onStartPause}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Reset current interval"
              aria-label="Reset interval"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onSkipPhase}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Skip to next phase"
              aria-label="Skip phase"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Sync Completed Study Time to User Profile */}
            <button
              type="button"
              onClick={onSyncSession}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sync study session minutes directly to your User Profile active learning statistics"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{syncLabel}</span>
            </button>

            {/* Interval Settings Toggle */}
            <button
              type="button"
              onClick={() => setIsConfigOpen((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 transition-colors cursor-pointer"
              title="Configure Pomodoro intervals & view synced logs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Intervals</span>
              {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Interval Configuration & Session Sync History */}
        {isConfigOpen && (
          <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 px-4 sm:px-6 py-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Pomodoro Interval Configuration
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Customize study and recovery intervals. Completed focus cycles automatically sync with your Activity Dashboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-stone-500 dark:text-stone-400 mr-1">Presets:</span>
                {[
                  { label: 'Classic 25/5', focus: 25, short: 5, long: 15 },
                  { label: 'Deep Work 50/10', focus: 50, short: 10, long: 25 },
                  { label: 'Sprint 15/3', focus: 15, short: 3, long: 10 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        focusMinutes: preset.focus,
                        shortBreakMinutes: preset.short,
                        longBreakMinutes: preset.long,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-stone-400 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                  Focus (min)
                </span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={config.focusMinutes}
                  onChange={(e) => onUpdateConfig({ focusMinutes: Number(e.target.value) || 25 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-stone-900 dark:text-stone-100"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                  Short Break (min)
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={config.shortBreakMinutes}
                  onChange={(e) => onUpdateConfig({ shortBreakMinutes: Number(e.target.value) || 5 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-stone-900 dark:text-stone-100"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                  Long Break (min)
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={config.longBreakMinutes}
                  onChange={(e) => onUpdateConfig({ longBreakMinutes: Number(e.target.value) || 15 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-stone-900 dark:text-stone-100"
                />
              </label>

              <label className="block space-y-1 text-xs">
                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                  Sessions / Long Break
                </span>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={config.sessionsBeforeLongBreak}
                  onChange={(e) =>
                    onUpdateConfig({ sessionsBeforeLongBreak: Number(e.target.value) || 4 })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-stone-900 dark:text-stone-100"
                />
              </label>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 cursor-pointer text-xs font-medium text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={config.autoStartNext}
                    onChange={(e) => onUpdateConfig({ autoStartNext: e.target.checked })}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Auto-cycle</span>
                </label>
              </div>
            </div>

            {/* Recent Synced Logs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-200/70 dark:border-stone-800 text-[11px]">
              <div className="flex flex-wrap items-center gap-2 text-stone-600 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  Recent Synced Focus:
                </span>
                {sessionLogs.length === 0 ? (
                  <span>No completed Pomodoro intervals yet. Start a timer or click Sync.</span>
                ) : (
                  sessionLogs.slice(0, 3).map((log) => (
                    <span
                      key={log.id}
                      className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono"
                    >
                      +{log.durationMinutes}m · {log.guideTitle || 'Focus'}
                    </span>
                  ))
                )}
              </div>

              {onOpenActivityDashboard && (
                <button
                  type="button"
                  onClick={onOpenActivityDashboard}
                  className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer shrink-0 text-left sm:text-right"
                >
                  View in Learning Statistics →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
