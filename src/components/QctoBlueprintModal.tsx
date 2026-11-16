import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Layers,
  BookOpen,
  Wrench,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  FileText,
  Clock,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { QctoModuleBreakdown, StudyGuide } from '../types';
import { buildQctoBlueprintForGuide } from '../data/qctoBlueprints';

interface QctoBlueprintModalProps {
  isOpen: boolean;
  guide: StudyGuide | null;
  allAiGuides: StudyGuide[];
  onSelectGuide: (guide: StudyGuide) => void;
  onClose: () => void;
}

type BlueprintTab = 'all' | 'KM' | 'PM' | 'WM' | 'eisa';

export const QctoBlueprintModal: React.FC<QctoBlueprintModalProps> = ({
  isOpen,
  guide,
  allAiGuides,
  onSelectGuide,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<BlueprintTab>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('all');
  }, [isOpen, guide?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const blueprint = useMemo(() => {
    if (!guide) return null;
    return buildQctoBlueprintForGuide(guide);
  }, [guide]);

  const filteredModules = useMemo(() => {
    if (!blueprint) return [];
    if (activeTab === 'KM' || activeTab === 'PM' || activeTab === 'WM') {
      return blueprint.modules.filter((m) => m.shortType === activeTab);
    }
    return blueprint.modules;
  }, [blueprint, activeTab]);

  if (!isOpen || !guide || !blueprint) return null;

  const kmPct = Math.round((blueprint.componentSummary.knowledgeHours / blueprint.totalNotionalHours) * 100);
  const pmPct = Math.round((blueprint.componentSummary.practicalHours / blueprint.totalNotionalHours) * 100);
  const wmPct = Math.max(0, 100 - kmPct - pmPct);

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# ${blueprint.programmeTitle}`,
      '',
      `- **Source Course:** ${blueprint.courseTitle}`,
      `- **Qualification Type:** ${blueprint.qualificationType}`,
      `- **Suggested OFO Code:** ${blueprint.suggestedOfoCode}`,
      `- **NQF Level:** Level ${blueprint.nqfLevel}`,
      `- **Total SAQA Credits:** ${blueprint.saqaCredits} Credits`,
      `- **Total Notional Hours:** ${blueprint.totalNotionalHours} Hours (1 Credit = 10 Notional Hours)`,
      `- **Estimated Duration:** ${blueprint.durationLabel}`,
      '',
      `> **Regulatory Notice:** ${blueprint.accreditationStatusDisclosure}`,
      '',
      '## Component Distribution',
      `- **Knowledge Modules (KM):** ${blueprint.componentSummary.knowledgeCredits} Credits (${blueprint.componentSummary.knowledgeHours} hrs · ${kmPct}%)`,
      `- **Practical Skill Modules (PM):** ${blueprint.componentSummary.practicalCredits} Credits (${blueprint.componentSummary.practicalHours} hrs · ${pmPct}%)`,
      `- **Work Experience Modules (WM):** ${blueprint.componentSummary.workplaceCredits} Credits (${blueprint.componentSummary.workplaceHours} hrs · ${wmPct}%)`,
      '',
      '## Entry Requirements',
      ...blueprint.entryRequirements.map((req) => `- ${req}`),
      '',
      '## Module Breakdown',
      ...blueprint.modules.flatMap((m) => [
        `### ${m.code}: ${m.title} (${m.type})`,
        `- **NQF Level:** ${m.nqfLevel} | **Credits:** ${m.credits} | **Notional Hours:** ${m.notionalHours}`,
        `- **Purpose:** ${m.purpose}`,
        '- **Syllabus Topics:**',
        ...m.topics.map((t) => `  - ${t}`),
        '- **Assessment & Evidence:**',
        ...m.assessmentEvidence.map((a) => `  - ${a}`),
        '',
      ]),
      '## EISA Readiness & SDP Registration Pathway',
      ...blueprint.eisaReadinessChecklist.map((item) => `- [ ] ${item}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.id}_qcto_blueprint.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFontSize(16);
      doc.setTextColor(28, 25, 23);
      doc.text('QCTO Occupational Skills Programme Blueprint', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(blueprint.programmeTitle, 14, 25, { maxWidth: 180 });
      doc.text(
        `NQF Level ${blueprint.nqfLevel}  ·  ${blueprint.saqaCredits} SAQA Credits  ·  ${blueprint.totalNotionalHours} Notional Hours`,
        14,
        32
      );

      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      const disclaimerLines = doc.splitTextToSize(
        `NOTICE: ${blueprint.accreditationStatusDisclosure}`,
        180
      );
      doc.text(disclaimerLines, 14, 39);

      const startY = 39 + disclaimerLines.length * 4 + 4;

      (doc as any).autoTable({
        startY,
        head: [['Component', 'SAQA Credits', 'Notional Hours', 'Share']],
        body: [
          [
            'Knowledge Modules (KM)',
            String(blueprint.componentSummary.knowledgeCredits),
            `${blueprint.componentSummary.knowledgeHours} hrs`,
            `${kmPct}%`,
          ],
          [
            'Practical Skill Modules (PM)',
            String(blueprint.componentSummary.practicalCredits),
            `${blueprint.componentSummary.practicalHours} hrs`,
            `${pmPct}%`,
          ],
          [
            'Work Experience Modules (WM)',
            String(blueprint.componentSummary.workplaceCredits),
            `${blueprint.componentSummary.workplaceHours} hrs`,
            `${wmPct}%`,
          ],
          [
            'Total Skills Programme',
            String(blueprint.saqaCredits),
            `${blueprint.totalNotionalHours} hrs`,
            '100%',
          ],
        ],
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: [28, 25, 23] },
      });

      (doc as any).autoTable({
        startY: ((doc as any).lastAutoTable?.finalY || startY + 35) + 6,
        head: [['Code', 'Type', 'Module Title', 'NQF', 'Credits', 'Hours']],
        body: blueprint.modules.map((m) => [
          m.code,
          m.type,
          m.title,
          `L${m.nqfLevel}`,
          String(m.credits),
          `${m.notionalHours}h`,
        ]),
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [5, 46, 22] },
      });

      doc.save(`${guide.id}_qcto_blueprint.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderModuleCard = (mod: QctoModuleBreakdown) => {
    const typeLabelColor =
      mod.shortType === 'KM'
        ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'
        : mod.shortType === 'PM'
        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';

    const TypeIcon = mod.shortType === 'KM' ? BookOpen : mod.shortType === 'PM' ? Wrench : Briefcase;

    return (
      <div
        key={mod.code}
        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-stone-700 dark:text-stone-300">
                {mod.code}
              </span>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeLabelColor}`}
              >
                <TypeIcon className="w-3 h-3" />
                <span>{mod.type}</span>
              </span>
            </div>
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {mod.title}
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-stone-600 dark:text-stone-300 shrink-0 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800">
            <span>NQF L{mod.nqfLevel}</span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">/</span>
            <span className="font-bold text-stone-900 dark:text-stone-100">{mod.credits} Credits</span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">/</span>
            <span>{mod.notionalHours} hrs</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          {mod.purpose}
        </p>

        {mod.learningOutcomeAlignment && (
          <div className="text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Course Outcome Alignment: </span>
            {mod.learningOutcomeAlignment}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div>
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              Curriculum Topics & Focus
            </div>
            <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
              {mod.topics.map((topic, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              Assessment & Portfolio of Evidence (PoE)
            </div>
            <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
              {mod.assessmentEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qcto-blueprint-modal-title"
    >
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{blueprint.qualificationType}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{blueprint.suggestedOfoCode}</span>
              </div>
              <h2
                id="qcto-blueprint-modal-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
              >
                {blueprint.programmeTitle}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Mapped from course: <span className="font-semibold text-stone-800 dark:text-stone-200">{blueprint.courseTitle}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 dark:focus-visible:ring-stone-300"
              aria-label="Close QCTO blueprint dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Course switcher & export controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200/70 dark:border-stone-800">
            {allAiGuides.length > 1 ? (
              <div className="flex items-center gap-2 min-w-0">
                <label
                  htmlFor="qcto-course-select"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap shrink-0"
                >
                  Skills Programme:
                </label>
                <select
                  id="qcto-course-select"
                  value={guide.id}
                  onChange={(e) => {
                    const next = allAiGuides.find((g) => g.id === e.target.value);
                    if (next) onSelectGuide(next);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 max-w-xs sm:max-w-sm truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                >
                  {allAiGuides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-stone-500 dark:text-stone-400">{blueprint.studyModeSummary}</div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Markdown</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Generating...' : 'Export Blueprint PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Statutory Disclosure Banner */}
          <div className="p-3.5 rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">Accreditation Status Notice: </span>
              {blueprint.accreditationStatusDisclosure}
            </p>
          </div>

          {/* 4-Column KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>NQF Tier</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                NQF Level {blueprint.nqfLevel}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {blueprint.durationLabel}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SAQA Credit Value</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {blueprint.saqaCredits} Credits
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                1 SAQA Credit = 10 Notional Hours
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Total Notional Hours</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {blueprint.totalNotionalHours} Hours
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Guided, Lab & Workplace Study
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                KM / PM / WM Ratio
              </div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {kmPct}% · {pmPct}% · {wmPct}%
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden flex bg-stone-200 dark:bg-stone-800">
                <div className="bg-sky-600" style={{ width: `${kmPct}%` }} title={`Knowledge: ${kmPct}%`} />
                <div className="bg-amber-500" style={{ width: `${pmPct}%` }} title={`Practical: ${pmPct}%`} />
                <div className="bg-emerald-600" style={{ width: `${wmPct}%` }} title={`Workplace: ${wmPct}%`} />
              </div>
            </div>
          </div>

          {/* Purpose & Entry Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Occupational Purpose Statement
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {blueprint.purposeStatement}
              </p>
              <div className="pt-2 text-[11px] text-stone-500 dark:text-stone-400">
                {blueprint.studyModeSummary}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Minimum Entry Requirements & RPL
              </h3>
              <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                {blueprint.entryRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-stone-400">0{idx + 1}.</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
            {[
              { id: 'all' as BlueprintTab, label: `All Modules (${blueprint.modules.length})` },
              {
                id: 'KM' as BlueprintTab,
                label: `Knowledge (${blueprint.componentSummary.knowledgeCredits} Cr / ${blueprint.componentSummary.knowledgeHours}h)`,
              },
              {
                id: 'PM' as BlueprintTab,
                label: `Practical (${blueprint.componentSummary.practicalCredits} Cr / ${blueprint.componentSummary.practicalHours}h)`,
              },
              {
                id: 'WM' as BlueprintTab,
                label: `Workplace (${blueprint.componentSummary.workplaceCredits} Cr / ${blueprint.componentSummary.workplaceHours}h)`,
              },
              { id: 'eisa' as BlueprintTab, label: 'Assessment, EISA & SDP Approval' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'eisa' ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  EISA / Final Statement of Results Readiness Criteria
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  {blueprint.eisaReadinessChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Statutory Pathway to Official QCTO Accreditation
                </h3>
                <ol className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  {blueprint.recommendedSdpPath.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
                        0{idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredModules.map(renderModuleCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
