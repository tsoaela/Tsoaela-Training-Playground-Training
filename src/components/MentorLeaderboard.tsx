import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Crown, MessageSquare, Search, ShieldCheck, Star, Users } from 'lucide-react';
import { EnrolledStudentRecord, UserProfile, UserRole } from '../types';

export const COMMUNITY_MENTOR_THRESHOLD = 11; // Strictly > 10 constructive peer reviews

interface MentorLeaderboardProps {
  enrollments: EnrolledStudentRecord[];
  currentUser: UserProfile;
  selectedCourseId?: string;
  onSelectStudentEnrollment?: (enrollmentId: string) => void;
}

export interface MentorLeaderboardEntry {
  key: string;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: UserRole;
  constructiveCount: number;
  uniquePeersCount: number;
  avgRatingGiven: number;
  latestReviewAt: string;
  coursesReviewedCount: number;
  isCommunityMentor: boolean;
  isCurrentUser: boolean;
}

export const MentorLeaderboard: React.FC<MentorLeaderboardProps> = ({
  enrollments,
  currentUser,
  selectedCourseId = 'all',
  onSelectStudentEnrollment,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mentors_only'>('all');
  const [scopeMode, setScopeMode] = useState<'platform' | 'course'>('platform');
  const [searchQuery, setSearchQuery] = useState('');

  const scopedEnrollments = useMemo(() => {
    if (scopeMode === 'course' && selectedCourseId !== 'all') {
      return enrollments.filter((e) => e.courseId === selectedCourseId);
    }
    return enrollments;
  }, [enrollments, scopeMode, selectedCourseId]);

  const rankedContributors = useMemo<MentorLeaderboardEntry[]>(() => {
    const currentEmail = (currentUser.email || '').trim().toLowerCase();
    const currentName = (currentUser.name || '').trim().toLowerCase();

    const map = new Map<
      string,
      {
        reviewerName: string;
        reviewerEmail: string;
        reviewerRole: UserRole;
        constructiveCount: number;
        peerKeys: Set<string>;
        courseIds: Set<string>;
        ratingSum: number;
        latestReviewAt: string;
      }
    >();

    scopedEnrollments.forEach((rec) => {
      (rec.peerReviews || []).forEach((rev) => {
        const critiqueText = (rev.critique || '').trim();
        if (!critiqueText) return;
        // Leaderboard ranks student peer contributors
        if (rev.reviewerRole === 'instructor') return;

        const emailKey = (rev.reviewerEmail || '').trim().toLowerCase();
        const nameKey = (rev.reviewerName || '').trim().toLowerCase();
        const key = emailKey || nameKey;
        if (!key) return;

        const existing = map.get(key) || {
          reviewerName: rev.reviewerName || 'Student Contributor',
          reviewerEmail: rev.reviewerEmail || '',
          reviewerRole: rev.reviewerRole || 'student',
          constructiveCount: 0,
          peerKeys: new Set<string>(),
          courseIds: new Set<string>(),
          ratingSum: 0,
          latestReviewAt: '',
        };

        existing.constructiveCount += 1;
        existing.peerKeys.add((rec.studentEmail || rec.id).toLowerCase());
        existing.courseIds.add(rec.courseId);
        existing.ratingSum += Number(rev.rating) || 5;
        if (!existing.latestReviewAt || rev.createdAt > existing.latestReviewAt) {
          existing.latestReviewAt = rev.createdAt;
        }
        map.set(key, existing);
      });
    });

    return Array.from(map.entries())
      .map(([key, item]) => {
        const isCurrentUser =
          (currentEmail && item.reviewerEmail.trim().toLowerCase() === currentEmail) ||
          (currentName && item.reviewerName.trim().toLowerCase() === currentName);
        return {
          key,
          reviewerName: item.reviewerName,
          reviewerEmail: item.reviewerEmail,
          reviewerRole: item.reviewerRole,
          constructiveCount: item.constructiveCount,
          uniquePeersCount: item.peerKeys.size,
          coursesReviewedCount: item.courseIds.size,
          avgRatingGiven: Number((item.ratingSum / Math.max(1, item.constructiveCount)).toFixed(1)),
          latestReviewAt: item.latestReviewAt,
          isCommunityMentor: item.constructiveCount >= COMMUNITY_MENTOR_THRESHOLD,
          isCurrentUser: Boolean(isCurrentUser),
        };
      })
      .sort((a, b) => {
        if (b.constructiveCount !== a.constructiveCount) {
          return b.constructiveCount - a.constructiveCount;
        }
        if (b.uniquePeersCount !== a.uniquePeersCount) {
          return b.uniquePeersCount - a.uniquePeersCount;
        }
        return b.latestReviewAt.localeCompare(a.latestReviewAt);
      });
  }, [scopedEnrollments, currentUser.email, currentUser.name]);

  const communityMentorsCount = useMemo(
    () => rankedContributors.filter((c) => c.isCommunityMentor).length,
    [rankedContributors]
  );

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedContributors
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
      .filter((entry) => {
        if (filterMode === 'mentors_only' && !entry.isCommunityMentor) return false;
        if (q) {
          return (
            entry.reviewerName.toLowerCase().includes(q) ||
            entry.reviewerEmail.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [rankedContributors, filterMode, searchQuery]);

  const topThree = useMemo(() => rankedContributors.slice(0, 3), [rankedContributors]);

  const findSampleEnrollmentForPeerJump = () => {
    const candidate = enrollments.find(
      (e) =>
        e.studentEmail.toLowerCase() !== currentUser.email.toLowerCase() &&
        e.assignmentStatus !== 'Not Submitted'
    );
    if (candidate && onSelectStudentEnrollment) {
      onSelectStudentEnrollment(candidate.id);
    }
  };

  return (
    <section
      aria-labelledby="mentor-leaderboard-heading"
      className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-6 shadow-xs"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#65a30d] dark:text-[#a3e635]">
              <Award className="w-3.5 h-3.5" />
              <span>Peer Review Standing</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {rankedContributors.length} Active Student Contributors
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-[#052e16] dark:text-[#bef264]">
              {communityMentorsCount} Community Mentor{communityMentorsCount === 1 ? '' : 's'} (11+ Reviews)
            </span>
          </div>
          <h2
            id="mentor-leaderboard-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Mentor Leaderboard
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 max-w-2xl">
            Ranking students by constructive peer review critiques submitted across cohort assignments. Contributors with more than 10 constructive reviews unlock <strong className="text-stone-900 dark:text-stone-100">Community Mentor</strong> status.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              All Contributors ({rankedContributors.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('mentors_only')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                filterMode === 'mentors_only'
                  ? 'bg-[#052e16] text-[#bef264] border border-[#84cc16]/60 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Community Mentors ({communityMentorsCount})</span>
            </button>
          </div>

          {selectedCourseId !== 'all' && (
            <button
              type="button"
              onClick={() => setScopeMode((prev) => (prev === 'platform' ? 'course' : 'platform'))}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {scopeMode === 'platform' ? 'Scope: All Courses' : 'Scope: Selected Course'}
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Contributors Spotlight */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((contributor, idx) => {
            const rankNum = idx + 1;
            const isFirst = rankNum === 1;
            const progressPct = Math.min(
              100,
              Math.round((contributor.constructiveCount / COMMUNITY_MENTOR_THRESHOLD) * 100)
            );
            return (
              <div
                key={contributor.key}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  contributor.isCommunityMentor
                    ? 'border-[#84cc16]/60 bg-gradient-to-br from-[#022c22]/[0.06] to-[#84cc16]/[0.09] dark:from-[#022c22]/70 dark:to-[#052e16]/50'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm shrink-0 ${
                        isFirst
                          ? 'bg-[#052e16] text-[#bef264] border border-[#84cc16]/70'
                          : rankNum === 2
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                      }`}
                    >
                      {isFirst ? <Crown className="w-4 h-4" /> : `#${rankNum}`}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {contributor.reviewerName}
                        {contributor.isCurrentUser ? ' (You)' : ''}
                      </div>
                      <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
                        Top #{rankNum} Contributor · {contributor.uniquePeersCount} Peers Assisted
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-black font-mono tabular-nums text-stone-900 dark:text-stone-100">
                      {contributor.constructiveCount}
                    </div>
                    <div className="text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400">
                      Reviews
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                  <div className="flex items-center justify-between text-[11px]">
                    {contributor.isCommunityMentor ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[#65a30d] dark:text-[#bef264]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Community Mentor Status</span>
                      </span>
                    ) : (
                      <span className="font-medium text-stone-600 dark:text-stone-400">
                        Rising Contributor ({COMMUNITY_MENTOR_THRESHOLD - contributor.constructiveCount} to Mentor)
                      </span>
                    )}
                    <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      ★ {contributor.avgRatingGiven.toFixed(1)} avg
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        contributor.isCommunityMentor ? 'bg-[#84cc16]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student contributor or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {onSelectStudentEnrollment && (
          <button
            type="button"
            onClick={findSampleEnrollmentForPeerJump}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Submit Constructive Critique</span>
          </button>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 text-[10px] font-mono uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student Contributor</th>
                <th className="py-3 px-4 text-right">Constructive Reviews</th>
                <th className="py-3 px-4">Mentor Qualification (11+)</th>
                <th className="py-3 px-4 text-right">Peers Helped</th>
                <th className="py-3 px-4 text-right">Avg Rating</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {visibleEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500 dark:text-stone-400">
                    {filterMode === 'mentors_only'
                      ? 'No contributors match this search under the Community Mentors Only filter.'
                      : 'No constructive peer reviews recorded yet.'}
                  </td>
                </tr>
              ) : (
                visibleEntries.map((entry) => {
                  const pct = Math.min(
                    100,
                    Math.round((entry.constructiveCount / COMMUNITY_MENTOR_THRESHOLD) * 100)
                  );
                  return (
                    <tr
                      key={entry.key}
                      className={`transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/25'
                          : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/35'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                        #{entry.rank}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-stone-900 dark:text-stone-100">
                              {entry.reviewerName}
                              {entry.isCurrentUser && (
                                <span className="ml-1.5 text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                              {entry.reviewerEmail || 'Platform Peer Reviewer'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {entry.constructiveCount}
                      </td>

                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-400 mb-1">
                          <span>
                            {entry.constructiveCount}/{COMMUNITY_MENTOR_THRESHOLD}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              entry.isCommunityMentor ? 'bg-[#84cc16]' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-stone-700 dark:text-stone-300">
                        {entry.uniquePeersCount}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{entry.avgRatingGiven.toFixed(1)}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {entry.isCommunityMentor ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#052e16] text-[#bef264] border border-[#84cc16]/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635]" />
                            <span>Community Mentor</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>Rising Contributor</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
