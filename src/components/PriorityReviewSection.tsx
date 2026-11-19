import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Target,
} from 'lucide-react';
import { ReadingProgress, StudyGuide } from '../types';
import { analyzeWeakChaptersForPriorityReview } from '../utils/priorityReviewAnalyzer';

interface PriorityReviewSectionProps {
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onOpenChapterForReview: (guideId: string, chapterIdx: number) => void;
  onRetakeQuiz: (guideId: string, quizId: string) => void;
}

export const PriorityReviewSection: React.FC<PriorityReviewSectionProps> = ({
  studyGuides,
  readingProgress,
  onOpenChapterForReview,
  onRetakeQuiz,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const suggestions = useMemo(
    () => analyzeWeakChaptersForPriorityReview(studyGuides, readingProgress),
    [studyGuides, readingProgress]
  );

  if (suggestions.length === 0) {
    return null;
  }

  const criticalCount = suggestions.filter(
    (s) => s.urgencyLevel === 'Critical'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section
        aria-label="Priority Review weak chapter recommendations"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-hidden"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <Target className="w-4 h-4 shrink-0" />
                <span>Priority Review</span>
              </span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">
                ·
              </span>
              <span className="font-mono tabular-nums text-stone-600 dark:text-stone-300 font-semibold">
                {suggestions.length} Flagged Chapter{suggestions.length === 1 ? '' : 's'}
              </span>
              {criticalCount > 0 && (
                <>
                  <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    {criticalCount} Critical Priority
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Chapters identified from weakChapterIndices across your Quiz History for targeted remediation before retaking assessments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <span>{isCollapsed ? 'Show Priority Review' : 'Collapse'}</span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Priority Review Cards Grid */}
        {!isCollapsed && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((item) => {
              const urgencyTextTone =
                item.urgencyLevel === 'Critical'
                  ? 'text-rose-700 dark:text-rose-400'
                  : item.urgencyLevel === 'High'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-stone-600 dark:text-stone-300';

              const cardSurfaceBorder =
                item.urgencyLevel === 'Critical'
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/35 dark:bg-rose-950/15'
                  : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/35 dark:bg-amber-950/15';

              return (
                <article
                  key={item.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3.5 transition-colors ${cardSurfaceBorder}`}
                >
                  <div className="space-y-2">
                    {/* Unboxed Clean Kicker Row (Zero-Pill Rule) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                      <span className={`inline-flex items-center gap-1 font-bold ${urgencyTextTone}`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Priority Review</span>
                      </span>
                      <span aria-hidden="true" className="text-stone-400">
                        ·
                      </span>
                      <span className={`font-semibold ${urgencyTextTone}`}>
                        {item.urgencyLevel}
                      </span>
                      <span aria-hidden="true" className="text-stone-400">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                        Flagged {item.weakOccurrences}x
                      </span>
                    </div>

                    {/* Course & Chapter Headline */}
                    <div>
                      <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                        {item.guide.title}
                      </p>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mt-0.5">
                        Chapter {item.chapterIdx + 1}: {item.chapterTitle}
                      </h3>
                    </div>

                    {item.chapterExcerpt && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                        {item.chapterExcerpt}
                      </p>
                    )}

                    {/* Diagnostic Quiz Stats Line */}
                    <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800/80 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400">
                      <span>
                        Latest Quiz:{' '}
                        <strong className="text-stone-900 dark:text-stone-100">
                          {item.latestAttemptScore}%
                        </strong>{' '}
                        (Pass: {item.minScoreToPass}%)
                      </span>
                      {item.lowestAccuracyPct !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Chapter Accuracy:{' '}
                            <strong className="text-rose-700 dark:text-rose-400">
                              {item.lowestAccuracyPct}%
                            </strong>
                          </span>
                        </>
                      )}
                      {item.hasPersonalNote && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Notes Saved</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Direct Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenChapterForReview(item.guide.id, item.chapterIdx)
                      }
                      className="flex-1 py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Review Chapter</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onRetakeQuiz(item.guide.id, item.latestQuizId)
                      }
                      className="py-2 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      title={`Retake ${item.latestQuizTitle}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
