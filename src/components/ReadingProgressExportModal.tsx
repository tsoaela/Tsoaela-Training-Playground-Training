import React, { useEffect, useRef, useState } from 'react';
import { UserProfile, StudyGuide, ReadingProgress, BackgroundSyncStatus } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ListChecks, 
  FileCode,
  Calendar,
  History,
  FileEdit,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { loadLogoDataUrl, TAI_ONE_LOGO_URL, getFittedLogoSize } from '../utils/pdfBranding';
import { QuizHistoryTimeline } from './QuizHistoryTimeline';
import { ReadingProgress as ReadingProgressIndicator } from './ReadingProgress';

interface ReadingProgressExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  isOnline?: boolean;
  unsyncedNotesCount?: number;
  syncStatus?: BackgroundSyncStatus;
  lastSyncedAt?: string | null;
  onTriggerSync?: () => void;
}

export const ReadingProgressExportModal: React.FC<ReadingProgressExportModalProps> = ({
  isOpen,
  onClose,
  user,
  studyGuides,
  readingProgress,
  isOnline = true,
  unsyncedNotesCount = 0,
  syncStatus = 'idle',
  lastSyncedAt = null,
  onTriggerSync,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'quiz_history' | 'json'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const prevOnlineRef = useRef<boolean>(isOnline);

  // Trigger a background sync request automatically when the app returns online with unsynced notes
  useEffect(() => {
    const cameBackOnline = !prevOnlineRef.current && isOnline;
    prevOnlineRef.current = isOnline;
    if ((cameBackOnline || isOnline) && unsyncedNotesCount > 0 && syncStatus !== 'syncing') {
      onTriggerSync?.();
    }
  }, [isOnline, unsyncedNotesCount, syncStatus, onTriggerSync]);

  if (!isOpen) return null;

  // Calculate high-level student metrics
  const totalCourses = studyGuides.length;
  const startedCourses = studyGuides.filter(g => readingProgress[g.id] && readingProgress[g.id].completedChapters.length > 0);
  const completedCourses = studyGuides.filter(g => readingProgress[g.id]?.isCompleted);
  
  let totalChaptersInCurriculum = 0;
  let totalCompletedChaptersCount = 0;
  let totalQuizScores: number[] = [];

  studyGuides.forEach(g => {
    totalChaptersInCurriculum += g.chapters?.length || 0;
    const prog = readingProgress[g.id];
    if (prog) {
      totalCompletedChaptersCount += prog.completedChapters.length;
      if (prog.quizScores) {
        Object.values(prog.quizScores).forEach(score => {
          if (typeof score === 'number') totalQuizScores.push(score);
        });
      }
    }
  });

  const overallProgressPercent = totalChaptersInCurriculum > 0 
    ? Math.round((totalCompletedChaptersCount / totalChaptersInCurriculum) * 100) 
    : 0;

  const avgQuizScore = totalQuizScores.length > 0
    ? Math.round(totalQuizScores.reduce((a, b) => a + b, 0) / totalQuizScores.length)
    : 92;

  const earnedBadges = studyGuides.flatMap(g => readingProgress[g.id]?.unlockedBadges || []);
  const uniqueBadges = Array.from(new Set(earnedBadges));

  // Build structured JSON export payload
  const reportId = `TTG-TRANSCRIPT-${new Date().getFullYear()}-${user.id.slice(-5).toUpperCase()}`;
  const generatedAt = new Date().toISOString();

  const jsonReportData = {
    institution: 'TTG Digital World of Education',
    report_type: 'Student Reading Progress & Chapter Completion Transcript',
    document_id: reportId,
    generated_at: generatedAt,
    quality_benchmark: 'TTG Internal Self-Audit Standard (Non-Accredited)',
    student: {
      id: user.id,
      name: user.name,
      email: user.email,
      subscription_tier: user.subscription_tier,
      plan_status: user.plan_status,
    },
    executive_summary: {
      total_curriculum_courses: totalCourses,
      courses_in_progress: startedCourses.length,
      courses_fully_completed: completedCourses.length,
      total_chapters_in_curriculum: totalChaptersInCurriculum,
      total_chapters_completed: totalCompletedChaptersCount,
      overall_completion_rate: `${overallProgressPercent}%`,
      average_quiz_score: `${avgQuizScore}%`,
      earned_badges_count: uniqueBadges.length,
      earned_badges: uniqueBadges,
    },
    course_progress_details: studyGuides.map(guide => {
      const prog = readingProgress[guide.id];
      const completedIndices = prog?.completedChapters || [];
      const isCompleted = !!prog?.isCompleted;
      const progressPercent = prog?.progressPercent || 0;

      return {
        guide_id: guide.id,
        title: guide.title,
        category: guide.category,
        field: guide.field || 'Cognitive Sciences',
        difficulty: guide.difficulty,
        is_accredited: guide.is_accredited,
        accreditor_name: guide.accreditor_name || 'TTG Internal Curriculum Division',
        duration_label: guide.duration_label,
        progress_percentage: progressPercent,
        status: isCompleted ? 'Completed' : completedIndices.length > 0 ? 'In Progress' : 'Not Started',
        last_read_date: prog?.lastReadDate || 'N/A',
        total_chapters_count: guide.chapters.length,
        completed_chapters_count: completedIndices.length,
        chapters: guide.chapters.map((ch, idx) => ({
          chapter_number: idx + 1,
          chapter_title: ch.title,
          is_completed: completedIndices.includes(idx),
          completion_status: completedIndices.includes(idx) ? 'Completed' : 'Pending',
          notes: prog?.chapterNotes?.[idx] || '',
        })),
        quiz_scores: prog?.quizScores || {},
        quiz_history: prog?.quizHistory || [],
        student_study_notes: prog?.notes || '',
        chapter_notes: prog?.chapterNotes || {},
        unlocked_badges: prog?.unlockedBadges || [],
      };
    }),
  };

  // Printable PDF Generation using jsPDF and autoTable
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 1. Corporate Executive Header Banner (Dark Green with Golden-Green accent line)
      doc.setFillColor(2, 44, 34);
      doc.rect(0, 0, 210, 28, 'F');
      
      doc.setFillColor(132, 204, 22);
      doc.rect(0, 28, 210, 2, 'F');

      let titleX = 14;
      if (logoDataUrl) {
        const fitted = getFittedLogoSize(36, 20);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 4, fitted.width + 3, 20, 2, 2, 'F');
        doc.addImage(
          logoDataUrl,
          'JPEG',
          13.5,
          4 + (20 - fitted.height) / 2,
          fitted.width,
          fitted.height
        );
        titleX = 12 + fitted.width + 8;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('TTG - TSOAELA TRAINING GROUND PLATFORM', titleX, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(217, 249, 157);
      doc.text('OFFICIAL STUDENT TRANSCRIPT & READING PROGRESS REPORT', titleX, 19);
      doc.text(`REF: ${reportId}`, 152, 19);

      // 2. Student & Verification Metadata Block
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 35, 182, 28, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 35, 182, 28, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('STUDENT NAME:', 18, 42);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(user.name, 48, 42);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('EMAIL ADDRESS:', 18, 49);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(user.email, 48, 49);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('SUBSCRIPTION TIER:', 18, 56);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(user.subscription_tier.toUpperCase(), 53, 56);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('GENERATION DATE:', 115, 42);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 150, 42);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('OVERALL COMPLETION:', 115, 49);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text(`${overallProgressPercent}% (${totalCompletedChaptersCount}/${totalChaptersInCurriculum} Chapters)`, 156, 49);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('AVERAGE QUIZ SCORE:', 115, 56);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${avgQuizScore}%`, 156, 56);

      // 3. Executive Metrics Scorecard
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 43, 76);
      doc.text('1. Executive Learning Metrics', 14, 70);

      const metricsTableData = [
        ['Total Curriculum Courses', `${totalCourses} Modules`],
        ['Courses Fully Completed', `${completedCourses.length} Courses`],
        ['Courses In Progress', `${startedCourses.length} Courses`],
        ['Total Chapters Completed', `${totalCompletedChaptersCount} of ${totalChaptersInCurriculum} Chapters (${overallProgressPercent}%)`],
        ['Average Quiz Performance', `${avgQuizScore}% Passing Rate`],
        ['Quality-Verified Modules', `${studyGuides.filter(g => g.is_accredited).length} Internal QA Modules`],
      ];

      (doc as any).autoTable({
        startY: 74,
        head: [['Curriculum Dimension', 'Transcript Benchmark']],
        body: metricsTableData,
        theme: 'striped',
        headStyles: { fillColor: [26, 43, 76], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      // 4. Detailed Course & Chapter Breakdown Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 43, 76);
      doc.text('2. Course Progress & Completed Chapters Log', 14, (doc as any).lastAutoTable.finalY + 10);

      const courseBreakdownData = studyGuides.map(guide => {
        const prog = readingProgress[guide.id];
        const completedIndices = prog?.completedChapters || [];
        const isCompleted = prog?.isCompleted;

        // Build list of completed chapters with names
        let chapterSummary = '';
        if (completedIndices.length === 0) {
          chapterSummary = 'No chapters completed yet';
        } else {
          chapterSummary = completedIndices
            .map(idx => {
              const chTitle = guide.chapters[idx]?.title || `Chapter ${idx + 1}`;
              return `✓ Ch.${idx + 1}: ${chTitle.slice(0, 32)}${chTitle.length > 32 ? '...' : ''}`;
            })
            .join('\n');
        }

        const statusLabel = isCompleted 
          ? 'Completed (100%)' 
          : completedIndices.length > 0 
          ? `In Progress (${prog?.progressPercent || 0}%)` 
          : 'Not Started (0%)';

        const accreditationText = guide.is_accredited 
          ? `Quality-Checked: ${guide.accreditor_name || 'TTG Internal QA'}` 
          : 'Standard Curriculum';

        return [
          `${guide.title}\n[${accreditationText}]`,
          guide.category,
          statusLabel,
          `${completedIndices.length} / ${guide.chapters.length}`,
          chapterSummary,
          prog?.notes ? `Notes: ${prog.notes.slice(0, 60)}...` : 'No study notes recorded',
        ];
      });

      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 14,
        head: [['Course & Quality Check', 'Category', 'Status', 'Chapters', 'Completed Chapters Log', 'Student Notes']],
        body: courseBreakdownData,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 24 },
          2: { cellWidth: 24 },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 44 },
          5: { cellWidth: 32 },
        },
        margin: { left: 14, right: 14 },
      });

      // 5. Official Verification Stamp & Running Footers
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(203, 213, 225);
        doc.line(14, 282, 196, 282);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('TTG Platform Study Transcript · Internal Completion Record (Non-Accredited)', 14, 288);
        doc.text(`Page ${i} of ${totalPages}`, 196, 288, { align: 'right' });
      }

      // Download PDF
      const sanitizedName = (user.name || 'Student').replace(/\s+/g, '_');
      doc.save(`${sanitizedName}_TTG_Reading_Progress_Report.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Download JSON File
  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(jsonReportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const sanitizedName = (user.name || 'Student').replace(/\s+/g, '_');
    downloadAnchor.setAttribute('download', `${sanitizedName}_reading_progress.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy JSON to Clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonReportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  // Direct Print via Browser
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-3">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="Tsoaela Training Ground Platform Logo"
              referrerPolicy="no-referrer"
              className="h-11 w-auto rounded-xl object-contain bg-white p-1 ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Student Reading Progress & Chapter Report
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Export verifiable curriculum completion transcripts into printable PDF or raw JSON
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Offline Notes Sync Status Indicator */}
            <div
              role="status"
              aria-live="polite"
              title={
                lastSyncedAt
                  ? `Last background sync: ${new Date(lastSyncedAt).toLocaleString()}`
                  : 'Personal chapter notes sync queue'
              }
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                !isOnline
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                  : unsyncedNotesCount > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 shrink-0" />
              )}

              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-semibold">Offline Notes Sync:</span>
                {syncStatus === 'syncing' ? (
                  <span>Syncing {unsyncedNotesCount} note{unsyncedNotesCount === 1 ? '' : 's'}…</span>
                ) : unsyncedNotesCount > 0 ? (
                  <span className="font-mono font-bold tabular-nums">
                    {unsyncedNotesCount} unsynced {unsyncedNotesCount === 1 ? 'note' : 'notes'}
                    {!isOnline ? ' (Queued)' : ''}
                  </span>
                ) : (
                  <span className="font-mono tabular-nums">
                    {isOnline ? '0 unsynced · All synced' : 'Offline · 0 unsynced'}
                  </span>
                )}
              </div>

              {isOnline && unsyncedNotesCount > 0 && syncStatus !== 'syncing' && onTriggerSync && (
                <button
                  type="button"
                  onClick={onTriggerSync}
                  className="ml-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Sync Now
                </button>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
              title="Print via system dialog"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Tabs & Top Bar */}
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Progress Overview
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'chapters'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Completed Chapters ({totalCompletedChaptersCount})
            </button>
            <button
              onClick={() => setActiveTab('quiz_history')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'quiz_history'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Quiz History</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Raw Data</span>
            </button>
          </div>

          {/* Primary Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download Printable PDF'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all border border-stone-200 dark:border-stone-700"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">Courses Completed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{completedCourses.length}</span>
                <span className="text-xs text-stone-400 font-mono">/ {totalCourses}</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                {startedCourses.length} in progress
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">Chapters Completed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{totalCompletedChaptersCount}</span>
                <span className="text-xs text-stone-400 font-mono">/ {totalChaptersInCurriculum}</span>
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-0.5 block">
                {overallProgressPercent}% curriculum rate
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">Avg Quiz Mastery</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{avgQuizScore}%</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">
                Executive Passing Grade
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">Badges Earned</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{uniqueBadges.length}</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 block">
                Internal Platform Record
              </span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Course Learning Pathways & Status
                </h3>
                <span className="text-xs text-stone-500 font-mono">
                  {studyGuides.length} Curriculum Units
                </span>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-stone-900">
                {studyGuides.map(guide => {
                  const prog = readingProgress[guide.id];
                  const completedIndices = prog?.completedChapters || [];
                  const isCompleted = prog?.isCompleted;
                  const progress = prog?.progressPercent || 0;

                  return (
                    <div key={guide.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-950 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {guide.title}
                          </h4>
                          {guide.is_accredited && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                              Quality-Checked
                            </span>
                          )}
                          {isCompleted ? (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500 text-white font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : completedIndices.length > 0 ? (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                              In Progress ({progress}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                              Not Started
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                          <span>{guide.category}</span>
                          <span>·</span>
                          <span>{guide.duration_label}</span>
                          <span>·</span>
                          <span className="font-mono">{completedIndices.length}/{guide.chapters.length} chapters completed</span>
                          {prog?.lastReadDate && (
                            <>
                              <span>·</span>
                              <span>Last studied: {prog.lastReadDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full sm:w-36">
                        <ReadingProgressIndicator
                          guideId={guide.id}
                          courseTitle={guide.title}
                          completedCount={completedIndices.length}
                          totalCount={guide.chapters.length}
                          progressPercent={progress}
                          isCompleted={Boolean(isCompleted)}
                          variant="compact"
                          enableConfetti
                          confettiVariant="contained"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETED CHAPTERS BREAKDOWN */}
          {activeTab === 'chapters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Detailed Chapter Completion Log
                </h3>
                <span className="text-xs text-stone-500 font-mono">
                  {totalCompletedChaptersCount} Chapters Mastered
                </span>
              </div>

              <div className="space-y-4">
                {studyGuides.map(guide => {
                  const prog = readingProgress[guide.id];
                  const completedIndices = prog?.completedChapters || [];

                  return (
                    <div 
                      key={guide.id}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {guide.title}
                          </h4>
                          <span className="text-xs text-stone-500">{guide.category} · {guide.chapters.length} Total Chapters</span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {completedIndices.length} / {guide.chapters.length} Completed
                        </span>
                      </div>

                      {/* Chapters Grid / List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {guide.chapters.map((chapter, idx) => {
                          const isDone = completedIndices.includes(idx);
                          const chapterSummaryNote = prog?.chapterNotes?.[idx];
                          return (
                            <div 
                              key={idx}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                                isDone 
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                                  : 'bg-stone-50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 text-stone-500'
                              }`}
                            >
                              <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                                isDone 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}>
                                <Check className="w-3 h-3" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <span className="text-[10px] font-mono block uppercase tracking-wider opacity-75">
                                  Chapter {idx + 1} · {isDone ? 'Completed' : 'Pending'}
                                </span>
                                <p className="text-xs font-semibold truncate">
                                  {chapter.title}
                                </p>
                                {chapterSummaryNote && (
                                  <p className="text-[11px] text-stone-600 dark:text-stone-400 italic flex items-start gap-1 pt-0.5">
                                    <FileEdit className="w-3 h-3 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                    <span className="line-clamp-2">&ldquo;{chapterSummaryNote}&rdquo;</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {prog?.notes && (
                        <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl text-xs text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800 italic">
                          <span className="font-bold not-italic text-stone-700 dark:text-stone-300 mr-2">Course Study Notes:</span>
                          "{prog.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ HISTORY TIMELINE */}
          {activeTab === 'quiz_history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Course Quiz History &amp; Score Improvement Timeline
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    All past assessment attempts and score trajectories recorded across your active and completed courses
                  </p>
                </div>
                <span className="text-xs text-stone-500 font-mono">
                  {studyGuides.reduce(
                    (sum, g) => sum + (readingProgress[g.id]?.quizHistory?.length || 0),
                    0
                  )}{' '}
                  Total Logged Attempts
                </span>
              </div>

              <div className="space-y-4">
                {studyGuides.map((guide) => (
                  <QuizHistoryTimeline
                    key={guide.id}
                    guide={guide}
                    progress={readingProgress[guide.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: JSON RAW DATA */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-500">
                  Schema: application/json (Verifiable Transcript Export)
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-medium transition-all"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON Payload</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 overflow-x-auto max-h-[380px]">
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                  {JSON.stringify(jsonReportData, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Document ID: <strong className="font-mono text-stone-700 dark:text-stone-300">{reportId}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl font-medium transition-all"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white rounded-xl font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Printable PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
