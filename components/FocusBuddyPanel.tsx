import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Send,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import {
  AcceptedRegisteredStudent,
  DeepWorkState,
  EnrolledStudentRecord,
  FocusIntensityMetrics,
  StudyGuide,
  UserProfile,
} from '../types';
import {
  buildFocusBuddySuggestions,
  FocusBuddyPairSuggestion,
} from '../utils/focusBuddyMatcher';
import { computeWeeklyFocusChallengeMetrics } from '../utils/deepWorkAnalytics';

interface FocusBuddyPanelProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  enrollments?: EnrolledStudentRecord[];
  acceptedStudents?: AcceptedRegisteredStudent[];
  deepWorkState?: DeepWorkState;
  focusIntensity?: FocusIntensityMetrics;
  isDeepWorkActive?: boolean;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string, roomId?: string) => void;
}

const INVITED_BUDDIES_KEY = 'ttg_focus_buddy_invites_v1';

export const FocusBuddyPanel: React.FC<FocusBuddyPanelProps> = ({
  user,
  studyGuides,
  enrollments = [],
  acceptedStudents = [],
  deepWorkState,
  focusIntensity,
  isDeepWorkActive = false,
  onStartDeepWork,
  onStartStudyRoom,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [invitedPairIds, setInvitedPairIds] = useState<Record<string, string>>(
    () => {
      try {
        const raw = localStorage.getItem(INVITED_BUDDIES_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }
  );
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(INVITED_BUDDIES_KEY, JSON.stringify(invitedPairIds));
    } catch {
      // Ignore storage write errors
    }
  }, [invitedPairIds]);

  const weeklyMetrics = useMemo(
    () => computeWeeklyFocusChallengeMetrics({ deepWorkState }),
    [deepWorkState]
  );

  const buddyData = useMemo(
    () =>
      buildFocusBuddySuggestions({
        user,
        userWeeklyMinutes: weeklyMetrics.weeklyMinutes,
        userFocusIntensityScore: focusIntensity?.score ?? 82,
        studyGuides,
        enrollments,
        acceptedStudents,
        activeCourseId: deepWorkState?.linkedGuideId,
      }),
    [
      user,
      weeklyMetrics.weeklyMinutes,
      focusIntensity?.score,
      studyGuides,
      enrollments,
      acceptedStudents,
      deepWorkState?.linkedGuideId,
    ]
  );

  const visiblePairs = useMemo(() => {
    if (selectedCourseId === 'all') return buddyData.pairs;
    return buddyData.pairs.filter((p) => p.courseId === selectedCourseId);
  }, [buddyData.pairs, selectedCourseId]);

  const handleToggleInvite = (pair: FocusBuddyPairSuggestion) => {
    const alreadyInvited = Boolean(invitedPairIds[pair.pairId]);
    if (alreadyInvited) {
      setInvitedPairIds((prev) => {
        const next = { ...prev };
        delete next[pair.pairId];
        return next;
      });
      setInviteNotice(null);
      return;
    }

    setInvitedPairIds((prev) => ({
      ...prev,
      [pair.pairId]: new Date().toISOString(),
    }));
    setInviteNotice(
      `Deep Work buddy invite queued for ${pair.studentA.studentName} & ${pair.studentB.studentName} (${pair.courseTitle}).`
    );
    window.setTimeout(() => setInviteNotice(null), 5000);
  };

  return (
    <section
      aria-labelledby="focus-buddy-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <Users className="w-3.5 h-3.5" />
            <span>Focus Buddy System</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono normal-case text-stone-500 dark:text-stone-400 font-medium">
              Same-Course Study Hour Pairing
            </span>
          </div>
          <h2
            id="focus-buddy-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Recommended Deep Work Buddy Pairs
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Pairs two students enrolled in the same course with closely matched weekly study hours so they can run synchronized distraction-free Deep Work blocks together.
          </p>
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-2">
            <span>Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[260px]"
            >
              <option value="all">
                All Courses ({buddyData.pairs.length} pairs)
              </option>
              {buddyData.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.pairCount})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {inviteNotice && (
        <div className="p-3.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{inviteNotice}</span>
        </div>
      )}

      {/* Spotlight: Best Match for Active Learner */}
      {buddyData.personalBestPair && selectedCourseId === 'all' && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/45 dark:bg-indigo-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top Same-Course Match For You</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {buddyData.personalBestPair.similarityPercent}% Pace Match
              </span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {buddyData.personalBestPair.studentA.studentName} +{' '}
              {buddyData.personalBestPair.studentB.studentName}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {buddyData.personalBestPair.collaborationReason} · Window:{' '}
              {buddyData.personalBestPair.sharedWindow}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onStartDeepWork && (
              <button
                type="button"
                disabled={isDeepWorkActive}
                onClick={() =>
                  onStartDeepWork(
                    buddyData.personalBestPair?.recommendedSessionMinutes || 50,
                    buddyData.personalBestPair?.courseId
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  Start{' '}
                  {buddyData.personalBestPair.recommendedSessionMinutes}m Paired Block
                </span>
              </button>
            )}
            {onStartStudyRoom && (
              <button
                type="button"
                onClick={() =>
                  onStartStudyRoom(
                    buddyData.personalBestPair!.courseTitle,
                    buddyData.personalBestPair!.courseId
                  )
                }
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Study Room</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Same-Course Student Pairs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visiblePairs.map((pair) => {
          const isInvited = Boolean(invitedPairIds[pair.pairId]);
          return (
            <div
              key={pair.pairId}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between gap-3.5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pair.facultyName}</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mt-0.5">
                      {pair.courseTitle}
                    </h3>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      {pair.similarityPercent}%
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      hour match
                    </div>
                  </div>
                </div>

                {/* Paired Two Students */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[pair.studentA, pair.studentB].map((stu) => (
                    <div
                      key={stu.id}
                      className={`p-2.5 rounded-lg border ${
                        stu.isCurrentUser
                          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                      }`}
                    >
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {stu.studentName}
                        {stu.isCurrentUser ? ' (You)' : ''}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400">
                        <span>{stu.weeklyStudyHours.toFixed(1)}h/wk</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          FI {stu.focusIntensityScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{pair.sharedWindow}</span>
                  </span>
                  <span>
                    Δ {pair.hourDifference.toFixed(1)}h/wk ·{' '}
                    {pair.recommendedSessionMinutes}m block
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleInvite(pair)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isInvited
                      ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50'
                      : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900'
                  }`}
                >
                  {isInvited ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Buddy Invite Sent</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Pair for Deep Work</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {onStartDeepWork && (
                    <button
                      type="button"
                      disabled={isDeepWorkActive}
                      onClick={() =>
                        onStartDeepWork(
                          pair.recommendedSessionMinutes,
                          pair.courseId
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-55"
                    >
                      <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Start {pair.recommendedSessionMinutes}m</span>
                    </button>
                  )}
                  {onStartStudyRoom && (
                    <button
                      type="button"
                      onClick={() =>
                        onStartStudyRoom(pair.courseTitle, pair.courseId)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Video className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Room</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
