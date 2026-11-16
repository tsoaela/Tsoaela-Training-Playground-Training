import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  BarChart2,
  BookOpen,
  Plus,
  CheckCircle2,
  Award,
  Search,
  Lock,
  LogIn,
  FileEdit,
  Save,
  Sparkles,
  GraduationCap,
  Send,
  Layers,
  AlertCircle,
  X,
  Radar as RadarIcon,
  MessageSquare,
  Star,
  ThumbsUp,
  Eye,
  Gauge,
  MessageSquarePlus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import {
  StudyGuide,
  UserProfile,
  UserRole,
  EnrolledStudentRecord,
  PeerReviewEntry
} from '../types';
import { SUBJECT_AREAS } from '../data/facultyData';
import { CourseCertificateModal } from './CourseCertificateModal';
import {
  formatCertificateSerial,
  getCertificateForStudyGuide,
  resolveCertificateByCategory,
} from '../data/certificatesData';

interface FacultyPortalTabProps {
  user: UserProfile;
  userRole: UserRole;
  isAuthenticated: boolean;
  studyGuides: StudyGuide[];
  enrollments: EnrolledStudentRecord[];
  onOpenAuthModal: () => void;
  onUpdateStudyGuide: (updatedGuide: StudyGuide) => void;
  onNewChapterAdded: (courseId: string, courseTitle: string, chapterTitle: string) => void;
  onGradeAssignment: (
    enrollmentId: string,
    score: number,
    feedback: string
  ) => void;
  onAddPeerReview: (
    enrollmentId: string,
    review: Omit<PeerReviewEntry, 'id' | 'createdAt'>
  ) => void;
}

export const FacultyPortalTab: React.FC<FacultyPortalTabProps> = ({
  user,
  userRole,
  isAuthenticated,
  studyGuides,
  enrollments,
  onOpenAuthModal,
  onUpdateStudyGuide,
  onNewChapterAdded,
  onGradeAssignment,
  onAddPeerReview,
}) => {
  const [activeSubView, setActiveSubView] = useState<'enrollment' | 'results' | 'feedback' | 'syllabus'>('enrollment');
  const [feedbackFocusFilter, setFeedbackFocusFilter] = useState<'All' | 'Difficulty' | 'Clarity' | 'Both'>('All');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Grading' | 'Graded' | 'Not Submitted'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedRadarEnrollmentId, setSelectedRadarEnrollmentId] = useState<string>(enrollments[0]?.id || '');

  // Grading & Peer Review modal state
  const [gradingRecordId, setGradingRecordId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'grade' | 'peer_review'>('grade');
  const [gradeScoreInput, setGradeScoreInput] = useState<string>('92');
  const [gradeFeedbackInput, setGradeFeedbackInput] = useState<string>('');

  // Inline & Modal Peer Review Feedback state
  const [selectedPeerReviewId, setSelectedPeerReviewId] = useState<string>(
    enrollments.find(e => e.studentEmail.toLowerCase() !== user.email.toLowerCase() && e.assignmentStatus !== 'Not Submitted')?.id ||
    enrollments[0]?.id ||
    ''
  );
  const [peerRating, setPeerRating] = useState<number>(5);
  const [peerStrengths, setPeerStrengths] = useState<string>('');
  const [peerImprovements, setPeerImprovements] = useState<string>('');
  const [peerCritique, setPeerCritique] = useState<string>('');

  // Syllabus Editor state
  const [syllabusCourseId, setSyllabusCourseId] = useState<string>(studyGuides[0]?.id || '');
  const activeSyllabusCourse = useMemo(
    () => studyGuides.find(g => g.id === syllabusCourseId) || studyGuides[0],
    [studyGuides, syllabusCourseId]
  );

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterContent, setNewChapterContent] = useState('');
  const [editingAbstract, setEditingAbstract] = useState<string | null>(null);
  const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [editingChapterContent, setEditingChapterContent] = useState('');
  const [portalFeedback, setPortalFeedback] = useState<string | null>(null);
  const [certificatePreviewTarget, setCertificatePreviewTarget] = useState<{
    record?: EnrolledStudentRecord;
    guide?: StudyGuide;
  } | null>(null);

  const showPortalFeedback = (msg: string) => {
    setPortalFeedback(msg);
    setTimeout(() => setPortalFeedback(null), 4000);
  };

  const isInstructor = isAuthenticated && userRole === 'instructor';

  // Filter enrollments by selected course
  const courseScopedEnrollments = useMemo(() => {
    if (selectedCourseId === 'all') return enrollments;
    return enrollments.filter(e => e.courseId === selectedCourseId);
  }, [enrollments, selectedCourseId]);

  // Aggregate student module feedback stored in enrollment.courseFeedback arrays
  const allCourseFeedback = useMemo(() => {
    const entries = courseScopedEnrollments.flatMap((rec) =>
      (rec.courseFeedback || []).map((fb) => ({
        ...fb,
        enrollmentId: rec.id,
        qualificationLevel: rec.qualificationLevel,
      }))
    );
    return entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [courseScopedEnrollments]);

  const filteredCourseFeedback = useMemo(() => {
    if (feedbackFocusFilter === 'All') return allCourseFeedback;
    return allCourseFeedback.filter((fb) => fb.focusArea === feedbackFocusFilter);
  }, [allCourseFeedback, feedbackFocusFilter]);

  const feedbackMetrics = useMemo(() => {
    if (allCourseFeedback.length === 0) {
      return { avgDifficulty: '0.0', avgClarity: '0.0', challengingCount: 0 };
    }
    const diffSum = allCourseFeedback.reduce((s, f) => s + (f.difficultyRating || 0), 0);
    const clarSum = allCourseFeedback.reduce((s, f) => s + (f.clarityRating || 0), 0);
    const challengingCount = allCourseFeedback.filter(
      (f) => f.difficultyRating >= 4 || f.clarityRating <= 2
    ).length;
    return {
      avgDifficulty: (diffSum / allCourseFeedback.length).toFixed(1),
      avgClarity: (clarSum / allCourseFeedback.length).toFixed(1),
      challengingCount,
    };
  }, [allCourseFeedback]);

  const gradingRecord = useMemo(
    () => (gradingRecordId ? enrollments.find(e => e.id === gradingRecordId) || null : null),
    [enrollments, gradingRecordId]
  );

  const activePeerReviewRecord = useMemo(
    () =>
      courseScopedEnrollments.find(e => e.id === selectedPeerReviewId) ||
      courseScopedEnrollments.find(e => e.assignmentStatus !== 'Not Submitted') ||
      courseScopedEnrollments[0] ||
      null,
    [courseScopedEnrollments, selectedPeerReviewId]
  );

  const userConstructivePeerReviewCount = useMemo(() => {
    const emailKey = user.email.trim().toLowerCase();
    const nameKey = user.name.trim().toLowerCase();
    let total = 0;
    enrollments.forEach((rec) => {
      (rec.peerReviews || []).forEach((rev) => {
        if (!(rev.critique || '').trim()) return;
        const emailMatch = emailKey && (rev.reviewerEmail || '').trim().toLowerCase() === emailKey;
        const nameMatch = nameKey && (rev.reviewerName || '').trim().toLowerCase() === nameKey;
        if (emailMatch || nameMatch) total += 1;
      });
    });
    return total;
  }, [enrollments, user.email, user.name]);

  // Further filter by search and assignment status
  const filteredEnrollments = useMemo(() => {
    return courseScopedEnrollments.filter(e => {
      if (statusFilter !== 'all' && e.assignmentStatus !== statusFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        return (
          e.studentName.toLowerCase().includes(q) ||
          e.studentEmail.toLowerCase().includes(q) ||
          e.courseTitle.toLowerCase().includes(q) ||
          e.assignmentTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [courseScopedEnrollments, statusFilter, studentSearch]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const total = courseScopedEnrollments.length;
    const tested = courseScopedEnrollments.filter(e => typeof e.testScore === 'number');
    const avgScore = tested.length > 0
      ? Math.round(tested.reduce((acc, e) => acc + (e.testScore || 0), 0) / tested.length)
      : 0;
    const passCount = tested.filter(e => (e.testScore || 0) >= 70).length;
    const passRate = tested.length > 0 ? Math.round((passCount / tested.length) * 100) : 0;
    const pendingGrading = courseScopedEnrollments.filter(e => e.assignmentStatus === 'Pending Grading').length;

    return { total, avgScore, passRate, pendingGrading };
  }, [courseScopedEnrollments]);

  // Score distribution histogram for Recharts
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '<60%', count: 0, color: '#ef4444' },
      { range: '60–69%', count: 0, color: '#f97316' },
      { range: '70–79%', count: 0, color: '#eab308' },
      { range: '80–89%', count: 0, color: '#3b82f6' },
      { range: '90–100%', count: 0, color: '#10b981' },
    ];
    courseScopedEnrollments.forEach(e => {
      if (typeof e.testScore !== 'number') return;
      if (e.testScore < 60) buckets[0].count += 1;
      else if (e.testScore < 70) buckets[1].count += 1;
      else if (e.testScore < 80) buckets[2].count += 1;
      else if (e.testScore < 90) buckets[3].count += 1;
      else buckets[4].count += 1;
    });
    return buckets;
  }, [courseScopedEnrollments]);

  // Active student for Subject Competency Radar comparison
  const activeRadarEnrollment = useMemo(() => {
    return (
      courseScopedEnrollments.find(e => e.id === selectedRadarEnrollmentId) ||
      courseScopedEnrollments[0] ||
      null
    );
  }, [courseScopedEnrollments, selectedRadarEnrollmentId]);

  // Compute student vs. course average across subject areas (Mathematics, Research, Writing, etc.)
  const radarComparisonData = useMemo(() => {
    if (!activeRadarEnrollment) return [];
    const peerGroup = enrollments.filter(e =>
      selectedCourseId === 'all' ? e.courseId === activeRadarEnrollment.courseId : e.courseId === selectedCourseId
    );
    const comparisonPeers = peerGroup.length > 0 ? peerGroup : courseScopedEnrollments;

    return SUBJECT_AREAS.map((subject, idx) => {
      const studentScore =
        activeRadarEnrollment.subjectScores?.[subject] ??
        Math.max(55, Math.min(100, (activeRadarEnrollment.testScore || 80) + ((idx % 2 === 0 ? 3 : -3))));

      const peerScores = comparisonPeers.map(peer =>
        peer.subjectScores?.[subject] ??
        Math.max(55, Math.min(100, (peer.testScore || 78) + ((idx % 2 === 0 ? 2 : -2))))
      );

      const courseAverage =
        peerScores.length > 0
          ? Math.round(peerScores.reduce((sum, val) => sum + val, 0) / peerScores.length)
          : 80;

      return {
        subject,
        studentScore,
        courseAverage,
        delta: studentScore - courseAverage,
      };
    });
  }, [activeRadarEnrollment, enrollments, selectedCourseId, courseScopedEnrollments]);

  // Per-course aggregate summary
  const perCourseStats = useMemo(() => {
    return studyGuides.map(guide => {
      const rows = enrollments.filter(e => e.courseId === guide.id);
      const tested = rows.filter(r => typeof r.testScore === 'number');
      const avgTest = tested.length > 0
        ? Math.round(tested.reduce((s, r) => s + (r.testScore || 0), 0) / tested.length)
        : 0;
      const passRate = tested.length > 0
        ? Math.round((tested.filter(r => (r.testScore || 0) >= 70).length / tested.length) * 100)
        : 0;
      const avgProgress = rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.progressPercent, 0) / rows.length)
        : 0;
      return {
        guide,
        enrolledCount: rows.length,
        avgTest,
        passRate,
        avgProgress,
        pendingCount: rows.filter(r => r.assignmentStatus === 'Pending Grading').length,
      };
    });
  }, [studyGuides, enrollments]);

  const handleOpenGrader = (rec: EnrolledStudentRecord, initialMode: 'grade' | 'peer_review' = 'grade') => {
    setGradingRecordId(rec.id);
    setModalMode(isInstructor ? initialMode : 'peer_review');
    setGradeScoreInput(rec.assignmentScore !== undefined ? String(rec.assignmentScore) : '90');
    setGradeFeedbackInput(rec.instructorFeedback || '');
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingRecord || !isInstructor) return;
    const parsedScore = Math.max(0, Math.min(100, parseInt(gradeScoreInput, 10) || 0));
    onGradeAssignment(gradingRecord.id, parsedScore, gradeFeedbackInput.trim());
    showPortalFeedback(`Graded ${gradingRecord.studentName}'s "${gradingRecord.assignmentTitle}" (${parsedScore}%) & dispatched student alert.`);
    setGradingRecordId(null);
  };

  const handleSubmitPeerReview = (e: React.FormEvent, targetRecord: EnrolledStudentRecord | null) => {
    e.preventDefault();
    if (!targetRecord || !peerCritique.trim()) return;
    if (!isInstructor && targetRecord.studentEmail.toLowerCase() === user.email.toLowerCase()) {
      return;
    }

    onAddPeerReview(targetRecord.id, {
      reviewerName: user.name,
      reviewerEmail: user.email,
      reviewerRole: userRole,
      rating: peerRating,
      strengths: peerStrengths.trim() || 'Clear structural logic and domain alignment.',
      improvements: peerImprovements.trim() || 'Continue expanding empirical edge-case coverage.',
      critique: peerCritique.trim(),
    });

    showPortalFeedback(
      `Published constructive peer critique for ${targetRecord.studentName}'s "${targetRecord.assignmentTitle}".`
    );
    setPeerStrengths('');
    setPeerImprovements('');
    setPeerCritique('');
    setPeerRating(5);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 sm:p-10 text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Institutional Access · Authentication Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight pt-1">
              Sign In to Access Faculty Portal & Peer Reviews
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
              Sign in as an Instructor for full roster analytics, grading, and syllabus publishing, or sign in as a Student to provide constructive peer critiques on fellow learners&apos; assignment submissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSyllabusCourse || !newChapterTitle.trim() || !newChapterContent.trim()) return;

    const updatedGuide: StudyGuide = {
      ...activeSyllabusCourse,
      chapters: [
        ...activeSyllabusCourse.chapters,
        {
          title: newChapterTitle.trim(),
          content: newChapterContent.trim(),
        },
      ],
    };

    onUpdateStudyGuide(updatedGuide);
    onNewChapterAdded(activeSyllabusCourse.id, activeSyllabusCourse.title, newChapterTitle.trim());
    showPortalFeedback(`Added chapter "${newChapterTitle.trim()}" to ${activeSyllabusCourse.title} & notified enrolled students.`);
    setNewChapterTitle('');
    setNewChapterContent('');
  };

  const handleSaveAbstract = () => {
    if (!activeSyllabusCourse || editingAbstract === null) return;
    const updatedGuide: StudyGuide = {
      ...activeSyllabusCourse,
      abstract: editingAbstract.trim() || activeSyllabusCourse.abstract,
    };
    onUpdateStudyGuide(updatedGuide);
    setEditingAbstract(null);
    showPortalFeedback(`Updated syllabus overview for ${activeSyllabusCourse.title}.`);
  };

  const handleSaveEditedChapter = (idx: number) => {
    if (!activeSyllabusCourse) return;
    const updatedChapters = activeSyllabusCourse.chapters.map((ch, i) =>
      i === idx
        ? {
            title: editingChapterTitle.trim() || ch.title,
            content: editingChapterContent.trim() || ch.content,
          }
        : ch
    );
    onUpdateStudyGuide({
      ...activeSyllabusCourse,
      chapters: updatedChapters,
    });
    setEditingChapterIdx(null);
    showPortalFeedback(`Saved edits to Chapter ${idx + 1} in ${activeSyllabusCourse.title}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-900 dark:text-stone-100">
      
      {/* Header Banner */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>
              {isInstructor
                ? 'Tsoaela Training Ground · Instructor Command Center'
                : 'Tsoaela Training Ground · Student Peer Review Workspace'}
            </span>
            <span className="text-stone-400" aria-hidden="true">·</span>
            <span className={isInstructor ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
              {isInstructor ? 'Instructor Verified' : `Role: ${userRole}`}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isInstructor ? 'Faculty Portal' : 'Faculty Portal & Peer Review Studio'}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            {isInstructor
              ? `Manage enrolled cohorts, grade submitted coursework, facilitate peer reviews, inspect aggregate test performance, and publish syllabus chapters for ${user.name}.`
              : `Review fellow students' assignment submissions and submit constructive peer critiques stored directly in enrollment records. Switch to an Instructor role for official grading and syllabus controls.`}
          </p>
        </div>

        {/* Course Scope Dropdown & Certificate Preview */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {courseScopedEnrollments[0] && (
            <button
              type="button"
              onClick={() => {
                const topCompleted =
                  courseScopedEnrollments.find(
                    (e) =>
                      e.studentEmail.toLowerCase() === user.email.toLowerCase() &&
                      e.progressPercent >= 100
                  ) ||
                  courseScopedEnrollments.find((e) => e.progressPercent >= 100) ||
                  courseScopedEnrollments.find(
                    (e) => e.studentEmail.toLowerCase() === user.email.toLowerCase()
                  ) ||
                  courseScopedEnrollments[0];
                setCertificatePreviewTarget({ record: topCompleted });
              }}
              className="px-3.5 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Certificate Preview</span>
            </button>
          )}
          {!isInstructor && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Switch to Instructor Role</span>
            </button>
          )}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Course Filter Scope
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[240px] px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Taught Courses ({studyGuides.length})</option>
              {studyGuides.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instructor RBAC Notice for Non-Instructors */}
      {!isInstructor && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                Student Peer Review Access Active
              </span>
              <span className="text-stone-600 dark:text-stone-300">
                You can inspect submissions and contribute constructive peer critiques below. Official grading, aggregate test analytics, and syllabus publishing remain restricted to verified Instructors.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {portalFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{portalFeedback}</span>
          </span>
          <button type="button" onClick={() => setPortalFeedback(null)} className="text-emerald-600 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Row (Instructor Command Center) */}
      {isInstructor && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-medium">Enrolled Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {kpis.total}
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">Active cohort registrations</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-medium">Aggregate Test Avg</span>
              <BarChart2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {kpis.avgScore}%
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">Across completed assessments</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-medium">Cohort Pass Rate</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {kpis.passRate}%
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">Threshold: ≥70% required</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-medium">Pending Grading</span>
              <FileEdit className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {kpis.pendingGrading}
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">Submissions awaiting review</span>
          </div>
        </div>
      )}

      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubView('enrollment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubView === 'enrollment' || !isInstructor
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isInstructor ? 'Assignment Grading & Peer Review' : 'Assignment Submissions & Peer Review'}</span>
        </button>

        {isInstructor && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubView('results')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'results'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Aggregate Test Results & Radar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('feedback')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'feedback'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Module Feedback ({allCourseFeedback.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('syllabus')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubView === 'syllabus'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Syllabus & Chapter Manager</span>
            </button>
          </>
        )}
      </div>

      {/* Sub-view 1: Student Enrollment, Assignment Grading & Peer Review */}
      {(activeSubView === 'enrollment' || !isInstructor) && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'Pending Grading', 'Graded', 'Not Submitted'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {status === 'all' ? 'All Students' : status}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student name, email, or assignment..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Course & Qualification</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold">Test Score</th>
                    <th className="pb-3 font-semibold">Assignment & Peer Reviews</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500 dark:text-stone-400">
                        No enrolled students match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map(rec => {
                      const peerCount = rec.peerReviews?.length || 0;
                      const isSelf = rec.studentEmail.toLowerCase() === user.email.toLowerCase();
                      const isSelectedForInlineReview = activePeerReviewRecord?.id === rec.id;

                      return (
                        <tr
                          key={rec.id}
                          className={`transition-colors ${
                            isSelectedForInlineReview
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                              : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/40'
                          }`}
                        >
                          <td className="py-4 pr-4">
                            <div className="font-bold text-stone-900 dark:text-stone-100">
                              {rec.studentName}
                              {isSelf && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold"> · You</span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">{rec.studentEmail}</div>
                            <div className="text-[10px] text-stone-400 mt-0.5">Enrolled {rec.enrolledDate}</div>
                          </td>

                          <td className="py-4 pr-4 max-w-[260px]">
                            <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">{rec.courseTitle}</div>
                            <div className="text-[11px] text-stone-500 truncate">{rec.facultyName}</div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">{rec.qualificationLevel}</div>
                          </td>

                          <td className="py-4 pr-4 min-w-[120px]">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-mono tabular-nums font-bold">{rec.progressPercent}%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${rec.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${rec.progressPercent}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-4 pr-4 font-mono tabular-nums font-bold">
                            {rec.testScore !== undefined ? (
                              <span className={rec.testScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {rec.testScore}%
                              </span>
                            ) : (
                              <span className="text-stone-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <div className="font-medium text-stone-800 dark:text-stone-200">{rec.assignmentTitle}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                              <span className={`font-semibold ${
                                rec.assignmentStatus === 'Graded'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : rec.assignmentStatus === 'Pending Grading'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-stone-500'
                              }`}>
                                {rec.assignmentStatus}
                                {rec.assignmentScore !== undefined ? ` · ${rec.assignmentScore}%` : ''}
                              </span>
                              <span className="text-stone-300 dark:text-stone-700" aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                                {peerCount} {peerCount === 1 ? 'Peer Review' : 'Peer Reviews'}
                              </span>
                              {(rec.courseFeedback?.length || 0) > 0 && (
                                <>
                                  <span className="text-stone-300 dark:text-stone-700" aria-hidden="true">·</span>
                                  <button
                                    type="button"
                                    onClick={() => isInstructor && setActiveSubView('feedback')}
                                    className="font-mono tabular-nums font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                                  >
                                    {rec.courseFeedback!.length} Module {rec.courseFeedback!.length === 1 ? 'Note' : 'Notes'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {isInstructor && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRadarEnrollmentId(rec.id);
                                    setActiveSubView('results');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
                                  title="Inspect student subject performance radar"
                                >
                                  Radar
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setCertificatePreviewTarget({ record: rec })}
                                className="px-3 py-1.5 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                                title="Open branded Certificate Preview modal"
                              >
                                <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                                <span>Certificate Preview</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPeerReviewId(rec.id);
                                  handleOpenGrader(rec, 'peer_review');
                                }}
                                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                title="View and submit peer review critiques"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Peer Review ({peerCount})</span>
                              </button>

                              {isInstructor && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGrader(rec, 'grade')}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  {rec.assignmentStatus === 'Graded' ? 'Update Grade' : 'Grade & Notify'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inline Peer Review Feedback Module Panel */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span>Peer Review Feedback Module</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Constructive peer-to-peer assignment critiques stored directly within each student&apos;s Enrollment record
                  <span aria-hidden="true"> · </span>
                  <span className={`font-mono font-semibold tabular-nums ${
                    userConstructivePeerReviewCount > 10
                      ? 'text-[#65a30d] dark:text-[#a3e635]'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    Community Mentor: {userConstructivePeerReviewCount}/11 reviews (&gt;10 to unlock badge)
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  Target Submission:
                </label>
                <select
                  value={activePeerReviewRecord?.id || ''}
                  onChange={(e) => setSelectedPeerReviewId(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[260px] px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-indigo-500"
                >
                  {courseScopedEnrollments.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.studentName} · {rec.assignmentTitle.slice(0, 30)} ({rec.peerReviews?.length || 0} reviews)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activePeerReviewRecord ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Existing Peer Reviews Feed */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="pb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {activePeerReviewRecord.assignmentTitle}
                      </span>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        Author: {activePeerReviewRecord.studentName}
                        <span aria-hidden="true"> · </span>
                        {activePeerReviewRecord.courseTitle}
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">
                          {activePeerReviewRecord.peerReviews?.length || 0} recorded critiques
                        </span>
                      </div>
                    </div>
                  </div>

                  {!activePeerReviewRecord.peerReviews || activePeerReviewRecord.peerReviews.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 text-center text-xs text-stone-500 dark:text-stone-400">
                      No peer reviews recorded for this submission yet. Submit a constructive critique using the review panel.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePeerReviewRecord.peerReviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                {review.reviewerName}
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                {review.reviewerRole || 'student'} · {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{review.rating}/5</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                            {review.critique}
                          </p>

                          {(review.strengths || review.improvements) && (
                            <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                              {review.strengths && (
                                <div>
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                                    Strengths
                                  </span>
                                  <span className="text-stone-600 dark:text-stone-400">{review.strengths}</span>
                                </div>
                              )}
                              {review.improvements && (
                                <div>
                                  <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                                    Suggested Improvements
                                  </span>
                                  <span className="text-stone-600 dark:text-stone-400">{review.improvements}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Constructive Peer Critique Composer */}
                <div className="lg:col-span-2">
                  {!isInstructor &&
                  activePeerReviewRecord.studentEmail.toLowerCase() === user.email.toLowerCase() ? (
                    <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 space-y-2 text-xs">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-indigo-500" />
                        <span>Your Submission</span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        You are viewing your own assignment submission. Select another student&apos;s submission in the table or dropdown above to provide constructive peer feedback.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => handleSubmitPeerReview(e, activePeerReviewRecord)}
                      className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 space-y-3 text-xs"
                    >
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        Write Constructive Peer Critique
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Rubric Rating (1–5)
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setPeerRating(starVal)}
                              className={`px-2.5 py-1.5 rounded-lg border font-mono tabular-nums font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                                peerRating === starVal
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${peerRating === starVal ? 'fill-white' : ''}`} />
                              <span>{starVal}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Key Strengths
                        </label>
                        <input
                          type="text"
                          value={peerStrengths}
                          onChange={(e) => setPeerStrengths(e.target.value)}
                          placeholder="What methodology or proof step worked best?"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Actionable Improvements
                        </label>
                        <input
                          type="text"
                          value={peerImprovements}
                          onChange={(e) => setPeerImprovements(e.target.value)}
                          placeholder="Where can edge cases, clarity, or rigor improve?"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Constructive Critique *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={peerCritique}
                          onChange={(e) => setPeerCritique(e.target.value)}
                          placeholder={`Provide peer review feedback for ${activePeerReviewRecord.studentName}...`}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs resize-none focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!peerCritique.trim()}
                        className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Peer Critique</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-4 text-center">
                No assignment submissions match your current course filter.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sub-view 2: Aggregate Test Results & Student Subject Radar */}
      {isInstructor && activeSubView === 'results' && (
        <div className="space-y-6">
          {/* Student Subject Competency Radar Comparison */}
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <RadarIcon className="w-4 h-4 text-indigo-500" />
                  <span>Student Subject Performance vs. Course Average</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Multi-axis competency comparison across Mathematics, Research, Writing, Systems Design, and Critical Analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  Compare Student:
                </label>
                <select
                  value={activeRadarEnrollment?.id || ''}
                  onChange={(e) => setSelectedRadarEnrollmentId(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[230px] px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:border-indigo-500"
                >
                  {courseScopedEnrollments.map(rec => (
                    <option key={rec.id} value={rec.id}>
                      {rec.studentName} · {rec.courseTitle.slice(0, 28)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeRadarEnrollment && radarComparisonData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                <div className="lg:col-span-3 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarComparisonData}>
                      <PolarGrid stroke="#78716c35" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#a8a29e', fontSize: 10 }}
                      />
                      <Radar
                        name={activeRadarEnrollment.studentName}
                        dataKey="studentScore"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="#6366f1"
                        fillOpacity={0.32}
                      />
                      <Radar
                        name="Course Average"
                        dataKey="courseAverage"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="#10b981"
                        fillOpacity={0.14}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1c1917',
                          borderColor: '#292524',
                          borderRadius: '0.75rem',
                          color: '#fafaf9',
                          fontSize: '12px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Subject-by-Subject Variance Table */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{activeRadarEnrollment.studentName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{activeRadarEnrollment.courseTitle}</span>
                  </div>

                  <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-950 text-[10px] font-mono uppercase text-stone-500 border-b border-stone-200 dark:border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3">Subject Area</th>
                          <th className="py-2.5 px-3 text-right">Student</th>
                          <th className="py-2.5 px-3 text-right">Cohort Avg</th>
                          <th className="py-2.5 px-3 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {radarComparisonData.map(row => (
                          <tr key={row.subject}>
                            <td className="py-2.5 px-3 font-medium text-stone-800 dark:text-stone-200">
                              {row.subject}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                              {row.studentScore}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-stone-600 dark:text-stone-400">
                              {row.courseAverage}%
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                              row.delta >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {row.delta >= 0 ? `+${row.delta}%` : `${row.delta}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-6 text-center">
                No enrolled student records match this course scope yet.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Histogram */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  <span>Aggregate Test Score Distribution</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Student count across assessment percentage bands ({selectedCourseId === 'all' ? 'All Courses' : 'Selected Course'})
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        borderColor: '#292524',
                        borderRadius: '0.75rem',
                        color: '#fafaf9',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} barSize={38}>
                      {scoreDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-Course Aggregate Summary Table */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Course-by-Course Aggregate Metrics</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Enrollment volume, chapter completion, average test score, and pass rate
                </p>
              </div>

              <div className="space-y-3">
                {perCourseStats.map(({ guide, enrolledCount, avgTest, passRate, avgProgress, pendingCount }) => (
                  <div
                    key={guide.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{guide.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCertificatePreviewTarget({ guide })}
                          className="px-2 py-0.5 rounded bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#a3e635]" />
                          <span>Certificate Preview</span>
                        </button>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {enrolledCount} Enrolled
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-400 block">Avg Test</span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{avgTest}%</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Pass Rate</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{passRate}%</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Avg Progress</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{avgProgress}%</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">To Grade</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 2.5: Student Module Feedback Review */}
      {isInstructor && activeSubView === 'feedback' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Enrollment courseFeedback Queue</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Student Module Difficulty &amp; Clarity Feedback
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Review specific comments left by students inside enrollment records to calibrate module difficulty, worked examples, and pacing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Difficulty', 'Clarity', 'Both'] as const).map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setFeedbackFocusFilter(focus)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      feedbackFocusFilter === focus
                        ? 'bg-purple-700 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Average Reported Difficulty
                </span>
                <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {feedbackMetrics.avgDifficulty} / 5
                </span>
              </div>
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Average Clarity Score
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {feedbackMetrics.avgClarity} / 5
                </span>
              </div>
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
                <span className="text-stone-500 dark:text-stone-400 block">
                  Flagged High-Friction Modules
                </span>
                <span className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {feedbackMetrics.challengingCount}
                </span>
              </div>
            </div>

            {/* Feedback Cards */}
            {filteredCourseFeedback.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                No student module feedback entries match the current course or dimension filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourseFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {fb.studentName}
                          </span>
                          <span className="text-[11px] font-mono text-stone-500">
                            {fb.studentEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold uppercase">
                            {fb.focusArea}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {fb.courseTitle}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span>Module: {fb.moduleTitle}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold inline-flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          Difficulty {fb.difficultyRating}/5
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Clarity {fb.clarityRating}/5
                        </span>
                        <span className="text-stone-400">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200/70 dark:border-stone-800">
                      {fb.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-view 3: Syllabus & Chapter Manager */}
      {isInstructor && activeSubView === 'syllabus' && activeSyllabusCourse && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course List & Existing Chapters */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-sm font-bold">Manage Course Syllabus & Chapters</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Edit existing syllabus overview or revise chapter modules
                </p>
              </div>
              <select
                value={activeSyllabusCourse.id}
                onChange={(e) => {
                  setSyllabusCourseId(e.target.value);
                  setEditingAbstract(null);
                  setEditingChapterIdx(null);
                }}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-semibold max-w-xs"
              >
                {studyGuides.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            {/* Abstract Editor */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Course Abstract</span>
                {editingAbstract === null ? (
                  <button
                    type="button"
                    onClick={() => setEditingAbstract(activeSyllabusCourse.abstract)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <FileEdit className="w-3 h-3" /> Edit Abstract
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAbstract(null)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAbstract}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                )}
              </div>
              {editingAbstract !== null ? (
                <textarea
                  rows={3}
                  value={editingAbstract}
                  onChange={(e) => setEditingAbstract(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                />
              ) : (
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeSyllabusCourse.abstract}
                </p>
              )}
            </div>

            {/* Chapters List */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Published Syllabus Chapters ({activeSyllabusCourse.chapters.length})
              </span>
              {activeSyllabusCourse.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-2"
                >
                  {editingChapterIdx === idx ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingChapterTitle}
                        onChange={(e) => setEditingChapterTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                      />
                      <textarea
                        rows={3}
                        value={editingChapterContent}
                        onChange={(e) => setEditingChapterContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingChapterIdx(null)}
                          className="px-3 py-1 text-xs text-stone-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedChapter(idx)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save Chapter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{ch.title}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingChapterIdx(idx);
                            setEditingChapterTitle(ch.title);
                            setEditingChapterContent(ch.content);
                          }}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{ch.content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publish New Chapter Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Plus className="w-4 h-4" />
              <span>Publish New Chapter</span>
            </div>
            <h3 className="text-base font-bold">Add Chapter to {activeSyllabusCourse.title}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Publishing a new chapter immediately updates the student curriculum and triggers an automated notification to registered learners.
            </p>

            <form onSubmit={handleAddChapter} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder={`e.g. 0${activeSyllabusCourse.chapters.length + 1}. Advanced Case Analysis`}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Chapter Lecture Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={newChapterContent}
                  onChange={(e) => setNewChapterContent(e.target.value)}
                  placeholder="Write core lecture frameworks, invariants, and seminar drills..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Add Chapter & Notify Students</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Grading & Peer Review Modal */}
      {gradingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Assignment Assessment & Peer Feedback
                </span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {gradingRecord.studentName} · {gradingRecord.assignmentTitle}
                </h3>
              </div>
              <button type="button" onClick={() => setGradingRecordId(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInstructor && (
              <div className="px-5 pt-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2 bg-white dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => setModalMode('grade')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    modalMode === 'grade'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Instructor Grading
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('peer_review')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    modalMode === 'peer_review'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Peer Review ({gradingRecord.peerReviews?.length || 0})
                </button>
              </div>
            )}

            {isInstructor && modalMode === 'grade' ? (
              <form onSubmit={handleSubmitGrade} className="p-5 space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <div className="font-bold text-stone-800 dark:text-stone-200">{gradingRecord.assignmentTitle}</div>
                  <div className="text-stone-500 mt-0.5">{gradingRecord.courseTitle}</div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Score (0–100%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gradeScoreInput}
                    onChange={(e) => setGradeScoreInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 font-mono tabular-nums font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Instructor Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={gradeFeedbackInput}
                    onChange={(e) => setGradeFeedbackInput(e.target.value)}
                    placeholder="Provide analytical commentary on thesis clarity and methodology..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGradingRecordId(null)}
                    className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-semibold text-stone-600 dark:text-stone-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save Grade & Alert Student</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-stone-800 dark:text-stone-200">{gradingRecord.assignmentTitle}</div>
                    <div className="text-stone-500 mt-0.5">{gradingRecord.courseTitle}</div>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-stone-600 dark:text-stone-400 shrink-0">
                    {gradingRecord.peerReviews?.length || 0} Reviews
                  </span>
                </div>

                {/* Existing Peer Critiques List */}
                <div className="space-y-2.5">
                  {(!gradingRecord.peerReviews || gradingRecord.peerReviews.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-stone-500">
                      No peer reviews submitted yet for this assignment.
                    </div>
                  ) : (
                    gradingRecord.peerReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {review.reviewerName}
                            <span className="text-stone-500 font-normal"> · {new Date(review.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{review.critique}</p>
                        {(review.strengths || review.improvements) && (
                          <div className="pt-1.5 text-[11px] text-stone-500 dark:text-stone-400 space-y-0.5">
                            {review.strengths && <div><strong className="text-emerald-700 dark:text-emerald-400">Strengths:</strong> {review.strengths}</div>}
                            {review.improvements && <div><strong className="text-amber-700 dark:text-amber-400">Improvements:</strong> {review.improvements}</div>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Peer Critique Form inside Modal */}
                {!isInstructor && gradingRecord.studentEmail.toLowerCase() === user.email.toLowerCase() ? (
                  <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs">
                    You cannot critique your own submission. Select a peer&apos;s submission to submit feedback.
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSubmitPeerReview(e, gradingRecord)} className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="font-bold text-stone-900 dark:text-stone-100">Add Constructive Peer Critique</div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setPeerRating(starVal)}
                          className={`px-2.5 py-1 rounded-lg border font-mono tabular-nums font-bold text-xs flex items-center gap-1 cursor-pointer ${
                            peerRating === starVal
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${peerRating === starVal ? 'fill-white' : ''}`} />
                          <span>{starVal}</span>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={peerStrengths}
                        onChange={(e) => setPeerStrengths(e.target.value)}
                        placeholder="Key strengths..."
                        className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs"
                      />
                      <input
                        type="text"
                        value={peerImprovements}
                        onChange={(e) => setPeerImprovements(e.target.value)}
                        placeholder="Suggested improvements..."
                        className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs"
                      />
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={peerCritique}
                      onChange={(e) => setPeerCritique(e.target.value)}
                      placeholder="Write constructive feedback on structure, derivations, and empirical support..."
                      className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setGradingRecordId(null)}
                        className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-semibold text-stone-600 dark:text-stone-300 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={!peerCritique.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Peer Review</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Resolution Branded Certificate Preview Modal */}
      {(() => {
        if (!certificatePreviewTarget) return null;
        const rec = certificatePreviewTarget.record;
        const matchedGuide =
          certificatePreviewTarget.guide ||
          (rec ? studyGuides.find((g) => g.id === rec.courseId) : undefined);

        const cert = matchedGuide
          ? getCertificateForStudyGuide(matchedGuide)
          : rec
          ? resolveCertificateByCategory({
              id: rec.courseId,
              title: rec.courseTitle,
              category: rec.facultyName,
            })
          : null;

        if (!cert) return null;

        const courseTitle = rec?.courseTitle || matchedGuide?.title || 'Platform Course';
        const recipientName = rec?.studentName || user.name || 'Academic Scholar';
        const progressPercent = rec?.progressPercent ?? 100;
        const quizScore = rec?.testScore;
        const isEarned = Boolean(
          progressPercent >= 100 || (quizScore !== undefined && quizScore >= 70)
        );
        const serialNumber = formatCertificateSerial(
          cert.credentialCodePrefix,
          rec?.courseId || matchedGuide?.id || '001',
          rec?.id || user.id
        );

        return (
          <CourseCertificateModal
            isOpen={Boolean(certificatePreviewTarget)}
            onClose={() => setCertificatePreviewTarget(null)}
            certificate={cert}
            courseTitle={courseTitle}
            recipientName={recipientName}
            serialNumber={serialNumber}
            issueDate={new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            progressPercent={progressPercent}
            quizScore={quizScore}
            isEarned={isEarned}
          />
        );
      })()}
    </div>
  );
};
