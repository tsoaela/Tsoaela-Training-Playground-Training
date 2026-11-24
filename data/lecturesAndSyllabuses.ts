import { FacultyLectureSeries } from '../types';

export const FACULTY_LECTURE_SERIES: FacultyLectureSeries[] = [
  {
    id: 'lec_ai_test_time_search',
    lectureCode: 'LEC-ENG-901',
    title: 'Test-Time Search Compute & Process-Supervised Reasoning',
    specialization: 'Artificial Intelligence & Inference Scaling',
    facultyKey: 'Engineering',
    facultyName: 'Engineering, Technology & Built Environment',
    departmentName: 'Computer Science & IT',
    lecturerName: 'Prof. Dr. Aris Thorne',
    lecturerTitle: 'Chair of Frontier AI & Inference Compute',
    deliveryFormat: 'Live Seminar & Lab',
    nqfLevel: 'NQF Level 9 · Master’s Seminar',
    totalDuration: '8 Weeks · 24 Lecture Hours',
    scheduleSlot: 'Tuesdays & Thursdays · 18:00 UTC',
    linkedGuideId: 'sg_ai_test_time_search',
    syllabusOverview:
      'Specialized graduate lecture series examining dynamic inference-time search allocation, Monte Carlo Tree Search (MCTS) rollouts over token trees, KV-cache backtracking checkpoints, and formal process-reward verification.',
    prerequisites: [
      'Probability Theory & Stochastic Processes',
      'Transformer Attention & Autoregressive Decoding',
      'Linear Algebra & Convex Optimization',
    ],
    assessmentModel:
      'Process-Supervised Verifier Rollout Lab (50%), Formal Bounds Problem Set (30%), Oral Defense (20%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'ENG-901-01',
        lectureTitle: 'Inference-Time Scaling Laws & Thermal Boundaries',
        duration: '90 min',
        format: 'Keynote Lecture',
        synopsis:
          'Contrasting pre-training compute limits against adaptive test-time hypothesis exploration curves across varying task complexity regimes.',
        specializedTopics: [
          'Chinchilla vs. Test-Time Compute Pareto Frontiers',
          'Token budget allocation per problem entropy tier',
          'Pass@k vs. majority-voting verifier convergence',
        ],
        requiredReadingOrArtifact: 'Compute-Optimal Test-Time Scaling Benchmarks (2025–2026)',
        deliverable: 'Token-budget calibration curve across 3 difficulty bands',
      },
      {
        lectureNumber: 2,
        unitCode: 'ENG-901-02',
        lectureTitle: 'Process Reward Models (PRMs) & Step-Level Verification',
        duration: '90 min',
        format: 'Technical Seminar',
        synopsis:
          'Designing step-level verifiers that score intermediate derivations to eliminate hallucination cascades before terminal commits.',
        specializedTopics: [
          'Outcome Supervision (ORM) failure modes on multi-step proofs',
          'Monte Carlo rollout estimation for synthetic step labeling',
          'Calibration curves & false-negative pruning thresholds',
        ],
        requiredReadingOrArtifact: 'PRM Step-Scoring Rubric & Synthetic Rollout Traces',
        deliverable: 'Step-reward classifier ablation report',
      },
      {
        lectureNumber: 3,
        unitCode: 'ENG-901-03',
        lectureTitle: 'KV-Cache Checkpointing & Sub-50ms Branch Rollback',
        duration: '120 min',
        format: 'Quantitative Lab',
        synopsis:
          'Memory-bounded paged attention structures supporting rapid deterministic tree backtracking during search expansion.',
        specializedTopics: [
          'Prefix-tree KV block sharing and copy-on-write paging',
          'Perplexity surge triggers for beam pruning',
          'VRAM ceiling governance under quantized 8-bit caches',
        ],
        requiredReadingOrArtifact: 'Paged Attention & Beam Rollback Profiling Kit',
        deliverable: 'Sub-50ms rollback latency benchmark notebook',
      },
      {
        lectureNumber: 4,
        unitCode: 'ENG-901-04',
        lectureTitle: 'Formal Theorem & Code-Synthesis Search Pipelines',
        duration: '90 min',
        format: 'Case Colloquium',
        synopsis:
          'Coupling compiler diagnostics and Lean/unit-test oracles directly into MCTS selection loops for verifiable autonomous synthesis.',
        specializedTopics: [
          'UCT exploration constants under deterministic compiler feedback',
          'Symbolic invariance assertions & counterexample-guided pruning',
          'Production rollout cost-per-verified-patch budgeting',
        ],
        requiredReadingOrArtifact: 'Deterministic Oracle-Guided Synthesis Casebook',
        deliverable: 'End-to-end verified rollout pipeline submission',
      },
    ],
  },
  {
    id: 'lec_ai_swarm_consensus',
    lectureCode: 'LEC-ENG-904',
    title: 'Multi-Agent Swarm Orchestration & Byzantine Consensus',
    specialization: 'Distributed AI Systems & Cyber Security',
    facultyKey: 'Engineering',
    facultyName: 'Engineering, Technology & Built Environment',
    departmentName: 'Computer Science & IT',
    lecturerName: 'Dr. Kenji Takahashi',
    lecturerTitle: 'Senior Lecturer in Fault-Tolerant Distributed Protocols',
    deliveryFormat: 'Live Seminar & Lab',
    nqfLevel: 'NQF Level 9 · Postgraduate Lab',
    totalDuration: '8 Weeks · 24 Lecture Hours',
    scheduleSlot: 'Wednesdays · 17:00 UTC',
    linkedGuideId: 'sg_ai_swarm_consensus',
    syllabusOverview:
      'Engineering fault-tolerant multi-agent orchestration architectures with Raft/Byzantine quorum verification, cryptographic idempotency tokens, and split-brain reconciliation across tool-calling RPCs.',
    prerequisites: [
      'Distributed Systems Fundamentals (Raft / Paxos)',
      'Applied Cryptography & Ed25519 Signatures',
    ],
    assessmentModel:
      'Byzantine Quorum Recovery Simulation (60%) & Security Threat Matrix Audit (40%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'ENG-904-01',
        lectureTitle: 'Propose–Critique–Verify Role Separation in Agent Topologies',
        duration: '75 min',
        format: 'Keynote Lecture',
        synopsis:
          'Eliminating compounding stochastic drift in monolithic loops through bounded role-isolated state machines.',
        specializedTopics: [
          'Exponential error compounding across unverified chains',
          'Deterministic tool-mutation contracts & schema validation',
          'Read-lease routing vs. quorum-mutating commits',
        ],
        requiredReadingOrArtifact: 'Role-Isolated Agent State-Machine Specification',
        deliverable: 'Formal state transition diagram for 4-role swarm',
      },
      {
        lectureNumber: 2,
        unitCode: 'ENG-904-02',
        lectureTitle: 'Byzantine Fault Tolerance & Quorum Recovery Under Partition',
        duration: '105 min',
        format: 'Quantitative Lab',
        synopsis:
          'Guaranteeing safety and bounded liveness when up to 33% of verifier nodes hallucinate or experience region brownouts.',
        specializedTopics: [
          'View-change elections with randomized jitter backoff',
          'Epoch-bound idempotency keys for external API mutations',
          'Symmetric partition tie-breaking invariants',
        ],
        requiredReadingOrArtifact: 'BFT Quorum Fault-Injection Test Harness',
        deliverable: '33% dropout recovery simulation telemetry log',
      },
      {
        lectureNumber: 3,
        unitCode: 'ENG-904-03',
        lectureTitle: 'Merkle-Chained Cryptographic Audit Logs & Replay Protection',
        duration: '90 min',
        format: 'Technical Seminar',
        synopsis:
          'Constructing tamper-evident execution ledgers across heterogeneous agent RPC boundaries with batched signature verification.',
        specializedTopics: [
          'Merkle root anchoring & compact inclusion proofs',
          'Ed25519 batch verification CPU budgets at 1,000 req/s',
          'Replay-nonce window sizing against prompt-injection forks',
        ],
        requiredReadingOrArtifact: 'Zero-Trust Tool Execution Audit Protocol',
        deliverable: 'Signed audit log verification suite',
      },
    ],
  },
  {
    id: 'lec_systems_first_principles',
    lectureCode: 'LEC-ENG-702',
    title: 'First-Principles Systems Deconstruction & Feedback Dynamics',
    specialization: 'Systems Engineering & Operational Architecture',
    facultyKey: 'Engineering',
    facultyName: 'Engineering, Technology & Built Environment',
    departmentName: 'Engineering Fields',
    lecturerName: 'Dr. Nadia Al-Mansoor',
    lecturerTitle: 'Associate Professor of Complex Systems & Control',
    deliveryFormat: 'Recorded Lecture Series',
    nqfLevel: 'NQF Level 7–8 · Undergraduate / Honours',
    totalDuration: '6 Weeks · 18 Lecture Hours',
    scheduleSlot: 'Self-Paced + Weekly Live Q&A (Fridays 15:00 UTC)',
    linkedGuideId: 'sg_foundations_systems',
    syllabusOverview:
      'Quantitative methodology for isolating physical system boundaries, diagnosing reporting-lag cascades, and replacing fragile analogical reasoning with invariant axial models.',
    prerequisites: ['Foundational Calculus & Differential Models'],
    assessmentModel: 'Root Cause Feedback Latency Audit (50%) & Diagnostic Exam (50%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'ENG-702-01',
        lectureTitle: 'Axiomatic Decomposition vs. Reasoning by Analogy',
        duration: '60 min',
        format: 'Keynote Lecture',
        synopsis:
          'Stripping institutional assumptions down to physical conservation laws of energy, latency, information entropy, and throughput.',
        specializedTopics: [
          'Identifying hidden semantic traps in legacy operating metrics',
          'Constructing irreducible physical boundary tables',
          'Dimensional consistency audits across multi-team workflows',
        ],
        requiredReadingOrArtifact: 'First-Principles Deconstruction Worksheet',
        deliverable: 'Axiom reduction audit of a live workflow bottleneck',
      },
      {
        lectureNumber: 2,
        unitCode: 'ENG-702-02',
        lectureTitle: 'Boundary Isolation & Delayed Feedback Loop Gain',
        duration: '75 min',
        format: 'Quantitative Lab',
        synopsis:
          'Distinguishing physical transport delay from telemetry reporting lag to neutralize bullwhip oscillations.',
        specializedTopics: [
          'Phase lag & oscillation amplification in supply chains',
          'p95 / p99 tail-latency tracking vs. misleading mean metrics',
          'Dampening loop gain without starving downstream capacity',
        ],
        requiredReadingOrArtifact: 'Delay Differential Queue Simulation Dataset',
        deliverable: 'Telemetry lag sensitivity table (48h window)',
      },
      {
        lectureNumber: 3,
        unitCode: 'ENG-702-03',
        lectureTitle: 'Applied Root-Cause Triage & Boundary Objects',
        duration: '75 min',
        format: 'Case Colloquium',
        synopsis:
          'Translating cross-departmental handoffs into deterministic interface contracts with measurable rollback checkpoints.',
        specializedTopics: [
          'Contract-driven handoffs between engineering and operations',
          'Incentive misalignment detection in SLA escalation trees',
          'Automated vs. manual triage cost curves',
        ],
        requiredReadingOrArtifact: 'Operational Boundary Case Portfolio',
        deliverable: 'Root Cause Feedback Latency Audit Paper',
      },
    ],
  },
  {
    id: 'lec_sovereign_strategy',
    lectureCode: 'LEC-BUS-840',
    title: 'Global Institutional Leadership & Sovereign Capital Strategy',
    specialization: 'Sovereign Governance, Treasury & Law',
    facultyKey: 'Business',
    facultyName: 'Business, Commerce & Law',
    departmentName: 'Finance & Accounting',
    lecturerName: 'Prof. Sébastien Laurent',
    lecturerTitle: 'Chair of Sovereign Treasury & Institutional Governance',
    deliveryFormat: 'Practicum & Case Colloquium',
    nqfLevel: 'NQF Level 9 · Master’s / MBA Core',
    totalDuration: '10 Weeks · 30 Lecture Hours',
    scheduleSlot: 'Mondays & Wednesdays · 19:00 UTC',
    linkedGuideId: 'sg_long_term_leadership',
    syllabusOverview:
      'Executive seminar covering 30-to-50-year capital preservation covenants, multi-generational reserve duration matching, counter-cyclical risk budgets, and fiduciary governance invariants.',
    prerequisites: [
      'Macroeconomic Monetary Mechanics',
      'Corporate & Trust Fiduciary Law',
    ],
    assessmentModel: '50-Year Capital Shielding Thesis (65%) & Boardroom Simulation (35%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'BUS-840-01',
        lectureTitle: 'The Seven-Year Governance Horizon & Fiduciary Covenants',
        duration: '90 min',
        format: 'Keynote Lecture',
        synopsis:
          'Structuring institutional charters that resist short-term liquidity pressures while preserving strategic adaptability.',
        specializedTopics: [
          'Endowment payout guardrails under regime shifts',
          'Quarterly-to-septennial KPI translation frameworks',
          'Formal sunset clauses for legacy capital allocations',
        ],
        requiredReadingOrArtifact: 'Institutional Charter & Covenant Compendium',
        deliverable: 'Draft 7-year governance mandate charter',
      },
      {
        lectureNumber: 2,
        unitCode: 'BUS-840-02',
        lectureTitle: 'Asset-Liability Duration Matching Under Rate Shocks',
        duration: '105 min',
        format: 'Quantitative Lab',
        synopsis:
          'Stress-testing sovereign fixed-income ladders against 1970s-style stagflation and simultaneous bond-equity correlation spikes.',
        specializedTopics: [
          '30-year sovereign ladder convexity & inflation-linked rollovers',
          'Emerging-market FX hedging cost vs. tail drawdown protection',
          'Counter-cyclical liquidity reserve triggers',
        ],
        requiredReadingOrArtifact: 'Sovereign Duration Stress-Test Model',
        deliverable: 'Rate-shock & stagflation reserve stress matrix',
      },
      {
        lectureNumber: 3,
        unitCode: 'BUS-840-03',
        lectureTitle: 'Geopolitical Supply-Corridor Risk & Cultural Invariants',
        duration: '90 min',
        format: 'Case Colloquium',
        synopsis:
          'Balancing regional branch autonomy with verifiable cryptographic and fiduciary accountability standards.',
        specializedTopics: [
          'Binding energy & compute capex to real GDP anchors',
          'Annual governance audit escalation protocols',
          'Cross-jurisdictional legal ring-fencing',
        ],
        requiredReadingOrArtifact: 'Geopolitical Corridor Contingency Briefs',
        deliverable: '50-Year Capital Shielding Capstone Thesis',
      },
    ],
  },
  {
    id: 'lec_clinical_diagnostics',
    lectureCode: 'LEC-HLT-715',
    title: 'Clinical Pharmacology & Evidence-Based Diagnostic Triage',
    specialization: 'Clinical Practice & Public Health Epidemiology',
    facultyKey: 'Health',
    facultyName: 'Health & Medical Sciences',
    departmentName: 'Clinical Medicine & Nursing',
    lecturerName: 'Dr. Priya Naidoo',
    lecturerTitle: 'Director of Clinical Diagnostics & Pharmacokinetics',
    deliveryFormat: 'Live Seminar & Lab',
    nqfLevel: 'NQF Level 8 · Honours / Clinical Practicum',
    totalDuration: '12 Weeks · 36 Lecture Hours',
    scheduleSlot: 'Tuesdays · 16:00 UTC',
    syllabusOverview:
      'Specialized health sciences curriculum integrating Bayesian diagnostic likelihood ratios, pharmacokinetic dosing clearance models, and multi-disciplinary ward triage safety checklists.',
    prerequisites: [
      'Human Anatomy & Systemic Physiology',
      'Biostatistics & Epidemiological Study Design',
    ],
    assessmentModel: 'OSCE Clinical Triage Simulation (50%) & Pharmacokinetic Dosing Exam (50%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'HLT-715-01',
        lectureTitle: 'Bayesian Differential Diagnosis & Likelihood Ratio Calibration',
        duration: '90 min',
        format: 'Keynote Lecture',
        synopsis:
          'Updating pre-test clinical probabilities systematically using diagnostic sensitivity, specificity, and pretest epidemiological prevalence.',
        specializedTopics: [
          'Fagan nomogram probability updating in acute triage',
          'Avoiding base-rate neglect in rare pathology screening',
          'Point-of-care biomarker threshold selection',
        ],
        requiredReadingOrArtifact: 'Clinical Decision Analysis Compendium',
        deliverable: 'Acute chest-pain Bayesian triage decision tree',
      },
      {
        lectureNumber: 2,
        unitCode: 'HLT-715-02',
        lectureTitle: 'Renal & Hepatic Pharmacokinetic Clearance Dosing',
        duration: '90 min',
        format: 'Quantitative Lab',
        synopsis:
          'Calculating loading doses, steady-state trough windows, and therapeutic drug monitoring adjustments under organ impairment.',
        specializedTopics: [
          'Zero-order vs. first-order elimination kinetics',
          'Cockcroft-Gault & CKD-EPI eGFR dosing stratifications',
          'Narrow therapeutic index toxicity mitigation',
        ],
        requiredReadingOrArtifact: 'Clinical Pharmacokinetics Dosing Protocol Manual',
        deliverable: 'Ward dosing adjustment protocol for 4 patient profiles',
      },
      {
        lectureNumber: 3,
        unitCode: 'HLT-715-03',
        lectureTitle: 'Antimicrobial Stewardship & Hospital Epidemiology',
        duration: '75 min',
        format: 'Case Colloquium',
        synopsis:
          'Evaluating local antibiograms, de-escalation checkpoints at 48 hours, and outbreak containment protocols.',
        specializedTopics: [
          'Minimum Inhibitory Concentration (MIC) breakpoint interpretation',
          'Broad-spectrum de-escalation stewardship metrics',
          'Nosocomial vector transmission surveillance',
        ],
        requiredReadingOrArtifact: 'Institutional Antimicrobial Stewardship Guide',
        deliverable: '72-hour sepsis stewardship audit case report',
      },
    ],
  },
  {
    id: 'lec_genomic_biotech',
    lectureCode: 'LEC-SCI-780',
    title: 'Molecular Biotechnology & Computational Genomics Protocols',
    specialization: 'Biotechnology, Genetics & Bioinformatics',
    facultyKey: 'Science',
    facultyName: 'Science & Agriculture',
    departmentName: 'Biological & Agricultural Sciences',
    lecturerName: 'Dr. Lindiwe Khumalo',
    lecturerTitle: 'Lead Fellow in Computational Genomics & Crop Resilience',
    deliveryFormat: 'Live Seminar & Lab',
    nqfLevel: 'NQF Level 8 · Honours / Lab Specialization',
    totalDuration: '10 Weeks · 30 Lecture Hours',
    scheduleSlot: 'Thursdays · 15:30 UTC',
    syllabusOverview:
      'Hands-on theoretical and computational lectures covering CRISPR-Cas assay design, long-read sequence alignment quality metrics, and drought-tolerant agrarian metabolic engineering.',
    prerequisites: [
      'Molecular Cell Biology & Biochemistry',
      'Introductory Python / R Statistical Computing',
    ],
    assessmentModel: 'Sequence Alignment Pipeline (50%) & Assay Validation Protocol (50%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'SCI-780-01',
        lectureTitle: 'Long-Read Sequencing Quality & Variant Calling Pipelines',
        duration: '90 min',
        format: 'Quantitative Lab',
        synopsis:
          'Filtering Phred quality scores, correcting homopolymer basecalling drift, and annotating structural variants.',
        specializedTopics: [
          'FASTQ Phred score distributions & adapter trimming',
          'Reference-guided vs. de novo De Bruijn graph assembly',
          'VCF variant filtering & depth coverage thresholds',
        ],
        requiredReadingOrArtifact: 'Genomic Variant Calling Pipeline Spec',
        deliverable: 'Annotated variant table from sample FASTQ reads',
      },
      {
        lectureNumber: 2,
        unitCode: 'SCI-780-02',
        lectureTitle: 'CRISPR-Cas9 Guide RNA Specificity & Off-Target Scoring',
        duration: '90 min',
        format: 'Technical Seminar',
        synopsis:
          'Evaluating PAM motif constraints, mismatch tolerance matrices, and HDR vs. NHEJ repair pathway selection.',
        specializedTopics: [
          'Protospacer Adjacent Motif (PAM) thermodynamic stability',
          'In-silico off-target cleavage prediction scoring',
          'Prime editing & base-editor fidelity bounds',
        ],
        requiredReadingOrArtifact: 'CRISPR Experimental Design & Safety Charter',
        deliverable: 'Top-3 gRNA candidate dossier with off-target matrix',
      },
      {
        lectureNumber: 3,
        unitCode: 'SCI-780-03',
        lectureTitle: 'Quantitative Trait Loci (QTL) in Climate-Resilient Agronomy',
        duration: '75 min',
        format: 'Case Colloquium',
        synopsis:
          'Linking genomic selection markers to osmotic stress tolerance and nitrogen-use efficiency in staple crops.',
        specializedTopics: [
          'GWAS Manhattan plot significance corrections (Bonferroni / FDR)',
          'Genomic best linear unbiased prediction (gBLUP)',
          'Field trial phenotypic variance decomposition',
        ],
        requiredReadingOrArtifact: 'Agrarian Metabolic Selection Compendium',
        deliverable: 'Marker-assisted breeding trial design memo',
      },
    ],
  },
  {
    id: 'lec_spatial_graphics_art',
    lectureCode: 'LEC-HUM-710',
    title: 'Real-Time GLSL Shader Architecture & Monumental Surface Media',
    specialization: 'Visual Arts, Computational Design & Monumental Fresco',
    facultyKey: 'Humanities',
    facultyName: 'Humanities, Social Sciences & Arts',
    departmentName: 'Media, Design & Fine Arts',
    lecturerName: 'Prof. Elena Vance & Mestre Rafael Cruz',
    lecturerTitle: 'Co-Chairs of Computational Graphics & Architectural Muralism',
    deliveryFormat: 'Practicum & Case Colloquium',
    nqfLevel: 'NQF Level 7–8 · Studio Masterclass',
    totalDuration: '8 Weeks · 24 Studio Hours',
    scheduleSlot: 'Wednesdays & Fridays · 14:00 UTC',
    syllabusOverview:
      'Dual-track humanities and visual studio seminar bridging Navier-Stokes GLSL raymarching shaders with 50-year mineral silicate and lime-plaster architectural mural chemistry.',
    prerequisites: ['Foundational Color Theory & Studio Composition'],
    assessmentModel: 'Shader & Surface Material Portfolio (70%) + Critical Critique (30%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'HUM-710-01',
        lectureTitle: 'Volumetric Raymarching & Signed Distance Field Composition',
        duration: '90 min',
        format: 'Quantitative Lab',
        synopsis:
          'Constructing smooth boolean SDF primitives, chromatic dispersion passes, and 60fps real-time render budgets.',
        specializedTopics: [
          'Sphere-tracing convergence bounds & surface normals',
          'Navier-Stokes curl-noise advection fields',
          'Adaptive Bitrate (ABR) 4K 60fps capture mastering',
        ],
        requiredReadingOrArtifact: 'GLSL Shader Architecture Reference Deck',
        deliverable: 'Interactive 60fps volumetric shader fragment study',
      },
      {
        lectureNumber: 2,
        unitCode: 'HUM-710-02',
        lectureTitle: 'Mineral Silicate Pigments & Hydraulic Lime Carbonation',
        duration: '90 min',
        format: 'Technical Seminar',
        synopsis:
          'Material preservation science for large-scale outdoor architectural frescoes exposed to coastal humidity and UV radiation.',
        specializedTopics: [
          'Potassium silicate silicification bonding onto concrete substrates',
          'Strontium aluminate photoluminescent mineral layering',
          'Moisture-vapor permeability & freeze-thaw surface sensors',
        ],
        requiredReadingOrArtifact: 'Lisbon & Kyoto Monumental Mural Field Dossier',
        deliverable: 'Exterior facade substrate preparation & pigment schedule',
      },
    ],
  },
  {
    id: 'lec_curriculum_pedagogy',
    lectureCode: 'LEC-EDU-730',
    title: 'Instructional Architecture, Rubric Psychometrics & Adaptive Learning',
    specialization: 'Curriculum Design & Educational Assessment',
    facultyKey: 'Education',
    facultyName: 'Education & Pedagogy',
    departmentName: 'Curriculum Studies & Teacher Education',
    lecturerName: 'Dr. Amara Okafor',
    lecturerTitle: 'Dean of Curriculum Psychometrics & Inclusive Pedagogy',
    deliveryFormat: 'Live Seminar & Lab',
    nqfLevel: 'NQF Level 8 · PGCE / Honours Track',
    totalDuration: '8 Weeks · 24 Lecture Hours',
    scheduleSlot: 'Mondays · 16:30 UTC',
    syllabusOverview:
      'Constructing constructively aligned outcome rubrics, calibrating Item Response Theory (IRT) diagnostic assessments, and structuring universal-design cognitive scaffolds for diverse cohorts.',
    prerequisites: ['Foundational Educational Psychology'],
    assessmentModel: 'Full Course Syllabus & Rubric Blueprint (60%) + Peer Micro-Teaching (40%)',
    specializedSyllabus: [
      {
        lectureNumber: 1,
        unitCode: 'EDU-730-01',
        lectureTitle: 'Constructive Alignment & Taxonomic Outcome Mapping',
        duration: '75 min',
        format: 'Keynote Lecture',
        synopsis:
          'Binding measurable cognitive verbs, formative mastery drills, and summative performance criteria into coherent syllabuses.',
        specializedTopics: [
          'SOLO Taxonomy vs. Revised Bloom Action Verbs',
          'Eliminating assessment-to-objective drift',
          'NQF credit & notional learning hour budgeting (10h per credit)',
        ],
        requiredReadingOrArtifact: 'Constructive Alignment Blueprint Template',
        deliverable: '120-hour module outcome alignment matrix',
      },
      {
        lectureNumber: 2,
        unitCode: 'EDU-730-02',
        lectureTitle: 'Assessment Psychometrics & Constructive Peer Rubric Design',
        duration: '90 min',
        format: 'Technical Seminar',
        synopsis:
          'Designing inter-rater reliable analytic rubrics and diagnosing weak-chapter distractor failures from quiz telemetry.',
        specializedTopics: [
          'Inter-rater reliability calibration (Cohen’s Kappa)',
          'Weak-chapter item discrimination & distractor diagnostics',
          'Scaffolding constructive peer feedback cycles',
        ],
        requiredReadingOrArtifact: 'Analytic Rubric Calibration Dataset',
        deliverable: '4-tier validated analytic grading rubric',
      },
      {
        lectureNumber: 3,
        unitCode: 'EDU-730-03',
        lectureTitle: 'Universal Design for Learning (UDL) & Inclusive Scaffolds',
        duration: '75 min',
        format: 'Case Colloquium',
        synopsis:
          'Building multi-modal instructional sequences that accommodate neurodivergent pacing without diluting analytical rigor.',
        specializedTopics: [
          'Cognitive load theory: intrinsic vs. extraneous split-attention',
          'Formative spaced-retrieval checkpoints',
          'Assistive reading & low-bandwidth offline synchronization',
        ],
        requiredReadingOrArtifact: 'Inclusive Classroom Adaptation Casebook',
        deliverable: 'Adaptive multi-modal lesson plan & micro-lecture',
      },
    ],
  },
];

export function formatLectureSyllabusMarkdown(lecture: FacultyLectureSeries): string {
  const lines: string[] = [
    `# ${lecture.lectureCode}: ${lecture.title}`,
    '',
    `- **Faculty:** ${lecture.facultyName} (${lecture.departmentName})`,
    `- **Specialization:** ${lecture.specialization}`,
    `- **Lead Lecturer:** ${lecture.lecturerName} — ${lecture.lecturerTitle}`,
    `- **Qualification Tier:** ${lecture.nqfLevel}`,
    `- **Delivery & Duration:** ${lecture.deliveryFormat} · ${lecture.totalDuration}`,
    `- **Schedule:** ${lecture.scheduleSlot}`,
    '',
    '## Syllabus Overview',
    lecture.syllabusOverview,
    '',
    '## Prerequisites',
    ...lecture.prerequisites.map((p) => `- ${p}`),
    '',
    `## Assessment Model`,
    lecture.assessmentModel,
    '',
    '## Specialized Lecture Syllabus Units',
    '',
  ];

  lecture.specializedSyllabus.forEach((unit) => {
    lines.push(
      `### ${String(unit.lectureNumber).padStart(2, '0')}. [${unit.unitCode}] ${unit.lectureTitle} (${unit.duration} · ${unit.format})`
    );
    lines.push(unit.synopsis);
    lines.push('');
    lines.push('**Specialized Topics:**');
    unit.specializedTopics.forEach((t) => lines.push(`- ${t}`));
    lines.push(`- **Required Reading / Artifact:** ${unit.requiredReadingOrArtifact}`);
    lines.push(`- **Module Deliverable:** ${unit.deliverable}`);
    lines.push('');
  });

  return lines.join('\n');
}
