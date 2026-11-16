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
  'Frontier AI & Systems': {
    categoryKey: 'Frontier AI & Systems',
    credentialTitle: 'Completion Certificate in Frontier AI & Reasoning Systems',
    subtitle: 'Autonomous Compute Allocation, Verifier Architectures & Swarm Protocols',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-AI',
    accreditor: 'TTG - Tsoaela Training Ground Platform',
    sealTitle: 'TTG INTERNAL COMPLETION SEAL',
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
    credentialTitle: 'Completion Certificate in First-Principles Cognitive Modeling',
    subtitle: 'Axiomatic Deconstruction, System Boundaries & Feedback Architecture',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-COG',
    accreditor: 'TTG Systems Curriculum Division (Internal)',
    sealTitle: 'TTG COMPLETION RECORD SEAL',
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
    credentialTitle: 'Completion Certificate in Institutional Leadership & Strategy',
    subtitle: 'Multi-Year Capital Stewardship, Geopolitical Shielding & Governance Invariants',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-EXEC',
    accreditor: 'TTG Executive Curriculum Division (Internal)',
    sealTitle: 'TTG COMPLETION RECORD SEAL',
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
    credentialTitle: 'Completion Certificate in Broadcast Audio DSP',
    subtitle: 'ITU-R BS.1770 Loudness Mastering, Sidechain Ducking & Psychoacoustic Synthesis',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-DSP',
    accreditor: 'TTG Digital World Audio Division (Internal)',
    sealTitle: 'TTG STUDIO COMPLETION SEAL',
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
    credentialTitle: 'Completion Certificate in Generative Visuals & ABR Streaming',
    subtitle: 'GLSL Fragment Shaders, Volumetric Raymarching & Adaptive Bitrate Distribution',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-VIS',
    accreditor: 'TTG Digital World Graphics Division (Internal)',
    sealTitle: 'TTG VISUALS COMPLETION SEAL',
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
    credentialTitle: 'Completion Certificate in Monumental Muralism & Spatial Canvas',
    subtitle: 'Anamorphic Architectural Scaling, Mineral Silicate Chemistry & AR Projection',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-MUR',
    accreditor: 'TTG Spatial Arts Division (Internal)',
    sealTitle: 'TTG SPATIAL ARTS COMPLETION SEAL',
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
    credentialTitle: 'Completion Certificate in Broadcast Orchestration & Live Playout',
    subtitle: 'Master Control Matrix Switching, Synthetic SLA Observability & Zero-Downtime DR',
    distinctionLabel: 'INTERNAL COMPLETION RECORD',
    credentialCodePrefix: 'TTG-BCAST',
    accreditor: 'TTG Broadcast Curriculum Division (Internal)',
    sealTitle: 'TTG BROADCAST COMPLETION SEAL',
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
  const normalizedCategory =
    /^(ai\s+courses?|ai\s+course\s*\(ai\s+generated\)|ai\s+courses\s*\(ai\s+generated\))$/i.test(
      params.category.trim()
    )
      ? 'Frontier AI & Systems'
      : params.category;
  const sanitizedAccreditor =
    params.accreditor &&
    !/tai-one\s+ai\s+standard\s+board/i.test(params.accreditor)
      ? params.accreditor
      : undefined;

  const exact = CATEGORY_CERTIFICATE_TEMPLATES[normalizedCategory];
  if (exact) {
    return {
      id: `cert_${params.id}`,
      categoryKey: exact.categoryKey,
      credentialTitle: exact.credentialTitle,
      subtitle: `${params.title} · ${exact.subtitle}`,
      distinctionLabel: exact.distinctionLabel,
      credentialCodePrefix: exact.credentialCodePrefix,
      accreditor: sanitizedAccreditor || exact.accreditor,
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
  const cleanCategory = normalizedCategory || params.field || 'Institutional Studies';
  const shortCode = cleanCategory
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'GEN';

  return {
    id: `cert_${params.id}`,
    categoryKey: cleanCategory,
    credentialTitle: `Completion Certificate in ${cleanCategory}`,
    subtitle: `${params.title} · Internal Platform Completion Record`,
    distinctionLabel: 'INTERNAL COMPLETION CREDENTIAL',
    credentialCodePrefix: `TTG-${shortCode}`,
    accreditor: sanitizedAccreditor || 'TTG - Tsoaela Training Ground Platform',
    sealTitle: 'INTERNAL COMPLETION SEAL',
    competencies:
      params.outcomes && params.outcomes.length > 0
        ? params.outcomes.slice(0, 3)
        : [
            `Core Study of ${params.title}`,
            'Self-Paced Module Assessment Completion',
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
