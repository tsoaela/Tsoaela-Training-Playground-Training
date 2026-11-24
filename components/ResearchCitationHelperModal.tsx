import React, { useState, useMemo, useEffect } from 'react';
import { ResearchPaper } from '../types';
import {
  X,
  Copy,
  Check,
  Quote,
  Sparkles,
  FileText,
  BookMarked,
  CheckCircle2,
} from 'lucide-react';

export type CitationFormat = 'APA' | 'MLA' | 'Harvard';

interface ResearchCitationHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  researchPapers: ResearchPaper[];
  initialPaper?: ResearchPaper | null;
  researchMessages: Array<{ sender: 'user' | 'agent'; text: string }>;
  initialSynthesisText?: string | null;
}

const INSTITUTION_KEYWORDS = [
  'group',
  'bureau',
  'consortium',
  'institute',
  'fellowship',
  'superagent',
  'labs',
  'committee',
  'council',
];

function formatSingleAuthorAPA(rawName: string): string {
  const clean = rawName.replace(/^(Dr\.|Prof\.|Eng\.)\s+/i, '').trim();
  const lower = clean.toLowerCase();
  if (INSTITUTION_KEYWORDS.some((kw) => lower.includes(kw)) || !clean.includes(' ')) {
    return clean;
  }
  const parts = clean.split(/\s+/);
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');
  return `${last}, ${initials}`;
}

function formatSingleAuthorMLA(rawName: string, isFirst: boolean): string {
  const clean = rawName.replace(/^(Dr\.|Prof\.|Eng\.)\s+/i, '').trim();
  const lower = clean.toLowerCase();
  if (INSTITUTION_KEYWORDS.some((kw) => lower.includes(kw)) || !clean.includes(' ')) {
    return clean;
  }
  if (!isFirst) return clean;
  const parts = clean.split(/\s+/);
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(' ');
  return `${last}, ${rest}`;
}

function formatAuthorsForStyle(authorField: string, style: CitationFormat): string {
  const authors = authorField
    .split(/,|&|\band\b/i)
    .map((a) => a.trim())
    .filter(Boolean);
  if (authors.length === 0) return 'TTG Quantitative Research Bureau';

  if (style === 'APA' || style === 'Harvard') {
    const formatted = authors.map(formatSingleAuthorAPA);
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) {
      return style === 'APA'
        ? `${formatted[0]}, & ${formatted[1]}`
        : `${formatted[0]} and ${formatted[1]}`;
    }
    return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
  }

  // MLA
  if (authors.length === 1) return formatSingleAuthorMLA(authors[0], true);
  if (authors.length === 2) {
    return `${formatSingleAuthorMLA(authors[0], true)}, and ${formatSingleAuthorMLA(authors[1], false)}`;
  }
  return `${formatSingleAuthorMLA(authors[0], true)}, et al.`;
}

function extractYearAndDisplayDate(dateStr: string): { year: string; fullDate: string } {
  const trimmed = (dateStr || '').trim();
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '2026';
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && trimmed.includes('-')) {
    return {
      year,
      fullDate: parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  }
  return { year, fullDate: trimmed || year };
}

function toSentenceCase(title: string): string {
  const clean = title.trim();
  if (!clean) return clean;
  const colonIdx = clean.indexOf(':');
  if (colonIdx > 0 && colonIdx < clean.length - 2) {
    const firstPart = clean.slice(0, colonIdx);
    const secondPart = clean.slice(colonIdx + 1).trim();
    return `${firstPart}: ${secondPart.charAt(0).toUpperCase()}${secondPart.slice(1)}`;
  }
  return clean;
}

export const ResearchCitationHelperModal: React.FC<ResearchCitationHelperModalProps> = ({
  isOpen,
  onClose,
  researchPapers,
  initialPaper = null,
  researchMessages,
  initialSynthesisText = null,
}) => {
  const agentSyntheses = useMemo(
    () =>
      researchMessages
        .filter((m) => m.sender === 'agent')
        .map((m, idx) => ({
          id: `synth_${idx}`,
          label:
            idx === 0
              ? 'Bureau Baseline Synthesis Briefing'
              : `Superagent Synthesis Briefing #${idx}`,
          text: m.text,
        })),
    [researchMessages]
  );

  const [sourceMode, setSourceMode] = useState<'paper' | 'superagent'>(
    initialSynthesisText ? 'superagent' : 'paper'
  );
  const [selectedPaperId, setSelectedPaperId] = useState<string>(
    initialPaper?.id || researchPapers[0]?.id || ''
  );
  const [selectedSynthesisIndex, setSelectedSynthesisIndex] = useState<number>(
    Math.max(0, agentSyntheses.length - 1)
  );
  const [activeFormatFilter, setActiveFormatFilter] = useState<'all' | CitationFormat>('all');
  const [includeSuperagentData, setIncludeSuperagentData] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialSynthesisText) {
      setSourceMode('superagent');
      const foundIdx = agentSyntheses.findIndex((s) => s.text === initialSynthesisText);
      if (foundIdx >= 0) setSelectedSynthesisIndex(foundIdx);
    } else if (initialPaper) {
      setSourceMode('paper');
      setSelectedPaperId(initialPaper.id);
    } else if (!selectedPaperId && researchPapers[0]) {
      setSelectedPaperId(researchPapers[0].id);
    }
  }, [isOpen, initialPaper, initialSynthesisText, researchPapers, agentSyntheses, selectedPaperId]);

  const selectedPaper = useMemo(
    () => researchPapers.find((p) => p.id === selectedPaperId) || researchPapers[0],
    [researchPapers, selectedPaperId]
  );

  const activeSynthesis = useMemo(() => {
    if (initialSynthesisText && sourceMode === 'superagent') {
      return agentSyntheses[selectedSynthesisIndex]?.text || initialSynthesisText;
    }
    return agentSyntheses[selectedSynthesisIndex]?.text || agentSyntheses[0]?.text || '';
  }, [agentSyntheses, selectedSynthesisIndex, initialSynthesisText, sourceMode]);

  const citations = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (sourceMode === 'superagent') {
      const firstLine =
        activeSynthesis
          .split('\n')[0]
          ?.replace(/[:]+$/, '')
          .trim() || 'Quantitative Dossier Empirical Synthesis';
      const url = 'https://tsoaelatrainingground.edu/research/ai-superagent';
      const year = String(new Date().getFullYear());
      const synthesisSummary = activeSynthesis.replace(/\s+/g, ' ').slice(0, 160).trim();

      return {
        APA: `TTG Quantitative Research Bureau. (${year}). ${firstLine} [Research Corner AI Superagent empirical synthesis]. Tsoaela Training Ground Platform. ${url}${
          includeSuperagentData && synthesisSummary ? `\nNote: ${synthesisSummary}...` : ''
        }`,
        MLA: `TTG Quantitative Research Bureau. "${firstLine}." Research Corner AI Superagent, Tsoaela Training Ground Platform, ${year}, ${url}.`,
        Harvard: `TTG Quantitative Research Bureau (${year}) '${firstLine}', Research Corner AI Superagent Empirical Briefing, Tsoaela Training Ground Platform. Available at: ${url} (Accessed: ${todayStr}).`,
      };
    }

    if (!selectedPaper) {
      return { APA: '', MLA: '', Harvard: '' };
    }

    const { year, fullDate } = extractYearAndDisplayDate(selectedPaper.publication_date);
    const publisher = selectedPaper.accreditor_name || 'TTG Quantitative Research Bureau';
    const dossierUrl = `https://tsoaelatrainingground.edu/research/${selectedPaper.id}`;
    const pageSpan = `pp. 1–${selectedPaper.pages}`;

    const metricsNote =
      selectedPaper.metric_summary.length > 0
        ? selectedPaper.metric_summary
            .map((m) => `${m.label}: ${m.value}${m.delta ? ` (${m.delta})` : ''}`)
            .join('; ')
        : '';

    const apaAuthors = formatAuthorsForStyle(selectedPaper.author, 'APA');
    const mlaAuthors = formatAuthorsForStyle(selectedPaper.author, 'MLA');
    const harvardAuthors = formatAuthorsForStyle(selectedPaper.author, 'Harvard');

    const superagentRefNote =
      includeSuperagentData && metricsNote
        ? ` [Verified Bureau Telemetry: ${metricsNote}]`
        : '';

    return {
      APA: `${apaAuthors} (${year}). ${toSentenceCase(selectedPaper.title)}. ${publisher}, ${selectedPaper.category} Research Dossier (${pageSpan}). ${dossierUrl}${superagentRefNote}`,
      MLA: `${mlaAuthors} "${selectedPaper.title}." ${publisher}, ${fullDate}, ${pageSpan}. Tsoaela Training Ground Digital Library, ${dossierUrl.replace('https://', '')}.`,
      Harvard: `${harvardAuthors} (${year}) '${selectedPaper.title}', ${publisher}, ${selectedPaper.category} Series, ${pageSpan}. Available at: ${dossierUrl} (Accessed: ${todayStr}).`,
    };
  }, [sourceMode, selectedPaper, activeSynthesis, includeSuperagentData]);

  if (!isOpen) return null;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const visibleFormats: CitationFormat[] =
    activeFormatFilter === 'all' ? ['APA', 'MLA', 'Harvard'] : [activeFormatFilter];

  const allCombinedText = `APA (7th Edition):\n${citations.APA}\n\nMLA (9th Edition):\n${citations.MLA}\n\nHarvard:\n${citations.Harvard}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Research Citation Helper
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Generate APA 7th, MLA 9th, and Harvard citations from Bureau papers &amp; AI Superagent syntheses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            aria-label="Close citation helper"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Source Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
              <button
                type="button"
                onClick={() => setSourceMode('paper')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  sourceMode === 'paper'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Research Paper</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('superagent')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  sourceMode === 'superagent'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Superagent Briefing</span>
              </button>
            </div>

            {/* Format Filter */}
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'APA', 'MLA', 'Harvard'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setActiveFormatFilter(fmt)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                    activeFormatFilter === fmt
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {fmt === 'all' ? 'All Formats' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Paper or Synthesis Selector */}
          {sourceMode === 'paper' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Select Research Dossier
              </label>
              <select
                value={selectedPaper?.id || ''}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {researchPapers.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} — {paper.author} ({paper.publication_date})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Select AI Superagent Synthesis Output
              </label>
              <select
                value={selectedSynthesisIndex}
                onChange={(e) => setSelectedSynthesisIndex(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {agentSyntheses.map((synth, idx) => (
                  <option key={synth.id} value={idx}>
                    {synth.label}: {synth.text.slice(0, 70)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Include Superagent Telemetry Option */}
          <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeSuperagentData}
              onChange={(e) => setIncludeSuperagentData(e.target.checked)}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Include Bureau empirical telemetry / superagent metrics annotation in APA citation</span>
          </label>

          {/* Citation Cards */}
          <div className="space-y-3">
            {visibleFormats.map((fmt) => {
              const citationText = citations[fmt];
              const isCopied = copiedKey === fmt;
              const editionLabel =
                fmt === 'APA'
                  ? 'APA (7th Edition)'
                  : fmt === 'MLA'
                  ? 'MLA (9th Edition)'
                  : 'Harvard Referencing';

              return (
                <div
                  key={fmt}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{editionLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fmt, citationText)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : `Copy ${fmt}`}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed select-all whitespace-pre-line font-serif">
                    {citationText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleCopy('ALL', allCombinedText)}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedKey === 'ALL' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedKey === 'ALL' ? 'Copied All Formats!' : 'Copy All 3 Formats'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
