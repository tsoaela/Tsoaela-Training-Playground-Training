import { QctoModuleBreakdown, QctoSkillsProgrammeBlueprint, StudyGuide } from '../types';

const DEFAULT_SDP_PATH: string[] = [
  'Register legal entity and curriculum alignment with a Quality Council for Trades and Occupations (QCTO) Assessment Quality Partner (AQP) or apply directly to QCTO for Skills Programme curriculum approval.',
  'Submit Quality Management System (QMS), facilitator/assessor/moderator SETA-QCTO credentials, and occupational workplace host MOUs for Skills Development Provider (SDP) accreditation.',
  'Register learners on the National Learners’ Records Database (NLRD) upon programme intake and administer internal formative PoE moderation prior to External Integrated Summative Assessment (EISA) or Statement of Results issuance.',
];

export const FLAGSHIP_QCTO_BLUEPRINTS: Record<string, QctoSkillsProgrammeBlueprint> = {
  sg_ai_test_time_search: {
    courseId: 'sg_ai_test_time_search',
    courseTitle: 'Large Reasoning Models (LRMs) & Test-Time Search Compute',
    programmeTitle:
      'Occupational Skills Programme: Applied Reasoning AI & Inference Compute Engineering',
    qualificationType: 'Occupational Skills Programme (QCTO Aligned Blueprint)',
    suggestedOfoCode: '2021-251201 · Software & AI Inference Systems Developer',
    nqfLevel: 6,
    saqaCredits: 40,
    totalNotionalHours: 400,
    durationLabel: '4 Months (Full-Time / Intensive Block Release)',
    studyModeSummary:
      '25 notional hours/week across 16 weeks (30% Knowledge · 35% Practical · 35% Workplace) · 1 SAQA Credit = 10 Notional Hours',
    entryRequirements: [
      'NQF Level 5 National Certificate in Information Technology, Applied Mathematics, or Software Development (or equivalent Recognition of Prior Learning [RPL] portfolio).',
      'Working proficiency in Python, linear algebra, probability distributions, and Transformer attention mechanics.',
      'Access to a supervised AI engineering sandbox or workplace host environment for the 140-hour Work Experience component.',
    ],
    purposeStatement:
      'Equips AI engineers and technical specialists with applied competence to design, calibrate, and operate test-time compute pipelines, Process-Supervised Reward Models (PRMs), and Monte Carlo Tree Search (MCTS) inference controllers that improve formal verification accuracy in production reasoning systems.',
    accreditationStatusDisclosure:
      'Proposed QCTO-Aligned Blueprint Only — TTG is not a QCTO-accredited Skills Development Provider (SDP) and this programme is not yet registered on SAQA/NLRD. Formal QCTO curriculum evaluation, SDP site accreditation, and AQP moderation are mandatory before statutory Skills Programme credits or certificates can be conferred.',
    componentSummary: {
      knowledgeCredits: 12,
      knowledgeHours: 120,
      practicalCredits: 14,
      practicalHours: 140,
      workplaceCredits: 14,
      workplaceHours: 140,
    },
    modules: [
      {
        code: 'SP-LRM-KM01',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Foundations of Test-Time Compute Scaling & Search Theory',
        nqfLevel: 6,
        credits: 4,
        notionalHours: 40,
        purpose:
          'Build conceptual mastery of pre-training vs. inference-time scaling laws, token compute trade-offs, and bounded-rationality decision trees.',
        learningOutcomeAlignment:
          'Scale inference-time compute dynamically as a function of problem hardness',
        topics: [
          'Pre-training datacenter & data bottlenecks vs. inference-time compute allocation frontiers',
          'Hypothesis tree geometry, branching factors, and token latency budgets',
          'Dynamic compute routing policies conditioned on prompt complexity estimation',
          'Cost-accuracy Pareto curves across parallel sampling (Best-of-N) vs. sequential search',
        ],
        assessmentEvidence: [
          'Written theoretical test on scaling-law derivations and compute budget allocation.',
          'Analytical whitepaper comparing Best-of-N vs. sequential tree search latency.',
        ],
      },
      {
        code: 'SP-LRM-KM02',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Process-Supervised Reward Models (PRMs) & Step Verification',
        nqfLevel: 6,
        credits: 4,
        notionalHours: 40,
        purpose:
          'Differentiate Outcome Reward Models (ORMs) from Process-Supervised Reward Models (PRMs) and evaluate step-level error propagation.',
        learningOutcomeAlignment:
          'Deploy process-supervised reward models (PRMs) to prune faulty reasoning branches',
        topics: [
          'Structural failure modes of Outcome Supervision (right answer, flawed reasoning trace)',
          'Step-level trace labeling taxonomies and Monte Carlo rollout estimation',
          'Preventing delusion cascades through early perplexity and verifier threshold gating',
          'Calibration, reward hacking mitigation, and verifier ensemble disagreement metrics',
        ],
        assessmentEvidence: [
          'Structured written examination covering ORM vs. PRM mathematical formulations.',
          'Annotated step-verification rubric classifying logic breaks across sample traces.',
        ],
      },
      {
        code: 'SP-LRM-KM03',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Formal Governance, Safety Guardrails & Verifiable Inference',
        nqfLevel: 6,
        credits: 4,
        notionalHours: 40,
        purpose:
          'Establish deterministic auditability, reproducibility, and risk governance criteria for autonomous test-time search pipelines.',
        learningOutcomeAlignment:
          'Optimize rollout budgets to maximize precision-at-k on formal verification tasks',
        topics: [
          'Precision-at-k evaluation protocols for formal code, math, and policy proofs',
          'Deterministic seed management, KV-state provenance, and trace audit logs',
          'POPIA / GDPR / EU AI Act risk classification for multi-step reasoning agents',
          'Graceful fallback & human-in-the-loop escalation when verification budgets exhaust',
        ],
        assessmentEvidence: [
          'Governance compliance checklist and formal verification audit case study.',
        ],
      },
      {
        code: 'SP-LRM-PM01',
        type: 'Practical Skill Module',
        shortType: 'PM',
        title: 'Implementing MCTS & Dynamic Rollout Schedulers',
        nqfLevel: 6,
        credits: 5,
        notionalHours: 50,
        purpose:
          'Code, configure, and benchmark UCB1 / PUCT-driven Monte Carlo Tree Search controllers over tokenized reasoning trajectories.',
        learningOutcomeAlignment:
          'Scale inference-time compute dynamically as a function of problem hardness',
        topics: [
          'Implementing Selection, Expansion, Simulation, and Backpropagation over LLM nodes',
          'Tuning exploration constants (c_puct) and depth limits across variable difficulty tiers',
          'Building adaptive rollout schedulers keyed to real-time uncertainty scores',
          'Automated precision-at-k benchmarking harness on reasoning suites',
        ],
        assessmentEvidence: [
          'Executable MCTS inference repository with benchmark telemetry comparing k=1 vs. k=16 rollouts.',
          'Assessor practical observation rubric checking dynamic budget termination.',
        ],
      },
      {
        code: 'SP-LRM-PM02',
        type: 'Practical Skill Module',
        shortType: 'PM',
        title: 'Engineering Process Reward Verifiers & Branch Pruning',
        nqfLevel: 6,
        credits: 5,
        notionalHours: 50,
        purpose:
          'Train, calibrate, and wire step-level PRMs directly into live beam/tree inference loops to eliminate low-probability paths early.',
        learningOutcomeAlignment:
          'Deploy process-supervised reward models (PRMs) to prune faulty reasoning branches',
        topics: [
          'Synthesizing step-labeled positive/negative reasoning pairs cleanly',
          'Integrating async verifier scoring callbacks into stream decoding pipelines',
          'Beam pruning thresholds and dead-end branch elimination telemetry',
          'Evaluating false-positive vs. false-negative pruning impact on final accuracy',
        ],
        assessmentEvidence: [
          'Working PRM-guided pruning prototype demonstrating measurable token savings without accuracy drop.',
          'Confusion-matrix & calibration diagnostic report verified by facilitator.',
        ],
      },
      {
        code: 'SP-LRM-PM03',
        type: 'Practical Skill Module',
        shortType: 'PM',
        title: 'KV-Cache Checkpointing & Sub-50ms Backtracking Recovery',
        nqfLevel: 6,
        credits: 4,
        notionalHours: 40,
        purpose:
          'Build low-latency memory state caching systems for prefix-shared backtracking without redundant prefill computation.',
        learningOutcomeAlignment:
          'Optimize rollout budgets to maximize precision-at-k on formal verification tasks',
        topics: [
          'Paged KV-cache prefix tree sharing across forked reasoning hypotheses',
          'Detecting reasoning perplexity spikes and triggering deterministic rollback checkpoints',
          'Profiling memory bandwidth and achieving sub-50ms branch switching overhead',
        ],
        assessmentEvidence: [
          'Latency benchmark report proving sub-50ms KV-state recovery under multi-branch load.',
        ],
      },
      {
        code: 'SP-LRM-WM01',
        type: 'Work Experience Module',
        shortType: 'WM',
        title: 'Production Inference Compute Optimization Deployment',
        nqfLevel: 6,
        credits: 7,
        notionalHours: 70,
        purpose:
          'Apply adaptive test-time compute routing within an active software, research, or enterprise production environment under workplace mentorship.',
        learningOutcomeAlignment:
          'Scale inference-time compute dynamically as a function of problem hardness',
        topics: [
          'Auditing existing inference workloads and classifying query hardness tiers',
          'Deploying adaptive compute routers with latency SLA and GPU/token cost caps',
          'Tracking live token-to-accuracy ROI across 2+ weeks of production shadow traffic',
        ],
        assessmentEvidence: [
          'Signed Workplace Logbook verifying 70 supervised hours and SLA compliance.',
          'Supervisor attestation of cost-per-verified-answer improvement.',
        ],
      },
      {
        code: 'SP-LRM-WM02',
        type: 'Work Experience Module',
        shortType: 'WM',
        title: 'Capstone: Formally Verified Reasoning Pipeline Audit',
        nqfLevel: 6,
        credits: 7,
        notionalHours: 70,
        purpose:
          'Deliver an audited end-to-end reasoning pipeline (MCTS + PRM + KV-backtracking) verified against formal test suites and stakeholder sign-off.',
        learningOutcomeAlignment:
          'Optimize rollout budgets to maximize precision-at-k on formal verification tasks',
        topics: [
          'End-to-end integration of step verifiers and formal proof/unit-test harnesses',
          'Incident simulation: recovering cleanly from adversarial prompts & verifier drift',
          'Portfolio of Evidence (PoE) compilation and oral defense before internal moderator',
        ],
        assessmentEvidence: [
          'Signed Workplace Logbook (70 hours) + complete Portfolio of Evidence (PoE).',
          'Capstone architecture & trace audit defense evaluated for EISA readiness.',
        ],
      },
    ],
    eisaReadinessChecklist: [
      'Completion of all 3 Knowledge Modules (12 credits / 120 hours) with minimum 80% mastery threshold on MCTS & PRM assessments.',
      'Sign-off on all 3 Practical Skill Modules (14 credits / 140 hours) with reproducible code repositories and latency/accuracy benchmarks.',
      'Validated Workplace Logbooks totalling 140 hours across WM01 and WM02 signed by an accredited workplace mentor.',
      'Submitted & internally moderated Portfolio of Evidence (PoE) cleared for External Integrated Summative Assessment (EISA) / Statement of Results.',
    ],
    recommendedSdpPath: DEFAULT_SDP_PATH,
  },

  sg_ai_swarm_consensus: {
    courseId: 'sg_ai_swarm_consensus',
    courseTitle: 'Multi-Agent Swarm Orchestration & Consensus Protocols',
    programmeTitle:
      'Occupational Skills Programme: Distributed Multi-Agent Systems & Consensus Engineering',
    qualificationType: 'Occupational Skills Programme (QCTO Aligned Blueprint)',
    suggestedOfoCode: '2021-251202 · Distributed AI & Cloud Orchestration Specialist',
    nqfLevel: 6,
    saqaCredits: 60,
    totalNotionalHours: 600,
    durationLabel: '6 Months (Extended Block / Workplace Integrated)',
    studyModeSummary:
      '25 notional hours/week across 24 weeks (30% Knowledge · 35% Practical · 35% Workplace) · 1 SAQA Credit = 10 Notional Hours',
    entryRequirements: [
      'NQF Level 5 Qualification in Computer Science, Distributed Systems, or Software Engineering.',
      'Prior experience with REST/RPC APIs, state machines, and structured LLM tool-calling schemas.',
    ],
    purposeStatement:
      'Prepares systems engineers to architect fault-tolerant multi-agent swarms enforcing Byzantine-resilient quorum protocols, zero-trust tool contracts, and semantic drift telemetry across enterprise APIs.',
    accreditationStatusDisclosure:
      'Proposed QCTO-Aligned Blueprint Only — TTG is not a QCTO-accredited Skills Development Provider (SDP) and this programme is not yet registered on SAQA/NLRD. Formal QCTO registration and SDP accreditation remain required for statutory certification.',
    componentSummary: {
      knowledgeCredits: 18,
      knowledgeHours: 180,
      practicalCredits: 21,
      practicalHours: 210,
      workplaceCredits: 21,
      workplaceHours: 210,
    },
    modules: [
      {
        code: 'SP-SWM-KM01',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Multi-Agent Decomposition & Separation of Duties',
        nqfLevel: 6,
        credits: 6,
        notionalHours: 60,
        purpose:
          'Analyze stochastic compounding failure in monolithic agent loops and model propose-critique-verify-commit topologies.',
        topics: [
          'Exponential error compounding curves in single-agent reasoning chains',
          'Role isolation contracts: planner, executor, critic, and ledger committer',
          'Message passing topologies and schema-constrained inter-agent communication',
        ],
        assessmentEvidence: ['Architecture exam & failure-mode decomposition case study.'],
      },
      {
        code: 'SP-SWM-KM02',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Byzantine Fault Tolerance & Quorum Consensus Theory',
        nqfLevel: 6,
        credits: 6,
        notionalHours: 60,
        purpose:
          'Master Raft-inspired leader election, weighted quorum voting, and partition handling among heterogeneous agents.',
        topics: [
          'Byzantine vs. crash-fault tolerance in probabilistic model outputs',
          'Quorum intersection theorems and confidence-weighted voting schemes',
          'Preventing split-brain ledger mutations across concurrent tool invocations',
        ],
        assessmentEvidence: ['Consensus & Mechanism Design written exam (>= 70% pass).'],
      },
      {
        code: 'SP-SWM-KM03',
        type: 'Knowledge Module',
        shortType: 'KM',
        title: 'Zero-Trust Tool Contracts & Cryptographic Audit Trails',
        nqfLevel: 6,
        credits: 6,
        notionalHours: 60,
        purpose:
          'Design signed permission envelopes, idempotency keys, and immutable audit trails for autonomous API execution.',
        topics: [
          'Least-privilege capability tokens and human approval gates',
          'Deterministic replay logs and cryptographic hash chaining of tool results',
          'Detecting prompt-injection propagation across swarm hops',
        ],
        assessmentEvidence: ['Security threat model & cryptographic audit schema specification.'],
      },
      {
        code: 'SP-SWM-PM01',
        type: 'Practical Skill Module',
        shortType: 'PM',
        title: 'Implementing Quorum Voting & heterogeneous Agent Routers',
        nqfLevel: 6,
        credits: 11,
        notionalHours: 110,
        purpose:
          'Build deterministic voting orchestration across heterogeneous LLMs with quorum rollback.',
        topics: [
          'Multi-model consensus orchestrator with configurable tie-breaking rules',
          'Structured JSON schema validation and schema-repair retries',
        ],
        assessmentEvidence: ['Verified source repository + unit/chaos test suite report.'],
      },
      {
        code: 'SP-SWM-PM02',
        type: 'Practical Skill Module',
        shortType: 'PM',
        title: 'Distributed Telemetry & Semantic Drift Mitigation Labs',
        nqfLevel: 6,
        credits: 10,
        notionalHours: 100,
        purpose:
          'Instrument 100+ concurrent pipeline traces and isolate semantic drift bottlenecks.',
        topics: [
          'Distributed OpenTelemetry tracing across parallel agent fan-out/fan-in graphs',
          'Semantic similarity & invariant assertion monitors to arrest multi-hop drift',
        ],
        assessmentEvidence: ['Telemetry dashboard trace bundle & drift mitigation lab report.'],
      },
      {
        code: 'SP-SWM-WM01',
        type: 'Work Experience Module',
        shortType: 'WM',
        title: 'Supervised Enterprise Swarm Reconciliation Project',
        nqfLevel: 6,
        credits: 21,
        notionalHours: 210,
        purpose:
          'Operate and harden a multi-agent workflow under live SLA constraints with full audit logging and fault-injection drills.',
        topics: [
          'Production rollout of multi-agent verification cutting silent failures below 0.1%',
          '210-hour supervised workplace logbook and final PoE moderation',
        ],
        assessmentEvidence: [
          'Signed 210-hour Workplace Logbook and moderated Portfolio of Evidence.',
        ],
      },
    ],
    eisaReadinessChecklist: [
      'Pass KM01–KM03 foundational theory & zero-trust security assessments (18 credits / 180 hours).',
      'Pass practical orchestrator & OpenTelemetry drift labs (21 credits / 210 hours).',
      'Verify 210 workplace hours and PoE sign-off for EISA admission.',
    ],
    recommendedSdpPath: DEFAULT_SDP_PATH,
  },
};

function parseMonthsFromDurationLabel(label: string): number {
  const match = label.match(/(\d+)/);
  if (!match) return 3;
  const val = parseInt(match[1], 10);
  if (Number.isNaN(val) || val <= 0) return 3;
  if (label.toLowerCase().includes('year')) return val * 12;
  if (label.toLowerCase().includes('week')) return Math.max(1, Math.round(val / 4));
  return val;
}

function deriveNqfLevel(guide: StudyGuide): number {
  if (guide.difficulty === 'Advanced' || guide.professional_level === 'professional') return 6;
  if (guide.difficulty === 'Executive' || guide.professional_level === 'intermediate') return 5;
  return 4;
}

export function buildQctoBlueprintForGuide(guide: StudyGuide): QctoSkillsProgrammeBlueprint {
  if (FLAGSHIP_QCTO_BLUEPRINTS[guide.id]) {
    return FLAGSHIP_QCTO_BLUEPRINTS[guide.id];
  }

  const nqfLevel = deriveNqfLevel(guide);
  const months = parseMonthsFromDurationLabel(guide.duration_label || '3 Months');
  // Standard Skills Programme sizing: 10 credits per month of intensive study, clamped cleanly [20, 60]
  const saqaCredits = Math.min(60, Math.max(20, Math.round(months * 10)));
  const totalNotionalHours = saqaCredits * 10;

  const knowledgeCredits = Math.round(saqaCredits * 0.3);
  const practicalCredits = Math.round(saqaCredits * 0.35);
  const workplaceCredits = saqaCredits - knowledgeCredits - practicalCredits;

  const knowledgeHours = knowledgeCredits * 10;
  const practicalHours = practicalCredits * 10;
  const workplaceHours = workplaceCredits * 10;

  const safeChapters = guide.chapters.length > 0 ? guide.chapters : [
    { title: '01. Core Domain Foundations', content: guide.abstract },
    { title: '02. Applied Architecture & Tooling', content: guide.abstract },
  ];

  const kmPerChapterCredits = Math.max(1, Math.floor(knowledgeCredits / safeChapters.length));
  const kmRemainder = knowledgeCredits - kmPerChapterCredits * safeChapters.length;

  const knowledgeModules: QctoModuleBreakdown[] = safeChapters.map((ch, idx) => {
    const cr = kmPerChapterCredits + (idx === 0 ? kmRemainder : 0);
    const cleanTitle = ch.title.replace(/^\d+\.\s*/, '');
    return {
      code: `SP-AI-KM0${idx + 1}`,
      type: 'Knowledge Module',
      shortType: 'KM',
      title: cleanTitle,
      nqfLevel,
      credits: cr,
      notionalHours: cr * 10,
      purpose: ch.content.slice(0, 175) + (ch.content.length > 175 ? '...' : ''),
      learningOutcomeAlignment: guide.learning_outcomes[idx] || guide.learning_outcomes[0],
      topics: [
        cleanTitle,
        guide.learning_outcomes[idx] || `Analytical principles of ${guide.field || guide.category}`,
        `Evidence-based evaluation within ${guide.field || 'Applied AI Systems'}`,
      ],
      assessmentEvidence: [
        `Closed-book / scenario written assessment on ${cleanTitle}.`,
        'Conceptual architecture summary mapped to occupational standards.',
      ],
    };
  });

  const pmHalf1 = Math.ceil(practicalCredits / 2);
  const pmHalf2 = practicalCredits - pmHalf1;

  const practicalModules: QctoModuleBreakdown[] = [
    {
      code: 'SP-AI-PM01',
      type: 'Practical Skill Module',
      shortType: 'PM',
      title: `Applied Implementation Lab: ${guide.field || guide.title}`,
      nqfLevel,
      credits: pmHalf1,
      notionalHours: pmHalf1 * 10,
      purpose: `Hands-on technical execution translating ${guide.title} concepts into testable workflows.`,
      learningOutcomeAlignment: guide.learning_outcomes[0],
      topics: guide.learning_outcomes.slice(0, 2).length > 0
        ? guide.learning_outcomes.slice(0, 2)
        : [`Configure and test ${guide.title} pipelines`, 'Instrument quantitative performance metrics'],
      assessmentEvidence: [
        'Observable lab execution checklist verified by accredited facilitator.',
        'Reproducible technical artifact & telemetry verification bundle.',
      ],
    },
    ...(pmHalf2 > 0
      ? [
          {
            code: 'SP-AI-PM02',
            type: 'Practical Skill Module' as const,
            shortType: 'PM' as const,
            title: 'Verification, Failure-Mode Auditing & Benchmarking',
            nqfLevel,
            credits: pmHalf2,
            notionalHours: pmHalf2 * 10,
            purpose: 'Stress-test deliverables against edge cases, safety constraints, and latency/cost limits.',
            learningOutcomeAlignment: guide.learning_outcomes[guide.learning_outcomes.length - 1],
            topics: [
              'Automated test harness & regression benchmarking',
              'Safety compliance, bias detection & rollback drills',
            ],
            assessmentEvidence: [
              'Moderated failure-mode audit dossier and benchmark delta report.',
            ],
          },
        ]
      : []),
  ];

  const workplaceModules: QctoModuleBreakdown[] = [
    {
      code: 'SP-AI-WM01',
      type: 'Work Experience Module',
      shortType: 'WM',
      title: `Supervised Workplace Deployment: ${guide.field || 'Applied AI'}`,
      nqfLevel,
      credits: workplaceCredits,
      notionalHours: workplaceCredits * 10,
      purpose:
        'Execute supervised occupational tasks in an active workplace or simulated industry studio to demonstrate sustained workplace competence.',
      learningOutcomeAlignment: guide.learning_outcomes[guide.learning_outcomes.length - 1],
      topics: [
        'Real-world integration with stakeholder constraints and SLA monitoring',
        'Documented Portfolio of Evidence (PoE) and mentor sign-off',
      ],
      assessmentEvidence: [
        `Signed Workplace Logbook (${workplaceHours} notional hours).`,
        'Workplace supervisor performance appraisal & PoE verification.',
      ],
    },
  ];

  return {
    courseId: guide.id,
    courseTitle: guide.title,
    programmeTitle: `Occupational Skills Programme: ${guide.title}`,
    qualificationType: 'Occupational Skills Programme (QCTO Aligned Blueprint)',
    suggestedOfoCode: '2021-2512 · Software, AI & Systems Specialists',
    nqfLevel,
    saqaCredits,
    totalNotionalHours,
    durationLabel: guide.duration_label || `${months} Months`,
    studyModeSummary: `${Math.round(totalNotionalHours / Math.max(4, months * 4))} hrs/week est. (30% Knowledge · 35% Practical · 35% Workplace) · 1 SAQA Credit = 10 Notional Hours`,
    entryRequirements: [
      `NQF Level ${Math.max(4, nqfLevel - 1)} foundational qualification or verified RPL equivalent in ${guide.field || 'Computing & Systems'}.`,
      'Digital literacy and applied analytical capability suited to self-directed lab work.',
    ],
    purposeStatement: guide.abstract,
    accreditationStatusDisclosure:
      'Proposed QCTO-Aligned Blueprint Only — Curriculum structure maps this study guide to South African NQF/QCTO Skills Programme conventions for institutional planning. Formal QCTO Skills Development Provider (SDP) accreditation and SAQA registration are required before statutory credits apply.',
    componentSummary: {
      knowledgeCredits,
      knowledgeHours,
      practicalCredits,
      practicalHours,
      workplaceCredits,
      workplaceHours,
    },
    modules: [...knowledgeModules, ...practicalModules, ...workplaceModules],
    eisaReadinessChecklist: [
      `Complete all Knowledge Modules (${knowledgeCredits} credits / ${knowledgeHours} hours) and pass internal formative assessments.`,
      `Complete Practical Skill Modules (${practicalCredits} credits / ${practicalHours} hours) with moderated technical artifacts.`,
      `Submit signed Workplace Logbook (${workplaceCredits} credits / ${workplaceHours} hours) and consolidated Portfolio of Evidence (PoE).`,
    ],
    recommendedSdpPath: DEFAULT_SDP_PATH,
  };
}
