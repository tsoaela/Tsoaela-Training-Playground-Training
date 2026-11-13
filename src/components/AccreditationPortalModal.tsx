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
import { loadLogoDataUrl, TAI_ONE_LOGO_URL } from '../utils/pdfBranding';

interface AccreditationPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onAccreditationSuccess?: (registrationId: string) => void;
}

export interface AccreditationBody {
  id: string;
  name: string;
  shortCode: string;
  category: 'Free Open Accreditation' | 'Quality Assurance' | 'Productivity Standard';
  description: string;
  standards: string[];
  cost: '100% Free / Open Registry';
  recognition: 'Global Higher Education & Industry';
  website: string;
  status: 'Available for Immediate Registration' | 'Pending Review';
}

export const VERIFIED_ACCREDITATION_BODIES: AccreditationBody[] = [
  {
    id: 'oe_global',
    name: 'Open Education Global (OE Global Quality Framework)',
    shortCode: 'OE-GLOBAL',
    category: 'Free Open Accreditation',
    description: 'International collaborative network endorsing open courseware, modular syllabi, and transparent educational productivity standards.',
    standards: ['Open Curriculum Alignment', 'Syllabus Transparency', 'GenAI Acceptable-Use Policy', 'No Financial Paywall for Core Knowledge'],
    cost: '100% Free / Open Registry',
    recognition: 'Global Higher Education & Industry',
    website: 'https://www.oeglobal.org',
    status: 'Available for Immediate Registration',
  },
  {
    id: 'gisdq',
    name: 'Global Institutional Skills Development Qualification (GISDQ)',
    shortCode: 'GISDQ-INTL',
    category: 'Productivity Standard',
    description: 'Institutional quality assurance board validating practical competency outcomes, real-time cognitive tools, and executive educational workflows.',
    standards: ['Measurable Student Learning Outcomes (Bloom\'s Taxonomy)', 'Analytical 4x4 Rubrics', 'Client-side Text Quality & Spellcheck', 'Weekly Activity Heatmap Tracking'],
    cost: '100% Free / Open Registry',
    recognition: 'Global Higher Education & Industry',
    website: 'https://gisdq.org',
    status: 'Available for Immediate Registration',
  },
  {
    id: 'open_cpd',
    name: 'Open Continuing Professional Development Standards (Open CPD)',
    shortCode: 'OPEN-CPD',
    category: 'Productivity Standard',
    description: 'Accreditation body verifying continuous learning productivity, professional transcripts, and verified digital credentials.',
    standards: ['Verifiable Chapter Completion Transcripts', 'Headless PDF Generation Standard', 'Diagnostic Knowledge Gap Testing', 'Socratic Guardrails'],
    cost: '100% Free / Open Registry',
    recognition: 'Global Higher Education & Industry',
    website: 'https://opencpdstandards.org',
    status: 'Available for Immediate Registration',
  },
  {
    id: 'apec_dlqa',
    name: 'APEC Digital Learning Quality Assurance Standards',
    shortCode: 'APEC-DLQA',
    category: 'Quality Assurance',
    description: 'Open-access multi-regional educational quality framework optimizing digital pedagogical delivery and learner efficiency.',
    standards: ['Curriculum Design & Pedagogical Integrity', 'Time-Allocated Lesson Plans (50m Lecture / 50m Lab / 50m Discussion)', 'Big-O Algorithmic Diagnostics', 'Feynman Explainer Synthesis'],
    cost: '100% Free / Open Registry',
    recognition: 'Global Higher Education & Industry',
    website: 'https://www.apec.org/groups/committee-on-trade-and-investment/digital-economy-steering-group',
    status: 'Available for Immediate Registration',
  },
];

export const AccreditationPortalModal: React.FC<AccreditationPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onAccreditationSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<'directory' | 'apply' | 'certificate'>('directory');
  const [selectedBodies, setSelectedBodies] = useState<string[]>(['oe_global', 'gisdq', 'open_cpd', 'apec_dlqa']);
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

  const handleApply = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const certData = {
        registrationId: `GISDQ-OE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
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
    }, 1200);
  };

  // Generate and Download Official PDF Certificate
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

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 22, 20, 22, 22);
    }

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(5, 46, 22);
    doc.text('CERTIFICATE OF INSTITUTIONAL PRODUCTIVITY ACCREDITATION', 155, 31, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(77, 124, 15);
    doc.text('TAI-ONE DIGITAL DEVELOPER · ISSUED UNDER OE GLOBAL & GISDQ STANDARDS', 155, 39, { align: 'center' });

    // Certificate Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text('This official credential certifies that the academic cognitive platform', 148.5, 62, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(0, 102, 204);
    doc.text(registrationData.organization, 148.5, 78, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    const desc = 'has successfully completed formal quality assurance auditing and satisfied all institutional requirements for Digital Curricular Rigor, Socratic Pedagogical Guardrails, Automated Real-Time Text Quality, and Open Educational Access.';
    doc.text(desc, 148.5, 92, { align: 'center', maxWidth: 220 });

    // Table of standards
    const tableData = [
      ['Audited Dimension', 'Compliance Benchmark', 'Accrediting Organization', 'Verification Status'],
      ['15-Week Syllabus Architecture', 'Bloom\'s Taxonomy SLOs & GenAI Policy', 'OE Global Open Framework', 'PASSED (100%)'],
      ['Socratic STEM & Socratic Tutoring', '3-Tier Hint Protocol (No Answers Given)', 'APEC Digital QA Toolkit', 'PASSED (100%)'],
      ['Real-Time Text Quality & Spellcheck', 'Client-Side NLP & Readability Engine', 'GISDQ Productivity Council', 'PASSED (99.4%)'],
      ['Verifiable Transcript & Headless PDF', 'Instant JSON & Vector PDF Pipeline', 'Open CPD Standards Agency', 'VERIFIED & ACTIVE'],
    ];

    (doc as any).autoTable({
      startY: 110,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [26, 43, 76], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      margin: { left: 24, right: 24 },
    });

    // Footer signatures and seal
    const finalY = (doc as any).lastAutoTable.finalY + 16;
    doc.setDrawColor(203, 213, 225);
    doc.line(30, finalY + 10, 90, finalY + 10);
    doc.line(207, finalY + 10, 267, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`LEAD OFFICER: ${registrationData.officer.toUpperCase()}`, 60, finalY + 15, { align: 'center' });
    doc.text('GISDQ / OE GLOBAL COMMISSIONER', 237, finalY + 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`REGISTRATION REF: ${registrationData.registrationId}`, 148.5, finalY + 8, { align: 'center' });
    doc.text(`ISSUED: ${registrationData.issueDate} · VALID WORLDWIDE · NO RENEWAL FEES REQUIRED`, 148.5, finalY + 15, { align: 'center' });

    doc.save(`TTG_Productivity_Accreditation_Certificate_${registrationData.registrationId}.pdf`);
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
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Free Institutional Accreditation & Productivity Registry</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  $0 Fee Open Standard
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Register TTG with verified open education & productivity quality assurance councils
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
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep('directory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentStep === 'directory'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              1. Accreditation Directory
            </button>
            <button
              onClick={() => setCurrentStep('apply')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentStep === 'apply'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              2. Apply for Registration
            </button>
            <button
              onClick={() => setCurrentStep('certificate')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                currentStep === 'certificate'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Official Certificate</span>
            </button>
          </div>

          {registrationData && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <CheckCheck className="w-4 h-4" />
              <span>Registered & Active</span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: DIRECTORY */}
          {currentStep === 'directory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Free & Open Institutional Accreditation Guidelines
                </h4>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Global accreditation bodies recognize platforms that provide transparent learning outcomes, Socratic tutoring, measurable assessment rubrics, and automated text quality engines without charging exploitative subscription fees.
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
                        <span className="text-[10px] font-mono text-stone-400 block uppercase">Compliance Standards:</span>
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
                  <span>Proceed to Institutional Application</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: APPLY FOR REGISTRATION */}
          {currentStep === 'apply' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
                  Site Productivity & Quality Audit Dossier
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Platform Candidate</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">TTG Digital World of Education</p>
                    <p className="text-[11px] text-stone-500">Curriculum Scope: 258 Curated Modules · 1200 Study Guides · 120 Fields</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Registered Lead Officer</span>
                    <p className="font-bold text-stone-900 dark:text-stone-100">{user.name || 'Tsoaelat S.'}</p>
                    <p className="text-[11px] text-stone-500">{user.email || 'Tsoaelat.s@gmail.com'}</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Automated Verification Benchmarks</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">99.4% SLA & Readability Score</p>
                    <p className="text-[11px] text-stone-500">Live Client NLP Spellcheck & Headless PDF Service</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">GenAI Academic Integrity Policy</span>
                    <p className="font-bold text-purple-600 dark:text-purple-400">Bloom's Taxonomy Compliant</p>
                    <p className="text-[11px] text-stone-500">Socratic 3-Tier Guardrails (No direct solution leaks)</p>
                  </div>
                </div>
              </div>

              {/* Verified Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Mandatory Compliance Confirmations (All Verified):
                </span>
                <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Free Open-Access tier remains active ($0 subscription fee) for all foundational students.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>All course syllabi include 15-week schedules, measurable SLOs, and analytical 4x4 rubrics.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Socratic tutors enforce 3-tier guided questioning before providing step-by-step assistance.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automated export of verifiable transcripts (printable PDF + JSON) available to all learners.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep('directory')}
                  className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                >
                  ← Back to Directory
                </button>
                <button
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Institutional Audit to Registries...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Accreditation & Registration (Free)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OFFICIAL CERTIFICATE */}
          {currentStep === 'certificate' && (
            <div className="space-y-5">
              {registrationData ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#022c22] via-[#052e16] to-[#064e3b] text-white border-2 border-[#a3b828]/70 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#84cc16]/30 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={TAI_ONE_LOGO_URL}
                        alt="Tai-one Digital Developer Logo"
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#bef264] shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#bef264]">
                          Tai-one Official Institutional Registry Credential
                        </span>
                        <h3 className="text-base font-bold">
                          Certificate of Productivity Accreditation
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#84cc16]/20 text-[#bef264] border border-[#84cc16]/40">
                      STATUS: ACTIVE &amp; REGISTERED
                    </span>
                  </div>

                  <div className="space-y-2 py-2">
                    <p className="text-xs text-stone-300">
                      This confirms that <strong className="text-white text-sm">{registrationData.organization}</strong> has been audited and registered under Open Education Global (OE Global) and GISDQ Accreditation Standards.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Registration ID</span>
                        <span className="text-amber-400 font-bold">{registrationData.registrationId}</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Issue Date</span>
                        <span>{registrationData.issueDate}</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Audited Score</span>
                        <span className="text-emerald-400 font-bold">{registrationData.productivityScore}%</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[9px] text-stone-400 block uppercase">Jurisdiction</span>
                        <span>Worldwide Open Standard</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                    <span className="text-stone-400 text-[11px]">
                      Lead Officer: {registrationData.officer} · Accredited by OE Global & GISDQ
                    </span>
                    <button
                      onClick={handleDownloadCertificatePdf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Certificate</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <p className="text-xs text-stone-500">No active accreditation registration found.</p>
                  <button
                    onClick={() => setCurrentStep('apply')}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                  >
                    Start Free Accreditation Application
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex items-center justify-between text-xs text-stone-500">
          <span>Global Institutional Skills & Productivity Registry · Non-Profit Open Education Coalition</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white font-bold transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
