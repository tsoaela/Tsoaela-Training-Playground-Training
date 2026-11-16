import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { JobListing, ReadingProgress, StudyGuide } from '../types';
import { JOB_LISTINGS } from '../data/mockData';
import {
  ACADEMIC_FACULTIES,
  AcademicCategoryKey,
  AcademicFaculty,
  AcademicQualificationLevel,
} from '../data/academicCatalog';
import {
  formatCertificateSerial,
  getCertificateForStudyGuide,
} from '../data/certificatesData';

interface CareerRoadmapPanelProps {
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  onNavigateToGuide: (guideId: string) => void;
  onOpenCareersTab: () => void;
  onExploreAcademicCategory?: (category: AcademicCategoryKey) => void;
}

interface CareerPathSpec {
  trackTitle: string;
  targetRoles: string[];
  compensationBand: string;
  horizonLabel: string;
  summary: string;
  matchingJobFields: string[];
}

interface MilestoneQualificationProfile {
  faculty: AcademicFaculty;
  qualification: AcademicQualificationLevel;
  matchedDepartment: string;
  credentialTitle: string;
  serialCode: string;
  tierIndex: number;
}

const CATEGORY_CAREER_PATHS: Record<string, CareerPathSpec> = {
  'Frontier AI & Systems': {
    trackTitle: 'Frontier AI & Autonomous Systems Architecture',
    targetRoles: [
      'AI Systems Architect',
      'Reasoning Compute Research Engineer',
      'Multi-Agent Orchestration Lead',
    ],
    compensationBand: '$180k – $265k / yr',
    horizonLabel: 'Immediate – 12 Months',
    summary:
      'Translates test-time search compute, PRM verification, and Byzantine quorum consensus mastery into production AI systems leadership.',
    matchingJobFields: ['Distributed AI Systems', 'Frontier AI & Search Theory'],
  },
  'Cognitive Models': {
    trackTitle: 'Systems Engineering & Bio-Cognitive Performance',
    targetRoles: [
      'Principal Systems Strategist',
      'Cognitive Performance Lead',
      'Decision Architecture Advisor',
    ],
    compensationBand: '$145k – $210k / yr',
    horizonLabel: '6 – 18 Months',
    summary:
      'Applies first-principles axiomatic deconstruction and delay-cascade analysis to organizational bottlenecks and human performance systems.',
    matchingJobFields: ['Cognitive Physiology', 'Systems Engineering'],
  },
  'Executive Leadership': {
    trackTitle: 'Sovereign Infrastructure & Institutional Stewardship',
    targetRoles: [
      'Infrastructure Strategist',
      'Chief Strategy & Governance Officer',
      'Sovereign Capital Allocator',
    ],
    compensationBand: '$190k – $320k+ / yr',
    horizonLabel: '12 – 36 Months',
    summary:
      'Equips senior operators for multi-decade capital shielding, energy/compute infrastructure colocation, and institutional continuity.',
    matchingJobFields: ['Sovereign Infrastructure', 'Institutional Governance'],
  },
};

function resolveCareerPathForCategory(category: string, field?: string): CareerPathSpec {
  if (CATEGORY_CAREER_PATHS[category]) {
    return CATEGORY_CAREER_PATHS[category];
  }
  const domain = field || category || 'Institutional Studies';
  return {
    trackTitle: `${domain} Leadership Track`,
    targetRoles: [
      `${domain} Specialist`,
      `Senior ${domain} Architect`,
      `Director of ${domain}`,
    ],
    compensationBand: '$130k – $210k / yr',
    horizonLabel: '6 – 24 Months',
    summary: `Synthesizes accredited ${domain} coursework and empirical evaluations into senior advisory and architectural roles.`,
    matchingJobFields: [domain, category],
  };
}

function resolveQualificationProfileForGuide(
  guide: StudyGuide
): MilestoneQualificationProfile {
  const combinedText = `${guide.category} ${guide.field || ''} ${guide.title}`.toLowerCase();

  let filterKey: AcademicCategoryKey = 'Engineering';
  if (
    combinedText.includes('executive') ||
    combinedText.includes('sovereign') ||
    combinedText.includes('governance') ||
    combinedText.includes('business') ||
    combinedText.includes('finance') ||
    combinedText.includes('law') ||
    combinedText.includes('economics')
  ) {
    filterKey = 'Business';
  } else if (
    combinedText.includes('health') ||
    combinedText.includes('medical') ||
    combinedText.includes('clinical') ||
    combinedText.includes('pharma') ||
    combinedText.includes('nursing')
  ) {
    filterKey = 'Health';
  } else if (
    combinedText.includes('psychology') ||
    combinedText.includes('cognitive') ||
    combinedText.includes('philosophy') ||
    combinedText.includes('history') ||
    combinedText.includes('social') ||
    combinedText.includes('humanities')
  ) {
    filterKey = 'Humanities';
  } else if (
    combinedText.includes('education') ||
    combinedText.includes('teaching') ||
    combinedText.includes('pedagogy') ||
    combinedText.includes('pgce')
  ) {
    filterKey = 'Education';
  } else if (
    combinedText.includes('quantum') ||
    combinedText.includes('physics') ||
    combinedText.includes('bio') ||
    combinedText.includes('math') ||
    combinedText.includes('agri') ||
    combinedText.includes('science')
  ) {
    filterKey = 'Science';
  }

  const faculty =
    ACADEMIC_FACULTIES.find((f) => f.filterKey === filterKey) || ACADEMIC_FACULTIES[0];

  // Determine qualification tier based on duration_type and difficulty
  let tierIndex = 2; // Default Postgraduate Honours / Diploma
  if (guide.duration_type === 'long_term' && guide.difficulty === 'Executive') {
    tierIndex = Math.min(4, faculty.qualifications.length - 1); // Doctoral / Fellowship tier
  } else if (guide.difficulty === 'Executive' || guide.duration_type === 'long_term') {
    tierIndex = Math.min(3, faculty.qualifications.length - 1); // Master's Degree tier
  } else if (guide.difficulty === 'Advanced') {
    tierIndex = Math.min(2, faculty.qualifications.length - 1); // Honours / Postgraduate Diploma
  } else {
    tierIndex = Math.min(1, faculty.qualifications.length - 1); // Bachelor's Degree tier
  }

  const qualification = faculty.qualifications[tierIndex] || faculty.qualifications[0];
  const matchedDepartment = faculty.departments[0]?.name || faculty.shortName;
  const certTemplate = getCertificateForStudyGuide(guide);

  return {
    faculty,
    qualification,
    matchedDepartment,
    credentialTitle: certTemplate?.credentialTitle || qualification.qualificationType,
    serialCode: formatCertificateSerial(
      certTemplate?.credentialCodePrefix || faculty.codePrefix,
      guide.id,
      'SCHOLAR'
    ),
    tierIndex,
  };
}

export const CareerRoadmapPanel: React.FC<CareerRoadmapPanelProps> = ({
  studyGuides,
  readingProgress,
  onNavigateToGuide,
  onOpenCareersTab,
  onExploreAcademicCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    studyGuides.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [studyGuides]);

  const milestones = useMemo(() => {
    const items = studyGuides.map((guide) => {
      const prog = readingProgress[guide.id];
      const pct = prog?.progressPercent || 0;
      const quizVals = prog?.quizScores
        ? Object.values(prog.quizScores).filter((v): v is number => typeof v === 'number')
        : [];
      const bestQuiz = quizVals.length > 0 ? Math.max(...quizVals) : undefined;
      const isCompleted = Boolean(prog?.isCompleted || pct >= 100);
      const isStarted = pct > 0 || (prog?.completedChapters?.length || 0) > 0;

      const status: 'completed' | 'in_progress' | 'upcoming' = isCompleted
        ? 'completed'
        : isStarted
        ? 'in_progress'
        : 'upcoming';

      const statusOrder = status === 'completed' ? 0 : status === 'in_progress' ? 1 : 2;

      return {
        guide,
        status,
        statusOrder,
        pct,
        bestQuiz,
        lastReadDate: prog?.lastReadDate || null,
        completedChaptersCount: prog?.completedChapters?.length || 0,
        totalChaptersCount: guide.chapters.length,
        careerSpec: resolveCareerPathForCategory(guide.category, guide.field),
        qualProfile: resolveQualificationProfileForGuide(guide),
      };
    });

    return items
      .filter((m) => selectedCategory === 'all' || m.guide.category === selectedCategory)
      .sort((a, b) => a.statusOrder - a.statusOrder || b.pct - a.pct);
  }, [studyGuides, readingProgress, selectedCategory]);

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.guide.id === selectedMilestoneId) || null,
    [milestones, selectedMilestoneId]
  );

  // Summarize completed & active categories to build future career pathway cards
  const completedCategorySummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        completedCount: number;
        inProgressCount: number;
        totalCount: number;
        avgProgress: number;
        spec: CareerPathSpec;
        matchedJobs: JobListing[];
      }
    >();

    studyGuides.forEach((guide) => {
      if (selectedCategory !== 'all' && guide.category !== selectedCategory) return;
      const prog = readingProgress[guide.id];
      const pct = prog?.progressPercent || 0;
      const isCompleted = Boolean(prog?.isCompleted || pct >= 100);
      const isStarted = pct > 0 || (prog?.completedChapters?.length || 0) > 0;

      const existing = map.get(guide.category) || {
        category: guide.category,
        completedCount: 0,
        inProgressCount: 0,
        totalCount: 0,
        avgProgress: 0,
        spec: resolveCareerPathForCategory(guide.category, guide.field),
        matchedJobs: [],
      };

      existing.totalCount += 1;
      if (isCompleted) existing.completedCount += 1;
      else if (isStarted) existing.inProgressCount += 1;
      existing.avgProgress += pct;

      map.set(guide.category, existing);
    });

    return Array.from(map.values())
      .map((entry) => {
        const matchedJobs = JOB_LISTINGS.filter((job) =>
          entry.spec.matchingJobFields.some(
            (f) =>
              job.field.toLowerCase().includes(f.toLowerCase()) ||
              f.toLowerCase().includes(job.field.toLowerCase())
          )
        );
        return {
          ...entry,
          avgProgress: entry.totalCount > 0 ? Math.round(entry.avgProgress / entry.totalCount) : 0,
          matchedJobs,
        };
      })
      .sort(
        (a, b) =>
          b.completedCount - a.completedCount ||
          b.inProgressCount - a.inProgressCount ||
          b.avgProgress - a.avgProgress
      );
  }, [studyGuides, readingProgress, selectedCategory]);

  const completedTotal = studyGuides.filter((g) => {
    const p = readingProgress[g.id];
    return p?.isCompleted || (p?.progressPercent ?? 0) >= 100;
  }).length;

  const inProgressTotal = studyGuides.filter((g) => {
    const p = readingProgress[g.id];
    const pct = p?.progressPercent ?? 0;
    return !p?.isCompleted && pct > 0 && pct < 100;
  }).length;

  const handleToggleMilestone = (guideId: string) => {
    setSelectedMilestoneId((prev) => (prev === guideId ? null : guideId));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1 flex-wrap">
              <Compass className="w-3.5 h-3.5 text-[#65a30d] dark:text-[#a3e635]" />
              <span>Career Progression Architecture</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                {completedTotal} Completed / {inProgressTotal} In Progress / {studyGuides.length} Total Guides
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Career Roadmap &amp; Milestone Timeline
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              Click any milestone node along the timeline to inspect detailed academic qualification criteria, NQF credit standards, assessment format, and unlocked career roles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCareersTab}
              className="px-4 py-2 rounded-xl bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Explore Careers Board</span>
            </button>
          </div>
        </div>

        {/* Category Scope Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            All Categories ({studyGuides.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-Column Roadmap Grid: Left = Clickable Milestone Timeline, Right = Future Career Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Interactive Visual Course Completion Timeline */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#65a30d] dark:text-[#a3e635]" />
                <span>Curriculum Completion Timeline</span>
              </h3>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                {milestones.length} Milestones · Click node for qualification details
              </span>
            </div>

            <div className="relative pl-6 sm:pl-7 space-y-5 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
              {milestones.map((item, idx) => {
                const {
                  guide,
                  status,
                  pct,
                  bestQuiz,
                  lastReadDate,
                  completedChaptersCount,
                  totalChaptersCount,
                  careerSpec,
                  qualProfile,
                } = item;

                const isCompleted = status === 'completed';
                const isInProgress = status === 'in_progress';
                const isNodeSelected = selectedMilestoneId === guide.id;

                return (
                  <div key={guide.id} className="relative space-y-3">
                    {/* Clickable Timeline Node Dot */}
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(guide.id)}
                      aria-label={`Inspect qualification details for ${guide.title}`}
                      aria-expanded={isNodeSelected}
                      className={`absolute -left-6 sm:-left-7 top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer z-10 ${
                        isNodeSelected
                          ? 'ring-4 ring-[#84cc16]/35 scale-110'
                          : 'hover:scale-110'
                      } ${
                        isCompleted
                          ? 'bg-[#052e16] border-[#84cc16] text-[#bef264]'
                          : isInProgress
                          ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isInProgress ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
                      )}
                    </button>

                    {/* Clickable Milestone Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isNodeSelected}
                      onClick={() => handleToggleMilestone(guide.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleMilestone(guide.id);
                        }
                      }}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#65a30d] ${
                        isNodeSelected
                          ? 'ring-2 ring-[#65a30d] dark:ring-[#84cc16] border-[#65a30d] dark:border-[#84cc16] shadow-md'
                          : 'hover:border-stone-400 dark:hover:border-stone-600'
                      } ${
                        isCompleted
                          ? 'border-[#84cc16]/50 bg-[#052e16]/[0.03] dark:bg-[#052e16]/25'
                          : isInProgress
                          ? 'border-amber-300/70 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/15'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                            {qualProfile.faculty.codePrefix}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {guide.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{qualProfile.qualification.level}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {completedChaptersCount}/{totalChaptersCount} Chapters
                          </span>
                          {lastReadDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{lastReadDate}</span>
                            </>
                          )}
                        </div>

                        <span
                          className={`font-mono font-bold text-[11px] ${
                            isCompleted
                              ? 'text-[#65a30d] dark:text-[#a3e635]'
                              : isInProgress
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {isCompleted
                            ? 'Completed (100%)'
                            : isInProgress
                            ? `In Progress (${pct}%)`
                            : 'Upcoming Milestone'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                            {guide.title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-400">
                            Qualification Track:{' '}
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {qualProfile.qualification.qualificationType}
                            </span>
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Career Pathway:{' '}
                            <span className="font-medium text-stone-700 dark:text-stone-300">
                              {careerSpec.trackTitle}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <span
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border transition-colors ${
                              isNodeSelected
                                ? 'bg-[#052e16] text-[#bef264] border-[#84cc16]/60'
                                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                            }`}
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>{isNodeSelected ? 'Hide Qualification' : 'Qualification Info'}</span>
                            {isNodeSelected ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToGuide(guide.id);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                          >
                            <span>
                              {isCompleted
                                ? 'Review Module'
                                : isInProgress
                                ? 'Continue Guide'
                                : 'Start Milestone'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Completion Bar + Assessment Metric */}
                      <div className="space-y-1.5">
                        <div className="w-full h-1.5 rounded-full bg-stone-200/80 dark:bg-stone-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-[#65a30d] to-[#a3e635]'
                                : isInProgress
                                ? 'bg-amber-500'
                                : 'bg-stone-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {bestQuiz !== undefined && (
                          <div className="text-[11px] font-mono text-[#65a30d] dark:text-[#bef264] flex items-center gap-1.5 tabular-nums">
                            <Award className="w-3.5 h-3.5" />
                            <span>Assessment Verified: {bestQuiz}% Score</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detailed Qualification Information Panel when Milestone Node is Selected */}
                    {isNodeSelected && (
                      <div className="rounded-2xl border border-[#84cc16]/60 bg-gradient-to-br from-white via-stone-50 to-emerald-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-[#052e16]/40 p-5 sm:p-6 space-y-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#65a30d] dark:text-[#a3e635]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{qualProfile.faculty.filterKey} Industry Qualification</span>
                              <span aria-hidden="true">·</span>
                              <span>{qualProfile.qualification.level}</span>
                              <span aria-hidden="true">·</span>
                              <span>{qualProfile.serialCode}</span>
                            </div>
                            <h5 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                              {qualProfile.qualification.qualificationType}
                            </h5>
                            <p className="text-xs text-stone-600 dark:text-stone-400">
                              {qualProfile.faculty.name} › {qualProfile.matchedDepartment}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedMilestoneId(null)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                            aria-label="Close qualification details"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Qualification Key Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Typical Duration
                            </span>
                            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                              {qualProfile.qualification.typicalDuration}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Credit Standard
                            </span>
                            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
                              {qualProfile.qualification.nqfCredits}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Accrediting Body
                            </span>
                            <span className="font-semibold text-stone-900 dark:text-stone-100 mt-0.5 block truncate">
                              {guide.is_accredited
                                ? guide.accreditor_name || 'TTG Academic Board'
                                : 'TTG Institutional Track'}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Credential Award
                            </span>
                            <span className="font-semibold text-[#65a30d] dark:text-[#a3e635] mt-0.5 block truncate">
                              {qualProfile.credentialTitle}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Qualification Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-white dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Entry Requirement
                            </span>
                            <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                              {qualProfile.qualification.entryRequirement}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Academic Focus
                            </span>
                            <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                              {qualProfile.qualification.academicFocus}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Assessment Format
                            </span>
                            <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                              {qualProfile.qualification.assessmentFormat}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Next Qualification Progression
                            </span>
                            <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                              {qualProfile.qualification.progressionPath}
                            </p>
                          </div>
                        </div>

                        {/* Module Learning Outcomes */}
                        {guide.learning_outcomes && guide.learning_outcomes.length > 0 && (
                          <div className="space-y-2 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                              Milestone Competency Outcomes
                            </span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {guide.learning_outcomes.map((outcome) => (
                                <li
                                  key={outcome}
                                  className="flex items-start gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d] dark:text-[#a3e635] shrink-0 mt-0.5" />
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Faculty Qualification Ladder */}
                        <div className="space-y-2 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                            {qualProfile.faculty.filterKey} Degree Progression Ladder
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {qualProfile.faculty.qualifications.map((stepQual, stepIdx) => {
                              const isCurrentTier = stepQual.id === qualProfile.qualification.id;
                              return (
                                <div
                                  key={stepQual.id}
                                  className={`p-2.5 rounded-xl border text-[11px] ${
                                    isCurrentTier
                                      ? 'border-[#65a30d] dark:border-[#84cc16] bg-[#052e16]/5 dark:bg-[#052e16]/50 text-stone-900 dark:text-stone-100 font-semibold'
                                      : 'border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-950/40 text-stone-600 dark:text-stone-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 font-mono text-[10px] mb-0.5">
                                    <span>
                                      Tier {stepIdx + 1} · {stepQual.level}
                                    </span>
                                    <span>{stepQual.typicalDuration}</span>
                                  </div>
                                  <div className="truncate">{stepQual.qualificationType}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigateToGuide(guide.id)}
                              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Open Study Module</span>
                            </button>

                            {onExploreAcademicCategory && (
                              <button
                                type="button"
                                onClick={() =>
                                  onExploreAcademicCategory(qualProfile.faculty.filterKey)
                                }
                                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>
                                  Filter {qualProfile.faculty.filterKey} Qualifications
                                </span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedMilestoneId(null)}
                            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
                          >
                            Close Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (5 cols): Category-Driven Future Career Opportunities */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#65a30d] dark:text-[#a3e635]" />
                <span>Future Career Opportunities</span>
              </h3>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                By Completed Category
              </span>
            </div>

            <div className="space-y-4">
              {completedCategorySummaries.map((catItem) => {
                const isUnlocked = catItem.completedCount > 0;
                const isActive = catItem.inProgressCount > 0;
                const isHighlightedBySelection =
                  selectedMilestone?.guide.category === catItem.category;

                return (
                  <div
                    key={catItem.category}
                    className={`rounded-2xl border p-5 space-y-3.5 transition-all ${
                      isHighlightedBySelection
                        ? 'ring-2 ring-[#65a30d] dark:ring-[#84cc16]'
                        : ''
                    } ${
                      isUnlocked
                        ? 'border-[#84cc16]/60 bg-gradient-to-br from-[#022c22]/[0.05] to-[#84cc16]/[0.08] dark:from-[#022c22]/60 dark:to-[#052e16]/50'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-[#65a30d] dark:text-[#bef264]">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{catItem.category}</span>
                      </div>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isUnlocked
                            ? 'text-[#65a30d] dark:text-[#a3e635]'
                            : isActive
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {isUnlocked
                          ? `${catItem.completedCount} Completed · Unlocked`
                          : isActive
                          ? `${catItem.avgProgress}% Progress`
                          : 'Next Trajectory'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {catItem.spec.trackTitle}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                        {catItem.spec.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs border-t border-stone-200/70 dark:border-stone-800">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                          Compensation Band
                        </span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                          {catItem.spec.compensationBand}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                          Target Horizon
                        </span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[#65a30d]" />
                          <span>{catItem.spec.horizonLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Target Roles */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                        Qualified Career Roles
                      </span>
                      <div className="space-y-1">
                        {catItem.spec.targetRoles.map((roleTitle) => (
                          <div
                            key={roleTitle}
                            className="flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200 font-medium"
                          >
                            <Sparkles className="w-3 h-3 text-[#65a30d] dark:text-[#a3e635] shrink-0" />
                            <span>{roleTitle}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live Matching Roles from TTG Careers Board */}
                    {catItem.matchedJobs.length > 0 && (
                      <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                          Open Platform Roles
                        </span>
                        {catItem.matchedJobs.map((job) => (
                          <div
                            key={job.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                {job.title}
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 truncate">
                                <span>{job.company}</span>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={onOpenCareersTab}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-[11px] font-bold shrink-0 cursor-pointer"
                            >
                              {job.salary_range}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
