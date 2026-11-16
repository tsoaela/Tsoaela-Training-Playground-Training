import React, { useMemo, useState } from 'react';
import {
  Award,
  Layers,
  Zap,
  Cpu,
  Shield,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Share2,
  Users,
} from 'lucide-react';
import { STUDENT_BADGES } from '../data/mockData';
import { EnrolledStudentRecord, ReadingProgress, StudentBadge, StudyGuide } from '../types';
import { ShareAchievementModal } from './ShareAchievementModal';

interface AchievementBadgesSectionProps {
  readingProgress: Record<string, ReadingProgress>;
  studyGuides: StudyGuide[];
  onNavigateToCourse?: (guideId: string) => void;
  userName?: string;
  userEmail?: string;
  enrollments?: EnrolledStudentRecord[];
  onOpenFacultyPortal?: () => void;
}

const BADGE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  Zap,
  Cpu,
  Shield,
  Users,
};

export const AchievementBadgesSection: React.FC<AchievementBadgesSectionProps> = ({
  readingProgress,
  studyGuides,
  onNavigateToCourse,
  userName,
  userEmail,
  enrollments = [],
  onOpenFacultyPortal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);
  const [sharingBadge, setSharingBadge] = useState<{ badge: StudentBadge; earnedDate: string | null } | null>(null);

  const completedCourseCount = useMemo(() => {
    const completedIds = new Set<string>();
    studyGuides.forEach((guide) => {
      const p = readingProgress[guide.id];
      if (p?.isCompleted || (p?.progressPercent ?? 0) >= 100) {
        completedIds.add(guide.id);
      }
    });
    Object.entries(readingProgress).forEach(([id, p]) => {
      if (p?.isCompleted || (p?.progressPercent ?? 0) >= 100) {
        completedIds.add(id);
      }
    });
    return completedIds.size;
  }, [readingProgress, studyGuides]);

  const mentorPeerReviewTelemetry = useMemo(() => {
    const targetEmail = (userEmail || '').trim().toLowerCase();
    const targetName = (userName || '').trim().toLowerCase();
    let count = 0;
    let latestDate: string | null = null;

    enrollments.forEach((rec) => {
      (rec.peerReviews || []).forEach((review) => {
        const hasConstructiveCritique = (review.critique || '').trim().length > 0;
        if (!hasConstructiveCritique) return;
        const emailMatches = targetEmail && (review.reviewerEmail || '').trim().toLowerCase() === targetEmail;
        const nameMatches = targetName && (review.reviewerName || '').trim().toLowerCase() === targetName;
        if (emailMatches || nameMatches) {
          count += 1;
          const dateStr = (review.createdAt || '').slice(0, 10);
          if (dateStr && (!latestDate || dateStr > latestDate)) {
            latestDate = dateStr;
          }
        }
      });
    });

    return {
      count,
      requiredThreshold: 11, // Strictly more than 10 constructive peer reviews (> 10)
      isQualified: count > 10,
      latestDate,
    };
  }, [enrollments, userEmail, userName]);

  const badgeTelemetry = useMemo(() => {
    const unlockedSet = new Set<string>();
    const unlockedDateByBadge: Record<string, string> = {};

    Object.values(readingProgress).forEach((progress) => {
      (progress.unlockedBadges || []).forEach((badgeId) => {
        unlockedSet.add(badgeId);
        if (!unlockedDateByBadge[badgeId] && progress.lastReadDate) {
          unlockedDateByBadge[badgeId] = progress.lastReadDate;
        }
      });
    });

    if (mentorPeerReviewTelemetry.isQualified) {
      unlockedSet.add('badge_community_mentor');
      if (!unlockedDateByBadge['badge_community_mentor'] && mentorPeerReviewTelemetry.latestDate) {
        unlockedDateByBadge['badge_community_mentor'] = mentorPeerReviewTelemetry.latestDate;
      }
    }

    const sourceCourseByBadge: Record<string, StudyGuide> = {};
    studyGuides.forEach((guide) => {
      guide.quizzes?.forEach((quiz) => {
        if (quiz.badgeId && !sourceCourseByBadge[quiz.badgeId]) {
          sourceCourseByBadge[quiz.badgeId] = guide;
        }
      });
    });

    const items = STUDENT_BADGES.map((badge) => ({
      badge,
      isUnlocked: unlockedSet.has(badge.id),
      earnedDate: unlockedDateByBadge[badge.id] || null,
      sourceGuide: sourceCourseByBadge[badge.id] || null,
    }));

    return {
      items,
      unlockedCount: items.filter((item) => item.isUnlocked).length,
      totalCount: items.length,
    };
  }, [readingProgress, studyGuides, mentorPeerReviewTelemetry]);

  const filteredItems = useMemo(() => {
    if (filterMode === 'unlocked') return badgeTelemetry.items.filter((i) => i.isUnlocked);
    if (filterMode === 'locked') return badgeTelemetry.items.filter((i) => !i.isUnlocked);
    return badgeTelemetry.items;
  }, [badgeTelemetry, filterMode]);

  const selectedBadgeEntry = useMemo(() => {
    if (!selectedBadge) return null;
    return badgeTelemetry.items.find((i) => i.badge.id === selectedBadge.id) || null;
  }, [selectedBadge, badgeTelemetry]);

  return (
    <section className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Reading Progress Credentials</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300 font-semibold">
              {badgeTelemetry.unlockedCount} of {badgeTelemetry.totalCount} Earned
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {userName ? `${userName}'s Achievement Badges` : 'Unlocked Achievement Badges'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
            Verified crests awarded dynamically as you master study guide curricula and pass module assessments.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs shrink-0">
          {[
            { id: 'all', label: `All (${badgeTelemetry.totalCount})` },
            { id: 'unlocked', label: `Unlocked (${badgeTelemetry.unlockedCount})` },
            { id: 'locked', label: `To Earn (${badgeTelemetry.totalCount - badgeTelemetry.unlockedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as 'all' | 'unlocked' | 'locked')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Award className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            No achievement badges match this filter yet.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Complete quality-verified study guide assessments in Educare to unlock custom crests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {filteredItems.map(({ badge, isUnlocked, earnedDate, sourceGuide }) => {
            const FallbackIcon = BADGE_ICON_MAP[badge.icon_name] || Award;
            const showFallback = !badge.image_url || failedImages[badge.id];
            const isMentorBadge = badge.id === 'badge_community_mentor';
            const mentorPct = Math.min(
              100,
              Math.round((mentorPeerReviewTelemetry.count / mentorPeerReviewTelemetry.requiredThreshold) * 100)
            );

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBadge(badge);
                  }
                }}
                className={`group rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isUnlocked
                    ? 'border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-950/60 hover:border-amber-400 dark:hover:border-amber-600'
                    : 'border-stone-200/70 dark:border-stone-800/80 bg-stone-50/30 dark:bg-stone-950/30 opacity-85 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-900 border border-stone-200 dark:border-stone-800 mb-4">
                    {!showFallback ? (
                      <img
                        src={badge.image_url}
                        alt={`${badge.title} achievement badge crest`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [badge.id]: true }))
                        }
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isUnlocked ? '' : 'grayscale contrast-75 opacity-60'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-4 text-center">
                        <FallbackIcon className="w-10 h-10 text-amber-400 mb-2" />
                        <span className="text-xs font-semibold text-stone-200">{badge.title}</span>
                      </div>
                    )}

                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-stone-950/35 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-stone-950/85 border border-stone-700 text-stone-200 flex items-center justify-center shadow-md">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                    <span className={isUnlocked ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'font-medium'}>
                      {badge.rarity} Tier
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={isUnlocked ? 'text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1' : ''}>
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Earned
                        </>
                      ) : (
                        'Locked'
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>

                  {isMentorBadge && (
                    <div className="mt-2.5 pt-2.5 border-t border-stone-200/70 dark:border-stone-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-mono tabular-nums">
                        <span>Mentor Criteria (&gt;10 Reviews)</span>
                        <span className="font-bold">
                          {mentorPeerReviewTelemetry.count}/{mentorPeerReviewTelemetry.requiredThreshold}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isUnlocked ? 'bg-[#84cc16]' : 'bg-amber-500'
                          }`}
                          style={{ width: `${mentorPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                  {isUnlocked ? (
                    <>
                      <span className="text-stone-500 dark:text-stone-400 font-mono tabular-nums truncate">
                        Unlocked {earnedDate || 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingBadge({ badge, earnedDate });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Share2 className="w-3 h-3 text-[#a3e635]" />
                        <span>Share Achievement</span>
                      </button>
                    </>
                  ) : isMentorBadge && onOpenFacultyPortal ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFacultyPortal();
                      }}
                      className="text-[#65a30d] dark:text-[#a3e635] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Review in Faculty Portal</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ) : sourceGuide && onNavigateToCourse ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCourse(sourceGuide.id);
                      }}
                      className="text-amber-700 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Start Qualifying Module</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-stone-400">
                      {isMentorBadge
                        ? 'Submit > 10 constructive peer reviews'
                        : 'Pass module quiz to unlock'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBadgeEntry && (
        <div className="border-t border-stone-200 dark:border-stone-800 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
              <span>Selected Credential</span>
              <span aria-hidden="true">·</span>
              <span>{selectedBadgeEntry.badge.rarity}</span>
              {selectedBadgeEntry.sourceGuide && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{selectedBadgeEntry.sourceGuide.title}</span>
                </>
              )}
            </div>
            <p className="font-semibold text-stone-900 dark:text-stone-100">
              {selectedBadgeEntry.badge.title}: {selectedBadgeEntry.badge.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setSharingBadge({
                  badge: selectedBadgeEntry.badge,
                  earnedDate: selectedBadgeEntry.earnedDate,
                })
              }
              className="px-4 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Share Achievement</span>
            </button>
            {selectedBadgeEntry.sourceGuide && onNavigateToCourse && (
              <button
                type="button"
                onClick={() => onNavigateToCourse(selectedBadgeEntry.sourceGuide!.id)}
                className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Open Course Module
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Shareable Social Card Image Modal */}
      <ShareAchievementModal
        isOpen={Boolean(sharingBadge)}
        onClose={() => setSharingBadge(null)}
        badge={sharingBadge?.badge || null}
        userName={userName || 'Academic Scholar'}
        completedCourseCount={completedCourseCount}
        unlockedBadgeCount={badgeTelemetry.unlockedCount}
        earnedDate={sharingBadge?.earnedDate || null}
      />
    </section>
  );
};
