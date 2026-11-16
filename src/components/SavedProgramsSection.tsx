import React from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  GraduationCap,
  Trash2,
  ArrowUpRight,
  GitCompare,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { ApplicationPrefillData, SavedAcademicProgram } from '../types';
import {
  AcademicCategoryKey,
  buildApplicationPrefillForQualification,
  findQualificationWithFaculty,
  resolveQualificationLevelTag,
} from '../data/academicCatalog';

interface SavedProgramsSectionProps {
  savedPrograms: SavedAcademicProgram[];
  comparedProgramIds?: string[];
  onRemoveSavedProgram: (qualificationId: string) => void;
  onBrowseQualifications?: (category?: AcademicCategoryKey) => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  onToggleCompareProgram?: (qualificationId: string) => void;
  onOpenCompareModal?: () => void;
}

export const SavedProgramsSection: React.FC<SavedProgramsSectionProps> = ({
  savedPrograms,
  comparedProgramIds = [],
  onRemoveSavedProgram,
  onBrowseQualifications,
  onApplyQualification,
  onToggleCompareProgram,
  onOpenCompareModal,
}) => {
  return (
    <section
      id="my-saved-programs-section"
      className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Personal Curriculum Shortlist</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
              {savedPrograms.length} Saved {savedPrograms.length === 1 ? 'Program' : 'Programs'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            My Saved Programs
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
            Quickly retrieve bookmarked academic qualifications, compare modules side-by-side, or launch your admission application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {comparedProgramIds.length > 0 && onOpenCompareModal && (
            <button
              type="button"
              onClick={onOpenCompareModal}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Selected ({comparedProgramIds.length}/3)</span>
            </button>
          )}
          {onBrowseQualifications && (
            <button
              type="button"
              onClick={() => onBrowseQualifications()}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Browse Qualifications</span>
            </button>
          )}
        </div>
      </div>

      {savedPrograms.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950/40 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            No Saved Academic Programs Yet
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Click the Bookmark icon on any academic qualification card in the Education Platform Hub to save degree pathways here for quick access and comparison.
          </p>
          {onBrowseQualifications && (
            <button
              type="button"
              onClick={() => onBrowseQualifications()}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Explore Academic Qualifications
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedPrograms.map((saved) => {
            const levelTag = resolveQualificationLevelTag({
              id: saved.qualificationId,
              level: saved.level,
              qualificationType: saved.qualificationType,
            });
            const isCompared = comparedProgramIds.includes(saved.qualificationId);
            const liveLookup = findQualificationWithFaculty(saved.qualificationId);

            return (
              <div
                key={saved.qualificationId}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 p-5 flex flex-col justify-between gap-4 hover:border-amber-300 dark:hover:border-amber-700/70 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-sans font-bold uppercase tracking-wider ${levelTag.badgeClassName}`}
                      >
                        {levelTag.tagLabel}
                      </span>
                      <span className="font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        {saved.categoryKey}
                      </span>
                    </div>
                    <span className="text-stone-500 dark:text-stone-400 inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {saved.typicalDuration}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {saved.qualificationType}
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      {saved.facultyName} · {saved.nqfCredits}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                      Entry Requirement
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-snug">
                      {saved.entryRequirement}
                    </p>
                  </div>

                  {saved.coreModules.length > 0 && (
                    <div className="space-y-1 text-[11px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Key Core Modules
                      </span>
                      <ul className="space-y-1">
                        {saved.coreModules.slice(0, 2).map((mod) => (
                          <li
                            key={mod}
                            className="flex items-start gap-1.5 text-stone-600 dark:text-stone-300 leading-snug"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400 font-mono">
                    <span>Saved {new Date(saved.savedAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveSavedProgram(saved.qualificationId)}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1 font-sans font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {onBrowseQualifications && (
                      <button
                        type="button"
                        onClick={() => onBrowseQualifications(saved.categoryKey)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View in Hub</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}

                    {onToggleCompareProgram && (
                      <button
                        type="button"
                        onClick={() => onToggleCompareProgram(saved.qualificationId)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isCompared
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:border-purple-400'
                        }`}
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>{isCompared ? 'Selected' : 'Compare'}</span>
                      </button>
                    )}

                    {onApplyQualification && (
                      <button
                        type="button"
                        onClick={() => {
                          if (liveLookup) {
                            onApplyQualification(
                              buildApplicationPrefillForQualification(
                                liveLookup.qualification,
                                liveLookup.faculty
                              )
                            );
                          } else {
                            onApplyQualification({
                              category: 'course_educare',
                              facultyId: saved.facultyId,
                              statementNote: `Applying for ${saved.qualificationType} (${saved.typicalDuration}) under ${saved.facultyName}.`,
                            });
                          }
                        }}
                        className="ml-auto px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
