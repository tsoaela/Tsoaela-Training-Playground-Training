import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  Brain,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Target,
} from 'lucide-react';
import {
  FocusAiAnalysisResult,
  ReadingProgress,
  StudyGuide,
  UserProfile,
} from '../types';

interface FocusAiPanelProps {
  isEnabled: boolean;
  onToggle: () => void;
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  syncedFocusMinutes: number;
  averageQuizScore: number;
  onNavigateToCourse?: (guideId: string) => void;
}

export const FocusAiPanel: React.FC<FocusAiPanelProps> = ({
  isEnabled,
  onToggle,
  user,
  studyGuides,
  readingProgress,
  syncedFocusMinutes,
  averageQuizScore,
  onNavigateToCourse,
}) => {
  const [analysis, setAnalysis] = useState<FocusAiAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runGeminiAnalysis = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const coursesPayload = studyGuides.map((guide) => {
        const prog = readingProgress[guide.id];
        const completedSet = new Set(prog?.completedChapters || []);
        const remainingChapters = guide.chapters
          .map((ch, idx) => ({ index: idx, title: ch.title }))
          .filter((ch) => !completedSet.has(ch.index));

        const primaryQuiz = guide.quizzes?.[0];
        const latestScore =
          primaryQuiz && prog?.quizScores
            ? prog.quizScores[primaryQuiz.id]
            : undefined;

        return {
          guideId: guide.id,
          title: guide.title,
          category: guide.category,
          difficulty: guide.difficulty,
          readingTime: guide.reading_time,
          totalChapters: guide.chapters.length,
          completedChaptersCount: completedSet.size,
          remainingChapters,
          progressPercent: prog?.progressPercent || 0,
          lastReadDate: prog?.lastReadDate,
          quizTitle: primaryQuiz?.title,
          minScoreToPass: primaryQuiz?.minScoreToPass || 70,
          latestQuizScore: latestScore,
          quizAttemptsCount: prog?.quizHistory?.length || 0,
        };
      });

      const response = await fetch('/api/focus-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user.name,
          specialization: user.specialization,
          syncedFocusMinutes,
          averageQuizScore,
          courses: coursesPayload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Focus AI request failed (${response.status})`);
      }

      setAnalysis(data as FocusAiAnalysisResult);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Unable to reach Gemini Focus AI service. Check server configuration and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user.name, user.specialization, studyGuides, readingProgress, syncedFocusMinutes, averageQuizScore]);

  useEffect(() => {
    if (isEnabled && !analysis && !isLoading) {
      void runGeminiAnalysis();
    }
  }, [isEnabled, analysis, isLoading, runGeminiAnalysis]);

  return (
    <section
      aria-labelledby="focus-ai-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4"
    >
      {/* Top Toggle & Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Brain className="w-4 h-4" />
            <span>Focus AI · Gemini Performance Coach</span>
            {analysis?.modelUsed && isEnabled && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                  {analysis.modelUsed}
                </span>
              </>
            )}
          </div>
          <h2
            id="focus-ai-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Intelligent Study Priority Recommendations
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Analyzes completed chapters, past quiz score trends, and focus minutes via Gemini to pinpoint high-priority chapters and quizzes to tackle next.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isEnabled && (
            <button
              type="button"
              onClick={() => void runGeminiAnalysis()}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Refresh Analysis'}</span>
            </button>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label="Toggle Focus AI mode"
            onClick={onToggle}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
              isEnabled
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                isEnabled ? 'text-amber-400 dark:text-amber-600' : 'text-amber-600'
              }`}
            />
            <span>Focus AI: {isEnabled ? 'On' : 'Off'}</span>
            <span
              aria-hidden="true"
              className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                isEnabled
                  ? 'bg-amber-500 justify-end'
                  : 'bg-stone-300 dark:bg-stone-700 justify-start'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Analysis Output */}
      {isEnabled && (
        <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5" aria-busy="true">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2.5 animate-pulse"
                >
                  <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-4 w-4/5 rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-10 w-full rounded bg-stone-200 dark:bg-stone-800" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Focus AI Analysis Unavailable
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void runGeminiAnalysis()}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Retry Gemini Analysis
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Trend Synthesis Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950">
                <div className="lg:col-span-2 space-y-1">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {analysis.coachHeadline}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {analysis.performanceTrendSummary}
                  </p>
                </div>
                <div className="lg:border-l border-stone-200 dark:border-stone-800 lg:pl-4 flex flex-col justify-center space-y-1">
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recommended Study Cadence</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {analysis.studyCadenceTip}
                  </p>
                </div>
              </div>

              {/* Prioritized Chapter & Quiz Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {analysis.recommendations.map((rec, idx) => {
                    const PriorityIcon =
                      rec.priority === 'High'
                        ? Target
                        : rec.recommendationType === 'quiz'
                        ? CheckCircle2
                        : BookOpen;

                    const priorityTone =
                      rec.priority === 'High'
                        ? 'text-rose-700 dark:text-rose-300'
                        : rec.priority === 'Medium'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-emerald-700 dark:text-emerald-300';

                    return (
                      <div
                        key={`${rec.guideId}_${idx}`}
                        className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${priorityTone}`}
                            >
                              <PriorityIcon className="w-3.5 h-3.5" />
                              <span>
                                {rec.priority} Priority ·{' '}
                                {rec.recommendationType === 'quiz'
                                  ? 'Quiz'
                                  : rec.recommendationType === 'review'
                                  ? 'Review'
                                  : 'Chapter'}
                              </span>
                            </span>
                            <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                              ~{rec.estimatedMinutes} min
                            </span>
                          </div>

                          <div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {rec.courseTitle}
                            </div>
                            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mt-0.5">
                              {rec.targetLabel}
                            </h3>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                            {rec.rationale}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800 space-y-2">
                          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            Impact: {rec.expectedImpact}
                          </div>
                          {onNavigateToCourse && (
                            <button
                              type="button"
                              onClick={() => onNavigateToCourse(rec.guideId)}
                              className="w-full py-1.5 px-3 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>
                                {rec.recommendationType === 'quiz'
                                  ? 'Launch Quiz Module'
                                  : 'Open Chapter'}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};
