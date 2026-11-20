import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { STUDENT_BADGES } from '../data/mockData';
import { formatCertificateSerial, getCertificateForStudyGuide, inferAccreditationTier } from '../data/certificatesData';
import { EnrolledStudentRecord, ReadingProgress, StudyGuide, UserProfile } from '../types';
import { getFittedLogoSize, loadLogoDataUrl } from './pdfBranding';

export interface LearningRecordExportInput {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  enrollments: EnrolledStudentRecord[];
  totalStudyHours: number;
  averageQuizScore: number;
  syncedFocusMinutes: number;
  completedPomodoroSessions: number;
}

export interface LearningRecordSnapshot {
  exportedAt: string;
  platform: string;
  recordClassification: string;
  scholar: {
    id: string;
    name: string;
    email: string;
    role: string;
    institution?: string;
    bio?: string;
  };
  summary: {
    totalStudyHours: number;
    syncedFocusMinutes: number;
    completedPomodoroSessions: number;
    averageQuizScore: number;
    completedCoursesCount: number;
    inProgressCoursesCount: number;
    unlockedBadgesCount: number;
    totalBadgesCount: number;
    completedCertificationsCount: number;
    constructivePeerReviewsCount: number;
  };
  courseProgressHistory: {
    courseId: string;
    courseTitle: string;
    category: string;
    progressPercent: number;
    isCompleted: boolean;
    completedChaptersCount: number;
    totalChaptersCount: number;
    completedChapterTitles: string[];
    lastReadDate: string | null;
    bestQuizScore: number | null;
    quizHistory: {
      quizTitle: string;
      score: number;
      minScoreToPass: number;
      passed: boolean;
      attemptedAt: string;
    }[];
    completionLog: {
      chapterIdx: number;
      completedAt: string;
      notes?: string;
    }[];
  }[];
  unlockedBadges: {
    id: string;
    title: string;
    rarity: string;
    description: string;
    earnedDate: string | null;
  }[];
  completedCertifications: {
    courseId: string;
    courseTitle: string;
    credentialTitle: string;
    serialNumber: string;
    categoryKey: string;
    issueDate: string;
    bestQuizScore: number | null;
    status: string;
  }[];
}

export function buildLearningRecordSnapshot(input: LearningRecordExportInput): LearningRecordSnapshot {
  const {
    user,
    studyGuides,
    readingProgress,
    enrollments,
    totalStudyHours,
    averageQuizScore,
    syncedFocusMinutes,
    completedPomodoroSessions,
  } = input;

  const targetEmail = (user.email || '').trim().toLowerCase();
  const targetName = (user.name || '').trim().toLowerCase();

  let constructivePeerReviewsCount = 0;
  let latestMentorDate: string | null = null;

  enrollments.forEach((rec) => {
    (rec.peerReviews || []).forEach((rev) => {
      if (!(rev.critique || '').trim()) return;
      const emailMatches = targetEmail && (rev.reviewerEmail || '').trim().toLowerCase() === targetEmail;
      const nameMatches = targetName && (rev.reviewerName || '').trim().toLowerCase() === targetName;
      if (emailMatches || nameMatches) {
        constructivePeerReviewsCount += 1;
        const d = (rev.createdAt || '').slice(0, 10);
        if (d && (!latestMentorDate || d > latestMentorDate)) {
          latestMentorDate = d;
        }
      }
    });
  });

  // Compute badges identically to AchievementBadgesSection
  const unlockedSet = new Set<string>();
  const unlockedDateByBadge: Record<string, string> = {};

  Object.values(readingProgress).forEach((progress) => {
    (progress.unlockedBadges || []).forEach((badgeId) => {
      unlockedSet.add(badgeId);
      if (!unlockedDateByBadge[badgeId] && progress.lastReadDate) {
        unlockedDateByBadge[badgeId] = progress.lastReadDate;
      }
    });
  });

  if (constructivePeerReviewsCount > 10) {
    unlockedSet.add('badge_community_mentor');
    if (!unlockedDateByBadge['badge_community_mentor'] && latestMentorDate) {
      unlockedDateByBadge['badge_community_mentor'] = latestMentorDate;
    }
  }

  const unlockedBadges = STUDENT_BADGES.filter((b) => unlockedSet.has(b.id)).map((b) => ({
    id: b.id,
    title: b.title,
    rarity: b.rarity,
    description: b.description,
    earnedDate: unlockedDateByBadge[b.id] || null,
  }));

  // Compute course progress history + earned certifications
  const courseProgressHistory: LearningRecordSnapshot['courseProgressHistory'] = [];
  const completedCertifications: LearningRecordSnapshot['completedCertifications'] = [];

  studyGuides.forEach((guide) => {
    const prog = readingProgress[guide.id];
    const completedChapters = prog?.completedChapters || [];
    const totalChaptersCount = Math.max(1, guide.chapters?.length || 1);
    const pct = prog?.progressPercent || 0;

    const scores = prog?.quizScores
      ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
      : [];
    const bestScore = scores.length > 0 ? Math.max(...scores) : null;
    const passThreshold = guide.quizzes?.[0]?.minScoreToPass ?? 70;
    const isCertEarned = Boolean(
      prog?.isCompleted || pct >= 100 || (bestScore !== null && bestScore >= passThreshold)
    );

    if (prog || isCertEarned) {
      courseProgressHistory.push({
        courseId: guide.id,
        courseTitle: guide.title,
        category: guide.category,
        progressPercent: pct,
        isCompleted: Boolean(prog?.isCompleted || pct >= 100),
        completedChaptersCount: completedChapters.length,
        totalChaptersCount,
        completedChapterTitles: completedChapters
          .map((idx) => guide.chapters?.[idx]?.title)
          .filter((t): t is string => Boolean(t)),
        lastReadDate: prog?.lastReadDate || null,
        bestQuizScore: bestScore,
        quizHistory: (prog?.quizHistory || []).map((q) => ({
          quizTitle: q.quizTitle,
          score: q.score,
          minScoreToPass: q.minScoreToPass,
          passed: q.passed,
          attemptedAt: q.attemptedAt,
        })),
        completionLog: (prog?.completionLog || []).map((log) => ({
          chapterIdx: log.chapterIdx,
          completedAt: log.completedAt,
          notes: log.notes,
        })),
      });
    }

    if (isCertEarned && guide.is_accredited !== false) {
      const cert = getCertificateForStudyGuide(guide);
      if (cert) {
        const tier = inferAccreditationTier(cert.accreditor, cert.accreditationTier);
        const serialNumber = formatCertificateSerial(cert.credentialCodePrefix, guide.id, user.id);
        completedCertifications.push({
          courseId: guide.id,
          courseTitle: guide.title,
          credentialTitle: cert.credentialTitle,
          serialNumber,
          categoryKey: cert.categoryKey,
          issueDate:
            prog?.lastReadDate ||
            new Date().toISOString().slice(0, 10),
          bestQuizScore: bestScore,
          status:
            tier === 'accredited_external'
              ? 'Accredited External (Tai-One W3C)'
              : 'Accredited Internal (TTG Board)',
        });
      }
    }
  });

  const completedCoursesCount = courseProgressHistory.filter((c) => c.isCompleted).length;
  const inProgressCoursesCount = courseProgressHistory.filter(
    (c) => !c.isCompleted && (c.progressPercent > 0 || c.completedChaptersCount > 0)
  ).length;

  return {
    exportedAt: new Date().toISOString(),
    platform: 'TTG - Tsoaela Training Ground Platform',
    recordClassification:
      'Accredited Internal (TTG Board) & Accredited External (Tai-One W3C) Learning Record',
    scholar: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      institution: user.institution,
      bio: user.bio,
    },
    summary: {
      totalStudyHours,
      syncedFocusMinutes,
      completedPomodoroSessions,
      averageQuizScore,
      completedCoursesCount,
      inProgressCoursesCount,
      unlockedBadgesCount: unlockedBadges.length,
      totalBadgesCount: STUDENT_BADGES.length,
      completedCertificationsCount: completedCertifications.length,
      constructivePeerReviewsCount,
    },
    courseProgressHistory,
    unlockedBadges,
    completedCertifications,
  };
}

function makeExportSlug(name: string): string {
  return (name || 'Scholar')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

export function exportLearningRecordJson(input: LearningRecordExportInput): LearningRecordSnapshot {
  const snapshot = buildLearningRecordSnapshot(input);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const datePart = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TTG_Learning_Record_${makeExportSlug(input.user.name)}_${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return snapshot;
}

export async function exportLearningRecordPdf(
  input: LearningRecordExportInput
): Promise<LearningRecordSnapshot> {
  const snapshot = buildLearningRecordSnapshot(input);
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const dateStr = snapshot.exportedAt.slice(0, 10);

  // Header Banner (Deep Forest Green + Luminous Lime Accent)
  doc.setFillColor(5, 46, 22); // #052e16
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setDrawColor(132, 204, 22); // #84cc16
  doc.setLineWidth(0.9);
  doc.line(0, 42, pageW, 42);

  let textX = 14;
  if (logoDataUrl) {
    const boxW = 24;
    const boxH = 15;
    const boxX = 14;
    const boxY = 12;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'F');
    const fitted = getFittedLogoSize(boxW - 2, boxH - 2);
    doc.addImage(
      logoDataUrl,
      'JPEG',
      boxX + (boxW - fitted.width) / 2,
      boxY + (boxH - fitted.height) / 2,
      fitted.width,
      fitted.height
    );
    textX = boxX + boxW + 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 242, 100); // #bef264
  doc.text('TTG - TSOAELA TRAINING GROUND PLATFORM', textX, 16);

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('MY LEARNING RECORD & CREDENTIAL DOSSIER', textX, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(217, 249, 157);
  doc.text(
    `Scholar: ${snapshot.scholar.name} (${snapshot.scholar.email})  ·  Exported: ${dateStr}`,
    textX,
    31
  );
  doc.text(
    `Role: ${snapshot.scholar.role.toUpperCase()}${snapshot.scholar.institution ? `  ·  ${snapshot.scholar.institution}` : ''}`,
    textX,
    36.5
  );

  // Summary KPI Box
  let y = 50;
  doc.setFillColor(247, 254, 231); // #f7fee7
  doc.setDrawColor(163, 184, 40);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, pageW - 28, 20, 2, 2, 'FD');

  const kpis = [
    { label: 'STUDY HOURS', value: `${snapshot.summary.totalStudyHours} hrs` },
    { label: 'AVG QUIZ SCORE', value: `${snapshot.summary.averageQuizScore}%` },
    { label: 'COMPLETED COURSES', value: `${snapshot.summary.completedCoursesCount}` },
    {
      label: 'BADGES UNLOCKED',
      value: `${snapshot.summary.unlockedBadgesCount}/${snapshot.summary.totalBadgesCount}`,
    },
    { label: 'CERTIFICATES', value: `${snapshot.summary.completedCertificationsCount}` },
    { label: 'PEER REVIEWS', value: `${snapshot.summary.constructivePeerReviewsCount}` },
  ];

  const colW = (pageW - 28) / kpis.length;
  kpis.forEach((k, idx) => {
    const cx = 14 + idx * colW + colW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(63, 98, 18);
    doc.text(k.label, cx, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(5, 46, 22);
    doc.text(k.value, cx, y + 14.5, { align: 'center' });
  });

  y += 28;

  // Section 1: Progress History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 46, 22);
  doc.text('1. Course Progress & Assessment History', 14, y);
  y += 3;

  (doc as any).autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Course Title', 'Category', 'Progress', 'Chapters', 'Best Score', 'Last Active', 'Status']],
    body:
      snapshot.courseProgressHistory.length > 0
        ? snapshot.courseProgressHistory.map((c) => [
            c.courseTitle,
            c.category,
            `${c.progressPercent}%`,
            `${c.completedChaptersCount}/${c.totalChaptersCount}`,
            c.bestQuizScore !== null ? `${c.bestQuizScore}%` : '—',
            c.lastReadDate || '—',
            c.isCompleted ? 'Completed' : 'In Progress',
          ])
        : [['No course activity recorded yet', '—', '0%', '0/0', '—', '—', 'Not Started']],
    headStyles: { fillColor: [5, 46, 22], textColor: [190, 242, 100], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [28, 25, 23] },
    alternateRowStyles: { fillColor: [249, 250, 247] },
  });

  y = (doc as any).lastAutoTable.finalY + 9;

  // Section 2: Achievement Badges
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 46, 22);
  doc.text('2. Unlocked Achievement Badges', 14, y);
  y += 3;

  (doc as any).autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Badge Title', 'Rarity Tier', 'Date Earned', 'Qualification Criteria']],
    body:
      snapshot.unlockedBadges.length > 0
        ? snapshot.unlockedBadges.map((b) => [
            b.title,
            b.rarity,
            b.earnedDate || 'Active',
            b.description,
          ])
        : [['No badges unlocked yet', '—', '—', 'Complete module quizzes or submit >10 constructive peer reviews.']],
    headStyles: { fillColor: [6, 78, 59], textColor: [236, 252, 203], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [28, 25, 23] },
    alternateRowStyles: { fillColor: [249, 250, 247] },
  });

  y = (doc as any).lastAutoTable.finalY + 9;

  // Section 3: Completed Certifications
  if (y > 235) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 46, 22);
  doc.text('3. Accredited Course Certifications (Internal & External Ledger)', 14, y);
  y += 3;

  (doc as any).autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Credential Title', 'Course', 'Serial Number', 'Issue Date', 'Quiz Score', 'Accreditation Tier']],
    body:
      snapshot.completedCertifications.length > 0
        ? snapshot.completedCertifications.map((cert) => [
            cert.credentialTitle,
            cert.courseTitle,
            cert.serialNumber,
            cert.issueDate,
            cert.bestQuizScore !== null ? `${cert.bestQuizScore}%` : '100% Modules',
            cert.status,
          ])
        : [
            [
              'No accredited course certifications earned yet',
              '—',
              '—',
              '—',
              '—',
              'Complete 100% of chapters or pass course quiz (70%+)',
            ],
          ],
    headStyles: { fillColor: [2, 44, 34], textColor: [190, 242, 100], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [28, 25, 23] },
    alternateRowStyles: { fillColor: [249, 250, 247] },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108);
    doc.text(
      `TTG & Tai-One W3C · Accredited Internal & External Learning Record · Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  const datePart = new Date().toISOString().slice(0, 10);
  doc.save(`TTG_Learning_Record_${makeExportSlug(input.user.name)}_${datePart}.pdf`);
  return snapshot;
}
