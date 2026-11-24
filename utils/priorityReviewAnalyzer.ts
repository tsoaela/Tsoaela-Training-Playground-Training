import { QuizAttemptEntry, ReadingProgress, StudyGuide } from '../types';

export type PriorityReviewUrgency = 'Critical' | 'High' | 'Recommended';

export interface PriorityReviewSuggestion {
  id: string;
  guide: StudyGuide;
  chapterIdx: number;
  chapterTitle: string;
  chapterExcerpt: string;
  weakOccurrences: number;
  lowestAccuracyPct: number | null;
  latestAttemptScore: number;
  minScoreToPass: number;
  latestAttemptDate: string;
  latestQuizId: string;
  latestQuizTitle: string;
  priorityScore: number;
  urgencyLevel: PriorityReviewUrgency;
  hasPersonalNote: boolean;
}

interface ChapterWeakAccumulator {
  chapterIdx: number;
  weakOccurrences: number;
  lowestAccuracyPct: number | null;
  latestAccuracyPct: number | null;
  latestAttempt: QuizAttemptEntry;
}

/**
 * Analyzes `weakChapterIndices` across each course's `quizHistory` in `readingProgress`
 * and returns a prioritized list of specific chapters suggested for review.
 */
export function analyzeWeakChaptersForPriorityReview(
  studyGuides: StudyGuide[],
  readingProgress: Record<string, ReadingProgress>
): PriorityReviewSuggestion[] {
  const suggestions: PriorityReviewSuggestion[] = [];

  for (const guide of studyGuides) {
    const progress = readingProgress[guide.id];
    const chapters = guide.chapters || [];
    if (!progress || !progress.quizHistory || progress.quizHistory.length === 0 || chapters.length === 0) {
      continue;
    }

    // Sort newest quiz attempt first so latest attempt metadata is accurate
    const sortedAttempts = [...progress.quizHistory].sort(
      (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
    );

    const byChapter = new Map<number, ChapterWeakAccumulator>();

    for (const attempt of sortedAttempts) {
      const explicitWeak = Array.isArray(attempt.weakChapterIndices)
        ? attempt.weakChapterIndices
        : [];

      // Also inspect chapterBreakdown if weakChapterIndices omitted any < 100% chapter
      const breakdownWeak = (attempt.chapterBreakdown || [])
        .filter((b) => b.accuracyPct < 100)
        .map((b) => b.chapterIdx);

      const combinedIndices = Array.from(
        new Set(
          (explicitWeak.length > 0 ? explicitWeak : breakdownWeak).filter(
            (idx) => Number.isInteger(idx) && idx >= 0 && idx < chapters.length
          )
        )
      );

      for (const chIdx of combinedIndices) {
        const matchedBreakdown = attempt.chapterBreakdown?.find(
          (b) => b.chapterIdx === chIdx
        );
        const accuracyPct =
          typeof matchedBreakdown?.accuracyPct === 'number'
            ? matchedBreakdown.accuracyPct
            : null;

        const existing = byChapter.get(chIdx);
        if (!existing) {
          byChapter.set(chIdx, {
            chapterIdx: chIdx,
            weakOccurrences: 1,
            lowestAccuracyPct: accuracyPct,
            latestAccuracyPct: accuracyPct,
            latestAttempt: attempt,
          });
        } else {
          existing.weakOccurrences += 1;
          if (accuracyPct !== null) {
            existing.lowestAccuracyPct =
              existing.lowestAccuracyPct === null
                ? accuracyPct
                : Math.min(existing.lowestAccuracyPct, accuracyPct);
          }
        }
      }
    }

    // Check if the most recent attempt on the same quiz fully resolved the chapter at 100%
    const newestOverallAttempt = sortedAttempts[0];

    for (const acc of byChapter.values()) {
      const resolvedInLatest = newestOverallAttempt?.chapterBreakdown?.find(
        (b) => b.chapterIdx === acc.chapterIdx && b.accuracyPct >= 100
      );
      if (resolvedInLatest && newestOverallAttempt.passed) {
        continue;
      }

      const chapter = chapters[acc.chapterIdx];
      const latestFailed =
        !acc.latestAttempt.passed ||
        acc.latestAttempt.score < acc.latestAttempt.minScoreToPass;

      const accuracyPenalty =
        acc.lowestAccuracyPct !== null ? 100 - acc.lowestAccuracyPct : 45;
      const repeatPenalty = Math.min(60, acc.weakOccurrences * 25);
      const failurePenalty = latestFailed ? 30 : 0;

      const priorityScore = Math.round(
        accuracyPenalty + repeatPenalty + failurePenalty
      );

      let urgencyLevel: PriorityReviewUrgency = 'Recommended';
      if (
        (latestFailed && acc.weakOccurrences >= 2) ||
        (acc.lowestAccuracyPct !== null && acc.lowestAccuracyPct === 0 && latestFailed)
      ) {
        urgencyLevel = 'Critical';
      } else if (latestFailed || acc.weakOccurrences >= 2) {
        urgencyLevel = 'High';
      }

      const rawContent = chapter?.content || '';
      const chapterExcerpt =
        rawContent.length > 140
          ? `${rawContent.slice(0, 140).trim()}…`
          : rawContent;

      const hasPersonalNote = Boolean(
        progress.chapterNotes?.[acc.chapterIdx]?.trim()
      );

      suggestions.push({
        id: `${guide.id}_ch_${acc.chapterIdx}`,
        guide,
        chapterIdx: acc.chapterIdx,
        chapterTitle: chapter?.title || `Chapter ${acc.chapterIdx + 1}`,
        chapterExcerpt,
        weakOccurrences: acc.weakOccurrences,
        lowestAccuracyPct: acc.lowestAccuracyPct,
        latestAttemptScore: acc.latestAttempt.score,
        minScoreToPass: acc.latestAttempt.minScoreToPass,
        latestAttemptDate: acc.latestAttempt.attemptedAt,
        latestQuizId: acc.latestAttempt.quizId,
        latestQuizTitle: acc.latestAttempt.quizTitle,
        priorityScore,
        urgencyLevel,
        hasPersonalNote,
      });
    }
  }

  return suggestions.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return (
      new Date(b.latestAttemptDate).getTime() -
      new Date(a.latestAttemptDate).getTime()
    );
  });
}
