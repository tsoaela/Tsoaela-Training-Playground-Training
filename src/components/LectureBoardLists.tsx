import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Calendar,
  Clock,
  Columns3,
  Layers,
  List,
  Users,
} from 'lucide-react';
import {
  AcceptedRegisteredStudent,
  FacultyLectureSeries,
  LectureDeliveryFormat,
} from '../types';
import { FACULTY_LECTURE_SERIES } from '../data/lecturesAndSyllabuses';

const PINNED_LECTURES_KEY = 'ttg_pinned_lecture_board_v1';

interface LectureBoardListsProps {
  acceptedStudents?: AcceptedRegisteredStudent[];
  activeLectureId?: string;
  onSelectLectureForSyllabus?: (lectureId: string) => void;
  onOpenStudyGuide?: (guideId: string) => void;
}

const BOARD_COLUMNS: Array<{
  format: LectureDeliveryFormat;
  subtitle: string;
}> = [
  {
    format: 'Live Seminar & Lab',
    subtitle: 'Synchronous technical seminars & live lab hours',
  },
  {
    format: 'Recorded Lecture Series',
    subtitle: 'Self-paced modular lectures with weekly Q&A',
  },
  {
    format: 'Practicum & Case Colloquium',
    subtitle: 'Applied executive studio & case-defense tracks',
  },
];

export const LectureBoardLists: React.FC<LectureBoardListsProps> = ({
  acceptedStudents = [],
  activeLectureId,
  onSelectLectureForSyllabus,
  onOpenStudyGuide,
}) => {
  const [boardLayout, setBoardLayout] = useState<'boards' | 'list'>('boards');
  const [sortBy, setSortBy] = useState<'code' | 'units' | 'cohort'>('code');
  const [pinnedLectureIds, setPinnedLectureIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_LECTURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : ['lec_ai_test_time_search', 'lec_systems_first_principles'];
      }
    } catch {
      // ignore
    }
    return ['lec_ai_test_time_search', 'lec_systems_first_principles'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_LECTURES_KEY, JSON.stringify(pinnedLectureIds));
    } catch {
      // ignore
    }
  }, [pinnedLectureIds]);

  const togglePinLecture = (lectureId: string) => {
    setPinnedLectureIds((prev) =>
      prev.includes(lectureId)
        ? prev.filter((id) => id !== lectureId)
        : [lectureId, ...prev]
    );
  };

  const getCohortCount = (lec: FacultyLectureSeries): number => {
    return acceptedStudents.filter(
      (s) =>
        s.assignedCourseId === lec.id ||
        (lec.linkedGuideId && s.assignedCourseId === lec.linkedGuideId) ||
        s.leadLecturerName?.toLowerCase().includes(lec.lecturerName.toLowerCase())
    ).length;
  };

  const sortedLectures = useMemo(() => {
    return [...FACULTY_LECTURE_SERIES].sort((a, b) => {
      if (sortBy === 'units') {
        return b.specializedSyllabus.length - a.specializedSyllabus.length;
      }
      if (sortBy === 'cohort') {
        return getCohortCount(b) - getCohortCount(a);
      }
      return a.lectureCode.localeCompare(b.lectureCode);
    });
  }, [sortBy, acceptedStudents]);

  const pinnedLectures = useMemo(
    () => sortedLectures.filter((lec) => pinnedLectureIds.includes(lec.id)),
    [sortedLectures, pinnedLectureIds]
  );

  return (
    <section
      aria-labelledby="lecture-board-lists-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Columns3 className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              Curriculum Schedule &amp; Format Boards
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {FACULTY_LECTURE_SERIES.length} Lecture Tracks · {pinnedLectures.length} Pinned
            </span>
          </div>
          <h3
            id="lecture-board-lists-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Lecture Board Lists
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl">
            Browse lecture series grouped into delivery boards or as a sortable master schedule list. Pin priority tracks to your personal board or open any syllabus directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'code' | 'units' | 'cohort')}
            aria-label="Sort lecture board lists"
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
          >
            <option value="code">Sort: Lecture Code</option>
            <option value="units">Sort: Most Syllabus Units</option>
            <option value="cohort">Sort: Largest Student Cohort</option>
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setBoardLayout('boards')}
              className={`px-3 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                boardLayout === 'boards'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Board Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setBoardLayout('list')}
              className={`px-3 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                boardLayout === 'list'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Master List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Priority Lecture Board List */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-900 dark:text-stone-100 inline-flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span>Pinned Priority Lecture Board ({pinnedLectures.length})</span>
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Click pin icons below to customize your study board
          </span>
        </div>

        {pinnedLectures.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            No lectures pinned yet. Pin any track from the boards below to keep it at the top of your schedule.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedLectures.map((lec) => {
              const cohortCount = getCohortCount(lec);
              return (
                <div
                  key={`pinned_${lec.id}`}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-purple-700 dark:text-purple-400">
                        {lec.lectureCode}
                      </span>
                      <span>{lec.scheduleSlot}</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {lec.title}
                    </h4>
                    <div className="text-[11px] text-stone-600 dark:text-stone-400">
                      {lec.lecturerName} · {lec.specializedSyllabus.length} syllabus units ·{' '}
                      <span className="font-mono tabular-nums">{cohortCount} scholars</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    {onSelectLectureForSyllabus && (
                      <button
                        type="button"
                        onClick={() => onSelectLectureForSyllabus(lec.id)}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Syllabus</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => togglePinLecture(lec.id)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
                    >
                      Unpin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mode 1: Delivery Track Board Columns */}
      {boardLayout === 'boards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {BOARD_COLUMNS.map((col) => {
            const columnLectures = sortedLectures.filter(
              (lec) => lec.deliveryFormat === col.format
            );
            return (
              <div
                key={col.format}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 p-4 space-y-3"
              >
                <div className="border-b border-stone-200 dark:border-stone-800 pb-3 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {col.format}
                    </h4>
                    <span className="text-[11px] font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                      {columnLectures.length} Boards
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {col.subtitle}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {columnLectures.map((lec) => {
                    const isPinned = pinnedLectureIds.includes(lec.id);
                    const isSelected = activeLectureId === lec.id;
                    const cohortCount = getCohortCount(lec);
                    return (
                      <div
                        key={lec.id}
                        className={`p-3.5 rounded-xl border bg-white dark:bg-stone-900 space-y-2 transition-colors ${
                          isSelected
                            ? 'border-purple-600 dark:border-purple-500'
                            : 'border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            {lec.lectureCode} · {lec.facultyKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinLecture(lec.id)}
                            aria-label={isPinned ? `Unpin ${lec.title}` : `Pin ${lec.title}`}
                            className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold cursor-pointer ${
                              isPinned
                                ? 'text-purple-700 dark:text-purple-400'
                                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                            }`}
                          >
                            {isPinned ? (
                              <BookmarkCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                          </button>
                        </div>

                        <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                          {lec.title}
                        </h5>

                        <div className="text-[11px] text-stone-600 dark:text-stone-400 space-y-0.5">
                          <div className="font-medium text-stone-800 dark:text-stone-200">
                            {lec.lecturerName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{lec.scheduleSlot}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {lec.specializedSyllabus.length} units
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Users className="w-3 h-3" />
                              {cohortCount} enrolled
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                          {onSelectLectureForSyllabus && (
                            <button
                              type="button"
                              onClick={() => onSelectLectureForSyllabus(lec.id)}
                              className="font-bold text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Syllabus</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {lec.linkedGuideId && onOpenStudyGuide && (
                            <button
                              type="button"
                              onClick={() => onOpenStudyGuide(lec.linkedGuideId!)}
                              className="font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Study Guide</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Master Lecture Board List Table */
        <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-950/70 text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-3 font-semibold">Code</th>
                <th className="py-3 px-3 font-semibold">Lecture Series &amp; Faculty</th>
                <th className="py-3 px-3 font-semibold">Lead Lecturer</th>
                <th className="py-3 px-3 font-semibold">Format &amp; Schedule</th>
                <th className="py-3 px-3 font-semibold text-right">Units</th>
                <th className="py-3 px-3 font-semibold text-right">Cohort</th>
                <th className="py-3 px-3 font-semibold text-right">Board Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {sortedLectures.map((lec) => {
                const isPinned = pinnedLectureIds.includes(lec.id);
                const cohortCount = getCohortCount(lec);
                return (
                  <tr
                    key={lec.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-950/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                      {lec.lectureCode}
                    </td>
                    <td className="py-3 px-3 min-w-[220px]">
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {lec.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {lec.facultyName} · {lec.nqfLevel}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-700 dark:text-stone-300 whitespace-nowrap">
                      {lec.lecturerName}
                    </td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                      <div>{lec.deliveryFormat}</div>
                      <div className="text-[11px] font-mono tabular-nums inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{lec.scheduleSlot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                      {lec.specializedSyllabus.length} units
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {cohortCount}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePinLecture(lec.id)}
                          className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer ${
                            isPinned
                              ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                              : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                          }`}
                        >
                          {isPinned ? 'Pinned' : 'Pin'}
                        </button>
                        {onSelectLectureForSyllabus && (
                          <button
                            type="button"
                            onClick={() => onSelectLectureForSyllabus(lec.id)}
                            className="px-2.5 py-1 rounded-md bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] font-semibold cursor-pointer hover:opacity-90"
                          >
                            Syllabus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
