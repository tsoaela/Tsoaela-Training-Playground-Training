export type ThemeMode = 'system' | 'light' | 'dark';

export type SubscriptionTier = 'free' | 'educare_pro' | 'research_pass' | 'all_access';

export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export type UserRole = 'student' | 'instructor' | 'artist' | 'photographer' | 'videographer' | 'author' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  photoUrl?: string;
  authProvider?: 'google' | 'password' | 'demo';
  institution?: string;
  specialization?: string;
  bio?: string;
  subscription_tier: SubscriptionTier;
  plan_status: 'Active' | 'Past Due' | 'Canceled' | 'None';
  renewal_date: string;
  billing_interval: 'monthly' | 'annual' | 'yearly';
  payment_method: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

export interface PomodoroIntervalConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartNext: boolean;
}

export interface PomodoroSessionLog {
  id: string;
  phase: PomodoroPhase;
  durationMinutes: number;
  guideTitle?: string;
  completedAt: string;
}

export interface Booking {
  id: string;
  event_id: string;
  event_title: string;
  location: string;
  dates: string;
  ticket_type: 'Virtual Pass' | 'In-Person Ticket' | 'VIP In-Person';
  attendee_name: string;
  attendee_email: string;
  seats: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  booking_date: string;
  payment_intent: string;
  qr_code_ref: string;
}

export interface InvoiceReceipt {
  id: string;
  invoice_number: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  category: 'Subscription' | 'Retreat Booking';
  payment_method: string;
  payment_intent_id: string;
  pdf_url?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface RetreatEvent {
  id: string;
  title: string;
  slug: string;
  location: string;
  country: string;
  dates: string;
  duration: string;
  image_url: string;
  tagline: string;
  description: string;
  virtual_price: number;
  in_person_price: number;
  available_seats: number;
  total_seats: number;
  key_modules: string[];
  faculty: string[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  chapterIdx?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  minScoreToPass: number;
  badgeId?: string;
}

export type AccreditationTier = 'accredited_internal' | 'accredited_external';

export interface CourseCertificateSpec {
  id: string;
  categoryKey: string;
  credentialTitle: string;
  subtitle: string;
  distinctionLabel: string;
  credentialCodePrefix: string;
  accreditor: string;
  accreditationTier?: AccreditationTier;
  w3cStandard?: string;
  sealTitle: string;
  competencies: string[];
  texturePattern: 'guilloche' | 'botanical_lattice' | 'hex_mesh' | 'harmonic_waves';
  accentTone: string;
}

export interface StudyGuide {
  id: string;
  title: string;
  category: string;
  field?: string;
  reading_time: string;
  difficulty: 'Foundational' | 'Executive' | 'Advanced';
  is_premium: boolean;
  is_ai_generated?: boolean;
  is_accredited: boolean;
  accreditor_name?: string;
  duration_type: 'short_term' | 'long_term';
  duration_label: string;
  course_price_zar?: number;
  pacing_mode?: 'self_paced';
  professional_level?: 'foundational' | 'intermediate' | 'professional';
  quizzes?: Quiz[];
  abstract: string;
  learning_outcomes: string[];
  chapters: {
    title: string;
    content: string;
  }[];
  certificate?: CourseCertificateSpec;
}

export interface ResearchPaper {
  id: string;
  title: string;
  publication_date: string;
  category: string;
  field?: string;
  pages: number;
  is_premium: boolean;
  is_ai_generated?: boolean;
  is_accredited: boolean;
  accreditor_name?: string;
  author: string;
  abstract: string;
  methodology: string;
  key_takeaways: string[];
  metric_summary: {
    label: string;
    value: string;
    delta?: string;
  }[];
}

export interface ChapterQuizPerformance {
  chapterIdx: number;
  chapterTitle?: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

export interface QuizAttemptEntry {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  minScoreToPass: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  attemptedAt: string;
  weakChapterIndices?: number[];
  chapterBreakdown?: ChapterQuizPerformance[];
}

export interface ReadingProgressUpdateOptions {
  chapterNote?: {
    chapterIdx: number;
    notes: string;
  };
  quizAttempt?: Omit<QuizAttemptEntry, 'id' | 'attemptedAt'>;
  touchAccessOnly?: boolean;
  activeChapterIdx?: number;
}

export interface ReadingProgress {
  guideId: string;
  completedChapters: number[];
  progressPercent: number;
  lastReadDate: string;
  lastAccessedAt?: string;
  isCompleted: boolean;
  studyTimeSeconds?: number;
  activeChapterIdx?: number;
  notes?: string;
  chapterNotes?: Record<number, string>;
  quizScores?: Record<string, number>;
  quizHistory?: QuizAttemptEntry[];
  unlockedBadges?: string[];
  completionLog?: {
    chapterIdx: number;
    completedAt: string;
    notes?: string;
  }[];
}

export interface Reminder {
  id: string;
  title: string;
  targetTitle: string;
  type: 'study_guide' | 'retreat' | 'general' | 'digital_education';
  date: string;
  time: string;
  frequency: 'Daily' | 'Weekly' | 'Once';
  isEnabled: boolean;
  notes?: string;
}

export type ArtMediaType = 'music' | 'visuals' | 'mural';

export interface MediaStreamItem {
  id: string;
  title: string;
  artist: string;
  mediaType: ArtMediaType;
  genreOrStyle: string;
  durationOrStreamStatus: string;
  loudnessLUFS?: number;
  sampleRate?: string;
  resolution?: string;
  fps?: number;
  location?: string;
  dimensions?: string;
  description: string;
  curatorNotes: string;
  tags: string[];
  educationalModuleId?: string;
  audioFrequencyHz?: number;
  accentColor?: string;
}

export interface EducationLesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  keyTakeaways: string[];
  content: string;
}

export interface EducationCourse {
  id: string;
  title: string;
  platformDomain: 'Music Streaming & Audio DSP' | 'Visuals & Motion Art' | 'Mural Art & Spatial Canvas' | 'Broadcast Engineering';
  level: 'Foundational' | 'Studio Master' | 'Executive Director';
  instructor: string;
  duration: string;
  duration_type: 'short_term' | 'long_term';
  is_accredited: boolean;
  accreditor_name?: string;
  lessonsCount: number;
  overview: string;
  learningOutcomes: string[];
  syllabus: EducationLesson[];
  relatedStreamId?: string;
  accentGradient: string;
  quizzes?: Quiz[];
  certificate?: CourseCertificateSpec;
}

export interface BroadcastTelemetry {
  status: 'ON AIR' | 'STANDBY' | 'FAILOVER';
  latencyMs: number;
  activeSource: string;
  bitrateMbps: number;
  currentLUFS: number;
  packetLoss: number;
  uptime: string;
  audioDuckingActive: boolean;
  abrProfile: '4K Master' | '1440p High' | '1080p Standard' | '720p Mobile';
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  field: string;
  salary_range?: string;
  posted_date: string;
  description: string;
  requirements: string[];
}

export interface CareerExhibition {
  id: string;
  title: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  field: string;
  description: string;
  registration_url?: string;
}

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  image_url?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  total_score: number;
  badges_count: number;
  completed_courses: number;
  rank: number;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  media_type: 'music' | 'video' | 'photo' | 'book' | 'pdf' | 'template';
  file_url: string;
  file_size: string;
  preview_url?: string;
  is_premium: boolean;
  download_count: number;
}

export interface StudyActivity {
  day: string;
  intensity: number; // 0-10
  date: string;
}

export interface AuthorDocument {
  id: string;
  title: string;
  content: string;
  format: 'text' | 'word' | 'pdf';
  last_modified: string;
  word_count: number;
}

// ----------------------------------------------------
// Multi-Modal Media Stores & Marketplace Types
// ----------------------------------------------------

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  coverUrl: string;
  duration: string; // e.g. "3:45"
  durationSeconds: number;
  genre: string;
  price: number; // e.g. 5.99, 7.99, 9.99
  previewUrl?: string;
  audioUrl?: string;
  bpm?: number;
  key?: string;
  plays: number;
  likes: number;
  releaseDate: string;
  isrc?: string;
  format: 'WAV 24-bit 96kHz' | 'FLAC' | 'MP3 320kbps';
  hasMultitracks?: boolean;
  description: string;
}

export type MusicLicenseTier = 'Personal Master' | 'Multitrack + Master' | 'Commercial Sync';

export type MusicAudioLayer = 'master' | 'melody' | 'bass' | 'percussion';

export interface MusicCartItem {
  trackId: string;
  licenseTier: MusicLicenseTier;
  unitPrice: number;
}

export interface PurchasedMusicRecord {
  trackId: string;
  licenseTier: MusicLicenseTier;
  purchasedAt: string;
  invoiceNumber: string;
  pricePaid: number;
}

export type ArtPlatformId = 'music' | 'photography' | 'videography' | 'bookstore' | 'digital_art';

export type PayoutMethodType =
  | 'Stripe Connect Express'
  | 'Bank Wire / ACH'
  | 'PayPal Business'
  | 'Instant EFT / Mobile Money';

export interface CreatorPayoutAccount {
  id: string;
  accountHolderName: string;
  method: PayoutMethodType;
  institutionName: string;
  routingOrSwiftCode: string;
  accountNumberMasked: string;
  payoutEmail: string;
  currency: 'USD' | 'ZAR' | 'EUR' | 'GBP';
  taxEntityType: 'Individual Creator' | 'Registered Studio / PTY';
  status: 'Verified & Active';
  createdAt: string;
}

export interface ServiceAgreementAcceptance {
  accepted: boolean;
  version: string;
  acceptedBy: string;
  acceptedAt: string;
  signatureText: string;
  feeThresholdSales: number;
  feeRateAfterThreshold: number;
}

export interface CreatorStoreProfile {
  id: string;
  ownerUserId: string;
  platform: ArtPlatformId;
  storeName: string;
  handle: string;
  artistName: string;
  tagline: string;
  bio: string;
  location: string;
  website?: string;
  specialty: string;
  isStoreActive: boolean;
  payoutAccount: CreatorPayoutAccount | null;
  agreement: ServiceAgreementAcceptance | null;
  completedSalesCount: number;
  grossRevenue: number;
  creatorNetEarnings: number;
  siteOwnerServiceFeesPaid: number;
  createdAt: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  photographer: string;
  photographerId?: string;
  category: 'Landscape' | 'Architecture' | 'Street & Urban' | 'Aerial & Drone' | 'Fine Art' | 'Portrait';
  imageUrl: string;
  highResUrl?: string;
  resolution: string; // e.g. "6240 × 4160"
  megapixels: number; // e.g. 26, 48, 61
  dpi: number; // e.g. 300
  camera: string; // e.g. "Sony A7R V"
  lens?: string;
  focalLength?: string;
  aperture?: string;
  iso?: number;
  shutterSpeed?: string;
  pricePersonal: number; // e.g. 9.99
  priceCommercial: number; // e.g. 29.99
  priceExtended: number; // e.g. 79.99
  orientation: 'landscape' | 'portrait' | 'square';
  downloads: number;
  likes: number;
  tags: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  creator: string;
  creatorId?: string;
  duration: string; // e.g. "0:45", "12:30"
  durationSeconds: number;
  resolution: '4K UHD (3840×2160)' | '6K B-Roll (6144×3456)' | '8K Master (7680×4320)' | '1080p FHD';
  fps: 24 | 30 | 60 | 120;
  codec: 'Apple ProRes 422 HQ' | 'Apple ProRes RAW' | 'H.265 / HEVC 10-bit' | 'REDCODE RAW';
  category: 'Cinematic B-Roll' | 'Drone & Aerial' | 'Masterclass & Tutorial' | 'Documentary Short' | 'Nature & Biomes';
  thumbnailUrl: string;
  videoUrl?: string;
  priceStandard: number; // e.g. 19.99
  priceBroadcast: number; // e.g. 49.99
  aspectRatio: '16:9' | '2.39:1 Anamorphic' | '9:16 Vertical';
  fileSizeBytes: string; // e.g. "1.8 GB"
  downloads: number;
  tags: string[];
  description: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  genre: 'Cognitive Science' | 'Systems Architecture' | 'Cybernetics & AI' | 'Sovereign Economics' | 'Philosophy' | 'Speculative Fiction' | 'Health & Medical Sciences' | 'Science & Agriculture' | 'Education & Pedagogy' | 'Law & Commerce';
  coverUrl: string;
  synopsis: string;
  pages: number;
  isbn: string;
  publicationYear: number;
  rating: number; // e.g. 4.9
  reviewCount: number;
  priceEbook: number; // e.g. 7.99
  pricePrint: number; // e.g. 19.99
  priceAudiobook?: number; // e.g. 14.99
  formats: ('eBook (EPUB/PDF)' | 'Audiobook' | 'Collector Paperback')[];
  sampleChapterTitle: string;
  sampleChapterText: string;
  tableOfContents: string[];
  authorBio: string;
  faculty?: string; // Course Faculty Category (e.g. "Faculty of Frontier AI & Search Theory")
  courseCode?: string; // e.g. "FAC-AI-101"
  syllabusAlignment?: string;
}

export type ApplicationCategory = 
  | 'course_educare' 
  | 'research_fellowship' 
  | 'music_artist' 
  | 'photographer' 
  | 'videographer' 
  | 'book_author' 
  | 'retreat_delegate';

export interface ApplicationPrefillData {
  category?: ApplicationCategory;
  facultyId?: string;
  departmentId?: string;
  programName?: string;
  trackId?: string;
  qualificationLevel?: string;
  statementNote?: string;
}

export interface CategoryRegistration {
  id: string;
  category: ApplicationCategory;
  categoryTitle: string;
  applicantName: string;
  applicantEmail: string;
  trackType: string;
  qualificationLevel: string;
  accreditor: string;
  status: 'Approved & Enrolled' | 'Under Institutional Review' | 'Verified';
  registrationDate: string;
  registrationNumber: string;
  statementOfIntent?: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
  role: UserRole;
  authToken: string;
}

export type CommunityPostTag = 
  | 'Academic Update' 
  | 'Project Showcase' 
  | 'Discussion Thread' 
  | 'Peer Review' 
  | 'Research Thesis';

export interface CommunityComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  tag: CommunityPostTag;
  facultyCategory?: string;
  relatedCourseId?: string;
  relatedCourseTitle?: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  comments: CommunityComment[];
  pinned?: boolean;
  projectUrl?: string;
  codeSnippet?: string;
}

export interface StudyGroupPeer {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  isHost?: boolean;
  avatarBg: string;
}

export interface StudyGroupRoom {
  id: string;
  courseId: string;
  courseTitle: string;
  hostName: string;
  hostEmail: string;
  title: string;
  description: string;
  activeTopic: string;
  maxParticipants: number;
  createdAt: string;
  peers: StudyGroupPeer[];
}

export type NotificationType = 'assignment_graded' | 'chapter_added' | 'study_group_started';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  courseId: string;
  courseTitle: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    score?: number;
    assignmentTitle?: string;
    feedback?: string;
    chapterTitle?: string;
    hostName?: string;
    topic?: string;
  };
}

export interface PeerReviewEntry {
  id: string;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole?: UserRole;
  rating: number; // 1-5 constructive rubric score
  strengths: string;
  improvements: string;
  critique: string;
  createdAt: string;
}

export interface CourseModuleFeedback {
  id: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  moduleIndex: number;
  moduleTitle: string;
  difficultyRating: number; // 1 (Too Easy) - 5 (Very Challenging)
  clarityRating: number; // 1 (Unclear) - 5 (Crystal Clear)
  focusArea: 'Difficulty' | 'Clarity' | 'Both';
  comment: string;
  createdAt: string;
}

export interface EnrolledStudentRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  facultyName: string;
  qualificationLevel: string;
  enrolledDate: string;
  progressPercent: number;
  testScore?: number;
  assignmentTitle: string;
  assignmentStatus: 'Pending Grading' | 'Graded' | 'Not Submitted';
  assignmentScore?: number;
  instructorFeedback?: string;
  subjectScores?: Record<string, number>;
  peerReviews?: PeerReviewEntry[];
  courseFeedback?: CourseModuleFeedback[];
}

export interface OfflineAssignmentSubmission {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  content: string;
  completedOffline: boolean;
  submittedAt: string;
  syncedToDatabase: boolean;
  syncedAt?: string;
}

export type SyncQueueItemType = 'study_progress' | 'assignment_submission';

export interface SyncQueueItem {
  id: string;
  type: SyncQueueItemType;
  userId: string;
  courseId: string;
  queuedAt: string;
  retryCount: number;
  progressPayload?: ReadingProgress;
  assignmentPayload?: OfflineAssignmentSubmission;
  unsyncedNoteChapterIndices?: number[];
}

export type BackgroundSyncStatus = 'idle' | 'queued_offline' | 'syncing' | 'synced' | 'error';

export interface SavedAcademicProgram {
  qualificationId: string;
  qualificationType: string;
  level: 'Undergraduate' | 'Postgraduate' | 'Doctoral';
  categoryKey: 'Engineering' | 'Business' | 'Health' | 'Science' | 'Humanities' | 'Education';
  facultyId: string;
  facultyName: string;
  typicalDuration: string;
  nqfCredits: string;
  entryRequirement: string;
  academicFocus: string;
  assessmentFormat: string;
  progressionPath: string;
  coreModules: string[];
  savedAt: string;
}

export type QctoModuleType = 'Knowledge Module' | 'Practical Skill Module' | 'Work Experience Module';

export interface QctoModuleBreakdown {
  code: string;
  type: QctoModuleType;
  shortType: 'KM' | 'PM' | 'WM';
  title: string;
  nqfLevel: number;
  credits: number;
  notionalHours: number;
  purpose: string;
  topics: string[];
  assessmentEvidence: string[];
  learningOutcomeAlignment?: string;
}

export interface QctoSkillsProgrammeBlueprint {
  courseId: string;
  courseTitle: string;
  programmeTitle: string;
  qualificationType: 'Occupational Skills Programme (QCTO Aligned Blueprint)';
  suggestedOfoCode: string;
  nqfLevel: number;
  saqaCredits: number;
  totalNotionalHours: number;
  durationLabel: string;
  studyModeSummary: string;
  entryRequirements: string[];
  purposeStatement: string;
  accreditationStatusDisclosure: string;
  componentSummary: {
    knowledgeCredits: number;
    knowledgeHours: number;
    practicalCredits: number;
    practicalHours: number;
    workplaceCredits: number;
    workplaceHours: number;
  };
  modules: QctoModuleBreakdown[];
  eisaReadinessChecklist: string[];
  recommendedSdpPath: string[];
}

export interface FocusAiRecommendationItem {
  guideId: string;
  courseTitle: string;
  recommendationType: 'chapter' | 'quiz' | 'review';
  priority: 'High' | 'Medium' | 'Foundational';
  targetLabel: string;
  rationale: string;
  estimatedMinutes: number;
  expectedImpact: string;
}

export interface FocusAiAnalysisResult {
  generatedAt: string;
  modelUsed: string;
  coachHeadline: string;
  performanceTrendSummary: string;
  studyCadenceTip: string;
  recommendations: FocusAiRecommendationItem[];
}

export interface TutorExplainResponse {
  mode: 'explain' | 'breakdown' | 'custom';
  summary: string;
  explanation: string;
  keyConcepts: string[];
  studyCheckQuestion: string;
  modelUsed: string;
  generatedAt: string;
}

export interface TutorChatMessage {
  id: string;
  role: 'user' | 'tutor';
  highlightedText?: string;
  userPrompt: string;
  mode?: 'explain' | 'breakdown' | 'custom';
  courseContext?: string;
  summary?: string;
  explanation: string;
  keyConcepts?: string[];
  studyCheckQuestion?: string;
  timestamp: string;
  isError?: boolean;
}

// ----------------------------------------------------
// Certificate Verification Ledger, Appeals & Real-Time Study Telemetry
// ----------------------------------------------------

export type CertificateVerificationStatus = 'verified' | 'under_appeal' | 'revoked';

export interface OpenBadgeVerifiableCredential {
  '@context': string[];
  id: string;
  type: ['VerifiableCredential', 'OpenBadgeCredential'];
  issuer: {
    id: string;
    type: 'Profile';
    name: string;
    url: string;
  };
  issuanceDate: string;
  credentialSubject: {
    id: string;
    type: 'AchievementSubject';
    recipientName: string;
    achievement: {
      id: string;
      type: 'Achievement';
      name: string;
      description: string;
      criteriaNarrative: string;
      courseTitle: string;
      progressPercent: number;
      quizScore?: number;
    };
  };
  proof: {
    type: 'DataIntegrityProof';
    cryptosuite: 'hmac-sha256-ttg-ledger-v1';
    created: string;
    verificationMethod: string;
    proofPurpose: 'assertionMethod';
    proofValue: string;
  };
}

export interface VerifiedCertificateRecord {
  serialNumber: string;
  courseId: string;
  courseTitle: string;
  categoryKey: string;
  credentialTitle: string;
  accreditor: string;
  accreditationTier?: AccreditationTier;
  recipientName: string;
  recipientEmail: string;
  userId: string;
  issueDate: string;
  issuedAt: string;
  progressPercent: number;
  quizScore?: number;
  status: CertificateVerificationStatus;
  signatureHash: string;
  signatureAlgorithm: 'HMAC-SHA256';
  revocationReason?: string;
  openBadgeCredential?: OpenBadgeVerifiableCredential;
}

export interface TaiOneW3CAccreditationRecord {
  id: string;
  serialNumber: string;
  accreditationTier: AccreditationTier;
  authorityName: string;
  issuerDid: string;
  programTitle: string;
  courseId?: string;
  categoryKey: string;
  recipientName: string;
  recipientEmail: string;
  organizationName: string;
  nqfCreditsReference: string;
  w3cSpecVersion: 'W3C Verifiable Credentials v2.0 · Open Badges 3.0';
  issuedAt: string;
  issueDate: string;
  validUntil: string;
  signatureHash: string;
  status: 'active' | 'revoked';
  w3cVerifiableCredential: {
    '@context': string[];
    id: string;
    type: string[];
    issuer: {
      id: string;
      type: string;
      name: string;
      url: string;
      accreditationTier: AccreditationTier;
    };
    validFrom: string;
    validUntil: string;
    credentialSubject: {
      id: string;
      type: string;
      recipientName: string;
      organizationName: string;
      accreditationTier: AccreditationTier;
      programTitle: string;
      categoryKey: string;
      nqfCreditsReference: string;
      complianceStandards: string[];
    };
    proof: {
      type: 'DataIntegrityProof';
      cryptosuite: 'hmac-sha256-tai-one-w3c-v2';
      created: string;
      verificationMethod: string;
      proofPurpose: 'assertionMethod';
      proofValue: string;
    };
  };
}

export type AppealCategory =
  | 'Grade & Assessment Dispute'
  | 'Certificate Verification Dispute'
  | 'External Regulatory Escalation'
  | 'Completion Credit Discrepancy';

export type AppealStatus =
  | 'Submitted'
  | 'Under Moderator Review'
  | 'Resolved - Approved'
  | 'Resolved - Upheld';

export interface LearnerAppealRecord {
  id: string;
  userId: string;
  appellantName: string;
  appellantEmail: string;
  courseId: string;
  courseTitle: string;
  certificateSerial?: string;
  category: AppealCategory;
  subject: string;
  statement: string;
  evidenceSummary: string;
  requestedResolution: string;
  status: AppealStatus;
  submittedAt: string;
  slaDueDate: string;
  updatedAt: string;
  reviewedBy?: string;
  moderatorNotes?: string;
  resolvedAt?: string;
}

export interface LiveStudySessionSnapshot {
  userId: string;
  courseId: string;
  courseTitle: string;
  activeChapterIdx: number;
  progressPercent: number;
  sessionSeconds: number;
  totalCourseStudySeconds: number;
  isActive: boolean;
  lastHeartbeatAt: string;
}

export interface RealtimeStudyTelemetry {
  isLiveActive: boolean;
  sseStatus: 'disconnected' | 'connecting' | 'live' | 'reconnecting';
  activeCourseId: string | null;
  activeCourseTitle: string | null;
  activeChapterIdx: number;
  sessionElapsedSeconds: number;
  totalCourseStudySeconds: number;
  lastHeartbeatAt: string | null;
}

// ----------------------------------------------------
// Registered Study Groups & Real-Time Shared Notes
// ----------------------------------------------------

export interface RegisteredStudyGroup {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string;
  topic: string;
  hostName: string;
  hostEmail: string;
  memberEmails: string[];
  memberNames: Record<string, string>;
  createdAt: string;
  activeAttendanceDates?: string[];
  attendanceByDate?: Record<string, string[]>;
}

export interface StudyRoomSharedNote {
  roomId: string;
  courseId: string;
  title: string;
  content: string;
  version: number;
  lastEditedBy: string;
  lastEditedByEmail?: string;
  lastEditedAt: string;
}

export interface StudyRoomActiveParticipant {
  clientId: string;
  userId: string;
  name: string;
  email: string;
  color: string;
  isTyping: boolean;
  cursorLine?: number;
  joinedAt: string;
  lastActiveAt: string;
}

// ----------------------------------------------------
// Deep Work Mode & Focus Intensity Telemetry
// ----------------------------------------------------

export interface DeepWorkSessionRecord {
  id: string;
  guideId: string;
  guideTitle: string;
  plannedMinutes: number;
  elapsedMinutes: number;
  status: 'completed' | 'interrupted';
  startedAt: string;
  endedAt: string;
  distractionsBlockedCount: number;
}

export interface DeepWorkState {
  isActive: boolean;
  isPaused: boolean;
  plannedMinutes: number;
  remainingSeconds: number;
  targetEndAt: number | null;
  linkedGuideId: string;
  startedAt: string | null;
  suppressedDistractionsCount: number;
  sessionsHistory: DeepWorkSessionRecord[];
}

export interface FocusIntensityMetrics {
  score: number; // 0 - 100
  tierLabel:
    | 'Peak Deep Flow'
    | 'High Focus'
    | 'Steady Cadence'
    | 'Building Momentum'
    | 'Interrupted · Rebuilding';
  sessionCompletionRate: number; // 0 - 100
  blockDepthScore: number; // 0 - 100
  distractionShieldScore: number; // 0 - 100
  completedSessionsCount: number;
  interruptedSessionsCount: number;
  avgCompletedBlockMinutes: number;
}

// ----------------------------------------------------
// Accepted & Registered Students + Faculty Lectures & Specialized Syllabuses
// ----------------------------------------------------

export type StudentAdmissionStatus =
  | 'Accepted'
  | 'Registered'
  | 'Accepted & Registered';

export interface AcceptedRegisteredStudent {
  id: string;
  registrationNumber: string;
  studentName: string;
  studentEmail: string;
  admissionStatus: StudentAdmissionStatus;
  facultyId: string;
  facultyName: string;
  departmentName: string;
  programName: string;
  qualificationLevel: string;
  assignedCourseId?: string;
  assignedCourseTitle?: string;
  leadLecturerName?: string;
  cohortTerm: string;
  acceptedDate: string;
  registeredDate?: string;
  accreditor: string;
  standingNotes?: string;
}

export type LectureDeliveryFormat =
  | 'Live Seminar & Lab'
  | 'Recorded Lecture Series'
  | 'Practicum & Case Colloquium';

export interface SpecializedLectureUnit {
  lectureNumber: number;
  unitCode: string;
  lectureTitle: string;
  duration: string;
  format: 'Keynote Lecture' | 'Technical Seminar' | 'Quantitative Lab' | 'Case Colloquium';
  synopsis: string;
  specializedTopics: string[];
  requiredReadingOrArtifact: string;
  deliverable: string;
}

export interface FacultyLectureSeries {
  id: string;
  lectureCode: string;
  title: string;
  specialization: string;
  facultyKey: 'Engineering' | 'Business' | 'Health' | 'Science' | 'Humanities' | 'Education';
  facultyName: string;
  departmentName: string;
  lecturerName: string;
  lecturerTitle: string;
  deliveryFormat: LectureDeliveryFormat;
  nqfLevel: string;
  totalDuration: string;
  scheduleSlot: string;
  linkedGuideId?: string;
  syllabusOverview: string;
  prerequisites: string[];
  assessmentModel: string;
  specializedSyllabus: SpecializedLectureUnit[];
}

export interface DailyStudyGoalMetrics {
  dailyGoalHours: number;
  todayTotalMinutes: number;
  todayTotalHours: number;
  pomodoroMinutesToday: number;
  deepWorkMinutesToday: number;
  activeLiveSecondsToday: number;
  completionPercent: number;
  remainingMinutes: number;
  surplusMinutes: number;
  isGoalMet: boolean;
}

export interface FocusedStudentRankEntry {
  id: string;
  studentName: string;
  studentEmail: string;
  facultyName: string;
  programName: string;
  weeklyAccumulatedIntensityScore: number;
  focusIntensityRating: number;
  weeklyDeepWorkMinutes: number;
  weeklySessionsCompleted: number;
  completionRatePercent: number;
  avgBlockMinutes: number;
  streakDays: number;
  tierLabel: FocusIntensityMetrics['tierLabel'];
  isCurrentUser: boolean;
  isCurrentlyFocusing?: boolean;
}
