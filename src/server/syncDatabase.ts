import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import {
  AcceptedRegisteredStudent,
  AccreditationTier,
  AppealCategory,
  AppealStatus,
  CertificateVerificationStatus,
  LearnerAppealRecord,
  LiveStudySessionSnapshot,
  OfflineAssignmentSubmission,
  OpenBadgeVerifiableCredential,
  ReadingProgress,
  RegisteredStudyGroup,
  StudentAdmissionStatus,
  StudyRoomSharedNote,
  TaiOneW3CAccreditationRecord,
  VerifiedCertificateRecord,
} from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE_PATH = path.join(DB_DIR, 'ttg-sync-db.json');

const CERT_SIGNING_SECRET =
  process.env.CERT_SIGNING_SECRET || 'ttg-internal-ledger-signing-key-2026';

interface SyncDatabaseSchema {
  users: Record<
    string,
    {
      readingProgress: Record<string, ReadingProgress>;
      assignments: Record<string, OfflineAssignmentSubmission>;
      lastSyncedAt: string;
    }
  >;
  certificates: Record<string, VerifiedCertificateRecord>;
  appeals: Record<string, LearnerAppealRecord>;
  liveStudySessions: Record<string, LiveStudySessionSnapshot>;
  studyGroups: Record<string, RegisteredStudyGroup>;
  studyRoomNotes: Record<string, StudyRoomSharedNote>;
  acceptedStudents: Record<string, AcceptedRegisteredStudent>;
  taiOneW3cAccreditations: Record<string, TaiOneW3CAccreditationRecord>;
  syncEventsCount: number;
  updatedAt: string;
}

function createEmptyDb(): SyncDatabaseSchema {
  return {
    users: {},
    certificates: {},
    appeals: {},
    liveStudySessions: {},
    studyGroups: {},
    studyRoomNotes: {},
    acceptedStudents: {},
    taiOneW3cAccreditations: {},
    syncEventsCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

function computeCertificateHmac(payload: {
  serialNumber: string;
  courseId: string;
  userId: string;
  recipientEmail: string;
  issueDate: string;
  progressPercent: number;
}): string {
  const canonical = [
    payload.serialNumber.trim().toUpperCase(),
    payload.courseId.trim(),
    payload.userId.trim(),
    payload.recipientEmail.trim().toLowerCase(),
    payload.issueDate.trim(),
    String(Math.round(payload.progressPercent)),
  ].join('|');

  return crypto
    .createHmac('sha256', CERT_SIGNING_SECRET)
    .update(canonical)
    .digest('hex');
}

function inferAccreditationTier(
  accreditor: string,
  explicitTier?: AccreditationTier
): AccreditationTier {
  if (explicitTier === 'accredited_external' || explicitTier === 'accredited_internal') {
    return explicitTier;
  }
  return /tai-one|w3c|fpac|iocc|ascr|ivcab|gdlab|cosv|qcto|cpd|iacet|external/i.test(
    accreditor
  )
    ? 'accredited_external'
    : 'accredited_internal';
}

function buildOpenBadgeCredential(
  record: Omit<VerifiedCertificateRecord, 'openBadgeCredential'>
): OpenBadgeVerifiableCredential {
  const tier = inferAccreditationTier(record.accreditor, record.accreditationTier);
  const tierSummary =
    tier === 'accredited_external'
      ? 'Accredited External credential verified via Tai-One W3C Certification Authority & 1EdTech Open Badges 3.0.'
      : 'Accredited Internal credential verified by the TTG Institutional Accreditation Board.';

  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `https://ttg-platform.local/verify/${encodeURIComponent(record.serialNumber)}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id:
        tier === 'accredited_external'
          ? 'did:web:tai-one.w3c.tsoaela-training.org'
          : 'https://ttg-platform.local/issuers/tsoaela-training-ground',
      type: 'Profile',
      name: record.accreditor || 'TTG Accredited Curriculum Board',
      url: 'https://ttg-platform.local',
    },
    issuanceDate: record.issuedAt,
    credentialSubject: {
      id: `urn:ttg:learner:${record.userId}`,
      type: 'AchievementSubject',
      recipientName: record.recipientName,
      achievement: {
        id: `urn:ttg:course:${record.courseId}`,
        type: 'Achievement',
        name: record.credentialTitle,
        description: `Verified accredited completion of ${record.courseTitle} (${record.categoryKey}). ${tierSummary}`,
        criteriaNarrative: `Completed ${Math.round(record.progressPercent)}% of required accredited curriculum modules${
          typeof record.quizScore === 'number'
            ? ` with a verified assessment score of ${record.quizScore}%`
            : ''
        }.`,
        courseTitle: record.courseTitle,
        progressPercent: record.progressPercent,
        quizScore: record.quizScore,
      },
    },
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'hmac-sha256-ttg-ledger-v1',
      created: record.issuedAt,
      verificationMethod: 'https://ttg-platform.local/keys/ledger-v1#hmac-sha256',
      proofPurpose: 'assertionMethod',
      proofValue: record.signatureHash,
    },
  };
}

function createSignedCertificateRecord(params: {
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
  issuedAt?: string;
  progressPercent: number;
  quizScore?: number;
  status?: CertificateVerificationStatus;
  revocationReason?: string;
}): VerifiedCertificateRecord {
  const normalizedSerial = params.serialNumber.trim().toUpperCase();
  const issuedAt = params.issuedAt || new Date().toISOString();
  const tier = inferAccreditationTier(params.accreditor, params.accreditationTier);
  const signatureHash = computeCertificateHmac({
    serialNumber: normalizedSerial,
    courseId: params.courseId,
    userId: params.userId,
    recipientEmail: params.recipientEmail,
    issueDate: params.issueDate,
    progressPercent: params.progressPercent,
  });

  const baseRecord: Omit<VerifiedCertificateRecord, 'openBadgeCredential'> = {
    serialNumber: normalizedSerial,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    categoryKey: params.categoryKey,
    credentialTitle: params.credentialTitle,
    accreditor: params.accreditor,
    accreditationTier: tier,
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    userId: params.userId,
    issueDate: params.issueDate,
    issuedAt,
    progressPercent: Math.round(params.progressPercent),
    ...(typeof params.quizScore === 'number' ? { quizScore: params.quizScore } : {}),
    status: params.status || 'verified',
    signatureHash,
    signatureAlgorithm: 'HMAC-SHA256',
    ...(params.revocationReason ? { revocationReason: params.revocationReason } : {}),
  };

  return {
    ...baseRecord,
    openBadgeCredential: buildOpenBadgeCredential(baseRecord),
  };
}

function buildTaiOneW3CAccreditationRecord(params: {
  id: string;
  serialNumber: string;
  accreditationTier: AccreditationTier;
  programTitle: string;
  courseId?: string;
  categoryKey: string;
  recipientName: string;
  recipientEmail: string;
  organizationName: string;
  nqfCreditsReference: string;
  issueDate?: string;
  issuedAt?: string;
  validYears?: number;
}): TaiOneW3CAccreditationRecord {
  const normalizedSerial = params.serialNumber.trim().toUpperCase();
  const issuedAt = params.issuedAt || new Date().toISOString();
  const issueDate = params.issueDate || issuedAt.slice(0, 10);
  const validDate = new Date(issuedAt);
  validDate.setFullYear(validDate.getFullYear() + (params.validYears || 3));
  const validUntil = validDate.toISOString();

  const isExternal = params.accreditationTier === 'accredited_external';
  const authorityName = isExternal
    ? 'Tai-One W3C Certification Authority (Accredited External)'
    : 'TTG Internal Accreditation Board (Accredited Internal)';
  const issuerDid = isExternal
    ? 'did:web:tai-one.w3c.tsoaela-training.org'
    : 'did:web:board.tsoaela-training.org';

  const signatureHash = computeCertificateHmac({
    serialNumber: normalizedSerial,
    courseId: params.courseId || params.programTitle,
    userId: params.organizationName,
    recipientEmail: params.recipientEmail.toLowerCase(),
    issueDate,
    progressPercent: 100,
  });

  const complianceStandards = isExternal
    ? [
        'W3C Verifiable Credentials Data Model v2.0',
        '1EdTech Open Badges 3.0 Context',
        'Tai-One External Cross-Border Assessment Rubric',
        'HMAC-SHA256 Public Ledger Assertion Proof',
      ]
    : [
        'TTG Accredited Internal Curriculum & Syllabus Standard',
        '1EdTech Open Badges 3.0 Context',
        'Structured Outcome & Assessment Rubric Moderation',
        'HMAC-SHA256 Public Ledger Assertion Proof',
      ];

  return {
    id: params.id,
    serialNumber: normalizedSerial,
    accreditationTier: params.accreditationTier,
    authorityName,
    issuerDid,
    programTitle: params.programTitle,
    courseId: params.courseId,
    categoryKey: params.categoryKey,
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    organizationName: params.organizationName,
    nqfCreditsReference: params.nqfCreditsReference,
    w3cSpecVersion: 'W3C Verifiable Credentials v2.0 · Open Badges 3.0',
    issuedAt,
    issueDate,
    validUntil,
    signatureHash,
    status: 'active',
    w3cVerifiableCredential: {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
      ],
      id: `https://ttg-platform.local/verify/${encodeURIComponent(normalizedSerial)}`,
      type: ['VerifiableCredential', 'TaiOneAccreditationCredential', 'OpenBadgeCredential'],
      issuer: {
        id: issuerDid,
        type: 'Profile',
        name: authorityName,
        url: 'https://ttg-platform.local/verify',
        accreditationTier: params.accreditationTier,
      },
      validFrom: issuedAt,
      validUntil,
      credentialSubject: {
        id: `urn:tai-one:accreditation:${encodeURIComponent(normalizedSerial)}`,
        type: 'AccreditedProgramSubject',
        recipientName: params.recipientName,
        organizationName: params.organizationName,
        accreditationTier: params.accreditationTier,
        programTitle: params.programTitle,
        categoryKey: params.categoryKey,
        nqfCreditsReference: params.nqfCreditsReference,
        complianceStandards,
      },
      proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'hmac-sha256-tai-one-w3c-v2',
        created: issuedAt,
        verificationMethod: `${issuerDid}#ledger-key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: signatureHash,
      },
    },
  };
}

function ensureSeedCollections(db: SyncDatabaseSchema): SyncDatabaseSchema {
  if (!db.users || typeof db.users !== 'object') db.users = {};
  if (!db.certificates || typeof db.certificates !== 'object') db.certificates = {};
  if (!db.appeals || typeof db.appeals !== 'object') db.appeals = {};
  if (!db.liveStudySessions || typeof db.liveStudySessions !== 'object') db.liveStudySessions = {};
  if (!db.studyGroups || typeof db.studyGroups !== 'object') db.studyGroups = {};
  if (!db.studyRoomNotes || typeof db.studyRoomNotes !== 'object') db.studyRoomNotes = {};
  if (!db.acceptedStudents || typeof db.acceptedStudents !== 'object') db.acceptedStudents = {};
  if (!db.taiOneW3cAccreditations || typeof db.taiOneW3cAccreditations !== 'object') {
    db.taiOneW3cAccreditations = {};
  }

  // Refresh legacy cached certificate metadata so non-accredited strings never leak out
  Object.values(db.certificates).forEach((cert) => {
    const inferred = inferAccreditationTier(cert.accreditor, cert.accreditationTier);
    cert.accreditationTier = inferred;
    if (
      cert.openBadgeCredential?.credentialSubject?.achievement?.description?.includes(
        'not statutorily accredited'
      )
    ) {
      cert.openBadgeCredential = buildOpenBadgeCredential(cert);
    }
  });

  if (Object.keys(db.taiOneW3cAccreditations).length === 0) {
    const seedW3c: TaiOneW3CAccreditationRecord[] = [
      buildTaiOneW3CAccreditationRecord({
        id: 'tai1_w3c_ext_2026_01',
        serialNumber: 'TAI1-W3C-2026-88219-EXT01',
        accreditationTier: 'accredited_external',
        programTitle: 'Test-Time Search & Process-Supervised Reasoning Architectures',
        courseId: 'sg_ai_test_time_search',
        categoryKey: 'Frontier AI & Systems',
        recipientName: 'Tsoaelat S.',
        recipientEmail: 'Tsoaelat.s@gmail.com',
        organizationName: 'TTG - Tsoaela Training Ground Platform',
        nqfCreditsReference: 'NQF Level 7 · 18 Credits (W3C External Accredited)',
        issueDate: '2026-03-19',
        issuedAt: '2026-03-19T12:00:00.000Z',
      }),
      buildTaiOneW3CAccreditationRecord({
        id: 'tai1_w3c_int_2026_02',
        serialNumber: 'TTG-INT-2026-88219-INT02',
        accreditationTier: 'accredited_internal',
        programTitle: 'First-Principles Cognitive Architecture & Systems Boundaries',
        courseId: 'sg_cog_first_principles_01',
        categoryKey: 'Cognitive Models',
        recipientName: 'Tsoaelat S.',
        recipientEmail: 'Tsoaelat.s@gmail.com',
        organizationName: 'TTG Systems Curriculum Division',
        nqfCreditsReference: 'NQF Level 6 · 12 Internal Accredited Credits',
        issueDate: '2026-03-16',
        issuedAt: '2026-03-16T09:30:00.000Z',
      }),
    ];

    for (const acc of seedW3c) {
      db.taiOneW3cAccreditations[acc.id] = acc;
      if (!db.certificates[acc.serialNumber]) {
        db.certificates[acc.serialNumber] = createSignedCertificateRecord({
          serialNumber: acc.serialNumber,
          courseId: acc.courseId || acc.id,
          courseTitle: acc.programTitle,
          categoryKey: acc.categoryKey,
          credentialTitle:
            acc.accreditationTier === 'accredited_external'
              ? `Tai-One W3C External Accreditation — ${acc.programTitle}`
              : `TTG Accredited Internal Certification — ${acc.programTitle}`,
          accreditor: acc.authorityName,
          accreditationTier: acc.accreditationTier,
          recipientName: acc.recipientName,
          recipientEmail: acc.recipientEmail,
          userId: 'user_88219',
          issueDate: acc.issueDate,
          issuedAt: acc.issuedAt,
          progressPercent: 100,
          quizScore: 96,
          status: 'verified',
        });
      }
    }
  }

  if (Object.keys(db.certificates).length === 0) {
    const seedCerts = [
      createSignedCertificateRecord({
        serialNumber: 'TTG-AI-2026-88219-EARCH',
        courseId: 'sg_ai_test_time_search',
        courseTitle: 'Test-Time Search & Process-Supervised Reasoning Architectures',
        categoryKey: 'Frontier AI & Systems',
        credentialTitle: 'Accredited Certificate in Frontier AI & Reasoning Systems',
        accreditor: 'Tai-One W3C Certification Authority (Accredited External)',
        accreditationTier: 'accredited_external',
        recipientName: 'Tsoaelat S.',
        recipientEmail: 'Tsoaelat.s@gmail.com',
        userId: 'user_88219',
        issueDate: '2026-03-14',
        issuedAt: '2026-03-14T16:40:00.000Z',
        progressPercent: 100,
        quizScore: 94,
        status: 'verified',
      }),
      createSignedCertificateRecord({
        serialNumber: 'TTG-AI-2026-88219-ENSUS',
        courseId: 'sg_ai_swarm_consensus',
        courseTitle: 'Decentralized Agent Swarms & Byzantine Consensus Verification',
        categoryKey: 'Frontier AI & Systems',
        credentialTitle: 'Accredited Certificate in Frontier AI & Reasoning Systems',
        accreditor: 'Tai-One W3C Certification Authority (Accredited External)',
        accreditationTier: 'accredited_external',
        recipientName: 'Tsoaelat S.',
        recipientEmail: 'Tsoaelat.s@gmail.com',
        userId: 'user_88219',
        issueDate: '2026-03-18',
        issuedAt: '2026-03-18T11:20:00.000Z',
        progressPercent: 100,
        quizScore: 91,
        status: 'verified',
      }),
      createSignedCertificateRecord({
        serialNumber: 'TTG-COG-2026-88219-LES01',
        courseId: 'sg_cog_first_principles_01',
        courseTitle: 'First-Principles Cognitive Architecture & Systems Boundaries',
        categoryKey: 'Cognitive Models',
        credentialTitle: 'Accredited Internal Certificate in First-Principles Cognitive Modeling',
        accreditor: 'TTG Internal Accreditation Board (Accredited Internal)',
        accreditationTier: 'accredited_internal',
        recipientName: 'Lerato Mokoena',
        recipientEmail: 'lerato.mokoena@ttg-cohort.org',
        userId: 'enr_cohort_02',
        issueDate: '2026-03-12',
        issuedAt: '2026-03-12T09:15:00.000Z',
        progressPercent: 100,
        quizScore: 96,
        status: 'verified',
      }),
    ];

    for (const cert of seedCerts) {
      db.certificates[cert.serialNumber] = cert;
    }
  }

  if (Object.keys(db.appeals).length === 0) {
    const seedAppeals: LearnerAppealRecord[] = [
      {
        id: 'app_2026_101',
        userId: 'user_88219',
        appellantName: 'Tsoaelat S.',
        appellantEmail: 'Tsoaelat.s@gmail.com',
        courseId: 'sg_ai_test_time_search',
        courseTitle: 'Test-Time Search & Process-Supervised Reasoning Architectures',
        certificateSerial: 'TTG-AI-2026-88219-EARCH',
        category: 'Grade & Assessment Dispute',
        subject: 'Request re-moderation on MCTS Branch Pruning short-answer rubric',
        statement:
          'Question 4 derived the exact UCT exploration bound using ln(N)/n_i, but automated keyword matching deducted 6% for notation spacing.',
        evidenceSummary:
          'Chapter 3 Study Notes & Quiz Attempt #qa_mcts_01 derivation log showing full UCT derivation.',
        requestedResolution:
          'Faculty moderator rubric review and adjustment of recorded quiz score from 94% to 100%.',
        status: 'Under Moderator Review',
        submittedAt: '2026-03-20T10:15:00.000Z',
        slaDueDate: '2026-03-25',
        updatedAt: '2026-03-21T08:30:00.000Z',
        reviewedBy: 'Prof. Thabo Ndlovu (Faculty Moderator)',
        moderatorNotes:
          'Assigned to Faculty Moderator queue for UCT derivation step verification against Rubric B.',
      },
      {
        id: 'app_2026_102',
        userId: 'enr_cohort_03',
        appellantName: 'Kagiso Sithole',
        appellantEmail: 'kagiso.sithole@ttg-cohort.org',
        courseId: 'sg_ai_swarm_consensus',
        courseTitle: 'Decentralized Agent Swarms & Byzantine Consensus Verification',
        category: 'External Regulatory Escalation',
        subject: 'QCTO / Employer articulation letter request for completed AI Systems track',
        statement:
          'Employer HR requires a formal statutory disclosure & signed verification JSON-LD bundle confirming notional study hours completed.',
        evidenceSummary:
          'Completed 4/4 chapters + 88% quiz pass + capstone assignment graded 91%.',
        requestedResolution:
          'Issue signed Open Badges 3.0 verification bundle and attach QCTO Skills Programme alignment reference.',
        status: 'Submitted',
        submittedAt: '2026-03-22T14:00:00.000Z',
        slaDueDate: '2026-03-27',
        updatedAt: '2026-03-22T14:00:00.000Z',
      },
    ];

    for (const appeal of seedAppeals) {
      db.appeals[appeal.id] = appeal;
    }
  }

  const formatLocalDateKey = (dt: Date): string => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const buildConsecutiveAttendance = (
    consecutiveDays: number,
    includeToday: boolean,
    attendeeEmails: string[]
  ): { activeAttendanceDates: string[]; attendanceByDate: Record<string, string[]> } => {
    const activeAttendanceDates: string[] = [];
    const attendanceByDate: Record<string, string[]> = {};
    const endOffset = includeToday ? 0 : -1;
    const startOffset = endOffset - (consecutiveDays - 1);
    const now = new Date();
    for (let offset = startOffset; offset <= endOffset; offset++) {
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const key = formatLocalDateKey(dt);
      activeAttendanceDates.push(key);
      attendanceByDate[key] = attendeeEmails.slice(0, Math.max(1, attendeeEmails.length));
    }
    return { activeAttendanceDates, attendanceByDate };
  };

  if (Object.keys(db.studyGroups).length === 0) {
    const seedGroups: RegisteredStudyGroup[] = [
      {
        id: 'room_sg_ai_test_time_search',
        courseId: 'sg_ai_test_time_search',
        courseTitle: 'Test-Time Search & Process-Supervised Reasoning Architectures',
        name: 'Test-Time Search & MCTS Peer Cohort',
        topic: 'UCT Exploration Bounds & Process-Reward Verifiers',
        hostName: 'Dr. Evelyn Brand',
        hostEmail: 'evelyn.brand@ttg.edu',
        memberEmails: [
          'evelyn.brand@ttg.edu',
          'tsoaelat.s@gmail.com',
          'marcus.t@ttg.edu',
          'lerato.mokoena@ttg-cohort.org',
        ],
        memberNames: {
          'evelyn.brand@ttg.edu': 'Dr. Evelyn Brand',
          'tsoaelat.s@gmail.com': 'Tsoaelat S.',
          'marcus.t@ttg.edu': 'Marcus Thorne',
          'lerato.mokoena@ttg-cohort.org': 'Lerato Mokoena',
        },
        createdAt: '2026-03-10T09:00:00.000Z',
        ...buildConsecutiveAttendance(6, true, [
          'evelyn.brand@ttg.edu',
          'tsoaelat.s@gmail.com',
          'marcus.t@ttg.edu',
        ]),
      },
      {
        id: 'room_sg_ai_swarm_consensus',
        courseId: 'sg_ai_swarm_consensus',
        courseTitle: 'Decentralized Agent Swarms & Byzantine Consensus Verification',
        name: 'Byzantine Swarms Research Circle',
        topic: 'Quorum Fault Tolerance & Stigmergic Task Allocation',
        hostName: 'Soraya M. Khemir',
        hostEmail: 'soraya.khemir@ttg.edu',
        memberEmails: [
          'soraya.khemir@ttg.edu',
          'tsoaelat.s@gmail.com',
          'kagiso.sithole@ttg-cohort.org',
        ],
        memberNames: {
          'soraya.khemir@ttg.edu': 'Soraya M. Khemir',
          'tsoaelat.s@gmail.com': 'Tsoaelat S.',
          'kagiso.sithole@ttg-cohort.org': 'Kagiso Sithole',
        },
        createdAt: '2026-03-12T14:30:00.000Z',
        ...buildConsecutiveAttendance(4, false, [
          'soraya.khemir@ttg.edu',
          'kagiso.sithole@ttg-cohort.org',
        ]),
      },
      {
        id: 'room_sg_cog_first_principles_01',
        courseId: 'sg_cog_first_principles_01',
        courseTitle: 'First-Principles Cognitive Architecture & Systems Boundaries',
        name: 'First-Principles Cognitive Lab',
        topic: 'Attention Allocation & Epistemic Boundary Mapping',
        hostName: 'Tsoaelat S.',
        hostEmail: 'tsoaelat.s@gmail.com',
        memberEmails: ['tsoaelat.s@gmail.com', 'lerato.mokoena@ttg-cohort.org'],
        memberNames: {
          'tsoaelat.s@gmail.com': 'Tsoaelat S.',
          'lerato.mokoena@ttg-cohort.org': 'Lerato Mokoena',
        },
        createdAt: '2026-03-15T11:00:00.000Z',
        ...buildConsecutiveAttendance(3, true, [
          'tsoaelat.s@gmail.com',
          'lerato.mokoena@ttg-cohort.org',
        ]),
      },
      {
        id: 'room_sg_econ_sovereign_01',
        courseId: 'sg_econ_sovereign_01',
        courseTitle: 'Sovereign Economics, Base-Load Energy & Compute Equilibrium',
        name: 'Sovereign Economics Working Group',
        topic: 'Energy-Compute Coupling & Long-Horizon Fiscal Modeling',
        hostName: 'Marcus Thorne',
        hostEmail: 'marcus.t@ttg.edu',
        memberEmails: ['marcus.t@ttg.edu', 'tsoaelat.s@gmail.com'],
        memberNames: {
          'marcus.t@ttg.edu': 'Marcus Thorne',
          'tsoaelat.s@gmail.com': 'Tsoaelat S.',
        },
        createdAt: '2026-03-17T16:15:00.000Z',
        ...buildConsecutiveAttendance(2, false, ['marcus.t@ttg.edu']),
      },
    ];

    for (const grp of seedGroups) {
      db.studyGroups[grp.id] = grp;
      if (!db.studyRoomNotes[grp.id]) {
        db.studyRoomNotes[grp.id] = {
          roomId: grp.id,
          courseId: grp.courseId,
          title: `${grp.name} — Collaborative Notes`,
          content: [
            `# ${grp.name}`,
            `Course: ${grp.courseTitle}`,
            `Focus Topic: ${grp.topic}`,
            '',
            '## Key Definitions & Derivations',
            '- Capture shared definitions, proofs, and open questions here.',
            '- Edits synchronize live across every peer currently in this study room.',
            '',
            '## Peer Discussion Action Items',
            '- [ ] Review Chapter 2 step-by-step rubric verification',
            '- [ ] Compare worked examples before next quiz attempt',
          ].join('\n'),
          version: 1,
          lastEditedBy: grp.hostName,
          lastEditedByEmail: grp.hostEmail,
          lastEditedAt: grp.createdAt,
        };
      }
    }
  } else {
    // Backfill consecutive attendance history for existing study groups lacking streak arrays
    const defaultStreakByGroupId: Record<string, { days: number; includeToday: boolean }> = {
      room_sg_ai_test_time_search: { days: 6, includeToday: true },
      room_sg_ai_swarm_consensus: { days: 4, includeToday: false },
      room_sg_cog_first_principles_01: { days: 3, includeToday: true },
      room_sg_econ_sovereign_01: { days: 2, includeToday: false },
    };
    for (const grp of Object.values(db.studyGroups)) {
      if (!Array.isArray(grp.activeAttendanceDates) || grp.activeAttendanceDates.length === 0) {
        const preset = defaultStreakByGroupId[grp.id] || { days: 2, includeToday: true };
        const generated = buildConsecutiveAttendance(
          preset.days,
          preset.includeToday,
          grp.memberEmails.length > 0 ? grp.memberEmails : [grp.hostEmail]
        );
        grp.activeAttendanceDates = generated.activeAttendanceDates;
        grp.attendanceByDate = generated.attendanceByDate;
      }
    }
  }

  if (Object.keys(db.acceptedStudents).length === 0) {
    const seedStudents: AcceptedRegisteredStudent[] = [
      {
        id: 'stu_2026_001',
        registrationNumber: 'TTG-REG-2026-104219',
        studentName: 'Tsoaelat S.',
        studentEmail: 'Tsoaelat.s@gmail.com',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'eng_tech_built',
        facultyName: 'Engineering, Technology & Built Environment',
        departmentName: 'Computer Science & IT',
        programName: 'Artificial Intelligence',
        qualificationLevel: "Master's Degree (MEng, MSc Engineering, MArch)",
        assignedCourseId: 'sg_ai_test_time_search',
        assignedCourseTitle: 'Test-Time Search Compute & Process-Supervised Reasoning',
        leadLecturerName: 'Prof. Dr. Aris Thorne',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-08',
        registeredDate: '2026-10-14',
        accreditor: 'Free Productivity Accreditation Council (FPAC)',
        standingNotes: 'Active Dean’s Honours standing; enrolled in test-time search compute seminar.',
      },
      {
        id: 'stu_2026_002',
        registrationNumber: 'TTG-REG-2026-104308',
        studentName: 'Amara Okafor',
        studentEmail: 'amara.o@ttg.edu',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'education_pedagogy',
        facultyName: 'Education & Pedagogy',
        departmentName: 'Curriculum Studies & Teacher Education',
        programName: 'Curriculum Design & Assessment Psychometrics',
        qualificationLevel: 'Honours Degree / Postgraduate Diploma',
        assignedCourseId: 'lec_curriculum_pedagogy',
        assignedCourseTitle: 'Instructional Architecture, Rubric Psychometrics & Adaptive Learning',
        leadLecturerName: 'Dr. Amara Okafor',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-10',
        registeredDate: '2026-10-19',
        accreditor: 'International Open Curriculum Consortium (IOCC)',
        standingNotes: 'Verified Community Mentor; completed 10+ constructive peer critiques.',
      },
      {
        id: 'stu_2026_003',
        registrationNumber: 'TTG-REG-2026-104412',
        studentName: 'Nadia Al-Mansoor',
        studentEmail: 'nadia.m@ttg.edu',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'eng_tech_built',
        facultyName: 'Engineering, Technology & Built Environment',
        departmentName: 'Engineering Fields',
        programName: 'Industrial & Systems Engineering',
        qualificationLevel: 'Honours Degree / Postgraduate Diploma',
        assignedCourseId: 'sg_foundations_systems',
        assignedCourseTitle: 'First-Principles Systems Deconstruction & Feedback Dynamics',
        leadLecturerName: 'Dr. Nadia Al-Mansoor',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-12',
        registeredDate: '2026-10-18',
        accreditor: 'Autonomous Systems & Cybernetics Registry (ASCR)',
      },
      {
        id: 'stu_2026_004',
        registrationNumber: 'TTG-REG-2026-104519',
        studentName: 'Kenji Takahashi',
        studentEmail: 'kenji.t@ttg.edu',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'eng_tech_built',
        facultyName: 'Engineering, Technology & Built Environment',
        departmentName: 'Computer Science & IT',
        programName: 'Cyber Security',
        qualificationLevel: "Master's Degree (MEng, MSc Engineering, MArch)",
        assignedCourseId: 'sg_ai_swarm_consensus',
        assignedCourseTitle: 'Multi-Agent Swarm Orchestration & Byzantine Consensus',
        leadLecturerName: 'Dr. Kenji Takahashi',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-15',
        registeredDate: '2026-10-20',
        accreditor: 'Autonomous Systems & Cybernetics Registry (ASCR)',
      },
      {
        id: 'stu_2026_005',
        registrationNumber: 'TTG-REG-2026-104622',
        studentName: 'Elena Vance',
        studentEmail: 'elena.v@ttg.edu',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'humanities_arts',
        facultyName: 'Humanities, Social Sciences & Arts',
        departmentName: 'Media, Design & Fine Arts',
        programName: 'Computational Graphics & Visual Design',
        qualificationLevel: "Master's Degree (MA, MSc, MBA, MEng)",
        assignedCourseId: 'lec_spatial_graphics_art',
        assignedCourseTitle: 'Real-Time GLSL Shader Architecture & Monumental Surface Media',
        leadLecturerName: 'Prof. Elena Vance & Mestre Rafael Cruz',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-01',
        registeredDate: '2026-10-05',
        accreditor: 'International Visual Creators Accreditation Board (IVCAB)',
      },
      {
        id: 'stu_2026_006',
        registrationNumber: 'TTG-REG-2026-104701',
        studentName: 'Priya Naidoo',
        studentEmail: 'priya.n@ttg.edu',
        admissionStatus: 'Registered',
        facultyId: 'health_medical',
        facultyName: 'Health & Medical Sciences',
        departmentName: 'Clinical Medicine & Nursing',
        programName: 'Clinical Pharmacology & Diagnostics',
        qualificationLevel: 'PhD / Doctorate (Doctor of Philosophy/Engineering)',
        assignedCourseId: 'lec_clinical_diagnostics',
        assignedCourseTitle: 'Clinical Pharmacology & Evidence-Based Diagnostic Triage',
        leadLecturerName: 'Dr. Priya Naidoo',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-09',
        registeredDate: '2026-10-16',
        accreditor: 'Global Distance Learning Accreditation Board (GDLAB)',
      },
      {
        id: 'stu_2026_007',
        registrationNumber: 'TTG-REG-2026-104788',
        studentName: 'Sébastien Laurent',
        studentEmail: 'sebastien.l@ttg.edu',
        admissionStatus: 'Accepted & Registered',
        facultyId: 'business_commerce_law',
        facultyName: 'Business, Commerce & Law',
        departmentName: 'Finance & Accounting',
        programName: 'Sovereign Treasury & Risk Management',
        qualificationLevel: "Master's Degree (MA, MSc, MBA, MEng)",
        assignedCourseId: 'sg_long_term_leadership',
        assignedCourseTitle: 'Global Institutional Leadership & Sovereign Capital Strategy',
        leadLecturerName: 'Prof. Sébastien Laurent',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-03',
        registeredDate: '2026-10-08',
        accreditor: 'Free Productivity Accreditation Council (FPAC)',
      },
      {
        id: 'stu_2026_008',
        registrationNumber: 'TTG-REG-2026-104845',
        studentName: 'Lindiwe Khumalo',
        studentEmail: 'lindiwe.k@ttg.edu',
        admissionStatus: 'Registered',
        facultyId: 'science_agriculture',
        facultyName: 'Science & Agriculture',
        departmentName: 'Biological & Agricultural Sciences',
        programName: 'Biotechnology & Genomics',
        qualificationLevel: "Master's Degree (MA, MSc, MBA, MEng)",
        assignedCourseId: 'lec_genomic_biotech',
        assignedCourseTitle: 'Molecular Biotechnology & Computational Genomics Protocols',
        leadLecturerName: 'Dr. Lindiwe Khumalo',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-10-20',
        registeredDate: '2026-10-28',
        accreditor: 'Centre for Open Scientific Verification (COSV)',
      },
      {
        id: 'stu_2026_009',
        registrationNumber: 'TTG-REG-2026-104910',
        studentName: 'Sofia Rossi',
        studentEmail: 'sofia.r@ttg.edu',
        admissionStatus: 'Accepted',
        facultyId: 'eng_tech_built',
        facultyName: 'Engineering, Technology & Built Environment',
        departmentName: 'Built Environment',
        programName: 'Urban & Regional Planning',
        qualificationLevel: "Bachelor's Degree (BA, BSc, BCom, BEng)",
        assignedCourseId: 'sg_foundations_systems',
        assignedCourseTitle: 'First-Principles Systems Deconstruction & Feedback Dynamics',
        leadLecturerName: 'Dr. Nadia Al-Mansoor',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-11-12',
        accreditor: 'Global Distance Learning Accreditation Board (GDLAB)',
        standingNotes: 'Admitted for Spring Intake; pending module enrollment confirmation.',
      },
      {
        id: 'stu_2026_010',
        registrationNumber: 'TTG-REG-2026-104954',
        studentName: 'Tariq Mensah',
        studentEmail: 'tariq.m@ttg.edu',
        admissionStatus: 'Accepted',
        facultyId: 'business_commerce_law',
        facultyName: 'Business, Commerce & Law',
        departmentName: 'Economics & Public Policy',
        programName: 'Quantitative Macroeconomics',
        qualificationLevel: 'Honours Degree / Postgraduate Diploma',
        assignedCourseId: 'sg_long_term_leadership',
        assignedCourseTitle: 'Global Institutional Leadership & Sovereign Capital Strategy',
        leadLecturerName: 'Prof. Sébastien Laurent',
        cohortTerm: '2026 Academic Cohort',
        acceptedDate: '2026-11-15',
        accreditor: 'Free Productivity Accreditation Council (FPAC)',
        standingNotes: 'Admissions offer accepted; awaiting syllabus track registration.',
      },
    ];

    for (const stu of seedStudents) {
      db.acceptedStudents[stu.id] = stu;
    }
  }

  return db;
}

async function readDb(): Promise<SyncDatabaseSchema> {
  try {
    const raw = await fs.readFile(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as SyncDatabaseSchema;
    return ensureSeedCollections(parsed && typeof parsed === 'object' ? parsed : createEmptyDb());
  } catch {
    return ensureSeedCollections(createEmptyDb());
  }
}

async function writeDb(db: SyncDatabaseSchema): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getSyncedUserState(userId: string) {
  const db = await readDb();
  const userRecord = db.users[userId] || {
    readingProgress: {},
    assignments: {},
    lastSyncedAt: null,
  };
  return {
    userId,
    readingProgress: userRecord.readingProgress,
    assignments: Object.values(userRecord.assignments),
    lastSyncedAt: userRecord.lastSyncedAt,
    liveSession: db.liveStudySessions[userId] || null,
    totalSyncEvents: db.syncEventsCount,
  };
}

export interface BackgroundSyncRequestPayload {
  userId: string;
  readingProgressUpdates?: Array<{
    guideId: string;
    progress: ReadingProgress;
  }>;
  offlineAssignments?: OfflineAssignmentSubmission[];
}

export async function applyBackgroundSyncBatch(payload: BackgroundSyncRequestPayload) {
  const db = await readDb();
  const userId = payload.userId || 'anonymous';
  const now = new Date().toISOString();

  if (!db.users[userId]) {
    db.users[userId] = {
      readingProgress: {},
      assignments: {},
      lastSyncedAt: now,
    };
  }

  let syncedProgressCount = 0;
  let syncedAssignmentCount = 0;

  if (Array.isArray(payload.readingProgressUpdates)) {
    for (const item of payload.readingProgressUpdates) {
      if (item?.guideId && item?.progress) {
        const existing = db.users[userId].readingProgress[item.guideId];
        db.users[userId].readingProgress[item.guideId] = {
          ...item.progress,
          studyTimeSeconds: Math.max(
            existing?.studyTimeSeconds || 0,
            item.progress.studyTimeSeconds || 0
          ),
        };
        syncedProgressCount += 1;
      }
    }
  }

  if (Array.isArray(payload.offlineAssignments)) {
    for (const sub of payload.offlineAssignments) {
      if (sub?.id) {
        db.users[userId].assignments[sub.id] = {
          ...sub,
          syncedToDatabase: true,
          syncedAt: now,
        };
        syncedAssignmentCount += 1;
      }
    }
  }

  db.users[userId].lastSyncedAt = now;
  db.syncEventsCount += 1;
  db.updatedAt = now;

  await writeDb(db);

  return {
    ok: true,
    userId,
    syncedProgressCount,
    syncedAssignmentCount,
    syncedItemsCount: syncedProgressCount + syncedAssignmentCount,
    serverTimestamp: now,
    totalStoredGuides: Object.keys(db.users[userId].readingProgress).length,
    totalStoredAssignments: Object.keys(db.users[userId].assignments).length,
  };
}

// ----------------------------------------------------
// Certificate Verification Ledger Operations
// ----------------------------------------------------

export interface IssueCertificatePayload {
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
  issueDate?: string;
  progressPercent: number;
  quizScore?: number;
}

export async function issueOrUpdateCertificate(
  payload: IssueCertificatePayload
): Promise<VerifiedCertificateRecord> {
  const db = await readDb();
  const normalizedSerial = payload.serialNumber.trim().toUpperCase();
  const existing = db.certificates[normalizedSerial];
  const issueDate =
    existing?.issueDate ||
    payload.issueDate ||
    new Date().toISOString().slice(0, 10);

  const record = createSignedCertificateRecord({
    serialNumber: normalizedSerial,
    courseId: payload.courseId,
    courseTitle: payload.courseTitle,
    categoryKey: payload.categoryKey,
    credentialTitle: payload.credentialTitle,
    accreditor: payload.accreditor,
    accreditationTier: payload.accreditationTier || existing?.accreditationTier,
    recipientName: payload.recipientName,
    recipientEmail: payload.recipientEmail,
    userId: payload.userId,
    issueDate,
    issuedAt: existing?.issuedAt || new Date().toISOString(),
    progressPercent: Math.max(existing?.progressPercent || 0, payload.progressPercent),
    quizScore:
      typeof payload.quizScore === 'number'
        ? Math.max(existing?.quizScore ?? 0, payload.quizScore)
        : existing?.quizScore,
    status: existing?.status || 'verified',
    revocationReason: existing?.revocationReason,
  });

  db.certificates[normalizedSerial] = record;
  db.updatedAt = new Date().toISOString();
  await writeDb(db);
  return record;
}

export async function verifyCertificateBySerial(serial: string): Promise<{
  found: boolean;
  signatureValid: boolean;
  certificate: VerifiedCertificateRecord | null;
  checkedAt: string;
}> {
  const db = await readDb();
  const normalized = serial.trim().toUpperCase();
  const cert = db.certificates[normalized] || null;
  const checkedAt = new Date().toISOString();

  if (!cert) {
    return {
      found: false,
      signatureValid: false,
      certificate: null,
      checkedAt,
    };
  }

  const expectedHash = computeCertificateHmac({
    serialNumber: cert.serialNumber,
    courseId: cert.courseId,
    userId: cert.userId,
    recipientEmail: cert.recipientEmail,
    issueDate: cert.issueDate,
    progressPercent: cert.progressPercent,
  });

  const signatureValid = cert.signatureHash === expectedHash && cert.status !== 'revoked';

  return {
    found: true,
    signatureValid,
    certificate: {
      ...cert,
      openBadgeCredential: cert.openBadgeCredential || buildOpenBadgeCredential(cert),
    },
    checkedAt,
  };
}

export async function listCertificates(filters?: {
  userId?: string;
  courseId?: string;
}): Promise<VerifiedCertificateRecord[]> {
  const db = await readDb();
  let items = Object.values(db.certificates);
  if (filters?.userId) {
    const uid = filters.userId.trim();
    items = items.filter((c) => c.userId === uid);
  }
  if (filters?.courseId) {
    const cid = filters.courseId.trim();
    items = items.filter((c) => c.courseId === cid);
  }
  return items.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

// ----------------------------------------------------
// Learner Assessment & Verification Appeals Operations
// ----------------------------------------------------

export async function listAppeals(filters?: {
  userId?: string;
  email?: string;
  status?: AppealStatus;
}): Promise<LearnerAppealRecord[]> {
  const db = await readDb();
  let items = Object.values(db.appeals);

  if (filters?.userId) {
    const uid = filters.userId.trim();
    items = items.filter((a) => a.userId === uid);
  }
  if (filters?.email) {
    const mail = filters.email.trim().toLowerCase();
    items = items.filter((a) => a.appellantEmail.trim().toLowerCase() === mail);
  }
  if (filters?.status) {
    items = items.filter((a) => a.status === filters.status);
  }

  return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export interface CreateAppealPayload {
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
}

export async function createAppeal(
  payload: CreateAppealPayload
): Promise<LearnerAppealRecord> {
  const db = await readDb();
  const now = new Date();
  const slaDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();

  const normalizedSerial = payload.certificateSerial?.trim().toUpperCase() || undefined;
  const appeal: LearnerAppealRecord = {
    id: `app_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: payload.userId || 'user_88219',
    appellantName: payload.appellantName.trim(),
    appellantEmail: payload.appellantEmail.trim(),
    courseId: payload.courseId.trim(),
    courseTitle: payload.courseTitle.trim(),
    ...(normalizedSerial ? { certificateSerial: normalizedSerial } : {}),
    category: payload.category,
    subject: payload.subject.trim(),
    statement: payload.statement.trim(),
    evidenceSummary: payload.evidenceSummary.trim(),
    requestedResolution: payload.requestedResolution.trim(),
    status: 'Submitted',
    submittedAt: nowIso,
    slaDueDate: slaDate.toISOString().slice(0, 10),
    updatedAt: nowIso,
  };

  db.appeals[appeal.id] = appeal;

  // If the appeal references an issued certificate in the ledger, flag it under_appeal
  if (normalizedSerial && db.certificates[normalizedSerial]) {
    db.certificates[normalizedSerial] = {
      ...db.certificates[normalizedSerial],
      status: 'under_appeal',
    };
  }

  db.updatedAt = nowIso;
  await writeDb(db);
  return appeal;
}

export interface UpdateAppealStatusPayload {
  status: AppealStatus;
  reviewedBy: string;
  moderatorNotes: string;
  updatedQuizScore?: number;
  revokeCertificate?: boolean;
}

export async function updateAppealStatus(
  appealId: string,
  update: UpdateAppealStatusPayload
): Promise<LearnerAppealRecord | null> {
  const db = await readDb();
  const existing = db.appeals[appealId];
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const isResolved =
    update.status === 'Resolved - Approved' || update.status === 'Resolved - Upheld';

  const updatedAppeal: LearnerAppealRecord = {
    ...existing,
    status: update.status,
    reviewedBy: update.reviewedBy.trim(),
    moderatorNotes: update.moderatorNotes.trim(),
    updatedAt: nowIso,
    ...(isResolved ? { resolvedAt: nowIso } : {}),
  };

  db.appeals[appealId] = updatedAppeal;

  // Sync linked certificate ledger status upon resolution
  if (existing.certificateSerial && db.certificates[existing.certificateSerial]) {
    const cert = db.certificates[existing.certificateSerial];
    if (update.status === 'Under Moderator Review' || update.status === 'Submitted') {
      db.certificates[existing.certificateSerial] = {
        ...cert,
        status: 'under_appeal',
      };
    } else if (update.status === 'Resolved - Approved') {
      db.certificates[existing.certificateSerial] = createSignedCertificateRecord({
        serialNumber: cert.serialNumber,
        courseId: cert.courseId,
        courseTitle: cert.courseTitle,
        categoryKey: cert.categoryKey,
        credentialTitle: cert.credentialTitle,
        accreditor: cert.accreditor,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        userId: cert.userId,
        issueDate: cert.issueDate,
        issuedAt: cert.issuedAt,
        progressPercent: cert.progressPercent,
        quizScore:
          typeof update.updatedQuizScore === 'number'
            ? update.updatedQuizScore
            : cert.quizScore,
        status: 'verified',
      });
    } else if (update.status === 'Resolved - Upheld') {
      db.certificates[existing.certificateSerial] = {
        ...cert,
        status: update.revokeCertificate ? 'revoked' : 'verified',
        ...(update.revokeCertificate
          ? { revocationReason: update.moderatorNotes || 'Revoked following moderator review.' }
          : { revocationReason: undefined }),
      };
    }
  }

  db.updatedAt = nowIso;
  await writeDb(db);
  return updatedAppeal;
}

// ----------------------------------------------------
// Real-Time Study Heartbeat Operations
// ----------------------------------------------------

export interface StudyHeartbeatPayload {
  userId: string;
  courseId: string;
  courseTitle: string;
  activeChapterIdx?: number;
  progressPercent?: number;
  deltaSeconds?: number;
  sessionSeconds?: number;
  isActive?: boolean;
}

export async function recordStudyHeartbeat(payload: StudyHeartbeatPayload): Promise<{
  snapshot: LiveStudySessionSnapshot;
  readingProgress: ReadingProgress;
}> {
  const db = await readDb();
  const userId = payload.userId.trim() || 'user_88219';
  const courseId = payload.courseId.trim();
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);

  if (!db.users[userId]) {
    db.users[userId] = {
      readingProgress: {},
      assignments: {},
      lastSyncedAt: nowIso,
    };
  }

  const prevProg = db.users[userId].readingProgress[courseId] || {
    guideId: courseId,
    completedChapters: [],
    progressPercent: 0,
    lastReadDate: todayDate,
    isCompleted: false,
    studyTimeSeconds: 0,
  };

  const safeDelta = Math.max(0, Math.min(300, Math.round(payload.deltaSeconds || 0)));
  const totalCourseStudySeconds = (prevProg.studyTimeSeconds || 0) + safeDelta;

  const updatedProgress: ReadingProgress = {
    ...prevProg,
    progressPercent:
      typeof payload.progressPercent === 'number'
        ? Math.max(prevProg.progressPercent || 0, Math.round(payload.progressPercent))
        : prevProg.progressPercent || 0,
    activeChapterIdx:
      typeof payload.activeChapterIdx === 'number'
        ? payload.activeChapterIdx
        : prevProg.activeChapterIdx ?? 0,
    studyTimeSeconds: totalCourseStudySeconds,
    lastReadDate: todayDate,
    lastAccessedAt: nowIso,
  };

  db.users[userId].readingProgress[courseId] = updatedProgress;
  db.users[userId].lastSyncedAt = nowIso;

  const snapshot: LiveStudySessionSnapshot = {
    userId,
    courseId,
    courseTitle: payload.courseTitle || courseId,
    activeChapterIdx: updatedProgress.activeChapterIdx ?? 0,
    progressPercent: updatedProgress.progressPercent,
    sessionSeconds: Math.max(0, Math.round(payload.sessionSeconds || 0)),
    totalCourseStudySeconds,
    isActive: payload.isActive !== false,
    lastHeartbeatAt: nowIso,
  };

  db.liveStudySessions[userId] = snapshot;
  db.updatedAt = nowIso;

  await writeDb(db);

  return {
    snapshot,
    readingProgress: updatedProgress,
  };
}

export async function getLiveStudySession(
  userId: string
): Promise<LiveStudySessionSnapshot | null> {
  const db = await readDb();
  return db.liveStudySessions[userId] || null;
}

// ----------------------------------------------------
// Registered Study Groups & Shared Room Notes
// ----------------------------------------------------

function normalizeRoomId(rawRoomId?: string, courseId?: string): string {
  const cleaned = (rawRoomId || '').trim();
  if (cleaned) return cleaned;
  const cid = (courseId || 'general').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `room_${cid}`;
}

function getTodayDateKey(explicitDateKey?: string): string {
  if (explicitDateKey && /^\d{4}-\d{2}-\d{2}$/.test(explicitDateKey.trim())) {
    return explicitDateKey.trim();
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function applyAttendanceToGroup(
  group: RegisteredStudyGroup,
  memberEmail?: string,
  explicitDateKey?: string
): boolean {
  const dateKey = getTodayDateKey(explicitDateKey);
  const existingDates = Array.isArray(group.activeAttendanceDates)
    ? group.activeAttendanceDates
    : [];
  const nextByDate: Record<string, string[]> = { ...(group.attendanceByDate || {}) };
  const cleanEmail = (memberEmail || '').trim().toLowerCase();

  let changed = false;

  if (!existingDates.includes(dateKey)) {
    group.activeAttendanceDates = [...existingDates, dateKey].sort();
    changed = true;
  } else if (!group.activeAttendanceDates) {
    group.activeAttendanceDates = existingDates;
  }

  const dayAttendees = Array.isArray(nextByDate[dateKey]) ? [...nextByDate[dateKey]] : [];
  if (cleanEmail && !dayAttendees.includes(cleanEmail)) {
    dayAttendees.push(cleanEmail);
    nextByDate[dateKey] = dayAttendees;
    group.attendanceByDate = nextByDate;
    changed = true;
  } else if (!group.attendanceByDate) {
    nextByDate[dateKey] = dayAttendees;
    group.attendanceByDate = nextByDate;
    changed = true;
  }

  return changed;
}

export async function listRegisteredStudyGroups(
  courseId?: string
): Promise<RegisteredStudyGroup[]> {
  const db = await readDb();
  let groups = Object.values(db.studyGroups);
  if (courseId && courseId.trim()) {
    const cid = courseId.trim();
    groups = groups.filter((g) => g.courseId === cid);
  }
  return groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrCreateStudyGroupForRoom(params: {
  roomId?: string;
  courseId: string;
  courseTitle: string;
  userName?: string;
  userEmail?: string;
}): Promise<{ group: RegisteredStudyGroup; note: StudyRoomSharedNote }> {
  const db = await readDb();
  const targetRoomId = normalizeRoomId(params.roomId, params.courseId);
  const nowIso = new Date().toISOString();
  const cleanEmail = (params.userEmail || '').trim().toLowerCase();
  const cleanName = (params.userName || 'Academic Scholar').trim();

  let group =
    db.studyGroups[targetRoomId] ||
    Object.values(db.studyGroups).find((g) => g.courseId === params.courseId);

  let changed = false;

  if (!group) {
    group = {
      id: targetRoomId,
      courseId: params.courseId,
      courseTitle: params.courseTitle || 'Study Group Course',
      name: `${params.courseTitle || 'Course'} Study Group`,
      topic: 'Collaborative Syllabus Review & Applied Exercises',
      hostName: cleanName,
      hostEmail: cleanEmail || 'host@ttg-platform.local',
      memberEmails: cleanEmail ? [cleanEmail] : [],
      memberNames: cleanEmail ? { [cleanEmail]: cleanName } : {},
      createdAt: nowIso,
      activeAttendanceDates: [],
      attendanceByDate: {},
    };
    db.studyGroups[group.id] = group;
    changed = true;
  }

  if (cleanEmail && applyAttendanceToGroup(group, cleanEmail)) {
    db.studyGroups[group.id] = { ...group };
    changed = true;
  }

  const effectiveRoomId = group.id;
  let note = db.studyRoomNotes[effectiveRoomId];

  if (!note) {
    note = {
      roomId: effectiveRoomId,
      courseId: group.courseId,
      title: `${group.name} — Collaborative Notes`,
      content: [
        `# ${group.name}`,
        `Course: ${group.courseTitle}`,
        '',
        '## Shared Room Summary',
        '- Document key formulas, conceptual insights, and peer quiz notes together in real time.',
        '',
        '## Open Study Questions',
        '- [ ] Add chapter questions for group discussion',
      ].join('\n'),
      version: 1,
      lastEditedBy: group.hostName,
      lastEditedByEmail: group.hostEmail,
      lastEditedAt: nowIso,
    };
    db.studyRoomNotes[effectiveRoomId] = note;
    changed = true;
  }

  if (changed) {
    db.updatedAt = nowIso;
    await writeDb(db);
  }

  return { group, note };
}

export async function createRegisteredStudyGroup(params: {
  name: string;
  topic: string;
  courseId: string;
  courseTitle: string;
  hostName: string;
  hostEmail: string;
  dateKey?: string;
}): Promise<{ group: RegisteredStudyGroup; note: StudyRoomSharedNote }> {
  const db = await readDb();
  const nowIso = new Date().toISOString();
  const hostEmail = (params.hostEmail || 'scholar@ttg-platform.local').trim().toLowerCase();
  const hostName = (params.hostName || 'Academic Scholar').trim();
  const roomId = `room_grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const group: RegisteredStudyGroup = {
    id: roomId,
    courseId: params.courseId.trim() || 'general',
    courseTitle: params.courseTitle.trim() || 'General Curriculum',
    name: params.name.trim(),
    topic: params.topic.trim() || 'Shared Peer Study Session',
    hostName,
    hostEmail,
    memberEmails: [hostEmail],
    memberNames: { [hostEmail]: hostName },
    createdAt: nowIso,
    activeAttendanceDates: [],
    attendanceByDate: {},
  };

  applyAttendanceToGroup(group, hostEmail, params.dateKey);

  const note: StudyRoomSharedNote = {
    roomId,
    courseId: group.courseId,
    title: `${group.name} — Collaborative Notes`,
    content: [
      `# ${group.name}`,
      `Course: ${group.courseTitle}`,
      `Topic: ${group.topic}`,
      '',
      '## Shared Session Notes',
      '- Start typing to synchronize notes across everyone in this study room.',
    ].join('\n'),
    version: 1,
    lastEditedBy: hostName,
    lastEditedByEmail: hostEmail,
    lastEditedAt: nowIso,
  };

  db.studyGroups[roomId] = group;
  db.studyRoomNotes[roomId] = note;
  db.updatedAt = nowIso;
  await writeDb(db);

  return { group, note };
}

export async function registerMemberInStudyGroup(
  roomId: string,
  memberName: string,
  memberEmail: string,
  dateKey?: string
): Promise<RegisteredStudyGroup | null> {
  const db = await readDb();
  const group = db.studyGroups[roomId];
  if (!group) return null;

  const cleanEmail = memberEmail.trim().toLowerCase();
  const cleanName = memberName.trim() || 'Academic Scholar';
  if (!cleanEmail) return group;

  if (!group.memberEmails.includes(cleanEmail)) {
    group.memberEmails.push(cleanEmail);
  }
  group.memberNames[cleanEmail] = cleanName;
  applyAttendanceToGroup(group, cleanEmail, dateKey);

  db.studyGroups[roomId] = { ...group };
  db.updatedAt = new Date().toISOString();
  await writeDb(db);

  return db.studyGroups[roomId];
}

export async function recordStudyGroupAttendance(params: {
  roomId: string;
  memberEmail?: string;
  memberName?: string;
  dateKey?: string;
}): Promise<RegisteredStudyGroup | null> {
  const db = await readDb();
  const group = db.studyGroups[params.roomId];
  if (!group) return null;

  const cleanEmail = (params.memberEmail || '').trim().toLowerCase();
  const cleanName = (params.memberName || '').trim();
  let changed = false;

  if (cleanEmail) {
    if (!group.memberEmails.includes(cleanEmail)) {
      group.memberEmails.push(cleanEmail);
      changed = true;
    }
    if (cleanName && group.memberNames[cleanEmail] !== cleanName) {
      group.memberNames[cleanEmail] = cleanName;
      changed = true;
    }
  }

  if (applyAttendanceToGroup(group, cleanEmail, params.dateKey)) {
    changed = true;
  }

  if (changed) {
    db.studyGroups[params.roomId] = { ...group };
    db.updatedAt = new Date().toISOString();
    await writeDb(db);
  }

  return db.studyGroups[params.roomId];
}

export async function getStudyRoomSharedNote(
  roomId: string,
  fallbackCourseId = 'general',
  fallbackCourseTitle = 'Study Group Session'
): Promise<{ group: RegisteredStudyGroup; note: StudyRoomSharedNote }> {
  return getOrCreateStudyGroupForRoom({
    roomId,
    courseId: fallbackCourseId,
    courseTitle: fallbackCourseTitle,
  });
}

export async function updateStudyRoomSharedNote(params: {
  roomId: string;
  courseId?: string;
  courseTitle?: string;
  title?: string;
  content: string;
  editedBy: string;
  editedByEmail?: string;
}): Promise<{ group: RegisteredStudyGroup; note: StudyRoomSharedNote }> {
  const db = await readDb();
  const nowIso = new Date().toISOString();
  const normalizedId = normalizeRoomId(params.roomId, params.courseId);

  let group = db.studyGroups[normalizedId];
  if (!group) {
    group = {
      id: normalizedId,
      courseId: params.courseId || 'general',
      courseTitle: params.courseTitle || 'Study Group Session',
      name: `${params.courseTitle || 'Study Group'} Cohort`,
      topic: 'Collaborative Shared Notes',
      hostName: params.editedBy || 'Academic Scholar',
      hostEmail: (params.editedByEmail || 'scholar@ttg-platform.local').trim().toLowerCase(),
      memberEmails: params.editedByEmail ? [params.editedByEmail.trim().toLowerCase()] : [],
      memberNames: params.editedByEmail
        ? { [params.editedByEmail.trim().toLowerCase()]: params.editedBy || 'Academic Scholar' }
        : {},
      createdAt: nowIso,
      activeAttendanceDates: [],
      attendanceByDate: {},
    };
    db.studyGroups[normalizedId] = group;
  }

  applyAttendanceToGroup(group, params.editedByEmail);

  const prev = db.studyRoomNotes[normalizedId];
  const updatedNote: StudyRoomSharedNote = {
    roomId: normalizedId,
    courseId: params.courseId || prev?.courseId || group.courseId,
    title:
      typeof params.title === 'string' && params.title.trim()
        ? params.title.trim()
        : prev?.title || `${group.name} — Collaborative Notes`,
    content: params.content,
    version: (prev?.version || 0) + 1,
    lastEditedBy: params.editedBy || 'Academic Scholar',
    lastEditedByEmail: params.editedByEmail,
    lastEditedAt: nowIso,
  };

  db.studyRoomNotes[normalizedId] = updatedNote;
  db.updatedAt = nowIso;
  await writeDb(db);

  return { group, note: updatedNote };
}

// ----------------------------------------------------
// Accepted & Registered Students Persistence
// ----------------------------------------------------

export async function listAcceptedStudents(filters?: {
  status?: StudentAdmissionStatus | 'all';
  facultyId?: string;
}): Promise<AcceptedRegisteredStudent[]> {
  const db = await readDb();
  let list = Object.values(db.acceptedStudents || {});
  if (filters?.status && filters.status !== 'all') {
    list = list.filter((s) => s.admissionStatus === filters.status);
  }
  if (filters?.facultyId && filters.facultyId !== 'all') {
    list = list.filter((s) => s.facultyId === filters.facultyId);
  }
  return list.sort((a, b) => (b.acceptedDate || '').localeCompare(a.acceptedDate || ''));
}

export async function upsertAcceptedStudent(
  input: Omit<AcceptedRegisteredStudent, 'id' | 'registrationNumber'> & {
    id?: string;
    registrationNumber?: string;
  }
): Promise<AcceptedRegisteredStudent> {
  const db = await readDb();
  const cleanEmail = input.studentEmail.trim().toLowerCase();
  const todayIso = new Date().toISOString().slice(0, 10);

  const existing = Object.values(db.acceptedStudents).find(
    (s) =>
      (input.id && s.id === input.id) ||
      (s.studentEmail.trim().toLowerCase() === cleanEmail &&
        s.programName.trim().toLowerCase() === input.programName.trim().toLowerCase())
  );

  const id = existing?.id || input.id || `stu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const registrationNumber =
    existing?.registrationNumber ||
    input.registrationNumber ||
    `TTG-REG-2026-${Math.floor(100000 + Math.random() * 899999)}`;

  const record: AcceptedRegisteredStudent = {
    id,
    registrationNumber,
    studentName: input.studentName.trim(),
    studentEmail: input.studentEmail.trim(),
    admissionStatus: input.admissionStatus,
    facultyId: input.facultyId,
    facultyName: input.facultyName,
    departmentName: input.departmentName,
    programName: input.programName,
    qualificationLevel: input.qualificationLevel,
    assignedCourseId: input.assignedCourseId,
    assignedCourseTitle: input.assignedCourseTitle,
    leadLecturerName: input.leadLecturerName,
    cohortTerm: input.cohortTerm || '2026 Academic Cohort',
    acceptedDate: input.acceptedDate || existing?.acceptedDate || todayIso,
    registeredDate:
      input.admissionStatus === 'Accepted'
        ? undefined
        : input.registeredDate || existing?.registeredDate || todayIso,
    accreditor: input.accreditor || 'Free Productivity Accreditation Council (FPAC)',
    standingNotes: input.standingNotes?.trim() || undefined,
  };

  db.acceptedStudents[id] = record;
  db.updatedAt = new Date().toISOString();
  await writeDb(db);

  return record;
}

export async function updateAcceptedStudentStatus(
  id: string,
  updates: {
    admissionStatus?: StudentAdmissionStatus;
    assignedCourseId?: string;
    assignedCourseTitle?: string;
    leadLecturerName?: string;
    standingNotes?: string;
  }
): Promise<AcceptedRegisteredStudent | null> {
  const db = await readDb();
  const existing = db.acceptedStudents[id];
  if (!existing) return null;

  const nextStatus = updates.admissionStatus || existing.admissionStatus;
  const todayIso = new Date().toISOString().slice(0, 10);

  const updated: AcceptedRegisteredStudent = {
    ...existing,
    admissionStatus: nextStatus,
    registeredDate:
      nextStatus === 'Accepted'
        ? existing.registeredDate
        : existing.registeredDate || todayIso,
    ...(updates.assignedCourseId !== undefined ? { assignedCourseId: updates.assignedCourseId } : {}),
    ...(updates.assignedCourseTitle !== undefined ? { assignedCourseTitle: updates.assignedCourseTitle } : {}),
    ...(updates.leadLecturerName !== undefined ? { leadLecturerName: updates.leadLecturerName } : {}),
    ...(updates.standingNotes !== undefined ? { standingNotes: updates.standingNotes } : {}),
  };

  db.acceptedStudents[id] = updated;
  db.updatedAt = new Date().toISOString();
  await writeDb(db);

  return updated;
}

// ----------------------------------------------------
// Tai-One W3C Certification Accreditation Ledger
// ----------------------------------------------------

export async function listTaiOneW3CAccreditations(filters?: {
  tier?: AccreditationTier | 'all';
}): Promise<TaiOneW3CAccreditationRecord[]> {
  const db = await readDb();
  let items = Object.values(db.taiOneW3cAccreditations || {});
  if (filters?.tier && filters.tier !== 'all') {
    items = items.filter((item) => item.accreditationTier === filters.tier);
  }
  return items.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function generateTaiOneW3CAccreditation(params: {
  accreditationTier: AccreditationTier;
  programTitle: string;
  courseId?: string;
  categoryKey: string;
  recipientName: string;
  recipientEmail: string;
  organizationName: string;
  nqfCreditsReference: string;
  userId?: string;
}): Promise<{
  accreditation: TaiOneW3CAccreditationRecord;
  certificate: VerifiedCertificateRecord;
}> {
  const db = await readDb();
  const isExternal = params.accreditationTier === 'accredited_external';
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  const year = new Date().getFullYear();
  const prefix = isExternal ? 'TAI1-W3C' : 'TTG-INT';
  const serialNumber = `${prefix}-${year}-88219-${suffix}`;
  const id = `tai1_w3c_${Date.now()}_${suffix.toLowerCase()}`;

  const accreditation = buildTaiOneW3CAccreditationRecord({
    id,
    serialNumber,
    accreditationTier: params.accreditationTier,
    programTitle: params.programTitle.trim(),
    courseId: params.courseId,
    categoryKey: params.categoryKey.trim() || 'Frontier AI & Systems',
    recipientName: params.recipientName.trim(),
    recipientEmail: params.recipientEmail.trim().toLowerCase(),
    organizationName: params.organizationName.trim() || 'TTG - Tsoaela Training Ground Platform',
    nqfCreditsReference: params.nqfCreditsReference.trim() || 'NQF Level 7 · 15 Credits',
  });

  db.taiOneW3cAccreditations[id] = accreditation;

  // Register directly into public certificate verification ledger as well
  const certificate = createSignedCertificateRecord({
    serialNumber: accreditation.serialNumber,
    courseId: accreditation.courseId || accreditation.id,
    courseTitle: accreditation.programTitle,
    categoryKey: accreditation.categoryKey,
    credentialTitle: isExternal
      ? `Tai-One W3C External Accreditation — ${accreditation.programTitle}`
      : `TTG Accredited Internal Certification — ${accreditation.programTitle}`,
    accreditor: accreditation.authorityName,
    accreditationTier: accreditation.accreditationTier,
    recipientName: accreditation.recipientName,
    recipientEmail: accreditation.recipientEmail,
    userId: params.userId || 'user_88219',
    issueDate: accreditation.issueDate,
    issuedAt: accreditation.issuedAt,
    progressPercent: 100,
    quizScore: 100,
    status: 'verified',
  });

  db.certificates[certificate.serialNumber] = certificate;
  db.updatedAt = new Date().toISOString();
  await writeDb(db);

  return { accreditation, certificate };
}



