import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Play,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { DeepWorkState } from '../types';
import {
  computeWeeklyFocusChallengeMetrics,
  WeeklyChallengeMilestone,
} from '../utils/deepWorkAnalytics';

interface WeeklyFocusChallengeProps {
  deepWorkState?: DeepWorkState;
  learnerName: string;
  isDeepWorkActive?: boolean;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
}

const WEEKLY_CHALLENGE_BADGES_KEY = 'ttg_weekly_focus_badges_v1';

interface EarnedWeeklyBadgeRecord {
  milestoneId: string;
  weekKey: string;
  unlockedAt: string;
  badgeTitle: string;
  targetHours: number;
}

const TIER_PALETTES: Record<
  WeeklyChallengeMilestone['tier'],
  {
    primary: string;
    secondary: string;
    rim: string;
    core: string;
    textAccent: string;
  }
> = {
  Bronze: {
    primary: '#d97706',
    secondary: '#92400e',
    rim: '#fcd34d',
    core: '#451a03',
    textAccent: 'text-amber-700 dark:text-amber-400',
  },
  Silver: {
    primary: '#64748b',
    secondary: '#334155',
    rim: '#e2e8f0',
    core: '#0f172a',
    textAccent: 'text-slate-700 dark:text-slate-300',
  },
  Gold: {
    primary: '#84cc16',
    secondary: '#ca8a04',
    rim: '#fef08a',
    core: '#022c22',
    textAccent: 'text-emerald-700 dark:text-[#bef264]',
  },
  Obsidian: {
    primary: '#10b981',
    secondary: '#065f46',
    rim: '#a7f3d0',
    core: '#052e16',
    textAccent: 'text-emerald-700 dark:text-emerald-300',
  },
};

const ChallengeBadgeCrestSvg: React.FC<{
  milestone: WeeklyChallengeMilestone;
}> = ({ milestone }) => {
  const palette = TIER_PALETTES[milestone.tier];
  const gradId = `wfc_grad_${milestone.id}_${milestone.unlocked ? 'on' : 'off'}`;
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${milestone.unlocked ? '' : 'opacity-45 grayscale'}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.rim} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
      </defs>
      {/* Outer Octagonal Medallion */}
      <polygon
        points="32,3 52,11 61,32 52,53 32,61 12,53 3,32 12,11"
        fill={`url(#${gradId})`}
      />
      <polygon
        points="32,8 48,15 55,32 48,49 32,56 16,49 9,32 16,15"
        fill={palette.core}
        stroke={palette.rim}
        strokeWidth="1.5"
      />
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fill={palette.rim}
        fontSize="13"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {milestone.targetHours}h
      </text>
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fill="#ecfccb"
        fontSize="7"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        DEEP
      </text>
    </svg>
  );
};

export const WeeklyFocusChallenge: React.FC<WeeklyFocusChallengeProps> = ({
  deepWorkState,
  learnerName,
  isDeepWorkActive = false,
  onStartDeepWork,
}) => {
  const metrics = useMemo(
    () => computeWeeklyFocusChallengeMetrics({ deepWorkState }),
    [deepWorkState]
  );

  const [earnedBadges, setEarnedBadges] = useState<EarnedWeeklyBadgeRecord[]>(() => {
    try {
      const raw = localStorage.getItem(WEEKLY_CHALLENGE_BADGES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [newlyUnlockedNotice, setNewlyUnlockedNotice] = useState<string | null>(null);

  // Auto-persist newly unlocked digital badges for the current week
  useEffect(() => {
    const unlockedThisWeek = metrics.milestones.filter((m) => m.unlocked);
    if (unlockedThisWeek.length === 0) return;

    setEarnedBadges((prev) => {
      const existingKeys = new Set(prev.map((b) => `${b.weekKey}:${b.milestoneId}`));
      const additions: EarnedWeeklyBadgeRecord[] = [];
      unlockedThisWeek.forEach((m) => {
        const key = `${metrics.weekKey}:${m.id}`;
        if (!existingKeys.has(key)) {
          additions.push({
            milestoneId: m.id,
            weekKey: metrics.weekKey,
            unlockedAt: new Date().toISOString(),
            badgeTitle: m.badgeTitle,
            targetHours: m.targetHours,
          });
        }
      });
      if (additions.length === 0) return prev;
      const merged = [...additions, ...prev].slice(0, 40);
      try {
        localStorage.setItem(WEEKLY_CHALLENGE_BADGES_KEY, JSON.stringify(merged));
      } catch {
        // Ignore storage errors
      }
      const latest = additions[0];
      setNewlyUnlockedNotice(
        `Digital Badge Unlocked: ${latest.badgeTitle} (${latest.targetHours} Hours of Deep Work)`
      );
      window.setTimeout(() => setNewlyUnlockedNotice(null), 5000);
      return merged;
    });
  }, [metrics.milestones, metrics.weekKey]);

  const handleDownloadBadgeCard = (milestone: WeeklyChallengeMilestone) => {
    if (!milestone.unlocked) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = TIER_PALETTES[milestone.tier];
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.55, '#052e16');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    ctx.fillStyle = '#bef264';
    ctx.font = 'bold 22px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('TTG WEEKLY FOCUS CHALLENGE · DIGITAL BADGE REWARD', 74, 96);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px system-ui, -apple-system, sans-serif';
    ctx.fillText(milestone.badgeTitle, 74, 186);

    ctx.fillStyle = palette.rim;
    ctx.font = 'bold 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`${milestone.title.toUpperCase()} (${milestone.tier.toUpperCase()} TIER)`, 74, 244);

    ctx.fillStyle = '#d9f99d';
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Awarded to: ${learnerName || 'Academic Scholar'}`, 74, 340);

    ctx.fillStyle = '#ecfccb';
    ctx.font = '400 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(milestone.rewardNarrative, 74, 398, canvas.width - 148);

    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(
      `WEEK CYCLE: ${metrics.weekRangeLabel} · LOGGED: ${metrics.weeklyHours.toFixed(2)} HRS`,
      74,
      580
    );

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `TTG_Focus_Badge_${milestone.targetHours}h_${metrics.weekKey}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentWeekSavedCount = earnedBadges.filter((b) => b.weekKey === metrics.weekKey).length;

  return (
    <section
      aria-labelledby="weekly-focus-challenge-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>Weekly Focus Challenge</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-stone-500 dark:text-stone-400 normal-case font-medium tabular-nums">
              {metrics.weekRangeLabel} · {metrics.daysRemainingInWeek}d left in cycle
            </span>
          </div>
          <h2
            id="weekly-focus-challenge-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Deep Work Duration Milestones &amp; Digital Badge Rewards
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Accumulate shielded Deep Work hours each Monday–Sunday cycle to unlock exclusive tier badges, anchored around the flagship 10 Hours of Deep Work challenge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="text-right font-mono tabular-nums text-xs">
            <div className="text-stone-500 dark:text-stone-400">This Week Logged</div>
            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {metrics.weeklyHours.toFixed(2)}h / 10.0h
            </div>
          </div>

          {onStartDeepWork && (
            <button
              type="button"
              onClick={() => onStartDeepWork(50)}
              disabled={isDeepWorkActive}
              className="px-4 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isDeepWorkActive ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Deep Work Running</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 50m Deep Work</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {newlyUnlockedNotice && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{newlyUnlockedNotice}</span>
        </div>
      )}

      {/* Primary '10 Hours of Deep Work' Progress Tracker */}
      <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold text-stone-900 dark:text-stone-100">
              Flagship Target: 10 Hours of Deep Work
            </span>
            <span aria-hidden="true" className="text-stone-400">·</span>
            <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
              {metrics.weeklyCompletedBlocks} completed block{metrics.weeklyCompletedBlocks === 1 ? '' : 's'}
              {metrics.weeklyDistractionsBlocked > 0
                ? ` · ${metrics.weeklyDistractionsBlocked} distractions shielded`
                : ''}
            </span>
          </div>

          <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
            {metrics.primaryProgressPercent}% Complete
            {metrics.weeklyMinutes < 600
              ? ` · ${Math.max(0, 600 - metrics.weeklyMinutes)}m to Vanguard Seal`
              : ' · Vanguard Seal Earned'}
          </span>
        </div>

        {/* Stepped Progress Track */}
        <div className="relative h-3 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-400 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round((metrics.weeklyHours / 15) * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
          <span>0h</span>
          <span>2h (Bronze)</span>
          <span>5h (Silver)</span>
          <span className="font-bold text-emerald-700 dark:text-[#bef264]">
            10h (Vanguard Gold)
          </span>
          <span>15h (Grandmaster)</span>
        </div>
      </div>

      {/* 4 Milestone Badge Reward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.milestones.map((milestone) => {
          const palette = TIER_PALETTES[milestone.tier];
          const remainingHrs = (milestone.remainingMinutes / 60).toFixed(1);
          return (
            <div
              key={milestone.id}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3.5 transition-colors ${
                milestone.unlocked
                  ? 'border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <ChallengeBadgeCrestSvg milestone={milestone} />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className={`font-bold uppercase tracking-wider ${palette.textAccent}`}>
                      {milestone.tier} Digital Badge
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                      {milestone.unlocked ? (
                        <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="text-stone-500 dark:text-stone-400 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{remainingHrs}h left</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {milestone.badgeTitle} — {milestone.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {milestone.rewardNarrative}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-stone-500 dark:text-stone-400">
                    {milestone.subtitle}
                  </span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {milestone.progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      milestone.unlocked ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${milestone.progressPercent}%` }}
                  />
                </div>

                {milestone.unlocked && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDownloadBadgeCard(milestone)}
                      className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Digital Badge PNG</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400 pt-1">
        <span>
          {metrics.unlockedCount} of {metrics.milestones.length} badges unlocked this week ·{' '}
          {currentWeekSavedCount} persisted to scholar badge vault
        </span>
        {metrics.nextMilestone && (
          <span>
            Next unlock: {metrics.nextMilestone.badgeTitle} ({(metrics.nextMilestone.remainingMinutes / 60).toFixed(1)}h needed)
          </span>
        )}
      </div>
    </section>
  );
};
