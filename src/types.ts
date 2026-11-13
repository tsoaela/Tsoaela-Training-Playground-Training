export type SubscriptionTier = 'free' | 'educare_pro' | 'research_pass' | 'all_access';

export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export type UserRole = 'student' | 'instructor' | 'artist' | 'photographer' | 'videographer' | 'author' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
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
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  minScoreToPass: number;
  badgeId?: string;
}

export interface CourseCertificateSpec {
  id: string;
  categoryKey: string;
  credentialTitle: string;
  subtitle: string;
  distinctionLabel: string;
  credentialCodePrefix: string;
  accreditor: string;
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

export interface ReadingProgress {
  guideId: string;
  completedChapters: number[];
  progressPercent: number;
  lastReadDate: string;
  isCompleted: boolean;
  notes?: string;
  quizScores?: Record<string, number>;
  unlockedBadges?: string[];
  completionLog?: {
    chapterIdx: number;
    completedAt: string;
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
  hasStems?: boolean;
  description: string;
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
}

export type BackgroundSyncStatus = 'idle' | 'queued_offline' | 'syncing' | 'synced' | 'error';


