import { 
  UserProfile, 
  RetreatEvent, 
  StudyGuide, 
  ResearchPaper, 
  Booking, 
  InvoiceReceipt, 
  ReadingProgress, 
  Reminder, 
  StudentBadge, 
  Quiz,
  JobListing,
  CareerExhibition,
  LeaderboardEntry,
  MediaItem,
  StudyActivity,
  AuthorDocument
} from '../types';
import badgeSystemsArchitectImg from '../assets/images/badge_systems_architect_1794551622317.jpg';
import badgeMechanismDesignerImg from '../assets/images/badge_mechanism_designer_1794551623514.jpg';
import badgeSwarmCommanderImg from '../assets/images/badge_swarm_commander_1794551622768.jpg';
import badgeSovereignDirectorImg from '../assets/images/badge_sovereign_director_1794551623923.jpg';
import { resolveCertificateByCategory } from './certificatesData';

export const INITIAL_USER: UserProfile = {
  id: 'user_88219',
  name: 'Tsoaelat S.',
  email: 'Tsoaelat.s@gmail.com',
  subscription_tier: 'free',
  plan_status: 'None',
  renewal_date: '2026-12-07',
  billing_interval: 'monthly',
  payment_method: {
    brand: 'Visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2028,
  },
};

export const RETREAT_EVENTS: RetreatEvent[] = [
  {
    id: 'ret_bali_2026',
    title: 'Deep Work & Strategic Mindset Sanctuary',
    slug: 'bali-strategic-mindset',
    location: 'Ubud Highlands, Indonesia',
    country: 'Indonesia',
    dates: 'October 14 – 20, 2026',
    duration: '7 Days / 6 Nights',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    tagline: 'Isolate. Deconstruct. Rebuild.',
    description: 'An intensive executive retreat designed to strip away operational noise and focus on first-principles cognitive architecture.',
    virtual_price: 490,
    in_person_price: 4800,
    available_seats: 8,
    total_seats: 25,
    key_modules: ['Systems Deconstruction', 'Mechanism Design', 'Executive Biometrics'],
    faculty: ['Dr. Evelyn Brand', 'Marcus Thorne'],
  },
];

const COMMUNITY_MENTOR_BADGE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="55%" stop-color="#052e16"/>
        <stop offset="100%" stop-color="#022c22"/>
      </radialGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bef264"/>
        <stop offset="50%" stop-color="#ca8a04"/>
        <stop offset="100%" stop-color="#84cc16"/>
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="28" fill="url(#bg)"/>
    <circle cx="128" cy="128" r="96" fill="none" stroke="url(#ring)" stroke-width="8"/>
    <circle cx="128" cy="128" r="80" fill="none" stroke="#a3e635" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M128 52 L144 96 L190 96 L153 124 L167 168 L128 141 L89 168 L103 124 L66 96 L112 96 Z" fill="url(#ring)" stroke="#022c22" stroke-width="3"/>
    <circle cx="92" cy="184" r="14" fill="#064e3b" stroke="#bef264" stroke-width="3"/>
    <circle cx="128" cy="188" r="17" fill="#052e16" stroke="#eab308" stroke-width="3"/>
    <circle cx="164" cy="184" r="14" fill="#064e3b" stroke="#bef264" stroke-width="3"/>
    <text x="128" y="232" text-anchor="middle" fill="#bef264" font-family="monospace" font-size="14" font-weight="bold">COMMUNITY MENTOR</text>
  </svg>`
)}`;

export const STUDENT_BADGES: StudentBadge[] = [
  { id: 'badge_systems_thinker', title: 'Systems Architect', description: 'Mastered first-principles systems deconstruction.', icon_name: 'Layers', rarity: 'Common', image_url: badgeSystemsArchitectImg },
  { id: 'badge_negotiation_pro', title: 'Mechanism Designer', description: 'Completed advanced behavioral game theory & consensus modules.', icon_name: 'Zap', rarity: 'Rare', image_url: badgeMechanismDesignerImg },
  { id: 'badge_ai_orchestrator', title: 'Swarm Commander', description: 'Expert in autonomous agent swarm & test-time search compute.', icon_name: 'Cpu', rarity: 'Epic', image_url: badgeSwarmCommanderImg },
  { id: 'badge_sovereign_director', title: 'Sovereign Director', description: 'Strategic mastery of institutional governance and infrastructure.', icon_name: 'Shield', rarity: 'Legendary', image_url: badgeSovereignDirectorImg },
  { id: 'badge_community_mentor', title: 'Community Mentor', description: 'Provided more than 10 constructive peer reviews in the Faculty Portal.', icon_name: 'Users', rarity: 'Epic', image_url: COMMUNITY_MENTOR_BADGE_SVG },
];

export const CATALOG_STATS = {
  curatedModules: 258,
  studyGuides: 1200,
  studyFields: 120,
  hasAiCourses: true,
  jobOpenings: 450,
  careerEvents: 12,
};

const DEFAULT_QUIZ: Quiz = {
  id: 'q_default',
  title: 'Foundational Knowledge Assessment',
  minScoreToPass: 70,
  questions: [
    { id: 'q1', text: 'What is the primary axiom of first-principles thinking?', options: ['Analogy-based reasoning', 'Fundamental deconstruction', 'Historical precedent', 'Market consensus'], correctAnswer: 1 },
    { id: 'q2', text: 'System boundaries misidentification often leads to:', options: ['Increased efficiency', 'Feedback delay cascades', 'Clear incentive alignment', 'Immediate revenue growth'], correctAnswer: 1 },
  ]
};

export const STUDY_GUIDES: StudyGuide[] = [
  {
    id: 'sg_ai_test_time_search',
    title: 'Large Reasoning Models (LRMs) & Test-Time Search Compute',
    category: 'AI Courses (AI Generated)',
    field: 'Frontier AI & Search Theory',
    reading_time: '45 min read',
    difficulty: 'Advanced',
    is_premium: true,
    is_ai_generated: true,
    is_accredited: true,
    accreditor_name: 'TAI-ONE AI Standards Board',
    duration_type: 'short_term',
    duration_label: '4 Months',
    professional_level: 'professional',
    quizzes: [
      {
        id: 'q_lrm_1',
        title: 'MCTS & Compute Allocation Quiz',
        minScoreToPass: 80,
        badgeId: 'badge_ai_orchestrator',
        questions: [
          { id: 'q1', text: 'What does MCTS stand for in reasoning models?', options: ['Memory Cache Tracking System', 'Monte Carlo Tree Search', 'Model Context Tuning Script', 'Multi-Core Task Scheduler'], correctAnswer: 1 },
          { id: 'q2', text: 'Which reward model type is preferred for reasoning chains?', options: ['Outcome-supervised', 'Process-supervised', 'Unsupervised', 'Linear regression'], correctAnswer: 1 },
        ]
      }
    ],
    abstract: 'Mathematical foundations of test-time compute allocation, Monte Carlo tree search (MCTS) over reasoning chains, and self-correction verifiers in frontier LRMs.',
    learning_outcomes: [
      'Scale inference-time compute dynamically as a function of problem hardness',
      'Deploy process-supervised reward models (PRMs) to prune faulty reasoning branches',
      'Optimize rollout budgets to maximize precision-at-k on formal verification tasks',
    ],
    chapters: [
      {
        title: '01. The Test-Time Compute Frontier',
        content: 'Pre-training scaling laws face physical datacenter thermal bounds and data exhaustion. The new scaling axis is inference-time search: allocating computational tokens to explore hypothesis trees before committing to an external response.',
      },
      {
        title: '02. Process Reward Models vs. Outcome Verification',
        content: 'Outcome supervision rewards answers even when step-by-step logic is flawed. Process-supervised verifiers score every intermediate reasoning step, preventing delusion cascades early in the execution graph.',
      },
      {
        title: '03. Algorithmic Implementation: Backtracking Heuristics',
        content: 'Constructing deterministic rollback checkpoints when reasoning perplexity surges. By caching intermediate KV states, we achieve sub-50ms branch recovery without re-generating preceding tokens.',
      },
    ],
    certificate: resolveCertificateByCategory({
      id: 'sg_ai_test_time_search',
      title: 'Large Reasoning Models (LRMs) & Test-Time Search Compute',
      category: 'AI Courses (AI Generated)',
      field: 'Frontier AI & Search Theory',
      accreditor: 'TAI-ONE AI Standards Board',
      outcomes: [
        'Scale inference-time compute dynamically as a function of problem hardness',
        'Deploy process-supervised reward models (PRMs) to prune faulty reasoning branches',
        'Optimize rollout budgets to maximize precision-at-k on formal verification tasks',
      ],
    }),
  },
  {
    id: 'sg_ai_swarm_consensus',
    title: 'Multi-Agent Swarm Orchestration & Consensus Protocols',
    category: 'AI Courses (AI Generated)',
    field: 'Distributed AI Systems',
    reading_time: '55 min read',
    difficulty: 'Advanced',
    is_premium: true,
    is_ai_generated: true,
    is_accredited: true,
    accreditor_name: 'Global Distributed Systems Institute',
    duration_type: 'short_term',
    duration_label: '6 Months',
    professional_level: 'professional',
    quizzes: [{ ...DEFAULT_QUIZ, id: 'q_swarm_1', title: 'Consensus & Mechanism Design Quiz', badgeId: 'badge_negotiation_pro' }],
    abstract: 'Byzantine fault-tolerant consensus mechanisms for autonomous agent swarms operating across distributed RPC APIs and financial ledgers.',
    learning_outcomes: [
      'Implement deterministic voting protocols across heterogeneous LLM agents',
      'Enforce zero-trust tool execution contracts with cryptographic audit trails',
      'Mitigate semantic drift across 100+ concurrent multi-agent task pipelines',
    ],
    chapters: [
      {
        title: '01. The Fallacy of Monolithic Agent Loops',
        content: 'Single-agent execution loops compound stochastic errors exponentially. Multi-agent systems achieve robustness only when structured with clear separation of duties: propose, critique, verify, and commit.',
      },
      {
        title: '02. Byzantine Consensus in Autonomous Swarms',
        content: 'When individual agents hallucinate or get partitioned, formal consensus algorithms (Raft-style leader election and quorum validation) guarantee state consistency before writing to persistent databases.',
      },
      {
        title: '03. Synthetic Benchmark: 10,000 Concurrent Tasks',
        content: 'Analyzing telemetry traces from real-world enterprise deployments. Multi-agent verification reduced catastrophic output failure from 8.4% to 0.04% across complex financial reconciliation tasks.',
      },
    ],
    certificate: resolveCertificateByCategory({
      id: 'sg_ai_swarm_consensus',
      title: 'Multi-Agent Swarm Orchestration & Consensus Protocols',
      category: 'AI Courses (AI Generated)',
      field: 'Distributed AI Systems',
      accreditor: 'Global Distributed Systems Institute',
      outcomes: [
        'Implement deterministic voting protocols across heterogeneous LLM agents',
        'Enforce zero-trust tool execution contracts with cryptographic audit trails',
        'Mitigate semantic drift across 100+ concurrent multi-agent task pipelines',
      ],
    }),
  },
  {
    id: 'sg_foundations_systems',
    title: 'Foundations of First-Principles Systems Thinking',
    category: 'Cognitive Models',
    field: 'Systems Engineering',
    reading_time: '25 min read',
    difficulty: 'Foundational',
    is_premium: false,
    is_accredited: true,
    accreditor_name: 'TTG Institutional Board',
    duration_type: 'short_term',
    duration_label: '3 Months',
    professional_level: 'foundational',
    quizzes: [{ ...DEFAULT_QUIZ, id: 'q_default', badgeId: 'badge_systems_thinker' }],
    abstract: 'Deconstructing complex operational knots by stripping assumptions down to fundamental physical truths and reasoning upwards.',
    learning_outcomes: [
      'Identify hidden semantic traps in legacy business models',
      'Map feedback loops, delays, and non-linear leverage points',
      'Construct boundary objects for multi-disciplinary consensus',
    ],
    chapters: [
      {
        title: '01. The Anatomy of First Principles',
        content: 'Reasoning by analogy is cognitively economical, but lethal in shifting market regimes. When you reason by first principles, you deliberately decompose a problem into its fundamental axioms—those that cannot be deduced any further—and build your analytical calculus upwards from scratch.',
      },
      {
        title: '02. System Boundaries and Delay Cascades',
        content: 'Most executive failures stem from misidentifying the boundary of the system. What appears to be an acute operational failure in sales or product delivery is frequently an upstream artifact of incentive misalignment or latency in feedback transmission.',
      },
      {
        title: '03. Operational Exercise: Root Cause Deconstruction',
        content: 'Select an intractable bottleneck in your primary operational mandate. Strip all proprietary jargon and historical precedents. Frame the problem purely in units of energy, time, information flow, and capital throughput.',
      },
    ],
    certificate: resolveCertificateByCategory({
      id: 'sg_foundations_systems',
      title: 'Foundations of First-Principles Systems Thinking',
      category: 'Cognitive Models',
      field: 'Systems Engineering',
      accreditor: 'TTG Institutional Board',
      outcomes: [
        'Identify hidden semantic traps in legacy business models',
        'Map feedback loops, delays, and non-linear leverage points',
        'Construct boundary objects for multi-disciplinary consensus',
      ],
    }),
  },
  {
    id: 'sg_long_term_leadership',
    title: 'Global Institutional Leadership & Sovereign Strategy',
    category: 'Executive Leadership',
    field: 'Institutional Governance',
    reading_time: '120 min read',
    difficulty: 'Executive',
    is_premium: true,
    is_accredited: true,
    accreditor_name: 'Sovereign Governance Council',
    duration_type: 'long_term',
    duration_label: '7 Years',
    professional_level: 'professional',
    quizzes: [{ ...DEFAULT_QUIZ, id: 'q_leadership_1', title: 'Sovereign Governance Assessment', badgeId: 'badge_sovereign_director' }],
    abstract: 'A multi-year curriculum for the next generation of institutional stewards. Covers long-term capital allocation, geopolitical risk shielding, and cultural legacy engineering.',
    learning_outcomes: [
      'Orchestrate 50-year planning horizons across volatile geopolitical shifts',
      'Engineer anti-fragile organizational cultures that survive leadership transitions',
      'Manage multi-billion dollar capital pools with sovereign-grade security',
    ],
    chapters: [
      {
        title: '01. The Seven-Year Horizon',
        content: 'Quarterly thinking is for speculators. Institutional stewards think in cycles of seven years or more. We examine how to align internal incentives with the slow-moving tectonic plates of structural change.',
      },
      {
        title: '02. Cultural Invariants',
        content: 'What parts of an organization must never change? Defining the moral and operational invariants that preserve institutional integrity across decades.',
      },
    ],
    certificate: resolveCertificateByCategory({
      id: 'sg_long_term_leadership',
      title: 'Global Institutional Leadership & Sovereign Strategy',
      category: 'Executive Leadership',
      field: 'Institutional Governance',
      accreditor: 'Sovereign Governance Council',
      outcomes: [
        'Orchestrate 50-year planning horizons across volatile geopolitical shifts',
        'Engineer anti-fragile organizational cultures that survive leadership transitions',
        'Manage multi-billion dollar capital pools with sovereign-grade security',
      ],
    }),
  },
];

export const JOB_LISTINGS: JobListing[] = [
  {
    id: 'job_1',
    title: 'AI Systems Architect',
    company: 'Frontier Labs',
    location: 'Zurich, Switzerland',
    type: 'Full-time',
    field: 'Distributed AI Systems',
    salary_range: '$180k - $240k',
    posted_date: '2026-11-05',
    description: 'Leading the design of test-time compute clusters for frontier reasoning models.',
    requirements: ['Mastery of Distributed Systems', 'Experience with MCTS/PRMs', 'Sovereign Infra Knowledge'],
  },
  {
    id: 'job_2',
    title: 'Cognitive Performance Lead',
    company: 'TTG Bio-Performance Group',
    location: 'Kyoto, Japan',
    type: 'Contract',
    field: 'Cognitive Physiology',
    salary_range: '$12k - $15k / mo',
    posted_date: '2026-11-01',
    description: 'Implementing executive biometrics protocols for C-suite operators.',
    requirements: ['Neuroscience Degree', 'HRV Telemetry Experience', 'Japanese/English Fluency'],
  },
  {
    id: 'job_3',
    title: 'Infrastructure Strategist',
    company: 'Sovereign Advisory Group',
    location: 'Remote / Nordic Edge',
    type: 'Full-time',
    field: 'Sovereign Infrastructure',
    salary_range: '$150k - $210k',
    posted_date: '2026-10-28',
    description: 'Evaluating nuclear SMR colocations for state-level compute grids.',
    requirements: ['Energy Market Analysis', 'Nuclear Regulatory knowledge', 'Strategic Planning'],
  },
];

export const CAREER_EXHIBITIONS: CareerExhibition[] = [
  {
    id: 'ex_1',
    title: 'Frontier AI Career Symposium',
    organizer: 'TAI-ONE Education',
    date: '2026-12-15',
    time: '10:00 AM - 4:00 PM',
    location: 'Virtual / TAI-ONE Studio',
    field: 'Frontier AI & Search Theory',
    description: 'A curated gathering of leading AI labs recruiting from the Educare Pro pool.',
  },
  {
    id: 'ex_2',
    title: 'Institutional Governance Fair',
    organizer: 'Sovereign Governance Council',
    date: '2027-01-20',
    time: '09:00 AM - 5:00 PM',
    location: 'Geneva, Switzerland',
    field: 'Institutional Governance',
    description: 'Annual recruitment drive for multi-year leadership fellowships.',
  },
];

export const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: 'rp_ai_reasoning_evals',
    title: 'Test-Time Compute vs Pretraining Scaling: Empirical Evaluation of 500k Reasoning Tasks',
    publication_date: 'November 2026',
    category: 'AI Benchmarks & Swarms',
    field: 'Inference Architecture',
    pages: 64,
    is_premium: false,
    is_ai_generated: true,
    is_accredited: true,
    accreditor_name: 'AI Evaluation Board',
    author: 'Dr. Evelyn Brand & TTG AI Evaluation Lab',
    abstract: 'Rigorous empirical evaluation comparing test-time Monte Carlo tree search against parameter scaling across 500,000 multi-step mathematics, logic, and software verification benchmarks.',
    methodology: 'Distributed benchmarking across 2,048 H100 GPUs comparing inference rollout budgets from 100 to 16,000 tokens per query.',
    key_takeaways: [
      'Test-time search on a 7B parameter model outperformed an unassisted 70B model by 23.4%',
      'Process-supervised reward models reduced reasoning hallucination rates from 14.2% to 0.8%',
      'Inference cost per verified correct answer compressed by 68% compared to standard majority voting',
    ],
    metric_summary: [
      { label: 'Accuracy Gain', value: '+23.4%', delta: 'vs 10x Model' },
      { label: 'Hallucination Rate', value: '0.8%', delta: '-94.3%' },
      { label: 'Cost Efficiency', value: '3.1x', delta: 'Optimized' },
    ],
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk_ttg_49182',
    event_id: 'ret_bali_2026',
    event_title: 'Deep Work & Strategic Mindset Sanctuary',
    location: 'Ubud Highlands, Indonesia',
    dates: 'October 14 – 20, 2026',
    ticket_type: 'Virtual Pass',
    attendee_name: 'Tsoaelat S.',
    attendee_email: 'Tsoaelat.s@gmail.com',
    seats: 1,
    total_amount: 490,
    currency: 'USD',
    payment_status: 'Paid',
    booking_date: '2026-10-01',
    payment_intent: 'pi_3P92kL901xTtG01827',
    qr_code_ref: 'TTG-PASS-VIRTUAL-88419',
  },
];

export const INITIAL_INVOICES: InvoiceReceipt[] = [
  {
    id: 'inv_88291',
    invoice_number: 'INV-2026-0882',
    date: '2026-10-01',
    description: 'TTG Retreats: Bali Sanctuary (Virtual Pass)',
    amount: 490.00,
    currency: 'USD',
    status: 'Paid',
    category: 'Retreat Booking',
    payment_method: 'Visa •••• 4242',
    payment_intent_id: 'pi_3P92kL901xTtG01827',
    items: [
      {
        description: 'Bali Deep Work & Strategic Mindset Sanctuary · Virtual Pass Access',
        quantity: 1,
        unit_price: 490.00,
      },
    ],
  },
  {
    id: 'inv_0001_free',
    invoice_number: 'INV-2026-0001',
    date: '2026-11-01',
    description: 'Educare Pro Institutional Grant (100% Free · No Subscription Fees)',
    amount: 0.00,
    currency: 'USD',
    status: 'Paid',
    category: 'Subscription',
    payment_method: 'Complimentary Grant ($0)',
    payment_intent_id: 'pi_grant_free_00192',
    items: [
      {
        description: 'Educare Pro Membership · $0.00 Sponsored Institutional Grant',
        quantity: 1,
        unit_price: 0.00,
      },
    ],
  },
];

export const INITIAL_READING_PROGRESS: Record<string, ReadingProgress> = {
  sg_foundations_systems: {
    guideId: 'sg_foundations_systems',
    completedChapters: [0, 1],
    progressPercent: 67,
    lastReadDate: '2026-11-12',
    isCompleted: false,
    notes: 'Key focus on identifying feedback loop latency in Q1 sprints.',
    quizScores: { q_default: 100 },
    unlockedBadges: ['badge_systems_thinker'],
    completionLog: [
      { chapterIdx: 0, completedAt: '2026-11-10T08:45:00' },
      { chapterIdx: 1, completedAt: '2026-11-12T09:15:00' },
    ],
  },
};

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem_1',
    title: 'Morning Cognitive Architecture Focus Block',
    targetTitle: 'Foundations of First-Principles Systems Thinking',
    type: 'study_guide',
    date: '2026-11-10',
    time: '08:30 AM',
    frequency: 'Daily',
    isEnabled: true,
    notes: 'Complete Root Cause Deconstruction chapter before standup.',
  },
];

export interface FAQItem {
  id: string;
  category: 'Membership & Pricing' | 'Educare & Reading' | 'Research Corner' | 'TTG Retreats' | 'Careers & Accreditation' | 'Digital World & Art Media';
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'Membership & Pricing',
    question: 'How much are the paid services?',
    answer: 'Professional tiers range from $5 to $10 per month. This low-cost pricing ensures elite educational infrastructure remains accessible while funding high-performance compute for AI generated curricula. A robust free tier remains active for institutional grant recipients who cannot afford paid access.',
  },
  {
    id: 'faq_2',
    category: 'Careers & Accreditation',
    question: 'Are TTG courses accredited?',
    answer: 'Yes. Courses marked with the "Accredited" badge are verified by global boards like the TAI-ONE AI Standards Board and the Sovereign Governance Council. Completed professional level courses under skills development grant industry-recognized certificates of competency.',
  },
  {
    id: 'faq_3',
    category: 'Careers & Accreditation',
    question: 'How do career exhibitions work?',
    answer: 'TTG hosts student career exhibitions twice per quarter. These events connect high-performing Educare Pro students with recruiting firms in fields like Distributed AI Systems and Sovereign Infrastructure. Students can showcase their unlocked badges and project notes directly to hiring partners.',
  },
];

export const GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', name: 'Dr. Aris T.', total_score: 4850, badges_count: 12, completed_courses: 45, rank: 1 },
  { id: 'u2', name: 'Elena V.', total_score: 4200, badges_count: 9, completed_courses: 38, rank: 2 },
  { id: 'u3', name: 'Marcus S.', total_score: 3950, badges_count: 8, completed_courses: 32, rank: 3 },
  { id: 'user_88219', name: 'Tsoaelat S.', total_score: 2150, badges_count: 4, completed_courses: 12, rank: 12 },
  { id: 'u5', name: 'Sarah J.', total_score: 1800, badges_count: 3, completed_courses: 10, rank: 13 },
];

export const LIBRARY_RESOURCES: MediaItem[] = [
  { id: 'lib_1', title: 'Executive Biometrics Protocol', description: 'Complete calibration guide for heart-rate variability and cognitive focus monitoring.', media_type: 'pdf', file_url: '#', file_size: '2.4 MB', is_premium: true, download_count: 850 },
  { id: 'lib_2', title: 'System Deconstruction Template', description: 'A structural framework for mapping institutional feedback delays.', media_type: 'template', file_url: '#', file_size: '150 KB', is_premium: false, download_count: 2400 },
  { id: 'lib_3', title: 'Mechanism Design Worksheet', description: 'Game theory scenarios for deconstructing multi-party negotiations.', media_type: 'book', file_url: '#', file_size: '5.1 MB', is_premium: true, download_count: 620 },
  { id: 'lib_4', title: 'Sovereign Energy Whitepaper', description: 'Foundational research on nuclear SMR grid integration.', media_type: 'pdf', file_url: '#', file_size: '12.8 MB', is_premium: true, download_count: 410 },
];

export const STUDY_ACTIVITY: StudyActivity[] = [
  { day: 'Mon', intensity: 8, date: '2026-11-02' },
  { day: 'Tue', intensity: 4, date: '2026-11-03' },
  { day: 'Wed', intensity: 10, date: '2026-11-04' },
  { day: 'Thu', intensity: 7, date: '2026-11-05' },
  { day: 'Fri', intensity: 9, date: '2026-11-06' },
  { day: 'Sat', intensity: 2, date: '2026-11-07' },
  { day: 'Sun', intensity: 5, date: '2026-11-08' },
];

export const INITIAL_DOCUMENTS: AuthorDocument[] = [
  { id: 'doc_1', title: 'Draft: Institutional Resilience', content: 'The primary axiom of institutional resilience is the bounded nature of feedback latency...', format: 'text', last_modified: '2026-11-08', word_count: 450 },
];
