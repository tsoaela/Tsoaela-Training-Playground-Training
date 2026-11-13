import { CourseCertificateSpec, EducationCourse, StudyGuide } from '../types';
import { TAI_ONE_LOGO_URL } from '../utils/pdfBranding';

export { TAI_ONE_LOGO_URL };

export interface CategoryCertificateTemplate {
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

export const CATEGORY_CERTIFICATE_TEMPLATES: Record<string, CategoryCertificateTemplate> = {
  'AI Courses (AI Generated)': {
    categoryKey: 'AI Courses (AI Generated)',
    credentialTitle: 'Certificate in Frontier AI & Reasoning Systems',
    subtitle: 'Autonomous Compute Allocation, Verifier Architectures & Swarm Protocols',
    distinctionLabel: 'FRONTIER AI FELLOWSHIP',
    credentialCodePrefix: 'TTG-AI',
    accreditor: 'TAI-ONE AI Standards Board',
    sealTitle: 'VERIFIED AI SYSTEMS ARCHITECT',
    competencies: [
      'Test-Time Search Compute & MCTS Rollouts',
      'Process-Supervised Verification & Error Pruning',
      'Multi-Agent Byzantine Quorum Consensus',
    ],
    texturePattern: 'guilloche',
    accentTone: 'Lime-Gold Guilloche Crest',
  },
  'Cognitive Models': {
    categoryKey: 'Cognitive Models',
    credentialTitle: 'Certificate in First-Principles Cognitive Modeling',
    subtitle: 'Axiomatic Deconstruction, System Boundaries & Feedback Architecture',
    distinctionLabel: 'COGNITIVE SYSTEMS HONORS',
    credentialCodePrefix: 'TTG-COG',
    accreditor: 'TTG Institutional Board',
    sealTitle: 'SYSTEMS DECONSTRUCTION SEAL',
    competencies: [
      'Axiomatic Problem Deconstruction',
      'System Boundary & Delay Cascade Mapping',
      'Cross-Disciplinary Analytical Modeling',
    ],
    texturePattern: 'hex_mesh',
    accentTone: 'Golden-Green Hexagonal Matrix',
  },
  'Executive Leadership': {
    categoryKey: 'Executive Leadership',
    credentialTitle: 'Executive Diploma in Sovereign Institutional Leadership',
    subtitle: 'Multi-Year Capital Stewardship, Geopolitical Shielding & Governance Invariants',
    distinctionLabel: 'SOVEREIGN STEWARDSHIP AWARD',
    credentialCodePrefix: 'TTG-EXEC',
    accreditor: 'Sovereign Governance Council',
    sealTitle: 'SOVEREIGN GOVERNANCE COUNCIL',
    competencies: [
      'Multi-Horizon Strategic Capital Allocation',
      'Anti-Fragile Cultural & Operational Invariants',
      'Institutional Risk Shielding & Continuity',
    ],
    texturePattern: 'botanical_lattice',
    accentTone: 'Dark Forest Laurel & Gold Leaf',
  },
  'Music Streaming & Audio DSP': {
    categoryKey: 'Music Streaming & Audio DSP',
    credentialTitle: 'Studio Master Certificate in Broadcast Audio DSP',
    subtitle: 'ITU-R BS.1770 Loudness Mastering, Sidechain Ducking & Psychoacoustic Synthesis',
    distinctionLabel: 'BROADCAST ACOUSTICS MASTER',
    credentialCodePrefix: 'TTG-DSP',
    accreditor: 'TAI-ONE Acoustic Engineering Guild',
    sealTitle: 'MASTER AUDIO DSP ENGINEER',
    competencies: [
      '-14.0 LUFS EBU R128 Loudness Compliance',
      'Frequency-Selective Voice-Over Sidechain Ducking',
      'Real-Time Web Audio DAG & Binaural Entrainment',
    ],
    texturePattern: 'harmonic_waves',
    accentTone: 'Lime Resonance Waveform',
  },
  'Visuals & Motion Art': {
    categoryKey: 'Visuals & Motion Art',
    credentialTitle: 'Studio Master Certificate in Generative Visuals & ABR Streaming',
    subtitle: 'GLSL Fragment Shaders, Volumetric Raymarching & Adaptive Bitrate Distribution',
    distinctionLabel: 'VISUAL COMPUTING DISTINCTION',
    credentialCodePrefix: 'TTG-VIS',
    accreditor: 'TTG Digital World Graphics Bureau',
    sealTitle: 'GENERATIVE SHADER ARCHITECT',
    competencies: [
      '60 FPS GLSL Signed Distance Field Shaders',
      '4K HLS Adaptive Bitrate Manifest Engineering',
      'GPU Canvas Profiling & SLA Telemetry',
    ],
    texturePattern: 'hex_mesh',
    accentTone: 'Emerald-Lime Shader Lattice',
  },
  'Mural Art & Spatial Canvas': {
    categoryKey: 'Mural Art & Spatial Canvas',
    credentialTitle: 'Heritage Certificate in Monumental Muralism & Spatial Canvas',
    subtitle: 'Anamorphic Architectural Scaling, Mineral Silicate Chemistry & AR Projection',
    distinctionLabel: 'MONUMENTAL CANVAS LAUREATE',
    credentialCodePrefix: 'TTG-MUR',
    accreditor: 'Lisbon & Kyoto Urban Arts Consortium',
    sealTitle: 'SPATIAL MURALIST GUILD',
    competencies: [
      'Fibonacci Multi-Story Proportional Grid Scaling',
      'Potassium Silicate Concrete Silicification Chemistry',
      'Gigapixel DZI Digitization & Nocturnal AR Mapping',
    ],
    texturePattern: 'botanical_lattice',
    accentTone: 'Olive-Gold Architectural Fretwork',
  },
  'Broadcast Engineering': {
    categoryKey: 'Broadcast Engineering',
    credentialTitle: 'Executive Certificate in Broadcast Orchestration & Live Playout',
    subtitle: 'Master Control Matrix Switching, Synthetic SLA Observability & Zero-Downtime DR',
    distinctionLabel: 'MASTER CONTROL DIRECTOR',
    credentialCodePrefix: 'TTG-BCAST',
    accreditor: 'TAI-ONE Broadcast Standards Authority',
    sealTitle: 'MASTER CONTROL ORCHESTRATOR',
    competencies: [
      'Multi-Bus Program & Preview Video Matrix Routing',
      'Sub-20ms Synthetic Telemetry & Prometheus Probes',
      '157ms Recovery Time Objective Atomic Failover',
    ],
    texturePattern: 'guilloche',
    accentTone: 'Golden-Olive Sovereign Crest',
  },
};

export function resolveCertificateByCategory(params: {
  id: string;
  title: string;
  category: string;
  field?: string;
  accreditor?: string;
  outcomes?: string[];
}): CourseCertificateSpec {
  const exact = CATEGORY_CERTIFICATE_TEMPLATES[params.category];
  if (exact) {
    return {
      id: `cert_${params.id}`,
      categoryKey: exact.categoryKey,
      credentialTitle: exact.credentialTitle,
      subtitle: `${params.title} · ${exact.subtitle}`,
      distinctionLabel: exact.distinctionLabel,
      credentialCodePrefix: exact.credentialCodePrefix,
      accreditor: params.accreditor || exact.accreditor,
      sealTitle: exact.sealTitle,
      competencies:
        params.outcomes && params.outcomes.length >= 2
          ? params.outcomes.slice(0, 3)
          : exact.competencies,
      texturePattern: exact.texturePattern,
      accentTone: exact.accentTone,
    };
  }

  // Fallback category synthesis for custom/faculty categories
  const cleanCategory = params.category || params.field || 'Institutional Studies';
  const shortCode = cleanCategory
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'GEN';

  return {
    id: `cert_${params.id}`,
    categoryKey: cleanCategory,
    credentialTitle: `Certificate in ${cleanCategory}`,
    subtitle: `${params.title} · Accredited Curriculum Qualification`,
    distinctionLabel: 'VERIFIED ACADEMIC CREDENTIAL',
    credentialCodePrefix: `TTG-${shortCode}`,
    accreditor: params.accreditor || 'TTG Institutional Accreditation Board',
    sealTitle: 'OFFICIAL COMPETENCY SEAL',
    competencies:
      params.outcomes && params.outcomes.length > 0
        ? params.outcomes.slice(0, 3)
        : [
            `Core Mastery of ${params.title}`,
            'Applied Analytical Assessment Verification',
            'First-Principles Methodological Execution',
          ],
    texturePattern: 'botanical_lattice',
    accentTone: 'Golden-Green Heritage Trim',
  };
}

export function getCertificateForStudyGuide(guide: StudyGuide): CourseCertificateSpec {
  if (guide.certificate) return guide.certificate;
  return resolveCertificateByCategory({
    id: guide.id,
    title: guide.title,
    category: guide.category,
    field: guide.field,
    accreditor: guide.accreditor_name,
    outcomes: guide.learning_outcomes,
  });
}

export function getCertificateForEducationCourse(course: EducationCourse): CourseCertificateSpec {
  if (course.certificate) return course.certificate;
  return resolveCertificateByCategory({
    id: course.id,
    title: course.title,
    category: course.platformDomain,
    accreditor: course.accreditor_name,
    outcomes: course.learningOutcomes,
  });
}

export function formatCertificateSerial(
  prefix: string,
  courseId: string,
  userId: string
): string {
  const userDigits = (userId.replace(/[^A-Za-z0-9]/g, '').slice(-5) || '88219').toUpperCase();
  const courseCode = (courseId.replace(/[^A-Za-z0-9]/g, '').slice(-5) || '001').toUpperCase();
  return `${prefix}-2026-${userDigits}-${courseCode}`;
}
