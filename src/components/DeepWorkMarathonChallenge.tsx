import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Lock,
  Play,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { DeepWorkState } from '../types';
import {
  computeDeepWorkMarathonMetrics,
  MARATHON_BLOCK_MINUTES,
} from '../utils/deepWorkAnalytics';

export interface DeepWorkMarathonChallengeProps {
  deepWorkState?: DeepWorkState;
  learnerName: string;
  isDeepWorkActive?: boolean;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
}

const MARATHON_BADGE_STORAGE_KEY = 'ttg_master_of_focus_badge_v1';

interface MasterOfFocusVaultRecord {
  badgeTitle: 'Master of Focus';
  unlockedAt: string;
  completedMarathonBlocks: number;
  bestSingleBlockMinutes: number;
}

const MasterOfFocusCrestSvg: React.FC<{ unlocked: boolean }> = ({ unlocked }) => (
  <svg
    width="76"
    height="76"
    viewBox="0 0 80 80"
    aria-hidden="true"
    className={`shrink-0 transition-opacity ${unlocked ? 'opacity-100' : 'opacity-65 grayscale'}`}
  >
    <defs>
      <linearGradient id="mof_gold_rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="mof_emerald_core" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
    </defs>
    {/* Dodecagon Sovereign Seal */}
    <polygon
      points="40,3 58,8 72,22 77,40 72,58 58,72 40,77 22,72 8,58 3,40 8,22 22,8"
      fill="url(#mof_gold_rim)"
    />
    <circle
      cx="40"
      cy="40"
      r="31"
      fill="url(#mof_emerald_core)"
      stroke="#fde68a"
      strokeWidth="1.5"
    />
    <circle
      cx="40"
      cy="40"
      r="26"
      fill="none"
      stroke="#fbbf24"
      strokeOpacity="0.45"
      strokeDasharray="3 2"
      strokeWidth="1"
    />
    <text
      x="40"
      y="35"
      textAnchor="middle"
      fill="#fef3c7"
      fontSize="16"
      fontWeight="800"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      3H
    </text>
    <text
      x="40"
      y="49"
      textAnchor="middle"
      fill="#bef264"
      fontSize="7.5"
      fontWeight="700"
      letterSpacing="0.8"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      MASTER
    </text>
    <text
      x="40"
      y="58"
      textAnchor="middle"
      fill="#fde68a"
      fontSize="6"
      fontWeight="700"
      letterSpacing="0.7"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      OF FOCUS
    </text>
  </svg>
);

export const DeepWorkMarathonChallenge: React.FC<DeepWorkMarathonChallengeProps> = ({
  deepWorkState,
  learnerName,
  isDeepWorkActive = false,
  onStartDeepWork,
}) => {
  const metrics = useMemo(
    () => computeDeepWorkMarathonMetrics({ deepWorkState }),
    [deepWorkState]
  );

  const [vaultRecord, setVaultRecord] = useState<MasterOfFocusVaultRecord | null>(() => {
    try {
      const raw = localStorage.getItem(MARATHON_BADGE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as MasterOfFocusVaultRecord;
    } catch {
      return null;
    }
  });

  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  const isUnlocked = metrics.masterOfFocusUnlocked || Boolean(vaultRecord);
  const completedMarathonsDisplay = Math.max(
    metrics.completedMarathonBlocks,
    vaultRecord?.completedMarathonBlocks || 0
  );

  useEffect(() => {
    if (!metrics.masterOfFocusUnlocked) return;
    setVaultRecord((prev) => {
      if (
        prev &&
        prev.completedMarathonBlocks >= metrics.completedMarathonBlocks &&
        prev.bestSingleBlockMinutes >= metrics.bestSingleBlockMinutes
      ) {
        return prev;
      }
      const next: MasterOfFocusVaultRecord = {
        badgeTitle: 'Master of Focus',
        unlockedAt: prev?.unlockedAt || new Date().toISOString(),
        completedMarathonBlocks: Math.max(
          1,
          metrics.completedMarathonBlocks,
          prev?.completedMarathonBlocks || 0
        ),
        bestSingleBlockMinutes: Math.max(
          MARATHON_BLOCK_MINUTES,
          metrics.bestSingleBlockMinutes,
          prev?.bestSingleBlockMinutes || 0
        ),
      };
      try {
        localStorage.setItem(MARATHON_BADGE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      if (!prev) {
        setUnlockNotice(
          'Master of Focus Digital Badge Unlocked — 3-hour Deep Work Marathon block completed.'
        );
        window.setTimeout(() => setUnlockNotice(null), 5500);
      }
      return next;
    });
  }, [
    metrics.masterOfFocusUnlocked,
    metrics.completedMarathonBlocks,
    metrics.bestSingleBlockMinutes,
  ]);

  const handleDownloadMasterBadge = () => {
    if (!isUnlocked) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.55, '#064e3b');
    grad.addColorStop(1, '#1c1917');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, canvas.width - 88, canvas.height - 88);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 22px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('TTG DEEP WORK MARATHON · DIGITAL CREDENTIAL BADGE', 76, 102);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px system-ui, -apple-system, sans-serif';
    ctx.fillText('Master of Focus', 76, 198);

    ctx.fillStyle = '#bef264';
    ctx.font = 'bold 28px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('3-HOUR UNINTERRUPTED DEEP WORK BLOCK DISTINCTION', 76, 254);

    ctx.fillStyle = '#fef3c7';
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Awarded to: ${learnerName || 'Academic Scholar'}`, 76, 344);

    ctx.fillStyle = '#ecfccb';
    ctx.font = '400 23px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `Earned by sustaining a continuous 180-minute shielded study block without interruption.`,
      76,
      402,
      canvas.width - 152
    );

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(
      `3H MARATHONS COMPLETED: ${completedMarathonsDisplay} · BEST BLOCK: ${Math.max(
        MARATHON_BLOCK_MINUTES,
        metrics.bestSingleBlockMinutes
      )} MIN`,
      76,
      580
    );

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'TTG_Master_of_Focus_Badge.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const marathonMilestones = [
    {
      id: 'stage_half',
      title: '90m Endurance Qualifier',
      detail: 'Half-marathon continuous single Deep Work block',
      done: metrics.bestSingleBlockMinutes >= 90 || isUnlocked,
      progress: `${Math.min(90, metrics.bestSingleBlockMinutes)}/90m`,
    },
    {
      id: 'stage_master',
      title: '3-Hour Focus Block · Master of Focus Badge',
      detail: 'Complete one full 180-minute uninterrupted Deep Work session',
      done: isUnlocked,
      progress: `${completedMarathonsDisplay}/1 block`,
    },
    {
      id: 'stage_triple',
      title: 'Triple Marathon Distinction (3 × 3h Blocks)',
      detail: 'Complete three separate 180-minute marathon blocks',
      done: completedMarathonsDisplay >= 3,
      progress: `${Math.min(3, completedMarathonsDisplay)}/3 blocks`,
    },
  ];

  return (
    <section
      aria-labelledby="deep-work-marathon-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>Deep Work Marathon Challenge</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400 font-medium">
              3-Hour Continuous Focus Block (180 min)
            </span>
          </div>
          <h2
            id="deep-work-marathon-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Deep Work Marathon · Master of Focus Award
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Push beyond standard 50-minute sprints by completing an uninterrupted 3-hour (180-minute) shielded Deep Work marathon block to unlock the{' '}
            <strong className="text-stone-800 dark:text-stone-200">Master of Focus</strong> digital badge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="text-right font-mono tabular-nums text-xs">
            <div className="text-stone-500 dark:text-stone-400">Longest Single Block</div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.bestSingleBlockMinutes}m / {MARATHON_BLOCK_MINUTES}m
            </div>
          </div>

          {onStartDeepWork && (
            <button
              type="button"
              onClick={() => onStartDeepWork(MARATHON_BLOCK_MINUTES)}
              disabled={isDeepWorkActive}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {metrics.isLiveMarathonBlock ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3h Marathon Active</span>
                </>
              ) : isDeepWorkActive ? (
                <>
                  <Timer className="w-3.5 h-3.5" />
                  <span>Deep Work Running</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 3-Hour Marathon (180m)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {unlockNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{unlockNotice}</span>
        </div>
      )}

      {/* Main Split: Master of Focus Digital Badge + 3-Hour Progress & Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Master of Focus Digital Badge Showcase */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 flex flex-col justify-between gap-4 ${
            isUnlocked
              ? 'border-amber-400/80 dark:border-amber-600/70 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <MasterOfFocusCrestSvg unlocked={isUnlocked} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  3H MARATHON BADGE
                </span>
                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-stone-500 dark:text-stone-400">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Master of Focus
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {isUnlocked
                  ? `Awarded to ${learnerName || 'Academic Scholar'} for completing ${completedMarathonsDisplay} continuous 3-hour Deep Work marathon block${completedMarathonsDisplay === 1 ? '' : 's'}.`
                  : 'Complete any 180-minute uninterrupted Deep Work session to mint and unlock your downloadable Master of Focus digital badge.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono tabular-nums text-[11px] text-stone-500 dark:text-stone-400">
              {completedMarathonsDisplay} marathon{completedMarathonsDisplay === 1 ? '' : 's'} completed
              {metrics.marathonTotalMinutes > 0
                ? ` · ${(metrics.marathonTotalMinutes / 60).toFixed(1)}h marathon total`
                : ''}
            </span>

            {isUnlocked ? (
              <button
                type="button"
                onClick={handleDownloadMasterBadge}
                className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Badge PNG</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                {Math.max(0, MARATHON_BLOCK_MINUTES - metrics.progressMinutesTowardMarathon)}m needed in one block
              </span>
            )}
          </div>
        </div>

        {/* Right: Single-Block 3-Hour Progress + Endurance Progression Ladder */}
        <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-stone-900 dark:text-stone-100 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  {metrics.isLiveMarathonBlock
                    ? 'Active 3-Hour Marathon Block Progress'
                    : 'Single-Session 3-Hour Endurance Benchmark'}
                </span>
              </span>
              <span className="font-mono tabular-nums font-bold text-stone-800 dark:text-stone-200">
                {metrics.progressMinutesTowardMarathon} / {MARATHON_BLOCK_MINUTES} min ({metrics.progressPercent}%)
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <svg
                width="100%"
                height="10"
                className="block"
                aria-hidden="true"
              >
                <rect
                  x="0"
                  y="0"
                  width={`${isUnlocked ? 100 : metrics.progressPercent}%`}
                  height="10"
                  rx="5"
                  fill={isUnlocked ? '#10b981' : '#d97706'}
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
              <span>0m</span>
              <span>90m (1.5h)</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                180m (3.0h Master of Focus)
              </span>
            </div>
          </div>

          {/* 3-Step Endurance Ladder */}
          <div className="divide-y divide-stone-200/80 dark:divide-stone-800 border-t border-stone-200/80 dark:border-stone-800">
            {marathonMilestones.map((step) => (
              <div
                key={step.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    {step.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                    )}
                    <span className="truncate">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-5 truncate">
                    {step.detail}
                  </p>
                </div>
                <span
                  className={`font-mono tabular-nums text-[11px] font-bold shrink-0 ${
                    step.done
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {step.progress}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
