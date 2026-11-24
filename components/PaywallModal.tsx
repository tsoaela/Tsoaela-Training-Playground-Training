import React, { useState } from 'react';
import { Check, X, Shield, Sparkles, BookOpen, Brain, ArrowRight, Lock, Gift } from 'lucide-react';
import { TTG_LOGO_URL } from '../utils/pdfBranding';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerStripeCheckout: (plan: 'educare_pro' | 'research_pass' | 'all_access') => void;
  targetFeature?: string;
  recommendedPlan?: 'educare_pro' | 'research_pass';
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onTriggerStripeCheckout,
  targetFeature,
  recommendedPlan = 'educare_pro',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'educare_pro' | 'research_pass' | 'all_access'>(recommendedPlan);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-8 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-20"
          aria-label="Close paywall modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-8 pb-6 sm:px-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <img
              src={TTG_LOGO_URL}
              alt="Tsoaela Training Ground Platform Logo"
              referrerPolicy="no-referrer"
              className="h-10 w-auto rounded-lg object-contain bg-white px-1 py-0.5 ring-1 ring-stone-200 dark:ring-stone-700 shadow-xs shrink-0"
            />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Gift className="w-4 h-4" />
              <span>TTG Digital Educare Tutoring System</span>
              <span aria-hidden="true">·</span>
              <span>Self-Paced Learning</span>
            </div>
          </div>

          <h2 id="paywall-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
            {targetFeature ? `Digital Educare Tutoring: ${targetFeature}` : 'Self-Paced Digital Educare Tutoring Access'}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl">
            Short-term course lessons are 100% free for every learner. Long-term comprehensive courses unlock individually at R145 per course so you can learn and finish completely at your own pace.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 w-fit">
            <Check className="w-3.5 h-3.5" />
            <span className="font-medium">Free short-course lessons · R145/course for long-term tracks · Finish at your own pace</span>
          </div>
        </div>

        {/* Tutoring Options */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option 1: Short-Term Tutoring Courses (Free) */}
            <div
              onClick={() => setSelectedPlan('educare_pro')}
              className={`relative rounded-xl p-5 border cursor-pointer transition-all ${
                selectedPlan === 'educare_pro'
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-800/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-base">Short-Term Tutoring</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Open short courses &amp; guided lessons
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    FREE (R0)
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">No subscription fees</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-stone-700 dark:text-stone-300 border-t border-stone-200/60 dark:border-stone-700/60 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Full free access to all Short-Term Course lessons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Interactive TAI Tutor &amp; Educare Study Assistant</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Self-paced reading progress &amp; chapter notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Finish any short course completely at your own pace</span>
                </li>
              </ul>
            </div>

            {/* Option 2: Long-Term Tutoring Courses (R145 per course) */}
            <div
              onClick={() => setSelectedPlan('research_pass')}
              className={`relative rounded-xl p-5 border cursor-pointer transition-all ${
                selectedPlan === 'research_pass'
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-800/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-stone-800 dark:text-stone-300" />
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-base">Long-Term Courses</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    In-depth mentored tracks per course
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                    R145
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">One-time per course</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-stone-700 dark:text-stone-300 border-t border-stone-200/60 dark:border-stone-700/60 pt-3">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-800 dark:text-stone-300 shrink-0" />
                  <span>Pay R145 once per long-term course you choose</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-800 dark:text-stone-300 shrink-0" />
                  <span>Zero recurring monthly fees or cohort deadlines</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-800 dark:text-stone-300 shrink-0" />
                  <span>Complete workshops, quizzes &amp; capstone at your own pace</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-stone-800 dark:text-stone-300 shrink-0" />
                  <span>Official completion certificate upon finishing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Option 3: All-Access Tutoring Bundle Banner (R0) */}
          <div
            onClick={() => setSelectedPlan('all_access')}
            className={`p-4 rounded-xl border cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              selectedPlan === 'all_access'
                ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-900/5 dark:bg-emerald-950/40 ring-1 ring-emerald-700 shadow-xs'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Free Short-Course &amp; Research Pass</span>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-100/80 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">
                    Free · R0.00
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">Unlock all free short-term tutoring lessons, Research Corner papers &amp; self-paced progress tools</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                R0.00
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400"> / free</span>
            </div>
          </div>

          {/* Action Area with Stripe Trigger */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Digital Educare Tutoring · Finish every course at your own pace</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => onTriggerStripeCheckout(selectedPlan)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white dark:text-stone-900 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-400 dark:hover:bg-emerald-300 active:scale-[0.98] rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <span>Activate Free Tutoring Access (R0.00)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
