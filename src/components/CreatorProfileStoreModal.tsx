import React, { useEffect, useState } from 'react';
import {
  X,
  Store,
  CreditCard,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Download,
  User as UserIcon,
  Building2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  ArtPlatformId,
  CreatorPayoutAccount,
  CreatorStoreProfile,
  PayoutMethodType,
  UserProfile,
} from '../types';
import {
  ART_PLATFORM_META,
  CREATOR_FREE_SALES_THRESHOLD,
  CREATOR_SERVICE_AGREEMENT_CLAUSES,
  CREATOR_SERVICE_AGREEMENT_VERSION,
  CreatorStoreUpdateDetail,
  computeCreatorSaleSplit,
  downloadServiceAgreementPdf,
  downloadSignedServiceAgreement,
  getRecentFeeFlashForPlatform,
  maskAccountNumber,
  upsertCreatorStore,
} from '../utils/creatorStoreSystem';

export type CreatorModalTab = 'profile' | 'payout' | 'agreement';

interface CreatorProfileStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: ArtPlatformId;
  user: UserProfile;
  existingStore: CreatorStoreProfile | null;
  initialTab?: CreatorModalTab;
  onStoreSaved: (store: CreatorStoreProfile) => void;
  onProceedToUpload?: () => void;
}

const PAYOUT_METHODS: PayoutMethodType[] = [
  'Stripe Connect Express',
  'Bank Wire / ACH',
  'PayPal Business',
  'Instant EFT / Mobile Money',
];

export const CreatorProfileStoreModal: React.FC<CreatorProfileStoreModalProps> = ({
  isOpen,
  onClose,
  platform,
  user,
  existingStore,
  initialTab = 'profile',
  onStoreSaved,
  onProceedToUpload,
}) => {
  const meta = ART_PLATFORM_META[platform];
  const [activeTab, setActiveTab] = useState<CreatorModalTab>(initialTab);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Storefront & Artist Profile State
  const [storeName, setStoreName] = useState('');
  const [handle, setHandle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Payout Account State
  const [accountHolderName, setAccountHolderName] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodType>('Stripe Connect Express');
  const [institutionName, setInstitutionName] = useState('');
  const [routingOrSwiftCode, setRoutingOrSwiftCode] = useState('');
  const [rawAccountNumber, setRawAccountNumber] = useState('');
  const [payoutEmail, setPayoutEmail] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'ZAR' | 'EUR' | 'GBP'>('USD');
  const [taxEntityType, setTaxEntityType] = useState<'Individual Creator' | 'Registered Studio / PTY'>(
    'Individual Creator'
  );

  // Agreement Acceptance State
  const [signatureText, setSignatureText] = useState('');
  const [agreedToClause, setAgreedToClause] = useState(false);
  const [calculatorSamplePrice, setCalculatorSamplePrice] = useState('25');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isFeeFlashing, setIsFeeFlashing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setFeedback(null);
    setErrorMsg(null);

    const baseName = user.name || 'Independent Creator';
    const defaultHandle = `@${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creator'}`;

    setStoreName(existingStore?.storeName || `${baseName} Studio Store`);
    setHandle(existingStore?.handle || defaultHandle);
    setArtistName(existingStore?.artistName || baseName);
    setTagline(existingStore?.tagline || `Original works & digital masters on ${meta.label}`);
    setBio(existingStore?.bio || user.bio || '');
    setLocation(existingStore?.location || 'Johannesburg / Global');
    setWebsite(existingStore?.website || '');
    setSpecialty(existingStore?.specialty || meta.defaultSpecialty);

    setAccountHolderName(existingStore?.payoutAccount?.accountHolderName || baseName);
    setPayoutMethod(existingStore?.payoutAccount?.method || 'Stripe Connect Express');
    setInstitutionName(existingStore?.payoutAccount?.institutionName || '');
    setRoutingOrSwiftCode(existingStore?.payoutAccount?.routingOrSwiftCode || '');
    setRawAccountNumber('');
    setPayoutEmail(existingStore?.payoutAccount?.payoutEmail || user.email || '');
    setCurrency(existingStore?.payoutAccount?.currency || 'USD');
    setTaxEntityType(existingStore?.payoutAccount?.taxEntityType || 'Individual Creator');

    setSignatureText(existingStore?.agreement?.signatureText || baseName);
    setAgreedToClause(Boolean(existingStore?.agreement?.accepted));
  }, [isOpen, initialTab, existingStore, user, meta]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
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

    const onUpdate = (ev: Event) => {
      const customEv = ev as CustomEvent<CreatorStoreUpdateDetail>;
      if (customEv.detail?.feeDeducted && customEv.detail.platform === platform) {
        triggerFlash();
      }
    };
    window.addEventListener('ttg-creator-store-updated', onUpdate);
    return () => {
      window.removeEventListener('ttg-creator-store-updated', onUpdate);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, platform]);

  if (!isOpen) return null;

  const currentSalesCount = existingStore?.completedSalesCount || 0;
  const remainingFreeSales = Math.max(0, CREATOR_FREE_SALES_THRESHOLD - currentSalesCount);
  const isPost50Active = currentSalesCount >= CREATOR_FREE_SALES_THRESHOLD;

  const sampleAmount = Math.max(1, parseFloat(calculatorSamplePrice) || 25);
  const preThresholdExample = computeCreatorSaleSplit(10, sampleAmount);
  const postThresholdExample = computeCreatorSaleSplit(50, sampleAmount);

  const buildDraftStore = (overrides?: Partial<CreatorStoreProfile>): CreatorStoreProfile => {
    const cleanHandle = handle.trim().startsWith('@')
      ? handle.trim()
      : `@${handle.trim() || 'creator'}`;

    const mergedPayout = overrides?.payoutAccount !== undefined ? overrides.payoutAccount : existingStore?.payoutAccount || null;
    const mergedAgreement = overrides?.agreement !== undefined ? overrides.agreement : existingStore?.agreement || null;

    return {
      id: existingStore?.id || `store_${platform}_${user.id}`,
      ownerUserId: user.id,
      platform,
      storeName: storeName.trim() || `${user.name || 'Artist'} Studio Store`,
      handle: cleanHandle,
      artistName: artistName.trim() || user.name || 'Artist',
      tagline: tagline.trim() || meta.label,
      bio: bio.trim(),
      location: location.trim() || 'Global',
      website: website.trim(),
      specialty: specialty.trim() || meta.defaultSpecialty,
      isStoreActive: Boolean(mergedPayout && mergedAgreement?.accepted),
      payoutAccount: mergedPayout,
      agreement: mergedAgreement,
      completedSalesCount: existingStore?.completedSalesCount || 0,
      grossRevenue: existingStore?.grossRevenue || 0,
      creatorNetEarnings: existingStore?.creatorNetEarnings || 0,
      siteOwnerServiceFeesPaid: existingStore?.siteOwnerServiceFeesPaid || 0,
      createdAt: existingStore?.createdAt || new Date().toISOString(),
    };
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!storeName.trim() || !artistName.trim()) {
      setErrorMsg('Please provide both an Online Store Name and Artist Display Name.');
      return;
    }
    const nextStore = buildDraftStore();
    upsertCreatorStore(nextStore);
    onStoreSaved(nextStore);
    setFeedback('Artist Profile & Online Storefront details saved.');
    if (!nextStore.payoutAccount) {
      setActiveTab('payout');
    } else if (!nextStore.agreement?.accepted) {
      setActiveTab('agreement');
    }
  };

  const handleSavePayoutAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!accountHolderName.trim() || !institutionName.trim() || !payoutEmail.trim()) {
      setErrorMsg('Account holder legal name, institution/provider, and payout email are required.');
      return;
    }
    if (!existingStore?.payoutAccount && !rawAccountNumber.trim()) {
      setErrorMsg('Please enter an account number, IBAN, or payout ID to link your payment account.');
      return;
    }

    const masked = rawAccountNumber.trim()
      ? maskAccountNumber(rawAccountNumber)
      : existingStore?.payoutAccount?.accountNumberMasked || '•••• 4821';

    const payoutAccount: CreatorPayoutAccount = {
      id: existingStore?.payoutAccount?.id || `acct_${Date.now()}`,
      accountHolderName: accountHolderName.trim(),
      method: payoutMethod,
      institutionName: institutionName.trim(),
      routingOrSwiftCode: routingOrSwiftCode.trim() || 'STANDARD-CLEARING',
      accountNumberMasked: masked,
      payoutEmail: payoutEmail.trim(),
      currency,
      taxEntityType,
      status: 'Verified & Active',
      createdAt: existingStore?.payoutAccount?.createdAt || new Date().toISOString(),
    };

    const nextStore = buildDraftStore({ payoutAccount });
    upsertCreatorStore(nextStore);
    onStoreSaved(nextStore);
    setRawAccountNumber('');
    setFeedback('Payment account linked and verified for product payouts.');
    if (!nextStore.agreement?.accepted) {
      setActiveTab('agreement');
    }
  };

  const handleAcceptAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!agreedToClause) {
      setErrorMsg('Please confirm acceptance of the 5% Post-50-Sales Service Agreement clause.');
      return;
    }
    if (!signatureText.trim()) {
      setErrorMsg('Please enter your full name as an electronic signature.');
      return;
    }

    const nextStore = buildDraftStore({
      agreement: {
        accepted: true,
        version: CREATOR_SERVICE_AGREEMENT_VERSION,
        acceptedBy: user.email,
        acceptedAt: new Date().toISOString(),
        signatureText: signatureText.trim(),
        feeThresholdSales: CREATOR_FREE_SALES_THRESHOLD,
        feeRateAfterThreshold: 0.05,
      },
    });
    upsertCreatorStore(nextStore);
    onStoreSaved(nextStore);
    setFeedback(
      nextStore.payoutAccount
        ? 'Service Agreement executed! Your Online Storefront & Payment Account are active.'
        : 'Service Agreement signed! Link a Payment Account to activate payouts.'
    );
  };

  const activeDraftForDownload = buildDraftStore();

  const handleDownloadPdfAgreement = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadServiceAgreementPdf(activeDraftForDownload);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} Artist Profile & Storefront Studio`}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#12141a] border border-stone-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-900 dark:text-stone-100">
        {/* Top Header */}
        <div className="px-6 py-4 bg-stone-900 text-white border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                Creator Storefront &amp; Payout Studio · {meta.label}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {existingStore ? existingStore.storeName : `Launch Your ${meta.label} Storefront`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Creator Store Studio"
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Progress Strip */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-white/10'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>1. Artist Profile &amp; Store</span>
              {existingStore && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('payout');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'payout'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>2. Payment Account</span>
              {existingStore?.payoutAccount && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('agreement');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'agreement'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Service Agreement (5% Fee Clause)</span>
              {existingStore?.agreement?.accepted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>
          </div>

          <div className="text-xs font-mono text-stone-600 dark:text-stone-300 flex items-center gap-2">
            <span>
              Sales: <strong>{currentSalesCount}</strong> / {CREATOR_FREE_SALES_THRESHOLD}
            </span>
            <span className="text-stone-400">·</span>
            <span className={isPost50Active ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
              {isPost50Active ? '5% Site Fee Active' : `${remainingFreeSales} Fee-Free Sales Left`}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {(feedback || errorMsg) && (
          <div className="px-6 pt-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: ARTIST PROFILE & ONLINE STOREFRONT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Live Storefront Status & 50-Sales Meter */}
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-white/4 border border-stone-200 dark:border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold block">
                      Online Storefront Sales Milestone &amp; Site Service Fee Meter
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      0% site fee on your first 50 product sales; 5% paid to Site Owner on every sale after 50 sales.
                    </span>
                  </div>
                  <div
                    className={`text-right font-mono text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      isFeeFlashing ? 'animate-earnings-fee-flash' : ''
                    }`}
                  >
                    <span className="block font-bold text-stone-900 dark:text-white tabular-nums">
                      Net Creator Earnings: ${(existingStore?.creatorNetEarnings || 0).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                      Site Service Fees Paid: ${(existingStore?.siteOwnerServiceFeesPaid || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${isPost50Active ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (currentSalesCount / CREATOR_FREE_SALES_THRESHOLD) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <span className="text-stone-500 dark:text-stone-400">
                    Need your legal storefront terms? Download a formatted PDF copy anytime.
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdfAgreement()}
                    disabled={isDownloadingPdf}
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Service Agreement (PDF)'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Online Storefront Name *</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Resonance Sound Atelier"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Storefront Handle *</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@resonance-atelier"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Artist / Creator Display Name *</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Creative Specialty / Medium</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Studio Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Cape Town / Berlin / Remote"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Portfolio URL (Optional)</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://studio.example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Storefront Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Artist Statement &amp; Storefront Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Share your artistic discipline, recording/capture workflow, and licensing ethos..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-white/10">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Next step: Link a Payment Account &amp; accept the Service Agreement.
                </span>
                <div className="flex items-center gap-2.5">
                  {onProceedToUpload && existingStore?.payoutAccount && existingStore?.agreement?.accepted && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onProceedToUpload();
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{meta.uploadActionLabel}</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Save Artist Storefront
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: PAYMENT ACCOUNT FOR PRODUCTS */}
          {activeTab === 'payout' && (
            <form onSubmit={handleSavePayoutAccount} className="space-y-5">
              {existingStore?.payoutAccount && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-700/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 dark:text-white block">
                        Active Payment Account: {existingStore.payoutAccount.method} · {existingStore.payoutAccount.institutionName}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                        Account {existingStore.payoutAccount.accountNumberMasked} · Settlement Currency: {existingStore.payoutAccount.currency} · Holder: {existingStore.payoutAccount.accountHolderName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified &amp; Linked
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Payout Method *</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as PayoutMethodType)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                  >
                    {PAYOUT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Beneficiary / Legal Account Holder *</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Bank / Payment Institution *</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. FNB Commercial, Standard Bank, Mercury, Wise"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Routing / Branch / SWIFT Code</label>
                  <input
                    type="text"
                    value={routingOrSwiftCode}
                    onChange={(e) => setRoutingOrSwiftCode(e.target.value)}
                    placeholder="e.g. FIRNZAJJ / 021000021"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Account Number / IBAN / Payout Wallet ID {existingStore?.payoutAccount ? '(leave blank to keep existing)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={rawAccountNumber}
                    onChange={(e) => setRawAccountNumber(e.target.value)}
                    placeholder={existingStore?.payoutAccount ? existingStore.payoutAccount.accountNumberMasked : 'Enter account number or PayPal/Stripe ID'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Payout Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'ZAR' | 'EUR' | 'GBP')}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/10 font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Settlement Notification Email *</label>
                  <input
                    type="email"
                    value={payoutEmail}
                    onChange={(e) => setPayoutEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Creator Tax Classification</label>
                  <select
                    value={taxEntityType}
                    onChange={(e) => setTaxEntityType(e.target.value as 'Individual Creator' | 'Registered Studio / PTY')}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/10"
                  >
                    <option value="Individual Creator">Individual Creator / Sole Proprietor</option>
                    <option value="Registered Studio / PTY">Registered Studio / Business Entity</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-white/4 border border-stone-200 dark:border-white/10 flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Account numbers are automatically masked in browser records. Your payment account receives 100% of product revenue for your first 50 sales, and 95% thereafter (5% site service fee to the Site Owner).
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-200 dark:border-white/10">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Save &amp; Verify Payment Account
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SERVICE AGREEMENT & 5% POST-50-SALES CLAUSE */}
          {activeTab === 'agreement' && (
            <form onSubmit={handleAcceptAgreement} className="space-y-5">
              {/* Interactive Payout Split Preview */}
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-white/4 border border-stone-200 dark:border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Revenue Share Simulator (Sales #1–50 vs. Sales #51+):</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="calc-sample-price" className="text-stone-500 dark:text-stone-400">
                      Sample Product Price ($):
                    </label>
                    <input
                      id="calc-sample-price"
                      type="number"
                      min="1"
                      step="1"
                      value={calculatorSamplePrice}
                      onChange={(e) => setCalculatorSamplePrice(e.target.value)}
                      className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-white/15 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-emerald-500/30">
                    <span className="font-mono text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
                      First 50 Sales (Sales #1 – #50)
                    </span>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-stone-500 dark:text-stone-400">Site Owner Service Fee (0%):</span>
                      <span className="font-mono font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-stone-500 dark:text-stone-400">To Your Payment Account:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${preThresholdExample.creatorNetPayout.toFixed(2)} (100%)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-amber-500/35">
                    <span className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold block">
                      After 50 Sales (Sales #51 Onward)
                    </span>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-stone-500 dark:text-stone-400">Site Owner Service Fee (5%):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        ${postThresholdExample.siteOwnerServiceFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-stone-500 dark:text-stone-400">To Your Payment Account:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${postThresholdExample.creatorNetPayout.toFixed(2)} (95%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Clauses */}
              <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/10 max-h-64 overflow-y-auto space-y-4">
                <div className="border-b border-stone-200 dark:border-white/10 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">
                    TTG Storefront &amp; Payout Service Agreement ({CREATOR_SERVICE_AGREEMENT_VERSION})
                  </h3>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdfAgreement()}
                    disabled={isDownloadingPdf}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Agreement PDF'}</span>
                  </button>
                </div>

                {CREATOR_SERVICE_AGREEMENT_CLAUSES.map((clause) => (
                  <div
                    key={clause.number}
                    className={`space-y-1 p-3 rounded-lg ${
                      clause.number === 'Clause 3'
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60'
                        : ''
                    }`}
                  >
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                      {clause.number} — {clause.title}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {clause.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Electronic Signature & Acceptance */}
              <div className="space-y-3 p-4 rounded-xl bg-white dark:bg-white/4 border border-stone-200 dark:border-white/10">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Electronic Signature (Full Legal Name of Store Creator) *
                  </label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Type your full name to execute agreement"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 font-serif"
                    required
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToClause}
                    onChange={(e) => setAgreedToClause(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    I accept the <strong>TTG Creator Storefront Service Agreement</strong>, including{' '}
                    <strong>Clause 3</strong> establishing a <strong>0% fee for my first 50 sales</strong> and a{' '}
                    <strong>5% Site Service Fee payable to the Site Owner on every sale after 50 sales</strong>.
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdfAgreement()}
                    disabled={isDownloadingPdf}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Service Agreement (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSignedServiceAgreement(activeDraftForDownload)}
                    className="px-3 py-2 rounded-xl border border-stone-300 dark:border-white/15 text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>.txt Copy</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {onProceedToUpload && existingStore?.payoutAccount && agreedToClause && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onProceedToUpload();
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{meta.uploadActionLabel}</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-sm"
                  >
                    {existingStore?.agreement?.accepted ? 'Update Executed Agreement' : 'Sign & Activate Agreement'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
