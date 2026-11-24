import React, { useState } from 'react';
import { Award, Download, Printer, X, CheckCircle2, Layers, ZoomIn, ZoomOut, Image as ImageIcon, Lock, ShieldCheck, Scale } from 'lucide-react';
import jsPDF from 'jspdf';
import { CourseCertificateSpec } from '../types';
import { CourseCertificateCard } from './CourseCertificateCard';
import { CertificateVerificationBadge } from './CertificateVerificationBadge';
import { loadLogoDataUrl, getFittedLogoSize } from '../utils/pdfBranding';
import { TAI_ONE_LOGO_URL } from '../data/certificatesData';

interface CourseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CourseCertificateSpec | null;
  courseTitle: string;
  recipientName: string;
  serialNumber: string;
  issueDate: string;
  progressPercent?: number;
  quizScore?: number;
  isEarned?: boolean;
  onVerifyOnline?: (serialNumber: string) => void;
  onAppealRecord?: (serialNumber: string) => void;
}

export const CourseCertificateModal: React.FC<CourseCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  courseTitle,
  recipientName,
  serialNumber,
  issueDate,
  progressPercent = 0,
  quizScore,
  isEarned = false,
  onVerifyOnline,
  onAppealRecord,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isHighResView, setIsHighResView] = useState(false);

  if (!isOpen || !certificate) return null;

  const isExternalAccredited =
    certificate.accreditationTier === 'accredited_external' ||
    /tai-one|w3c|fpac|iocc|ascr|ivcab|gdlab|cosv|external/i.test(certificate.accreditor || '');
  const accreditedTierBadge = isExternalAccredited
    ? 'ACCREDITED EXTERNAL · TAI-ONE W3C'
    : 'ACCREDITED INTERNAL · TTG BOARD';
  const accreditedSubline = isExternalAccredited
    ? 'Tai-One W3C Verifiable Credential · Accredited External'
    : 'TTG Internal Accreditation Board · Accredited Internal';

  const handleDownloadHighResPng = async () => {
    if (!isEarned) return;
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      // 1. Deep Dark Green Gradient Canvas (#022c22 -> #052e16 -> #064e3b)
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#022c22');
      bg.addColorStop(0.42, '#052e16');
      bg.addColorStop(0.75, '#064e3b');
      bg.addColorStop(1, '#022c22');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const radialLime = ctx.createRadialGradient(420, 320, 30, 420, 320, 900);
      radialLime.addColorStop(0, 'rgba(163, 230, 53, 0.22)');
      radialLime.addColorStop(1, 'rgba(2, 44, 34, 0)');
      ctx.fillStyle = radialLime;
      ctx.fillRect(0, 0, W, H);

      const radialGold = ctx.createRadialGradient(2000, 1380, 30, 2000, 1380, 850);
      radialGold.addColorStop(0, 'rgba(234, 179, 8, 0.18)');
      radialGold.addColorStop(1, 'rgba(2, 44, 34, 0)');
      ctx.fillStyle = radialGold;
      ctx.fillRect(0, 0, W, H);

      // 2. Category Lime / Golden-Green Vector Pattern
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.10)';
      ctx.lineWidth = 2;
      for (let gx = 80; gx < W; gx += 150) {
        for (let gy = 80; gy < H; gy += 150) {
          ctx.beginPath();
          ctx.arc(gx, gy, 58, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. Ornate Golden-Green & Lime Borders
      ctx.strokeStyle = '#a3b828';
      ctx.lineWidth = 8;
      ctx.strokeRect(56, 56, W - 112, H - 112);

      ctx.strokeStyle = 'rgba(190, 242, 100, 0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(86, 86, W - 172, H - 172);

      ctx.strokeStyle = 'rgba(202, 138, 4, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(108, 108, W - 216, H - 216);

      // Corner Lime Brackets
      ctx.strokeStyle = '#d9f99d';
      ctx.lineWidth = 7;
      const bLen = 64;
      [
        [108, 108, 1, 1],
        [W - 108, 108, -1, 1],
        [108, H - 108, 1, -1],
        [W - 108, H - 108, -1, -1],
      ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * bLen);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * bLen, cy);
        ctx.stroke();
      });

      // 4. Load & Draw Tsoaela Official Emblem (aspect-preserving inside crisp white badge)
      const logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = TAI_ONE_LOGO_URL;
      });

      let headerOffsetX = 164;
      if (logoImg) {
        const boxW = 248;
        const boxH = 144;
        const boxX = 164;
        const boxY = 166;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 18);
        ctx.fill();
        ctx.strokeStyle = '#bef264';
        ctx.lineWidth = 4;
        ctx.stroke();

        const fitted = getFittedLogoSize(boxW - 18, boxH - 18);
        const drawX = boxX + (boxW - fitted.width) / 2;
        const drawY = boxY + (boxH - fitted.height) / 2;
        ctx.drawImage(logoImg, drawX, drawY, fitted.width, fitted.height);
        ctx.restore();
        headerOffsetX = boxX + boxW + 32;
      }

      // 5. Header Lockup
      const safeAccreditor = certificate.accreditor;
      const hx = headerOffsetX;
      ctx.fillStyle = '#bef264';
      ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText('TTG - TSOAELA TRAINING GROUND PLATFORM', hx, 204);

      ctx.fillStyle = '#fefce8';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(safeAccreditor, hx, 250);

      ctx.fillStyle = '#a3e635';
      ctx.font = '600 24px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`Category: ${certificate.categoryKey}`, hx, 290);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#bef264';
      ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(isEarned ? accreditedTierBadge : `COMPLETION: ${progressPercent}%`, W - 168, 224);
      ctx.fillStyle = '#d9f99d';
      ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`SERIAL: ${serialNumber}`, W - 168, 266);
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(132, 204, 22, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(164, 344);
      ctx.lineTo(W - 164, 344);
      ctx.stroke();

      // 6. Centerpiece
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d9f99d';
      ctx.font = 'bold 28px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(certificate.distinctionLabel, W / 2, 430);

      const titleGrad = ctx.createLinearGradient(500, 480, 1900, 560);
      titleGrad.addColorStop(0, '#fef9c3');
      titleGrad.addColorStop(0.5, '#bef264');
      titleGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = titleGrad;
      ctx.font = '800 66px system-ui, -apple-system, sans-serif';
      ctx.fillText(certificate.credentialTitle, W / 2, 520, W - 360);

      ctx.fillStyle = '#d9f99d';
      ctx.font = '400 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        isExternalAccredited
          ? 'This accredited external Tai-One W3C credential certifies mastery by'
          : 'This accredited internal institutional credential certifies mastery by',
        W / 2,
        608
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 92px system-ui, -apple-system, sans-serif';
      ctx.fillText(recipientName, W / 2, 725, W - 400);

      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 360, 760);
      ctx.lineTo(W / 2 + 360, 760);
      ctx.stroke();

      ctx.fillStyle = '#ecfccb';
      ctx.font = '700 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(`For completing self-paced study in ${courseTitle}`, W / 2, 835, W - 360);
      ctx.textAlign = 'left';

      // 7. Competency Cards
      const comps = certificate.competencies.slice(0, 3);
      const boxW = 630;
      const gap = 50;
      const sx = (W - (boxW * comps.length + gap * Math.max(0, comps.length - 1))) / 2;
      comps.forEach((comp, idx) => {
        const bx = sx + idx * (boxW + gap);
        ctx.fillStyle = 'rgba(2, 44, 34, 0.88)';
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.fillRect(bx, 945, boxW, 225);
        ctx.strokeRect(bx, 945, boxW, 225);

        ctx.fillStyle = '#a3e635';
        ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`0${idx + 1} COMPETENCY`, bx + 32, 998);

        ctx.fillStyle = '#ecfccb';
        ctx.font = '500 26px system-ui, -apple-system, sans-serif';
        const words = comp.split(/\s+/);
        let line = '';
        let ly = 1052;
        words.forEach((word) => {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > boxW - 64 && line) {
            ctx.fillText(line, bx + 32, ly);
            line = word;
            ly += 36;
          } else {
            line = test;
          }
        });
        if (line) ctx.fillText(line, bx + 32, ly);
      });

      // 8. Footer Seal & Dates
      ctx.strokeStyle = 'rgba(132, 204, 22, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(164, 1280);
      ctx.lineTo(W - 164, 1280);
      ctx.stroke();

      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`ISSUE DATE: ${issueDate.toUpperCase()}`, 164, 1368);

      ctx.fillStyle = '#d9f99d';
      ctx.font = '400 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        quizScore !== undefined
          ? `Assessment Score Verified: ${quizScore}% · Texture: ${certificate.accentTone}`
          : `Texture Profile: ${certificate.accentTone}`,
        164,
        1414
      );

      // Seal on bottom-right
      const sealX = W - 245;
      const sealY = 1388;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 88, 0, Math.PI * 2);
      ctx.fillStyle = '#84cc16';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sealX, sealY, 72, 0, Math.PI * 2);
      ctx.fillStyle = '#022c22';
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#bef264';
      ctx.font = 'bold 22px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(isExternalAccredited ? 'TAI-ONE' : 'TTG BOARD', sealX, sealY - 4);
      ctx.fillText(isExternalAccredited ? 'W3C EXT' : 'ACCRED', sealX, sealY + 26);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(certificate.sealTitle, sealX - 116, sealY - 6);
      ctx.fillStyle = '#bef264';
      ctx.font = '500 22px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(accreditedSubline, sealX - 116, sealY + 34);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      const safeFile = courseTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 42);
      link.href = canvas.toDataURL('image/png');
      link.download = `TTG_Certificate_HD_${safeFile}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isEarned) return;
    setIsGeneratingPdf(true);
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageW = 297;
      const pageH = 210;

      // 1. Deep Dark Green Background Canvas
      doc.setFillColor(2, 44, 34); // #022c22
      doc.rect(0, 0, pageW, pageH, 'F');

      // Subtle darker emerald inner plate
      doc.setFillColor(5, 46, 22); // #052e16
      doc.roundedRect(8, 8, pageW - 16, pageH - 16, 4, 4, 'F');

      // 2. Category Lime/Golden-Green Geometric Texture Lines (Subtle vector filigree)
      doc.setDrawColor(101, 163, 13); // #65a30d Olive Green
      doc.setLineWidth(0.15);
      for (let x = 18; x < pageW - 18; x += 28) {
        doc.circle(x, 24, 14, 'S');
        doc.circle(x, pageH - 24, 14, 'S');
      }

      // Inner dark emerald content shield
      doc.setFillColor(4, 38, 28);
      doc.roundedRect(14, 14, pageW - 28, pageH - 28, 3, 3, 'F');

      // 3. Layered Golden-Green & Lime Ornate Borders
      doc.setDrawColor(163, 184, 40); // Golden Green
      doc.setLineWidth(1.4);
      doc.roundedRect(10, 10, pageW - 20, pageH - 20, 4, 4, 'S');

      doc.setDrawColor(190, 242, 100); // Luminous Lime (#bef264)
      doc.setLineWidth(0.45);
      doc.roundedRect(14, 14, pageW - 28, pageH - 28, 3, 3, 'S');

      doc.setDrawColor(202, 138, 4); // Metallic Gold-Green Accent (#ca8a04)
      doc.setLineWidth(0.35);
      doc.roundedRect(17, 17, pageW - 34, pageH - 34, 2, 2, 'S');

      // Corner Accent Brackets in Bright Lime
      doc.setDrawColor(163, 230, 53); // #a3e635
      doc.setLineWidth(1.0);
      const b = 10;
      // Top-left
      doc.line(17, 17 + b, 17, 17);
      doc.line(17, 17, 17 + b, 17);
      // Top-right
      doc.line(pageW - 17 - b, 17, pageW - 17, 17);
      doc.line(pageW - 17, 17, pageW - 17, 17 + b);
      // Bottom-left
      doc.line(17, pageH - 17 - b, 17, pageH - 17);
      doc.line(17, pageH - 17, 17 + b, pageH - 17);
      // Bottom-right
      doc.line(pageW - 17 - b, pageH - 17, pageW - 17, pageH - 17);
      doc.line(pageW - 17, pageH - 17 - b, pageW - 17, pageH - 17);

      // 4. Embedded Tsoaela Official Logo Crest (aspect-preserving inside crisp white badge)
      let pdfHeaderX = 24;
      if (logoDataUrl) {
        const badgeX = 24;
        const badgeY = 23;
        const badgeW = 42;
        const badgeH = 24;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(190, 242, 100);
        doc.setLineWidth(0.6);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2.5, 2.5, 'FD');
        const fitted = getFittedLogoSize(badgeW - 3, badgeH - 3);
        doc.addImage(
          logoDataUrl,
          'JPEG',
          badgeX + (badgeW - fitted.width) / 2,
          badgeY + (badgeH - fitted.height) / 2,
          fitted.width,
          fitted.height
        );
        pdfHeaderX = badgeX + badgeW + 6;
      }

      // 5. Header Text Lockup
      const safePdfAccreditor = certificate.accreditor;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(190, 242, 100); // #bef264
      doc.text('TTG - TSOAELA TRAINING GROUND PLATFORM', pdfHeaderX, 30);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(254, 252, 232);
      doc.text(safePdfAccreditor.toUpperCase(), pdfHeaderX, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(163, 230, 53);
      doc.text(`Category Track: ${certificate.categoryKey}`, pdfHeaderX, 42);

      // Serial & Status Top-Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(217, 249, 157);
      doc.text(`SERIAL: ${serialNumber}`, pageW - 24, 30, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(163, 230, 53);
      doc.text(
        isEarned ? accreditedTierBadge : `COURSE COMPLETION: ${progressPercent}%`,
        pageW - 24,
        36,
        { align: 'right' }
      );

      // Divider rule
      doc.setDrawColor(132, 204, 22);
      doc.setLineWidth(0.3);
      doc.line(24, 52, pageW - 24, 52);

      // 6. Central Distinction & Credential Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(217, 249, 157);
      doc.text(certificate.distinctionLabel, pageW / 2, 64, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(234, 179, 8); // Rich Golden-Yellow Green Glow
      doc.text(certificate.credentialTitle, pageW / 2, 76, { align: 'center', maxWidth: 240 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(217, 249, 157);
      doc.text(
        isExternalAccredited
          ? 'This accredited external Tai-One W3C credential certifies study mastery by'
          : 'This accredited internal institutional credential certifies study mastery by',
        pageW / 2,
        91,
        { align: 'center' }
      );

      // Recipient Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(recipientName, pageW / 2, 106, { align: 'center' });

      // Lime signature rule under name
      doc.setDrawColor(163, 230, 53);
      doc.setLineWidth(0.6);
      doc.line(pageW / 2 - 55, 110, pageW / 2 + 55, 110);

      // Course Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(190, 242, 100);
      doc.text(`For completing self-paced study in: ${courseTitle}`, pageW / 2, 120, {
        align: 'center',
        maxWidth: 235,
      });

      // 7. Three Competency Boxes
      const comps = certificate.competencies.slice(0, 3);
      const boxW = 78;
      const gap = 7;
      const startX = (pageW - (boxW * comps.length + gap * Math.max(0, comps.length - 1))) / 2;
      comps.forEach((comp, idx) => {
        const bx = startX + idx * (boxW + gap);
        doc.setFillColor(2, 44, 34);
        doc.setDrawColor(132, 204, 22);
        doc.setLineWidth(0.35);
        doc.roundedRect(bx, 131, boxW, 24, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(163, 230, 53);
        doc.text(`COMPETENCY 0${idx + 1}`, bx + 4, 137);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(236, 252, 203);
        doc.text(comp, bx + 4, 143, { maxWidth: boxW - 8 });
      });

      // 8. Footer Signatures & Golden-Green Seal Emblem
      doc.setDrawColor(132, 204, 22);
      doc.setLineWidth(0.3);
      doc.line(24, 166, pageW - 24, 166);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(190, 242, 100);
      doc.text(`ISSUED: ${issueDate.toUpperCase()}`, 26, 175);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(217, 249, 157);
      doc.text(
        quizScore !== undefined
          ? `Assessment Score Verified: ${quizScore}% · Design: ${certificate.accentTone}`
          : `Design Profile: Golden Green / Dark Green / Lime (${certificate.accentTone})`,
        26,
        182
      );

      // Seal Circle on Bottom Right
      doc.setFillColor(163, 184, 40);
      doc.circle(pageW - 36, 179, 11, 'F');
      doc.setFillColor(2, 44, 34);
      doc.circle(pageW - 36, 179, 8.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(190, 242, 100);
      doc.text(isExternalAccredited ? 'TAI-ONE' : 'TTG', pageW - 36, 178, { align: 'center' });
      doc.text(isExternalAccredited ? 'W3C EXT' : 'ACCRED', pageW - 36, 182, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(254, 240, 138);
      doc.text(certificate.sealTitle, pageW - 52, 176, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(163, 230, 53);
      doc.text(accreditedSubline, pageW - 52, 182, {
        align: 'right',
      });

      const safeFile = courseTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 42);
      doc.save(`TTG_Certificate_${safeFile}_${serialNumber}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className={`relative w-full ${isHighResView ? 'max-w-6xl' : 'max-w-4xl'} bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-[#84cc16]/40 overflow-hidden z-10 flex flex-col max-h-[94vh] transition-all`}>
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-[#022c22] text-[#ecfccb] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#064e3b] border border-[#84cc16]/60 text-[#bef264]">
              {isEarned ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5 text-[#eab308]" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#a3e635]">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isEarned
                    ? `Verified Credential · ${certificate.categoryKey}`
                    : `Locked Certification Template · ${certificate.categoryKey}`}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isEarned
                  ? `Certificate — ${certificate.credentialTitle}`
                  : `Template Preview — ${certificate.credentialTitle}`}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHighResView((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[#064e3b] hover:bg-[#065f46] text-[#d9f99d] text-xs font-semibold border border-[#84cc16]/40 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Toggle high-resolution expanded view"
            >
              {isHighResView ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isHighResView ? 'Standard Fit' : 'High-Res View'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isEarned) window.print();
              }}
              disabled={!isEarned}
              title={isEarned ? 'Print certificate' : 'Locked until 100% completion or 70%+ quiz score'}
              className="px-3 py-1.5 rounded-lg bg-[#064e3b] hover:bg-[#065f46] text-[#d9f99d] text-xs font-semibold border border-[#84cc16]/40 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {isEarned ? <Printer className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHighResPng}
              disabled={!isEarned || isGeneratingPng}
              title={isEarned ? 'Download HD PNG' : 'Locked until course completion'}
              className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] text-xs font-bold border border-[#a3e635]/60 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {isEarned ? <ImageIcon className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{!isEarned ? 'HD PNG Locked' : isGeneratingPng ? 'Rendering HD...' : 'Download HD PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!isEarned || isGeneratingPdf}
              title={isEarned ? 'Download Certificate PDF' : 'Locked until course completion'}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#84cc16] to-[#ca8a04] hover:brightness-110 text-[#022c22] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {isEarned ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{!isEarned ? 'PDF Locked' : isGeneratingPdf ? 'Exporting PDF...' : 'Download Certificate PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#d9f99d]/80 hover:text-white hover:bg-[#064e3b] transition-colors cursor-pointer"
              aria-label="Close certificate preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Locked Template Notice */}
        {!isEarned && (
          <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800/70 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Preview Locked (Certification Template Only):</strong> You are viewing a sample certification template ({progressPercent}% completed). Complete 100% of course modules or pass an assessment (70%+) to unlock your personalized serial number, PNG, and PDF exports.
            </span>
          </div>
        )}

        {/* Certificate Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-stone-950 space-y-4">
          <div className={isHighResView ? 'min-w-[820px]' : ''}>
            <CourseCertificateCard
              certificate={certificate}
              courseTitle={courseTitle}
              recipientName={recipientName}
              serialNumber={serialNumber}
              issueDate={issueDate}
              progressPercent={progressPercent}
              quizScore={quizScore}
              isEarned={isEarned}
            />
          </div>

          {isEarned && (
            <CertificateVerificationBadge
              serialNumber={serialNumber}
              credentialTitle={certificate.credentialTitle}
              recipientName={recipientName}
              issueDate={issueDate}
              accreditor={certificate.accreditor}
              accreditationTier={certificate.accreditationTier}
              onVerifyOnline={
                onVerifyOnline
                  ? (serial) => {
                      onClose();
                      onVerifyOnline(serial);
                    }
                  : undefined
              }
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            {isEarned ? (
              <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
            ) : (
              <Lock className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {isEarned ? (
                <>
                  <strong className="text-stone-800 dark:text-stone-200">
                    {isExternalAccredited ? 'Accredited External · Tai-One W3C' : 'Accredited Internal · TTG Board'}
                  </strong>{' '}
                  · {certificate.w3cStandard || 'W3C Verifiable Credentials & Open Badges 3.0 Ledger'}
                </>
              ) : (
                <>
                  <strong className="text-stone-800 dark:text-stone-200">Template Mode Only</strong> · Personalized credential serial &amp; downloads remain locked until completion requirements are met
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {isEarned && onVerifyOnline && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerifyOnline(serialNumber);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Online</span>
              </button>
            )}
            {onAppealRecord && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAppealRecord(serialNumber);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Appeal Record</span>
              </button>
            )}
            <span className="font-mono text-[11px] tabular-nums">
              {isEarned ? serialNumber : 'TTG-TEMPLATE-LOCKED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
