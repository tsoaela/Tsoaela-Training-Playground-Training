import jsPDF from 'jspdf';
import { ArtPlatformId, CreatorStoreProfile } from '../types';
import { getFittedLogoSize, loadLogoDataUrl } from './pdfBranding';

export const CREATOR_STORES_STORAGE_KEY = 'ttg_creator_stores_v1';
export const FEE_FLASH_STORAGE_PREFIX = 'ttg_last_fee_flash_';
export const CREATOR_FREE_SALES_THRESHOLD = 50;
export const CREATOR_POST_THRESHOLD_FEE_RATE = 0.05; // 5% after 50 sales
export const CREATOR_SERVICE_AGREEMENT_VERSION = 'TTG-CREATOR-SA-2026-v1.0';

export interface CreatorStoreUpdateDetail {
  platform: ArtPlatformId;
  storeId: string;
  feeDeducted: boolean;
  feeAmount: number;
  creatorNetPayout: number;
  grossAmount: number;
  saleNumber: number;
  triggeredAt: number;
}

export function getRecentFeeFlashForPlatform(
  platform: ArtPlatformId,
  maxAgeMs = 8000
): CreatorStoreUpdateDetail | null {
  try {
    const raw = sessionStorage.getItem(`${FEE_FLASH_STORAGE_PREFIX}${platform}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CreatorStoreUpdateDetail;
    if (!parsed.feeDeducted || Date.now() - parsed.triggeredAt > maxAgeMs) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearFeeFlashForPlatform(platform: ArtPlatformId): void {
  try {
    sessionStorage.removeItem(`${FEE_FLASH_STORAGE_PREFIX}${platform}`);
  } catch {
    // Ignore storage restrictions
  }
}

export interface PlatformMeta {
  id: ArtPlatformId;
  label: string;
  creatorTitle: string;
  uploadActionLabel: string;
  defaultSpecialty: string;
  accentClass: string;
}

export const ART_PLATFORM_META: Record<ArtPlatformId, PlatformMeta> = {
  music: {
    id: 'music',
    label: 'Music Studio & Audio Store',
    creatorTitle: 'Music Producer / Recording Artist',
    uploadActionLabel: 'Upload Release to Store',
    defaultSpecialty: 'Electronic, Acoustic & Modular Masters',
    accentClass: 'emerald',
  },
  photography: {
    id: 'photography',
    label: 'Fine Art Photography Store',
    creatorTitle: 'Fine Art & Commercial Photographer',
    uploadActionLabel: 'Upload Photo to Store',
    defaultSpecialty: 'Medium-Format & Editorial Imagery',
    accentClass: 'amber',
  },
  videography: {
    id: 'videography',
    label: 'Cinema & Videography Store',
    creatorTitle: 'Director / Cinematographer',
    uploadActionLabel: 'Upload Footage to Store',
    defaultSpecialty: '4K / ProRes Cinema Stock',
    accentClass: 'rose',
  },
  bookstore: {
    id: 'bookstore',
    label: 'Authors Press & Book Store',
    creatorTitle: 'Independent Author / Scholar',
    uploadActionLabel: 'Upload Book to Store',
    defaultSpecialty: 'Academic & Literary Manuscripts',
    accentClass: 'purple',
  },
  digital_art: {
    id: 'digital_art',
    label: 'Digital World Art Studio',
    creatorTitle: 'Multimedia & Spatial Artist',
    uploadActionLabel: 'Upload Art Stream',
    defaultSpecialty: 'Audio DSP, Generative Visuals & Murals',
    accentClass: 'cyan',
  },
};

export interface ServiceAgreementClause {
  number: string;
  title: string;
  body: string;
}

export const CREATOR_SERVICE_AGREEMENT_CLAUSES: ServiceAgreementClause[] = [
  {
    number: 'Clause 1',
    title: 'Online Storefront Grant & Intellectual Property Retention',
    body:
      'The Store Creator retains 100% ownership and copyright over all uploaded audio masters, photographs, cinema reels, visual artworks, and manuscripts. By publishing products to TTG - Tsoaela Training Ground Platform ("Site Owner"), the Creator grants the Site Owner a non-exclusive, revocable license to host, stream watermarked previews, process buyer checkout orders, and deliver licensed copies to purchasers.',
  },
  {
    number: 'Clause 2',
    title: 'Creator Payment Account Registration & Payout Settlement',
    body:
      'Before listing monetized works in an online storefront, the Store Creator must configure and maintain an active Payment Account (Stripe Connect Express, Bank Wire/ACH, PayPal Business, or Instant EFT/Mobile Money) with accurate legal beneficiary details. All net proceeds due to the Store Creator are settled exclusively to the active linked Payment Account.',
  },
  {
    number: 'Clause 3',
    title: 'Progressive Site Service Fee — 0% for First 50 Sales & 5% Service Fee Thereafter',
    body:
      'To support emerging independent creators, the Site Owner waives platform service commission for the Store Creator’s initial fifty (50) completed product sales ("Zero-Fee Launch Tier"). Immediately upon the completion of fifty (50) sales—commencing strictly on the fifty-first (51st) sale and applying to every product sale thereafter—a mandatory 5% Site Service Fee (five percent of gross product sale price) shall be deducted per transaction and paid directly to the Site Owner, with the remaining 95% credited to the Store Creator’s Payment Account.',
  },
  {
    number: 'Clause 4',
    title: 'Originality Warranty, Buyer Licensing & Dispute Settlement',
    body:
      'The Store Creator warrants that every uploaded file is original or cleared for commercial redistribution without third-party encumbrance. Validated buyer receipts and digital license certificates remain enforceable across all completed sales. Chargebacks or verified copyright claims may be offset against unsettled balances.',
  },
  {
    number: 'Clause 5',
    title: 'Term, Storefront Suspension & Agreement Modification',
    body:
      'This Agreement takes effect upon electronic signature below and applies across the Creator’s active storefront. The Store Creator may update payment details or unpublish listings at any time, while preserving fulfillment access for existing buyers. The 5% post-50-sale fee schedule remains binding for all transactions exceeding fifty cumulative storefront sales.',
  },
];

export interface SaleSplitCalculation {
  saleNumber: number;
  isPostThresholdFeeActive: boolean;
  feeRate: number;
  grossAmount: number;
  siteOwnerServiceFee: number;
  creatorNetPayout: number;
  freeSalesRemainingAfterThisSale: number;
}

export function computeCreatorSaleSplit(
  previousCompletedSales: number,
  grossAmount: number
): SaleSplitCalculation {
  const safePrev = Math.max(0, Math.floor(previousCompletedSales));
  const safeGross = Number(Math.max(0, grossAmount).toFixed(2));
  const saleNumber = safePrev + 1;
  // Paid to site owner AFTER 50 sales (i.e., from sale #51 onward)
  const isPostThresholdFeeActive = safePrev >= CREATOR_FREE_SALES_THRESHOLD;
  const feeRate = isPostThresholdFeeActive ? CREATOR_POST_THRESHOLD_FEE_RATE : 0;
  const siteOwnerServiceFee = Number((safeGross * feeRate).toFixed(2));
  const creatorNetPayout = Number((safeGross - siteOwnerServiceFee).toFixed(2));
  const freeSalesRemainingAfterThisSale = Math.max(0, CREATOR_FREE_SALES_THRESHOLD - saleNumber);

  return {
    saleNumber,
    isPostThresholdFeeActive,
    feeRate,
    grossAmount: safeGross,
    siteOwnerServiceFee,
    creatorNetPayout,
    freeSalesRemainingAfterThisSale,
  };
}

export function maskAccountNumber(rawInput: string): string {
  const cleaned = rawInput.replace(/\s+/g, '').trim();
  if (!cleaned) return '•••• 0000';
  if (cleaned.includes('@')) {
    const [local, domain] = cleaned.split('@');
    const visible = local.slice(0, Math.min(3, local.length));
    return `${visible}•••@${domain}`;
  }
  const last4 = cleaned.slice(-4);
  return `•••• ${last4}`;
}

export function loadCreatorStores(): CreatorStoreProfile[] {
  try {
    const raw = localStorage.getItem(CREATOR_STORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCreatorStores(stores: CreatorStoreProfile[]): void {
  try {
    localStorage.setItem(CREATOR_STORES_STORAGE_KEY, JSON.stringify(stores));
  } catch {
    // Ignore private storage restrictions
  }
}

export function getStoreForUserAndPlatform(
  userId: string,
  platform: ArtPlatformId
): CreatorStoreProfile | null {
  const stores = loadCreatorStores();
  return (
    stores.find((s) => s.ownerUserId === userId && s.platform === platform) || null
  );
}

export function upsertCreatorStore(store: CreatorStoreProfile): CreatorStoreProfile[] {
  const existing = loadCreatorStores();
  const idx = existing.findIndex(
    (s) =>
      s.id === store.id ||
      (s.ownerUserId === store.ownerUserId && s.platform === store.platform)
  );
  const next = [...existing];
  if (idx >= 0) {
    next[idx] = store;
  } else {
    next.unshift(store);
  }
  saveCreatorStores(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ttg-creator-store-updated'));
  }
  return next;
}

export function recordPlatformSaleForCreator(params: {
  platform: ArtPlatformId;
  creatorName: string;
  creatorId?: string;
  grossAmount: number;
}): {
  updatedStore: CreatorStoreProfile | null;
  split: SaleSplitCalculation | null;
} {
  const stores = loadCreatorStores();
  const normalizedName = params.creatorName.trim().toLowerCase();

  const matchIdx = stores.findIndex(
    (s) =>
      s.platform === params.platform &&
      (s.ownerUserId === params.creatorId ||
        s.id === params.creatorId ||
        s.artistName.trim().toLowerCase() === normalizedName ||
        s.storeName.trim().toLowerCase() === normalizedName)
  );

  if (matchIdx < 0) {
    return { updatedStore: null, split: null };
  }

  const target = stores[matchIdx];
  const split = computeCreatorSaleSplit(target.completedSalesCount, params.grossAmount);
  const updatedStore: CreatorStoreProfile = {
    ...target,
    completedSalesCount: split.saleNumber,
    grossRevenue: Number((target.grossRevenue + split.grossAmount).toFixed(2)),
    creatorNetEarnings: Number((target.creatorNetEarnings + split.creatorNetPayout).toFixed(2)),
    siteOwnerServiceFeesPaid: Number(
      (target.siteOwnerServiceFeesPaid + split.siteOwnerServiceFee).toFixed(2)
    ),
  };

  const nextStores = [...stores];
  nextStores[matchIdx] = updatedStore;
  saveCreatorStores(nextStores);

  const feeDeducted =
    split.isPostThresholdFeeActive && split.siteOwnerServiceFee > 0;
  const detail: CreatorStoreUpdateDetail = {
    platform: params.platform,
    storeId: updatedStore.id,
    feeDeducted,
    feeAmount: split.siteOwnerServiceFee,
    creatorNetPayout: split.creatorNetPayout,
    grossAmount: split.grossAmount,
    saleNumber: split.saleNumber,
    triggeredAt: Date.now(),
  };

  if (feeDeducted && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(
        `${FEE_FLASH_STORAGE_PREFIX}${params.platform}`,
        JSON.stringify(detail)
      );
    } catch {
      // Ignore storage restrictions
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<CreatorStoreUpdateDetail>('ttg-creator-store-updated', {
        detail,
      })
    );
  }

  return { updatedStore, split };
}

export async function downloadServiceAgreementPdf(
  store: CreatorStoreProfile
): Promise<void> {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const agreement = store.agreement;
  const payout = store.payoutAccount;
  const platformLabel = ART_PLATFORM_META[store.platform].label;

  let y = 14;

  // Header band
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 34, 'F');

  let textStartX = margin;
  if (logoDataUrl) {
    const fitted = getFittedLogoSize(26, 15);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 8, fitted.width + 3, fitted.height + 3, 2, 2, 'F');
    doc.addImage(logoDataUrl, 'JPEG', margin + 1.5, 9.5, fitted.width, fitted.height);
    textStartX = margin + fitted.width + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 211, 153);
  doc.text('TTG - TSOAELA TRAINING GROUND PLATFORM', textStartX, 13);

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Creator Storefront & Payout Service Agreement', textStartX, 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Agreement Version: ${agreement?.version || CREATOR_SERVICE_AGREEMENT_VERSION}   ·   Portal: ${platformLabel}`,
    textStartX,
    27
  );

  y = 43;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // Storefront & Execution Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STOREFRONT & AGREEMENT EXECUTION DETAILS', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Online Storefront : ${store.storeName} (${store.handle})`, margin + 4, y + 13);
  doc.text(`Creator / Artist  : ${store.artistName}`, margin + 4, y + 18.5);
  doc.text(
    `Agreement Status  : ${agreement?.accepted ? 'EXECUTED & BINDING' : 'DRAFT PREVIEW (PENDING SIGNATURE)'}`,
    margin + 4,
    y + 24
  );
  doc.text(
    `Signed By         : ${agreement?.signatureText || store.artistName}   |   Date: ${
      agreement?.acceptedAt
        ? new Date(agreement.acceptedAt).toLocaleString()
        : new Date().toLocaleDateString()
    }`,
    margin + 4,
    y + 29.5
  );

  y += 43;

  // Linked Payment Account & Progressive Fee Summary
  ensureSpace(34);
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, 30, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 59);
  doc.text('LINKED PAYMENT ACCOUNT & PROGRESSIVE 5% FEE LEDGER', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 83, 45);
  doc.text(
    payout
      ? `Payout Method: ${payout.method} · ${payout.institutionName} (${payout.accountNumberMasked}) · Currency: ${payout.currency}`
      : 'Payment Account: Not linked yet (Configure inside Store Management Profile)',
    margin + 4,
    y + 13
  );
  doc.text(
    `Fee Schedule : Sales #1–50 = 0% Site Service Fee (100% Creator)  |  Sales #51+ = 5% Site Service Fee (95% Creator)`,
    margin + 4,
    y + 18.5
  );
  doc.text(
    `Live Totals  : ${store.completedSalesCount} Completed Sales  ·  Gross: $${store.grossRevenue.toFixed(
      2
    )}  ·  Net Earnings: $${store.creatorNetEarnings.toFixed(
      2
    )}  ·  5% Site Fees Paid: $${store.siteOwnerServiceFeesPaid.toFixed(2)}`,
    margin + 4,
    y + 24
  );

  y += 38;

  // Agreement Clauses Header
  ensureSpace(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BINDING SERVICE AGREEMENT CLAUSES', margin, y);
  y += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Clauses Loop
  for (const clause of CREATOR_SERVICE_AGREEMENT_CLAUSES) {
    const wrappedLines = doc.splitTextToSize(clause.body, contentWidth - 8);
    const blockHeight = 11 + wrappedLines.length * 4.3 + 5;
    ensureSpace(blockHeight);

    const isFeeClause = clause.number === 'Clause 3';
    if (isFeeClause) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(252, 211, 77);
    } else {
      doc.setFillColor(250, 250, 249);
      doc.setDrawColor(231, 229, 228);
    }

    doc.roundedRect(margin, y, contentWidth, blockHeight - 2, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(isFeeClause ? 146 : 15, isFeeClause ? 64 : 23, isFeeClause ? 14 : 42);
    doc.text(`${clause.number} — ${clause.title}`, margin + 4, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text(wrappedLines, margin + 4, y + 12);

    y += blockHeight + 2;
  }

  // Electronic Signature Footer Block
  ensureSpace(24);
  y += 2;
  doc.setDrawColor(16, 185, 129);
  doc.line(margin, y, margin + 80, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Electronic Signature: ${agreement?.signatureText || store.artistName}`,
    margin,
    y + 5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Issued for ${store.storeName} (${store.handle}) · Generated ${new Date().toLocaleDateString()}`,
    margin,
    y + 10
  );

  // Page Footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'TTG - Tsoaela Training Ground Platform · Creator Storefront Service Agreement',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 18, pageHeight - 8);
  }

  const slug = store.handle.replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`TTG_Service_Agreement_${slug || 'storefront'}.pdf`);
}

export function downloadSignedServiceAgreement(store: CreatorStoreProfile): void {
  const agreement = store.agreement;
  const payout = store.payoutAccount;
  const lines = [
    '========================================================================',
    '  TTG - TSOAELA TRAINING GROUND PLATFORM :: CREATOR SERVICE AGREEMENT   ',
    '========================================================================',
    '',
    `Agreement Version      : ${agreement?.version || CREATOR_SERVICE_AGREEMENT_VERSION}`,
    `Platform Storefront    : ${store.storeName} (${store.handle})`,
    `Art Discipline         : ${ART_PLATFORM_META[store.platform].label}`,
    `Store Creator / Artist : ${store.artistName}`,
    `Status                 : ${agreement?.accepted ? 'EXECUTED & BINDING' : 'DRAFT'}`,
    `Signed By              : ${agreement?.signatureText || store.artistName}`,
    `Acceptance Timestamp   : ${agreement?.acceptedAt || new Date().toISOString()}`,
    '',
    'LINKED CREATOR PAYMENT ACCOUNT',
    '------------------------------------------------------------------------',
    payout
      ? `Method: ${payout.method} | Institution: ${payout.institutionName} | Account: ${payout.accountNumberMasked} (${payout.currency})`
      : 'No Payment Account linked yet.',
    '',
    'PROGRESSIVE SERVICE FEE SCHEDULE',
    '------------------------------------------------------------------------',
    `Sales 1 – 50           : 0% Site Owner Service Fee (100% gross product payout)`,
    `Sales 51+              : 5% Site Owner Service Fee (95% creator payout)`,
    `Current Sales Counter  : ${store.completedSalesCount} completed sales`,
    `Total Site Fees Paid   : $${store.siteOwnerServiceFeesPaid.toFixed(2)}`,
    '',
    'AGREEMENT CLAUSES',
    '------------------------------------------------------------------------',
    ...CREATOR_SERVICE_AGREEMENT_CLAUSES.flatMap((c) => [
      `${c.number}: ${c.title}`,
      c.body,
      '',
    ]),
    '========================================================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = store.handle.replace(/[^a-zA-Z0-9_-]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `TTG_Creator_Service_Agreement_${slug || 'storefront'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
