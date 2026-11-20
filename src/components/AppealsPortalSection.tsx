import React, { useEffect, useState } from 'react';
import {
  FileText,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Scale,
} from 'lucide-react';
import {
  AppealCategory,
  AppealStatus,
  LearnerAppealRecord,
  StudyGuide,
  UserProfile,
} from '../types';

export interface AppealsPortalSectionProps {
  user: UserProfile;
  isAuthenticated: boolean;
  studyGuides: StudyGuide[];
  initialCourseId?: string | null;
  initialCourseTitle?: string | null;
  initialSerialNumber?: string | null;
  onAppealSubmitted?: (appeal: LearnerAppealRecord) => void;
  onRequireAuth?: (action: () => void, message: string) => void;
  onVerifySerial?: (serial: string) => void;
}

const APPEAL_CATEGORIES: AppealCategory[] = [
  'Grade & Assessment Dispute',
  'Certificate Verification Dispute',
  'External Regulatory Escalation',
  'Completion Credit Discrepancy',
];

function getAppealStatusDisplay(status: AppealStatus) {
  switch (status) {
    case 'Resolved - Approved':
      return {
        symbol: '●',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        surfaceClass:
          'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/60 dark:bg-emerald-950/30',
      };
    case 'Resolved - Upheld':
      return {
        symbol: '●',
        textClass: 'text-stone-700 dark:text-stone-300',
        surfaceClass:
          'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60',
      };
    case 'Under Moderator Review':
      return {
        symbol: '◐',
        textClass: 'text-amber-700 dark:text-amber-400',
        surfaceClass:
          'border-amber-200 dark:border-amber-800/70 bg-amber-50/60 dark:bg-amber-950/30',
      };
    case 'Submitted':
    default:
      return {
        symbol: '○',
        textClass: 'text-blue-700 dark:text-blue-400',
        surfaceClass:
          'border-blue-200 dark:border-blue-800/70 bg-blue-50/60 dark:bg-blue-950/30',
      };
  }
}

export const AppealsPortalSection: React.FC<AppealsPortalSectionProps> = ({
  user,
  isAuthenticated,
  studyGuides,
  initialCourseId,
  initialCourseTitle,
  initialSerialNumber,
  onAppealSubmitted,
  onRequireAuth,
  onVerifySerial,
}) => {
  const [appeals, setAppeals] = useState<LearnerAppealRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAllQueue, setShowAllQueue] = useState<boolean>(false);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || studyGuides[0]?.id || ''
  );
  const [customCourseTitle, setCustomCourseTitle] = useState<string>(
    initialCourseTitle || ''
  );
  const [certificateSerial, setCertificateSerial] = useState<string>(
    initialSerialNumber || ''
  );
  const [category, setCategory] = useState<AppealCategory>(
    initialSerialNumber
      ? 'Certificate Verification Dispute'
      : 'Grade & Assessment Dispute'
  );
  const [subject, setSubject] = useState<string>('');
  const [statement, setStatement] = useState<string>('');
  const [evidenceSummary, setEvidenceSummary] = useState<string>('');
  const [requestedResolution, setRequestedResolution] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourseId) setSelectedCourseId(initialCourseId);
    if (initialCourseTitle) setCustomCourseTitle(initialCourseTitle);
    if (initialSerialNumber !== undefined && initialSerialNumber !== null) {
      setCertificateSerial(initialSerialNumber);
      if (initialSerialNumber.trim()) {
        setCategory('Certificate Verification Dispute');
      }
    }
  }, [initialCourseId, initialCourseTitle, initialSerialNumber]);

  const fetchAppeals = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const query = showAllQueue
        ? ''
        : `?userId=${encodeURIComponent(user.id || 'user_88219')}`;
      const res = await fetch(`/api/appeals${query}`);
      if (!res.ok) throw new Error('Unable to load appeals queue.');
      const data = (await res.json()) as { appeals?: LearnerAppealRecord[] };
      setAppeals(Array.isArray(data.appeals) ? data.appeals : []);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load appeals history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAppeals();
  }, [showAllQueue, user.id]);

  const submitAppealPayload = async () => {
    const matchedGuide = studyGuides.find((g) => g.id === selectedCourseId);
    const resolvedCourseTitle =
      matchedGuide?.title || customCourseTitle.trim() || 'Platform Study Guide';

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || 'user_88219',
          appellantName: user.name || 'Academic Scholar',
          appellantEmail: user.email || 'scholar@ttg-platform.local',
          courseId: selectedCourseId || 'general_course',
          courseTitle: resolvedCourseTitle,
          certificateSerial: certificateSerial.trim() || undefined,
          category,
          subject: subject.trim(),
          statement: statement.trim(),
          evidenceSummary:
            evidenceSummary.trim() ||
            'Platform chapter logs, notes, and assessment history.',
          requestedResolution:
            requestedResolution.trim() ||
            'Faculty Moderator review and formal status update.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not submit appeal.');
      }

      const created = data.appeal as LearnerAppealRecord;
      setAppeals((prev) => [created, ...prev]);
      setSubject('');
      setStatement('');
      setEvidenceSummary('');
      setRequestedResolution('');
      setSubmitMessage(
        `Appeal ${created.id} submitted. Target Faculty Moderator review SLA: ${created.slaDueDate}.`
      );
      onAppealSubmitted?.(created);
    } catch (err: any) {
      setSubmitError(err?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !statement.trim()) {
      setSubmitError('Please provide an appeal subject and a clear factual statement.');
      return;
    }

    if (!isAuthenticated && onRequireAuth) {
      onRequireAuth(
        () => void submitAppealPayload(),
        'Sign in to submit an official assessment or certificate verification appeal.'
      );
      return;
    }

    void submitAppealPayload();
  };

  return (
    <section
      id="learner-appeals-section"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Quality Management Governance · Learner Appeals &amp; Escalations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Assessment &amp; Verification Appeals Desk
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-2xl">
            Submit formal disputes for rubric re-moderation, completion credit discrepancies, or certificate verification holds. Appeals enter the Faculty Moderator queue with a 5-day SLA target.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setShowAllQueue(false)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                !showAllQueue
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              My Appeals
            </button>
            <button
              type="button"
              onClick={() => setShowAllQueue(true)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                showAllQueue
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Public Case Log
            </button>
          </div>
          <button
            type="button"
            onClick={() => void fetchAppeals()}
            className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
            title="Refresh appeals queue"
            aria-label="Refresh appeals queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Submit New Appeal Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-500" />
            <span>File a Formal Appeal</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Appeal Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppealCategory)}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {APPEAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Course / Study Guide
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const found = studyGuides.find((g) => g.id === e.target.value);
                  if (found) setCustomCourseTitle(found.title);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {studyGuides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.title}
                  </option>
                ))}
                <option value="other_program">Other / Custom Credential Reference</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Certificate Serial Number (Optional)
              </label>
              <input
                type="text"
                value={certificateSerial}
                onChange={(e) => setCertificateSerial(e.target.value)}
                placeholder="e.g. TTG-AI-2026-88219-EARCH"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Appeal Subject <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Concise summary of the grading or verification issue"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Factual Grounds &amp; Statement <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Describe the assessment question, rubric step, or ledger record being appealed..."
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Supporting Evidence Reference
              </label>
              <input
                type="text"
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                placeholder="Quiz attempt ID, chapter notes timestamp, or assignment ref"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Requested Outcome
              </label>
              <input
                type="text"
                value={requestedResolution}
                onChange={(e) => setRequestedResolution(e.target.value)}
                placeholder="e.g. Manual rubric re-grade or ledger verification update"
                className="w-full px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitMessage && (
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/50 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting Appeal…' : 'Submit Formal Appeal'}</span>
          </button>
        </form>

        {/* Right: Appeals Status Tracker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Submitted Appeals &amp; Resolution Tracker ({appeals.length})
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              5-Business-Day SLA
            </span>
          </div>

          {loadError ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
              {loadError}
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-28 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 animate-pulse"
                />
              ))}
            </div>
          ) : appeals.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-2 text-xs text-stone-500 dark:text-stone-400">
              <p className="font-semibold text-stone-700 dark:text-stone-300">
                No active appeals filed under your account
              </p>
              <p>
                Use the appeal form alongside any assessment or verification record to initiate a formal Faculty Moderator review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => {
                const statusMeta = getAppealStatusDisplay(appeal.status);
                return (
                  <article
                    key={appeal.id}
                    className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {appeal.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{appeal.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>SLA {appeal.slaDueDate}</span>
                      </div>

                      <span
                        className={`text-xs font-bold inline-flex items-center gap-1.5 ${statusMeta.textClass}`}
                      >
                        <span aria-hidden="true">{statusMeta.symbol}</span>
                        <span>{appeal.status}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {appeal.subject}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {appeal.courseTitle} · Filed by {appeal.appellantName} on{' '}
                        {new Date(appeal.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {appeal.statement}
                    </p>

                    {appeal.certificateSerial && (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                          Linked Serial: {appeal.certificateSerial}
                        </span>
                        {onVerifySerial && (
                          <button
                            type="button"
                            onClick={() => onVerifySerial(appeal.certificateSerial!)}
                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Inspect in Verification Ledger →
                          </button>
                        )}
                      </div>
                    )}

                    {appeal.moderatorNotes && (
                      <div className={`p-3 rounded-lg border text-xs ${statusMeta.surfaceClass}`}>
                        <span className="font-semibold block text-stone-900 dark:text-stone-100 mb-0.5">
                          Moderator Decision / Review Note
                          {appeal.reviewedBy ? ` (${appeal.reviewedBy})` : ''}
                        </span>
                        <span className="text-stone-700 dark:text-stone-300">
                          {appeal.moderatorNotes}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
