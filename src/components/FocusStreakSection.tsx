import React from 'react';
import {
  Award,
  CheckCircle2,
  Flame,
  Lock,
  Play,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  FocusStreakMetrics,
  FocusStreakTierId,
} from '../utils/focusStreakSystem';

const TIER_VISUALS: Record<
  Exclude<FocusStreakTierId, 'None'>,
  {
    rim: string;
    primary: string;
    secondary: string;
    core: string;
    labelText: string;
    textAccent: string;
    cardActiveClass: string;
  }
> = {
  Bronze: {
    rim: '#fcd34d',
    primary: '#d97706',
    secondary: '#92400e',
    core: '#451a03',
    labelText: 'BRZ',
    textAccent: 'text-amber-700 dark:text-amber-400',
    cardActiveClass:
      'border-amber-300 dark:border-amber-700/70 bg-amber-50/45 dark:bg-amber-950/25',
  },
  Silver: {
    rim: '#e2e8f0',
    primary: '#64748b',
    secondary: '#334155',
    core: '#0f172a',
    labelText: 'SLV',
    textAccent: 'text-slate-700 dark:text-slate-300',
    cardActiveClass:
      'border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/60',
  },
  Gold: {
    rim: '#fef08a',
    primary: '#eab308',
    secondary: '#a16207',
    core: '#422006',
    labelText: 'GLD',
    textAccent: 'text-yellow-700 dark:text-yellow-300',
    cardActiveClass:
      'border-yellow-300 dark:border-yellow-700/70 bg-yellow-50/50 dark:bg-yellow-950/25',
  },
  Platinum: {
    rim: '#a7f3d0',
    primary: '#10b981',
    secondary: '#047857',
    core: '#022c22',
    labelText: 'PLT',
    textAccent: 'text-emerald-700 dark:text-emerald-300',
    cardActiveClass:
      'border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/50 dark:bg-emerald-950/25',
  },
};

export const FocusStreakBadgeCrest: React.FC<{
  tier: Exclude<FocusStreakTierId, 'None'>;
  unlocked: boolean;
  size?: number;
  requiredDays?: number;
}> = ({ tier, unlocked, size = 48, requiredDays }) => {
  const v = TIER_VISUALS[tier];
  const gradId = `fs_crest_${tier}_${unlocked ? 'on' : 'off'}_${size}`;
  const daysText = requiredDays ? `${requiredDays}d` : v.labelText;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${unlocked ? '' : 'opacity-40 grayscale'}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={v.rim} />
          <stop offset="52%" stopColor={v.primary} />
          <stop offset="100%" stopColor={v.secondary} />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L55 13 V31 C55 46 44.5 55.8 32 60 C19.5 55.8 9 46 9 31 V13 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M32 9.5 L50 16.8 V31 C50 42.8 41.8 50.6 32 54.4 C22.2 50.6 14 42.8 14 31 V16.8 Z"
        fill={v.core}
        stroke={v.rim}
        strokeWidth="1.5"
      />
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fill={v.rim}
        fontSize="13"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {daysText}
      </text>
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="7"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {tier.slice(0, 4).toUpperCase()}
      </text>
    </svg>
  );
};

export const ProfileFocusStreakBadges: React.FC<{
  focusStreak: FocusStreakMetrics;
}> = ({ focusStreak }) => {
  const activeTier = focusStreak.currentTier;

  return (
    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {activeTier !== 'None' ? (
          <FocusStreakBadgeCrest
            tier={activeTier}
            unlocked
            size={42}
            requiredDays={focusStreak.currentStreakDays}
          />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {activeTier !== 'None'
                ? `${activeTier} Focus Streak Badge`
                : 'Focus Streak Building'}
            </span>
            <span aria-hidden="true" className="text-stone-400">
              ·
            </span>
            <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
              {focusStreak.currentStreakDays}d active streak
            </span>
            <span aria-hidden="true" className="text-stone-400">
              ·
            </span>
            <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
              Best {focusStreak.bestStreakDays}d
            </span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            {focusStreak.nextTier
              ? `${focusStreak.daysToNextTier} more consecutive goal day${
                  focusStreak.daysToNextTier === 1 ? '' : 's'
                } to unlock ${focusStreak.nextTier.id} (${focusStreak.nextTier.requiredDays}d)`
              : 'All escalating Focus Streak tiers unlocked on your scholar profile.'}
          </p>
        </div>
      </div>

      {/* Escalating Tier Badge Row displayed directly on Profile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {focusStreak.tiers.map((tier) => {
          const v = TIER_VISUALS[tier.id];
          return (
            <div
              key={tier.id}
              className={`px-2.5 py-2 rounded-xl border flex items-center gap-2 transition-colors ${
                tier.unlocked
                  ? v.cardActiveClass
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 opacity-75'
              }`}
              title={tier.description}
            >
              <FocusStreakBadgeCrest
                tier={tier.id}
                unlocked={tier.unlocked}
                size={28}
                requiredDays={tier.requiredDays}
              />
              <div className="min-w-0">
                <div
                  className={`text-[11px] font-bold leading-tight truncate ${
                    tier.unlocked
                      ? v.textAccent
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {tier.id}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  {tier.unlocked ? (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Earned</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-2.5 h-2.5 shrink-0" />
                      <span>{tier.requiredDays}d</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface FocusStreakSectionProps {
  metrics: FocusStreakMetrics;
  dailyGoalHours: number;
  isDeepWorkActive?: boolean;
  onStartDeepWork?: (minutes?: number) => void;
}

export const FocusStreakSection: React.FC<FocusStreakSectionProps> = ({
  metrics,
  dailyGoalHours,
  isDeepWorkActive = false,
  onStartDeepWork,
}) => {
  return (
    <section
      aria-labelledby="focus-streak-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Focus Streak System</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums normal-case text-stone-600 dark:text-stone-400 font-medium">
              Daily Goal: {dailyGoalHours.toFixed(1)}h ({metrics.goalMinutes}m)
            </span>
          </div>
          <h2
            id="focus-streak-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Consecutive Daily Goal Streak &amp; Escalating Tier Badges
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Meet your Daily Study Hour Goal consecutively to advance across Bronze (3d), Silver (7d), Gold (14d), and Platinum (30d) badges showcased on your scholar profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="text-right font-mono tabular-nums">
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Current Focus Streak
            </div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center justify-end gap-1.5">
              <Flame className="w-5 h-5 text-amber-500" />
              <span>{metrics.currentStreakDays}</span>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                day{metrics.currentStreakDays === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {onStartDeepWork && (
            <button
              type="button"
              onClick={() => onStartDeepWork(50)}
              disabled={isDeepWorkActive}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isDeepWorkActive ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Focus Running</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Log Focus Block</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Today's Goal Lock Status + 14-Day Streak History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {metrics.isGoalMetToday
                    ? 'Today’s Goal Secured'
                    : 'Today’s Goal In Progress'}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {metrics.isGoalMetToday
                  ? `You logged ${metrics.todayMinutesLogged}m today, locking in day #${metrics.currentStreakDays}.`
                  : `Log ${metrics.remainingMinutesToday}m more today (${metrics.todayMinutesLogged}/${metrics.goalMinutes}m) to extend your streak to ${
                      metrics.currentStreakDays + 1
                    } days.`}
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
              {Math.min(
                100,
                Math.round(
                  (metrics.todayMinutesLogged / Math.max(1, metrics.goalMinutes)) *
                    100
                )
              )}
              %
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.isGoalMetToday ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (metrics.todayMinutesLogged /
                        Math.max(1, metrics.goalMinutes)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
              <span>Active Tier: {metrics.currentTierTitle}</span>
              <span>Best Run: {metrics.bestStreakDays}d</span>
            </div>
          </div>
        </div>

        {/* 14-Day Daily Goal Attainment Matrix */}
        <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-stone-900 dark:text-stone-100">
              14-Day Daily Study Goal Ledger
            </span>
            <span className="font-mono tabular-nums text-[11px] text-stone-500 dark:text-stone-400">
              {metrics.totalGoalMetDays} total goal-met days
            </span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
            {metrics.recentDays.map((day) => (
              <div
                key={day.dateKey}
                title={`${day.weekday}, ${day.shortDate}: ${day.minutesLogged}m / ${day.goalMinutes}m (${
                  day.goalMet ? 'Goal Met' : 'Not Met'
                })`}
                className={`rounded-lg border p-1.5 text-center transition-colors ${
                  day.goalMet
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : day.isToday
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500'
                }`}
              >
                <div className="text-[9px] font-mono uppercase">
                  {day.weekday.slice(0, 2)}
                </div>
                <div className="mt-1 flex items-center justify-center">
                  {day.goalMet ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : day.isToday ? (
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700 block my-0.5" />
                  )}
                </div>
                <div className="mt-0.5 text-[9px] font-mono tabular-nums">
                  {day.shortDate.split(' ')[1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Escalating Tier Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.tiers.map((tier) => {
          const v = TIER_VISUALS[tier.id];
          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                tier.unlocked
                  ? v.cardActiveClass
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <FocusStreakBadgeCrest
                  tier={tier.id}
                  unlocked={tier.unlocked}
                  size={44}
                  requiredDays={tier.requiredDays}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    <span className={`font-bold uppercase ${v.textAccent}`}>
                      {tier.id} Tier
                    </span>
                    <span className="tabular-nums font-semibold">
                      {tier.unlocked ? (
                        <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>On Profile</span>
                        </span>
                      ) : (
                        <span className="text-stone-500 dark:text-stone-400">
                          {tier.daysRemaining}d left
                        </span>
                      )}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {tier.title}
                  </h3>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    {tier.description}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                  <span>{tier.requiredDays}-day goal target</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {tier.unlocked ? '100%' : `${tier.progressPercent}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      tier.unlocked ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${tier.unlocked ? 100 : tier.progressPercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
