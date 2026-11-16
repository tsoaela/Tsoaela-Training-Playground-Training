import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Gauge,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  CourseModuleFeedback,
  EnrolledStudentRecord,
  StudyGuide,
  UserProfile,
} from '../types';

export interface SubmitCourseFeedbackPayload {
  courseId: string;
  courseTitle: string;
  moduleIndex: number;
  moduleTitle: string;
  difficultyRating: number;
  clarityRating: number;
  focusArea: 'Difficulty' | 'Clarity' | 'Both';
  comment: string;
}

interface StudentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyGuides: StudyGuide[];
  enrollments: EnrolledStudentRecord[];
  user: UserProfile;
  initialCourseId?: string;
  initialModuleIndex?: number;
  onSubmitCourseFeedback: (payload: SubmitCourseFeedbackPayload) => void;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Too Easy',
  2: 'Accessible',
  3: 'Balanced',
  4: 'Challenging',
  5: 'Very Dense',
};

const CLARITY_LABELS: Record<number, string> = {
  1: 'Confusing',
  2: 'Needs Examples',
  3: 'Understandable',
  4: 'Clear',
  5: 'Crystal Clear',
};

export const StudentFeedbackModal: React.FC<StudentFeedbackModalProps> = ({
  isOpen,
  onClose,
  studyGuides,
  enrollments,
  user,
  initialCourseId,
  initialModuleIndex = 0,
  onSubmitCourseFeedback,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || studyGuides[0]?.id || ''
  );
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(initialModuleIndex);
  const [focusArea, setFocusArea] = useState<'Difficulty' | 'Clarity' | 'Both'>('Both');
  const [difficultyRating, setDifficultyRating] = useState<number>(3);
  const [clarityRating, setClarityRating] = useState<number>(4);
  const [comment, setComment] = useState<string>('');
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialCourseId && studyGuides.some((g) => g.id === initialCourseId)) {
      setSelectedCourseId(initialCourseId);
    } else if (!selectedCourseId && studyGuides[0]?.id) {
      setSelectedCourseId(studyGuides[0].id);
    }
    setSelectedModuleIndex(initialModuleIndex || 0);
    setJustSubmitted(false);
  }, [isOpen, initialCourseId, initialModuleIndex, studyGuides]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const activeCourse = useMemo(
    () => studyGuides.find((g) => g.id === selectedCourseId) || studyGuides[0],
    [studyGuides, selectedCourseId]
  );

  const safeModuleIndex =
    activeCourse && selectedModuleIndex < activeCourse.chapters.length
      ? selectedModuleIndex
      : 0;

  const activeModuleTitle =
    activeCourse?.chapters[safeModuleIndex]?.title ||
    `Module ${safeModuleIndex + 1}`;

  const existingFeedbackForCourse = useMemo<CourseModuleFeedback[]>(() => {
    if (!activeCourse) return [];
    const userEmailLower = user.email.trim().toLowerCase();
    const userNameLower = user.name.trim().toLowerCase();
    const items: CourseModuleFeedback[] = [];
    enrollments.forEach((rec) => {
      if (rec.courseId !== activeCourse.id) return;
      const matchesUser =
        (userEmailLower && rec.studentEmail.toLowerCase() === userEmailLower) ||
        (userNameLower && rec.studentName.toLowerCase() === userNameLower);
      if (matchesUser && Array.isArray(rec.courseFeedback)) {
        items.push(...rec.courseFeedback);
      }
    });
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activeCourse, enrollments, user.email, user.name]);

  if (!isOpen || !activeCourse) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmitCourseFeedback({
      courseId: activeCourse.id,
      courseTitle: activeCourse.title,
      moduleIndex: safeModuleIndex,
      moduleTitle: activeModuleTitle,
      difficultyRating,
      clarityRating,
      focusArea,
      comment: comment.trim(),
    });

    setComment('');
    setJustSubmitted(true);
    window.setTimeout(() => setJustSubmitted(false), 4500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-feedback-modal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Course Quality Loop · Stored in Enrollment Record</span>
            </div>
            <h2
              id="student-feedback-modal-title"
              className="text-lg font-bold text-stone-900 dark:text-stone-100"
            >
              Student Feedback: Module Difficulty &amp; Clarity
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Share specific module comments for Faculty review to help calibrate pacing and explanation clarity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Student Feedback modal"
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {justSubmitted && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Feedback saved to your enrollment record&apos;s <code className="font-mono">courseFeedback</code> log for Faculty review.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course & Module Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="feedback-course-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1"
                >
                  Course
                </label>
                <select
                  id="feedback-course-select"
                  value={activeCourse.id}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedModuleIndex(0);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:border-purple-600"
                >
                  {studyGuides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="feedback-module-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1"
                >
                  Course Module / Chapter
                </label>
                <select
                  id="feedback-module-select"
                  value={safeModuleIndex}
                  onChange={(e) => setSelectedModuleIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:border-purple-600"
                >
                  {activeCourse.chapters.map((ch, idx) => (
                    <option key={idx} value={idx}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Focus Area Toggle */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                Feedback Dimension
              </span>
              <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 gap-1">
                {(['Difficulty', 'Clarity', 'Both'] as const).map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setFocusArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      focusArea === area
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {area === 'Both' ? 'Difficulty & Clarity' : area}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Clarity Rating Scales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Module Difficulty</span>
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {difficultyRating}/5 · {DIFFICULTY_LABELS[difficultyRating]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDifficultyRating(val)}
                      className={`flex-1 py-1.5 rounded-lg border font-mono font-bold transition-colors cursor-pointer ${
                        difficultyRating === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                  <span>1 Too Easy</span>
                  <span>5 Very Dense</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Explanation Clarity</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {clarityRating}/5 · {CLARITY_LABELS[clarityRating]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setClarityRating(val)}
                      className={`flex-1 py-1.5 rounded-lg border font-mono font-bold transition-colors cursor-pointer ${
                        clarityRating === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400">
                  <span>1 Confusing</span>
                  <span>5 Crystal Clear</span>
                </div>
              </div>
            </div>

            {/* Specific Comment Textarea */}
            <div>
              <label
                htmlFor="student-feedback-comment"
                className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1"
              >
                Specific Comments on Difficulty or Clarity *
              </label>
              <textarea
                id="student-feedback-comment"
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share what helped or slowed you down in "${activeModuleTitle}" (e.g. mathematical prerequisites, missing worked examples, pacing expectations)...`}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Module Feedback</span>
              </button>
            </div>
          </form>

          {/* Previously Submitted Course Feedback */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Your Submitted Feedback for This Course ({existingFeedbackForCourse.length})</span>
              </span>
            </div>

            {existingFeedbackForCourse.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400 italic py-2">
                No module feedback recorded yet for {activeCourse.title}.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {existingFeedbackForCourse.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {fb.moduleTitle}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Diff {fb.difficultyRating}/5
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Clarity {fb.clarityRating}/5
                        </span>
                        <span className="text-stone-400">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {fb.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
