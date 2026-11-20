import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, Eye, Lock, ArrowUpRight, Layers, ShieldCheck } from 'lucide-react';
import { ReadingProgress, StudyGuide, UserProfile } from '../types';
import {
  formatCertificateSerial,
  getCertificateForStudyGuide,
  TAI_ONE_LOGO_URL,
} from '../data/certificatesData';
import { CourseCertificateCard } from './CourseCertificateCard';
import { CourseCertificateModal } from './CourseCertificateModal';

interface UserProfileCertificatesSectionProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onNavigateToCourse?: (guideId: string) => void;
  onVerifySerial?: (serial: string) => void;
  onAppealSerial?: (serial: string, courseId: string, courseTitle: string) => void;
}

export const UserProfileCertificatesSection: React.FC<UserProfileCertificatesSectionProps> = ({
  user,
  studyGuides,
  readingProgress,
  onNavigateToCourse,
  onVerifySerial,
  onAppealSerial,
}) => {
  const [previewGuide, setPreviewGuide] = useState<StudyGuide | null>(null);
  const [galleryTab, setGalleryTab] = useState<'earned' | 'templates'>('earned');

  const courseEntries = useMemo(() => {
    return studyGuides
      .map((guide) => {
        const prog = readingProgress[guide.id];
        const scores = prog?.quizScores
          ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
          : [];
        const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
        const pct = prog?.progressPercent || 0;
        const passThreshold = guide.quizzes?.[0]?.minScoreToPass ?? 70;
        const isEarned = Boolean(
          prog?.isCompleted || pct >= 100 || (bestScore !== undefined && bestScore >= passThreshold)
        );
        const cert = getCertificateForStudyGuide(guide);
        const serialNumber = formatCertificateSerial(cert.credentialCodePrefix, guide.id, user.id);

        return {
          guide,
          cert,
          pct,
          bestScore,
          isEarned,
          serialNumber,
          issueDate:
            prog?.lastReadDate ||
            new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
        };
      })
      .sort((a, b) => Number(b.isEarned) - Number(a.isEarned) || b.pct - a.pct);
  }, [studyGuides, readingProgress, user.id]);

  const earnedEntries = useMemo(() => courseEntries.filter((e) => e.isEarned), [courseEntries]);
  const lockedEntries = useMemo(() => courseEntries.filter((e) => !e.isEarned), [courseEntries]);
  const nearestInProgressEntry = lockedEntries[0] || null;

  const activePreviewEntry = useMemo(
    () => (previewGuide ? courseEntries.find((e) => e.guide.id === previewGuide.id) || null : null),
    [previewGuide, courseEntries]
  );

  const visibleGridEntries = galleryTab === 'earned' ? earnedEntries : lockedEntries;

  return (
    <section
      aria-labelledby="my-certificates-heading"
      className="border border-[#84cc16]/40 dark:border-[#84cc16]/30 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6 shadow-xs"
    >
      {/* Gallery Header with TTG Deep Forest, Luminous Lime & Olive-Gold Branding */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-1.5 rounded-xl bg-white ring-2 ring-[#84cc16]/75 shadow-sm shrink-0 hidden sm:block">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="TTG - Tsoaela Training Ground Platform Seal"
              referrerPolicy="no-referrer"
              className="h-12 w-auto object-contain rounded-lg"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span className="font-semibold text-[#052e16] dark:text-[#bef264]">
                TTG Official Credential Gallery
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-[#65a30d] dark:text-[#a3e635]">
                {earnedEntries.length} Earned Certificate{earnedEntries.length === 1 ? '' : 's'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {lockedEntries.length} In Progress
              </span>
            </div>
            <h2
              id="my-certificates-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
            >
              My Certificates
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              Gallery of earned course completion certificates rendered in TTG&apos;s deep forest green, golden-green, and luminous lime palette (internal self-paced platform records).
            </p>
          </div>
        </div>

        {/* Earned Gallery vs Locked Templates Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setGalleryTab('earned')}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              galleryTab === 'earned'
                ? 'bg-[#052e16] text-[#bef264] border border-[#84cc16]/60 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Earned Gallery ({earnedEntries.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setGalleryTab('templates')}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              galleryTab === 'templates'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Course Templates ({lockedEntries.length})</span>
          </button>
        </div>
      </div>

      {/* Gallery Grid Body */}
      {galleryTab === 'earned' && earnedEntries.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-[#a3b828]/60 p-8 sm:p-10 text-center space-y-4 text-[#f7fee7]"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(163, 230, 53, 0.14) 0%, transparent 45%), linear-gradient(135deg, #022c22 0%, #052e16 55%, #064e3b 100%)',
          }}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-[#022c22] border-2 border-[#bef264]/75 flex items-center justify-center shadow-lg">
            <Award className="w-7 h-7 text-[#bef264]" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#a3e635]">
              Earned Certificates Gallery · 0 Unlocked Yet
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Complete a Course to Display Your First Certificate Here
            </h3>
            <p className="text-xs sm:text-sm text-[#d9f99d]/85 leading-relaxed">
              Reach 100% chapter completion or pass a course assessment at your own pace to mint your personalized TTG completion certificate in the gallery grid.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {nearestInProgressEntry && onNavigateToCourse && (
              <button
                type="button"
                onClick={() => onNavigateToCourse(nearestInProgressEntry.guide.id)}
                className="px-4 py-2.5 rounded-xl bg-[#bef264] hover:bg-[#d9f99d] text-[#022c22] text-xs font-extrabold inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>
                  Resume {nearestInProgressEntry.guide.title.slice(0, 34)}… ({nearestInProgressEntry.pct}%)
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {lockedEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setGalleryTab('templates')}
                className="px-4 py-2.5 rounded-xl bg-[#022c22]/80 hover:bg-[#022c22] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4 text-[#a3e635]" />
                <span>View Locked Certification Templates ({lockedEntries.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : visibleGridEntries.length === 0 ? (
        <div className="py-10 text-center text-xs text-stone-500 dark:text-stone-400">
          All available courses have earned completion certificates in your Earned Gallery.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {visibleGridEntries.map(({ guide, cert, pct, bestScore, isEarned, serialNumber, issueDate }) => (
            <div
              key={guide.id}
              className="rounded-2xl border border-[#84cc16]/40 dark:border-[#84cc16]/35 bg-stone-50/70 dark:bg-stone-950/50 p-4 flex flex-col justify-between gap-4"
            >
              {/* Rendered Branded Certificate Card in Grid */}
              <div
                onClick={() => setPreviewGuide(guide)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPreviewGuide(guide);
                  }
                }}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] rounded-2xl"
                aria-label={`Preview certificate for ${guide.title}`}
              >
                <CourseCertificateCard
                  certificate={cert}
                  courseTitle={guide.title}
                  recipientName={user.name || 'Academic Scholar'}
                  serialNumber={serialNumber}
                  issueDate={issueDate}
                  progressPercent={pct}
                  quizScore={bestScore}
                  isEarned={isEarned}
                  compact={true}
                />
              </div>

              {/* Card Gallery Footer Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-mono text-[11px] tabular-nums">
                  <Layers className="w-3.5 h-3.5 text-[#65a30d] dark:text-[#a3e635]" />
                  <span>{isEarned ? `Issued ${issueDate}` : `${pct}% Completed`}</span>
                  {bestScore !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#65a30d] dark:text-[#bef264]">
                        Score: {bestScore}%
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEarned && onVerifySerial && (
                    <button
                      type="button"
                      onClick={() => onVerifySerial(serialNumber)}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                  )}
                  {onNavigateToCourse && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCourse(guide.id)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open Course
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewGuide(guide)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isEarned ? (
                      <>
                        <Download className="w-3.5 h-3.5 text-[#a3e635]" />
                        <span>View &amp; Download</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-[#eab308]" />
                        <span>Inspect Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Resolution Certificate Preview & Download Modal */}
      <CourseCertificateModal
        isOpen={Boolean(activePreviewEntry)}
        onClose={() => setPreviewGuide(null)}
        certificate={activePreviewEntry?.cert || null}
        courseTitle={activePreviewEntry?.guide.title || ''}
        recipientName={user.name || 'Academic Scholar'}
        serialNumber={activePreviewEntry?.serialNumber || ''}
        issueDate={activePreviewEntry?.issueDate || ''}
        progressPercent={activePreviewEntry?.pct || 0}
        quizScore={activePreviewEntry?.bestScore}
        isEarned={activePreviewEntry?.isEarned || false}
        onVerifyOnline={onVerifySerial}
        onAppealRecord={
          activePreviewEntry && onAppealSerial
            ? (serial) =>
                onAppealSerial(
                  serial,
                  activePreviewEntry.guide.id,
                  activePreviewEntry.guide.title
                )
            : undefined
        }
      />
    </section>
  );
};
