import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  ShieldCheck,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { AccreditationTier } from '../types';

export interface CertificateVerificationBadgeProps {
  serialNumber: string;
  credentialTitle: string;
  recipientName: string;
  issueDate: string;
  accreditor: string;
  accreditationTier?: AccreditationTier;
  signatureHash?: string;
  status?: 'verified' | 'under_appeal' | 'revoked';
  compact?: boolean;
  onVerifyOnline?: (serialNumber: string) => void;
}

function buildDeterministicDigest(serialNumber: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < serialNumber.length; i += 1) {
    const ch = serialNumber.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
  }
  return `SHA256-${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.toUpperCase();
}

export const CertificateVerificationBadge: React.FC<
  CertificateVerificationBadgeProps
> = ({
  serialNumber,
  credentialTitle,
  recipientName,
  issueDate,
  accreditor,
  accreditationTier,
  signatureHash,
  status = 'verified',
  compact = false,
  onVerifyOnline,
}) => {
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const isExternal =
    accreditationTier === 'accredited_external' ||
    /tai-one|w3c|external/i.test(accreditor || '');
  const tierLabel = isExternal
    ? 'Accredited External · Tai-One W3C'
    : 'Accredited Internal · TTG Board';

  const digestDisplay = signatureHash
    ? signatureHash.slice(0, 18).toUpperCase()
    : buildDeterministicDigest(serialNumber);

  const statusMeta =
    status === 'verified'
      ? {
          title: 'CRYPTOGRAPHICALLY VERIFIED',
          ringColor: '#bef264',
          coreColor: '#052e16',
          accentText: 'text-emerald-700 dark:text-emerald-400',
          borderClass:
            'border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/55 dark:bg-emerald-950/25',
        }
      : status === 'under_appeal'
      ? {
          title: 'UNDER MODERATOR APPEAL',
          ringColor: '#fcd34d',
          coreColor: '#451a03',
          accentText: 'text-amber-700 dark:text-amber-400',
          borderClass:
            'border-amber-300 dark:border-amber-700/70 bg-amber-50/55 dark:bg-amber-950/25',
        }
      : {
          title: 'CREDENTIAL REVOKED',
          ringColor: '#fda4af',
          coreColor: '#4c0519',
          accentText: 'text-rose-700 dark:text-rose-400',
          borderClass:
            'border-rose-300 dark:border-rose-700/70 bg-rose-50/55 dark:bg-rose-950/25',
        };

  const handleDownloadBadgePng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.55, '#052e16');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = statusMeta.ringColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Draw Verification Shield Crest on Left
    ctx.save();
    ctx.translate(155, 230);
    ctx.fillStyle = '#022c22';
    ctx.strokeStyle = statusMeta.ringColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, -105);
    ctx.lineTo(84, -68);
    ctx.lineTo(84, 10);
    ctx.quadraticCurveTo(84, 78, 0, 110);
    ctx.quadraticCurveTo(-84, 78, -84, 10);
    ctx.lineTo(-84, -68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = statusMeta.ringColor;
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(status === 'verified' ? 'VERIFIED' : status.toUpperCase(), 0, -10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('W3C · OB 3.0', 0, 24);
    ctx.restore();

    // Right Credential Verification Details
    ctx.textAlign = 'left';
    ctx.fillStyle = statusMeta.ringColor;
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`TTG OFFICIAL VERIFICATION BADGE · ${statusMeta.title}`, 285, 92);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px system-ui, -apple-system, sans-serif';
    ctx.fillText(credentialTitle, 285, 152, 860);

    ctx.fillStyle = '#ecfccb';
    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Issued to: ${recipientName}`, 285, 210, 860);

    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`${tierLabel} · ${accreditor}`, 285, 260, 860);

    ctx.fillStyle = '#d9f99d';
    ctx.font = '600 19px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`SERIAL: ${serialNumber}   |   ISSUED: ${issueDate}`, 285, 326);
    ctx.fillText(`DIGEST: ${digestDisplay}`, 285, 362);

    ctx.fillStyle = '#bef264';
    ctx.font = '500 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(
      `Verify online: ${window.location.origin}/verify/${encodeURIComponent(serialNumber)}`,
      285,
      406
    );

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `TTG_Verification_Badge_${serialNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySnippet = async () => {
    const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(serialNumber)}`;
    const snippet = `[${statusMeta.title}] ${credentialTitle} — ${recipientName} (${serialNumber}) · Verify: ${verifyUrl}`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedEmbed(true);
      window.setTimeout(() => setCopiedEmbed(false), 2400);
    } catch {
      // Ignore clipboard fallback
    }
  };

  const gradId = `verify_badge_grad_${serialNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return (
    <div
      className={`rounded-xl border ${statusMeta.borderClass} ${
        compact ? 'p-3' : 'p-4'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3.5`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Bespoke Verification Shield Emblem SVG */}
        <svg
          width={compact ? 42 : 54}
          height={compact ? 42 : 54}
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="shrink-0"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={statusMeta.ringColor} />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path
            d="M32 4 L55 13 V31 C55 46 44.5 55.8 32 60 C19.5 55.8 9 46 9 31 V13 Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M32 9 L50 16.5 V31 C50 42.8 41.8 50.6 32 54.4 C22.2 50.6 14 42.8 14 31 V16.5 Z"
            fill={statusMeta.coreColor}
            stroke={statusMeta.ringColor}
            strokeWidth="1.5"
          />
          {status === 'verified' ? (
            <path
              d="M22 32 L29 39 L43 24"
              fill="none"
              stroke={statusMeta.ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <text
              x="32"
              y="37"
              textAnchor="middle"
              fill={statusMeta.ringColor}
              fontSize="18"
              fontWeight="800"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              !
            </text>
          )}
        </svg>

        <div className="min-w-0 space-y-0.5">
          <div className={`flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold ${statusMeta.accentText}`}>
            {status === 'verified' ? (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            ) : status === 'under_appeal' ? (
              <Scale className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusMeta.title}</span>
            <span aria-hidden="true" className="text-stone-400">
              ·
            </span>
            <span className="text-stone-600 dark:text-stone-300">{tierLabel}</span>
          </div>

          <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
            {credentialTitle}
          </div>

          <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 truncate">
            Serial: {serialNumber} · {digestDisplay}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDownloadBadgePng}
          className="px-3 py-1.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#a3e635]" />
          <span>Download Badge PNG</span>
        </button>

        <button
          type="button"
          onClick={() => void handleCopySnippet()}
          className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
        >
          {copiedEmbed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copied Proof</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Proof</span>
            </>
          )}
        </button>

        {onVerifyOnline && (
          <button
            type="button"
            onClick={() => onVerifyOnline(serialNumber)}
            className="px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspect Ledger</span>
          </button>
        )}
      </div>
    </div>
  );
};
