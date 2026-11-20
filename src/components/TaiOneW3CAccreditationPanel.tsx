import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  Code2,
  Copy,
  Download,
  FileCheck2,
  Globe,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  AccreditationTier,
  StudyGuide,
  TaiOneW3CAccreditationRecord,
  UserProfile,
} from '../types';
import { getFittedLogoSize, loadLogoDataUrl, TAI_ONE_LOGO_URL } from '../utils/pdfBranding';

export interface TaiOneW3CAccreditationPanelProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  onVerifySerial?: (serial: string) => void;
  onAccreditationGenerated?: (record: TaiOneW3CAccreditationRecord) => void;
  compactHeader?: boolean;
}

export const TaiOneW3CAccreditationPanel: React.FC<TaiOneW3CAccreditationPanelProps> = ({
  user,
  studyGuides,
  onVerifySerial,
  onAccreditationGenerated,
  compactHeader = false,
}) => {
  const accreditedGuides = useMemo(
    () => studyGuides.filter((g) => g.is_accredited !== false),
    [studyGuides]
  );

  const [accreditationTier, setAccreditationTier] =
    useState<AccreditationTier>('accredited_external');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    () => accreditedGuides[0]?.id || 'custom'
  );
  const [programTitle, setProgramTitle] = useState<string>(
    () =>
      accreditedGuides[0]?.title ||
      'W3C Verifiable AI Systems & Cryptographic Governance'
  );
  const [categoryKey, setCategoryKey] = useState<string>(
    () => accreditedGuides[0]?.category || 'Frontier AI & Systems'
  );
  const [recipientName, setRecipientName] = useState<string>(
    () => user.name || 'Tsoaelat S.'
  );
  const [recipientEmail, setRecipientEmail] = useState<string>(
    () => user.email || 'Tsoaelat.s@gmail.com'
  );
  const [organizationName, setOrganizationName] = useState<string>(
    () => user.institution || 'TTG - Tsoaela Training Ground Platform'
  );
  const [nqfCreditsReference, setNqfCreditsReference] = useState<string>(
    'NQF Level 7 · 15 Accredited Credits'
  );

  const [records, setRecords] = useState<TaiOneW3CAccreditationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExportingPdfId, setIsExportingPdfId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'all' | AccreditationTier>('all');
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchAccreditations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/accreditation/tai-one-w3c');
      if (!res.ok) throw new Error('Unable to fetch Tai-One W3C accreditations');
      const data = (await res.json()) as {
        accreditations?: TaiOneW3CAccreditationRecord[];
      };
      if (Array.isArray(data.accreditations)) {
        setRecords(data.accreditations);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccreditations();
  }, [fetchAccreditations]);

  const handleCourseSelectChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId === 'custom') return;
    const match = accreditedGuides.find((g) => g.id === courseId);
    if (match) {
      setProgramTitle(match.title);
      setCategoryKey(match.category || match.field || 'Frontier AI & Systems');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programTitle.trim() || !recipientName.trim()) {
      setStatusBanner({
        type: 'error',
        message: 'Program title and recipient name are required to mint a Tai-One W3C credential.',
      });
      return;
    }

    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/accreditation/tai-one-w3c/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accreditationTier,
          programTitle: programTitle.trim(),
          courseId: selectedCourseId !== 'custom' ? selectedCourseId : undefined,
          categoryKey: categoryKey.trim() || 'Frontier AI & Systems',
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || 'scholar@ttg-platform.local',
          organizationName:
            organizationName.trim() || 'TTG - Tsoaela Training Ground Platform',
          nqfCreditsReference:
            nqfCreditsReference.trim() || 'NQF Level 7 · 15 Accredited Credits',
          userId: user.id || 'user_88219',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.accreditation) {
        throw new Error(data?.error || 'Accreditation generation failed.');
      }

      const minted = data.accreditation as TaiOneW3CAccreditationRecord;
      setRecords((prev) => [minted, ...prev.filter((r) => r.id !== minted.id)]);
      setExpandedJsonId(minted.id);
      setStatusBanner({
        type: 'success',
        message: `Generated ${minted.serialNumber} (${
          minted.accreditationTier === 'accredited_external'
            ? 'Tai-One W3C Accredited External'
            : 'TTG Accredited Internal'
        }) and registered in the public HMAC-SHA256 verification ledger.`,
      });
      onAccreditationGenerated?.(minted);
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to generate Tai-One W3C certification accreditation.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJsonLd = async (rec: TaiOneW3CAccreditationRecord) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(rec.w3cVerifiableCredential, null, 2)
      );
      setCopiedId(rec.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Ignore clipboard fallback
    }
  };

  const handleDownloadJsonLd = (rec: TaiOneW3CAccreditationRecord) => {
    const payload = JSON.stringify(rec.w3cVerifiableCredential, null, 2);
    const blob = new Blob([payload], { type: 'application/ld+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${rec.serialNumber}_TaiOne_W3C_Accreditation.jsonld`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPdfCertificate = async (rec: TaiOneW3CAccreditationRecord) => {
    setIsExportingPdfId(rec.id);
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pageW = 297;
      const pageH = 210;
      const isExternal = rec.accreditationTier === 'accredited_external';

      // Deep emerald-forest background & luminous borders
      doc.setFillColor(2, 44, 34);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFillColor(5, 46, 22);
      doc.roundedRect(8, 8, pageW - 16, pageH - 16, 4, 4, 'F');
      doc.setFillColor(4, 38, 28);
      doc.roundedRect(14, 14, pageW - 28, pageH - 28, 3, 3, 'F');

      doc.setDrawColor(163, 184, 40);
      doc.setLineWidth(1.3);
      doc.roundedRect(10, 10, pageW - 20, pageH - 20, 4, 4, 'S');
      doc.setDrawColor(190, 242, 100);
      doc.setLineWidth(0.45);
      doc.roundedRect(14, 14, pageW - 28, pageH - 28, 3, 3, 'S');
      doc.setDrawColor(202, 138, 4);
      doc.setLineWidth(0.35);
      doc.roundedRect(17, 17, pageW - 34, pageH - 34, 2, 2, 'S');

      let headerX = 24;
      if (logoDataUrl) {
        const badgeW = 40;
        const badgeH = 23;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(190, 242, 100);
        doc.setLineWidth(0.5);
        doc.roundedRect(24, 22, badgeW, badgeH, 2.5, 2.5, 'FD');
        const fitted = getFittedLogoSize(badgeW - 3, badgeH - 3);
        doc.addImage(
          logoDataUrl,
          'JPEG',
          24 + (badgeW - fitted.width) / 2,
          22 + (badgeH - fitted.height) / 2,
          fitted.width,
          fitted.height
        );
        headerX = 24 + badgeW + 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(190, 242, 100);
      doc.text(
        isExternal
          ? 'TAI-ONE W3C CERTIFICATION AUTHORITY · ACCREDITED EXTERNAL'
          : 'TTG ACCREDITATION BOARD · ACCREDITED INTERNAL',
        headerX,
        29
      );

      doc.setFontSize(11);
      doc.setTextColor(254, 252, 232);
      doc.text(rec.authorityName.toUpperCase(), headerX, 35.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(163, 230, 53);
      doc.text(`Issuer DID: ${rec.issuerDid}`, headerX, 41.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(217, 249, 157);
      doc.text(`SERIAL: ${rec.serialNumber}`, pageW - 24, 29, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(163, 230, 53);
      doc.text(rec.w3cSpecVersion, pageW - 24, 35, { align: 'right' });
      doc.text(
        isExternal ? 'TIER: ACCREDITED EXTERNAL' : 'TIER: ACCREDITED INTERNAL',
        pageW - 24,
        41,
        { align: 'right' }
      );

      doc.setDrawColor(132, 204, 22);
      doc.setLineWidth(0.35);
      doc.line(24, 50, pageW - 24, 50);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(217, 249, 157);
      doc.text(
        isExternal
          ? 'TAI-ONE W3C VERIFIABLE CERTIFICATION ACCREDITATION'
          : 'TTG ACCREDITED INTERNAL CERTIFICATION SEAL',
        pageW / 2,
        62,
        { align: 'center' }
      );

      doc.setFontSize(22);
      doc.setTextColor(234, 179, 8);
      doc.text(rec.programTitle, pageW / 2, 75, { align: 'center', maxWidth: 235 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(217, 249, 157);
      doc.text(
        'By authority of Tai-One W3C Standards & TTG Institutional Governance, this accredited credential is conferred upon',
        pageW / 2,
        89,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(27);
      doc.setTextColor(255, 255, 255);
      doc.text(rec.recipientName, pageW / 2, 104, { align: 'center' });

      doc.setDrawColor(163, 230, 53);
      doc.setLineWidth(0.6);
      doc.line(pageW / 2 - 58, 108, pageW / 2 + 58, 108);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(190, 242, 100);
      doc.text(
        `${rec.organizationName}  ·  ${rec.categoryKey}  ·  ${rec.nqfCreditsReference}`,
        pageW / 2,
        118,
        { align: 'center', maxWidth: 240 }
      );

      // Compliance Boxes
      const standards = rec.w3cVerifiableCredential.credentialSubject.complianceStandards.slice(
        0,
        3
      );
      const boxW = 78;
      const gap = 7;
      const startX =
        (pageW - (boxW * standards.length + gap * Math.max(0, standards.length - 1))) / 2;
      standards.forEach((std, idx) => {
        const bx = startX + idx * (boxW + gap);
        doc.setFillColor(2, 44, 34);
        doc.setDrawColor(132, 204, 22);
        doc.setLineWidth(0.35);
        doc.roundedRect(bx, 129, boxW, 24, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(163, 230, 53);
        doc.text(`COMPLIANCE STANDARD 0${idx + 1}`, bx + 4, 135);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(236, 252, 203);
        doc.text(std, bx + 4, 142, { maxWidth: boxW - 8 });
      });

      doc.setDrawColor(132, 204, 22);
      doc.setLineWidth(0.3);
      doc.line(24, 165, pageW - 24, 165);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 242, 100);
      doc.text(
        `ISSUED: ${rec.issueDate}  ·  VALID UNTIL: ${rec.validUntil}`,
        24,
        173
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(217, 249, 157);
      doc.text(`HMAC-SHA256 Digest: ${rec.signatureHash}`, 24, 179.5, {
        maxWidth: 185,
      });
      doc.text(
        `Public Verification URL: /verify/${rec.serialNumber}`,
        24,
        185.5
      );

      // Seal Circle bottom right
      doc.setFillColor(163, 184, 40);
      doc.circle(pageW - 35, 178, 11, 'F');
      doc.setFillColor(2, 44, 34);
      doc.circle(pageW - 35, 178, 8.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(190, 242, 100);
      doc.text(isExternal ? 'TAI-ONE' : 'TTG', pageW - 35, 176.5, { align: 'center' });
      doc.text(isExternal ? 'W3C EXT' : 'INT ACC', pageW - 35, 180.5, {
        align: 'center',
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(254, 240, 138);
      doc.text(
        isExternal ? 'TAI-ONE W3C EXTERNAL SEAL' : 'TTG ACCREDITED INTERNAL SEAL',
        pageW - 50,
        175,
        { align: 'right' }
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(163, 230, 53);
      doc.text(rec.authorityName, pageW - 50, 181, { align: 'right' });

      doc.save(`TaiOne_W3C_Accreditation_${rec.serialNumber}.pdf`);
    } finally {
      setIsExportingPdfId(null);
    }
  };

  const filteredRecords = useMemo(() => {
    if (tierFilter === 'all') return records;
    return records.filter((r) => r.accreditationTier === tierFilter);
  }, [records, tierFilter]);

  const externalCount = useMemo(
    () => records.filter((r) => r.accreditationTier === 'accredited_external').length,
    [records]
  );
  const internalCount = useMemo(
    () => records.filter((r) => r.accreditationTier === 'accredited_internal').length,
    [records]
  );

  return (
    <section
      aria-labelledby="tai-one-w3c-accreditation-heading"
      className="rounded-2xl border border-[#84cc16]/45 dark:border-[#84cc16]/35 bg-white dark:bg-stone-900 p-6 sm:p-7 space-y-6 shadow-xs"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-1.5 rounded-xl bg-white ring-2 ring-[#84cc16]/70 shadow-xs shrink-0 hidden sm:block">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="Tai-One W3C Certification Accreditation Seal"
              referrerPolicy="no-referrer"
              className="h-11 w-auto object-contain rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Globe className="w-3.5 h-3.5" />
              <span>W3C Verifiable Credentials v2.0 · 1EdTech Open Badges 3.0</span>
            </div>
            <h2
              id="tai-one-w3c-accreditation-heading"
              className={`${
                compactHeader ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              } font-bold tracking-tight text-stone-900 dark:text-stone-100`}
            >
              Tai-One W3C Certification Accreditation Generator
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-3xl">
              Generate cryptographically signed Accredited External (Tai-One W3C) or Accredited Internal (TTG Board) credentials with DID issuer identity, JSON-LD Verifiable Credentials, PDF certificates, and instant ledger registration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0 text-stone-600 dark:text-stone-300">
          <div>
            <span className="text-[10px] uppercase text-stone-400 block">External</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {externalCount}
            </span>
          </div>
          <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />
          <div>
            <span className="text-[10px] uppercase text-stone-400 block">Internal</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {internalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-5 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccreditationTier('accredited_external')}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1 ${
              accreditationTier === 'accredited_external'
                ? 'bg-[#022c22] text-[#ecfccb] border-[#84cc16]'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#a3e635]" />
                <span>Accredited External · Tai-One W3C Authority</span>
              </span>
              <span className="font-mono text-[10px] uppercase opacity-80">TAI1-W3C</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Issues a formal W3C Verifiable Credential v2.0 bound to <span className="font-mono">did:web:tai-one.w3c.tsoaela-training.org</span> for external recognition.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAccreditationTier('accredited_internal')}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1 ${
              accreditationTier === 'accredited_internal'
                ? 'bg-[#052e16] text-[#ecfccb] border-[#a3b828]'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-500/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#eab308]" />
                <span>Accredited Internal · TTG Accreditation Board</span>
              </span>
              <span className="font-mono text-[10px] uppercase opacity-80">TTG-INT</span>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              Issues an Accredited Internal credential verified by <span className="font-mono">did:web:accreditation.tsoaela-training.org</span> under TTG institutional QA governance.
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Accredited Course Template
            </span>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseSelectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {accreditedGuides.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
              <option value="custom">Custom Accredited Program</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Accredited Program Title
            </span>
            <input
              type="text"
              required
              value={programTitle}
              onChange={(e) => setProgramTitle(e.target.value)}
              placeholder="e.g. Test-Time Search Compute & Process-Supervised Reasoning"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Faculty / Domain Category
            </span>
            <input
              type="text"
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              placeholder="Frontier AI & Systems"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Recipient Name
            </span>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Full recipient name"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Recipient Email
            </span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="scholar@ttg-platform.local"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              Organization &amp; NQF Reference
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Issuing organization"
                aria-label="Issuing organization"
                className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="text"
                value={nqfCreditsReference}
                onChange={(e) => setNqfCreditsReference(e.target.value)}
                placeholder="NQF Level 7 · 15 Credits"
                aria-label="NQF credits reference"
                className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Every generated accreditation automatically receives a W3C DataIntegrityProof digest and registers for live public verification.
          </span>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isGenerating
                ? 'Minting W3C Accreditation…'
                : 'Generate Tai-One W3C Accreditation'}
            </span>
          </button>
        </div>
      </form>

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusBanner.type === 'success'
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner.message}</span>
        </div>
      )}

      {/* Registry Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(
            [
              { id: 'all', label: `All Accredited (${records.length})` },
              { id: 'accredited_external', label: `Accredited External (${externalCount})` },
              { id: 'accredited_internal', label: `Accredited Internal (${internalCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTierFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                tierFilter === tab.id
                  ? 'bg-[#052e16] text-[#bef264] border-[#84cc16]/70'
                  : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
          Only Accredited Internal &amp; Accredited External credentials permitted
        </span>
      </div>

      {/* Accredited Credentials Feed */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
          Loading Tai-One W3C Accreditation Ledger…
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
          No accredited records match this filter yet. Use the generator above to mint one.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const isExternal = rec.accreditationTier === 'accredited_external';
            const isExpanded = expandedJsonId === rec.id;

            return (
              <article
                key={rec.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span
                        className={
                          isExternal
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }
                      >
                        {isExternal
                          ? '● ACCREDITED EXTERNAL · TAI-ONE W3C'
                          : '● ACCREDITED INTERNAL · TTG BOARD'}
                      </span>
                      <span aria-hidden="true" className="text-stone-400">·</span>
                      <span className="font-mono tabular-nums text-stone-700 dark:text-stone-300">
                        {rec.serialNumber}
                      </span>
                      <span aria-hidden="true" className="text-stone-400">·</span>
                      <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                        {rec.nqfCreditsReference}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                      {rec.programTitle}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Conferred to <strong className="text-stone-900 dark:text-stone-100">{rec.recipientName}</strong> ({rec.organizationName}) · Authority: <strong>{rec.authorityName}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 break-all">
                      DID: {rec.issuerDid} · Issued {rec.issueDate} · Valid Until {rec.validUntil}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onVerifySerial && (
                      <button
                        type="button"
                        onClick={() => onVerifySerial(rec.serialNumber)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify in Ledger</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleDownloadPdfCertificate(rec)}
                      disabled={isExportingPdfId === rec.id}
                      className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>
                        {isExportingPdfId === rec.id ? 'Rendering PDF…' : 'Certificate PDF'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadJsonLd(rec)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>W3C .jsonld</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedJsonId((prev) => (prev === rec.id ? null : rec.id))
                      }
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide VC' : 'Inspect W3C VC'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 break-all pt-2 border-t border-stone-200/70 dark:border-stone-800">
                  DataIntegrityProof (HMAC-SHA256): {rec.signatureHash}
                </div>

                {isExpanded && (
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-emerald-400">
                        {rec.w3cSpecVersion} JSON-LD
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyJsonLd(rec)}
                        className="text-xs text-stone-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === rec.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy JSON-LD</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono overflow-x-auto leading-relaxed max-h-64 text-stone-200">
                      {JSON.stringify(rec.w3cVerifiableCredential, null, 2)}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
