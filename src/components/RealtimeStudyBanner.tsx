import React from 'react';
import { Radio, LogIn, BookOpen, Clock } from 'lucide-react';
import { RealtimeStudyTelemetry } from '../types';

export function formatStudyDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface RealtimeStudyBannerProps {
  isAuthenticated: boolean;
  telemetry: RealtimeStudyTelemetry;
  onOpenAuthModal?: () => void;
  onOpenCourseCatalog?: () => void;
  className?: string;
}

export const RealtimeStudyBanner: React.FC<RealtimeStudyBannerProps> = ({
  isAuthenticated,
  telemetry,
  onOpenAuthModal,
  onOpenCourseCatalog,
  className = '',
}) => {
  if (telemetry.isLiveActive && telemetry.activeCourseId) {
    const statusText =
      telemetry.sseStatus === 'live'
        ? 'Live Stream Connected'
        : telemetry.sseStatus === 'connecting'
        ? 'Connecting Stream'
        : 'Syncing Heartbeat';

    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <span>Live Study Sync Active</span>
              <span aria-hidden="true" className="text-emerald-600/60 dark:text-emerald-400/60">·</span>
              <span className="truncate max-w-md font-bold">{telemetry.activeCourseTitle}</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              Chapter {telemetry.activeChapterIdx + 1} · {statusText}
              {telemetry.lastHeartbeatAt
                ? ` · Last saved ${new Date(telemetry.lastHeartbeatAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs tabular-nums">
          <div className="text-right">
            <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-sans">
              Active Session
            </span>
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              {formatStudyDuration(telemetry.sessionElapsedSeconds)}
            </span>
          </div>
          <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800" aria-hidden="true" />
          <div className="text-right">
            <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-sans">
              Course Study Time
            </span>
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              {formatStudyDuration(telemetry.totalCourseStudySeconds)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isAuthenticated ? (
          <Radio className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
        )}
        <div className="min-w-0 text-xs">
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {isAuthenticated
              ? 'Real-Time Study Sync Standby'
              : 'Real-Time Study Sync Requires Sign-In'}
          </span>
          <span className="mx-1.5 text-stone-400" aria-hidden="true">·</span>
          <span className="text-stone-500 dark:text-stone-400">
            {isAuthenticated
              ? 'Select and open any study guide course to stream live reading time and chapter progress.'
              : 'Sign in and open a course reader to activate live study telemetry and persistent server sync.'}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {!isAuthenticated && onOpenAuthModal ? (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Sync</span>
          </button>
        ) : isAuthenticated && onOpenCourseCatalog ? (
          <button
            type="button"
            onClick={onOpenCourseCatalog}
            className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Select a Course</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
