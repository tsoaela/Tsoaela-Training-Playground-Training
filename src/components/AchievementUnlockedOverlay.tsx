import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  GraduationCap,
  ShieldCheck,
  Timer,
  Trophy,
  X,
} from 'lucide-react';

export interface MilestoneAchievementItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metricValue: string;
  tierLabel: 'Legendary' | 'Epic' | 'Honors';
  icon: 'flame' | 'trophy' | 'timer' | 'graduation';
  unlockedAtLabel: string;
}

interface AchievementUnlockedOverlayProps {
  isOpen: boolean;
  milestones: MilestoneAchievementItem[];
  initialIndex?: number;
  learnerName?: string;
  onClose: () => void;
  onAcknowledgeAll?: (milestoneIds: string[]) => void;
  onViewBadgesSection?: () => void;
}

const ICON_MAP = {
  flame: Flame,
  trophy: Trophy,
  timer: Timer,
  graduation: GraduationCap,
};

const TIER_ACCENT_STYLES: Record<
  MilestoneAchievementItem['tierLabel'],
  {
    ring: string;
    badgeBg: string;
    iconColor: string;
    labelColor: string;
  }
> = {
  Legendary: {
    ring: 'from-amber-400 via-yellow-300 to-emerald-400',
    badgeBg: 'from-stone-900 via-amber-950/90 to-stone-950',
    iconColor: 'text-amber-300',
    labelColor: 'text-amber-600 dark:text-amber-400',
  },
  Epic: {
    ring: 'from-emerald-400 via-lime-300 to-amber-400',
    badgeBg: 'from-[#052e16] via-[#064e3b] to-stone-950',
    iconColor: 'text-[#bef264]',
    labelColor: 'text-emerald-700 dark:text-emerald-400',
  },
  Honors: {
    ring: 'from-blue-400 via-indigo-400 to-emerald-400',
    badgeBg: 'from-stone-900 via-indigo-950 to-stone-950',
    iconColor: 'text-sky-300',
    labelColor: 'text-indigo-600 dark:text-indigo-400',
  },
};

export const AchievementUnlockedOverlay: React.FC<
  AchievementUnlockedOverlayProps
> = ({
  isOpen,
  milestones,
  initialIndex = 0,
  learnerName = 'Scholar',
  onClose,
  onAcknowledgeAll,
  onViewBadgesSection,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(
        Math.min(Math.max(0, initialIndex), Math.max(0, milestones.length - 1))
      );
    }
  }, [isOpen, initialIndex, milestones.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && activeIndex < milestones.length - 1) {
        setActiveIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, milestones.length, onClose]);

  const current = milestones[activeIndex] || null;

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-unlocked-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm"
          onClick={() => {
            onAcknowledgeAll?.(milestones.map((m) => m.id));
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden"
          >
            {/* Top Header Strip */}
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Achievement Unlocked
                </span>
                {milestones.length > 1 && (
                  <>
                    <span aria-hidden="true" className="text-stone-400">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      {activeIndex + 1} of {milestones.length}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onAcknowledgeAll?.(milestones.map((m) => m.id));
                  onClose();
                }}
                aria-label="Close Achievement Unlocked overlay"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Animated Badge Stage */}
            <div className="p-6 sm:p-8 text-center space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.86, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                  className="space-y-5"
                >
                  {(() => {
                    const IconComponent = ICON_MAP[current.icon];
                    const style = TIER_ACCENT_STYLES[current.tierLabel];
                    return (
                      <>
                        {/* Animated Orbital Crest */}
                        <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
                          {/* Rotating halo ring */}
                          <motion.div
                            aria-hidden="true"
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 16,
                              ease: 'linear',
                            }}
                            className={`absolute inset-0 rounded-full bg-gradient-to-tr ${style.ring} opacity-35 blur-[1px]`}
                          />
                          {/* Secondary counter-rotating dashed orbital ring */}
                          <motion.div
                            aria-hidden="true"
                            animate={{ rotate: -360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 24,
                              ease: 'linear',
                            }}
                            className="absolute inset-2 rounded-full border border-dashed border-amber-400/60 dark:border-amber-300/40"
                          />

                          {/* Spring Emblem Crest */}
                          <motion.div
                            initial={{ scale: 0.55, rotate: -14 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 18,
                              delay: 0.08,
                            }}
                            className={`relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br ${style.badgeBg} border border-amber-400/50 shadow-xl flex flex-col items-center justify-center gap-1`}
                          >
                            <IconComponent
                              className={`w-10 h-10 ${style.iconColor}`}
                            />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-200">
                              {current.tierLabel}
                            </span>
                          </motion.div>
                        </div>

                        {/* Metadata & Milestone Headline */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                            <span className={`font-bold ${style.labelColor}`}>
                              {current.tierLabel} Milestone
                            </span>
                            <span aria-hidden="true" className="text-stone-400">
                              ·
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                              {current.metricValue}
                            </span>
                            <span aria-hidden="true" className="text-stone-400">
                              ·
                            </span>
                            <span className="text-stone-500 dark:text-stone-400">
                              {current.unlockedAtLabel}
                            </span>
                          </div>

                          <h2
                            id="achievement-unlocked-title"
                            className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100"
                          >
                            {current.title}
                          </h2>

                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            Awarded to {learnerName} · {current.subtitle}
                          </p>

                          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                            {current.description}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>

              {/* Queue Dots / Navigation when multiple milestones unlocked */}
              {milestones.length > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeIndex === 0}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Previous unlocked milestone"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {milestones.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Select milestone ${m.title}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === activeIndex
                            ? 'w-6 bg-amber-500'
                            : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) =>
                        Math.min(milestones.length - 1, prev + 1)
                      )
                    }
                    disabled={activeIndex === milestones.length - 1}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Next unlocked milestone"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified against TTG Learning Telemetry</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {onViewBadgesSection && (
                    <button
                      type="button"
                      onClick={() => {
                        onAcknowledgeAll?.(milestones.map((m) => m.id));
                        onClose();
                        onViewBadgesSection();
                      }}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer whitespace-nowrap"
                    >
                      View All Badges
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (activeIndex < milestones.length - 1) {
                        setActiveIndex((prev) => prev + 1);
                      } else {
                        onAcknowledgeAll?.(milestones.map((m) => m.id));
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {activeIndex < milestones.length - 1
                        ? 'Next Milestone'
                        : 'Claim & Continue'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
