import React, { useMemo, useState } from 'react';
import {
  AcceptedRegisteredStudent,
  FacultyLectureSeries,
  StudentAdmissionStatus,
  UserProfile,
} from '../types';
import { ACADEMIC_FACULTIES } from '../data/academicCatalog';
import { FACULTY_LECTURE_SERIES } from '../data/lecturesAndSyllabuses';
import { AddAcceptedStudentPayload } from '../hooks/useAcceptedStudents';
import {
  BookOpen,
  CheckCircle2,
  Download,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface AcceptedStudentsRosterPanelProps {
  students: AcceptedRegisteredStudent[];
  isLoading?: boolean;
  user: UserProfile;
  canManageRoster?: boolean;
  onAddStudent: (payload: AddAcceptedStudentPayload) => Promise<AcceptedRegisteredStudent | null>;
  onUpdateStudentStatus: (
    id: string,
    status: StudentAdmissionStatus
  ) => Promise<AcceptedRegisteredStudent | null>;
  onOpenLectureSyllabus?: (lectureId: string) => void;
  onStatusBanner?: (message: string) => void;
}

const ACCREDITOR_OPTIONS = [
  'Free Productivity Accreditation Council (FPAC)',
  'Global Distance Learning Accreditation Board (GDLAB)',
  'International Open Curriculum Consortium (IOCC)',
  'Autonomous Systems & Cybernetics Registry (ASCR)',
  'Centre for Open Scientific Verification (COSV)',
  'International Visual Creators Accreditation Board (IVCAB)',
];

export const AcceptedStudentsRosterPanel: React.FC<AcceptedStudentsRosterPanelProps> = ({
  students,
  isLoading = false,
  user,
  canManageRoster = true,
  onAddStudent,
  onUpdateStudentStatus,
  onOpenLectureSyllabus,
  onStatusBanner,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | StudentAdmissionStatus>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  // Add Student Form State
  const defaultFaculty = ACADEMIC_FACULTIES[0];
  const defaultProgramOptions = defaultFaculty.departments.flatMap((d) =>
    d.programs.map((p) => ({ departmentName: d.name, programName: p }))
  );

  const [studentName, setStudentName] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [admissionStatus, setAdmissionStatus] =
    useState<StudentAdmissionStatus>('Accepted & Registered');
  const [facultyId, setFacultyId] = useState<string>(defaultFaculty.id);
  const [programName, setProgramName] = useState<string>(
    defaultProgramOptions[0]?.programName || 'Artificial Intelligence'
  );
  const [qualificationLevel, setQualificationLevel] = useState<string>(
    defaultFaculty.qualifications[1]?.qualificationType || "Bachelor's Degree"
  );
  const [assignedLectureId, setAssignedLectureId] = useState<string>(
    FACULTY_LECTURE_SERIES[0]?.id || ''
  );
  const [accreditor, setAccreditor] = useState<string>(ACCREDITOR_OPTIONS[0]);
  const [standingNotes, setStandingNotes] = useState<string>('');

  const selectedFaculty = useMemo(
    () => ACADEMIC_FACULTIES.find((f) => f.id === facultyId) || ACADEMIC_FACULTIES[0],
    [facultyId]
  );

  const programChoices = useMemo(
    () =>
      selectedFaculty.departments.flatMap((dept) =>
        dept.programs.map((prog) => ({
          departmentName: dept.name,
          programName: prog,
        }))
      ),
    [selectedFaculty]
  );

  const lectureChoices = useMemo(() => {
    const matched = FACULTY_LECTURE_SERIES.filter(
      (lec) => lec.facultyKey === selectedFaculty.filterKey
    );
    return matched.length > 0 ? matched : FACULTY_LECTURE_SERIES;
  }, [selectedFaculty.filterKey]);

  const handleFacultyChange = (nextFacId: string) => {
    setFacultyId(nextFacId);
    const nextFac = ACADEMIC_FACULTIES.find((f) => f.id === nextFacId) || ACADEMIC_FACULTIES[0];
    const firstProg = nextFac.departments[0]?.programs[0] || '';
    setProgramName(firstProg);
    setQualificationLevel(nextFac.qualifications[0]?.qualificationType || "Bachelor's Degree");
    const firstLecture =
      FACULTY_LECTURE_SERIES.find((l) => l.facultyKey === nextFac.filterKey) ||
      FACULTY_LECTURE_SERIES[0];
    setAssignedLectureId(firstLecture?.id || '');
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter !== 'all' && s.admissionStatus !== statusFilter) return false;
      if (facultyFilter !== 'all' && s.facultyId !== facultyFilter) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        s.programName.toLowerCase().includes(q) ||
        s.facultyName.toLowerCase().includes(q) ||
        (s.assignedCourseTitle || '').toLowerCase().includes(q) ||
        (s.leadLecturerName || '').toLowerCase().includes(q)
      );
    });
  }, [students, statusFilter, facultyFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = students.length;
    const acceptedAndRegistered = students.filter(
      (s) => s.admissionStatus === 'Accepted & Registered'
    ).length;
    const registeredOnly = students.filter((s) => s.admissionStatus === 'Registered').length;
    const acceptedAwaiting = students.filter((s) => s.admissionStatus === 'Accepted').length;
    const facultiesRepresented = new Set(students.map((s) => s.facultyId)).size;
    return {
      total,
      acceptedAndRegistered,
      registeredTotal: acceptedAndRegistered + registeredOnly,
      acceptedAwaiting,
      facultiesRepresented,
    };
  }, [students]);

  const handleSubmitNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const matchedDept =
        programChoices.find((p) => p.programName === programName)?.departmentName ||
        selectedFaculty.departments[0]?.name ||
        'Academic Division';
      const chosenLecture: FacultyLectureSeries | undefined = FACULTY_LECTURE_SERIES.find(
        (l) => l.id === assignedLectureId
      );

      const created = await onAddStudent({
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        admissionStatus,
        facultyId: selectedFaculty.id,
        facultyName: selectedFaculty.name,
        departmentName: matchedDept,
        programName,
        qualificationLevel,
        assignedCourseId: chosenLecture?.linkedGuideId || chosenLecture?.id,
        assignedCourseTitle: chosenLecture?.title,
        leadLecturerName: chosenLecture?.lecturerName,
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: new Date().toISOString().slice(0, 10),
        registeredDate:
          admissionStatus === 'Accepted' ? undefined : new Date().toISOString().slice(0, 10),
        accreditor,
        standingNotes: standingNotes.trim() || undefined,
      });

      if (created) {
        const noticeText = `Added ${created.studentName} (${created.registrationNumber}) as ${created.admissionStatus} in ${created.programName}.`;
        setLocalNotice(noticeText);
        onStatusBanner?.(noticeText);
        setStudentName('');
        setStudentEmail('');
        setStandingNotes('');
        setIsAddFormOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRegistration = async (student: AcceptedRegisteredStudent) => {
    setUpdatingId(student.id);
    try {
      const updated = await onUpdateStudentStatus(student.id, 'Accepted & Registered');
      if (updated) {
        const noticeText = `Confirmed full registration for ${updated.studentName} (${updated.registrationNumber}).`;
        setLocalNotice(noticeText);
        onStatusBanner?.(noticeText);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Registration Number',
      'Student Name',
      'Email',
      'Admission Status',
      'Faculty',
      'Department',
      'Specialization Program',
      'Qualification Level',
      'Assigned Lecture / Course',
      'Lead Lecturer',
      'Accepted Date',
      'Registered Date',
      'Accreditor',
    ];
    const escapeCell = (val?: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = filteredStudents.map((s) =>
      [
        s.registrationNumber,
        s.studentName,
        s.studentEmail,
        s.admissionStatus,
        s.facultyName,
        s.departmentName,
        s.programName,
        s.qualificationLevel,
        s.assignedCourseTitle || '',
        s.leadLecturerName || '',
        s.acceptedDate,
        s.registeredDate || '',
        s.accreditor,
      ]
        .map(escapeCell)
        .join(',')
    );
    const csv = [headers.map(escapeCell).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ttg-accepted-registered-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resolveLectureIdForStudent = (student: AcceptedRegisteredStudent): string | undefined => {
    if (!student.assignedCourseId) return undefined;
    const direct = FACULTY_LECTURE_SERIES.find(
      (l) => l.id === student.assignedCourseId || l.linkedGuideId === student.assignedCourseId
    );
    return direct?.id;
  };

  return (
    <section
      aria-label="Accepted and Registered Students Registry"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Admissions &amp; Cohort Registry
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {metrics.total} Total Records across {metrics.facultiesRepresented} Faculties
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Accepted &amp; Registered Students
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
            Official institutional roster of accepted applicants, active registered students, assigned faculty lectures, and specialized degree pathways.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster CSV</span>
          </button>

          {canManageRoster && (
            <button
              type="button"
              onClick={() => {
                setIsAddFormOpen((prev) => !prev);
                if (!studentName && !studentEmail && user.email) {
                  setStudentName('');
                  setStudentEmail('');
                }
              }}
              aria-expanded={isAddFormOpen}
              className="px-4 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {isAddFormOpen ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isAddFormOpen ? 'Close Registration Form' : 'Add Accepted / Registered Student'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Total Roster</span>
            <Users className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {metrics.total}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Active 2026 admissions &amp; registrations
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Accepted &amp; Registered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {metrics.acceptedAndRegistered}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Cleared &amp; enrolled in active lectures
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Registered Scholars</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
            {metrics.registeredTotal}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Active cohort transcript standing
          </div>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Accepted (Intake Queue)</span>
            <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
            {metrics.acceptedAwaiting}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Accepted offer · ready for registration
          </div>
        </div>
      </div>

      {/* Inline Notice */}
      {localNotice && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{localNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setLocalNotice(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 cursor-pointer"
            aria-label="Dismiss student roster notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Accepted / Registered Student Form */}
      {isAddFormOpen && (
        <form
          onSubmit={handleSubmitNewStudent}
          className="p-5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/70 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Register Accepted Student Record
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Assign faculty admission status, specialization program, and specialized lecture series.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStudentName(user.name || '');
                setStudentEmail(user.email || '');
              }}
              className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Fill Current User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Thabo Maseko"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="scholar@ttg.edu"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Admission &amp; Registration Status *
              </label>
              <select
                value={admissionStatus}
                onChange={(e) => setAdmissionStatus(e.target.value as StudentAdmissionStatus)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="Accepted & Registered">Accepted &amp; Registered</option>
                <option value="Registered">Registered</option>
                <option value="Accepted">Accepted (Pending Final Registration)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Academic Faculty *
              </label>
              <select
                value={facultyId}
                onChange={(e) => handleFacultyChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {ACADEMIC_FACULTIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.number}. {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Specialization Program *
              </label>
              <select
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {programChoices.map((p) => (
                  <option key={`${p.departmentName}-${p.programName}`} value={p.programName}>
                    {p.programName} ({p.departmentName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Qualification Pathway *
              </label>
              <select
                value={qualificationLevel}
                onChange={(e) => setQualificationLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {selectedFaculty.qualifications.map((q) => (
                  <option key={q.id} value={q.qualificationType}>
                    {q.level}: {q.qualificationType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Assigned Lecture &amp; Specialized Syllabus
              </label>
              <select
                value={assignedLectureId}
                onChange={(e) => setAssignedLectureId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {lectureChoices.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.lectureCode}: {lec.title} ({lec.lecturerName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Accreditation &amp; Standards Body
              </label>
              <select
                value={accreditor}
                onChange={(e) => setAccreditor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {ACCREDITOR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Standing Notes (Optional)
              </label>
              <input
                type="text"
                value={standingNotes}
                onChange={(e) => setStandingNotes(e.target.value)}
                placeholder="e.g. Honours entrance scholarship recipient"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Record...' : 'Save Student to Registry'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Accepted & Registered', 'Registered', 'Accepted'] as const).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                  active
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                    : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                {status === 'all' ? `All Students (${students.length})` : status}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            aria-label="Filter roster by faculty"
            className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">All 6 Faculties</option>
            {ACADEMIC_FACULTIES.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.number}. {fac.shortName}
              </option>
            ))}
          </select>

          <div className="relative min-w-[230px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, program, or lecturer..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto border-t border-stone-200 dark:border-stone-800 pt-2">
        {isLoading && students.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-500 dark:text-stone-400">
            Loading accepted and registered student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-500 dark:text-stone-400">
            No accepted or registered students match your active filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th className="py-3 pr-4 font-semibold">Student &amp; Reg ID</th>
                <th className="py-3 pr-4 font-semibold">Admission Standing</th>
                <th className="py-3 pr-4 font-semibold">Faculty &amp; Specialization</th>
                <th className="py-3 pr-4 font-semibold">Assigned Lecture &amp; Lecturer</th>
                <th className="py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredStudents.map((student) => {
                const isSelf =
                  student.studentEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
                const linkedLecId = resolveLectureIdForStudent(student);
                const statusColorClass =
                  student.admissionStatus === 'Accepted & Registered'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : student.admissionStatus === 'Registered'
                    ? 'text-indigo-700 dark:text-indigo-400'
                    : 'text-amber-700 dark:text-amber-400';
                const StatusIcon =
                  student.admissionStatus === 'Accepted & Registered'
                    ? CheckCircle2
                    : student.admissionStatus === 'Registered'
                    ? ShieldCheck
                    : GraduationCap;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/30 transition-colors align-top"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {student.studentName}
                        {isSelf && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {' '}
                            · You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        {student.studentEmail}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-stone-600 dark:text-stone-300 mt-0.5">
                        {student.registrationNumber}
                      </div>
                    </td>

                    <td className="py-3.5 pr-4">
                      <div className={`inline-flex items-center gap-1.5 font-semibold ${statusColorClass}`}>
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{student.admissionStatus}</span>
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 mt-1">
                        Accepted {student.acceptedDate}
                        {student.registeredDate ? ` · Registered ${student.registeredDate}` : ''}
                      </div>
                      {student.standingNotes && (
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs">
                          {student.standingNotes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 pr-4 max-w-[260px]">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">
                        {student.programName}
                      </div>
                      <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                        {student.facultyName} · {student.departmentName}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {student.qualificationLevel}
                      </div>
                    </td>

                    <td className="py-3.5 pr-4 max-w-[260px]">
                      {student.assignedCourseTitle ? (
                        <>
                          <div className="font-semibold text-stone-800 dark:text-stone-200">
                            {student.assignedCourseTitle}
                          </div>
                          {student.leadLecturerName && (
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                              Lecturer: {student.leadLecturerName}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-stone-400">Pending lecture assignment</span>
                      )}
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {linkedLecId && onOpenLectureSyllabus && (
                          <button
                            type="button"
                            onClick={() => onOpenLectureSyllabus(linkedLecId)}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Syllabus</span>
                          </button>
                        )}
                        {canManageRoster && student.admissionStatus === 'Accepted' && (
                          <button
                            type="button"
                            disabled={updatingId === student.id}
                            onClick={() => void handleConfirmRegistration(student)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {updatingId === student.id ? 'Updating...' : 'Confirm Registration'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
