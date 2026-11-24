import React from 'react';
import {
  X,
  GitCompare,
  Clock,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Award,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  AcademicFaculty,
  AcademicQualificationLevel,
  buildApplicationPrefillForQualification,
  findQualificationWithFaculty,
  resolveQualificationLevelTag,
} from '../data/academicCatalog';
import { ApplicationPrefillData } from '../types';

interface ProgramComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedQualificationIds: string[];
  savedProgramIds: string[];
  onRemoveFromCompare: (qualificationId: string) => void;
  onClearAllCompare: () => void;
  onToggleSaveProgram: (qual: AcademicQualificationLevel, faculty?: AcademicFaculty) => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
}

export const ProgramComparisonModal: React.FC<ProgramComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedQualificationIds,
  savedProgramIds,
  onRemoveFromCompare,
  onClearAllCompare,
  onToggleSaveProgram,
  onApplyQualification,
}) => {
  if (!isOpen) return null;

  const entries = comparedQualificationIds
    .slice(0, 3)
    .map((id) => findQualificationWithFaculty(id))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare Academic Programs"
        className="relative w-full max-w-6xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-4 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-700 text-white shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                <span>Side-by-Side Comparison</span>
                <span aria-hidden="true">·</span>
                <span>{entries.length} of 3 Selected</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                Compare Academic Qualification Programs
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Compare duration, entry requirements, core modules, and progression paths across selected qualifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClearAllCompare}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {entries.length === 0 ? (
            <div className="py-12 px-6 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
              <GitCompare className="w-8 h-8 text-stone-400 mx-auto" />
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                No Programs Selected for Comparison
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Select up to three academic qualification cards in the directory using the &ldquo;Compare&rdquo; toggle to inspect their core modules, entry requirements, and durations side-by-side.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer"
              >
                Browse Qualification Cards
              </button>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Side-by-Side Comparison Matrix */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 align-top">
                      <th className="w-44 p-4 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-r border-stone-200 dark:border-stone-800">
                        Comparison Criteria
                      </th>
                      {entries.map(({ qualification, faculty }) => {
                        const levelTag = resolveQualificationLevelTag(qualification);
                        const isSaved = savedProgramIds.includes(qualification.id);
                        return (
                          <th
                            key={qualification.id}
                            className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800 font-normal"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${levelTag.badgeClassName}`}
                                >
                                  {levelTag.tagLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromCompare(qualification.id)}
                                  className="p-1 rounded-md text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
                                  title="Remove from comparison"
                                  aria-label={`Remove ${qualification.qualificationType} from comparison`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
                                  {faculty.filterKey} · {faculty.codePrefix}
                                </span>
                                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug mt-0.5">
                                  {qualification.qualificationType}
                                </h4>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                  {faculty.name}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleSaveProgram(qualification, faculty)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                    isSaved
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                                  }`}
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  ) : (
                                    <Bookmark className="w-3 h-3" />
                                  )}
                                  <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                                </button>

                                {onApplyQualification && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onApplyQualification(
                                        buildApplicationPrefillForQualification(qualification, faculty)
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Apply</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                      {entries.length < 3 && (
                        <th className="p-4 bg-stone-50/40 dark:bg-stone-950/30 font-normal align-middle text-center">
                          <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Program ({entries.length}/3)</span>
                          </button>
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                    {/* Duration & Credit Load */}
                    <tr className="align-top">
                      <td className="p-4 font-bold text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-950/60 border-r border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Duration &amp; Credits</span>
                        </div>
                      </td>
                      {entries.map(({ qualification }) => (
                        <td
                          key={`${qualification.id}_dur`}
                          className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800 space-y-1"
                        >
                          <div className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">
                            {qualification.typicalDuration}
                          </div>
                          <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                            {qualification.nqfCredits} · {qualification.level}
                          </div>
                        </td>
                      ))}
                      {entries.length < 3 && <td className="p-4 bg-stone-50/20 dark:bg-stone-950/20" />}
                    </tr>

                    {/* Entry Requirements */}
                    <tr className="align-top bg-amber-50/25 dark:bg-amber-950/10">
                      <td className="p-4 font-bold text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-950/60 border-r border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Entry Requirements</span>
                        </div>
                      </td>
                      {entries.map(({ qualification }) => (
                        <td
                          key={`${qualification.id}_entry`}
                          className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 leading-relaxed"
                        >
                          {qualification.entryRequirement}
                        </td>
                      ))}
                      {entries.length < 3 && <td className="p-4 bg-stone-50/20 dark:bg-stone-950/20" />}
                    </tr>

                    {/* Core Modules */}
                    <tr className="align-top">
                      <td className="p-4 font-bold text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-950/60 border-r border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Core Modules</span>
                        </div>
                      </td>
                      {entries.map(({ qualification, coreModules }) => (
                        <td
                          key={`${qualification.id}_mods`}
                          className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800"
                        >
                          <ul className="space-y-1.5">
                            {coreModules.map((mod) => (
                              <li
                                key={mod}
                                className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300 leading-snug"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{mod}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                      {entries.length < 3 && <td className="p-4 bg-stone-50/20 dark:bg-stone-950/20" />}
                    </tr>

                    {/* Academic Focus */}
                    <tr className="align-top">
                      <td className="p-4 font-bold text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-950/60 border-r border-stone-200 dark:border-stone-800">
                        <span>Academic Focus</span>
                      </td>
                      {entries.map(({ qualification }) => (
                        <td
                          key={`${qualification.id}_focus`}
                          className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 leading-relaxed"
                        >
                          {qualification.academicFocus}
                        </td>
                      ))}
                      {entries.length < 3 && <td className="p-4 bg-stone-50/20 dark:bg-stone-950/20" />}
                    </tr>

                    {/* Assessment & Progression */}
                    <tr className="align-top">
                      <td className="p-4 font-bold text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-950/60 border-r border-stone-200 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Assessment &amp; Progression</span>
                        </div>
                      </td>
                      {entries.map(({ qualification }) => (
                        <td
                          key={`${qualification.id}_prog`}
                          className="p-4 border-r last:border-r-0 border-stone-200 dark:border-stone-800 space-y-2 text-stone-600 dark:text-stone-400 leading-relaxed"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                              Assessment Format
                            </span>
                            <span>{qualification.assessmentFormat}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                              Career &amp; Academic Progression
                            </span>
                            <span className="text-stone-800 dark:text-stone-200 font-medium">
                              {qualification.progressionPath}
                            </span>
                          </div>
                        </td>
                      ))}
                      {entries.length < 3 && <td className="p-4 bg-stone-50/20 dark:bg-stone-950/20" />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Comparison Cards */}
              <div className="md:hidden space-y-4">
                {entries.map(({ qualification, faculty, coreModules }) => {
                  const levelTag = resolveQualificationLevelTag(qualification);
                  const isSaved = savedProgramIds.includes(qualification.id);

                  return (
                    <div
                      key={qualification.id}
                      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 p-4 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-200 dark:border-stone-800">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${levelTag.badgeClassName}`}
                            >
                              {levelTag.tagLabel}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400">
                              {faculty.filterKey}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {qualification.qualificationType}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {faculty.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCompare(qualification.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer shrink-0"
                          aria-label={`Remove ${qualification.qualificationType}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                          <span className="text-[10px] font-bold uppercase text-stone-500 block">
                            Duration
                          </span>
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                            {qualification.typicalDuration}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                          <span className="text-[10px] font-bold uppercase text-stone-500 block">
                            Credit Standard
                          </span>
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                            {qualification.nqfCredits}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                          Entry Requirements
                        </span>
                        <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                          {qualification.entryRequirement}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                          Core Modules
                        </span>
                        <ul className="space-y-1">
                          {coreModules.map((mod) => (
                            <li
                              key={mod}
                              className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleSaveProgram(qualification, faculty)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                            isSaved
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                        </button>
                        {onApplyQualification && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onApplyQualification(
                                buildApplicationPrefillForQualification(qualification, faculty)
                              );
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Apply Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-stone-500 dark:text-stone-400">
            Select up to 3 qualifications across any faculty to benchmark requirements and coursework.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 cursor-pointer"
          >
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};
