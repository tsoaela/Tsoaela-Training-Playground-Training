import React, { useMemo, useState, useEffect } from 'react';
import {
  AcceptedRegisteredStudent,
  FacultyLectureSeries,
  LectureDeliveryFormat,
} from '../types';
import { ACADEMIC_CATEGORY_FILTERS, AcademicCategoryKey } from '../data/academicCatalog';
import {
  FACULTY_LECTURE_SERIES,
  formatLectureSyllabusMarkdown,
} from '../data/lecturesAndSyllabuses';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Search,
  UserCheck,
  Users,
  Columns3,
} from 'lucide-react';
import { LectureBoardLists } from './LectureBoardLists';

interface LecturesAndSyllabusesPanelProps {
  acceptedStudents?: AcceptedRegisteredStudent[];
  selectedLectureId?: string | null;
  onOpenStudyGuide?: (guideId: string) => void;
  onOpenStudentsRoster?: () => void;
}

export const LecturesAndSyllabusesPanel: React.FC<LecturesAndSyllabusesPanelProps> = ({
  acceptedStudents = [],
  selectedLectureId: controlledLectureId = null,
  onOpenStudyGuide,
  onOpenStudentsRoster,
}) => {
  const [facultyFilter, setFacultyFilter] = useState<'all' | AcademicCategoryKey>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | LectureDeliveryFormat>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLectureId, setActiveLectureId] = useState<string>(
    controlledLectureId || FACULTY_LECTURE_SERIES[0].id
  );
  const [expandedUnitCodes, setExpandedUnitCodes] = useState<string[]>(() =>
    FACULTY_LECTURE_SERIES[0].specializedSyllabus.map((u) => u.unitCode)
  );

  useEffect(() => {
    if (controlledLectureId) {
      setActiveLectureId(controlledLectureId);
      const found = FACULTY_LECTURE_SERIES.find((l) => l.id === controlledLectureId);
      if (found) {
        setExpandedUnitCodes(found.specializedSyllabus.map((u) => u.unitCode));
      }
    }
  }, [controlledLectureId]);

  const filteredLectures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FACULTY_LECTURE_SERIES.filter((lec) => {
      if (facultyFilter !== 'all' && lec.facultyKey !== facultyFilter) return false;
      if (formatFilter !== 'all' && lec.deliveryFormat !== formatFilter) return false;
      if (!q) return true;
      return (
        lec.title.toLowerCase().includes(q) ||
        lec.lectureCode.toLowerCase().includes(q) ||
        lec.lecturerName.toLowerCase().includes(q) ||
        lec.specialization.toLowerCase().includes(q) ||
        lec.facultyName.toLowerCase().includes(q) ||
        lec.specializedSyllabus.some(
          (unit) =>
            unit.lectureTitle.toLowerCase().includes(q) ||
            unit.synopsis.toLowerCase().includes(q) ||
            unit.specializedTopics.some((t) => t.toLowerCase().includes(q))
        )
      );
    });
  }, [facultyFilter, formatFilter, searchQuery]);

  const activeLecture: FacultyLectureSeries = useMemo(() => {
    return (
      filteredLectures.find((l) => l.id === activeLectureId) ||
      filteredLectures[0] ||
      FACULTY_LECTURE_SERIES[0]
    );
  }, [filteredLectures, activeLectureId]);

  const handleSelectLecture = (lec: FacultyLectureSeries) => {
    setActiveLectureId(lec.id);
    setExpandedUnitCodes(lec.specializedSyllabus.map((u) => u.unitCode));
  };

  const toggleUnitExpanded = (unitCode: string) => {
    setExpandedUnitCodes((prev) =>
      prev.includes(unitCode) ? prev.filter((c) => c !== unitCode) : [...prev, unitCode]
    );
  };

  const getCohortForLecture = (lec: FacultyLectureSeries): AcceptedRegisteredStudent[] => {
    return acceptedStudents.filter(
      (s) =>
        s.assignedCourseId === lec.id ||
        (lec.linkedGuideId && s.assignedCourseId === lec.linkedGuideId) ||
        s.leadLecturerName?.toLowerCase().includes(lec.lecturerName.toLowerCase())
    );
  };

  const activeCohort = useMemo(
    () => getCohortForLecture(activeLecture),
    [acceptedStudents, activeLecture]
  );

  const handleDownloadSyllabusMarkdown = (lec: FacultyLectureSeries) => {
    const markdown = formatLectureSyllabusMarkdown(lec);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lec.lectureCode.toLowerCase()}-specialized-syllabus.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalLectureUnits = useMemo(
    () =>
      FACULTY_LECTURE_SERIES.reduce((sum, lec) => sum + lec.specializedSyllabus.length, 0),
    []
  );

  return (
    <section
      aria-label="Faculty Lectures and Specialized Syllabuses"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <GraduationCap className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              Faculty Academic Curriculum
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {FACULTY_LECTURE_SERIES.length} Lecture Series · {totalLectureUnits} Specialized Units
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Lectures &amp; Specialized Syllabuses
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
            Inspect faculty-led lecture schedules, named chairs, module-by-module specialized syllabus specifications, required readings, and deliverables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('lecture-board-lists-container')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-3.5 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-semibold text-purple-800 dark:text-purple-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Lecture Board Lists</span>
          </button>
          {onOpenStudentsRoster && (
            <button
              type="button"
              onClick={onOpenStudentsRoster}
              className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>View Registered Students ({acceptedStudents.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDownloadSyllabusMarkdown(activeLecture)}
            className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Active Syllabus (.md)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFacultyFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
              facultyFilter === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            All Faculties ({FACULTY_LECTURE_SERIES.length})
          </button>
          {ACADEMIC_CATEGORY_FILTERS.map((cat) => {
            const active = facultyFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setFacultyFilter(active ? 'all' : cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer border ${
                  active
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-purple-400'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={formatFilter}
            onChange={(e) =>
              setFormatFilter(e.target.value as 'all' | LectureDeliveryFormat)
            }
            aria-label="Filter lectures by delivery format"
            className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
          >
            <option value="all">All Delivery Formats</option>
            <option value="Live Seminar & Lab">Live Seminar &amp; Lab</option>
            <option value="Recorded Lecture Series">Recorded Lecture Series</option>
            <option value="Practicum & Case Colloquium">Practicum &amp; Case Colloquium</option>
          </select>

          <div className="relative min-w-[230px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lecture, lecturer, or topic..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      {filteredLectures.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-500 dark:text-stone-400 space-y-2">
          <p>No lectures match your current faculty or keyword filter.</p>
          <button
            type="button"
            onClick={() => {
              setFacultyFilter('all');
              setFormatFilter('all');
              setSearchQuery('');
            }}
            className="font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
          >
            Reset Lecture Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Lecture Roster */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Select Lecture Series ({filteredLectures.length})
            </div>

            <div className="space-y-2.5">
              {filteredLectures.map((lec) => {
                const isSelected = lec.id === activeLecture.id;
                const cohortCount = getCohortForLecture(lec).length;
                return (
                  <button
                    key={lec.id}
                    type="button"
                    onClick={() => handleSelectLecture(lec)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-purple-600 dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/25'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-purple-700 dark:text-purple-400">
                        {lec.lectureCode}
                      </span>
                      <span>
                        {lec.facultyKey} · {lec.specializedSyllabus.length} Units
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {lec.title}
                    </h3>

                    <div className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      {lec.lecturerName}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
                      <span>{lec.deliveryFormat}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{lec.totalDuration}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {cohortCount} {cohortCount === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Specialized Syllabus Inspector */}
          <div className="lg:col-span-7 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/40 p-5 sm:p-6 space-y-5">
            {/* Lecture Header */}
            <div className="space-y-3 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                  {activeLecture.lectureCode} · {activeLecture.nqfLevel}
                </span>
                <span className="font-mono tabular-nums">
                  {activeLecture.facultyName} / {activeLecture.departmentName}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {activeLecture.title}
              </h3>

              <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
                <div>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    Lead Lecturer:
                  </span>{' '}
                  {activeLecture.lecturerName} — {activeLecture.lecturerTitle}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-600 dark:text-stone-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{activeLecture.scheduleSlot}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeLecture.totalDuration}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{activeCohort.length} Accepted/Registered</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                {activeLecture.syllabusOverview}
              </p>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeLecture.linkedGuideId && onOpenStudyGuide && (
                  <button
                    type="button"
                    onClick={() => onOpenStudyGuide(activeLecture.linkedGuideId!)}
                    className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Interactive Study Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setExpandedUnitCodes((prev) =>
                      prev.length === activeLecture.specializedSyllabus.length
                        ? []
                        : activeLecture.specializedSyllabus.map((u) => u.unitCode)
                    )
                  }
                  className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {expandedUnitCodes.length === activeLecture.specializedSyllabus.length
                    ? 'Collapse Syllabus Units'
                    : 'Expand All Units'}
                </button>
              </div>
            </div>

            {/* Prerequisites & Assessment Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  Prerequisites &amp; Foundations
                </div>
                <ul className="space-y-1 text-stone-600 dark:text-stone-400">
                  {activeLecture.prerequisites.map((pre) => (
                    <li key={pre}>· {pre}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  Assessment &amp; Evaluation Rubric
                </div>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  {activeLecture.assessmentModel}
                </p>
              </div>
            </div>

            {/* Cohort Roster Summary for this Lecture */}
            {activeCohort.length > 0 && (
              <div className="space-y-1.5 border-b border-stone-200 dark:border-stone-800 pb-4 text-xs">
                <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Registered Students in This Lecture Track</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600 dark:text-stone-300">
                  {activeCohort.map((stu, idx) => (
                    <span key={stu.id}>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {stu.studentName}
                      </span>{' '}
                      <span className="font-mono text-stone-500 dark:text-stone-400">
                        ({stu.admissionStatus})
                      </span>
                      {idx < activeCohort.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specialized Syllabus Units */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    Specialized Syllabus Modules ({activeLecture.specializedSyllabus.length})
                  </span>
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  {activeLecture.specialization}
                </span>
              </div>

              <div className="space-y-2.5">
                {activeLecture.specializedSyllabus.map((unit) => {
                  const isOpen = expandedUnitCodes.includes(unit.unitCode);
                  return (
                    <div
                      key={unit.unitCode}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleUnitExpanded(unit.unitCode)}
                        aria-expanded={isOpen}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                            <span className="font-bold text-purple-700 dark:text-purple-400">
                              {String(unit.lectureNumber).padStart(2, '0')}. {unit.unitCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{unit.format}</span>
                            <span aria-hidden="true">·</span>
                            <span>{unit.duration}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                            {unit.lectureTitle}
                          </h4>
                        </div>
                        <span className="text-stone-500 dark:text-stone-400 shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-3 text-xs">
                          <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                            {unit.synopsis}
                          </p>

                          <div className="space-y-1">
                            <div className="font-semibold text-stone-900 dark:text-stone-100">
                              Specialized Topics Covered
                            </div>
                            <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                              {unit.specializedTopics.map((topic) => (
                                <li key={topic}>· {topic}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                                Required Reading / Artifact
                              </span>
                              <span className="text-stone-600 dark:text-stone-400 inline-flex items-center gap-1 mt-0.5">
                                <FileText className="w-3 h-3 shrink-0" />
                                <span>{unit.requiredReadingOrArtifact}</span>
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                                Unit Deliverable
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 block">
                                {unit.deliverable}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Lecture Board Lists Section */}
      <div id="lecture-board-lists-container" className="pt-2">
        <LectureBoardLists
          acceptedStudents={acceptedStudents}
          activeLectureId={activeLecture.id}
          onSelectLectureForSyllabus={(lectureId) => {
            const target = FACULTY_LECTURE_SERIES.find((l) => l.id === lectureId);
            if (target) {
              setFacultyFilter('all');
              setFormatFilter('all');
              setSearchQuery('');
              handleSelectLecture(target);
              document
                .querySelector('[aria-label="Faculty Lectures and Specialized Syllabuses"]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          onOpenStudyGuide={onOpenStudyGuide}
        />
      </div>
    </section>
  );
};
