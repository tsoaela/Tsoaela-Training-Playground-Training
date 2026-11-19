import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileText, 
  GraduationCap, 
  Music, 
  Camera, 
  Video, 
  BookOpen, 
  Compass, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Building2,
  Calendar,
  User,
  Mail,
  Award
} from 'lucide-react';
import { ApplicationCategory, ApplicationPrefillData, CategoryRegistration, UserProfile } from '../types';
import { ACADEMIC_FACULTIES, STANDARD_QUALIFICATION_LEVELS } from '../data/academicCatalog';

interface ApplicationRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialCategory?: ApplicationCategory;
  initialPrefill?: ApplicationPrefillData | null;
  onRegistrationComplete?: (reg: CategoryRegistration) => void;
}

interface CategoryConfig {
  id: ApplicationCategory;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  borderLight: string;
  tracks: { id: string; label: string; duration: string; degree: string }[];
  description: string;
  qualificationLevels: string[];
  accreditors: string[];
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'course_educare',
    title: 'Educare Course & University Faculty Admission',
    badge: 'Faculty Admission',
    icon: GraduationCap,
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800/60',
    description: 'Apply across 6 accredited university faculties: Engineering & Tech, Business & Law, Health & Medical Sciences, Science & Agriculture, Humanities & Arts, and Education.',
    tracks: STANDARD_QUALIFICATION_LEVELS.map(q => ({
      id: q.id,
      label: `${q.level}: ${q.qualificationType}`,
      duration: q.typicalDuration,
      degree: `${q.qualificationType} (${q.nqfCredits})`,
    })),
    qualificationLevels: [
      'High School Graduate / Matriculation Exemption / IB',
      'Higher Certificate / National Diploma Holder',
      "Bachelor's / Honours Graduate Applying for Postgraduate",
      "Master's Degree Holder Applying for Doctoral Research",
      'Mid-Career Engineering / Clinical / Executive Practitioner'
    ],
    accreditors: [
      'Free Productivity Accreditation Council (FPAC)',
      'Global Distance Learning Accreditation Board (GDLAB)',
      'International Open Curriculum Consortium (IOCC)',
      'Autonomous Systems & Cybernetics Registry (ASCR)'
    ]
  },
  {
    id: 'research_fellowship',
    title: 'Research Institute Fellowship Registration',
    badge: 'Scholar Roster',
    icon: FileText,
    accentColor: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800/60',
    description: 'Register as an institutional research fellow to submit peer-reviewed whitepapers, co-author monographs, and access thermodynamic compute clusters.',
    tracks: [
      { id: 'visiting_fellow', label: 'Visiting Scholar Fellowship', duration: '6 Months', degree: 'Visiting Fellow Certification' },
      { id: 'senior_fellow', label: 'Senior Sovereign Research Fellow', duration: '2 to 3 Years', degree: 'Principal Investigator Registry' },
      { id: 'phd_fellow', label: 'Doctoral Post-Doc Computational Residency', duration: '2–4 Years', degree: 'Post-Doctoral Research Chair' }
    ],
    qualificationLevels: [
      'Master of Science / Master of Arts',
      'Ph.D. / Terminal Doctoral Candidate',
      'Independent Senior Researcher / Chief Scientist'
    ],
    accreditors: [
      'Global Research & Peer-Review Registry (GRPR)',
      'Free Productivity Accreditation Council (FPAC)',
      'Centre for Open Scientific Verification (COSV)'
    ]
  },
  {
    id: 'music_artist',
    title: 'Music Artist & Composer Roster Registration',
    badge: 'Audio DSP Guild',
    icon: Music,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderLight: 'border-emerald-200 dark:border-emerald-800/60',
    description: 'Publish 24-bit 96kHz lossless masters, license multitrack studio audio, and distribute through our Spotify-style streaming and direct sales storefront.',
    tracks: [
      { id: 'emerging_artist', label: 'Independent Emerging Producer', duration: 'Open Roster', degree: 'Verified Streaming Licensee' },
      { id: 'studio_master', label: 'Audio DSP & Spatial Audio Master', duration: 'Annual Guild', degree: 'Acoustic Engineering Guild Member' },
      { id: 'executive_composer', label: 'Cinematic Score Director & Resident Artist', duration: 'Multi-Year Contract', degree: 'Master Catalog Residency' }
    ],
    qualificationLevels: [
      'Self-Taught / Bedroom Producer with 5+ Released Masters',
      'Conservatory / Audio Engineering Diploma Graduate',
      'Commercial Producer with ISRC-Registered Catalog'
    ],
    accreditors: [
      'International Music Streaming & Licensing Guild (IMSLG)',
      'Audio Engineering Standards Registry (AESR)',
      'Digital Acoustic Creators Union'
    ]
  },
  {
    id: 'photographer',
    title: 'Photographer Representation & Gallery Registration',
    badge: 'Visual Guild',
    icon: Camera,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderLight: 'border-indigo-200 dark:border-indigo-800/60',
    description: 'Register as an accredited photographer to curate 60+ MP high-resolution fine-art photography and commercial stock imagery for international buyers.',
    tracks: [
      { id: 'fine_art', label: 'Fine Art & Gallery Photographer Track', duration: 'Annual Representation', degree: 'Fine Art Gallery License' },
      { id: 'commercial_stock', label: 'Commercial & Editorial Contributor', duration: 'Continuous License', degree: 'Commercial Contributor Credential' },
      { id: 'expedition', label: 'Documentary & Geographic Fellow', duration: '2 to 3 Years', degree: 'Field Expedition Visual Fellow' }
    ],
    qualificationLevels: [
      'Portfolio Submission (minimum 15 raw/high-res frames)',
      'Commercial Licensing Experience with Brands / Publishers',
      'BFA / MFA in Photography or Visual Arts'
    ],
    accreditors: [
      'International Visual Creators Accreditation Board (IVCAB)',
      'Fine Art Print & Archival Quality Bureau (FAPAQB)'
    ]
  },
  {
    id: 'videographer',
    title: 'Videographer & Cinema Guild Registration',
    badge: 'Cinematography Guild',
    icon: Video,
    accentColor: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    borderLight: 'border-rose-200 dark:border-rose-800/60',
    description: 'Publish 4K ProRes 422 HQ footage, drone cinematography, and executive documentary interviews with broadcast-tier licensing protection.',
    tracks: [
      { id: 'cinematic_broll', label: 'Cinematic Stock & B-Roll Specialist', duration: 'Annual Guild', degree: 'ProRes Master Licensee' },
      { id: 'documentary_director', label: 'Documentary Filmmaker Residency', duration: '18 Months', degree: 'Documentary Director Fellow' },
      { id: 'broadcast_master', label: 'Master Colorist & Broadcast DP', duration: 'Multi-Year Fellowship', degree: 'Broadcast DP Certification' }
    ],
    qualificationLevels: [
      'Documented 4K ProRes / RAW Camera Equipment Ownership',
      'Broadcast / Commercial DP Showreel Submission',
      'Film Academy Degree or 5+ Years Production Experience'
    ],
    accreditors: [
      'Broadcast Cinematography Standards Bureau (BCSB)',
      'Society of Digital Cinema Archivists (SDCA)'
    ]
  },
  {
    id: 'book_author',
    title: 'Book Author & Academic Publishing Registration',
    badge: 'Publishing House',
    icon: BookOpen,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderLight: 'border-purple-200 dark:border-purple-800/60',
    description: 'Publish full-length monographs, e-books, and collector paperbacks with ISBN assignment and faculty curriculum alignment.',
    tracks: [
      { id: 'monograph', label: 'Academic Treatise & Monograph Track', duration: 'Publication Lifecycle', degree: 'Official ISBN-Registered Monograph' },
      { id: 'e_book_author', label: 'Independent E-Book & Audiobook Publishing', duration: 'Annual Imprint', degree: 'TTG Press Imprint Author' },
      { id: 'textbook_faculty', label: 'Faculty Curriculum Textbook Author', duration: '2 to 3 Years', degree: 'Standard Course Reference Author' }
    ],
    qualificationLevels: [
      'Completed Manuscript or 3-Chapter Proposal with TOC',
      'Peer-Reviewed Academic Background / Prior Publication',
      'Domain Subject Matter Expert in Applied Theory'
    ],
    accreditors: [
      'International ISBN & Standard Book Agency',
      'Free Productivity Accreditation Council (FPAC)',
      'Scholarly Publishing & Academic Resources Coalition'
    ]
  },
  {
    id: 'retreat_delegate',
    title: 'Executive Sanctuary & Retreat Delegate Registration',
    badge: 'Delegate Roster',
    icon: Compass,
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800/60',
    description: 'Formal delegation registration for intensive physical retreats in Bali, the Swiss Alps, and Kyoto focusing on high-stakes institutional strategy.',
    tracks: [
      { id: 'executive_fellow', label: 'Executive In-Person Delegate (Full Residency)', duration: '7 to 10 Days Intensive', degree: 'Sanctuary Fellow Certificate' },
      { id: 'vip_founder', label: 'VIP Private Villa & Founder Round-Table', duration: '10 Days VIP', degree: 'Executive Strategy Fellowship' },
      { id: 'virtual_delegate', label: 'Global Virtual Sanctuary Delegate', duration: 'Live Interactive Access', degree: 'Virtual Pass Accreditation' }
    ],
    qualificationLevels: [
      'C-Suite Executive / Sovereign Protocol Founder',
      'Lead Researcher / Department Chair / Director',
      'Graduate Student with Faculty Nomination'
    ],
    accreditors: [
      'International Strategic Leadership Institute',
      'Global High-Stakes Governance Forum'
    ]
  }
];

export const ApplicationRegistrationModal: React.FC<ApplicationRegistrationModalProps> = ({
  isOpen,
  onClose,
  user,
  initialCategory = 'course_educare',
  initialPrefill = null,
  onRegistrationComplete
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<ApplicationCategory>(
    initialPrefill?.category || initialCategory
  );
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(ACADEMIC_FACULTIES[0].id);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(ACADEMIC_FACULTIES[0].departments[0].id);
  const [selectedProgram, setSelectedProgram] = useState<string>(ACADEMIC_FACULTIES[0].departments[0].programs[0]);
  const [applicantName, setApplicantName] = useState(user.name || '');
  const [applicantEmail, setApplicantEmail] = useState(user.email || '');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedQualification, setSelectedQualification] = useState<string>('');
  const [selectedAccreditor, setSelectedAccreditor] = useState<string>('');
  const [statementOfIntent, setStatementOfIntent] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState<CategoryRegistration | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setCompletedRegistration(null);
    setApplicantName((prev) => prev || user.name || '');
    setApplicantEmail((prev) => prev || user.email || '');

    const targetCategory = initialPrefill?.category || initialCategory || 'course_educare';
    setSelectedCategoryId(targetCategory);

    if (initialPrefill) {
      const matchedFaculty =
        ACADEMIC_FACULTIES.find((f) => f.id === initialPrefill.facultyId) || ACADEMIC_FACULTIES[0];
      setSelectedFacultyId(matchedFaculty.id);

      let matchedDept =
        matchedFaculty.departments.find((d) => d.id === initialPrefill.departmentId) ||
        matchedFaculty.departments[0];

      if (initialPrefill.programName) {
        const deptWithProgram = matchedFaculty.departments.find((d) =>
          d.programs.some((p) => p.toLowerCase() === initialPrefill.programName?.toLowerCase())
        );
        if (deptWithProgram) {
          matchedDept = deptWithProgram;
        }
      }

      setSelectedDepartmentId(matchedDept.id);
      const matchedProgram =
        (initialPrefill.programName &&
          matchedDept.programs.find(
            (p) => p.toLowerCase() === initialPrefill.programName?.toLowerCase()
          )) ||
        matchedDept.programs[0];
      setSelectedProgram(matchedProgram);

      setSelectedTrack(initialPrefill.trackId || '');
      setSelectedQualification(initialPrefill.qualificationLevel || '');
      setStatementOfIntent(initialPrefill.statementNote || '');
    } else {
      setSelectedTrack('');
      setSelectedQualification('');
      setStatementOfIntent('');
    }
  }, [isOpen, initialCategory, initialPrefill, user.name, user.email]);

  const activeConfig = CATEGORY_CONFIGS.find(c => c.id === selectedCategoryId) || CATEGORY_CONFIGS[0];
  const activeFaculty = ACADEMIC_FACULTIES.find(f => f.id === selectedFacultyId) || ACADEMIC_FACULTIES[0];
  const activeDepartment = activeFaculty.departments.find(d => d.id === selectedDepartmentId) || activeFaculty.departments[0];

  const handleFacultyChange = (facId: string) => {
    setSelectedFacultyId(facId);
    const fac = ACADEMIC_FACULTIES.find(f => f.id === facId) || ACADEMIC_FACULTIES[0];
    const firstDept = fac.departments[0];
    setSelectedDepartmentId(firstDept.id);
    setSelectedProgram(firstDept.programs[0]);
  };

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    const dept = activeFaculty.departments.find(d => d.id === deptId) || activeFaculty.departments[0];
    setSelectedProgram(dept.programs[0]);
  };

  // Reset track selection when switching categories
  const handleSelectCategory = (catId: ApplicationCategory) => {
    setSelectedCategoryId(catId);
    setSelectedTrack('');
    setSelectedQualification('');
    setSelectedAccreditor('');
    setCompletedRegistration(null);
  };

  const currentTrack = activeConfig.tracks.find(t => t.id === selectedTrack) || activeConfig.tracks[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim()) return;

    setIsSubmitting(true);

    const regNum = `TTG-REG-${selectedCategoryId.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackSummary = selectedCategoryId === 'course_educare'
      ? `${currentTrack.label} — ${activeFaculty.shortName} / ${selectedProgram}`
      : currentTrack.label;

    const newReg: CategoryRegistration = {
      id: `reg_${Date.now()}`,
      category: selectedCategoryId,
      categoryTitle: activeConfig.title,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      trackType: trackSummary,
      qualificationLevel: selectedQualification || activeConfig.qualificationLevels[0],
      accreditor: selectedAccreditor || activeConfig.accreditors[0],
      status: 'Approved & Enrolled',
      registrationDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      registrationNumber: regNum,
      statementOfIntent: statementOfIntent.trim() || undefined
    };

    setTimeout(() => {
      // Save to localStorage
      try {
        const saved = localStorage.getItem('ttg_registrations');
        const list = saved ? JSON.parse(saved) : [];
        list.unshift(newReg);
        localStorage.setItem('ttg_registrations', JSON.stringify(list));
      } catch (err) {
        console.error(err);
      }

      setIsSubmitting(false);
      setCompletedRegistration(newReg);
      if (onRegistrationComplete) {
        onRegistrationComplete(newReg);
      }
    }, 600);
  };

  const handleDownloadTranscript = () => {
    if (!completedRegistration) return;
    const transcriptText = `========================================================================
TSOAELA TRAINING GROUND PLATFORM (TTG)
INSTITUTIONAL ADMISSION & CATEGORY REGISTRATION TRANSCRIPT
========================================================================

REGISTRATION NUMBER : ${completedRegistration.registrationNumber}
DATE OF ISSUANCE    : ${completedRegistration.registrationDate}
STATUS              : ${completedRegistration.status.toUpperCase()}
INSTITUTION         : Tsoaela Training Ground Platform (TTG)

APPLICANT DETAILS:
------------------------------------------------------------------------
Full Legal Name     : ${completedRegistration.applicantName}
Institutional Email : ${completedRegistration.applicantEmail}
Category Enrolled   : ${completedRegistration.categoryTitle}
Specialization Track: ${completedRegistration.trackType}
Duration / Degree   : ${currentTrack.duration} — ${currentTrack.degree}
Entry Qualification : ${completedRegistration.qualificationLevel}
Accreditation Board : ${completedRegistration.accreditor}

ACCREDITATION & REGULATORY STANDARDS:
------------------------------------------------------------------------
This registration confirms full institutional standing under the rules
of the Free Productivity Accreditation Council (FPAC) and partner bodies.
The applicant is granted all institutional privileges, library access,
and computational resources under the Tsoaela Training Ground Charter.

VERIFICATION HASH   : SHA-256: e8f4b9319a820c7e091bca7293845bce0198
AUTHORIZED SIGNATURE: Office of the Academic Registrar & Dean of Faculty
========================================================================`;

    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TTG-Registration-${completedRegistration.registrationNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="px-6 sm:px-8 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${activeConfig.bgLight} ${activeConfig.borderLight} border shadow-xs`}>
              <activeConfig.icon className={`w-5 h-5 ${activeConfig.accentColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Tsoaela Training Ground Platform
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${activeConfig.bgLight} ${activeConfig.accentColor}`}>
                  {activeConfig.badge}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                Official Category Application & Registration
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div className="px-6 sm:px-8 py-3 bg-stone-100/60 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 overflow-x-auto flex items-center gap-2">
          {CATEGORY_CONFIGS.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-white dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {completedRegistration ? (
            /* Successful Registration Screen */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-700 shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                  Application Approved & Registered
                </span>
                <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                  Welcome to {completedRegistration.categoryTitle}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto mt-2">
                  Your formal registration record has been committed to the Tsoaela institutional ledger.
                </p>
              </div>

              {/* Registration Certificate Card */}
              <div className="max-w-xl mx-auto p-6 rounded-2xl bg-stone-50 dark:bg-stone-950/70 border-2 border-stone-200 dark:border-stone-800 text-left space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Registration Number</span>
                    <p className="font-mono font-bold text-sm text-purple-700 dark:text-purple-400">
                      {completedRegistration.registrationNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {completedRegistration.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Applicant Name</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{completedRegistration.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Registered Email</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{completedRegistration.applicantEmail}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Track Selected</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{completedRegistration.trackType}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Accrediting Board</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{completedRegistration.accreditor}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Verified by Tsoaela Training Ground
                  </span>
                  <span>Issued: {completedRegistration.registrationDate}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTranscript}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Transcript (.TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompletedRegistration(null);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Category Info Banner */}
              <div className={`p-4 rounded-2xl ${activeConfig.bgLight} ${activeConfig.borderLight} border flex items-start gap-3`}>
                <Building2 className={`w-5 h-5 ${activeConfig.accentColor} shrink-0 mt-0.5`} />
                <div className="text-xs">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">
                    {activeConfig.title}
                  </h4>
                  <p className="text-stone-600 dark:text-stone-300 mt-0.5">
                    {activeConfig.description}
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  <span>Applicant Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Dr. Tsoaelat S."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Institutional Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="e.g. Tsoaelat.s@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* University Faculty, Department & Program Selectors (Educare Courses) */}
              {selectedCategoryId === 'course_educare' && (
                <div className="space-y-4 p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                  {initialPrefill && (
                    <div className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 flex items-center justify-between gap-2 text-[11px] text-purple-800 dark:text-purple-200">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>
                          Pre-filled from selected program: <strong>{selectedProgram}</strong> ({activeFaculty.shortName})
                        </span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider shrink-0">
                        Ready to Submit
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>University Faculty & Program Selection (6 Faculties) *</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      {activeFaculty.codePrefix}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        1. Select Faculty *
                      </label>
                      <select
                        value={selectedFacultyId}
                        onChange={(e) => handleFacultyChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                      >
                        {ACADEMIC_FACULTIES.map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.number}. {fac.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        2. Select Department *
                      </label>
                      <select
                        value={selectedDepartmentId}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                      >
                        {activeFaculty.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        3. Degree / Program Specialization *
                      </label>
                      <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                      >
                        {activeDepartment.programs.map((prog) => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Selected Pathway: <strong className="text-stone-800 dark:text-stone-200">{activeFaculty.name}</strong> › <strong className="text-stone-800 dark:text-stone-200">{activeDepartment.name}</strong> › <strong className="text-purple-700 dark:text-purple-400">{selectedProgram}</strong>
                  </p>
                </div>
              )}

              {/* Specialization Track Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    {selectedCategoryId === 'course_educare'
                      ? 'Select Standard Academic Qualification Level *'
                      : 'Select Curriculum / Roster Track *'}
                  </span>
                </h4>

                {selectedCategoryId === 'course_educare' && (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Level</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Qualification Type</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider">Typical Duration</th>
                          <th className="py-2.5 px-3 font-bold uppercase text-[10px] tracking-wider text-right">Select</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                        {STANDARD_QUALIFICATION_LEVELS.map((qual) => {
                          const isSelected = (selectedTrack || STANDARD_QUALIFICATION_LEVELS[0].id) === qual.id;
                          return (
                            <tr
                              key={qual.id}
                              onClick={() => setSelectedTrack(qual.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-purple-50 dark:bg-purple-950/40'
                                  : 'bg-white dark:bg-stone-950/40 hover:bg-stone-50 dark:hover:bg-stone-900'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-semibold text-stone-800 dark:text-stone-200">
                                {qual.level}
                              </td>
                              <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300 font-medium">
                                {qual.qualificationType}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                                {qual.typicalDuration}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSelected
                                      ? 'bg-purple-700 text-white'
                                      : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Choose'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(() => {
                      const activeQual =
                        STANDARD_QUALIFICATION_LEVELS.find(
                          (q) => q.id === (selectedTrack || STANDARD_QUALIFICATION_LEVELS[0].id)
                        ) || STANDARD_QUALIFICATION_LEVELS[0];
                      return (
                        <div className="p-3 bg-stone-50 dark:bg-stone-950/70 border-t border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-stone-800 dark:text-stone-200">
                            <span>Selected Qualification: {activeQual.qualificationType}</span>
                            <span className="font-mono text-purple-700 dark:text-purple-400">
                              {activeQual.typicalDuration} · {activeQual.nqfCredits}
                            </span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-400">
                            <strong className="text-stone-700 dark:text-stone-300">Focus:</strong> {activeQual.academicFocus}
                          </p>
                          <p className="text-stone-600 dark:text-stone-400">
                            <strong className="text-stone-700 dark:text-stone-300">Entry Requirement:</strong> {activeQual.entryRequirement}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedCategoryId !== 'course_educare' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeConfig.tracks.map(track => {
                      const isSelected = (selectedTrack || activeConfig.tracks[0].id) === track.id;
                      return (
                        <div
                          key={track.id}
                          onClick={() => setSelectedTrack(track.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                              {track.label}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                              {track.duration}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                            Award: <strong className="text-stone-700 dark:text-stone-300">{track.degree}</strong>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Qualifications & Accreditations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Prior Qualification / Experience Level
                  </label>
                  <select
                    value={selectedQualification || activeConfig.qualificationLevels[0]}
                    onChange={(e) => setSelectedQualification(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                  >
                    {activeConfig.qualificationLevels.map((lvl, i) => (
                      <option key={i} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Preferred Institutional Accreditation Board
                  </label>
                  <select
                    value={selectedAccreditor || activeConfig.accreditors[0]}
                    onChange={(e) => setSelectedAccreditor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                  >
                    {activeConfig.accreditors.map((acc, i) => (
                      <option key={i} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Portfolio Link / Document URL */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Portfolio / GitHub / ORCID / Studio Showreel URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  placeholder="https://github.com/... or https://soundcloud.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Statement of Intent */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Statement of Intent & Academic Research Focus (Optional)
                </label>
                <textarea
                  rows={3}
                  value={statementOfIntent}
                  onChange={(e) => setStatementOfIntent(e.target.value)}
                  placeholder="Describe your research hypotheses, study goals, or creative production focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Free Official Institutional Registration ($0 Fee)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Enrolling in Registry...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Registration & Get ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
