import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Copy,
  Check,
  Download,
  Code2,
  AlertTriangle,
  Scale,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LearnerAppealRecord,
  StudyGuide,
  UserProfile,
  VerifiedCertificateRecord,
} from '../types';
import { AppealsPortalSection } from './AppealsPortalSection';
import { TaiOneW3CAccreditationPanel } from './TaiOneW3CAccreditationPanel';
import { CertificateVerificationBadge } from './CertificateVerificationBadge';

export interface CertificateVerificationTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  studyGuides: StudyGuide[];
  initialSerial?: string | null;
  initialAppealCourseId?: string | null;
  initialAppealCourseTitle?: string | null;
  onClearInitialSerial?: () => void;
  onRequireAuth?: (action: () => void, message: string) => void;
  onOpenAccreditationModal?: () => void;
}

interface VerificationApiResponse {
  found: boolean;
  signatureValid: boolean;
  certificate: VerifiedCertificateRecord | null;
  checkedAt: string;
}

export const CertificateVerificationTab: React.FC<CertificateVerificationTabProps> = ({
  user,
  isAuthenticated,
  studyGuides,
  initialSerial,
  initialAppealCourseId,
  initialAppealCourseTitle,
  onClearInitialSerial,
  onRequireAuth,
  onOpenAccreditationModal,
}) => {
  const [serialInput, setSerialInput] = useState<string>(
    initialSerial || 'TTG-AI-2026-88219-EARCH'
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationApiResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recentLedgerCerts, setRecentLedgerCerts] = useState<VerifiedCertificateRecord[]>([]);
  const [showJsonLd, setShowJsonLd] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const [appealPrefill, setAppealPrefill] = useState<{
    courseId?: string | null;
    courseTitle?: string | null;
    serialNumber?: string | null;
  }>({
    courseId: initialAppealCourseId || null,
    courseTitle: initialAppealCourseTitle || null,
    serialNumber: initialSerial || null,
  });

  const runVerificationLookup = async (targetSerial: string) => {
    const clean = targetSerial.trim().toUpperCase();
    if (!clean) return;
    setIsVerifying(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(clean)}`);
      if (!res.ok) throw new Error('Verification service unavailable.');
      const data = (await res.json()) as VerificationApiResponse;
      setVerificationResult(data);
    } catch (err: any) {
      setLookupError(err?.message || 'Failed to verify certificate serial.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadLedgerDirectory = async () => {
    try {
      const res = await fetch('/api/certificates');
      if (!res.ok) return;
      const data = (await res.json()) as { certificates?: VerifiedCertificateRecord[] };
      if (Array.isArray(data.certificates)) {
        setRecentLedgerCerts(data.certificates.slice(0, 6));
      }
    } catch {
      // Ignore silent directory error
    }
  };

  useEffect(() => {
    void loadLedgerDirectory();
  }, []);

  useEffect(() => {
    const target = initialSerial?.trim();
    if (target) {
      setSerialInput(target);
      void runVerificationLookup(target);
    } else {
      void runVerificationLookup('TTG-AI-2026-88219-EARCH');
    }
  }, [initialSerial]);

  useEffect(() => {
    if (initialAppealCourseId || initialAppealCourseTitle || initialSerial) {
      setAppealPrefill({
        courseId: initialAppealCourseId || null,
        courseTitle: initialAppealCourseTitle || null,
        serialNumber: initialSerial || null,
      });
    }
  }, [initialAppealCourseId, initialAppealCourseTitle, initialSerial]);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    onClearInitialSerial?.();
    const clean = serialInput.trim().toUpperCase();
    try {
      window.history.replaceState({}, '', `/verify/${encodeURIComponent(clean)}`);
    } catch {
      // Ignore history restrictions in sandbox
    }
    void runVerificationLookup(clean);
  };

  const handleCopyVerifyUrl = async (serial: string) => {
    const shareUrl = `${window.location.origin}/verify/${encodeURIComponent(serial)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore clipboard fallback
    }
  };

  const handleDownloadOpenBadgeJson = (cert: VerifiedCertificateRecord) => {
    const payload = JSON.stringify(cert.openBadgeCredential || cert, null, 2);
    const blob = new Blob([payload], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${cert.serialNumber}_OpenBadge_VC.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleStartAppealFromCert = (cert: VerifiedCertificateRecord) => {
    setAppealPrefill({
      courseId: cert.courseId,
      courseTitle: cert.courseTitle,
      serialNumber: cert.serialNumber,
    });
    document
      .getElementById('learner-appeals-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAppealSubmitted = (appeal: LearnerAppealRecord) => {
    if (
      appeal.certificateSerial &&
      verificationResult?.certificate?.serialNumber === appeal.certificateSerial
    ) {
      void runVerificationLookup(appeal.certificateSerial);
    }
    void loadLedgerDirectory();
  };

  const cert = verificationResult?.certificate || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-900 dark:text-stone-100">
      {/* Header & Verification Search Focal Card */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Public Credential Verification Registry · 1EdTech Open Badges 3.0 Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Certificate Verification &amp; Regulatory Appeals
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Employers, moderators, and learners can verify any TTG completion serial number against the server-signed HMAC-SHA256 ledger, inspect the W3C Verifiable Credential JSON-LD proof, or lodge a formal assessment appeal.
            </p>
          </div>

          {onOpenAccreditationModal && (
            <button
              type="button"
              onClick={onOpenAccreditationModal}
              className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Regulatory Pathways &amp; QMS</span>
            </button>
          )}
        </div>

        {/* Serial Lookup Bar */}
        <form onSubmit={handleVerifySubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Enter certificate serial (e.g. TTG-AI-2026-88219-EARCH)"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-mono text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !serialInput.trim()}
              className="px-6 py-2.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Checking Ledger…' : 'Verify Serial'}</span>
            </button>
          </div>

          {recentLedgerCerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-500 dark:text-stone-400">
              <span>Quick Ledger Samples:</span>
              {recentLedgerCerts.slice(0, 3).map((item, idx) => (
                <React.Fragment key={item.serialNumber}>
                  {idx > 0 && <span aria-hidden="true">/</span>}
                  <button
                    type="button"
                    onClick={() => {
                      setSerialInput(item.serialNumber);
                      void runVerificationLookup(item.serialNumber);
                    }}
                    className="font-mono text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 underline underline-offset-2 cursor-pointer tabular-nums"
                  >
                    {item.serialNumber}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </form>

        {/* Verification Output */}
        {lookupError ? (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        ) : verificationResult && !verificationResult.found ? (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/60 dark:bg-rose-950/30 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-300">
              <span aria-hidden="true">▲</span>
              <span>NOT FOUND IN VERIFICATION LEDGER</span>
            </div>
            <p className="text-xs text-rose-900/80 dark:text-rose-200/80">
              No issued certificate matches serial <strong className="font-mono">{serialInput.trim().toUpperCase()}</strong>. Confirm the serial code or submit a verification dispute below if you completed this course on TTG.
            </p>
          </div>
        ) : cert ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  {cert.status === 'verified' && verificationResult?.signatureValid ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ● VERIFIED · HMAC-SHA256 SIGNATURE VALID
                    </span>
                  ) : cert.status === 'under_appeal' ? (
                    <span className="text-amber-700 dark:text-amber-400">
                      ◐ UNDER MODERATOR APPEAL REVIEW
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400">
                      ▲ REVOKED / SIGNATURE MISMATCH
                    </span>
                  )}
                  <span aria-hidden="true" className="text-stone-400">·</span>
                  <span className="font-mono text-stone-600 dark:text-stone-400 tabular-nums">
                    Checked {new Date(verificationResult?.checkedAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  {cert.credentialTitle}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Course: {cert.courseTitle} · Category: {cert.categoryKey}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleCopyVerifyUrl(cert.serialNumber)}
                  className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Verification URL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartAppealFromCert(cert)}
                  className="px-3.5 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-semibold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Dispute / File Appeal</span>
                </button>
              </div>
            </div>

            {/* Key Credential Telemetry Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-stone-500 dark:text-stone-400 block mb-0.5">
                  Recipient
                </span>
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {cert.recipientName}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block mb-0.5">
                  Serial Number
                </span>
                <span className="font-mono font-bold tabular-nums text-stone-900 dark:text-stone-100">
                  {cert.serialNumber}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block mb-0.5">
                  Completion &amp; Assessment
                </span>
                <span className="font-mono font-bold tabular-nums text-stone-900 dark:text-stone-100">
                  {cert.progressPercent}% Complete
                  {typeof cert.quizScore === 'number' ? ` · ${cert.quizScore}% Score` : ''}
                </span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block mb-0.5">
                  Issued Date &amp; Authority
                </span>
                <span className="font-mono font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                  {cert.issueDate}
                </span>
              </div>
            </div>

            {/* Generated Cryptographic Verification Badge */}
            <CertificateVerificationBadge
              serialNumber={cert.serialNumber}
              credentialTitle={cert.credentialTitle}
              recipientName={cert.recipientName}
              issueDate={cert.issueDate}
              accreditor={cert.accreditor}
              accreditationTier={cert.accreditationTier}
              signatureHash={cert.signatureHash}
              status={
                cert.status === 'verified' && verificationResult?.signatureValid
                  ? 'verified'
                  : cert.status === 'under_appeal'
                  ? 'under_appeal'
                  : 'revoked'
              }
            />

            {/* Cryptographic Hash & Open Badges Actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-stone-500 dark:text-stone-400 block">
                  {cert.signatureAlgorithm} Verification Digest
                </span>
                <code className="font-mono text-[11px] text-stone-800 dark:text-stone-300 break-all tabular-nums">
                  {cert.signatureHash}
                </code>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowJsonLd((prev) => !prev)}
                  className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showJsonLd ? 'Hide Open Badges JSON-LD' : 'Inspect Open Badges 3.0 JSON-LD'}</span>
                  {showJsonLd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadOpenBadgeJson(cert)}
                  className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download VC (.json)</span>
                </button>
              </div>
            </div>

            {showJsonLd && cert.openBadgeCredential && (
              <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-100 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">
                    1EdTech Open Badges 3.0 / W3C VerifiableCredential
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify(cert.openBadgeCredential, null, 2)
                        );
                        setCopiedJson(true);
                        window.setTimeout(() => setCopiedJson(false), 2000);
                      } catch {}
                    }}
                    className="text-xs text-stone-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON-LD'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono overflow-x-auto leading-relaxed max-h-72 text-stone-200">
                  {JSON.stringify(cert.openBadgeCredential, null, 2)}
                </pre>
              </div>
            )}

            {/* Accredited Tier Verification Disclosure */}
            <p className="text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-3">
              Accreditation Status:{' '}
              {cert.accreditationTier === 'accredited_external' ||
              /tai-one|w3c|external/i.test(cert.accreditor) ? (
                <>
                  <strong>Accredited External</strong> credential verified via{' '}
                  <strong>{cert.accreditor}</strong> with W3C Verifiable Credentials v2.0 &amp;
                  1EdTech Open Badges 3.0 cryptographic integrity.
                </>
              ) : (
                <>
                  <strong>Accredited Internal</strong> institutional credential verified via{' '}
                  <strong>{cert.accreditor}</strong> under TTG Internal Accreditation Board
                  standards.
                </>
              )}
            </p>
          </div>
        ) : null}
      </section>

      {/* Tai-One W3C Certification Accreditation Generator & Registry */}
      <TaiOneW3CAccreditationPanel
        user={user}
        studyGuides={studyGuides}
        onAccreditationGenerated={() => {
          void loadLedgerDirectory();
        }}
        onVerifySerial={(serial) => {
          setSerialInput(serial);
          void runVerificationLookup(serial);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Learner Assessment & Verification Appeals Section */}
      <AppealsPortalSection
        user={user}
        isAuthenticated={isAuthenticated}
        studyGuides={studyGuides}
        initialCourseId={appealPrefill.courseId}
        initialCourseTitle={appealPrefill.courseTitle}
        initialSerialNumber={appealPrefill.serialNumber}
        onAppealSubmitted={handleAppealSubmitted}
        onRequireAuth={onRequireAuth}
        onVerifySerial={(serial) => {
          setSerialInput(serial);
          void runVerificationLookup(serial);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
