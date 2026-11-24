import React from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { CourseCertificateSpec } from '../types';
import { TAI_ONE_LOGO_URL } from '../data/certificatesData';

interface CourseCertificateCardProps {
  certificate: CourseCertificateSpec;
  courseTitle: string;
  recipientName: string;
  serialNumber: string;
  issueDate: string;
  progressPercent?: number;
  quizScore?: number;
  isEarned?: boolean;
  compact?: boolean;
}

/**
 * Renders the course certificate designed in golden green, dark green, and lime
 * layered SVG textures with the official TTG emblem and category-specific artwork.
 * When !isEarned, displays a locked template specimen without personalized serial/name issuance.
 */
export const CourseCertificateCard: React.FC<CourseCertificateCardProps> = ({
  certificate,
  courseTitle,
  recipientName,
  serialNumber,
  issueDate,
  progressPercent = 0,
  quizScore,
  isEarned = false,
  compact = false,
}) => {
  const patternId = `cert_tex_${certificate.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const gradGoldGreenId = `cert_gold_green_${certificate.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const displayRecipient = isEarned ? recipientName : '[LEARNER NAME · TEMPLATE PREVIEW]';
  const displaySerial = isEarned ? serialNumber : 'TTG-TEMPLATE-LOCKED';
  const displayIssueDate = isEarned ? issueDate : 'ISSUED UPON 100% COURSE COMPLETION';
  const isExternalAccredited =
    certificate.accreditationTier === 'accredited_external' ||
    /tai-one|w3c|fpac|iocc|ascr|ivcab|gdlab|cosv|external/i.test(certificate.accreditor || '');
  const tierSummaryLabel = isExternalAccredited
    ? 'Accredited External · Tai-One W3C'
    : 'Accredited Internal · TTG Board';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[#a3b828]/80 shadow-2xl text-[#f7fee7] select-none ${
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-10'
      }`}
      style={{
        background:
          'radial-gradient(circle at 18% 18%, rgba(163, 230, 53, 0.16) 0%, transparent 45%), radial-gradient(circle at 86% 82%, rgba(132, 204, 22, 0.18) 0%, transparent 48%), linear-gradient(135deg, #022c22 0%, #052e16 38%, #064e3b 72%, #032219 100%)',
      }}
    >
      {/* Layered Dark-Green, Golden-Green & Lime SVG Texture Overlay */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradGoldGreenId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bef264" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#a3b828" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#65a30d" stopOpacity="0.65" />
          </linearGradient>

          {certificate.texturePattern === 'guilloche' && (
            <pattern id={patternId} width="64" height="64" patternUnits="userSpaceOnUse">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#a3e635" strokeOpacity="0.22" strokeWidth="0.7" />
              <circle cx="32" cy="32" r="20" fill="none" stroke="#eab308" strokeOpacity="0.24" strokeWidth="0.6" />
              <circle cx="32" cy="32" r="12" fill="none" stroke="#84cc16" strokeOpacity="0.28" strokeWidth="0.5" />
              <path d="M0 32 Q32 0 64 32 Q32 64 0 32 Z" fill="none" stroke="#bef264" strokeOpacity="0.16" strokeWidth="0.6" />
            </pattern>
          )}

          {certificate.texturePattern === 'botanical_lattice' && (
            <pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M0 24 L24 0 L48 24 L24 48 Z" fill="none" stroke="#a3e635" strokeOpacity="0.22" strokeWidth="0.75" />
              <path d="M12 24 C18 14, 30 14, 36 24 C30 34, 18 34, 12 24 Z" fill="none" stroke="#ca8a04" strokeOpacity="0.28" strokeWidth="0.65" />
              <circle cx="24" cy="24" r="2" fill="#bef264" fillOpacity="0.25" />
            </pattern>
          )}

          {certificate.texturePattern === 'hex_mesh' && (
            <pattern id={patternId} width="56" height="48.5" patternUnits="userSpaceOnUse">
              <polygon
                points="28,2 52,14 52,34.5 28,46.5 4,34.5 4,14"
                fill="none"
                stroke="#84cc16"
                strokeOpacity="0.26"
                strokeWidth="0.75"
              />
              <polygon
                points="28,9 44,17 44,31.5 28,39.5 12,31.5 12,17"
                fill="none"
                stroke="#eab308"
                strokeOpacity="0.2"
                strokeWidth="0.55"
              />
            </pattern>
          )}

          {certificate.texturePattern === 'harmonic_waves' && (
            <pattern id={patternId} width="72" height="36" patternUnits="userSpaceOnUse">
              <path d="M0 18 Q18 2 36 18 T72 18" fill="none" stroke="#a3e635" strokeOpacity="0.26" strokeWidth="0.8" />
              <path d="M0 24 Q18 8 36 24 T72 24" fill="none" stroke="#ca8a04" strokeOpacity="0.22" strokeWidth="0.65" />
              <path d="M0 12 Q18 -4 36 12 T72 12" fill="none" stroke="#bef264" strokeOpacity="0.16" strokeWidth="0.6" />
            </pattern>
          )}
        </defs>

        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Locked Specimen Watermark Overlay when !isEarned */}
      {!isEarned && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
        >
          <div className="rotate-[-18deg] border-y-2 border-[#bef264]/35 bg-[#022c22]/65 px-10 py-2.5 backdrop-blur-[1px] text-center shadow-lg">
            <span className="block text-xs sm:text-sm font-mono font-extrabold uppercase tracking-[0.28em] text-[#fef08a]/90">
              CERTIFICATION TEMPLATE ONLY · LOCKED
            </span>
            <span className="block text-[10px] font-mono text-[#bef264]/80 tracking-wider mt-0.5">
              COMPLETE COURSE (100%) OR PASS QUIZ (70%+) TO UNLOCK CREDENTIAL
            </span>
          </div>
        </div>
      )}

      {/* Fine Lime-Gold Corner Ornate Inner Frames */}
      <div className="pointer-events-none absolute inset-2.5 sm:inset-3.5 rounded-xl border border-[#bef264]/45" />
      <div className="pointer-events-none absolute inset-4 sm:inset-5 rounded-lg border border-[#ca8a04]/45" />

      {/* Ornate Golden-Green Corner Filigrees */}
      <div className="pointer-events-none absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-[#d9f99d]/85 rounded-tl-md" />
      <div className="pointer-events-none absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-[#d9f99d]/85 rounded-tr-md" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-[#eab308]/85 rounded-bl-md" />
      <div className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-[#eab308]/85 rounded-br-md" />

      <div className={`relative z-10 space-y-5 ${!isEarned ? 'opacity-85' : ''}`}>
        {/* Top Crest Row: TTG Official Logo + Issuing Institution + Category */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#84cc16]/30 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-1 rounded-xl bg-white ring-2 ring-[#bef264]/80 shadow-lg shrink-0">
              <img
                src={TAI_ONE_LOGO_URL}
                alt="TTG - Tsoaela Training Ground Platform Crest"
                referrerPolicy="no-referrer"
                className="h-12 sm:h-14 w-auto object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#bef264]">
                TTG - Tsoaela Training Ground Platform
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#fefce8] tracking-wide">
                {certificate.accreditor}
              </div>
              <div className="text-[11px] text-[#a3e635]/90 font-mono">
                Category: {certificate.categoryKey} · {certificate.w3cStandard || tierSummaryLabel}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#052e16]/90 text-[#bef264] border border-[#84cc16]/60">
              {isEarned ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span>{tierSummaryLabel}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Template Locked · {progressPercent}% Complete</span>
                </>
              )}
            </span>
            <span className="text-[10px] font-mono text-[#d9f99d]/80 tabular-nums">
              Serial: {displaySerial}
            </span>
          </div>
        </div>

        {/* Centerpiece Typography */}
        <div className="text-center space-y-2 py-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.26em] text-[#d9f99d]">
            {isEarned ? certificate.distinctionLabel : `${certificate.distinctionLabel} · SAMPLE TEMPLATE`}
          </div>
          <h3 className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fef9c3] via-[#bef264] to-[#eab308]`}>
            {certificate.credentialTitle}
          </h3>
          <p className="text-xs text-[#d9f99d]/85 max-w-2xl mx-auto">
            {isEarned
              ? isExternalAccredited
                ? 'This accredited external Tai-One W3C credential certifies mastery and completion by'
                : 'This accredited internal institutional credential certifies mastery and completion by'
              : 'Accredited certification layout — upon completion this credential is awarded to'}
          </p>

          <div className="pt-1 pb-1">
            <div
              className={`${
                compact
                  ? isEarned
                    ? 'text-2xl sm:text-3xl'
                    : 'text-lg sm:text-xl'
                  : isEarned
                  ? 'text-3xl sm:text-4xl'
                  : 'text-xl sm:text-2xl'
              } font-black tracking-tight text-white drop-shadow-sm ${!isEarned ? 'font-mono text-[#bef264]/80' : ''}`}
            >
              {displayRecipient}
            </div>
            <div className="mx-auto mt-1.5 h-px w-56 bg-gradient-to-r from-transparent via-[#a3e635] to-transparent" />
          </div>

          <p className="text-xs sm:text-sm text-[#ecfccb] font-semibold max-w-2xl mx-auto pt-1">
            for completing study modules in <span className="text-[#bef264] font-bold">{courseTitle}</span>
          </p>
        </div>

        {/* Competencies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {certificate.competencies.slice(0, 3).map((comp, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#022c22]/80 border border-[#84cc16]/35 text-[11px] text-[#ecfccb] flex items-start gap-2"
            >
              <span className="text-[#a3e635] font-mono font-bold mt-0.5">0{idx + 1}</span>
              <span className="leading-snug">{comp}</span>
            </div>
          ))}
        </div>

        {/* Bottom Seal & Verification Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#84cc16]/30 text-[11px]">
          <div className="space-y-0.5">
            <div className="font-mono text-[#a3e635] uppercase tracking-wider font-bold">
              Issue Date: {displayIssueDate}
            </div>
            <div className="text-[#d9f99d]/80">
              {!isEarned
                ? 'Accredited Template Specimen · Exports & Personal Issuance Locked Until Completion'
                : quizScore !== undefined
                ? `Assessment Score: ${quizScore}% · ${tierSummaryLabel}`
                : tierSummaryLabel}
            </div>
          </div>

          {/* Golden-Green & Lime Embossed Seal */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-[#fef08a]">{certificate.sealTitle}</div>
              <div className="text-[10px] font-mono text-[#bef264]/80">
                {isEarned ? tierSummaryLabel : 'Accredited Certification Template Preview'}
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#bef264] shadow-lg shrink-0"
              style={{
                background:
                  'conic-gradient(from 45deg, #65a30d, #eab308, #84cc16, #ca8a04, #65a30d)',
              }}
            >
              <div className="w-9 h-9 rounded-full bg-[#022c22] flex items-center justify-center border border-[#bef264]/70">
                {isEarned ? (
                  <Award className="w-5 h-5 text-[#bef264]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#eab308]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
