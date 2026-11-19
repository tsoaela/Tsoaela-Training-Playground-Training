import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Copy, CheckCircle2, Download, Link2 } from 'lucide-react';
import { StudyGuide } from '../types';

interface CourseQrShareModalProps {
  guide: StudyGuide | null;
  onClose: () => void;
}

export const CourseQrShareModal: React.FC<CourseQrShareModalProps> = ({
  guide,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareUrl = guide
    ? `${window.location.origin}/?course=${encodeURIComponent(guide.id)}`
    : '';

  useEffect(() => {
    setCopied(false);
  }, [guide?.id]);

  useEffect(() => {
    if (!guide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guide, onClose]);

  if (!guide) return null;

  const isLongTerm = guide.duration_type === 'long_term';
  const coursePriceZar = guide.course_price_zar || 145;

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const qrFilename = `TTG_Course_QR_${guide.id.replace(/[^a-zA-Z0-9_-]+/g, '_')}.png`;

  const handleDownloadQrPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = qrFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#052e16] text-white border-b border-[#84cc16]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-[#064e3b] border border-[#84cc16]/40 text-[#bef264] shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bef264] block">
                Share Study Guide
              </span>
              <h2
                id="course-qr-modal-title"
                className="text-sm font-bold text-white truncate"
              >
                Course QR Code
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR share dialog"
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Course Metadata Summary */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {guide.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {guide.chapters.length} Chapters
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isLongTerm ? `R${coursePriceZar} / Course` : 'Free Lessons'}
              </span>
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {guide.title}
            </h3>
          </div>

          {/* Scannable QR Code rendered via qrcode.react */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
            <div
              className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs"
              aria-label={`QR code pointing to ${guide.title}`}
            >
              <QRCodeCanvas
                ref={canvasRef}
                value={shareUrl}
                size={216}
                level="M"
                bgColor="#ffffff"
                fgColor="#052e16"
                includeMargin={true}
              />
            </div>
            <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 text-center max-w-xs">
              Peers can scan this code with any smartphone camera to open this Digital Educare study guide directly.
            </p>
          </div>

          {/* Direct Shareable URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="course-share-url-input"
              className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-stone-400" />
              <span>Course Direct URL</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="course-share-url-input"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="px-4 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Download QR (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
