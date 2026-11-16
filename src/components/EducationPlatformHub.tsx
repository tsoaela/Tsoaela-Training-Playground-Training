import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Globe, 
  Briefcase, 
  Compass, 
  GraduationCap, 
  Users,
  BarChart3,
  Trophy,
  Map,
  ChevronUp,
  Award,
  ArrowDown,
  ShieldCheck
} from 'lucide-react';
import {
  ACADEMIC_CATEGORY_FILTERS,
  AcademicCategoryKey,
  AcademicFaculty,
  AcademicQualificationLevel,
} from '../data/academicCatalog';
import { 
  UserProfile, 
  StudyGuide, 
  ResearchPaper, 
  RetreatEvent, 
  Booking, 
  InvoiceReceipt, 
  ReadingProgress, 
  ReadingProgressUpdateOptions,
  AuthorDocument,
  OfflineAssignmentSubmission,
  EnrolledStudentRecord,
  PomodoroIntervalConfig,
  PomodoroPhase,
  PomodoroSessionLog,
  ApplicationPrefillData
} from '../types';
import { EducareTab } from './EducareTab';
import { ResearchCornerTab } from './ResearchCornerTab';
import { DigitalWorldTab } from './DigitalWorldTab';
import { CareersTab } from './CareersTab';
import { RetreatsTab } from './RetreatsTab';
import { CommunityFeedTab } from './CommunityFeedTab';
import { LearningVelocityPanel } from './LearningVelocityPanel';
import { CourseLeaderboardWidget } from './CourseLeaderboardWidget';
import { CareerRoadmapPanel } from './CareerRoadmapPanel';
import { PomodoroStudyTimer } from './PomodoroStudyTimer';
import { AccreditationWorkflowSection } from './AccreditationWorkflowSection';
import { CheckoutMode } from './StripeCheckoutModal';
import { TTG_LOGO_URL } from '../utils/pdfBranding';

export type EducationSubTab = 'educare' | 'community' | 'research' | 'digital_world' | 'careers' | 'retreats';

interface EducationPlatformHubProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  researchPapers: ResearchPaper[];
  retreatEvents: RetreatEvent[];
  bookings: Booking[];
  invoices: InvoiceReceipt[];
  readingProgress: Record<string, ReadingProgress>;
  initialSubTab?: EducationSubTab;
  onUpdateReadingProgress: (guideId: string, chapterIdx: number, totalChapters: number, notes?: string, quizScore?: number, badgeId?: string, options?: ReadingProgressUpdateOptions) => void;
  onOpenReminders: (targetTitle?: string) => void;
  onTriggerPaywall: (featureName?: string, plan?: 'educare_pro' | 'research_pass') => void;
  onAddStudyGuide?: (guide: StudyGuide) => void;
  onRemoveStudyGuide?: (guideId: string) => void;
  onInitiateBookingCheckout: (mode: CheckoutMode) => void;
  onViewReceipt?: (invoiceId: string) => void;
  targetStudyGuideId?: string | null;
  targetResearchPaperId?: string | null;
  targetRetreatEventId?: string | null;
  onClearTargetGuide?: () => void;
  onClearTargetPaper?: () => void;
  onClearTargetEvent?: () => void;
  onOpenExportReport?: () => void;
  onOpenAcademicPrompts?: () => void;
  onOpenAccreditation?: () => void;
  onApplyQualification?: (prefill: ApplicationPrefillData) => void;
  pendingEditorDocument?: Partial<AuthorDocument> | null;
  onClearPendingDocument?: () => void;
  isAuthenticated?: boolean;
  onRequireAuth?: (action: () => void, message: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string) => void;
  onSubmitAssignment?: (courseId: string, courseTitle: string, assignmentTitle: string, content: string) => void;
  offlineAssignments?: OfflineAssignmentSubmission[];
  enrollments?: EnrolledStudentRecord[];
  onEnrollInCourse?: (guide: StudyGuide) => void;
  pomodoro: {
    phase: PomodoroPhase;
    isRunning: boolean;
    remainingSeconds: number;
    totalPhaseSeconds: number;
    elapsedFocusMinutes: number;
    linkedGuideId: string;
    cycleCount: number;
    config: PomodoroIntervalConfig;
    syncedFocusMinutes: number;
    completedSessions: number;
    sessionLogs: PomodoroSessionLog[];
    startPause: () => void;
    resetTimer: () => void;
    selectPhase: (phase: PomodoroPhase) => void;
    skipPhase: () => void;
    setLinkedGuideId: (guideId: string) => void;
    updateConfig: (partial: Partial<PomodoroIntervalConfig>) => void;
    syncElapsedFocusSession: () => void;
    clearCompletedSessionLogs?: () => void;
  };
  onOpenActivityDashboard?: () => void;
  savedProgramIds?: string[];
  onToggleSaveProgram?: (qual: AcademicQualificationLevel, faculty?: AcademicFaculty) => void;
  comparedProgramIds?: string[];
  onToggleCompareProgram?: (qualId: string) => void;
  onClearComparedPrograms?: () => void;
  onOpenCompareModal?: () => void;
  onOpenSavedProgramsProfile?: () => void;
  requestedAcademicCategory?: 'all' | AcademicCategoryKey | null;
  onClearRequestedAcademicCategory?: () => void;
  onOpenStudentFeedback?: (courseId?: string, moduleIndex?: number) => void;
  onActiveStudyContextChange?: (context: { courseTitle?: string; chapterTitle?: string } | null) => void;
}

export const EducationPlatformHub: React.FC<EducationPlatformHubProps> = ({
  user,
  studyGuides,
  researchPapers,
  retreatEvents,
  bookings,
  invoices,
  readingProgress,
  initialSubTab = 'educare',
  onUpdateReadingProgress,
  onOpenReminders,
  onTriggerPaywall,
  onAddStudyGuide,
  onRemoveStudyGuide,
  onInitiateBookingCheckout,
  onViewReceipt,
  targetStudyGuideId,
  targetResearchPaperId,
  targetRetreatEventId,
  onClearTargetGuide,
  onClearTargetPaper,
  onClearTargetEvent,
  onOpenExportReport,
  onOpenAcademicPrompts,
  onOpenAccreditation,
  onApplyQualification,
  pendingEditorDocument,
  onClearPendingDocument,
  isAuthenticated = false,
  onRequireAuth = () => {},
  onStartStudyRoom,
  onSubmitAssignment,
  offlineAssignments = [],
  enrollments = [],
  onEnrollInCourse,
  pomodoro,
  onOpenActivityDashboard,
  savedProgramIds = [],
  onToggleSaveProgram,
  comparedProgramIds = [],
  onToggleCompareProgram,
  onClearComparedPrograms,
  onOpenCompareModal,
  onOpenSavedProgramsProfile,
  requestedAcademicCategory = null,
  onClearRequestedAcademicCategory,
  onOpenStudentFeedback,
  onActiveStudyContextChange,
}) => {
  const [subTab, setSubTab] = useState<EducationSubTab>(initialSubTab);
  const [selectedAcademicCategory, setSelectedAcademicCategory] = useState<'all' | AcademicCategoryKey>('all');
  const [leaderboardGuideId, setLeaderboardGuideId] = useState<string>(studyGuides[0]?.id || '');
  const [roadmapTargetGuideId, setRoadmapTargetGuideId] = useState<string | null>(null);
  const [activeInsightPanel, setActiveInsightPanel] = useState<'none' | 'velocity' | 'leaderboard' | 'roadmap' | 'workflow'>('none');

  const handleSelectAcademicCategory = (
    category: 'all' | AcademicCategoryKey,
    shouldScrollToQualifications = true
  ) => {
    setSelectedAcademicCategory(category);
    if (subTab !== 'educare') {
      setSubTab('educare');
    }
    if (shouldScrollToQualifications) {
      window.setTimeout(() => {
        document
          .getElementById('academic-qualifications-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const activeLeaderboardGuide =
    studyGuides.find((g) => g.id === leaderboardGuideId) || studyGuides[0];

  // Sync sub-tab when parent App changes initialSubTab
  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Automatically jump to Academic Qualifications when requested (e.g., from Saved Programs)
  useEffect(() => {
    if (requestedAcademicCategory) {
      setSelectedAcademicCategory(requestedAcademicCategory);
      setSubTab('educare');
      window.setTimeout(() => {
        document
          .getElementById('academic-qualifications-cards')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
      onClearRequestedAcademicCategory?.();
    }
  }, [requestedAcademicCategory, onClearRequestedAcademicCategory]);

  // Automatically switch sub-tab if an item was targeted by global search
  useEffect(() => {
    if (targetStudyGuideId) {
      setSubTab('educare');
    } else if (targetResearchPaperId) {
      setSubTab('research');
    } else if (targetRetreatEventId) {
      setSubTab('retreats');
    }
  }, [targetStudyGuideId, targetResearchPaperId, targetRetreatEventId]);

  const navItems = [
    { id: 'educare' as const, label: 'Educare Systems', icon: GraduationCap, badge: `${studyGuides.length} Modules` },
    { id: 'community' as const, label: 'Community Feed', icon: Users, badge: 'Showcases & Debates' },
    { id: 'research' as const, label: 'Research Corner', icon: FileText, badge: `${researchPapers.length} Briefs` },
    { id: 'digital_world' as const, label: 'Digital World', icon: Globe, badge: 'Audio/Visual DSP' },
    { id: 'careers' as const, label: 'Careers & Exhibitions', icon: Briefcase, badge: 'Job Board' },
    { id: 'retreats' as const, label: 'TTG Retreats', icon: Compass, badge: 'Sanctuaries' },
  ];

  return (
    <div className="space-y-6">
      {/* Sticky Industry Category Filter Tab Bar for Academic Qualifications */}
      <div
        role="region"
        aria-label="Academic Qualifications Industry Filter Bar"
        className="sticky top-[145px] sm:top-[109px] lg:top-[113px] z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 shadow-2xs transition-colors"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 shrink-0 whitespace-nowrap">
            <Award className="w-3.5 h-3.5" />
            <span>Qualifications by Industry:</span>
          </div>

          <div
            role="tablist"
            aria-label="Filter academic qualifications by industry"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedAcademicCategory === 'all'}
              onClick={() => handleSelectAcademicCategory('all', true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                selectedAcademicCategory === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-2xs'
                  : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              All Industries
            </button>

            {ACADEMIC_CATEGORY_FILTERS.map((cat) => {
              const isSelected = selectedAcademicCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() =>
                    handleSelectAcademicCategory(isSelected ? 'all' : cat.key, true)
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-purple-400 dark:hover:border-purple-600'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleSelectAcademicCategory(selectedAcademicCategory, true)}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            title="Jump to Academic Qualifications section"
          >
            <span>
              {selectedAcademicCategory === 'all'
                ? 'View Qualifications'
                : `${selectedAcademicCategory} Track`}
            </span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Unified Platform Header & Sub-Navigation */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 transition-colors shadow-2xs -mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 pb-2 border-b border-stone-100 dark:border-stone-800 gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={TTG_LOGO_URL}
                alt="Tsoaela Training Ground Platform Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-auto rounded-lg object-contain bg-white px-1 py-0.5 ring-1 ring-stone-200 dark:ring-stone-700 shadow-xs shrink-0"
              />
              <div>
                <h2 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  TTG Education Platform
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Compiled Institutional Learning Center: Educare, Research, Digital World, Careers & Retreats
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'velocity' as const, label: 'Learning Velocity', icon: BarChart3 },
                { id: 'leaderboard' as const, label: 'Course Leaderboards', icon: Trophy },
                { id: 'roadmap' as const, label: 'Career Roadmap', icon: Map },
                { id: 'workflow' as const, label: 'Accreditation Workflow', icon: ShieldCheck },
              ].map((panel) => {
                const PanelIcon = panel.icon;
                const active = activeInsightPanel === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() =>
                      setActiveInsightPanel((prev) => (prev === panel.id ? 'none' : panel.id))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      active
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <PanelIcon className="w-3.5 h-3.5" />
                    <span>{panel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = subTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-white/20 dark:bg-stone-900/20 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Persistent Pomodoro Study Session Timer (Active across all EducationPlatformHub tabs) */}
      <PomodoroStudyTimer
        phase={pomodoro.phase}
        isRunning={pomodoro.isRunning}
        remainingSeconds={pomodoro.remainingSeconds}
        totalPhaseSeconds={pomodoro.totalPhaseSeconds}
        elapsedFocusMinutes={pomodoro.elapsedFocusMinutes}
        linkedGuideId={pomodoro.linkedGuideId}
        cycleCount={pomodoro.cycleCount}
        config={pomodoro.config}
        syncedFocusMinutes={pomodoro.syncedFocusMinutes}
        completedSessions={pomodoro.completedSessions}
        sessionLogs={pomodoro.sessionLogs}
        studyGuides={studyGuides}
        onStartPause={pomodoro.startPause}
        onReset={pomodoro.resetTimer}
        onSelectPhase={pomodoro.selectPhase}
        onSkipPhase={pomodoro.skipPhase}
        onSelectGuide={pomodoro.setLinkedGuideId}
        onUpdateConfig={pomodoro.updateConfig}
        onSyncSession={pomodoro.syncElapsedFocusSession}
        onOpenActivityDashboard={onOpenActivityDashboard}
      />

      {/* Expandable Hub Insights Drawer (keeps study workspace uncluttered) */}
      {activeInsightPanel !== 'none' && (
        <div className="space-y-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveInsightPanel('none')}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Minimize Panel</span>
            </button>
          </div>

          {activeInsightPanel === 'velocity' && (
            <LearningVelocityPanel
              studyGuides={studyGuides}
              readingProgress={readingProgress}
            />
          )}

          {activeInsightPanel === 'leaderboard' && studyGuides.length > 0 && activeLeaderboardGuide && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Study Guide Course Leaderboards
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Top 5 quiz performers per study guide — restricted to students enrolled in each course
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {studyGuides.map((g) => {
                      const isSelected = g.id === activeLeaderboardGuide.id;
                      const enrolledInThisGuide =
                        isAuthenticated &&
                        enrollments.some(
                          (e) =>
                            e.courseId === g.id &&
                            (e.studentEmail.toLowerCase() === user.email.toLowerCase() ||
                              e.studentName.toLowerCase() === user.name.toLowerCase())
                        );
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setLeaderboardGuideId(g.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                            isSelected
                              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                              : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                          }`}
                        >
                          <span>{g.title.length > 26 ? `${g.title.slice(0, 26)}…` : g.title}</span>
                          <span className="ml-1.5 font-mono text-[10px] opacity-75">
                            {enrolledInThisGuide ? 'Enrolled' : 'Locked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <CourseLeaderboardWidget
                  studyGuide={activeLeaderboardGuide}
                  enrollments={enrollments}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  readingProgress={readingProgress}
                  onRequireAuth={onRequireAuth}
                  onEnrollInCourse={onEnrollInCourse}
                />
              </div>
            </div>
          )}

          {activeInsightPanel === 'roadmap' && (
            <CareerRoadmapPanel
              studyGuides={studyGuides}
              readingProgress={readingProgress}
              onNavigateToGuide={(guideId) => {
                setRoadmapTargetGuideId(guideId);
                setSubTab('educare');
              }}
              onOpenCareersTab={() => setSubTab('careers')}
              onExploreAcademicCategory={(cat) => handleSelectAcademicCategory(cat, true)}
            />
          )}

          {activeInsightPanel === 'workflow' && (
            <AccreditationWorkflowSection
              onOpenAccreditationModal={onOpenAccreditation}
              onJumpToQualifications={() => {
                setActiveInsightPanel('none');
                handleSelectAcademicCategory('all', true);
              }}
            />
          )}
        </div>
      )}

      {/* Render Selected Educational Module */}
      <div className="animate-fade-in">
        {subTab === 'educare' && (
          <div className="space-y-8">
            <EducareTab
              user={user}
              studyGuides={studyGuides}
              readingProgress={readingProgress}
              onUpdateProgress={onUpdateReadingProgress}
              onOpenReminders={onOpenReminders}
              onTriggerPaywall={onTriggerPaywall}
              onAddStudyGuide={onAddStudyGuide}
              onRemoveStudyGuide={onRemoveStudyGuide}
              targetGuideId={targetStudyGuideId || roadmapTargetGuideId || undefined}
              onClearTargetGuide={() => {
                onClearTargetGuide?.();
                setRoadmapTargetGuideId(null);
              }}
              onOpenExportReport={onOpenExportReport}
              onOpenAcademicPrompts={onOpenAcademicPrompts}
              onOpenAccreditation={onOpenAccreditation}
              onApplyQualification={onApplyQualification}
              pendingEditorDocument={pendingEditorDocument}
              onClearPendingDocument={onClearPendingDocument}
              onStartStudyRoom={onStartStudyRoom}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
              onSubmitAssignment={onSubmitAssignment}
              offlineAssignments={offlineAssignments}
              enrollments={enrollments}
              onEnrollInCourse={onEnrollInCourse}
              selectedAcademicCategory={selectedAcademicCategory}
              onSelectAcademicCategory={(cat) => handleSelectAcademicCategory(cat, false)}
              savedProgramIds={savedProgramIds}
              onToggleSaveProgram={onToggleSaveProgram}
              comparedProgramIds={comparedProgramIds}
              onToggleCompareProgram={onToggleCompareProgram}
              onClearComparedPrograms={onClearComparedPrograms}
              onOpenCompareModal={onOpenCompareModal}
              onOpenSavedProgramsProfile={onOpenSavedProgramsProfile}
              onOpenStudentFeedback={onOpenStudentFeedback}
              onActiveStudyContextChange={onActiveStudyContextChange}
            />

            {activeInsightPanel !== 'workflow' && (
              <AccreditationWorkflowSection
                onOpenAccreditationModal={onOpenAccreditation}
                onJumpToQualifications={() => handleSelectAcademicCategory('all', true)}
              />
            )}
          </div>
        )}

        {subTab === 'community' && (
          <CommunityFeedTab
            user={user}
            isAuthenticated={isAuthenticated}
            onRequireAuth={onRequireAuth}
            onNavigateToCourse={(guideId) => {
              const guide = studyGuides.find(g => g.id === guideId);
              if (guide) {
                setSubTab('educare');
              }
            }}
            onStartStudyRoom={onStartStudyRoom}
          />
        )}

        {subTab === 'research' && (
          <ResearchCornerTab
            user={user}
            researchPapers={researchPapers}
            onOpenReminders={onOpenReminders}
            onTriggerPaywall={onTriggerPaywall}
            targetPaperId={targetResearchPaperId || undefined}
            onClearTargetPaper={onClearTargetPaper}
          />
        )}

        {subTab === 'digital_world' && (
          <DigitalWorldTab
            user={user}
            readingProgress={readingProgress}
            onUpdateProgress={onUpdateReadingProgress}
            onOpenReminders={onOpenReminders}
            onOpenPaywall={onTriggerPaywall}
          />
        )}

        {subTab === 'careers' && (
          <CareersTab user={user} />
        )}

        {subTab === 'retreats' && (
          <RetreatsTab
            events={retreatEvents}
            bookings={bookings}
            user={user}
            onInitiateBookingCheckout={onInitiateBookingCheckout}
            onViewReceipt={onViewReceipt || (() => {})}
            targetEventId={targetRetreatEventId || undefined}
            onClearTargetEvent={onClearTargetEvent}
          />
        )}
      </div>

    </div>
  );
};
