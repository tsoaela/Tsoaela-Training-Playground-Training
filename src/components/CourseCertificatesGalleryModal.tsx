import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Layers, X, ArrowUpRight, Lock } from 'lucide-react';
import {
  AccreditationTier,
  CourseCertificateSpec,
  EducationCourse,
  ReadingProgress,
  StudyGuide,
  UserProfile,
} from '../types';
import {
  formatCertificateSerial,
  getCertificateForEducationCourse,
  getCertificateForStudyGuide,
  inferAccreditationTier,
  TAI_ONE_LOGO_URL,
} from '../data/certificatesData';
import { CourseCertificateCard } from './CourseCertificateCard';
import { CourseCertificateModal } from './CourseCertificateModal';

interface AttachedCourseCertItem {
  courseId: string;
  courseTitle: string;
  category: string;
  sourceLabel: string;
  certificate: CourseCertificateSpec;
  accreditationTier: AccreditationTier;
  progressPercent: number;
  quizScore?: number;
  isEarned: boolean;
}

interface CourseCertificatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  studyGuides: StudyGuide[];
  educationCourses: EducationCourse[];
  readingProgress: Record<string, ReadingProgress>;
}

export const CourseCertificatesGalleryModal: React.FC<CourseCertificatesGalleryModalProps> = ({
  isOpen,
  onClose,
  user,
  studyGuides,
  educationCourses,
  readingProgress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | AccreditationTier>('all');
  const [activePreviewItem, setActivePreviewItem] = useState<AttachedCourseCertItem | null>(null);

  const items = useMemo<AttachedCourseCertItem[]>(() => {
    const guideItems: AttachedCourseCertItem[] = [];
    for (const g of studyGuides) {
      const cert = getCertificateForStudyGuide(g);
      if (!cert) continue;
      const prog = readingProgress[g.id];
      const scores = prog?.quizScores
        ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
        : [];
      const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
      const pct = prog?.progressPercent || 0;
      guideItems.push({
        courseId: g.id,
        courseTitle: g.title,
        category: g.category,
        sourceLabel: 'Educare Curriculum',
        certificate: cert,
        accreditationTier: inferAccreditationTier(cert.accreditor, cert.accreditationTier),
        progressPercent: pct,
        quizScore: bestScore,
        isEarned: Boolean(prog?.isCompleted || pct >= 100 || (bestScore !== undefined && bestScore >= 70)),
      });
    }

    const academyItems: AttachedCourseCertItem[] = [];
    for (const c of educationCourses) {
      const cert = getCertificateForEducationCourse(c);
      if (!cert) continue;
      const prog = readingProgress[c.id];
      const pct = prog?.progressPercent || 0;
      academyItems.push({
        courseId: c.id,
        courseTitle: c.title,
        category: c.platformDomain,
        sourceLabel: 'Digital World Academy',
        certificate: cert,
        accreditationTier: inferAccreditationTier(cert.accreditor, cert.accreditationTier),
        progressPercent: pct,
        isEarned: Boolean(prog?.isCompleted || pct >= 100),
      });
    }

    return [...guideItems, ...academyItems];
  }, [studyGuides, educationCourses, readingProgress]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (selectedTier !== 'all' && i.accreditationTier !== selectedTier) return false;
      if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
      return true;
    });
  }, [items, selectedCategory, selectedTier]);

  if (!isOpen) return null;

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-[#84cc16]/40 overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#022c22] text-white border-b border-[#84cc16]/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="TTG - Tsoaela Training Ground Platform Seal"
              referrerPolicy="no-referrer"
              className="h-12 w-auto rounded-xl object-contain bg-white p-1 border-2 border-[#bef264] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#bef264]">
                <Award className="w-3.5 h-3.5" />
                <span>TTG &amp; Tai-One W3C · Accredited Internal &amp; External Registry</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Accredited Course Certificates ({items.length} Accredited Tracks)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#d9f99d]/80 hover:text-white hover:bg-[#064e3b] transition-colors cursor-pointer"
            aria-label="Close certificates registry"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier & Category Filter Strip */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All Accredited (${items.length})` },
                { id: 'accredited_external', label: 'Accredited External · Tai-One W3C' },
                { id: 'accredited_internal', label: 'Accredited Internal · TTG Board' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTier(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedTier === t.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#052e16] text-[#bef264] border border-[#84cc16]/70'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-[#84cc16]/50'
                  }`}
                >
                  {cat === 'all' ? `All Categories (${items.length})` : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-stone-100/70 dark:bg-stone-950/60">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => {
              const serial = formatCertificateSerial(
                item.certificate.credentialCodePrefix,
                item.courseId,
                user.id
              );

              return (
                <div key={item.courseId} className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-[#4d7c0f] dark:text-[#a3e635] font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.sourceLabel} · {item.category}</span>
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {item.courseTitle}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePreviewItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                    >
                      {!item.isEarned && <Lock className="w-3 h-3 text-[#eab308]" />}
                      <span>{item.isEarned ? 'Open & PDF' : 'Template Preview'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <CourseCertificateCard
                    certificate={item.certificate}
                    courseTitle={item.courseTitle}
                    recipientName={user.name}
                    serialNumber={serial}
                    issueDate={issueDate}
                    progressPercent={item.progressPercent}
                    quizScore={item.quizScore}
                    isEarned={item.isEarned}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
            Only Accredited Internal (TTG Board) and Accredited External (Tai-One W3C) certificates are issued; non-credited certificates have been removed.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Individual Certificate Full Preview & PDF Export */}
      <CourseCertificateModal
        isOpen={!!activePreviewItem}
        onClose={() => setActivePreviewItem(null)}
        certificate={activePreviewItem?.certificate || null}
        courseTitle={activePreviewItem?.courseTitle || ''}
        recipientName={user.name}
        serialNumber={
          activePreviewItem
            ? formatCertificateSerial(
                activePreviewItem.certificate.credentialCodePrefix,
                activePreviewItem.courseId,
                user.id
              )
            : ''
        }
        issueDate={issueDate}
        progressPercent={activePreviewItem?.progressPercent || 0}
        quizScore={activePreviewItem?.quizScore}
        isEarned={activePreviewItem?.isEarned}
      />
    </div>
  );
};
