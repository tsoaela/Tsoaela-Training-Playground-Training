import { ReadingProgress, ResearchPaper, StudyGuide } from '../types';
import { FLAGSHIP_QCTO_BLUEPRINTS } from '../data/qctoBlueprints';

export type CatalogSortBy = 'recommended' | 'nqf_level' | 'alphabetical' | 'progress';
export type CatalogSortDirection = 'asc' | 'desc';

export type CatalogFormatFilter =
  | 'short_free'
  | 'long_paid'
  | 'quality_verified'
  | 'open_access'
  | 'research_pass';

export type CatalogProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface CatalogMultiFilterState {
  nqfLevels: number[];
  categories: string[];
  formats: CatalogFormatFilter[];
  progressStatuses: CatalogProgressStatus[];
}

export const EMPTY_CATALOG_FILTERS: CatalogMultiFilterState = {
  nqfLevels: [],
  categories: [],
  formats: [],
  progressStatuses: [],
};

export function countActiveCatalogFilters(filters: CatalogMultiFilterState): number {
  return (
    filters.nqfLevels.length +
    filters.categories.length +
    filters.formats.length +
    filters.progressStatuses.length
  );
}

export function getStudyGuideNqfLevel(guide: StudyGuide): number {
  const flagship = FLAGSHIP_QCTO_BLUEPRINTS[guide.id];
  if (flagship) return flagship.nqfLevel;
  if (guide.difficulty === 'Advanced' || guide.professional_level === 'professional') {
    return 6;
  }
  if (guide.difficulty === 'Executive' || guide.professional_level === 'intermediate') {
    return 5;
  }
  return 4;
}

export function getResearchPaperNqfLevel(paper: ResearchPaper): number {
  if (paper.is_premium) return 7;
  if (paper.is_ai_generated) return 6;
  return 5;
}

export function getStudyGuideProgressPercent(
  guide: StudyGuide,
  readingProgress: Record<string, ReadingProgress>
): number {
  const prog = readingProgress[guide.id];
  if (!prog) return 0;
  if (prog.isCompleted) return 100;
  return Math.max(0, Math.min(100, prog.progressPercent || 0));
}

export function filterAndSortStudyGuides(
  guides: StudyGuide[],
  readingProgress: Record<string, ReadingProgress>,
  filters: CatalogMultiFilterState,
  sortBy: CatalogSortBy,
  sortDirection: CatalogSortDirection
): StudyGuide[] {
  const filtered = guides.filter((guide) => {
    if (filters.nqfLevels.length > 0) {
      const nqf = getStudyGuideNqfLevel(guide);
      if (!filters.nqfLevels.includes(nqf)) return false;
    }

    if (filters.categories.length > 0) {
      if (!filters.categories.includes(guide.category)) return false;
    }

    if (filters.formats.length > 0) {
      const matchesFormat = filters.formats.some((fmt) => {
        if (fmt === 'short_free') return guide.duration_type === 'short_term';
        if (fmt === 'long_paid') return guide.duration_type === 'long_term';
        if (fmt === 'quality_verified') return guide.is_accredited;
        if (fmt === 'open_access') return !guide.is_premium;
        if (fmt === 'research_pass') return guide.is_premium;
        return false;
      });
      if (!matchesFormat) return false;
    }

    if (filters.progressStatuses.length > 0) {
      const pct = getStudyGuideProgressPercent(guide, readingProgress);
      const status: CatalogProgressStatus =
        pct >= 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started';
      if (!filters.progressStatuses.includes(status)) return false;
    }

    return true;
  });

  if (sortBy === 'recommended') {
    return filtered;
  }

  const dirMultiplier = sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title) * dirMultiplier;
    }
    if (sortBy === 'nqf_level') {
      const diff = (getStudyGuideNqfLevel(a) - getStudyGuideNqfLevel(b)) * dirMultiplier;
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    }
    if (sortBy === 'progress') {
      const pctA = getStudyGuideProgressPercent(a, readingProgress);
      const pctB = getStudyGuideProgressPercent(b, readingProgress);
      const diff = (pctA - pctB) * dirMultiplier;
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    }
    return 0;
  });
}

export function filterAndSortResearchPapers(
  papers: ResearchPaper[],
  readPaperIds: string[],
  filters: CatalogMultiFilterState,
  sortBy: CatalogSortBy,
  sortDirection: CatalogSortDirection
): ResearchPaper[] {
  const filtered = papers.filter((paper) => {
    if (filters.nqfLevels.length > 0) {
      const nqf = getResearchPaperNqfLevel(paper);
      if (!filters.nqfLevels.includes(nqf)) return false;
    }

    if (filters.categories.length > 0) {
      if (!filters.categories.includes(paper.category)) return false;
    }

    if (filters.formats.length > 0) {
      const matchesFormat = filters.formats.some((fmt) => {
        if (fmt === 'open_access' || fmt === 'short_free') return !paper.is_premium;
        if (fmt === 'research_pass' || fmt === 'long_paid') return paper.is_premium;
        if (fmt === 'quality_verified') return paper.is_accredited;
        return false;
      });
      if (!matchesFormat) return false;
    }

    if (filters.progressStatuses.length > 0) {
      const isRead = readPaperIds.includes(paper.id);
      const status: CatalogProgressStatus = isRead ? 'completed' : 'not_started';
      if (!filters.progressStatuses.includes(status)) return false;
    }

    return true;
  });

  if (sortBy === 'recommended') {
    return filtered;
  }

  const dirMultiplier = sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title) * dirMultiplier;
    }
    if (sortBy === 'nqf_level') {
      const diff = (getResearchPaperNqfLevel(a) - getResearchPaperNqfLevel(b)) * dirMultiplier;
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    }
    if (sortBy === 'progress') {
      const progA = readPaperIds.includes(a.id) ? 100 : 0;
      const progB = readPaperIds.includes(b.id) ? 100 : 0;
      const diff = (progA - progB) * dirMultiplier;
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    }
    return 0;
  });
}
