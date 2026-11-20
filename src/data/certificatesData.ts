import {
  AccreditationTier,
  CourseCertificateSpec,
  EducationCourse,
  StudyGuide,
} from '../types';
import { TAI_ONE_LOGO_URL } from '../utils/pdfBranding';

export { TAI_ONE_LOGO_URL };

export interface CategoryCertificateTemplate {
  categoryKey: string;
  credentialTitle: string;
  subtitle: string;
  distinctionLabel: string;
  credentialCodePrefix: string;
  accreditor: string;
  accreditationTier: AccreditationTier;
  w3cStandard?: string;
  sealTitle: string;
  competencies: string[];
  texturePattern: 'guilloche' | 'botanical_lattice' | 'hex_mesh' | 'harmonic_waves';
  accentTone: string;
}

export function inferAccreditationTier(
  accreditor?: string,
  explicitTier?: AccreditationTier
): AccreditationTier {
  if (explicitTier === 'accredited_external' || explicitTier === 'accredited_internal') {
    return explicitTier;
  }
  if (
    accreditor &&
    /tai-one|w3c|fpac|iocc|ascr|ivcab|gdlab|cosv|qcto|cpd|iacet|external/i.test(accreditor)
  ) {
    return 'accredited_external';
  }
  return 'accredited_internal';
}

export const CATEGORY_CERTIFICATE_TEMPLATES: Record<string, CategoryCertificateTemplate> = {
  'Frontier AI & Systems': {
    categoryKey: 'Frontier AI & Systems',
    credentialTitle: 'Accredited Certificate in Frontier AI & Reasoning Systems',
    subtitle: 'Autonomous Compute Allocation, Verifier Architectures & Swarm Protocols',
    distinctionLabel: 'ACCREDITED EXTERNAL CREDENTIAL · TAI-ONE W3C',
    credentialCodePrefix: 'TAI1-AI',
    accreditor: 'Tai-One W3C Certification Authority (Accredited External)',
    accreditationTier: 'accredited_external',
    w3cStandard: 'W3C Verifiable Credentials v2.0 · Open Badges 3.0',
    sealTitle: 'TAI-ONE W3C EXTERNAL ACCREDITATION SEAL',
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
    credentialTitle: 'Accredited Internal Certificate in First-Principles Cognitive Modeling',
    subtitle: 'Axiomatic Deconstruction, System Boundaries & Feedback Architecture',
    distinctionLabel: 'ACCREDITED INTERNAL CREDENTIAL',
    credentialCodePrefix: 'TTG-COG',
    accreditor: 'TTG Internal Accreditation Board (Accredited Internal)',
    accreditationTier: 'accredited_internal',
    w3cStandard: 'TTG Accredited Internal · Open Badges 3.0',
    sealTitle: 'TTG ACCREDITED INTERNAL SEAL',
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
    credentialTitle: 'Accredited Internal Certificate in Institutional Leadership & Strategy',
    subtitle: 'Multi-Year Capital Stewardship, Geopolitical Shielding & Governance Invariants',
    distinctionLabel: 'ACCREDITED INTERNAL CREDENTIAL',
    credentialCodePrefix: 'TTG-EXEC',
    accreditor: 'TTG Executive Accreditation Board (Accredited Internal)',
    accreditationTier: 'accredited_internal',
    w3cStandard: 'TTG Accredited Internal · Open Badges 3.0',
    sealTitle: 'TTG ACCREDITED INTERNAL SEAL',
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
    credentialTitle: 'Accredited External Certificate in Broadcast Audio DSP',
    subtitle: 'ITU-R BS.1770 Loudness Mastering, Sidechain Ducking & Psychoacoustic Synthesis',
    distinctionLabel: 'ACCREDITED EXTERNAL CREDENTIAL · TAI-ONE W3C',
    credentialCodePrefix: 'TAI1-DSP',
    accreditor: 'Tai-One W3C Media & Audio Standards Council (Accredited External)',
    accreditationTier: 'accredited_external',
    w3cStandard: 'W3C Verifiable Credentials v2.0 · Open Badges 3.0',
    sealTitle: 'TAI-ONE W3C AUDIO ACCREDITATION SEAL',
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
    credentialTitle: 'Accredited Internal Certificate in Generative Visuals & ABR Streaming',
    subtitle: 'GLSL Fragment Shaders, Volumetric Raymarching & Adaptive Bitrate Distribution',
    distinctionLabel: 'ACCREDITED INTERNAL CREDENTIAL',
    credentialCodePrefix: 'TTG-VIS',
    accreditor: 'TTG Digital World Graphics Board (Accredited Internal)',
    accreditationTier: 'accredited_internal',
    w3cStandard: 'TTG Accredited Internal · Open Badges 3.0',
    sealTitle: 'TTG ACCREDITED VISUALS SEAL',
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
    credentialTitle: 'Accredited Internal Certificate in Monumental Muralism & Spatial Canvas',
    subtitle: 'Anamorphic Architectural Scaling, Mineral Silicate Chemistry & AR Projection',
    distinctionLabel: 'ACCREDITED INTERNAL CREDENTIAL',
    credentialCodePrefix: 'TTG-MUR',
    accreditor: 'TTG Spatial Arts Accreditation Board (Accredited Internal)',
    accreditationTier: 'accredited_internal',
    w3cStandard: 'TTG Accredited Internal · Open Badges 3.0',
    sealTitle: 'TTG ACCREDITED SPATIAL ARTS SEAL',
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
    credentialTitle: 'Accredited External Certificate in Broadcast Orchestration & Live Playout',
    subtitle: 'Master Control Matrix Switching, Synthetic SLA Observability & Zero-Downtime DR',
    distinctionLabel: 'ACCREDITED EXTERNAL CREDENTIAL · TAI-ONE W3C',
    credentialCodePrefix: 'TAI1-BCAST',
    accreditor: 'Tai-One W3C Broadcast Engineering Authority (Accredited External)',
    accreditationTier: 'accredited_external',
    w3cStandard: 'W3C Verifiable Credentials v2.0 · Open Badges 3.0',
    sealTitle: 'TAI-ONE W3C BROADCAST ACCREDITATION SEAL',
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

  const explicitAccreditor = params.accreditor?.trim();
  const exact = CATEGORY_CERTIFICATE_TEMPLATES[normalizedCategory];

  if (exact) {
    const resolvedAccreditor = explicitAccreditor || exact.accreditor;
    const resolvedTier = inferAccreditationTier(resolvedAccreditor, exact.accreditationTier);
    return {
      id: `cert_${params.id}`,
      categoryKey: exact.categoryKey,
      credentialTitle: exact.credentialTitle,
      subtitle: `${params.title} · ${exact.subtitle}`,
      distinctionLabel:
        resolvedTier === 'accredited_external'
          ? 'ACCREDITED EXTERNAL CREDENTIAL · TAI-ONE W3C'
          : 'ACCREDITED INTERNAL CREDENTIAL',
      credentialCodePrefix: exact.credentialCodePrefix,
      accreditor: resolvedAccreditor,
      accreditationTier: resolvedTier,
      w3cStandard:
        resolvedTier === 'accredited_external'
          ? 'W3C Verifiable Credentials v2.0 · Open Badges 3.0'
          : 'TTG Accredited Internal · Open Badges 3.0',
      sealTitle: exact.sealTitle,
      competencies:
        params.outcomes && params.outcomes.length >= 2
          ? params.outcomes.slice(0, 3)
          : exact.competencies,
      texturePattern: exact.texturePattern,
      accentTone: exact.accentTone,
    };
  }

  // Fallback category synthesis strictly using Accredited Internal or Accredited External classification
  const cleanCategory = normalizedCategory || params.field || 'Institutional Studies';
  const resolvedAccreditor =
    explicitAccreditor || 'TTG Internal Accreditation Board (Accredited Internal)';
  const resolvedTier = inferAccreditationTier(resolvedAccreditor);
  const shortCode =
    cleanCategory
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 4) || 'GEN';

  return {
    id: `cert_${params.id}`,
    categoryKey: cleanCategory,
    credentialTitle:
      resolvedTier === 'accredited_external'
        ? `Accredited External Certificate in ${cleanCategory}`
        : `Accredited Internal Certificate in ${cleanCategory}`,
    subtitle: `${params.title} · ${
      resolvedTier === 'accredited_external'
        ? 'Tai-One W3C & External Partner Accreditation'
        : 'TTG Accredited Internal Board Credential'
    }`,
    distinctionLabel:
      resolvedTier === 'accredited_external'
        ? 'ACCREDITED EXTERNAL CREDENTIAL · TAI-ONE W3C'
        : 'ACCREDITED INTERNAL CREDENTIAL',
    credentialCodePrefix: resolvedTier === 'accredited_external' ? `TAI1-${shortCode}` : `TTG-${shortCode}`,
    accreditor: resolvedAccreditor,
    accreditationTier: resolvedTier,
    w3cStandard:
      resolvedTier === 'accredited_external'
        ? 'W3C Verifiable Credentials v2.0 · Open Badges 3.0'
        : 'TTG Accredited Internal · Open Badges 3.0',
    sealTitle:
      resolvedTier === 'accredited_external'
        ? 'TAI-ONE W3C EXTERNAL ACCREDITATION SEAL'
        : 'TTG ACCREDITED INTERNAL SEAL',
    competencies:
      params.outcomes && params.outcomes.length > 0
        ? params.outcomes.slice(0, 3)
        : [
            `Core Study of ${params.title}`,
            'Self-Paced Accredited Module Assessment',
            'First-Principles Methodological Execution',
          ],
    texturePattern: 'botanical_lattice',
    accentTone: 'Golden-Green Heritage Trim',
  };
}

export function getCertificateForStudyGuide(guide: StudyGuide): CourseCertificateSpec | null {
  if (guide.is_accredited === false) return null;
  if (guide.certificate) {
    return {
      ...guide.certificate,
      accreditationTier: inferAccreditationTier(
        guide.certificate.accreditor || guide.accreditor_name,
        guide.certificate.accreditationTier
      ),
    };
  }
  return resolveCertificateByCategory({
    id: guide.id,
    title: guide.title,
    category: guide.category,
    field: guide.field,
    accreditor: guide.accreditor_name,
    outcomes: guide.learning_outcomes,
  });
}

export function getCertificateForEducationCourse(
  course: EducationCourse
): CourseCertificateSpec | null {
  if (course.is_accredited === false) return null;
  if (course.certificate) {
    return {
      ...course.certificate,
      accreditationTier: inferAccreditationTier(
        course.certificate.accreditor || course.accreditor_name,
        course.certificate.accreditationTier
      ),
    };
  }
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
