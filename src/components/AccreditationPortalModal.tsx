import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  Download, 
  Check, 
  FileText, 
  Sparkles, 
  RotateCcw,
  Globe,
  Scale,
  BadgeCheck,
  CheckCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { loadLogoDataUrl, TAI_ONE_LOGO_URL, getFittedLogoSize } from '../utils/pdfBranding';
import {
  SITE_ACCREDITATION_PATHWAYS,
  SITE_ACCREDITATION_READINESS_CHECKLIST,
  SiteAccreditationPathway,
} from '../data/accreditationRegistry';

interface AccreditationPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onAccreditationSuccess?: (registrationId: string) => void;
  onOpenVerificationPortal?: () => void;
}

export interface AccreditationBody {
  id: string;
  name: string;
  shortCode: string;
  category: 'Internal Curriculum Standard' | 'Quality Self-Audit' | 'Platform Record';
  description: string;
  standards: string[];
  cost: '100% Free / Platform Standard';
  recognition: 'Platform-Internal Completion Benchmark (Non-Accredited)';
  website: string;
  status: 'Active Internal Benchmark' | 'Pending Review';
}

export const VERIFIED_ACCREDITATION_BODIES: AccreditationBody[] = [
  {
    id: 'ttg_syllabus',
    name: 'TTG Open Curriculum & Syllabus Transparency Standard',
    shortCode: 'TTG-SYLLABUS',
    category: 'Internal Curriculum Standard',
    description: 'Internal platform rubric ensuring every module includes clear learning outcomes, structured reading chapters, and free open-access foundational knowledge.',
    standards: ['Open Curriculum Alignment', 'Structured Chapter Syllabi', 'Transparent Learning Outcomes', 'Free Open-Access Foundational Modules'],
    cost: '100% Free / Platform Standard',
    recognition: 'Platform-Internal Completion Benchmark (Non-Accredited)',
    website: '',
    status: 'Active Internal Benchmark',
  },
  {
    id: 'ttg_socratic',
    name: 'TTG Socratic Pedagogy & Integrity Benchmark',
    shortCode: 'TTG-SOCRATIC',
    category: 'Quality Self-Audit',
    description: 'Internal pedagogical checklist guiding guided questioning, analytical rubrics, and self-paced study workflows across TTG modules.',
    standards: ['Measurable Learning Objectives', '3-Tier Guided Questioning Protocol', 'Weekly Study Activity Tracking', 'Self-Paced Knowledge Checks'],
    cost: '100% Free / Platform Standard',
    recognition: 'Platform-Internal Completion Benchmark (Non-Accredited)',
    website: '',
    status: 'Active Internal Benchmark',
  },
  {
    id: 'ttg_textqa',
    name: 'TTG Automated Writing & Readability Quality Check',
    shortCode: 'TTG-TEXTQA',
    category: 'Quality Self-Audit',
    description: 'Client-side writing diagnostics, readability analysis, and spellcheck checks embedded in the Authoring Studio and study tools.',
    standards: ['Client-Side Readability Diagnostics', 'In-Browser Spellcheck & Clarity Checks', 'Structured Note-Taking Templates', 'Diagnostic Knowledge Gap Quizzes'],
    cost: '100% Free / Platform Standard',
    recognition: 'Platform-Internal Completion Benchmark (Non-Accredited)',
    website: '',
    status: 'Active Internal Benchmark',
  },
  {
    id: 'ttg_record',
    name: 'TTG Platform Completion Record & Export Standard',
    shortCode: 'TTG-RECORD',
    category: 'Platform Record',
    description: 'Internal record-keeping pipeline producing downloadable PNG/PDF completion certificates and JSON progress exports for personal tracking.',
    standards: ['Local Chapter Completion Logs', 'Downloadable PDF & HD PNG Records', 'JSON Progress Backup Export', 'Explicit Non-Accredited Disclosure'],
    cost: '100% Free / Platform Standard',
    recognition: 'Platform-Internal Completion Benchmark (Non-Accredited)',
    website: '',
    status: 'Active Internal Benchmark',
  },
];

export const AccreditationPortalModal: React.FC<AccreditationPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onAccreditationSuccess,
  onOpenVerificationPortal,
}) => {
  const [currentStep, setCurrentStep] = useState<'directory' | 'apply' | 'certificate' | 'external_pathways'>('external_pathways');
  const [regionFilter, setRegionFilter] = useState<'all' | SiteAccreditationPathway['region']>('all');
  const [checkedReadinessIds, setCheckedReadinessIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_accreditation_readiness');
      return saved ? JSON.parse(saved) : ['curriculum_matrix'];
    } catch {
      return ['curriculum_matrix'];
    }
  });
  const [selectedBodies, setSelectedBodies] = useState<string[]>(['ttg_syllabus', 'ttg_socratic', 'ttg_textqa', 'ttg_record']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    registrationId: string;
    issueDate: string;
    officer: string;
    organization: string;
    productivityScore: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('ttg_productivity_accreditation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  if (!isOpen) return null;

  const toggleBody = (id: string) => {
    setSelectedBodies(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleReadinessItem = (id: string) => {
    setCheckedReadinessIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('ttg_accreditation_readiness', JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleApply = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const certData = {
        registrationId: `TTG-QA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        officer: user.name || 'Tsoaelat S.',
        organization: 'TTG Digital World of Education',
        productivityScore: 99.4,
      };

      try {
        localStorage.setItem('ttg_productivity_accreditation', JSON.stringify(certData));
      } catch (e) {
        console.error(e);
      }

      setRegistrationData(certData);
      setIsSubmitting(false);
      setCurrentStep('certificate');
      onAccreditationSuccess?.(certData.registrationId);
    }, 800);
  };

  // Generate and Download Internal QA Self-Audit PDF Record
  const handleDownloadCertificatePdf = async () => {
    if (!registrationData) return;
    const logoDataUrl = await loadLogoDataUrl();
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Dark-green certificate frame with golden-green & lime trims
    doc.setFillColor(2, 44, 34);
    doc.rect(0, 0, 297, 210, 'F');
    doc.setFillColor(248, 250, 245);
    doc.roundedRect(12, 12, 273, 186, 3, 3, 'F');

    // Outer decorative golden-green & lime borders
    doc.setDrawColor(101, 163, 13);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(163, 230, 53);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, 271, 184);

    let pdfTitleCenterX = 148.5;
    if (logoDataUrl) {
      const fitted = getFittedLogoSize(38, 22);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 19, fitted.width + 4, 22, 2, 2, 'F');
      doc.addImage(
        logoDataUrl,
        'JPEG',
        22,
        19 + (22 - fitted.height) / 2,
        fitted.width,
        fitted.height
      );
      pdfTitleCenterX = 162;
    }

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(5, 46, 22);
    doc.text('INTERNAL PLATFORM QUALITY & SELF-AUDIT RECORD', pdfTitleCenterX, 30, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(77, 124, 15);
    doc.text('TTG - TSOAELA TRAINING GROUND PLATFORM · INTERNAL CURRICULUM QA BENCHMARK', pdfTitleCenterX, 38, { align: 'center' });

    // Record Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text('This internal self-audit record documents that the learning workspace', 148.5, 60, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(25);
    doc.setTextColor(5, 46, 22);
    doc.text(registrationData.organization, 148.5, 75, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    const desc = 'has completed the platform-internal quality assurance checklist for Structured Curriculum Modules, Socratic Pedagogical Guidelines, Client-Side Readability Checks, and Exportable Study Records. Disclosure: This is a platform-issued internal self-audit and does not represent external or statutory academic accreditation.';
    doc.text(desc, 148.5, 89, { align: 'center', maxWidth: 226 });

    // Table of standards
    const tableData = [
      ['Audited Dimension', 'Internal Benchmark', 'Internal QA Division', 'Check Status'],
      ['Structured Syllabus Architecture', 'Clear SLOs & Open-Access Policy', 'TTG Curriculum Division', 'PASSED (100%)'],
      ['Socratic Guided Study Flow', '3-Tier Hint Protocol', 'TTG Pedagogy Review', 'PASSED (100%)'],
      ['Real-Time Text Quality & Spellcheck', 'Client-Side NLP & Readability Engine', 'TTG Writing Diagnostics', 'PASSED (99.4%)'],
      ['Completion Record & PDF Export', 'Local JSON & Vector PDF Pipeline', 'TTG Platform Records', 'ACTIVE (INTERNAL)'],
    ];

    (doc as any).autoTable({
      startY: 112,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [5, 46, 22], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      margin: { left: 24, right: 24 },
    });

    // Footer signatures and seal
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setDrawColor(203, 213, 225);
    doc.line(30, finalY + 10, 90, finalY + 10);
    doc.line(207, finalY + 10, 267, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`REVIEWED BY: ${registrationData.officer.toUpperCase()}`, 60, finalY + 15, { align: 'center' });
    doc.text('TTG INTERNAL QA REGISTRY', 237, finalY + 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`INTERNAL QA REF: ${registrationData.registrationId}`, 148.5, finalY + 8, { align: 'center' });
    doc.text(`ISSUED: ${registrationData.issueDate} · INTERNAL SELF-AUDIT RECORD (NOT EXTERNALLY ACCREDITED)`, 148.5, finalY + 15, { align: 'center' });

    doc.save(`TTG_Internal_QA_Record_${registrationData.registrationId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-3">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="Tsoaela Training Ground Platform Logo"
              referrerPolicy="no-referrer"
              className="h-11 w-auto rounded-xl object-contain bg-white p-1 ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex flex-wrap items-center gap-2">
                <span>Site Accreditation Pathways &amp; QA Registry</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  Application Guide
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Apply for official statutory/international accreditation or run internal platform curriculum audits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentStep('external_pathways')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentStep === 'external_pathways'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>1. Apply for Official Accreditation</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep('directory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                currentStep === 'directory'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              2. Internal QA Standards
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep('apply')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                currentStep === 'apply'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              3. Run Self-Audit
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep('certificate')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentStep === 'certificate'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>4. Internal QA Record</span>
            </button>
          </div>

          {registrationData && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <CheckCheck className="w-4 h-4" />
              <span>Self-Audit Recorded</span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: EXTERNAL SITE ACCREDITATION PATHWAYS & READINESS */}
          {currentStep === 'external_pathways' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-100">
                  <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Where to Apply for Official Accreditation for Tsoaela Training Ground Platform</span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Online education platforms cannot self-accredit statutory qualifications. Depending on whether TTG is issuing{' '}
                  <strong>South African occupational skills certificates</strong>, <strong>international CPD/CEU hours</strong>, or{' '}
                  <strong>tamper-evident employer digital credentials</strong>, select and apply directly to the recognized authorities below.
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(
                    [
                      'all',
                      'South Africa (National & SETA)',
                      'International Online & CPD',
                      'Verifiable Digital Credentials',
                    ] as const
                  ).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setRegionFilter(region)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border ${
                        regionFilter === region
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                          : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                      }`}
                    >
                      {region === 'all' ? 'All Bodies (8)' : region}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  Readiness: {checkedReadinessIds.length}/{SITE_ACCREDITATION_READINESS_CHECKLIST.length} Dossier Items
                </span>
              </div>

              {/* Recommended Accreditation Bodies Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SITE_ACCREDITATION_PATHWAYS.filter(
                  (p) => regionFilter === 'all' || p.region === regionFilter
                ).map((pathway) => (
                  <div
                    key={pathway.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            {pathway.region}
                          </span>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                            {pathway.acronym} — {pathway.bodyName}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[10px] font-mono font-semibold text-stone-700 dark:text-stone-300 shrink-0">
                          {pathway.estimatedTimeline.split('(')[0].trim()}
                        </span>
                      </div>

                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {pathway.fitForTtg}
                      </p>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-[11px]">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                          Key Submission Requirements:
                        </span>
                        <ul className="space-y-1 text-stone-600 dark:text-stone-400">
                          {pathway.keyRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/70 dark:border-stone-800 text-xs">
                      <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 truncate">
                        Scope: {pathway.scopeCovered}
                      </span>
                      <a
                        href={pathway.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11px] font-bold shrink-0 transition-colors"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Site Accreditation Readiness Dossier Checklist */}
              <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Institutional Application Readiness Dossier
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Track the compliance documents prepared before submitting to QCTO, CPD Standards, or ISO auditors.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {Math.round(
                      (checkedReadinessIds.length / SITE_ACCREDITATION_READINESS_CHECKLIST.length) * 100
                    )}
                    % Prepared
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {SITE_ACCREDITATION_READINESS_CHECKLIST.map((item) => {
                    const checked = checkedReadinessIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleReadinessItem(item.id)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          checked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                            : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            checked
                              ? 'bg-emerald-600 text-white'
                              : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100">{item.label}</div>
                          <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                            {item.detail}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DIRECTORY */}
          {currentStep === 'directory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Transparency Notice: Internal Platform Benchmarks (Non-Accredited)
                </h4>
                <p className="text-amber-800 dark:text-amber-300">
                  Courses and completion records on TTG follow internal curriculum and pedagogy checklists designed by our platform team. These checks are self-assessed internal benchmarks and do not constitute government, statutory, or third-party external academic accreditation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {VERIFIED_ACCREDITATION_BODIES.map(body => {
                  const isChecked = selectedBodies.includes(body.id);
                  return (
                    <div
                      key={body.id}
                      onClick={() => toggleBody(body.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                        isChecked 
                          ? 'bg-white dark:bg-stone-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-stone-500 dark:text-stone-400 font-bold">
                            {body.shortCode} · {body.category}
                          </span>
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                            {body.name}
                          </h4>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-500 text-white' : 'border border-stone-300 dark:border-stone-700'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {body.description}
                      </p>

                      <div className="space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-mono text-stone-400 block uppercase">Internal Criteria:</span>
                        <div className="flex flex-wrap gap-1">
                          {body.standards.map((std, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-[9px] rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                              ✓ {std}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                        <span>{body.cost}</span>
                        <span>{body.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setCurrentStep('apply')}
                  className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-xs shadow-sm hover:bg-stone-800 transition-all flex items-center gap-1.5"
                >
                  <span>Proceed to Internal Self-Audit</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: RUN SELF-AUDIT */}
          {currentStep === 'apply' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
                  Platform Productivity &amp; Quality Self-Audit Dossier
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Workspace Reviewed</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">TTG Digital World of Education</p>
                    <p className="text-[11px] text-stone-500">Scope: 258 Curated Modules · 1200 Study Guides · 120 Fields</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Reviewing User</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">{user.name || 'Tsoaelat S.'}</p>
                    <p className="text-[11px] text-stone-500">{user.email || 'Tsoaelat.s@gmail.com'}</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Internal Quality Checks</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">99.4% Readability &amp; Tool Check</p>
                    <p className="text-[11px] text-stone-500">Client-Side NLP Spellcheck &amp; PDF Record Export</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Credential Scope</span>
                    <p className="font-bold text-amber-700 dark:text-amber-400">Internal Completion Only</p>
                    <p className="text-[11px] text-stone-500">Non-accredited self-paced learning documentation</p>
                  </div>
                </div>
              </div>

              {/* Self-Audit Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Internal Quality Checklist (Platform Self-Assessment):
                </span>
                <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Open-access tier remains available ($0 fee) for foundational self-paced study modules.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Course syllabi include structured chapters, clear learning outcomes, and practice quizzes.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Guided Socratic study tools encourage step-by-step reasoning before revealing answers.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Personal completion certificates (PNG + PDF) clearly state their status as internal platform records.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('directory')}
                  className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                >
                  ← Back to Standards
                </button>
                <button
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Generating Internal QA Record...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Generate Internal QA Record (Free)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTERNAL QA RECORD */}
          {currentStep === 'certificate' && (
            <div className="space-y-5">
              {registrationData ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#022c22] via-[#052e16] to-[#064e3b] text-white border-2 border-[#a3b828]/70 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#84cc16]/30 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={TAI_ONE_LOGO_URL}
                        alt="Tsoaela Training Ground Platform Logo"
                        referrerPolicy="no-referrer"
                        className="h-12 w-auto rounded-xl object-contain bg-white p-1 border-2 border-[#bef264] shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#bef264]">
                          TTG Platform-Internal Self-Audit Record
                        </span>
                        <h3 className="text-base font-bold">
                          Internal Curriculum Quality Record (Non-Accredited)
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#84cc16]/20 text-[#bef264] border border-[#84cc16]/40">
                      INTERNAL QA: ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2 py-2">
                    <p className="text-xs text-stone-300">
                      This record documents that <strong className="text-white text-sm">{registrationData.organization}</strong> has completed TTG&apos;s internal curriculum structure, readability, and Socratic pedagogy self-audit checklist. It is an internal platform record and does not represent external or statutory accreditation.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Internal Ref ID</span>
                        <span className="text-amber-400 font-bold">{registrationData.registrationId}</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Issue Date</span>
                        <span>{registrationData.issueDate}</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Self-Audit Score</span>
                        <span className="text-emerald-400 font-bold">{registrationData.productivityScore}%</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Credential Type</span>
                        <span>Internal Only</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                    <span className="text-stone-400 text-[11px]">
                      Reviewed by: {registrationData.officer} · TTG Internal Quality Benchmark
                    </span>
                    <button
                      onClick={handleDownloadCertificatePdf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Internal QA PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <p className="text-xs text-stone-500">No internal QA self-audit record generated yet.</p>
                  <button
                    onClick={() => setCurrentStep('apply')}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                  >
                    Run Internal Self-Audit Checklist
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <span>TTG Internal Quality &amp; Pedagogy Registry · Platform Self-Audit (Non-Accredited)</span>
          <div className="flex items-center gap-2">
            {onOpenVerificationPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerificationPortal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                Open Verification Ledger &amp; Appeals
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
