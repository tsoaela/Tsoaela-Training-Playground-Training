import React, { useState, useMemo, useEffect } from 'react';
import {
  ACADEMIC_FACULTIES,
  ACADEMIC_CATEGORY_FILTERS,
  AcademicCategoryKey,
  AcademicFaculty,
  AcademicDepartment,
  AcademicQualificationLevel,
  buildIndividualProgramDetail,
  resolveQualificationCoreModules,
  resolveQualificationLevelTag,
  buildApplicationPrefillForQualification,
} from '../data/academicCatalog';
import { ApplicationPrefillData } from '../types';
import {
  Building2,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Search,
  Sparkles,
  BookOpen,
  Briefcase,
  Clock,
  CheckCircle2,
  X,
  Filter,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface AcademicDirectorySectionProps {
  selectedCategory?: 'all' | AcademicCategoryKey;
  onSelectCategory?: (category: 'all' | AcademicCategoryKey) => void;
  onOpenAccreditation?: () => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  onGenerateStudyGuide?: (topic: string) => void;
  onFilterCatalogByProgram?: (term: string) => void;
}

export const AcademicDirectorySection: React.FC<AcademicDirectorySectionProps> = ({
  selectedCategory: controlledCategory,
  onSelectCategory,
  onOpenAccreditation,
  onApplyQualification,
  onGenerateStudyGuide,
  onFilterCatalogByProgram,
}) => {
  const [internalCategory, setInternalCategory] = useState<'all' | AcademicCategoryKey>('all');
  const selectedCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | 'Undergraduate' | 'Postgraduate' | 'Doctoral'>('all');
  const [programSearch, setProgramSearch] = useState<string>('');
  const [qualificationSearch, setQualificationSearch] = useState<string>('');
  const [activeQuickViewKey, setActiveQuickViewKey] = useState<string | null>(null);
  const [expandedFacultyIds, setExpandedFacultyIds] = useState<string[]>(() =>
    ACADEMIC_FACULTIES.map((f) => f.id)
  );
  const [inspectedProgram, setInspectedProgram] = useState<{
    faculty: AcademicFaculty;
    department: AcademicDepartment;
    programName: string;
  } | null>(null);
  const [inspectedQualification, setInspectedQualification] =
    useState<AcademicQualificationLevel | null>(null);

  const normalizedQuery = programSearch.trim().toLowerCase();
  const normalizedQualQuery = qualificationSearch.trim().toLowerCase();

  useEffect(() => {
    if (!activeQuickViewKey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveQuickViewKey(null);
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-quickview-root]')) {
        setActiveQuickViewKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [activeQuickViewKey]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      const matchedFac = ACADEMIC_FACULTIES.find((f) => f.filterKey === selectedCategory);
      if (matchedFac) {
        setExpandedFacultyIds([matchedFac.id]);
      }
    } else {
      setExpandedFacultyIds(ACADEMIC_FACULTIES.map((f) => f.id));
    }
  }, [selectedCategory]);

  const toggleCategoryFilter = (cat: 'all' | AcademicCategoryKey) => {
    const next = selectedCategory === cat && cat !== 'all' ? 'all' : cat;
    if (onSelectCategory) {
      onSelectCategory(next);
    } else {
      setInternalCategory(next);
    }
  };

  const toggleFacultyCollapse = (facultyId: string) => {
    setExpandedFacultyIds((prev) =>
      prev.includes(facultyId) ? prev.filter((id) => id !== facultyId) : [...prev, facultyId]
    );
  };

  const expandAllVisible = () => {
    setExpandedFacultyIds(visibleFaculties.map((f) => f.id));
  };

  const collapseAllVisible = () => {
    setExpandedFacultyIds([]);
  };

  // Filter faculties, sub-fields, and qualifications by category + search query
  const visibleFaculties = useMemo(() => {
    const categoryFiltered =
      selectedCategory === 'all'
        ? ACADEMIC_FACULTIES
        : ACADEMIC_FACULTIES.filter((f) => f.filterKey === selectedCategory);

    if (!normalizedQuery) return categoryFiltered;

    return categoryFiltered
      .map((fac) => {
        const facultyMatches =
          fac.name.toLowerCase().includes(normalizedQuery) ||
          fac.filterKey.toLowerCase().includes(normalizedQuery) ||
          fac.description.toLowerCase().includes(normalizedQuery);

        const filteredDepts = fac.departments
          .map((dept) => {
            const deptMatches = dept.name.toLowerCase().includes(normalizedQuery);
            const matchedPrograms =
              facultyMatches || deptMatches
                ? dept.programs
                : dept.programs.filter((p) => p.toLowerCase().includes(normalizedQuery));
            return { ...dept, programs: matchedPrograms };
          })
          .filter((d) => d.programs.length > 0);

        const filteredQuals = facultyMatches
          ? fac.qualifications
          : fac.qualifications.filter(
              (q) =>
                q.qualificationType.toLowerCase().includes(normalizedQuery) ||
                q.level.toLowerCase().includes(normalizedQuery) ||
                q.academicFocus.toLowerCase().includes(normalizedQuery)
            );

        if (filteredDepts.length === 0 && filteredQuals.length === 0 && !facultyMatches) {
          return null;
        }

        return {
          ...fac,
          departments: filteredDepts.length > 0 ? filteredDepts : fac.departments,
          qualifications: filteredQuals.length > 0 ? filteredQuals : fac.qualifications,
        };
      })
      .filter((f): f is AcademicFaculty => f !== null);
  }, [selectedCategory, normalizedQuery]);

  // Flat list of qualifications filtered by active category, academic level, and qualification/program search bar
  const visibleQualifications = useMemo(() => {
    const categoryFaculties =
      selectedCategory === 'all'
        ? ACADEMIC_FACULTIES
        : ACADEMIC_FACULTIES.filter((f) => f.filterKey === selectedCategory);

    const allForCategories = categoryFaculties.flatMap((fac) => {
      const allFacultyPrograms = fac.departments.flatMap((d) => d.programs);
      const deptNames = fac.departments.map((d) => d.name);

      return fac.qualifications.map((q) => {
        const eligiblePrograms =
          q.level === 'Undergraduate'
            ? allFacultyPrograms.filter(
                (p) =>
                  !p.includes('PGCE') &&
                  !p.includes('Educational Leadership') &&
                  !p.includes('(BBA/MBA)')
              )
            : allFacultyPrograms;

        const coreModules = resolveQualificationCoreModules(q, fac);
        const matchedPrograms = normalizedQualQuery
          ? eligiblePrograms.filter((p) => p.toLowerCase().includes(normalizedQualQuery))
          : [];

        return {
          ...q,
          faculty: fac,
          facultyId: fac.id,
          facultyNumber: fac.number,
          facultyName: fac.name,
          categoryKey: fac.filterKey,
          coreModules,
          eligiblePrograms,
          deptNames,
          matchedPrograms,
        };
      });
    });

    const levelFiltered =
      selectedLevelFilter === 'all'
        ? allForCategories
        : allForCategories.filter((q) => q.level === selectedLevelFilter);

    const effectiveQuery = normalizedQualQuery || normalizedQuery;
    if (!effectiveQuery) return levelFiltered;

    return levelFiltered.filter((q) => {
      const matchesQualFields =
        q.qualificationType.toLowerCase().includes(effectiveQuery) ||
        q.level.toLowerCase().includes(effectiveQuery) ||
        q.academicFocus.toLowerCase().includes(effectiveQuery) ||
        q.entryRequirement.toLowerCase().includes(effectiveQuery) ||
        q.facultyName.toLowerCase().includes(effectiveQuery) ||
        q.categoryKey.toLowerCase().includes(effectiveQuery) ||
        q.nqfCredits.toLowerCase().includes(effectiveQuery) ||
        q.coreModules.some((m) => m.toLowerCase().includes(effectiveQuery)) ||
        q.deptNames.some((d) => d.toLowerCase().includes(effectiveQuery)) ||
        q.eligiblePrograms.some((p) => p.toLowerCase().includes(effectiveQuery));

      return matchesQualFields;
    });
  }, [selectedCategory, selectedLevelFilter, normalizedQualQuery, normalizedQuery]);

  const activeProgramDetail = useMemo(() => {
    if (!inspectedProgram) return null;
    return buildIndividualProgramDetail(
      inspectedProgram.faculty,
      inspectedProgram.department,
      inspectedProgram.programName
    );
  }, [inspectedProgram]);

  const renderQuickViewPopover = (
    qual: AcademicQualificationLevel,
    coreModules: string[],
    quickViewKey: string,
    faculty?: AcademicFaculty,
    preferredProgramName?: string
  ) => {
    if (activeQuickViewKey !== quickViewKey) return null;
    const levelTag = resolveQualificationLevelTag(qual);
    const canApply = Boolean(onApplyQualification || onOpenAccreditation);

    const handleQuickViewApply = () => {
      setActiveQuickViewKey(null);
      if (onApplyQualification) {
        onApplyQualification(
          buildApplicationPrefillForQualification(qual, faculty, preferredProgramName)
        );
      } else if (onOpenAccreditation) {
        onOpenAccreditation();
      }
    };

    return (
      <>
        <div
          className="sm:hidden fixed inset-0 bg-stone-950/40 z-40"
          onClick={() => setActiveQuickViewKey(null)}
        />
        <div
          role="dialog"
          aria-label={`Quick view for ${qual.qualificationType}`}
          className="fixed inset-x-4 bottom-4 sm:inset-auto sm:absolute sm:right-0 sm:bottom-full sm:mb-2 sm:w-88 max-w-md z-50 rounded-2xl bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-700 shadow-2xl p-4 space-y-3 text-left"
        >
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${levelTag.badgeClassName}`}
                >
                  {levelTag.tagLabel}
                </span>
                <span className="text-[10px] font-mono font-semibold text-stone-500 dark:text-stone-400">
                  {qual.typicalDuration} · {qual.nqfCredits}
                </span>
              </div>
              <h6 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {qual.qualificationType}
              </h6>
            </div>
            <button
              type="button"
              onClick={() => setActiveQuickViewKey(null)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shrink-0"
              aria-label="Close quick view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
              Entry Requirements
            </span>
            <p className="text-[11px] text-stone-800 dark:text-stone-200 leading-relaxed">
              {qual.entryRequirement}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Core Modules
            </span>
            <ul className="space-y-1">
              {coreModules.map((mod) => (
                <li
                  key={mod}
                  className="flex items-start gap-1.5 text-[11px] text-stone-700 dark:text-stone-300 leading-snug"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{mod}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveQuickViewKey(null);
                setInspectedQualification({ ...qual, coreModules });
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-[11px] font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              Full Specs
            </button>
            {canApply && (
              <button
                type="button"
                onClick={handleQuickViewApply}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Apply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div id="academic-qualifications-section" className="space-y-8 scroll-mt-52 sm:scroll-mt-44">
      {/* Category Filter Toolbar + Collapsible Major Category Cards */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>University Curriculum &amp; Qualifications</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedCategory === 'all' ? 'All 6 Categories' : `${selectedCategory} Track`}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Academic Faculties &amp; Qualification Pathways
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              Filter by academic category to view relevant sub-fields and qualification levels, or expand any category card below.
            </p>
          </div>

          {onOpenAccreditation && (
            <button
              type="button"
              onClick={onOpenAccreditation}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl flex items-center gap-2 shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Apply for Admission</span>
            </button>
          )}
        </div>

        {/* Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Filter by Academic Category</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={expandAllVisible}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllVisible}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              All Categories (6)
            </button>

            {ACADEMIC_CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategoryFilter(cat.key)}
                  aria-pressed={isSelected}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                  }`}
                >
                  {cat.facultyNumber}. {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Within Selected Category */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                placeholder="Search disciplines or degrees (e.g., Robotics, Nursing, MBA, PGCE)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
              {programSearch && (
                <button
                  type="button"
                  onClick={() => setProgramSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  aria-label="Clear filter search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Showing {visibleFaculties.length}{' '}
              {visibleFaculties.length === 1 ? 'category' : 'categories'} ·{' '}
              {visibleQualifications.length} qualification tracks
            </div>
          </div>
        </div>

        {/* Collapsible Major Category Cards */}
        {visibleFaculties.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              No disciplines or qualifications match &ldquo;{programSearch}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setProgramSearch('');
                if (onSelectCategory) onSelectCategory('all');
                else setInternalCategory('all');
              }}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Reset Category &amp; Search Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleFaculties.map((faculty) => {
              const isExpanded = expandedFacultyIds.includes(faculty.id);
              const totalPrograms = faculty.departments.reduce(
                (acc, d) => acc + d.programs.length,
                0
              );
              const categoryQualifications =
                selectedLevelFilter === 'all'
                  ? faculty.qualifications
                  : faculty.qualifications.filter((q) => q.level === selectedLevelFilter);

              return (
                <section
                  key={faculty.id}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 overflow-visible transition-colors"
                >
                  {/* Collapsible Category Card Header */}
                  <button
                    type="button"
                    onClick={() => toggleFacultyCollapse(faculty.id)}
                    aria-expanded={isExpanded}
                    className={`w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-100/70 dark:hover:bg-stone-900/60 transition-colors cursor-pointer ${
                      isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        <span>{faculty.codePrefix}</span>
                        <span aria-hidden="true">·</span>
                        <span>{faculty.filterKey}</span>
                        <span aria-hidden="true">·</span>
                        <span>{faculty.departments.length} Sub-Fields</span>
                        <span aria-hidden="true">·</span>
                        <span>{totalPrograms} Specializations</span>
                      </div>
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {faculty.number}. {faculty.name}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl">
                        {faculty.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <span className="px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        {categoryQualifications.length} Qualifications
                      </span>
                      <span className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Collapsible Category Content: Sub-Fields & Individual Qualifications */}
                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 space-y-6 border-t border-stone-200/80 dark:border-stone-800 pt-5">
                      {/* Sub-Fields Grid */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          Sub-Fields &amp; Specializations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {faculty.departments.map((dept) => (
                            <div
                              key={dept.id}
                              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-3">
                                <div className="border-b border-stone-100 dark:border-stone-800 pb-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                                      {dept.name}
                                    </h5>
                                    <span className="text-[11px] font-mono text-stone-400">
                                      {dept.programs.length} disciplines
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                                    {dept.focusArea}
                                  </p>
                                </div>

                                <ul className="space-y-1.5">
                                  {dept.programs.map((prog) => (
                                    <li key={prog}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInspectedProgram({
                                            faculty,
                                            department: dept,
                                            programName: prog,
                                          })
                                        }
                                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer bg-stone-50/80 dark:bg-stone-950/60 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70"
                                      >
                                        <span className="flex items-center gap-1.5 min-w-0">
                                          <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                          <span className="truncate font-medium">{prog}</span>
                                        </span>
                                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 shrink-0">
                                          Details
                                        </span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Qualification Levels for This Major Category (Individual Cards) */}
                      <div className="space-y-3 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>
                              Academic Qualification Levels · {faculty.filterKey}
                            </span>
                          </h4>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            Click any qualification card for full entry &amp; assessment details
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryQualifications.map((qual) => {
                            const quickViewKey = `fac_${qual.id}`;
                            const isQuickViewOpen = activeQuickViewKey === quickViewKey;
                            const coreModules = resolveQualificationCoreModules(qual, faculty);
                            const levelTag = resolveQualificationLevelTag(qual);

                            return (
                              <div
                                key={qual.id}
                                className="relative rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col justify-between gap-3"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${levelTag.badgeClassName}`}
                                      >
                                        {levelTag.tagLabel}
                                      </span>
                                      <span className="text-[10px] font-mono font-semibold text-stone-500 dark:text-stone-400">
                                        {qual.level}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 inline-flex items-center gap-1 shrink-0">
                                      <Clock className="w-3 h-3" />
                                      {qual.typicalDuration}
                                    </span>
                                  </div>

                                  <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                                    {qual.qualificationType}
                                  </h5>

                                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                                    {qual.academicFocus}
                                  </p>
                                </div>

                                <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                                  <span className="font-mono text-stone-500 dark:text-stone-400">
                                    {qual.nqfCredits}
                                  </span>
                                  <div className="flex items-center gap-2 relative" data-quickview-root>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveQuickViewKey((prev) =>
                                          prev === quickViewKey ? null : quickViewKey
                                        )
                                      }
                                      aria-expanded={isQuickViewOpen}
                                      aria-haspopup="dialog"
                                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                        isQuickViewOpen
                                          ? 'bg-purple-700 text-white border-purple-700'
                                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-200 hover:border-purple-400'
                                      }`}
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Quick View</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInspectedQualification({ ...qual, coreModules })
                                      }
                                      className="font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                                    >
                                      Details →
                                    </button>
                                    {renderQuickViewPopover(qual, coreModules, quickViewKey, faculty)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Dedicated Structured Academic Qualification Cards Directory */}
      <div
        id="academic-qualifications-cards"
        className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6 scroll-mt-52 sm:scroll-mt-44"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Structured Academic Qualifications</span>
              <span aria-hidden="true">·</span>
              <span>{selectedCategory === 'all' ? 'All Faculties' : selectedCategory}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {selectedCategory === 'all'
                ? 'All Category Qualification Levels'
                : `${selectedCategory} Academic Qualifications`}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              Individual qualification cards tailored to{' '}
              {selectedCategory === 'all'
                ? 'each academic faculty across Undergraduate, Postgraduate, and Doctoral tiers.'
                : `the ${selectedCategory} discipline across Undergraduate, Postgraduate, and Doctoral tiers.`}
            </p>
          </div>

          {/* Qualification Tier Sub-Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs shrink-0">
            {(['all', 'Undergraduate', 'Postgraduate', 'Doctoral'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedLevelFilter === lvl
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {lvl === 'all' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated Academic Qualifications Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={qualificationSearch}
              onChange={(e) => setQualificationSearch(e.target.value)}
              aria-label="Search degree programs or qualification levels"
              placeholder={`Search degree programs or qualification levels${
                selectedCategory === 'all' ? '' : ` in ${selectedCategory}`
              } (e.g., Bachelor's, MBA, PhD, Software Engineering)...`}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
            />
            {qualificationSearch && (
              <button
                type="button"
                onClick={() => setQualificationSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                aria-label="Clear qualification search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums shrink-0">
            Showing {visibleQualifications.length}{' '}
            {visibleQualifications.length === 1 ? 'qualification' : 'qualifications'}
            {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
          </div>
        </div>

        {visibleQualifications.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2.5">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              No qualifications or degree programs match &ldquo;{qualificationSearch || programSearch}&rdquo;
              {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
              {selectedLevelFilter !== 'all' ? ` (${selectedLevelFilter})` : ''}.
            </p>
            <button
              type="button"
              onClick={() => {
                setQualificationSearch('');
                setProgramSearch('');
                setSelectedLevelFilter('all');
                if (onSelectCategory) onSelectCategory('all');
                else setInternalCategory('all');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Qualification Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleQualifications.map((qual) => {
              const quickViewKey = `dir_${qual.id}`;
              const isQuickViewOpen = activeQuickViewKey === quickViewKey;
              const levelTag = resolveQualificationLevelTag(qual);
              const preferredProgram = qual.matchedPrograms[0];

              return (
                <div
                  key={qual.id}
                  className="relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 p-5 flex flex-col justify-between gap-4"
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
                          {qual.categoryKey}
                        </span>
                      </div>
                      <span className="text-stone-600 dark:text-stone-400 font-semibold shrink-0">
                        {qual.typicalDuration}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {qual.qualificationType}
                      </h3>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                        {qual.facultyName}
                      </span>
                    </div>

                    {qual.matchedPrograms.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                          Matching Degree Programs
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {qual.matchedPrograms.slice(0, 4).map((progName) => (
                            <span
                              key={progName}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold text-purple-800 dark:text-purple-200"
                            >
                              {progName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <dl className="space-y-2 text-xs border-t border-stone-200/80 dark:border-stone-800 pt-3">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Entry Requirement
                        </dt>
                        <dd className="text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">
                          {qual.entryRequirement}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Academic Focus
                        </dt>
                        <dd className="text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">
                          {qual.academicFocus}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Progression
                        </dt>
                        <dd className="text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">
                          {qual.progressionPath}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      {qual.nqfCredits}
                    </span>
                    <div className="flex items-center gap-1.5 relative" data-quickview-root>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveQuickViewKey((prev) =>
                            prev === quickViewKey ? null : quickViewKey
                          )
                        }
                        aria-expanded={isQuickViewOpen}
                        aria-haspopup="dialog"
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isQuickViewOpen
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-purple-400 text-stone-700 dark:text-stone-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectedQualification(qual)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer"
                      >
                        Details
                      </button>
                      {(onApplyQualification || onOpenAccreditation) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onApplyQualification) {
                              onApplyQualification(
                                buildApplicationPrefillForQualification(qual, qual.faculty, preferredProgram)
                              );
                            } else if (onOpenAccreditation) {
                              onOpenAccreditation();
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                      {renderQuickViewPopover(
                        qual,
                        qual.coreModules,
                        quickViewKey,
                        qual.faculty,
                        preferredProgram
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Qualification Detail Modal */}
      {inspectedQualification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setInspectedQualification(null)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 flex flex-col">
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  {inspectedQualification.categoryKey || 'Academic'} · {inspectedQualification.level}{' '}
                  · {inspectedQualification.typicalDuration}
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {inspectedQualification.qualificationType}
                </h3>
                {inspectedQualification.facultyName && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {inspectedQualification.facultyName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectedQualification(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                aria-label="Close qualification details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Entry Requirement
                </span>
                <p className="text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                  {inspectedQualification.entryRequirement}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Academic Focus
                </span>
                <p className="text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                  {inspectedQualification.academicFocus}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Assessment Format
                </span>
                <p className="text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                  {inspectedQualification.assessmentFormat}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Core Curriculum Modules
                </span>
                <ul className="mt-1.5 space-y-1">
                  {resolveQualificationCoreModules(inspectedQualification).map((mod) => (
                    <li
                      key={mod}
                      className="flex items-start gap-1.5 text-stone-800 dark:text-stone-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                  Progression &amp; Credit Standard ({inspectedQualification.nqfCredits})
                </span>
                <p className="text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
                  {inspectedQualification.progressionPath}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
              {onApplyQualification || onOpenAccreditation ? (
                <button
                  type="button"
                  onClick={() => {
                    const targetQual = inspectedQualification;
                    setInspectedQualification(null);
                    if (onApplyQualification && targetQual) {
                      onApplyQualification(buildApplicationPrefillForQualification(targetQual));
                    } else if (onOpenAccreditation) {
                      onOpenAccreditation();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Apply Under This Qualification</span>
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setInspectedQualification(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Program / Specialization Detail Modal */}
      {activeProgramDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setInspectedProgram(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 flex flex-col max-h-[88vh]">
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  {activeProgramDetail.programCode} · Faculty {activeProgramDetail.faculty.number} ›{' '}
                  {activeProgramDetail.department.name}
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {activeProgramDetail.programName}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {activeProgramDetail.typicalStudyLoad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedProgram(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                aria-label="Close program detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-[11px] text-stone-500 dark:text-stone-400 block">
                  Discipline Overview
                </span>
                <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                  {activeProgramDetail.overview}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Core Syllabus Pillars</span>
                  </h4>
                  <ul className="space-y-1.5 text-stone-700 dark:text-stone-300">
                    {activeProgramDetail.coreModules.map((mod) => (
                      <li key={mod} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Career Pathways</span>
                  </h4>
                  <ul className="space-y-1.5 text-stone-700 dark:text-stone-300">
                    {activeProgramDetail.careerOutcomes.map((role) => (
                      <li key={role} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 dark:text-stone-100">
                  Available Qualification Pathways for {activeProgramDetail.programName}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeProgramDetail.applicableQualifications.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold uppercase text-purple-700 dark:text-purple-400">
                          {q.level}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400">
                          {q.typicalDuration} · {q.nqfCredits}
                        </span>
                      </div>
                      <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        {q.qualificationType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {onGenerateStudyGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      const topic = `${activeProgramDetail.programName} (${activeProgramDetail.department.name})`;
                      setInspectedProgram(null);
                      onGenerateStudyGuide(topic);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Generate Study Guide</span>
                  </button>
                )}

                {onFilterCatalogByProgram && (
                  <button
                    type="button"
                    onClick={() => {
                      const term = activeProgramDetail.programName.split('(')[0].trim();
                      setInspectedProgram(null);
                      onFilterCatalogByProgram(term);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer"
                  >
                    Filter Courses
                  </button>
                )}

                {(onApplyQualification || onOpenAccreditation) && (
                  <button
                    type="button"
                    onClick={() => {
                      const detail = activeProgramDetail;
                      setInspectedProgram(null);
                      if (onApplyQualification && detail) {
                        const firstQual = detail.applicableQualifications[0];
                        if (firstQual) {
                          onApplyQualification(
                            buildApplicationPrefillForQualification(
                              firstQual,
                              detail.faculty,
                              detail.programName
                            )
                          );
                        }
                      } else if (onOpenAccreditation) {
                        onOpenAccreditation();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply for Track
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectedProgram(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
