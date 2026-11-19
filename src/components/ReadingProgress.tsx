import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, BookOpen, CheckCircle2, Download, FileText, PartyPopper } from 'lucide-react';
import { ReadingProgress as ReadingProgressRecord, StudyGuide } from '../types';
import { CompletionConfetti } from './CompletionConfetti';

export interface ChapterNotesMarkdownExportParams {
  guideId?: string;
  courseTitle?: string;
  chapters?: { title: string; content?: string }[];
  chapterNotes?: Record<number, string>;
  generalNotes?: string;
  completionLog?: { chapterIdx: number; completedAt: string; notes?: string }[];
  studyGuides?: StudyGuide[];
  allReadingProgress?: Record<string, ReadingProgressRecord>;
  learnerName?: string;
}

export interface ChapterNotesMarkdownBuildResult {
  markdown: string;
  noteCount: number;
  courseCount: number;
}

export function buildChapterNotesMarkdown(
  params: ChapterNotesMarkdownExportParams
): ChapterNotesMarkdownBuildResult {
  const {
    guideId,
    courseTitle,
    chapters = [],
    chapterNotes,
    generalNotes,
    completionLog,
    studyGuides = [],
    allReadingProgress = {},
    learnerName,
  } = params;

  const guidesById: Record<string, StudyGuide> = {};
  for (const g of studyGuides) {
    guidesById[g.id] = g;
  }

  // Build normalized per-course progress snapshot combining allReadingProgress + active guide props
  const progressMap: Record<string, ReadingProgressRecord> = { ...allReadingProgress };

  if (guideId) {
    const existing = progressMap[guideId];
    progressMap[guideId] = {
      guideId,
      completedChapters: existing?.completedChapters ?? [],
      progressPercent: existing?.progressPercent ?? 0,
      lastReadDate: existing?.lastReadDate ?? new Date().toISOString().split('T')[0],
      lastAccessedAt: existing?.lastAccessedAt,
      isCompleted: existing?.isCompleted ?? false,
      notes: generalNotes !== undefined ? generalNotes : existing?.notes,
      chapterNotes: chapterNotes ?? existing?.chapterNotes ?? {},
      quizScores: existing?.quizScores,
      quizHistory: existing?.quizHistory,
      unlockedBadges: existing?.unlockedBadges,
      completionLog: completionLog ?? existing?.completionLog,
    };
  }

  const orderedIds: string[] = [];
  if (guideId && progressMap[guideId]) {
    orderedIds.push(guideId);
  }
  for (const g of studyGuides) {
    if (!orderedIds.includes(g.id) && progressMap[g.id]) {
      orderedIds.push(g.id);
    }
  }
  for (const id of Object.keys(progressMap)) {
    if (!orderedIds.includes(id)) {
      orderedIds.push(id);
    }
  }

  let totalSavedNotes = 0;
  let coursesWithNotes = 0;
  const courseSections: string[] = [];

  for (const id of orderedIds) {
    const prog = progressMap[id];
    if (!prog) continue;

    const guide = guidesById[id];
    const resolvedTitle =
      (id === guideId && courseTitle) || guide?.title || `Study Guide (${id})`;
    const resolvedChapters =
      id === guideId && chapters.length > 0 ? chapters : guide?.chapters || [];

    const mergedChapterNotes: Record<number, string> = {};

    // Collect notes saved in completionLog first as fallback
    if (Array.isArray(prog.completionLog)) {
      for (const entry of prog.completionLog) {
        if (entry.notes && entry.notes.trim()) {
          mergedChapterNotes[entry.chapterIdx] = entry.notes.trim();
        }
      }
    }

    // Override with explicit chapterNotes map
    if (prog.chapterNotes) {
      for (const [idxStr, text] of Object.entries(prog.chapterNotes)) {
        const idx = Number(idxStr);
        if (!Number.isNaN(idx) && typeof text === 'string' && text.trim()) {
          mergedChapterNotes[idx] = text.trim();
        }
      }
    }

    const chapterIndices = Object.keys(mergedChapterNotes)
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    const trimmedGeneralNotes = prog.notes?.trim() || '';

    if (chapterIndices.length === 0 && !trimmedGeneralNotes) {
      continue;
    }

    coursesWithNotes += 1;
    const totalChaptersCount =
      resolvedChapters.length > 0
        ? resolvedChapters.length
        : Math.max(prog.completedChapters.length, chapterIndices.length);
    const metaParts: string[] = [];
    if (guide?.category) metaParts.push(`**Category:** ${guide.category}`);
    if (guide?.duration_type) {
      metaParts.push(
        `**Track:** ${
          guide.duration_type === 'long_term'
            ? 'Long-Term Course (R145)'
            : 'Short Course (Free)'
        }`
      );
    }
    metaParts.push(
      `**Progress:** ${Math.round(prog.progressPercent)}% (${prog.completedChapters.length}/${totalChaptersCount} chapters)`
    );

    const lines: string[] = [
      `## ${resolvedTitle}`,
      '',
      metaParts.join(' · '),
      '',
    ];

    if (trimmedGeneralNotes) {
      totalSavedNotes += 1;
      lines.push('### General Course Notes & Key Takeaways', '');
      lines.push(
        ...trimmedGeneralNotes.split('\n').map((line) => (line.trim() ? line : '')),
        ''
      );
    }

    for (const chIdx of chapterIndices) {
      totalSavedNotes += 1;
      const chTitle =
        resolvedChapters[chIdx]?.title || `Chapter ${chIdx + 1}`;
      const isDone = prog.completedChapters.includes(chIdx);
      const logEntry = prog.completionLog?.find((e) => e.chapterIdx === chIdx);
      const statusSuffix = isDone
        ? logEntry?.completedAt
          ? `Completed (${new Date(logEntry.completedAt).toLocaleDateString()})`
          : 'Completed'
        : 'In Progress';

      lines.push(`### Chapter ${chIdx + 1}: ${chTitle}`);
      lines.push(`- **Status:** ${statusSuffix}`, '');
      lines.push(mergedChapterNotes[chIdx], '');
    }

    courseSections.push(lines.join('\n'));
  }

  const exportedAt = new Date();
  const headerLines = [
    '# TTG Digital Educare — Personal Chapter Notes Backup',
    '',
    `- **Exported:** ${exportedAt.toLocaleString()}`,
    ...(learnerName ? [`- **Scholar:** ${learnerName}`] : []),
    `- **Courses Included:** ${coursesWithNotes}`,
    `- **Saved Notes Count:** ${totalSavedNotes}`,
    '',
    '---',
    '',
  ];

  if (courseSections.length === 0) {
    const activeTitle = courseTitle || guidesById[guideId || '']?.title || 'Study Notes Workbook';
    const activeChapters =
      chapters.length > 0
        ? chapters
        : guidesById[guideId || '']?.chapters || [];

    const fallbackLines = [
      `## ${activeTitle}`,
      '',
      '> No personal chapter notes have been saved yet. Use the headings below to record local study takeaways or add chapter summaries inside the TTG Reader.',
      '',
      ...activeChapters.flatMap((ch, idx) => [
        `### Chapter ${idx + 1}: ${ch.title}`,
        '- **Personal Summary:** _(No note saved yet)_',
        '',
      ]),
    ];

    return {
      markdown: [...headerLines, ...fallbackLines].join('\n'),
      noteCount: 0,
      courseCount: 0,
    };
  }

  const footerLines = [
    '---',
    '',
    '_Generated by TTG - Tsoaela Training Ground Platform (ReadingProgress Markdown Backup)._',
  ];

  return {
    markdown: [...headerLines, ...courseSections, ...footerLines].join('\n'),
    noteCount: totalSavedNotes,
    courseCount: coursesWithNotes,
  };
}

export function exportChapterNotesToMarkdown(
  params: ChapterNotesMarkdownExportParams
): {
  exported: boolean;
  filename: string;
  noteCount: number;
  courseCount: number;
} {
  const { markdown, noteCount, courseCount } = buildChapterNotesMarkdown(params);
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `TTG_Personal_Chapter_Notes_${dateStamp}.md`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return {
    exported: true,
    filename,
    noteCount,
    courseCount,
  };
}

export interface ReadingProgressProps {
  guideId?: string;
  courseTitle?: string;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isCompleted: boolean;
  variant?: 'reader' | 'card' | 'compact';
  enableConfetti?: boolean;
  confettiVariant?: 'viewport' | 'contained';
  className?: string;
  chapters?: { title: string; content?: string }[];
  chapterNotes?: Record<number, string>;
  generalNotes?: string;
  completionLog?: { chapterIdx: number; completedAt: string; notes?: string }[];
  studyGuides?: StudyGuide[];
  allReadingProgress?: Record<string, ReadingProgressRecord>;
  learnerName?: string;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
  guideId,
  courseTitle,
  completedCount,
  totalCount,
  progressPercent,
  isCompleted,
  variant = 'reader',
  enableConfetti = true,
  confettiVariant = 'viewport',
  className = '',
  chapters,
  chapterNotes,
  generalNotes,
  completionLog,
  studyGuides,
  allReadingProgress,
  learnerName,
}) => {
  const safePercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
  const prevCompletedRef = useRef<boolean>(isCompleted);
  const [burstKey, setBurstKey] = useState<number>(0);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  // Trigger particle confetti burst whenever isCompleted transitions to true
  useEffect(() => {
    const reachedCompletion = !prevCompletedRef.current && isCompleted;
    prevCompletedRef.current = isCompleted;

    if (reachedCompletion && enableConfetti) {
      setBurstKey((prev) => prev + 1);
      setIsCelebrating(true);
      const timer = window.setTimeout(() => setIsCelebrating(false), 3200);
      return () => window.clearTimeout(timer);
    }

    if (!isCompleted) {
      setIsCelebrating(false);
    }
  }, [isCompleted, enableConfetti]);

  const savedNotesPreview = useMemo(() => {
    return buildChapterNotesMarkdown({
      guideId,
      courseTitle,
      chapters,
      chapterNotes,
      generalNotes,
      completionLog,
      studyGuides,
      allReadingProgress,
      learnerName,
    });
  }, [
    guideId,
    courseTitle,
    chapters,
    chapterNotes,
    generalNotes,
    completionLog,
    studyGuides,
    allReadingProgress,
    learnerName,
  ]);

  const handleExportNotesMarkdown = () => {
    const result = exportChapterNotesToMarkdown({
      guideId,
      courseTitle,
      chapters,
      chapterNotes,
      generalNotes,
      completionLog,
      studyGuides,
      allReadingProgress,
      learnerName,
    });

    if (result.exported) {
      setExportStatusMessage(
        result.noteCount > 0
          ? `Exported ${result.noteCount} note${result.noteCount === 1 ? '' : 's'} (.md)`
          : 'Exported notes workbook (.md)'
      );
      window.setTimeout(() => setExportStatusMessage(null), 3200);
    }
  };

  const handleReplayConfetti = () => {
    if (!enableConfetti || !isCompleted) return;
    setBurstKey((prev) => prev + 1);
    setIsCelebrating(true);
    window.setTimeout(() => setIsCelebrating(false), 3200);
  };

  if (variant === 'card') {
    return (
      <div className={`relative space-y-1 ${className}`}>
        {enableConfetti && (
          <CompletionConfetti
            active={isCompleted}
            burstKey={burstKey}
            variant={confettiVariant}
          />
        )}
        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <span>Reading Process</span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Milestone Reached</span>
              </span>
            )}
          </span>
          <span className="font-mono tabular-nums font-medium text-stone-700 dark:text-stone-300">
            {completedCount}/{totalCount} Chapters ({safePercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative space-y-1 ${className}`}>
        {enableConfetti && (
          <CompletionConfetti
            active={isCompleted}
            burstKey={burstKey}
            variant={confettiVariant}
          />
        )}
        <div className="flex justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400">
          <span>{isCompleted ? '100% Milestone' : 'Progress'}</span>
          <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
            {safePercent}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </div>
    );
  }

  // 'reader' variant: full interactive ReadingProgress header bar inside the study guide reader
  return (
    <div
      className={`relative pt-2 border-t border-stone-200 dark:border-stone-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${className}`}
    >
      {enableConfetti && (
        <CompletionConfetti
          active={isCompleted}
          burstKey={burstKey}
          variant={confettiVariant}
        />
      )}

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 gap-2">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <BookOpen
              className={`w-3.5 h-3.5 shrink-0 ${
                isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <span>Reading Progress</span>
            {isCelebrating && (
              <span
                role="status"
                aria-live="polite"
                className="text-emerald-700 dark:text-emerald-300 font-semibold"
              >
                · 100% Course Milestone Unlocked
              </span>
            )}
          </span>
          <span className="font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100 shrink-0">
            {completedCount} of {totalCount} Chapters ({safePercent}%)
          </span>
        </div>

        <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 shrink-0 text-xs">
        <button
          type="button"
          onClick={handleExportNotesMarkdown}
          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          title="Export all saved personal chapter notes across your courses into a single Markdown (.md) file"
          aria-label="Export all saved personal chapter notes to Markdown"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Export Notes (.md)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 tabular-nums">
            {savedNotesPreview.noteCount}
          </span>
          <Download className="w-3 h-3 text-stone-400" />
        </button>

        {exportStatusMessage && (
          <span
            role="status"
            aria-live="polite"
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{exportStatusMessage}</span>
          </span>
        )}

        {isCompleted && (
          <>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
              <Award className="w-3.5 h-3.5" />
              <span>Syllabus Mastered</span>
            </span>
            {enableConfetti && (
              <button
                type="button"
                onClick={handleReplayConfetti}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-amber-300 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                title="Replay 100% completion celebration confetti"
                aria-label="Replay completion confetti animation"
              >
                <PartyPopper className="w-3.5 h-3.5" />
                <span>Celebrate</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
