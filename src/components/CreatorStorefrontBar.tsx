import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  User as UserIcon,
  Filter,
} from 'lucide-react';
import { ArtPlatformId, CreatorStoreProfile, UserProfile } from '../types';
import {
  ART_PLATFORM_META,
  CREATOR_FREE_SALES_THRESHOLD,
  CreatorStoreUpdateDetail,
  getRecentFeeFlashForPlatform,
} from '../utils/creatorStoreSystem';
import { CreatorModalTab } from './CreatorProfileStoreModal';

interface CreatorStorefrontBarProps {
  platform: ArtPlatformId;
  user: UserProfile;
  store: CreatorStoreProfile | null;
  darkSurface?: boolean;
  onOpenStoreModal: (initialTab: CreatorModalTab) => void;
  onUploadClick: () => void;
  myStoreFilterActive?: boolean;
  onToggleMyStoreFilter?: () => void;
  myItemsCount?: number;
}

export const CreatorStorefrontBar: React.FC<CreatorStorefrontBarProps> = ({
  platform,
  user,
  store,
  darkSurface = false,
  onOpenStoreModal,
  onUploadClick,
  myStoreFilterActive = false,
  onToggleMyStoreFilter,
  myItemsCount = 0,
}) => {
  const meta = ART_PLATFORM_META[platform];
  const salesCount = store?.completedSalesCount || 0;
  const remainingFree = Math.max(0, CREATOR_FREE_SALES_THRESHOLD - salesCount);
  const feeActive = salesCount >= CREATOR_FREE_SALES_THRESHOLD;
  const hasPayout = Boolean(store?.payoutAccount);
  const hasAgreement = Boolean(store?.agreement?.accepted);

  const [isFeeFlashing, setIsFeeFlashing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const triggerFlash = () => {
      setIsFeeFlashing(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsFeeFlashing(false), 2000);
    };

    const recent = getRecentFeeFlashForPlatform(platform);
    if (recent) {
      triggerFlash();
    }

    const onStoreUpdated = (ev: Event) => {
      const customEv = ev as CustomEvent<CreatorStoreUpdateDetail>;
      if (customEv.detail?.feeDeducted && customEv.detail.platform === platform) {
        triggerFlash();
      }
    };
    window.addEventListener('ttg-creator-store-updated', onStoreUpdated);
    return () => {
      window.removeEventListener('ttg-creator-store-updated', onStoreUpdated);
      if (timer) clearTimeout(timer);
    };
  }, [platform]);

  const initials = (store?.artistName || user.name || 'CR')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const surfaceClasses = darkSurface
    ? 'bg-white/4 border-white/10 text-stone-100'
    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100';

  const mutedText = darkSurface
    ? 'text-stone-400'
    : 'text-stone-500 dark:text-stone-400';

  const secondaryBtnClasses = darkSurface
    ? 'bg-white/8 hover:bg-white/15 border-white/12 text-stone-100'
    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100';

  return (
    <section
      aria-label={`${meta.label} Artist Storefront Controls`}
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${surfaceClasses}`}
    >
      {/* Left: Artist Profile Identity + Payout & 50-Sale Service Fee Summary */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-500 font-bold text-sm flex items-center justify-center shrink-0">
          {initials}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold truncate">
              {store ? store.storeName : `${user.name || 'Creator'} · Online Storefront`}
            </h2>
            <span className={`text-xs font-mono ${mutedText}`}>
              {store ? store.handle : 'Not yet activated'}
            </span>
            {store?.isStoreActive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Store
              </span>
            )}
          </div>

          <div className={`text-xs flex flex-wrap items-center gap-x-2.5 gap-y-1 ${mutedText}`}>
            <span>
              Payment Account:{' '}
              <strong className={hasPayout ? 'text-emerald-500' : 'text-amber-500'}>
                {hasPayout
                  ? `${store!.payoutAccount!.method} (${store!.payoutAccount!.accountNumberMasked})`
                  : 'Setup Required'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Agreement:{' '}
              <strong className={hasAgreement ? 'text-emerald-500' : 'text-amber-500'}>
                {hasAgreement ? 'Signed' : 'Pending Signature'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-mono px-1.5 py-0.5 rounded-md tabular-nums transition-colors ${
                isFeeFlashing ? 'animate-earnings-fee-flash text-emerald-500 font-bold' : ''
              }`}
            >
              {feeActive
                ? `${salesCount} sales · $${(store?.creatorNetEarnings || 0).toFixed(2)} net · 5% Fee active`
                : `${salesCount}/50 sales (${remainingFree} fee-free remaining · 5% after 50)`}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Artist Profile, Payment Account, Agreement & Upload Store Buttons */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onOpenStoreModal('profile')}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${secondaryBtnClasses}`}
        >
          <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span>{store ? 'Artist Profile' : 'Create Artist Profile'}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenStoreModal('payout')}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${secondaryBtnClasses}`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          <span>{hasPayout ? 'Payment Account' : 'Create Payment Account'}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenStoreModal('agreement')}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${secondaryBtnClasses}`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-500" />
          <span>Service Agreement</span>
        </button>

        {onToggleMyStoreFilter && store && (
          <button
            type="button"
            onClick={onToggleMyStoreFilter}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              myStoreFilterActive
                ? 'bg-emerald-500 text-stone-950 border-emerald-400'
                : secondaryBtnClasses
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>My Store ({myItemsCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onUploadClick}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{meta.uploadActionLabel}</span>
        </button>
      </div>
    </section>
  );
};
