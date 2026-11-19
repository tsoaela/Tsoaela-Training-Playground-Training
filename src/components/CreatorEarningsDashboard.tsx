import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  CheckCircle2,
  Download,
  CreditCard,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { ArtPlatformId, CreatorStoreProfile, UserProfile } from '../types';
import {
  ART_PLATFORM_META,
  CREATOR_FREE_SALES_THRESHOLD,
  CreatorStoreUpdateDetail,
  clearFeeFlashForPlatform,
  downloadServiceAgreementPdf,
  getRecentFeeFlashForPlatform,
} from '../utils/creatorStoreSystem';
import { CreatorModalTab } from './CreatorProfileStoreModal';

interface CreatorEarningsDashboardProps {
  platform: ArtPlatformId;
  user: UserProfile;
  store: CreatorStoreProfile | null;
  darkSurface?: boolean;
  onOpenStoreModal: (initialTab: CreatorModalTab) => void;
}

const THRESHOLD_MILESTONES = [0, 10, 25, 40, 50];

export const CreatorEarningsDashboard: React.FC<CreatorEarningsDashboardProps> = ({
  platform,
  user,
  store,
  darkSurface = false,
  onOpenStoreModal,
}) => {
  const meta = ART_PLATFORM_META[platform];
  const [isFeeFlashing, setIsFeeFlashing] = useState(false);
  const [lastDeductionInfo, setLastDeductionInfo] = useState<{
    feeAmount: number;
    creatorNetPayout: number;
    saleNumber: number;
  } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const triggerFlash = (detail: CreatorStoreUpdateDetail) => {
      setLastDeductionInfo({
        feeAmount: detail.feeAmount,
        creatorNetPayout: detail.creatorNetPayout,
        saleNumber: detail.saleNumber,
      });
      setIsFeeFlashing(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsFeeFlashing(false);
        clearFeeFlashForPlatform(platform);
      }, 2200);
    };

    const recent = getRecentFeeFlashForPlatform(platform);
    if (recent) {
      triggerFlash(recent);
    }

    const handleStoreUpdate = (event: Event) => {
      const customEv = event as CustomEvent<CreatorStoreUpdateDetail>;
      const detail = customEv.detail;
      if (detail && detail.platform === platform && detail.feeDeducted) {
        triggerFlash(detail);
      }
    };

    window.addEventListener('ttg-creator-store-updated', handleStoreUpdate);
    return () => {
      window.removeEventListener('ttg-creator-store-updated', handleStoreUpdate);
      if (timer) clearTimeout(timer);
    };
  }, [platform]);

  const totalSales = store?.completedSalesCount || 0;
  const grossRevenue = store?.grossRevenue || 0;
  const netEarnings = store?.creatorNetEarnings || 0;
  const serviceFeesPaid = store?.siteOwnerServiceFeesPaid || 0;

  const isPostThreshold = totalSales >= CREATOR_FREE_SALES_THRESHOLD;
  const remainingFreeSales = Math.max(0, CREATOR_FREE_SALES_THRESHOLD - totalSales);
  const thresholdProgressPct = Math.min(
    100,
    Math.round((totalSales / CREATOR_FREE_SALES_THRESHOLD) * 100)
  );
  const activeFeeRateLabel = isPostThreshold ? '5%' : '0%';
  const activeCreatorShareLabel = isPostThreshold ? '95%' : '100%';

  const containerClasses = darkSurface
    ? 'bg-stone-950/75 border-white/10 text-stone-100'
    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100';

  const cellBorder = darkSurface
    ? 'border-white/8'
    : 'border-stone-200 dark:border-stone-800';

  const mutedText = darkSurface
    ? 'text-stone-400'
    : 'text-stone-500 dark:text-stone-400';

  const trackBg = darkSurface
    ? 'bg-white/10'
    : 'bg-stone-200 dark:bg-stone-800';

  const secondaryBtn = darkSurface
    ? 'bg-white/6 hover:bg-white/12 border-white/12 text-stone-100'
    : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100';

  const handleDownloadPdf = async () => {
    if (!store) {
      onOpenStoreModal('agreement');
      return;
    }
    setIsDownloadingPdf(true);
    try {
      await downloadServiceAgreementPdf(store);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <section
      aria-label={`${meta.label} Creator Earnings Dashboard`}
      className={`rounded-2xl border overflow-hidden transition-colors ${containerClasses}`}
    >
      {/* Top Header Strip */}
      <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cellBorder}`}>
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <h3 className="text-sm font-bold tracking-tight">
              Creator Earnings Dashboard
            </h3>
            <span className={`text-xs font-mono ${mutedText}`}>
              · {meta.label}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${mutedText}`}>
            {store
              ? `Live payout ledger for ${store.storeName} (${store.handle}) · Linked account ${
                  store.payoutAccount
                    ? `${store.payoutAccount.method} ${store.payoutAccount.accountNumberMasked}`
                    : 'not linked yet'
                }`
              : `Track product sales, 5% post-50-sale service fee deductions, and threshold progress for ${user.name || 'your storefront'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={isDownloadingPdf}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 ${secondaryBtn}`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Service Agreement PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenStoreModal(store ? 'payout' : 'profile')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${secondaryBtn}`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            <span>{store ? 'Payment Account' : 'Launch Storefront'}</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>

      {/* 4-Column Financial KPI Strip (Single-Elevation Grid) */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x ${darkSurface ? 'divide-white/8' : 'divide-stone-200 dark:divide-stone-800'}`}>
        {/* 1. Total Sales */}
        <div className="p-4 sm:p-5 space-y-1">
          <span className={`text-[11px] font-semibold uppercase tracking-wider block ${mutedText}`}>
            Total Sales
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {totalSales}
          </div>
          <div className={`text-xs font-mono tabular-nums ${mutedText}`}>
            {isPostThreshold
              ? `Post-50 tier (${activeCreatorShareLabel} creator share)`
              : `${remainingFreeSales} left in 0% fee tier`}
          </div>
        </div>

        {/* 2. Gross Revenue */}
        <div className="p-4 sm:p-5 space-y-1">
          <span className={`text-[11px] font-semibold uppercase tracking-wider block ${mutedText}`}>
            Gross Product Sales
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums">
            ${grossRevenue.toFixed(2)}
          </div>
          <div className={`text-xs ${mutedText}`}>
            {store?.payoutAccount?.currency || 'USD'} settlement volume
          </div>
        </div>

        {/* 3. Net Creator Earnings (Subtle Green Flash on 5% Service Fee Deduction) */}
        <div
          className={`p-4 sm:p-5 space-y-1 transition-colors ${
            isFeeFlashing ? 'animate-earnings-fee-flash' : ''
          }`}
          data-fee-flashing={isFeeFlashing ? 'true' : 'false'}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${mutedText}`}>
              Net Creator Earnings
            </span>
            {isFeeFlashing && lastDeductionInfo && (
              <span className="text-[11px] font-mono font-bold text-emerald-500 tabular-nums">
                +${lastDeductionInfo.creatorNetPayout.toFixed(2)} net
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-500 flex items-center gap-1.5">
            <DollarSign className="w-5 h-5 shrink-0" />
            <span>{netEarnings.toFixed(2)}</span>
          </div>
          <div className={`text-xs font-mono tabular-nums ${isFeeFlashing ? 'text-emerald-500 font-semibold' : mutedText}`}>
            {isFeeFlashing && lastDeductionInfo
              ? `Sale #${lastDeductionInfo.saleNumber} settled · −$${lastDeductionInfo.feeAmount.toFixed(2)} (5% fee)`
              : `${activeCreatorShareLabel} payout rate active`}
          </div>
        </div>

        {/* 4. 5% Site Service Fee Deductions */}
        <div
          className={`p-4 sm:p-5 space-y-1 transition-colors ${
            isFeeFlashing ? 'animate-earnings-fee-flash' : ''
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider block ${mutedText}`}>
            5% Site Fee Deductions
          </span>
          <div className={`text-2xl font-bold font-mono tabular-nums flex items-center gap-1.5 ${
            serviceFeesPaid > 0 ? 'text-amber-500' : ''
          }`}>
            <Percent className="w-4 h-4 shrink-0 text-amber-500" />
            <span>${serviceFeesPaid.toFixed(2)}</span>
          </div>
          <div className={`text-xs font-mono tabular-nums ${mutedText}`}>
            Current rate: <strong className={isPostThreshold ? 'text-amber-500' : 'text-emerald-500'}>{activeFeeRateLabel}</strong> (paid to Site Owner)
          </div>
        </div>
      </div>

      {/* 50-Sale Threshold Progress Tracker */}
      <div className={`px-5 py-4 border-t space-y-3 ${cellBorder}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Target className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>50-Sale Fee-Free Threshold Progress</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
            <span className="font-bold">
              {Math.min(totalSales, CREATOR_FREE_SALES_THRESHOLD)} / {CREATOR_FREE_SALES_THRESHOLD} sales
            </span>
            <span className={mutedText}>({thresholdProgressPct}%)</span>
            {isPostThreshold ? (
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold font-sans">
                <CheckCircle2 className="w-3.5 h-3.5" />
                5% Service Fee Active
              </span>
            ) : (
              <span className="text-emerald-500 font-semibold font-sans">
                {remainingFreeSales} fee-free remaining
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div
            role="progressbar"
            aria-valuenow={Math.min(totalSales, CREATOR_FREE_SALES_THRESHOLD)}
            aria-valuemin={0}
            aria-valuemax={CREATOR_FREE_SALES_THRESHOLD}
            aria-label="Creator progress toward 50-sale threshold"
            className={`w-full h-2.5 rounded-full overflow-hidden ${trackBg}`}
          >
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isPostThreshold ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${thresholdProgressPct}%` }}
            />
          </div>

          <div className={`flex items-center justify-between text-[10px] font-mono tabular-nums ${mutedText}`}>
            {THRESHOLD_MILESTONES.map((mark) => {
              const reached = totalSales >= mark;
              return (
                <span
                  key={mark}
                  className={reached ? 'text-emerald-500 font-bold' : ''}
                >
                  {mark === 50 ? '50 (5% Fee Starts)' : `${mark}`}
                </span>
              );
            })}
          </div>
        </div>

        <p className={`text-[11px] leading-relaxed ${mutedText}`}>
          {isPostThreshold
            ? `Threshold surpassed (${totalSales} completed sales). Every sale now automatically deducts a 5% Site Service Fee payable to the Site Owner while routing 95% directly to your linked payment account.`
            : `You keep 100% of gross sales for your first ${CREATOR_FREE_SALES_THRESHOLD} completed transactions. With ${remainingFreeSales} fee-free ${
                remainingFreeSales === 1 ? 'sale' : 'sales'
              } remaining, the 5% Site Service Fee activates automatically starting on sale #51.`}
        </p>
      </div>
    </section>
  );
};
