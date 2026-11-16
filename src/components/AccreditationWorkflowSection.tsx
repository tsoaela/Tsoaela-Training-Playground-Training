import React, { useState } from 'react';
import {
  ACCREDITATION_WORKFLOW_STAGES,
  AccreditationWorkflowStage,
} from '../data/accreditationRegistry';
import {
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  UserCheck,
  Building2,
  ClipboardCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface AccreditationWorkflowSectionProps {
  onOpenAccreditationModal?: () => void;
  onJumpToQualifications?: () => void;
}

const STAGE_ICONS = [BookOpen, UserCheck, Building2, ClipboardCheck, Award];

function getStageStatusMeta(state: AccreditationWorkflowStage['currentState']) {
  switch (state) {
    case 'internal_active':
      return {
        symbol: '●',
        shortBadge: 'INTERNAL ACTIVE',
        badgeClass:
          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        nodeRingClass:
          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
        connectorClass: 'bg-emerald-400/70 dark:bg-emerald-700/70',
      };
    case 'partial_review':
      return {
        symbol: '◐',
        shortBadge: 'PARTIAL · INTERNAL',
        badgeClass:
          'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        nodeRingClass:
          'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
        connectorClass: 'bg-amber-400/70 dark:bg-amber-700/70',
      };
    case 'external_required':
    default:
      return {
        symbol: '▲',
        shortBadge: 'EXTERNAL REQUIRED',
        badgeClass:
          'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        nodeRingClass:
          'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
        connectorClass: 'bg-stone-300 dark:bg-stone-700',
      };
  }
}

export const AccreditationWorkflowSection: React.FC<AccreditationWorkflowSectionProps> = ({
  onOpenAccreditationModal,
  onJumpToQualifications,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const activeStage = ACCREDITATION_WORKFLOW_STAGES[activeIndex];
  const activeMeta = getStageStatusMeta(activeStage.currentState);
  const ActiveIcon = STAGE_ICONS[activeIndex] || ShieldCheck;

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      Math.min(ACCREDITATION_WORKFLOW_STAGES.length - 1, prev + 1)
    );
  };

  return (
    <section
      id="accreditation-workflow-section"
      aria-labelledby="accreditation-workflow-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-48"
    >
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        {/* Header Bar */}
        <div className="px-6 py-5 bg-stone-50/90 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accreditation &amp; Verification Workflow</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-400">
                Full Transparency Map
              </span>
            </div>
            <h2
              id="accreditation-workflow-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              From Curriculum Design to Final Certification
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              Inspect every stage of academic quality assurance — distinguishing internal platform controls active today from external regulatory approvals and cryptographic certificate signing required for formal degree credit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onJumpToQualifications && (
              <button
                type="button"
                onClick={onJumpToQualifications}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
              >
                Explore Qualifications
              </button>
            )}
            {onOpenAccreditationModal && (
              <button
                type="button"
                onClick={onOpenAccreditationModal}
                className="px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Self-Audit &amp; QA Check</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Legend Bar (Dual-coded symbols + labels) */}
        <div className="px-6 py-2.5 bg-stone-50/40 dark:bg-stone-950/40 border-b border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Pipeline State Legend:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-mono font-semibold">
              <span aria-hidden="true">●</span> INTERNAL ACTIVE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-mono font-semibold">
              <span aria-hidden="true">◐</span> PARTIAL REVIEW
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-mono font-semibold">
              <span aria-hidden="true">▲</span> EXTERNAL REQUIRED
            </span>
          </div>
          <span className="font-mono text-stone-500 dark:text-stone-400 tabular-nums">
            Stage {activeIndex + 1} of {ACCREDITATION_WORKFLOW_STAGES.length}
          </span>
        </div>

        {/* Interactive Stage Selector Pipeline */}
        <div className="p-6 space-y-6">
          <div
            role="tablist"
            aria-label="Accreditation workflow stages"
            className="grid grid-cols-1 md:grid-cols-5 gap-3 relative"
          >
            {ACCREDITATION_WORKFLOW_STAGES.map((stage, idx) => {
              const Icon = STAGE_ICONS[idx] || ShieldCheck;
              const isActive = idx === activeIndex;
              const isCompletedInJourney = idx < activeIndex;
              const meta = getStageStatusMeta(stage.currentState);

              return (
                <div key={stage.id} className="relative flex flex-col">
                  {/* Connector line on desktop */}
                  {idx < ACCREDITATION_WORKFLOW_STAGES.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`hidden md:block absolute top-7 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 transition-colors ${
                        isCompletedInJourney
                          ? 'bg-purple-500 dark:bg-purple-400'
                          : 'bg-stone-200 dark:bg-stone-800'
                      }`}
                    />
                  )}

                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative z-10 w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
                      isActive
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-50/70 dark:bg-purple-950/30 shadow-sm ring-1 ring-purple-600/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 hover:border-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'border-purple-600 bg-purple-700 text-white'
                            : meta.nodeRingClass
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-mono text-[10px] font-bold text-stone-500 dark:text-stone-400">
                        STEP 0{stage.stepNumber}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {stage.shortLabel}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wide ${meta.badgeClass}`}
                      >
                        <span aria-hidden="true">{meta.symbol}</span>
                        <span>{meta.shortBadge}</span>
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Interactive Detail Stage Inspector */}
          <div
            role="tabpanel"
            aria-label={activeStage.title}
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Stage {activeStage.stepNumber} of {ACCREDITATION_WORKFLOW_STAGES.length}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${activeMeta.badgeClass}`}
                    >
                      <span aria-hidden="true">{activeMeta.symbol}</span>
                      <span>{activeStage.currentStateLabel}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {activeStage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-w-3xl">
                    {activeStage.summary}
                  </p>
                </div>
              </div>

              {/* Step Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeIndex === 0}
                  aria-label="Previous accreditation stage"
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeIndex === ACCREDITATION_WORKFLOW_STAGES.length - 1}
                  aria-label="Next accreditation stage"
                  className="px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {activeIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveIndex(0)}
                    title="Reset workflow view to Stage 1"
                    aria-label="Reset workflow to Stage 1"
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 3-Column Evidence & Safeguards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Student Protection</span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeStage.studentProtection}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Provider Deliverable</span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeStage.providerDeliverable}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {activeStage.currentState === 'external_required' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>Verification Mechanism</span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeStage.verificationMechanism}
                </p>
              </div>
            </div>

            {/* External Reference Links Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200/70 dark:border-stone-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Standards &amp; Application Portals:
                </span>
                {activeStage.recommendedAuthorities.map((auth) => (
                  <a
                    key={auth.name}
                    href={auth.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-purple-500 text-[11px] font-semibold text-stone-800 dark:text-stone-200 transition-colors"
                  >
                    <span>{auth.name}</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                ))}
              </div>

              {activeIndex < ACCREDITATION_WORKFLOW_STAGES.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer shrink-0"
                >
                  <span>
                    Proceed to Stage {activeStage.stepNumber + 1}:{' '}
                    {ACCREDITATION_WORKFLOW_STAGES[activeIndex + 1].shortLabel}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Internal serials active · Cryptographic Open Badges 3.0 &amp; statutory listing pending
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
