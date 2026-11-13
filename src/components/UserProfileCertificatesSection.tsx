import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Eye, Layers, Sparkles } from 'lucide-react';
import { ReadingProgress, StudyGuide, UserProfile } from '../types';
import {
  formatCertificateSerial,
  getCertificateForStudyGuide,
  TAI_ONE_LOGO_URL,
} from '../data/certificatesData';
import { CourseCertificateModal } from './CourseCertificateModal';

interface UserProfileCertificatesSectionProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onNavigateToCourse?: (guideId: string) => void;
}

export const UserProfileCertificatesSection: React.FC<UserProfileCertificatesSectionProps> = ({
  user,
  studyGuides,
  readingProgress,
  onNavigateToCourse,
}) => {
  const [previewGuide, setPreviewGuide] = useState<StudyGuide | null>(null);

  const courseEntries = useMemo(() => {
    return studyGuides
      .map((guide) => {
        const prog = readingProgress[guide.id];
        const scores = prog?.quizScores
          ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
          : [];
        const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
        const pct = prog?.progressPercent || 0;
        const isEarned = Boolean(
          prog?.isCompleted || pct >= 100 || (bestScore !== undefined && bestScore >= 70)
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

  const earnedCount = courseEntries.filter((e) => e.isEarned).length;
  const featuredEntry = courseEntries[0] || null;
  const activePreviewEntry = useMemo(
    () => (previewGuide ? courseEntries.find((e) => e.guide.id === previewGuide.id) || null : null),
    [previewGuide, courseEntries]
  );

  return (
    <section className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-0.5 rounded-full bg-gradient-to-br from-[#bef264] via-[#84cc16] to-[#052e16] shrink-0 hidden sm:block">
            <img
              src={TAI_ONE_LOGO_URL}
              alt="Tai-one Official Credential Seal"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span>Academic Credentials</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-[#65a30d] dark:text-[#a3e635]">
                {earnedCount} of {courseEntries.length} Earned
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Course Completion Certificates
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              Inspect high-resolution, Tai-one branded completion certificates crafted in the platform&apos;s golden-green, dark-green, and lime palette.
            </p>
          </div>
        </div>

        {featuredEntry && (
          <button
            type="button"
            onClick={() => setPreviewGuide(featuredEntry.guide)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#052e16] to-[#064e3b] hover:from-[#064e3b] hover:to-[#047857] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Eye className="w-4 h-4 text-[#a3e635]" />
            <span>Certificate Preview</span>
          </button>
        )}
      </div>

      {courseEntries.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
          Enroll in a study guide to unlock course completion certificates.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseEntries.map(({ guide, cert, pct, bestScore, isEarned, serialNumber }) => (
            <div
              key={guide.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                isEarned
                  ? 'border-[#84cc16]/50 bg-gradient-to-br from-[#022c22]/[0.04] to-[#84cc16]/[0.08] dark:from-[#022c22]/60 dark:to-[#052e16]/50'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#65a30d] dark:text-[#bef264]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{cert.categoryKey}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isEarned
                        ? 'text-emerald-700 dark:text-[#a3e635]'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {isEarned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completion Verified</span>
                      </>
                    ) : (
                      <span>{pct}% Completed</span>
                    )}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {cert.credentialTitle}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Course: {guide.title}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                  <span>Serial: {serialNumber}</span>
                  {bestScore !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#65a30d] dark:text-[#bef264] font-semibold">
                        Exam Score: {bestScore}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-2">
                {onNavigateToCourse ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToCourse(guide.id)}
                    className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Open Course
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#84cc16]" />
                    <span>{cert.accentTone}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewGuide(guide)}
                  className="px-3.5 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Award className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>Certificate Preview</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Resolution Certificate Preview Modal */}
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
      />
    </section>
  );
};
