import React, { useMemo } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Flag,
} from 'lucide-react';
import { STUDENT_BADGES } from '../data/mockData';
import { getCertificateForStudyGuide } from '../data/certificatesData';
import { ReadingProgress, StudyGuide } from '../types';

interface MilestoneProgressSectionProps {
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onNavigateToCourse?: (guideId: string) => void;
}

interface MilestoneTier {
  id: string;
  thresholdPct: number;
  label: string;
  rewardSummary: string;
  rewardKind: 'badge' | 'certificate' | 'both';
}

const MILESTONE_TIERS: MilestoneTier[] = [
  {
    id: 'tier_25',
    thresholdPct: 25,
    label: 'Foundational Explorer',
    rewardSummary: 'Starter Chapter Milestone',
    rewardKind: 'badge',
  },
  {
    id: 'tier_50',
    thresholdPct: 50,
    label: 'Systems Architect',
    rewardSummary: 'Badge Track Unlocked',
    rewardKind: 'badge',
  },
  {
    id: 'tier_75',
    thresholdPct: 75,
    label: 'Distinction Candidate',
    rewardSummary: 'Certificate Readiness',
    rewardKind: 'certificate',
  },
  {
    id: 'tier_100',
    thresholdPct: 100,
    label: 'Fellowship Scholar',
    rewardSummary: 'Full Curriculum + Certificates',
    rewardKind: 'both',
  },
];

export const MilestoneProgressSection: React.FC<MilestoneProgressSectionProps> = ({
  studyGuides,
  readingProgress,
  onNavigateToCourse,
}) => {
  const telemetry = useMemo(() => {
    let totalChapters = 0;
    let completedChapters = 0;
    const unlockedBadgeIds = new Set<string>();

    const courseMilestones = studyGuides.map((guide) => {
      const chTotal = Math.max(1, guide.chapters?.length || 1);
      const prog = readingProgress[guide.id];
      const validCompleted = (prog?.completedChapters || []).filter(
        (idx) => idx >= 0 && idx < chTotal
      );
      totalChapters += chTotal;
      completedChapters += validCompleted.length;

      (prog?.unlockedBadges || []).forEach((bId) => unlockedBadgeIds.add(bId));

      const pct = Math.min(100, Math.round((validCompleted.length / chTotal) * 100));
      const quizScores = prog?.quizScores
        ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
        : [];
      const bestQuizScore = quizScores.length > 0 ? Math.max(...quizScores) : undefined;
      const minPass = guide.quizzes?.[0]?.minScoreToPass || 70;
      const isCertificateEarned = Boolean(
        prog?.isCompleted || pct >= 100 || (bestQuizScore !== undefined && bestQuizScore >= minPass)
      );
      const certSpec = getCertificateForStudyGuide(guide);

      const guideBadges = (guide.quizzes || [])
        .map((q) => STUDENT_BADGES.find((b) => b.id === q.badgeId))
        .filter((b): b is NonNullable<typeof b> => Boolean(b));

      return {
        guide,
        chTotal,
        completedCount: validCompleted.length,
        pct,
        isCertificateEarned,
        certSpec,
        guideBadges,
      };
    });

    const overallPct =
      totalChapters > 0 ? Math.min(100, Math.round((completedChapters / totalChapters) * 100)) : 0;

    const earnedBadges = STUDENT_BADGES.filter((b) => unlockedBadgeIds.has(b.id));
    const lockedBadges = STUDENT_BADGES.filter((b) => !unlockedBadgeIds.has(b.id));
    const earnedCertificates = courseMilestones.filter(
      (c): c is typeof c & { certSpec: NonNullable<typeof c.certSpec> } =>
        c.isCertificateEarned && c.certSpec !== null
    );
    const nextCertificateTrack =
      courseMilestones
        .filter((c) => !c.isCertificateEarned && c.certSpec !== null)
        .sort((a, b) => b.pct - a.pct)[0] || null;

    const nextTier =
      MILESTONE_TIERS.find((t) => overallPct < t.thresholdPct) || null;
    const chaptersForNextTier = nextTier
      ? Math.max(1, Math.ceil((nextTier.thresholdPct / 100) * totalChapters) - completedChapters)
      : 0;

    return {
      totalChapters,
      completedChapters,
      overallPct,
      courseMilestones,
      earnedBadges,
      lockedBadges,
      earnedCertificates,
      nextCertificateTrack,
      nextTier,
      chaptersForNextTier,
    };
  }, [studyGuides, readingProgress]);

  return (
    <section
      aria-labelledby="milestone-progress-heading"
      className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-6 shadow-xs"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Milestone Progress · Gamified Chapter Mastery</span>
          </div>
          <h2
            id="milestone-progress-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Study Guide Chapter Milestones &amp; Rewards
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Track overall chapter completion milestones alongside unlocked achievement badges and earned course certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-emerald-800 dark:text-emerald-300">
            {telemetry.completedChapters} / {telemetry.totalChapters} Chapters ({telemetry.overallPct}%)
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 font-mono font-bold text-amber-800 dark:text-amber-300">
            {telemetry.earnedBadges.length} Badges · {telemetry.earnedCertificates.length} Certificates
          </div>
        </div>
      </div>

      {/* Gamified Milestone Bar */}
      <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-gradient-to-br from-stone-50 via-white to-emerald-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-emerald-950/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Curriculum Completion Track</span>
          </span>
          {telemetry.nextTier ? (
            <span className="text-stone-600 dark:text-stone-300 font-medium">
              Complete{' '}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                {telemetry.chaptersForNextTier} more{' '}
                {telemetry.chaptersForNextTier === 1 ? 'chapter' : 'chapters'}
              </strong>{' '}
              to unlock <span className="font-semibold">{telemetry.nextTier.label}</span> ({telemetry.nextTier.thresholdPct}%)
            </span>
          ) : (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              All curriculum milestones unlocked!
            </span>
          )}
        </div>

        {/* Gamified Track with Checkpoints */}
        <div className="relative pt-2 pb-1">
          <div className="h-4 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden p-0.5 border border-stone-300/60 dark:border-stone-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-lime-500 transition-all duration-500 relative"
              style={{ width: `${Math.max(4, telemetry.overallPct)}%` }}
            >
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/90" />
            </div>
          </div>

          {/* 4 Milestone Checkpoint Markers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {MILESTONE_TIERS.map((tier) => {
              const isReached = telemetry.overallPct >= tier.thresholdPct;
              const requiredChapters = Math.ceil(
                (tier.thresholdPct / 100) * telemetry.totalChapters
              );

              return (
                <div
                  key={tier.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isReached
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40'
                      : 'border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/70 opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[11px] font-mono font-extrabold ${
                        isReached
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {tier.thresholdPct}% ({requiredChapters} ch)
                    </span>
                    {isReached ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {tier.label}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {tier.rewardSummary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Highlighted Unlocked Badges & Earned Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unlocked Badges Highlight Panel */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Unlocked Achievement Badges ({telemetry.earnedBadges.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              {telemetry.lockedBadges.length} Remaining
            </span>
          </div>

          {telemetry.earnedBadges.length > 0 ? (
            <div className="space-y-2">
              {telemetry.earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {badge.image_url ? (
                      <img
                        src={badge.image_url}
                        alt={badge.title}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-amber-300/60 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {badge.title}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {badge.rarity} Tier · {badge.description}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    Unlocked
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 dark:text-stone-400 italic py-2">
              Complete chapters and pass a module assessment to highlight your first unlocked crest here.
            </p>
          )}
        </div>

        {/* Earned Certificates & Next Certificate Highlight Panel */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Course Certificates ({telemetry.earnedCertificates.length} Earned)</span>
            </h3>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              {telemetry.courseMilestones.length} Total Tracks
            </span>
          </div>

          {telemetry.earnedCertificates.length > 0 ? (
            <div className="space-y-2">
              {telemetry.earnedCertificates.map(({ guide, certSpec, pct }) => (
                <div
                  key={guide.id}
                  className="p-2.5 rounded-xl bg-[#052e16]/5 dark:bg-[#052e16]/60 border border-[#84cc16]/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-[#bef264] truncate">
                      {certSpec.credentialTitle}
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 truncate">
                      {guide.title} · {pct}% chapters
                    </p>
                  </div>
                  {onNavigateToCourse && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCourse(guide.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#052e16] text-[#bef264] text-[10px] font-bold border border-[#84cc16]/60 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : telemetry.nextCertificateTrack ? (
            <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Closest to Certificate: {telemetry.nextCertificateTrack.guide.title}</span>
                </span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {telemetry.nextCertificateTrack.pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${telemetry.nextCertificateTrack.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span>
                  {telemetry.nextCertificateTrack.completedCount}/
                  {telemetry.nextCertificateTrack.chTotal} chapters completed · Finish chapters or pass quiz to earn certificate
                </span>
                {onNavigateToCourse && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToCourse(telemetry.nextCertificateTrack!.guide.id)
                    }
                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Per-Study-Guide Chapter Milestone Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
        {telemetry.courseMilestones.map(({ guide, completedCount, chTotal, pct, isCertificateEarned, guideBadges }) => (
          <div
            key={guide.id}
            className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                {guide.title}
              </span>
              <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300 shrink-0">
                {completedCount}/{chTotal} ch
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  pct >= 100
                    ? 'bg-emerald-500'
                    : pct >= 50
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className={isCertificateEarned ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-stone-500 dark:text-stone-400'}>
                {isCertificateEarned
                  ? 'Certificate Earned'
                  : guideBadges[0]
                  ? `Badge: ${guideBadges[0].title}`
                  : 'In Progress'}
              </span>
              {onNavigateToCourse && (
                <button
                  type="button"
                  onClick={() => onNavigateToCourse(guide.id)}
                  className="text-stone-700 dark:text-stone-300 hover:underline font-semibold cursor-pointer"
                >
                  Open
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
