import React, { useState, useMemo } from 'react';
import {
  UserProfile,
  InvoiceReceipt,
  SubscriptionTier,
  ReadingProgress,
  StudyGuide,
  EnrolledStudentRecord,
  SavedAcademicProgram,
  ApplicationPrefillData,
} from '../types';
import { CreditCard, ExternalLink, FileText, CheckCircle2, Sparkles, RefreshCw, Bell, HelpCircle, Check } from 'lucide-react';
import { AcademicCategoryKey } from '../data/academicCatalog';
import { AchievementBadgesSection } from './AchievementBadgesSection';
import { UserProfileCertificatesSection } from './UserProfileCertificatesSection';
import { ProfileEditCard } from './ProfileEditCard';
import { SavedProgramsSection } from './SavedProgramsSection';

interface BillingDashboardTabProps {
  user: UserProfile;
  invoices: InvoiceReceipt[];
  readingProgress?: Record<string, ReadingProgress>;
  studyGuides?: StudyGuide[];
  enrollments?: EnrolledStudentRecord[];
  onNavigateToCourse?: (guideId: string) => void;
  onOpenFacultyPortal?: () => void;
  onOpenStripePortal: () => void;
  onOpenPaywall: () => void;
  onViewReceipt: (invoice: InvoiceReceipt) => void;
  onSimulateTierChange: (tier: SubscriptionTier) => void;
  onOpenReminders?: () => void;
  onOpenFAQ?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  syncedFocusMinutes?: number;
  completedPomodoroSessions?: number;
  savedPrograms?: SavedAcademicProgram[];
  comparedProgramIds?: string[];
  onRemoveSavedProgram?: (qualificationId: string) => void;
  onBrowseQualifications?: (category?: AcademicCategoryKey) => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  onToggleCompareProgram?: (qualificationId: string) => void;
  onOpenCompareModal?: () => void;
}

export const BillingDashboardTab: React.FC<BillingDashboardTabProps> = ({
  user,
  invoices,
  readingProgress = {},
  studyGuides = [],
  enrollments = [],
  onNavigateToCourse,
  onOpenFacultyPortal,
  onOpenStripePortal,
  onOpenPaywall,
  onViewReceipt,
  onSimulateTierChange,
  onOpenReminders,
  onOpenFAQ,
  onUpdateProfile,
  syncedFocusMinutes = 0,
  completedPomodoroSessions = 0,
  savedPrograms = [],
  comparedProgramIds = [],
  onRemoveSavedProgram,
  onBrowseQualifications,
  onApplyQualification,
  onToggleCompareProgram,
  onOpenCompareModal,
}) => {
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'retreat' | 'grant'>('all');
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (receiptFilter === 'retreat') return inv.category === 'Retreat Booking';
      if (receiptFilter === 'grant') return inv.amount === 0;
      return true;
    });
  }, [invoices, receiptFilter]);

  const handleCopyId = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
      setCopiedInvoiceId(id);
      setTimeout(() => setCopiedInvoiceId(null), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>Account Settings</span>
          <span aria-hidden="true">·</span>
          <span>Stripe Billing Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Customer Portal ID: cus_ttg_{user.id.slice(-6)}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
              {user.name} · Profile & Subscriptions
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              Review your unlocked academic achievement badges, active institutional fellowship plan, and tax receipts ({user.email}).
            </p>
          </div>

          {/* Manage Subscription Button (Prompt 3 requirement) */}
          <button
            type="button"
            onClick={onOpenStripePortal}
            className="px-4 py-2.5 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] rounded-xl shadow-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span>Manage Subscription</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* User Profile Editor */}
      {onUpdateProfile && (
        <ProfileEditCard
          user={user}
          onUpdateProfile={onUpdateProfile}
          syncedFocusMinutes={syncedFocusMinutes}
          completedSessions={completedPomodoroSessions}
        />
      )}

      {/* My Saved Programs Section (Bookmarked Academic Qualifications) */}
      {onRemoveSavedProgram && (
        <SavedProgramsSection
          savedPrograms={savedPrograms}
          comparedProgramIds={comparedProgramIds}
          onRemoveSavedProgram={onRemoveSavedProgram}
          onBrowseQualifications={onBrowseQualifications}
          onApplyQualification={onApplyQualification}
          onToggleCompareProgram={onToggleCompareProgram}
          onOpenCompareModal={onOpenCompareModal}
        />
      )}

      {/* Dynamic Custom Achievement Badges Showcase */}
      <AchievementBadgesSection
        readingProgress={readingProgress}
        studyGuides={studyGuides}
        onNavigateToCourse={onNavigateToCourse}
        userName={user.name}
        userEmail={user.email}
        enrollments={enrollments}
        onOpenFacultyPortal={onOpenFacultyPortal}
      />

      {/* Branded Course Completion Certificates & Preview Modal */}
      <UserProfileCertificatesSection
        user={user}
        studyGuides={studyGuides}
        readingProgress={readingProgress}
        onNavigateToCourse={onNavigateToCourse}
      />

      {/* Current Plan Status Card */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              <span>Current Plan Status</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {user.subscription_tier === 'free' ? 'Self-Paced Tutoring Learner' : 'Digital Educare Active Member'}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {user.subscription_tier === 'educare_pro' && 'Digital Educare Short-Course Access'}
              {user.subscription_tier === 'research_pass' && 'Research Corner Tutoring Access'}
              {user.subscription_tier === 'all_access' && 'Digital Educare All-Access'}
              {user.subscription_tier === 'free' && 'Digital Educare Tutoring Plan'}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              {user.subscription_tier === 'free' 
                ? 'All short-term course lessons are 100% free (R0). Long-term courses unlock individually for R145 per course — finish at your own pace.' 
                : `Self-paced Digital Educare Tutoring · Short courses free · Long-term courses R145 each · Next cycle: ${user.renewal_date}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {user.subscription_tier === 'free' ? (
              <button
                type="button"
                onClick={onOpenPaywall}
                className="px-4 py-2 text-xs font-semibold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>View Tutoring Plans</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenStripePortal}
                className="px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Stripe Portal Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Plan Details & Payment Method Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          {/* Column 1: Tutoring Cadence */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold block">
              Digital Educare Tutoring
            </span>
            <div className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              R0 / R145
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400 font-sans ml-1">
                (Self-Paced)
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Free Short-Term Courses · R145 per Long-Term Course
            </p>
          </div>

          {/* Column 2: Payment Method */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold block">
              Payment Record
            </span>
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              <CreditCard className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span>{user.payment_method.brand} ending in {user.payment_method.last4}</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Exp: {user.payment_method.exp_month}/{user.payment_method.exp_year} (On File for Retreats)
            </p>
          </div>

          {/* Column 3: Membership Perks */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-semibold block">
              Included Tier Entitlements
            </span>
            <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
              <li>· Executive Study Guides + Reading Process</li>
              <li>· Quantitative Research Dossiers</li>
              <li>· Dual AI Superagents Unlocked</li>
              <li>· Itemized Tax Receipts & Invoices</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Quick Access Hub: Reminders & FAQ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Study & Event Reminders</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Manage automated daily deep-focus schedules, retreat prep checklists, and recurring review intervals.
            </p>
          </div>
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 shrink-0 transition-colors"
            >
              Open Reminders
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              <span>Platform FAQ & $0 Policy</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Learn about our $0 subscription policy, institutional backing, retreat booking procedures, and tax receipts.
            </p>
          </div>
          {onOpenFAQ && (
            <button
              type="button"
              onClick={onOpenFAQ}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 shrink-0 transition-colors border border-stone-200 dark:border-stone-700"
            >
              Read FAQ
            </button>
          )}
        </div>
      </div>

      {/* Past Purchase Receipts & Invoices Table */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <FileText className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span>Financial Ledger</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-0.5">
              Past Purchase Receipts & Tax Invoices
            </h3>
          </div>

          {/* Receipt Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setReceiptFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                receiptFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 font-semibold text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              All Receipts ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setReceiptFilter('retreat')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                receiptFilter === 'retreat'
                  ? 'bg-white dark:bg-stone-700 font-semibold text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Retreats ({invoices.filter(i => i.category === 'Retreat Booking').length})
            </button>
            <button
              type="button"
              onClick={() => setReceiptFilter('grant')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                receiptFilter === 'grant'
                  ? 'bg-white dark:bg-stone-700 font-semibold text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              $0 Grants ({invoices.filter(i => i.amount === 0).length})
            </button>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
            No receipts matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-750 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-1.5">
                        <span>{inv.invoice_number}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(inv.invoice_number)}
                          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded"
                          title="Copy Invoice ID"
                        >
                          {copiedInvoiceId === inv.invoice_number ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <span className="text-[10px] font-sans">⎘</span>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-400">
                      {inv.date}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900 dark:text-stone-100">
                      {inv.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        inv.amount === 0 
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        {inv.amount === 0 ? '$0 Grant' : inv.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                      ${inv.amount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Paid</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs border border-stone-200 dark:border-stone-700"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulator Switcher Toolstrip (for instant review and verification of all tiers) */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-100/70 dark:bg-stone-900 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span className="font-semibold text-stone-800 dark:text-stone-200">Persona & Subscription Tier Switcher:</span>
          <span>(Quick-toggle state to test paywall locks across tabs)</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onSimulateTierChange('free')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              user.subscription_tier === 'free'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => onSimulateTierChange('educare_pro')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              user.subscription_tier === 'educare_pro'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
            }`}
          >
            Educare Pro
          </button>
          <button
            type="button"
            onClick={() => onSimulateTierChange('research_pass')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              user.subscription_tier === 'research_pass'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
            }`}
          >
            Research Pass
          </button>
          <button
            type="button"
            onClick={() => onSimulateTierChange('all_access')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              user.subscription_tier === 'all_access'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
            }`}
          >
            All-Access
          </button>
        </div>
      </div>

    </div>
  );
};
