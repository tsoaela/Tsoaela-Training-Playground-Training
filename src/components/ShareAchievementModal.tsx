import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Download,
  Share2,
  X,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { StudentBadge } from '../types';
import { TAI_ONE_LOGO_URL } from '../data/certificatesData';
import { getFittedLogoSize } from '../utils/pdfBranding';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: StudentBadge | null;
  userName: string;
  completedCourseCount: number;
  unlockedBadgeCount: number;
  earnedDate?: string | null;
}

function loadCanvasImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines - 1) {
        const remaining = words.slice(i).join(' ');
        let clipped = remaining;
        while (ctx.measureText(`${clipped}...`).width > maxWidth && clipped.length > 4) {
          clipped = clipped.slice(0, -1);
        }
        ctx.fillText(remaining === clipped ? clipped : `${clipped}...`, x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  isOpen,
  onClose,
  badge,
  userName,
  completedCourseCount,
  unlockedBadgeCount,
  earnedDate,
}) => {
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !badge) return;
    let cancelled = false;

    const renderSocialCard = async () => {
      setIsGenerating(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Deep Dark-Green Canvas Background
        const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(0.45, '#052e16');
        bgGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1200, 630);

        // Radial lime/golden-green illumination
        const limeGlow = ctx.createRadialGradient(270, 315, 20, 270, 315, 340);
        limeGlow.addColorStop(0, 'rgba(163, 230, 53, 0.25)');
        limeGlow.addColorStop(0.55, 'rgba(132, 204, 22, 0.09)');
        limeGlow.addColorStop(1, 'rgba(2, 44, 34, 0)');
        ctx.fillStyle = limeGlow;
        ctx.fillRect(0, 0, 1200, 630);

        const goldGlow = ctx.createRadialGradient(1020, 120, 10, 1020, 120, 300);
        goldGlow.addColorStop(0, 'rgba(234, 179, 8, 0.16)');
        goldGlow.addColorStop(1, 'rgba(2, 44, 34, 0)');
        ctx.fillStyle = goldGlow;
        ctx.fillRect(0, 0, 1200, 630);

        // 2. Subtle Lime/Golden-Green Guilloche Texture Circles
        ctx.strokeStyle = 'rgba(163, 230, 53, 0.08)';
        ctx.lineWidth = 1.2;
        for (let gx = 40; gx <= 1160; gx += 80) {
          for (let gy = 40; gy <= 590; gy += 80) {
            ctx.beginPath();
            ctx.arc(gx, gy, 34, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // 3. Double Ornate Borders (Golden Green + Luminous Lime)
        drawRoundedRectPath(ctx, 22, 22, 1156, 586, 22);
        ctx.strokeStyle = 'rgba(163, 184, 40, 0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();

        drawRoundedRectPath(ctx, 36, 36, 1128, 558, 16);
        ctx.strokeStyle = 'rgba(190, 242, 100, 0.45)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        // Corner brackets
        ctx.strokeStyle = '#bef264';
        ctx.lineWidth = 3.5;
        const cLen = 28;
        const corners = [
          [48, 48, 1, 1],
          [1152, 48, -1, 1],
          [48, 582, 1, -1],
          [1152, 582, -1, -1],
        ];
        corners.forEach(([cx, cy, dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy + dy * cLen);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + dx * cLen, cy);
          ctx.stroke();
        });

        // Load images in parallel
        const [badgeImg, logoImg] = await Promise.all([
          loadCanvasImage(badge.image_url),
          loadCanvasImage(TAI_ONE_LOGO_URL),
        ]);

        if (cancelled) return;

        // 4. Top Brand Strip with Tsoaela Official Crest
        let brandTextX = 72;
        if (logoImg) {
          const boxX = 72;
          const boxY = 64;
          const boxW = 96;
          const boxH = 54;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = '#bef264';
          ctx.lineWidth = 2;
          ctx.stroke();

          const fitted = getFittedLogoSize(boxW - 8, boxH - 8);
          ctx.drawImage(
            logoImg,
            boxX + (boxW - fitted.width) / 2,
            boxY + (boxH - fitted.height) / 2,
            fitted.width,
            fitted.height
          );
          ctx.restore();
          brandTextX = boxX + boxW + 18;
        }

        ctx.fillStyle = '#bef264';
        ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText('TTG - TSOAELA TRAINING GROUND PLATFORM', brandTextX, 87);

        ctx.fillStyle = '#d9f99d';
        ctx.font = '600 14px system-ui, -apple-system, sans-serif';
        ctx.fillText('VERIFIED ACADEMIC ACHIEVEMENT CREDENTIAL', brandTextX, 110);

        // Top-right rarity stamp
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`${badge.rarity.toUpperCase()} TIER BADGE`, 1124, 88);
        ctx.fillStyle = '#a3e635';
        ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(earnedDate ? `EARNED ${earnedDate.toUpperCase()}` : 'VERIFIED MILESTONE', 1124, 110);
        ctx.textAlign = 'left';

        // Header divider
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(72, 140);
        ctx.lineTo(1124, 140);
        ctx.stroke();

        // 5. Left Emblem Container for Achievement Badge
        const badgeCx = 250;
        const badgeCy = 345;
        const badgeRadius = 136;

        // Outer metallic ring
        const ringGrad = ctx.createLinearGradient(
          badgeCx - badgeRadius,
          badgeCy - badgeRadius,
          badgeCx + badgeRadius,
          badgeCy + badgeRadius
        );
        ringGrad.addColorStop(0, '#bef264');
        ringGrad.addColorStop(0.5, '#ca8a04');
        ringGrad.addColorStop(1, '#84cc16');

        ctx.beginPath();
        ctx.arc(badgeCx, badgeCy, badgeRadius + 10, 0, Math.PI * 2);
        ctx.fillStyle = ringGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(badgeCx, badgeCy, badgeRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = '#022c22';
        ctx.fill();

        if (badgeImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(badgeCx, badgeCy, badgeRadius - 4, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(
            badgeImg,
            badgeCx - (badgeRadius - 4),
            badgeCy - (badgeRadius - 4),
            (badgeRadius - 4) * 2,
            (badgeRadius - 4) * 2
          );
          ctx.restore();
        } else {
          ctx.fillStyle = '#bef264';
          ctx.font = 'bold 40px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', badgeCx, badgeCy + 14);
          ctx.textAlign = 'left';
        }

        // 6. Right-Side Achievement Details & Completed Course Count
        const rightX = 445;
        const rightMaxW = 670;

        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText('SCHOLAR SPOTLIGHT', rightX, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 42px system-ui, -apple-system, sans-serif';
        ctx.fillText(userName || 'Academic Scholar', rightX, 248, rightMaxW);

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 32px system-ui, -apple-system, sans-serif';
        ctx.fillText(badge.title, rightX, 298, rightMaxW);

        ctx.fillStyle = '#ecfccb';
        ctx.font = '400 20px system-ui, -apple-system, sans-serif';
        wrapCanvasText(ctx, badge.description, rightX, 340, rightMaxW, 28, 3);

        // Metrics Strip (Completed Courses + Badges Unlocked)
        const cardY = 432;
        drawRoundedRectPath(ctx, rightX, cardY, 315, 112, 16);
        ctx.fillStyle = 'rgba(2, 44, 34, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(163, 230, 53, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#bef264';
        ctx.font = '800 46px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(String(completedCourseCount), rightX + 26, cardY + 58);

        ctx.fillStyle = '#d9f99d';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          completedCourseCount === 1 ? 'COURSE COMPLETED' : 'COURSES COMPLETED',
          rightX + 26,
          cardY + 86
        );

        drawRoundedRectPath(ctx, rightX + 335, cardY, 335, 112, 16);
        ctx.fillStyle = 'rgba(2, 44, 34, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = '800 46px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(String(unlockedBadgeCount), rightX + 361, cardY + 58);

        ctx.fillStyle = '#ecfccb';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          unlockedBadgeCount === 1 ? 'BADGE EARNED' : 'BADGES EARNED',
          rightX + 361,
          cardY + 86
        );

        // Footer verification text
        ctx.fillStyle = 'rgba(217, 249, 157, 0.72)';
        ctx.font = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(
          'TTG - TSOAELA TRAINING GROUND PLATFORM · CREDENTIAL ARCHIVE',
          72,
          574
        );

        if (!cancelled) {
          setCardDataUrl(canvas.toDataURL('image/png'));
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    renderSocialCard();
    return () => {
      cancelled = true;
    };
  }, [isOpen, badge, userName, completedCourseCount, unlockedBadgeCount, earnedDate]);

  if (!isOpen || !badge) return null;

  const shareText = `Proud to earn the "${badge.title}" (${badge.rarity} Tier) achievement badge at TTG - Tsoaela Training Ground Platform — with ${completedCourseCount} ${
    completedCourseCount === 1 ? 'course' : 'courses'
  } completed!`;

  const handleDownloadCard = () => {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    const safeSlug = badge.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.href = cardDataUrl;
    link.download = `TTG_Achievement_${safeSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback('Social card PNG downloaded.');
    setTimeout(() => setShareFeedback(null), 3500);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedCaption(true);
      setShareFeedback('Achievement caption copied to clipboard.');
      setTimeout(() => {
        setCopiedCaption(false);
        setShareFeedback(null);
      }, 3000);
    } catch {
      setShareFeedback('Unable to access clipboard automatically.');
    }
  };

  const handleNativeShare = async () => {
    if (!cardDataUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const res = await fetch(cardDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `ttg_achievement_${badge.id}.png`, {
          type: 'image/png',
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${badge.title} — TTG Platform Achievement`,
            text: shareText,
            files: [file],
          });
          setShareFeedback('Shared achievement card.');
          return;
        }

        await navigator.share({
          title: `${badge.title} — TTG Platform Achievement`,
          text: shareText,
        });
        setShareFeedback('Shared achievement summary.');
        return;
      }
      handleDownloadCard();
      await handleCopyCaption();
    } catch {
      // User canceled native share or unsupported context: offer clean download fallback
      handleDownloadCard();
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white dark:bg-stone-900 border border-[#84cc16]/40 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#022c22] text-[#ecfccb] border-b border-[#84cc16]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#064e3b] border border-[#84cc16]/60 text-[#bef264]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#a3e635] uppercase tracking-wider">
                Shareable Social Card Generator · 1200 × 630 PNG
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Share Achievement — {badge.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#d9f99d]/80 hover:text-white hover:bg-[#064e3b] transition-colors cursor-pointer"
            aria-label="Close share achievement modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social Card Preview */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-stone-50 dark:bg-stone-950">
          <div className="rounded-2xl overflow-hidden border border-[#84cc16]/40 bg-[#022c22] shadow-xl aspect-[1200/630] flex items-center justify-center">
            {isGenerating || !cardDataUrl ? (
              <div className="text-center space-y-2 p-6">
                <Award className="w-8 h-8 text-[#bef264] mx-auto animate-pulse" />
                <p className="text-xs font-mono text-[#d9f99d]">
                  Rendering high-resolution social achievement card...
                </p>
              </div>
            ) : (
              <img
                src={cardDataUrl}
                alt={`Shareable social achievement card for ${badge.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Card Summary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#052e16] text-[#bef264]">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Achievement Badge
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                  {badge.title}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#052e16] text-[#a3e635]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Courses Completed
                </span>
                <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                  {completedCourseCount} {completedCourseCount === 1 ? 'Course' : 'Courses'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#052e16] text-[#eab308]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Scholar Profile
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                  {userName}
                </span>
              </div>
            </div>
          </div>

          {shareFeedback && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyCaption}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2 cursor-pointer transition-colors"
          >
            {copiedCaption ? <Check className="w-3.5 h-3.5 text-[#65a30d]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCaption ? 'Caption Copied' : 'Copy Share Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={!cardDataUrl}
              className="px-4 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Social Card PNG</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              disabled={!cardDataUrl}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#ca8a04] hover:brightness-110 text-[#022c22] text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
