import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  Download,
  FileText,
  GraduationCap,
  Music,
  Plus,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react';
import {
  AcceptedRegisteredStudent,
  ApplicationCategory,
  ApplicationPrefillData,
  CategoryRegistration,
  StudentAdmissionStatus,
  UserProfile,
} from '../types';
import { escapeCsvCell } from '../utils/pomodoroCsvExport';

interface ApplicationsAndRegistrationsSectionProps {
  user: UserProfile;
  acceptedStudents?: AcceptedRegisteredStudent[];
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  onUpdateAcceptedStudentStatus?: (
    id: string,
    status: StudentAdmissionStatus
  ) => Promise<AcceptedRegisteredStudent | null>;
  onOpenFullRoster?: () => void;
}

interface ApplicationPathwayItem {
  id: ApplicationCategory;
  title: string;
  scope: string;
  accreditorSummary: string;
  turnaround: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APPLICATION_PATHWAYS: ApplicationPathwayItem[] = [
  {
    id: 'course_educare',
    title: 'Educare Course & University Faculty Admission',
    scope:
      'Degree, diploma, and NQF qualification pathways across six accredited university faculties.',
    accreditorSummary: 'FPAC · GDLAB · IOCC',
    turnaround: 'Instant Enrollment ID',
    icon: GraduationCap,
  },
  {
    id: 'research_fellowship',
    title: 'Research Institute Fellowship',
    scope:
      'Publish peer-reviewed whitepapers, co-author monographs, and join computational research clusters.',
    accreditorSummary: 'GRPR · FPAC · COSV',
    turnaround: '6 Months – 4 Years',
    icon: FileText,
  },
  {
    id: 'music_artist',
    title: 'Music Artist & Composer Roster',
    scope:
      'Register lossless 24-bit masters, manage ISRC catalogs, and license studio multitracks.',
    accreditorSummary: 'IMSLG · AESR',
    turnaround: 'Open Annual Roster',
    icon: Music,
  },
  {
    id: 'photographer',
    title: 'Photographer Gallery Representation',
    scope:
      'Curate archival fine-art editions and commercial editorial frames for global licensing.',
    accreditorSummary: 'IVCAB · FAPAQB',
    turnaround: 'Annual Gallery License',
    icon: Camera,
  },
  {
    id: 'videographer',
    title: 'Videographer & Cinema Guild',
    scope:
      'Distribute 4K ProRes cinematography, documentary features, and broadcast color grading.',
    accreditorSummary: 'BCSB · SDCA',
    turnaround: 'Annual Guild Standing',
    icon: Video,
  },
  {
    id: 'book_author',
    title: 'Book Author & Publishing Imprint',
    scope:
      'Register full-length textbooks, academic treatises, and collector editions with ISBN backing.',
    accreditorSummary: 'ISBN Agency · FPAC',
    turnaround: 'Publication Lifecycle',
    icon: BookOpen,
  },
  {
    id: 'retreat_delegate',
    title: 'Executive Sanctuary & Retreat Delegate',
    scope:
      'Apply for residential leadership intensives in Bali, the Swiss Alps, Kyoto, or online.',
    accreditorSummary: 'Strategic Leadership Institute',
    turnaround: '7–10 Day Residency',
    icon: Compass,
  },
];

interface UnifiedRegistrationRow {
  id: string;
  registrationNumber: string;
  applicantName: string;
  applicantEmail: string;
  categoryLabel: string;
  trackOrProgram: string;
  accreditor: string;
  dateLabel: string;
  statusLabel: string;
  statusKind: 'confirmed' | 'accepted' | 'review';
  source: 'personal_submission' | 'cohort_roster';
  rawCategoryReg?: CategoryRegistration;
  rawCohortStudent?: AcceptedRegisteredStudent;
}

function readLocalRegistrations(): CategoryRegistration[] {
  try {
    const raw = localStorage.getItem('ttg_registrations');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CategoryRegistration[]) : [];
  } catch {
    return [];
  }
}

function downloadRegistrationTranscript(reg: CategoryRegistration): void {
  const transcriptText = `========================================================================
TSOAELA TRAINING GROUND PLATFORM (TTG)
INSTITUTIONAL ADMISSION & CATEGORY REGISTRATION TRANSCRIPT
========================================================================

REGISTRATION NUMBER : ${reg.registrationNumber}
DATE OF ISSUANCE    : ${reg.registrationDate}
STATUS              : ${reg.status.toUpperCase()}

APPLICANT DETAILS:
------------------------------------------------------------------------
Full Legal Name     : ${reg.applicantName}
Institutional Email : ${reg.applicantEmail}
Category Enrolled   : ${reg.categoryTitle}
Specialization Track: ${reg.trackType}
Entry Qualification : ${reg.qualificationLevel}
Accreditation Board : ${reg.accreditor}
========================================================================`;

  const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TTG-Registration-${reg.registrationNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const ApplicationsAndRegistrationsSection: React.FC<
  ApplicationsAndRegistrationsSectionProps
> = ({
  user,
  acceptedStudents = [],
  onApplyQualification,
  onUpdateAcceptedStudentStatus,
  onOpenFullRoster,
}) => {
  const [localRegistrations, setLocalRegistrations] = useState<CategoryRegistration[]>(() =>
    readLocalRegistrations()
  );
  const [activeScope, setActiveScope] = useState<
    'mine' | 'all' | 'confirmed' | 'pending'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const syncRegistrations = useCallback(() => {
    setLocalRegistrations(readLocalRegistrations());
  }, []);

  useEffect(() => {
    syncRegistrations();
    const handleCustomSync = () => syncRegistrations();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ttg_registrations') syncRegistrations();
    };
    window.addEventListener('ttg:registrations-updated', handleCustomSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('ttg:registrations-updated', handleCustomSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncRegistrations]);

  const userEmailLower = (user.email || '').trim().toLowerCase();
  const userNameLower = (user.name || '').trim().toLowerCase();

  const unifiedRows = useMemo<UnifiedRegistrationRow[]>(() => {
    const mapByRegNum = new Map<string, UnifiedRegistrationRow>();

    localRegistrations.forEach((reg) => {
      const kind: UnifiedRegistrationRow['statusKind'] =
        reg.status === 'Under Institutional Review' ? 'review' : 'confirmed';
      mapByRegNum.set(reg.registrationNumber, {
        id: reg.id,
        registrationNumber: reg.registrationNumber,
        applicantName: reg.applicantName,
        applicantEmail: reg.applicantEmail,
        categoryLabel: reg.categoryTitle,
        trackOrProgram: reg.trackType,
        accreditor: reg.accreditor,
        dateLabel: reg.registrationDate,
        statusLabel: reg.status,
        statusKind: kind,
        source: 'personal_submission',
        rawCategoryReg: reg,
      });
    });

    acceptedStudents.forEach((stu) => {
      const existing = mapByRegNum.get(stu.registrationNumber);
      const kind: UnifiedRegistrationRow['statusKind'] =
        stu.admissionStatus === 'Accepted' ? 'accepted' : 'confirmed';

      if (existing) {
        mapByRegNum.set(stu.registrationNumber, {
          ...existing,
          statusLabel: stu.admissionStatus,
          statusKind: kind,
          rawCohortStudent: stu,
        });
        return;
      }

      mapByRegNum.set(stu.registrationNumber, {
        id: stu.id,
        registrationNumber: stu.registrationNumber,
        applicantName: stu.studentName,
        applicantEmail: stu.studentEmail,
        categoryLabel: stu.facultyName,
        trackOrProgram: `${stu.programName} · ${stu.qualificationLevel}`,
        accreditor: stu.accreditor,
        dateLabel: stu.registeredDate || stu.acceptedDate,
        statusLabel: stu.admissionStatus,
        statusKind: kind,
        source: 'cohort_roster',
        rawCohortStudent: stu,
      });
    });

    return Array.from(mapByRegNum.values());
  }, [localRegistrations, acceptedStudents]);

  const counts = useMemo(() => {
    const mine = unifiedRows.filter((row) => {
      if (row.source === 'personal_submission') return true;
      return (
        (userEmailLower && row.applicantEmail.toLowerCase() === userEmailLower) ||
        (userNameLower && row.applicantName.toLowerCase() === userNameLower)
      );
    }).length;
    const confirmed = unifiedRows.filter((r) => r.statusKind === 'confirmed').length;
    const pending = unifiedRows.filter((r) => r.statusKind !== 'confirmed').length;
    return { total: unifiedRows.length, mine, confirmed, pending };
  }, [unifiedRows, userEmailLower, userNameLower]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedRows.filter((row) => {
      if (activeScope === 'mine') {
        const isMine =
          row.source === 'personal_submission' ||
          (userEmailLower && row.applicantEmail.toLowerCase() === userEmailLower) ||
          (userNameLower && row.applicantName.toLowerCase() === userNameLower);
        if (!isMine) return false;
      } else if (activeScope === 'confirmed') {
        if (row.statusKind !== 'confirmed') return false;
      } else if (activeScope === 'pending') {
        if (row.statusKind === 'confirmed') return false;
      }

      if (!q) return true;
      return (
        row.registrationNumber.toLowerCase().includes(q) ||
        row.applicantName.toLowerCase().includes(q) ||
        row.applicantEmail.toLowerCase().includes(q) ||
        row.categoryLabel.toLowerCase().includes(q) ||
        row.trackOrProgram.toLowerCase().includes(q) ||
        row.accreditor.toLowerCase().includes(q)
      );
    });
  }, [unifiedRows, activeScope, searchQuery, userEmailLower, userNameLower]);

  const handleConfirmCohortRegistration = async (student: AcceptedRegisteredStudent) => {
    if (!onUpdateAcceptedStudentStatus) return;
    setUpdatingId(student.id);
    try {
      const updated = await onUpdateAcceptedStudentStatus(student.id, 'Accepted & Registered');
      if (updated) {
        setNotice(
          `Confirmed full registration for ${updated.studentName} (${updated.registrationNumber}).`
        );
        window.setTimeout(() => setNotice(null), 4000);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportRegistrationsCsv = () => {
    const headers = [
      'Registration Number',
      'Applicant Name',
      'Applicant Email',
      'Category / Faculty',
      'Track / Program',
      'Accreditation Board',
      'Status',
      'Date',
    ];
    const rows = [
      headers,
      ...filteredRows.map((row) => [
        row.registrationNumber,
        row.applicantName,
        row.applicantEmail,
        row.categoryLabel,
        row.trackOrProgram,
        row.accreditor,
        row.statusLabel,
        row.dateLabel,
      ]),
    ];
    const csvBody = rows
      .map((line) => line.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csvBody}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTG_Applications_Registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    setNotice(`Exported ${filteredRows.length} registration records to CSV.`);
    window.setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: NEW APPLICATIONS */}
      <section
        aria-labelledby="new-applications-heading"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Institutional Admissions Intake
              </span>
              <span aria-hidden="true">·</span>
              <span>7 Accredited Pathways</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">$0 Application Fee</span>
            </div>
            <h2
              id="new-applications-heading"
              className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              New Applications
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Choose an academic faculty, research fellowship, creative guild, or retreat delegation to start a new free application and receive an official registration ID.
            </p>
          </div>

          {onApplyQualification && (
            <button
              type="button"
              onClick={() => onApplyQualification({ category: 'course_educare' })}
              className="px-4 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors self-start lg:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Application</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {APPLICATION_PATHWAYS.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <article
                key={pathway.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 p-4 flex flex-col justify-between gap-4 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {pathway.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {pathway.scope}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between gap-3">
                  <div className="min-w-0 text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    <span className="font-mono">{pathway.accreditorSummary}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{pathway.turnaround}</span>
                  </div>

                  {onApplyQualification && (
                    <button
                      type="button"
                      onClick={() => onApplyQualification({ category: pathway.id })}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-stone-100 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: REGISTRATIONS */}
      <section
        aria-labelledby="registrations-ledger-heading"
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                Institutional Registrar Ledger
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {counts.total} Total Records
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                {counts.confirmed} Confirmed
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400 font-semibold">
                {counts.pending} Pending
              </span>
            </div>
            <h2
              id="registrations-ledger-heading"
              className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              Registrations
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Track newly submitted category applications, active cohort admissions, official registration numbers, and downloadable transcripts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportRegistrationsCsv}
              className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Registrations CSV</span>
            </button>

            {onOpenFullRoster && (
              <button
                type="button"
                onClick={onOpenFullRoster}
                className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Manage Full Cohort Roster</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            {(
              [
                { id: 'all', label: `All Records (${counts.total})` },
                { id: 'mine', label: `My Submissions (${counts.mine})` },
                { id: 'confirmed', label: `Confirmed (${counts.confirmed})` },
                { id: 'pending', label: `Pending (${counts.pending})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveScope(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeScope === tab.id
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID, name, track, or board..."
              aria-label="Filter registrations"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {notice && (
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/35 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Registrations Table / Empty State */}
        {filteredRows.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950/40 text-center space-y-3">
            <ClipboardCheck className="w-7 h-7 text-stone-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                No registrations match the current filter
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Start a new institutional application above to mint a personalized registration number and transcript.
              </p>
            </div>
            {onApplyQualification && (
              <button
                type="button"
                onClick={() => onApplyQualification({ category: 'course_educare' })}
                className="px-4 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit New Application</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <th className="py-2.5 pr-4">Registration ID</th>
                  <th className="py-2.5 pr-4">Applicant</th>
                  <th className="py-2.5 pr-4">Category &amp; Track</th>
                  <th className="py-2.5 pr-4">Accreditation</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                {filteredRows.map((row) => (
                  <tr
                    key={`${row.id}_${row.registrationNumber}`}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-950/50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap align-top">
                      {row.registrationNumber}
                    </td>

                    <td className="py-3 pr-4 align-top">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">
                        {row.applicantName}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {row.applicantEmail}
                      </div>
                    </td>

                    <td className="py-3 pr-4 align-top max-w-xs">
                      <div className="font-semibold text-stone-800 dark:text-stone-200 leading-snug">
                        {row.categoryLabel}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                        {row.trackOrProgram}
                      </div>
                    </td>

                    <td className="py-3 pr-4 align-top text-stone-600 dark:text-stone-300 max-w-[200px]">
                      {row.accreditor}
                    </td>

                    <td className="py-3 pr-4 align-top whitespace-nowrap">
                      {row.statusKind === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.statusLabel}</span>
                        </span>
                      ) : row.statusKind === 'accepted' ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.statusLabel} · Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.statusLabel}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-4 align-top whitespace-nowrap font-mono tabular-nums text-stone-600 dark:text-stone-300">
                      {row.dateLabel}
                    </td>

                    <td className="py-3 text-right align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {row.rawCategoryReg && (
                          <button
                            type="button"
                            onClick={() =>
                              downloadRegistrationTranscript(row.rawCategoryReg!)
                            }
                            className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Transcript</span>
                          </button>
                        )}

                        {row.rawCohortStudent &&
                          row.rawCohortStudent.admissionStatus === 'Accepted' &&
                          onUpdateAcceptedStudentStatus && (
                            <button
                              type="button"
                              disabled={updatingId === row.rawCohortStudent.id}
                              onClick={() =>
                                void handleConfirmCohortRegistration(
                                  row.rawCohortStudent!
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {updatingId === row.rawCohortStudent.id
                                  ? 'Confirming…'
                                  : 'Confirm'}
                              </span>
                            </button>
                          )}

                        {!row.rawCategoryReg &&
                          (!row.rawCohortStudent ||
                            row.rawCohortStudent.admissionStatus !== 'Accepted') && (
                            <span className="text-[11px] font-mono text-stone-400">
                              On Record
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
