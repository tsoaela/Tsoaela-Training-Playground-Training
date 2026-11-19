import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  Quiz,
  QuizAttemptEntry,
  ReadingProgress as ReadingProgressType,
  StudyGuide,
} from '../types';

interface NextBestStepBannerProps {
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgressType>;
  onOpenChapterForReview: (guideId: string, chapterIdx: number) => void;
  onTakeFinalQuiz: (guideId: string, quizId: string) => void;
  onOpenGuide: (guideId: string) => void;
}

interface WorstChapterLink {
  chapterIdx: number;
  title: string;
  accuracyPct?: number;
}

interface FailedQuizRecommendation {
  guide: StudyGuide;
  latestAttempt: QuizAttemptEntry;
  worstChapters: WorstChapterLink[];
}

interface PendingFinalQuizRecommendation {
  guide: StudyGuide;
  finalQuiz: Quiz;
  completedCount: number;
  totalChapters: number;
  progressPercent: number;
}

function resolveWorstChaptersForAttempt(
  guide: StudyGuide,
  attempt: QuizAttemptEntry,
  progress?: ReadingProgressType
): WorstChapterLink[] {
  const chapters = guide.chapters || [];
  if (chapters.length === 0) return [];

  // 1. Prefer explicit per-chapter breakdown captured on the QuizAttemptEntry
  if (attempt.chapterBreakdown && attempt.chapterBreakdown.length > 0) {
    const weakest = [...attempt.chapterBreakdown]
      .filter((entry) => entry.chapterIdx >= 0 && entry.chapterIdx < chapters.length)
      .sort((a, b) => a.accuracyPct - b.accuracyPct || a.chapterIdx - b.chapterIdx);

    const lowScoring = weakest.filter((entry) => entry.accuracyPct < 100);
    const chosen = (lowScoring.length > 0 ? lowScoring : weakest).slice(0, 2);

    if (chosen.length > 0) {
      return chosen.map((entry) => ({
        chapterIdx: entry.chapterIdx,
        title: chapters[entry.chapterIdx]?.title || entry.chapterTitle || `Chapter ${entry.chapterIdx + 1}`,
        accuracyPct: entry.accuracyPct,
      }));
    }
  }

  // 2. Next, check explicit weakChapterIndices stored in Quiz History
  if (attempt.weakChapterIndices && attempt.weakChapterIndices.length > 0) {
    const valid = attempt.weakChapterIndices
      .filter((idx) => idx >= 0 && idx < chapters.length)
      .slice(0, 2);
    if (valid.length > 0) {
      return valid.map((idx) => ({
        chapterIdx: idx,
        title: chapters[idx]?.title || `Chapter ${idx + 1}`,
      }));
    }
  }

  // 3. Deterministic fallback from matched quiz question mapping or incomplete chapters
  const completedSet = new Set(progress?.completedChapters || []);
  const matchedQuiz =
    guide.quizzes?.find((q) => q.id === attempt.quizId) || guide.quizzes?.[0];

  const mappedIndices = Array.from(
    new Set(
      (matchedQuiz?.questions || [])
        .map((q) => q.chapterIdx)
        .filter((idx): idx is number => typeof idx === 'number' && idx >= 0 && idx < chapters.length)
    )
  );

  const incompleteIndices = chapters
    .map((_, idx) => idx)
    .filter((idx) => !completedSet.has(idx));

  const candidateIndices =
    incompleteIndices.length > 0
      ? incompleteIndices
      : mappedIndices.length > 0
      ? mappedIndices
      : chapters.map((_, idx) => idx);

  return candidateIndices.slice(0, 2).map((idx) => ({
    chapterIdx: idx,
    title: chapters[idx]?.title || `Chapter ${idx + 1}`,
  }));
}

function getNormalizedAttempts(
  guide: StudyGuide,
  progress?: ReadingProgressType
): QuizAttemptEntry[] {
  if (!progress) return [];
  const rawHistory = progress.quizHistory ? [...progress.quizHistory] : [];

  if (rawHistory.length === 0 && progress.quizScores) {
    Object.entries(progress.quizScores).forEach(([quizId, score], idx) => {
      if (typeof score !== 'number') return;
      const matchedQuiz =
        guide.quizzes?.find((q) => q.id === quizId) || guide.quizzes?.[0];
      const minScore = matchedQuiz?.minScoreToPass || 70;
      const totalQ = matchedQuiz?.questions?.length || 2;
      rawHistory.push({
        id: `legacy_${guide.id}_${quizId}_${idx}`,
        quizId,
        quizTitle: matchedQuiz?.title || 'Knowledge Assessment',
        score,
        minScoreToPass: minScore,
        passed: score >= minScore,
        correctCount: Math.round((score / 100) * totalQ),
        totalQuestions: totalQ,
        attemptedAt: progress.lastAccessedAt || `${progress.lastReadDate}T12:00:00`,
      });
    });
  }

  // Sort newest attempt first
  return rawHistory.sort(
    (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
  );
}

export const NextBestStepBanner: React.FC<NextBestStepBannerProps> = ({
  studyGuides,
  readingProgress,
  onOpenChapterForReview,
  onTakeFinalQuiz,
  onOpenGuide,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const { failedQuizItems, pendingFinalQuizItems } = useMemo(() => {
    const failedList: FailedQuizRecommendation[] = [];
    const pendingQuizList: PendingFinalQuizRecommendation[] = [];

    studyGuides.forEach((guide) => {
      const prog = readingProgress[guide.id];
      const totalChapters = Math.max(1, guide.chapters?.length || 1);
      const completedCount = (prog?.completedChapters || []).filter(
        (idx) => idx >= 0 && idx < totalChapters
      ).length;
      const computedPct = Math.round((completedCount / totalChapters) * 100);
      const progressPercent = prog?.progressPercent ?? computedPct;

      const sortedAttempts = getNormalizedAttempts(guide, prog);
      const latestAttempt = sortedAttempts[0];

      // Rule 1: Failed a recent quiz -> link directly to worst-performing chapters in Quiz History
      if (
        latestAttempt &&
        (!latestAttempt.passed || latestAttempt.score < latestAttempt.minScoreToPass)
      ) {
        const worstChapters = resolveWorstChaptersForAttempt(guide, latestAttempt, prog);
        if (worstChapters.length > 0) {
          failedList.push({
            guide,
            latestAttempt,
            worstChapters,
          });
        }
      }

      // Rule 2: Completed 50%+ of a course without taking its final quiz -> suggest taking it
      const finalQuiz =
        guide.quizzes && guide.quizzes.length > 0
          ? guide.quizzes[guide.quizzes.length - 1]
          : null;

      if (progressPercent >= 50 && finalQuiz) {
        const hasTakenFinalQuiz =
          sortedAttempts.some((a) => a.quizId === finalQuiz.id) ||
          typeof prog?.quizScores?.[finalQuiz.id] === 'number';

        if (!hasTakenFinalQuiz) {
          pendingQuizList.push({
            guide,
            finalQuiz,
            completedCount,
            totalChapters,
            progressPercent,
          });
        }
      }
    });

    // Sort failed items by most recent attempt timestamp
    failedList.sort(
      (a, b) =>
        new Date(b.latestAttempt.attemptedAt).getTime() -
        new Date(a.latestAttempt.attemptedAt).getTime()
    );

    // Sort pending final quiz items by highest progress %
    pendingQuizList.sort((a, b) => b.progressPercent - a.progressPercent);

    return {
      failedQuizItems: failedList,
      pendingFinalQuizItems: pendingQuizList,
    };
  }, [studyGuides, readingProgress]);

  const totalRecommendations = failedQuizItems.length + pendingFinalQuizItems.length;

  if (totalRecommendations === 0) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs">
          <span className="text-stone-600 dark:text-stone-300 font-medium flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              Next Best Step hidden ·{' '}
              <span className="font-mono tabular-nums font-semibold">
                {totalRecommendations}
              </span>{' '}
              study recommendation{totalRecommendations === 1 ? '' : 's'} available
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsDismissed(false)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            Show Recommendations
          </button>
        </div>
      </div>
    );
  }

  const primaryFailed = failedQuizItems[0] || null;
  const primaryPendingQuiz = pendingFinalQuizItems[0] || null;
  const secondaryFailed = !primaryPendingQuiz ? failedQuizItems[1] || null : null;
  const secondaryPendingQuiz = !primaryFailed ? pendingFinalQuizItems[1] || null : null;

  const cardsCount =
    (primaryFailed ? 1 : 0) +
    (primaryPendingQuiz ? 1 : 0) +
    (secondaryFailed ? 1 : 0) +
    (secondaryPendingQuiz ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section
        aria-label="Next Best Step study recommendations"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs space-y-4"
      >
        {/* Banner Top Row (zero-pill clean metadata) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Next Best Step</span>
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">
              ·
            </span>
            <span className="text-stone-500 dark:text-stone-400">
              Guidance based on chapter progress and recent Quiz History
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss Next Best Step banner"
            aria-label="Dismiss Next Best Step banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Cards Grid */}
        <div
          className={`grid grid-cols-1 ${
            cardsCount > 1 ? 'lg:grid-cols-2' : ''
          } gap-4`}
        >
          {/* Priority Rule A: 50%+ Course Without Final Quiz */}
          {primaryPendingQuiz && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Final Quiz Ready</span>
                  <span aria-hidden="true" className="text-emerald-400 dark:text-emerald-700">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {primaryPendingQuiz.progressPercent}% Complete (
                    {primaryPendingQuiz.completedCount}/
                    {primaryPendingQuiz.totalChapters} Chapters)
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {primaryPendingQuiz.guide.title}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  You have completed over half of this curriculum without attempting{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {primaryPendingQuiz.finalQuiz.title}
                  </span>
                  . Take the final assessment to lock in your credential milestone.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onTakeFinalQuiz(
                      primaryPendingQuiz.guide.id,
                      primaryPendingQuiz.finalQuiz.id
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Take Final Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGuide(primaryPendingQuiz.guide.id)}
                  className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Course</span>
                </button>
              </div>
            </div>
          )}

          {/* Secondary 50%+ Final Quiz item if no failed quiz takes slot 2 */}
          {secondaryPendingQuiz && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Final Quiz Ready</span>
                  <span aria-hidden="true" className="text-emerald-400 dark:text-emerald-700">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    {secondaryPendingQuiz.progressPercent}% Complete (
                    {secondaryPendingQuiz.completedCount}/
                    {secondaryPendingQuiz.totalChapters} Chapters)
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {secondaryPendingQuiz.guide.title}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Finish validating your progress with{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {secondaryPendingQuiz.finalQuiz.title}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onTakeFinalQuiz(
                      secondaryPendingQuiz.guide.id,
                      secondaryPendingQuiz.finalQuiz.id
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Take Final Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Priority Rule B: Failed Recent Quiz -> Direct links to worst-performing chapters */}
          {[primaryFailed, secondaryFailed].filter(
            (item): item is FailedQuizRecommendation => Boolean(item)
          ).map((item) => (
            <div
              key={item.guide.id}
              className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/45 dark:bg-amber-950/20 p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Quiz Review Recommended</span>
                  <span aria-hidden="true" className="text-amber-400 dark:text-amber-700">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">
                    Recent Score {item.latestAttempt.score}% (Pass:{' '}
                    {item.latestAttempt.minScoreToPass}%)
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {item.guide.title}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Based on your{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {item.latestAttempt.quizTitle}
                  </span>{' '}
                  attempt, jump straight to your lowest-scoring chapter
                  {item.worstChapters.length > 1 ? 's' : ''} before retaking:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {item.worstChapters.map((ch) => (
                  <button
                    key={ch.chapterIdx}
                    type="button"
                    onClick={() => onOpenChapterForReview(item.guide.id, ch.chapterIdx)}
                    className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer max-w-full"
                    title={`Open ${item.guide.title} directly at Chapter ${ch.chapterIdx + 1}: ${ch.title}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[240px]">
                      Review Ch. {ch.chapterIdx + 1}: {ch.title}
                    </span>
                    {typeof ch.accuracyPct === 'number' && (
                      <span className="font-mono tabular-nums opacity-80 shrink-0">
                        ({ch.accuracyPct}%)
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    onTakeFinalQuiz(item.guide.id, item.latestAttempt.quizId)
                  }
                  className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
