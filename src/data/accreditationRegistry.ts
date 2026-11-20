import { AcademicCategoryKey } from './academicCatalog';

export interface RegulatoryBodyReference {
  acronym: string;
  name: string;
  jurisdiction: string;
  focus: string;
  websiteUrl: string;
}

export interface FieldAccreditationProfile {
  categoryKey: AcademicCategoryKey;
  fieldLabel: string;
  primaryBody: RegulatoryBodyReference;
  secondaryBodies: RegulatoryBodyReference[];
  complianceCriteria: string[];
  creditFrameworkSummary: string;
  platformStatusLabel: string;
  credentialVerificationNote: string;
}

export const FIELD_ACCREDITATION_REGISTRY: Record<
  AcademicCategoryKey,
  FieldAccreditationProfile
> = {
  Engineering: {
    categoryKey: 'Engineering',
    fieldLabel: 'Engineering, Technology & Built Environment',
    primaryBody: {
      acronym: 'ABET / ECSA',
      name: 'Accreditation Board for Engineering & Technology / Engineering Council of South Africa',
      jurisdiction: 'International (Washington Accord) & National Statutory Registers',
      focus:
        'Outcome-based engineering curricula, laboratory hours, capstone design moderation, and professional engineer licensure pathways.',
      websiteUrl: 'https://www.abet.org/',
    },
    secondaryBodies: [
      {
        acronym: 'IEAG / WA',
        name: 'International Engineering Alliance — Washington Accord',
        jurisdiction: 'Global Cross-Border Engineering Mobility',
        focus: 'Substantial equivalency of accredited 4-year engineering degree programs.',
        websiteUrl: 'https://www.ieagreements.org/accords/washington/',
      },
      {
        acronym: 'SACAP / RIBA',
        name: 'Architectural & Built Environment Validation Councils',
        jurisdiction: 'Built Environment & Spatial Planning',
        focus: 'Studio portfolio review, structural safety codes, and urban compliance.',
        websiteUrl: 'https://www.architecture.com/',
      },
    ],
    complianceCriteria: [
      'Documented mathematics, physics, and computational lab hours mapped to credit notional hours.',
      'External moderation of final-year capstone design projects and technical problem-solving rubrics.',
      'Verification of instructor academic rank or chartered/professional engineering licensure.',
    ],
    creditFrameworkSummary:
      'Structured as a 120–480 credit reference progression; formal degree credit transfer requires an articulation agreement with an accredited university.',
    platformStatusLabel: 'Internal Quality Benchmark · Not Yet Externally Accredited',
    credentialVerificationNote:
      'TTG certificates currently serve as internal completion records using client-side serial numbers and are not registered on ABET/ECSA statutory rolls.',
  },
  Business: {
    categoryKey: 'Business',
    fieldLabel: 'Business, Economics & Management',
    primaryBody: {
      acronym: 'AACSB / EQUIS',
      name: 'Association to Advance Collegiate Schools of Business / EFMD Quality Improvement System',
      jurisdiction: 'Global Business & Management Education',
      focus:
        'Assurance of learning (AoL), faculty scholarly impact, corporate governance ethics, and strategic management rigor.',
      websiteUrl: 'https://www.aacsb.edu/',
    },
    secondaryBodies: [
      {
        acronym: 'AMBA',
        name: 'Association of MBAs',
        jurisdiction: 'Postgraduate MBA & Executive Leadership',
        focus: 'Cohort selectivity, leadership case methodology, and strategic capstone standards.',
        websiteUrl: 'https://www.associationofmbas.com/',
      },
      {
        acronym: 'ACCA / CFA',
        name: 'Professional Accounting & Investment Institutes',
        jurisdiction: 'Finance, Audit & Quantitative Markets',
        focus: 'Statutory IFRS/GAAP exam exemptions and fiduciary ethics standards.',
        websiteUrl: 'https://www.accaglobal.com/',
      },
    ],
    complianceCriteria: [
      'Measurable Assurance of Learning (AoL) rubrics across finance, quantitative economics, and strategy.',
      'Case-study provenance review and audited assessment grading transparency.',
      'Independent financial ethics and corporate governance module coverage.',
    ],
    creditFrameworkSummary:
      'Structured around 120–360 credit equivalents; formal MBA/BBA exemptions depend on institutional recognition agreements.',
    platformStatusLabel: 'Internal Quality Benchmark · Not Yet Externally Accredited',
    credentialVerificationNote:
      'TTG business modules issue internal completion records only and do not confer ACCA/CFA exam exemptions or accredited university degrees.',
  },
  Health: {
    categoryKey: 'Health',
    fieldLabel: 'Health & Medical Sciences',
    primaryBody: {
      acronym: 'WFME / HPCSA',
      name: 'World Federation for Medical Education / Health Professions Council Authorities',
      jurisdiction: 'Global Medical & Clinical Education Standards',
      focus:
        'Patient-safety protocols, supervised clinical rotations, bioethics compliance, and statutory board eligibility.',
      websiteUrl: 'https://wfme.org/',
    },
    secondaryBodies: [
      {
        acronym: 'GMC / LCME',
        name: 'General Medical Council / Liaison Committee on Medical Education',
        jurisdiction: 'UK & North American Clinical Degree Standards',
        focus: 'Clinical competency benchmarks, pharmacology safety, and hospital residency readiness.',
        websiteUrl: 'https://www.gmc-uk.org/',
      },
      {
        acronym: 'CEPH',
        name: 'Council on Education for Public Health',
        jurisdiction: 'Epidemiology & Health Policy',
        focus: 'Population health biostatistics and public health practice practicums.',
        websiteUrl: 'https://ceph.org/',
      },
    ],
    complianceCriteria: [
      'Mandatory in-person supervised clinical rotations for any patient-facing qualification (cannot be completed solely online).',
      'Institutional bioethics review and evidence-based peer-reviewed medical literature citations.',
      'National health council registration audit prior to any clinical licensure claim.',
    ],
    creditFrameworkSummary:
      'Reference credit taxonomy only. Clinical licensure and medical practice strictly require statutory university enrollment and hospital residency.',
    platformStatusLabel: 'Theoretical Reference Only · Non-Clinical & Non-Accredited',
    credentialVerificationNote:
      'TTG does not grant clinical licenses, hospital privileges, or WFME/HPCSA-accredited medical degrees. All health content is educational only.',
  },
  Science: {
    categoryKey: 'Science',
    fieldLabel: 'Natural & Physical Sciences',
    primaryBody: {
      acronym: 'CHE / QAA',
      name: 'Council on Higher Education / Quality Assurance Agency for Higher Education',
      jurisdiction: 'National Higher Education & Pure Science Degree Frameworks',
      focus:
        'Experimental reproducibility, laboratory safety compliance, mathematical rigor, and peer-reviewed thesis supervision.',
      websiteUrl: 'https://www.qaa.ac.uk/',
    },
    secondaryBodies: [
      {
        acronym: 'ACS / IOP / RSC',
        name: 'Professional Scientific Societies (Chemistry, Physics, Biology)',
        jurisdiction: 'Disciplinary Laboratory Approval',
        focus: 'Wet-lab instrumentation competencies and quantitative research methodology.',
        websiteUrl: 'https://www.acs.org/',
      },
      {
        acronym: 'CHEA',
        name: 'Council for Higher Education Accreditation',
        jurisdiction: 'United States Institutional Recognition Registry',
        focus: 'Recognition of regional and national programmatic scientific accreditors.',
        websiteUrl: 'https://www.chea.org/',
      },
    ],
    complianceCriteria: [
      'Verified quantitative problem sets, statistical uncertainty analysis, and experimental design protocols.',
      'Independent examiner review for honours and doctoral scientific dissertations.',
      'Reproducible data and open-science citation standards.',
    ],
    creditFrameworkSummary:
      'Mapped against 120–360+ reference credit tiers; lab-based degree credits require a chartered host university.',
    platformStatusLabel: 'Internal Quality Benchmark · Not Yet Externally Accredited',
    credentialVerificationNote:
      'Science track completion documents internal self-study progress and is not a substitute for an accredited BSc/MSc laboratory transcript.',
  },
  Humanities: {
    categoryKey: 'Humanities',
    fieldLabel: 'Humanities, Law & Social Sciences',
    primaryBody: {
      acronym: 'QAA / CHEA',
      name: 'Quality Assurance Agency / Council for Higher Education Accreditation',
      jurisdiction: 'Liberal Arts, Social Sciences & Jurisprudence Standards',
      focus:
        'Primary-source scholarship, critical methodology, academic integrity, and peer-reviewed dissertation standards.',
      websiteUrl: 'https://www.chea.org/',
    },
    secondaryBodies: [
      {
        acronym: 'ABA / SRA / LPC',
        name: 'Legal Practice & Bar Admission Regulators',
        jurisdiction: 'Jurisprudence & Legal Practice Qualification',
        focus: 'Statutory legal training requirements for bar or solicitor admission.',
        websiteUrl: 'https://www.americanbar.org/groups/legal_education/',
      },
      {
        acronym: 'APA / BPS',
        name: 'Psychological Associations',
        jurisdiction: 'Psychology & Behavioral Research Ethics',
        focus: 'Human-subjects IRB ethics oversight and clinical counseling accreditation.',
        websiteUrl: 'https://www.apa.org/ed/accreditation',
      },
    ],
    complianceCriteria: [
      'Original thesis/essay plagiarism screening and primary-source bibliographic verification.',
      'Institutional Review Board (IRB) ethics compliance for empirical social research.',
      'Jurisdiction-specific statutory disclosure for legal and psychological tracks.',
    ],
    creditFrameworkSummary:
      'Reference credit mapping for comparative planning; legal or psychological licensure requires jurisdiction-approved degree programs.',
    platformStatusLabel: 'Internal Quality Benchmark · Not Yet Externally Accredited',
    credentialVerificationNote:
      'Certificates issued in Humanities tracks verify TTG platform study completion only and do not qualify holders for bar admission or clinical practice.',
  },
  Education: {
    categoryKey: 'Education',
    fieldLabel: 'Education & Teaching',
    primaryBody: {
      acronym: 'CAEP / SACE / UNESCO-UNEVOC',
      name: 'Council for the Accreditation of Educator Preparation / Teaching Councils',
      jurisdiction: 'Teacher Licensure & Pedagogical Quality Assurance',
      focus:
        'Supervised classroom practicum, inclusive pedagogy standards, curriculum design mastery, and educator ethics.',
      websiteUrl: 'https://caepnet.org/',
    },
    secondaryBodies: [
      {
        acronym: 'DEAC',
        name: 'Distance Education Accrediting Commission',
        jurisdiction: 'Recognized Distance & Online Programmatic Quality',
        focus: 'Rigorous standards for online curriculum delivery, student support, and outcome tracking.',
        websiteUrl: 'https://www.deac.org/',
      },
      {
        acronym: 'UNESCO-UNEVOC',
        name: 'UNESCO International Centre for Technical & Vocational Education',
        jurisdiction: 'Global Educator & Vocational Standards',
        focus: 'Open educational practice, competency mapping, and equitable workforce training.',
        websiteUrl: 'https://unevoc.unesco.org/',
      },
    ],
    complianceCriteria: [
      'Observed classroom practicum hours verified by a licensed mentor teacher for statutory QTS/PGCE.',
      'Differentiated assessment design and child-safeguarding policy compliance.',
      'Pedagogical rubric calibration aligned with national teacher qualification frameworks.',
    ],
    creditFrameworkSummary:
      'Structured to mirror BEd/PGCE/MEd progression for portfolio planning; statutory teaching licensure requires national council endorsement.',
    platformStatusLabel: 'Internal Quality Benchmark · Not Yet Externally Accredited',
    credentialVerificationNote:
      'TTG education credentials represent internal study records and do not confer state Qualified Teacher Status (QTS) or statutory teaching registration.',
  },
};

export interface AccreditationWorkflowStage {
  id: string;
  stepNumber: number;
  title: string;
  shortLabel: string;
  currentState: 'internal_active' | 'partial_review' | 'external_required';
  currentStateLabel: string;
  summary: string;
  studentProtection: string;
  providerDeliverable: string;
  verificationMechanism: string;
  recommendedAuthorities: Array<{ name: string; url: string }>;
}

export const ACCREDITATION_WORKFLOW_STAGES: AccreditationWorkflowStage[] = [
  {
    id: 'stage_design',
    stepNumber: 1,
    title: 'Institutional Curriculum Design',
    shortLabel: 'Curriculum Design',
    currentState: 'internal_active',
    currentStateLabel: 'Active · Internal Platform',
    summary:
      'Faculty architects define program learning outcomes, core syllabus pillars, notional study hours, and NQF-style credit weightings across all 6 disciplines.',
    studentProtection:
      'Ensures every study guide and qualification card states clear entry prerequisites, module topics, and realistic workload expectations before you enroll.',
    providerDeliverable:
      'Structured syllabus outline, chapter-by-chapter objectives, reading lists, and competency rubric matrices.',
    verificationMechanism:
      'Automated schema validation in the TTG catalog plus internal curriculum completeness checks.',
    recommendedAuthorities: [
      { name: 'SAQA NQF Level Descriptors', url: 'https://www.saqa.org.za/' },
      { name: 'UK QAA Quality Code', url: 'https://www.qaa.ac.uk/' },
    ],
  },
  {
    id: 'stage_vetting',
    stepNumber: 2,
    title: 'Course Provider & Faculty Vetting',
    shortLabel: 'Provider Vetting',
    currentState: 'partial_review',
    currentStateLabel: 'Internal Review · External Audit Needed',
    summary:
      'Course authors and institutional partners submit academic credentials, subject-matter citations, and conflict-of-interest disclosures for review.',
    studentProtection:
      'Prevents unverified instructors or unreviewed AI summaries from presenting themselves as formal university coursework.',
    providerDeliverable:
      'Verified academic CV, institutional registration number (when applicable), primary-source bibliography, and peer-review sign-off.',
    verificationMechanism:
      'Currently handled via internal TTG faculty moderation queues; formal external accreditation requires independent governance board oversight.',
    recommendedAuthorities: [
      { name: 'CHEA Recognized Accreditors', url: 'https://www.chea.org/' },
      { name: 'DEAC Institutional Standards', url: 'https://www.deac.org/' },
    ],
  },
  {
    id: 'stage_regulatory',
    stepNumber: 3,
    title: 'Statutory & Programmatic Accreditation',
    shortLabel: 'Regulatory Approval',
    currentState: 'external_required',
    currentStateLabel: 'External Application Required',
    summary:
      'For a program to award transferable academic credits or licensed professional degrees, the host institution must pass formal evaluation by national & field councils.',
    studentProtection:
      'Guarantees full disclosure: TTG clearly flags that current courses have not yet received external statutory approval and do not grant automatic university credit.',
    providerDeliverable:
      'Self-evaluation report (SER), site-visit audit dossier, financial sustainability proof, and articulation agreements with chartered universities.',
    verificationMechanism:
      'Public listing in statutory national registers (e.g., CHE/SAQA, US Dept. of Education DAPIP, UK OfS Register) or programmatic boards (ABET, AACSB, WFME).',
    recommendedAuthorities: [
      { name: 'US Dept. of Education DAPIP Registry', url: 'https://ope.ed.gov/dapip/' },
      { name: 'CHE South Africa Accreditation', url: 'https://www.che.ac.za/' },
      { name: 'ABET Programmatic Review', url: 'https://www.abet.org/' },
    ],
  },
  {
    id: 'stage_moderation',
    stepNumber: 4,
    title: 'Assessment Moderation, Proctoring & Appeals',
    shortLabel: 'Moderation & Appeals',
    currentState: 'partial_review',
    currentStateLabel: 'Internal Quizzes & Learner Appeals Active · External Proctoring Pending',
    summary:
      'Students complete chapter reading logs, module quizzes, and offline capstone assignments graded against rubrics, backed by a formal Learner Assessment Appeals & Faculty Moderator queue.',
    studentProtection:
      'Tracks real study engagement telemetry and guarantees learners can contest quiz scores, completion credits, or certificate flags through a 5-day SLA moderator appeal process.',
    providerDeliverable:
      'Psychometric question review, external examiner sampling of capstone submissions, identity-verified proctoring, and documented moderator appeal decisions.',
    verificationMechanism:
      'Active internal quiz scoring, offline assignment queues, and live Faculty Moderator Appeals review today; third-party identity proctoring is required for formal statutory credit.',
    recommendedAuthorities: [
      { name: 'Quality Matters (QM) Rubric', url: 'https://www.qualitymatters.org/' },
      { name: 'ICDE Quality Network', url: 'https://www.icde.org/' },
    ],
  },
  {
    id: 'stage_certification',
    stepNumber: 5,
    title: 'Final Certification & Public Verification Registry',
    shortLabel: 'Verification Ledger',
    currentState: 'partial_review',
    currentStateLabel: 'Server Ledger & Open Badges JSON-LD Active · Statutory Roll Pending',
    summary:
      'Upon passing assessments, completion certificates are recorded in the TTG server verification ledger with HMAC-SHA256 signatures and 1EdTech Open Badges 3.0 JSON-LD Verifiable Credential proofs.',
    studentProtection:
      'Full honesty: anyone can verify certificate serials at /verify/:serial in real time, while statutory disclosures clearly state TTG records are internal completion credentials not yet registered on SAQA/CHE/QCTO statutory rolls.',
    providerDeliverable:
      'Server-side immutable issuance ledger, cryptographic HMAC-SHA256 / Open Badges 3.0 JSON-LD proofs, and public /verify/:serial lookup + statutory QCTO/DHET listing.',
    verificationMechanism:
      'Active server verification ledger (/api/certificates/verify/:serial) with Open Badges 3.0 JSON-LD proof inspection; external Credly/Accredible federation and statutory national registry listing remain pending regulatory approval.',
    recommendedAuthorities: [
      { name: '1EdTech Open Badges 3.0', url: 'https://www.imsglobal.org/spec/ob/v3p0/' },
      { name: 'Accredible Digital Credentials', url: 'https://www.accredible.com/' },
      { name: 'Credly Enterprise Issuing', url: 'https://info.credly.com/' },
    ],
  },
];

export interface SiteAccreditationPathway {
  id: string;
  acronym: string;
  bodyName: string;
  region: 'South Africa (National & SETA)' | 'International Online & CPD' | 'Verifiable Digital Credentials';
  fitForTtg: string;
  scopeCovered: string;
  keyRequirements: string[];
  estimatedTimeline: string;
  applicationUrl: string;
}

export const SITE_ACCREDITATION_PATHWAYS: SiteAccreditationPathway[] = [
  {
    id: 'qcto_sa',
    acronym: 'QCTO',
    bodyName: 'Quality Council for Trades and Occupations (Skills Development Provider)',
    region: 'South Africa (National & SETA)',
    fitForTtg:
      'Best primary South African accreditation for TTG’s structured Occupational Skills Programmes (including AI Systems, Software, and Digital Operations).',
    scopeCovered: 'Occupational Qualifications, Part-Qualifications & NQF Skills Programmes',
    keyRequirements: [
      'CIPC Company Registration & Valid SARS Tax Compliance PIN',
      'Quality Management System (QMS), Learner Appeals & Assessment Policies',
      'Facilitator, Registered Assessor & Moderator CVs and Qualifications',
      'Curriculum alignment (Knowledge + Practical + Workplace components) & QCTO evaluation fee',
    ],
    estimatedTimeline: '3–6 Months (Desktop Evaluation + Site/Virtual Verification)',
    applicationUrl: 'https://www.qcto.org.za/',
  },
  {
    id: 'mict_seta',
    acronym: 'MICT SETA',
    bodyName: 'Media, Information and Communication Technologies SETA',
    region: 'South Africa (National & SETA)',
    fitForTtg:
      'Directly matches TTG’s AI, Software, Film/Videography, Photography, and Digital Media tracks for workplace approval, logbooks, and sector grants.',
    scopeCovered: 'Workplace-Based Learning (WBL) Approval, Learnerships & Sector Grants',
    keyRequirements: [
      'QCTO Skills Development Provider alignment for IT, Media & Film fields',
      'Signed Employer Memoranda of Understanding (MoUs) for experiential learning',
      'Structured Workplace Logbooks & Registered Mentorship Plans',
    ],
    estimatedTimeline: '2–4 Months',
    applicationUrl: 'https://www.mict.org.za/',
  },
  {
    id: 'dhet_che_saqa',
    acronym: 'DHET / CHE / SAQA',
    bodyName: 'Dept. of Higher Education & Training · Council on Higher Education · SAQA',
    region: 'South Africa (National & SETA)',
    fitForTtg:
      'Mandatory statutory registration if TTG transitions from short skills courses into full NQF Higher Certificates, Diplomas, or Degrees.',
    scopeCovered: 'Private Higher Education Institution (PHEI) Registration & NQF Qualifications',
    keyRequirements: [
      'Audited financial sustainability guarantees & legal governance charter',
      'CHE HEQC programme accreditation dossier before DHET registration',
      'SAQA NQF Level descriptors (Levels 5–10) & external moderation board',
    ],
    estimatedTimeline: '12–24 Months',
    applicationUrl: 'https://www.che.ac.za/',
  },
  {
    id: 'cpd_standards',
    acronym: 'CPD Standards',
    bodyName: 'The CPD Standards Office (Online Learning Platform & Course Accreditation)',
    region: 'International Online & CPD',
    fitForTtg:
      'Fastest practical international accreditation specifically built to accredit Online Learning Platforms (OLPs), digital study guides, and creator academies.',
    scopeCovered: 'LMS Platform Validation, Short Courses & Verifiable CPD Hours',
    keyRequirements: [
      'Structured learning outcomes, self-assessment quizzes, and completion feedback',
      'Instructor/Author bio transparency & editorial review process',
      'LMS platform walkthrough & learner support policy audit',
    ],
    estimatedTimeline: '4–8 Weeks',
    applicationUrl: 'https://www.cpdstandards.com/',
  },
  {
    id: 'iacet_ceu',
    acronym: 'IACET',
    bodyName: 'International Association for Continuing Education and Training',
    region: 'International Online & CPD',
    fitForTtg:
      'Authorizes TTG to award globally recognized Continuing Education Units (CEUs) under the ANSI/IACET Standard for workforce & executive upskilling.',
    scopeCovered: 'ANSI/IACET Accredited Provider Status (Continuing Education Units)',
    keyRequirements: [
      'Instructional design process mapped to the 9 categories of the ANSI/IACET Standard',
      'Measurement of learning outcomes and verified contact-hour calculation (10 hrs = 1 CEU)',
      'Peer review of exemplary courses + virtual site audit',
    ],
    estimatedTimeline: '4–6 Months',
    applicationUrl: 'https://www.iacet.org/',
  },
  {
    id: 'iso_21001',
    acronym: 'ISO 21001',
    bodyName: 'ISO 21001 Educational Organizations Management System (EOMS)',
    region: 'International Online & CPD',
    fitForTtg:
      'Certifies TTG’s end-to-end educational governance, learner safety, assessment fairness, and continuous improvement across all faculties and stores.',
    scopeCovered: 'Organization-Wide Educational Quality Management Certification',
    keyRequirements: [
      'Documented Educational Management System (PDCA cycle) & Learner Needs Policy',
      'Internal audit records, data security (POPIA/GDPR), and ethics controls',
      'External Stage 1 & Stage 2 audit via an accredited ISO registrar (e.g. BSI, SABS, SGS)',
    ],
    estimatedTimeline: '3–6 Months',
    applicationUrl: 'https://www.iso.org/standard/66266.html',
  },
  {
    id: 'quality_matters',
    acronym: 'QM / DEAC',
    bodyName: 'Quality Matters Rubric & Distance Education Accrediting Commission',
    region: 'International Online & CPD',
    fitForTtg:
      'Gold-standard benchmarks for online course design (QM Higher Ed Rubric) and full US-recognized distance education institutional accreditation (DEAC).',
    scopeCovered: 'Online Course Peer Certification (QM) & Distance Institution Accreditation (DEAC)',
    keyRequirements: [
      'QM Rubric alignment (42 Specific Review Standards across 8 core areas)',
      'Verified student identity proctoring & retention/completion analytics',
      'Full institutional self-evaluation report & peer site inspection (for DEAC)',
    ],
    estimatedTimeline: '2–3 Months (QM) · 12–18 Months (DEAC)',
    applicationUrl: 'https://www.qualitymatters.org/',
  },
  {
    id: 'open_badges',
    acronym: 'Open Badges 3.0',
    bodyName: '1EdTech Open Badges 3.0 / W3C Verifiable Credentials (Accredible / Credly)',
    region: 'Verifiable Digital Credentials',
    fitForTtg:
      'Immediately upgrades TTG certificates from static local serials into employer-verifiable cryptographic credentials hosted on a public verification API.',
    scopeCovered: 'Cryptographically Signed Digital Certificates & Employer Lookup Registry',
    keyRequirements: [
      'Server-side certificate issuance ledger linked to completed quizzes/assessments',
      'Ed25519 / JSON-LD Verifiable Credential signing or Accredible/Credly API integration',
      'Public /verify/:serial endpoint showing recipient, issue date, and syllabus criteria',
    ],
    estimatedTimeline: '2–4 Weeks Engineering Integration',
    applicationUrl: 'https://www.imsglobal.org/spec/ob/v3p0/',
  },
];

export const SITE_ACCREDITATION_READINESS_CHECKLIST: Array<{
  id: string;
  label: string;
  detail: string;
}> = [
  {
    id: 'legal_entity',
    label: 'Legal Entity & Tax Registration (CIPC / SARS PIN)',
    detail: 'Required before submitting any QCTO, SETA, DHET, or ISO 21001 application.',
  },
  {
    id: 'qms_policies',
    label: 'Quality Management System (QMS) & Learner Appeals Policy',
    detail: 'Written governance for admissions, plagiarism, re-assessments, refunds, and data privacy (POPIA/GDPR).',
  },
  {
    id: 'faculty_cvs',
    label: 'Facilitator, Registered Assessor & Moderator Dossiers',
    detail: 'Certified IDs, subject qualifications (>= NQF level taught), and assessor/moderator registrations.',
  },
  {
    id: 'curriculum_matrix',
    label: 'Notional Hours & Curriculum Alignment Matrix',
    detail: 'Map every TTG study guide and QCTO blueprint into Knowledge, Practical, and Assessment notional hours.',
  },
  {
    id: 'workplace_mou',
    label: 'Workplace / Industry Partner MoUs (For Practical Tracks)',
    detail: 'Signed host-employer Memoranda of Understanding & logbooks where practical hours apply.',
  },
  {
    id: 'verifiable_api',
    label: 'Public Certificate Verification Ledger & Proctored Exams',
    detail: 'Persist issued certificate serials server-side with public lookup URLs or Open Badges 3.0 signing.',
  },
];

