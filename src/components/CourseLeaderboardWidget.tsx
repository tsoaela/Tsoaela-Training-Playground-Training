import React, { useMemo } from 'react';
import { Trophy, Lock, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
import {
  StudyGuide,
  EnrolledStudentRecord,
  UserProfile,
  ReadingProgress,
} from '../types';

interface CourseLeaderboardWidgetProps {
  studyGuide: StudyGuide;
  enrollments: EnrolledStudentRecord[];
  user: UserProfile;
  isAuthenticated: boolean;
  readingProgress: Record<string, ReadingProgress>;
  onRequireAuth?: (action: () => void, message: string) => void;
  onEnrollInCourse?: (guide: StudyGuide) => void;
  compact?: boolean;
}

export const CourseLeaderboardWidget: React.FC<CourseLeaderboardWidgetProps> = ({
  studyGuide,
  enrollments,
  user,
  isAuthenticated,
  readingProgress,
  onRequireAuth,
  onEnrollInCourse,
  compact = false,
}) => {
  const userEmailLower = user.email.trim().toLowerCase();

  const isEnrolledInCourse = useMemo(() => {
    if (!isAuthenticated) return false;
    return enrollments.some(
      (e) =>
        e.courseId === studyGuide.id &&
        (e.studentEmail.trim().toLowerCase() === userEmailLower ||
          e.studentName.trim().toLowerCase() === user.name.trim().toLowerCase())
    );
  }, [isAuthenticated, enrollments, studyGuide.id, userEmailLower, user.name]);

  // Extract highest live quiz score for the active user in this study guide
  const activeUserLiveQuizScore = useMemo(() => {
    const scoresObj = readingProgress[studyGuide.id]?.quizScores;
    if (!scoresObj) return undefined;
    const vals = Object.values(scoresObj).filter((v): v is number => typeof v === 'number');
    return vals.length > 0 ? Math.max(...vals) : undefined;
  }, [readingProgress, studyGuide.id]);

  // Rank all students enrolled in this course by quiz score, then progressPercent
  const rankedStudents = useMemo(() => {
    const courseRows = enrollments.filter((e) => e.courseId === studyGuide.id);

    const normalized = courseRows.map((rec) => {
      const isCurrentUser =
        rec.studentEmail.trim().toLowerCase() === userEmailLower ||
        rec.studentName.trim().toLowerCase() === user.name.trim().toLowerCase();

      const liveScore =
        isCurrentUser && activeUserLiveQuizScore !== undefined
          ? Math.max(rec.testScore ?? 0, activeUserLiveQuizScore)
          : rec.testScore ?? Math.min(100, Math.round(60 + rec.progressPercent * 0.35));

      return {
        ...rec,
        quizScore: liveScore,
        isCurrentUser,
      };
    });

    return normalized.sort((a, b) => {
      if (b.quizScore !== a.quizScore) return b.quizScore - a.quizScore;
      return b.progressPercent - a.progressPercent;
    });
  }, [enrollments, studyGuide.id, userEmailLower, user.name, activeUserLiveQuizScore]);

  const topFive = useMemo(() => rankedStudents.slice(0, 5), [rankedStudents]);

  const currentUserRankIndex = useMemo(
    () => rankedStudents.findIndex((r) => r.isCurrentUser),
    [rankedStudents]
  );

  const handleActionClick = () => {
    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth(() => {
          if (onEnrollInCourse) {
            onEnrollInCourse(studyGuide);
          }
        }, `Sign in to verify your enrollment and unlock the Top 5 Course Leaderboard for "${studyGuide.title}".`);
      }
      return;
    }

    if (onEnrollInCourse) {
      onEnrollInCourse(studyGuide);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      } space-y-4`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
              Course Leaderboard
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
            {studyGuide.title} · Top 5 by Quiz Score
          </p>
        </div>

        <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0 flex items-center gap-1.5">
          {isEnrolledInCourse ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Enrolled Access Verified
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Enrolled Students Only</span>
            </>
          )}
        </div>
      </div>

      {/* Enrollment Gate vs Top 5 Leaderboard */}
      {!isEnrolledInCourse ? (
        <div className="py-5 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-950/60 text-center space-y-3">
          <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center mx-auto">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              {isAuthenticated
                ? 'Enrollment Required for This Course Leaderboard'
                : 'Student Authentication & Course Enrollment Required'}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {isAuthenticated
                ? `Only students enrolled in "${studyGuide.title}" can view cohort quiz rankings (${rankedStudents.length} active scholars). Enroll to benchmark your quiz score.`
                : `Sign in and enroll in "${studyGuide.title}" to view the Top 5 students ranked by verified quiz scores.`}
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleActionClick}
              className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAuthenticated ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll in Course to Unlock Leaderboard</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Verify Enrollment</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : topFive.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
          No quiz scores have been recorded for this course yet. Complete a module quiz to claim Rank #1.
        </div>
      ) : (
        <div className="space-y-2">
          {topFive.map((entry, idx) => {
            const rankNum = idx + 1;
            const rankDisplay = String(rankNum).padStart(2, '0');
            return (
              <div
                key={entry.id}
                className={`px-3 py-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  entry.isCurrentUser
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/35'
                    : 'border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-xs font-mono tabular-nums font-bold shrink-0 ${
                      rankNum === 1
                        ? 'text-amber-600 dark:text-amber-400'
                        : rankNum <= 3
                        ? 'text-stone-800 dark:text-stone-200'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    #{rankDisplay}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {entry.studentName}
                      {entry.isCurrentUser && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {' '}· You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      <span>{entry.qualificationLevel}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">{entry.progressPercent}% syllabus</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-20 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        rankNum === 1
                          ? 'bg-amber-500'
                          : entry.isCurrentUser
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, entry.quizScore)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100 w-10 text-right">
                    {entry.quizScore}%
                  </span>
                </div>
              </div>
            );
          })}

          {currentUserRankIndex >= 5 && (
            <div className="pt-2 mt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/25">
              <span className="text-stone-700 dark:text-stone-300 font-medium">
                Your Rank: <span className="font-mono tabular-nums font-bold">#{currentUserRankIndex + 1}</span> of {rankedStudents.length} enrolled
              </span>
              <span className="font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400">
                {rankedStudents[currentUserRankIndex].quizScore}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
