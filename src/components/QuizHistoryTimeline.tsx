import React, { useMemo } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  RotateCcw,
  Award,
  Play,
} from 'lucide-react';
import { Quiz, QuizAttemptEntry, ReadingProgress, StudyGuide } from '../types';

interface QuizHistoryTimelineProps {
  guide: StudyGuide;
  progress?: ReadingProgress;
  onStartQuiz?: (quiz: Quiz) => void;
  compact?: boolean;
}

function formatAttemptTimestamp(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const QuizHistoryTimeline: React.FC<QuizHistoryTimelineProps> = ({
  guide,
  progress,
  onStartQuiz,
  compact = false,
}) => {
  const attempts = useMemo<QuizAttemptEntry[]>(() => {
    const rawHistory = progress?.quizHistory ? [...progress.quizHistory] : [];

    // Fallback: if legacy quizScores exist without quizHistory entries, synthesize an entry cleanly
    if (rawHistory.length === 0 && progress?.quizScores) {
      const entries = Object.entries(progress.quizScores).filter(
        ([, val]) => typeof val === 'number'
      );
      entries.forEach(([quizId, score], idx) => {
        const matchedQuiz =
          guide.quizzes?.find((q) => q.id === quizId) || guide.quizzes?.[0];
        const minScore = matchedQuiz?.minScoreToPass || 70;
        const totalQuestions = matchedQuiz?.questions?.length || 2;
        rawHistory.push({
          id: `legacy_${guide.id}_${quizId}_${idx}`,
          quizId,
          quizTitle: matchedQuiz?.title || 'Knowledge Assessment',
          score,
          minScoreToPass: minScore,
          passed: score >= minScore,
          correctCount: Math.round((score / 100) * totalQuestions),
          totalQuestions,
          attemptedAt: progress.lastAccessedAt || `${progress.lastReadDate}T12:00:00`,
        });
      });
    }

    return rawHistory.sort(
      (a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
    );
  }, [guide, progress]);

  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return {
        bestScore: null as number | null,
        latestScore: null as number | null,
        netImprovement: 0,
        passedCount: 0,
      };
    }
    const scores = attempts.map((a) => a.score);
    const bestScore = Math.max(...scores);
    const firstScore = attempts[0].score;
    const latestScore = attempts[attempts.length - 1].score;
    const netImprovement = latestScore - firstScore;
    const passedCount = attempts.filter((a) => a.passed).length;

    return {
      bestScore,
      latestScore,
      netImprovement,
      passedCount,
    };
  }, [attempts]);

  const primaryQuiz = guide.quizzes?.[0];

  return (
    <div
      className={`rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 ${
        compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
            <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Quiz History &amp; Score Progression</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Chronological record of every assessment attempt for {guide.title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {attempts.length > 0 && (
            <>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] font-mono text-stone-700 dark:text-stone-300">
                {attempts.length} {attempts.length === 1 ? 'Attempt' : 'Attempts'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                Best: {stats.bestScore}%
              </span>
              {attempts.length >= 2 && (
                <span
                  className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold inline-flex items-center gap-1 ${
                    stats.netImprovement > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : stats.netImprovement < 0
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {stats.netImprovement > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : stats.netImprovement < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  <span>
                    {stats.netImprovement > 0
                      ? `+${stats.netImprovement}% since #1`
                      : stats.netImprovement < 0
                      ? `${stats.netImprovement}% since #1`
                      : 'Steady vs #1'}
                  </span>
                </span>
              )}
            </>
          )}

          {onStartQuiz && primaryQuiz && (
            <button
              type="button"
              onClick={() => onStartQuiz(primaryQuiz)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>{attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State or Timeline */}
      {attempts.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/50 text-center space-y-1.5">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            No quiz attempts recorded for this course yet.
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Complete a Knowledge Assessment to log your baseline score and track mastery across retakes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visual Score Progression Strip */}
          <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              <span>Score Trajectory</span>
              <span>Target Pass Threshold: {attempts[0].minScoreToPass}%</span>
            </div>
            <div className="flex items-end gap-2 h-14">
              {attempts.map((attempt, idx) => (
                <div
                  key={attempt.id}
                  className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-[36px]"
                  title={`Attempt #${idx + 1}: ${attempt.score}%`}
                >
                  <span className="text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                    {attempt.score}%
                  </span>
                  <div className="w-full max-w-[44px] flex-1 bg-stone-100 dark:bg-stone-800 rounded-sm flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-sm transition-all duration-300 ${
                        attempt.passed
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ height: `${Math.max(12, attempt.score)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Timeline Items (Newest First for quick review) */}
          <div className="relative pl-5 space-y-2.5 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-stone-200 dark:before:bg-stone-800">
            {[...attempts].reverse().map((attempt, revIdx) => {
              const chronoIndex = attempts.length - 1 - revIdx;
              const prevAttempt = chronoIndex > 0 ? attempts[chronoIndex - 1] : null;
              const stepDelta = prevAttempt ? attempt.score - prevAttempt.score : null;

              return (
                <div
                  key={attempt.id}
                  className="relative p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  {/* Timeline node dot */}
                  <span
                    className={`absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-stone-950 ${
                      attempt.passed ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        Attempt #{chronoIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {attempt.quizTitle}
                      </span>
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          <RotateCcw className="w-3 h-3" />
                          <span>Needs Review (&lt;{attempt.minScoreToPass}%)</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                      {formatAttemptTimestamp(attempt.attemptedAt)} · {attempt.correctCount}/
                      {attempt.totalQuestions} correct
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {stepDelta !== null && (
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          stepDelta > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : stepDelta < 0
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {stepDelta > 0 ? `+${stepDelta}%` : stepDelta < 0 ? `${stepDelta}%` : '0%'}
                      </span>
                    )}
                    <div className="text-right">
                      <span
                        className={`text-base font-extrabold font-mono tabular-nums ${
                          attempt.passed
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {attempt.score}%
                      </span>
                      {attempt.passed && stats.bestScore === attempt.score && (
                        <span className="flex items-center justify-end gap-0.5 text-[9px] font-mono text-amber-600 dark:text-amber-400">
                          <Award className="w-2.5 h-2.5" /> Peak
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
