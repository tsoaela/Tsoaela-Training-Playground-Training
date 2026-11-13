export type AcademicCategoryKey =
  | 'Engineering'
  | 'Business'
  | 'Health'
  | 'Science'
  | 'Humanities'
  | 'Education';

export interface AcademicDepartment {
  id: string;
  name: string;
  focusArea: string;
  programs: string[];
}

export interface AcademicQualificationLevel {
  id: string;
  level: 'Undergraduate' | 'Postgraduate' | 'Doctoral';
  qualificationType: string;
  typicalDuration: string;
  nqfCredits: string;
  entryRequirement: string;
  academicFocus: string;
  assessmentFormat: string;
  progressionPath: string;
  coreModules?: string[];
  categoryKey?: AcademicCategoryKey;
  facultyName?: string;
}

export interface AcademicFaculty {
  id: string;
  filterKey: AcademicCategoryKey;
  number: number;
  name: string;
  shortName: string;
  codePrefix: string;
  description: string;
  departments: AcademicDepartment[];
  qualifications: AcademicQualificationLevel[];
}

export interface IndividualProgramDetail {
  faculty: AcademicFaculty;
  department: AcademicDepartment;
  programName: string;
  programCode: string;
  overview: string;
  coreModules: string[];
  careerOutcomes: string[];
  typicalStudyLoad: string;
  applicableQualifications: AcademicQualificationLevel[];
}

export const ACADEMIC_CATEGORY_FILTERS: Array<{
  key: AcademicCategoryKey;
  label: string;
  facultyNumber: number;
}> = [
  { key: 'Engineering', label: 'Engineering', facultyNumber: 1 },
  { key: 'Business', label: 'Business', facultyNumber: 2 },
  { key: 'Health', label: 'Health', facultyNumber: 3 },
  { key: 'Science', label: 'Science', facultyNumber: 4 },
  { key: 'Humanities', label: 'Humanities', facultyNumber: 5 },
  { key: 'Education', label: 'Education', facultyNumber: 6 },
];

export const ACADEMIC_FACULTIES: AcademicFaculty[] = [
  {
    id: 'eng_tech_built',
    filterKey: 'Engineering',
    number: 1,
    name: 'Engineering, Technology & Built Environment',
    shortName: 'Engineering & Tech',
    codePrefix: 'FAC-ENG',
    description:
      'Computational systems, core engineering disciplines, and architectural urban infrastructure.',
    departments: [
      {
        id: 'cs_it',
        name: 'Computer Science & IT',
        focusArea:
          'Distributed computation, applied algorithms, resilient networks, and intelligence engineering.',
        programs: [
          'Software Engineering',
          'Data Science',
          'Artificial Intelligence',
          'Cyber Security',
          'Information Systems',
        ],
      },
      {
        id: 'engineering_fields',
        name: 'Engineering Fields',
        focusArea:
          'Applied physics, industrial thermodynamics, structural mechanics, and aerospace/biomedical systems.',
        programs: [
          'Civil Engineering',
          'Mechanical Engineering',
          'Electrical Engineering',
          'Chemical Engineering',
          'Industrial Engineering',
          'Aeronautical Engineering',
          'Biomedical Engineering',
        ],
      },
      {
        id: 'built_environment',
        name: 'Built Environment',
        focusArea:
          'Spatial design, sustainable civic planning, construction costing, and site project delivery.',
        programs: [
          'Architecture',
          'Urban & Regional Planning',
          'Quantity Surveying',
          'Construction Management',
        ],
      },
    ],
    qualifications: [
      {
        id: 'eng_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / National Diploma in Engineering & IT',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'Senior Certificate with Mathematics & Physical Science foundations.',
        academicFocus: 'Applied drafting, CAD labs, software implementation, and workshop practice.',
        assessmentFormat: 'Laboratory builds, site portfolios, and technical examinations.',
        progressionPath: 'Engineering Technician role or articulation into BEng / BSc.',
        categoryKey: 'Engineering',
        facultyName: 'Engineering, Technology & Built Environment',
      },
      {
        id: 'eng_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: "Bachelor's Degree (BEng, BSc CS, BArch, BTech)",
        typicalDuration: '3–4 Years',
        nqfCredits: '360–480 Credits',
        entryRequirement: 'Strong Mathematics and Physical Science matriculation endorsement.',
        academicFocus: 'Engineering systems design, structural analysis, and software architecture.',
        assessmentFormat: 'Design studios, simulation labs, and senior engineering capstone.',
        progressionPath: 'Candidate Engineer / Technologist or Honours / MEng study.',
        categoryKey: 'Engineering',
        facultyName: 'Engineering, Technology & Built Environment',
      },
      {
        id: 'eng_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'BEng (Hons) / Postgraduate Diploma in Built Environment & AI',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Completed Bachelor’s Degree in Engineering, CS, or Architecture.',
        academicFocus: 'Advanced computational modeling, structural dynamics, and urban systems.',
        assessmentFormat: 'Technical seminars, optimization projects, and honours research paper.',
        progressionPath: 'Master of Engineering (MEng) or MSc Computer Science.',
        categoryKey: 'Engineering',
        facultyName: 'Engineering, Technology & Built Environment',
      },
      {
        id: 'eng_pg_master',
        level: 'Postgraduate',
        qualificationType: "Master's Degree (MEng, MSc Engineering, MArch)",
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: '4-Year BEng or Honours degree in a relevant technical discipline.',
        academicFocus: 'Specialized R&D in AI systems, aerospace, civil structures, or energy.',
        assessmentFormat: 'Peer-reviewed technical dissertation and prototype validation.',
        progressionPath: 'Principal Systems Architect or Doctoral (PhD / DEng) research.',
        categoryKey: 'Engineering',
        facultyName: 'Engineering, Technology & Built Environment',
      },
      {
        id: 'eng_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Engineering (DEng)',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Recognized Master’s degree with an approved engineering research proposal.',
        academicFocus: 'Novel algorithms, materials engineering, and next-generation infrastructure.',
        assessmentFormat: 'Original doctoral thesis and international oral defense.',
        progressionPath: 'Chief Scientist, University Faculty, or R&D Director.',
        categoryKey: 'Engineering',
        facultyName: 'Engineering, Technology & Built Environment',
      },
    ],
  },
  {
    id: 'business_commerce_law',
    filterKey: 'Business',
    number: 2,
    name: 'Business, Commerce & Law',
    shortName: 'Business & Law',
    codePrefix: 'FAC-BUS',
    description:
      'Capital allocation, actuarial risk, enterprise management, economic policy, and jurisprudence.',
    departments: [
      {
        id: 'finance_accounting',
        name: 'Finance & Accounting',
        focusArea:
          'Corporate valuation, IFRS reporting, stochastic risk modeling, and treasury governance.',
        programs: [
          'Financial Accounting',
          'Actuarial Science',
          'Management Accounting',
          'Financial Management',
        ],
      },
      {
        id: 'management_marketing',
        name: 'Management & Marketing',
        focusArea:
          'Organizational strategy, venture scaling, global logistics, brand growth, and talent systems.',
        programs: [
          'Business Administration (BBA/MBA)',
          'Entrepreneurship',
          'Logistics & Supply Chain',
          'Marketing Management',
          'Human Resource Management',
        ],
      },
      {
        id: 'economics',
        name: 'Economics',
        focusArea:
          'Econometric modeling, monetary policy, market microstructure, and sovereign growth.',
        programs: [
          'Micro/Macroeconomics',
          'Quantitative Economics',
          'Development Economics',
        ],
      },
      {
        id: 'law',
        name: 'Law',
        focusArea:
          'Statutory interpretation, cross-border commercial arbitration, and constitutional justice.',
        programs: [
          'Bachelor of Laws (LLB)',
          'Commercial Law',
          'International Law',
          'Criminal Law',
        ],
      },
    ],
    qualifications: [
      {
        id: 'bus_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / Diploma in Accounting & Business Practice',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'National Senior Certificate with Accounting or Mathematics.',
        academicFocus: 'Bookkeeping, commercial contracts, supply chain operations, and HR administration.',
        assessmentFormat: 'Case simulations, regulatory filings, and practical financial exams.',
        progressionPath: 'Junior Analyst / Paralegal or entry into BCom / BBA.',
        categoryKey: 'Business',
        facultyName: 'Business, Commerce & Law',
      },
      {
        id: 'bus_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: "Bachelor's Degree (BCom, BBA, Bachelor of Laws LLB)",
        typicalDuration: '3–4 Years',
        nqfCredits: '360–480 Credits',
        entryRequirement: 'University Exemption with strong Mathematics / English proficiency.',
        academicFocus: 'Corporate finance, actuarial mathematics, macroeconomics, and statutory law.',
        assessmentFormat: 'Moot court briefs, econometric models, and boardroom case exams.',
        progressionPath: 'Articles of Clerkship / Finance Associate or Honours study.',
        categoryKey: 'Business',
        facultyName: 'Business, Commerce & Law',
      },
      {
        id: 'bus_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'BCom (Hons) / Postgraduate Diploma in Finance or Management',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Completed BCom, BBA, or LLB degree.',
        academicFocus: 'CTA accounting prep, quantitative econometrics, and commercial governance.',
        assessmentFormat: 'Graduate valuation seminars and supervised empirical treatise.',
        progressionPath: 'Chartered Accountant / Actuary / MBA / LLM pathways.',
        categoryKey: 'Business',
        facultyName: 'Business, Commerce & Law',
      },
      {
        id: 'bus_pg_master',
        level: 'Postgraduate',
        qualificationType: "Master's Degree (MBA, MCom, Master of Laws LLM)",
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: 'Honours or 4-year professional degree (LLB / BCom Hons) plus experience for MBA.',
        academicFocus: 'Executive strategy, capital markets arbitration, and international trade law.',
        assessmentFormat: 'Executive consulting capstones and peer-reviewed thesis.',
        progressionPath: 'C-Suite Executive, Senior Advocate, or Doctoral research.',
        categoryKey: 'Business',
        facultyName: 'Business, Commerce & Law',
      },
      {
        id: 'bus_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Laws (LLD) / Doctor of Commerce',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Recognized MBA, MCom, or LLM with an original thesis proposal.',
        academicFocus: 'Macroeconomic policy design, jurisprudence theory, and financial stability.',
        assessmentFormat: 'Full doctoral dissertation and formal academic defense.',
        progressionPath: 'Central Bank Fellow, Law Professor, or Economic Advisor.',
        categoryKey: 'Business',
        facultyName: 'Business, Commerce & Law',
      },
    ],
  },
  {
    id: 'health_medical',
    filterKey: 'Health',
    number: 3,
    name: 'Health & Medical Sciences',
    shortName: 'Health & Medicine',
    codePrefix: 'FAC-MED',
    description:
      'Clinical medicine, surgical foundations, allied rehabilitation therapies, and biomedical diagnostics.',
    departments: [
      {
        id: 'clinical_medicine',
        name: 'Clinical Medicine',
        focusArea: 'Evidence-based patient diagnosis, surgical care, pharmacology, and clinical practice.',
        programs: [
          'Medicine & Surgery (MBChB / MD)',
          'Nursing',
          'Dentistry',
          'Pharmacy',
        ],
      },
      {
        id: 'allied_health',
        name: 'Allied Health',
        focusArea: 'Physical rehabilitation, diagnostic imaging, sensory therapy, and patient mobility recovery.',
        programs: [
          'Physiotherapy',
          'Occupational Therapy',
          'Radiography',
          'Clinical Technology',
          'Speech-Language Pathology',
          'Audiology',
        ],
      },
      {
        id: 'bio_lab_sciences',
        name: 'Biological & Laboratory Sciences',
        focusArea:
          'Pathology assays, translational biomedicine, metabolic nutrition, and public environmental health.',
        programs: [
          'Medical Laboratory Science',
          'Biomedical Sciences',
          'Dietetics & Human Nutrition',
          'Environmental Health',
        ],
      },
    ],
    qualifications: [
      {
        id: 'med_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / Diploma in Nursing & Clinical Support',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'Senior Certificate with Life Sciences and Physical Science.',
        academicFocus: 'Patient vitals, clinical hygiene, radiographic positioning, and triage workflows.',
        assessmentFormat: 'Hospital ward practicums, OSCE stations, and anatomy exams.',
        progressionPath: 'Enrolled Clinical Technologist or articulation to Health Sciences degree.',
        categoryKey: 'Health',
        facultyName: 'Health & Medical Sciences',
      },
      {
        id: 'med_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: "Bachelor's & Clinical Degrees (MBChB, MD, BPharm, BNurs, BSc Physio)",
        typicalDuration: '3–6 Years',
        nqfCredits: '360–720 Credits',
        entryRequirement: 'High academic standing in Biology, Chemistry, Physics, and Mathematics.',
        academicFocus: 'Human anatomy, pathology, clinical therapeutics, and supervised hospital rotations.',
        assessmentFormat: 'OSCE clinical exams, ward clerkships, and board licensing evaluations.',
        progressionPath: 'Medical Internship & Community Service / Allied Health licensure.',
        categoryKey: 'Health',
        facultyName: 'Health & Medical Sciences',
      },
      {
        id: 'med_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'BMedSc (Hons) / Postgraduate Diploma in Clinical & Public Health',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Completed Bachelor’s degree in Medicine, Nursing, Pharmacy, or Biomedical Sciences.',
        academicFocus: 'Clinical epidemiology, diagnostic pathology, and advanced rehabilitation protocol.',
        assessmentFormat: 'Clinical case syntheses, laboratory assays, and honours research project.',
        progressionPath: 'Master of Medicine (MMed) or MSc Biomedical Sciences.',
        categoryKey: 'Health',
        facultyName: 'Health & Medical Sciences',
      },
      {
        id: 'med_pg_master',
        level: 'Postgraduate',
        qualificationType: "Master's Degree (MMed, MSc Clinical Sciences, MPharm, MPH)",
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: 'Professional clinical degree (MBChB/BPharm) or Honours in Biomedical Sciences.',
        academicFocus: 'Surgical/medical specialization, pharmacogenomics, and clinical trials.',
        assessmentFormat: 'Registrar clinical competency & peer-reviewed medical dissertation.',
        progressionPath: 'Board-Certified Specialist Physician or Doctoral fellowship.',
        categoryKey: 'Health',
        facultyName: 'Health & Medical Sciences',
      },
      {
        id: 'med_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Medicine & Health Sciences',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Master’s degree in Medicine, Public Health, or Biomedical Science.',
        academicFocus: 'Translational therapeutics, immunology breakthroughs, and clinical biostatistics.',
        assessmentFormat: 'Original medical research dissertation and external clinical defense.',
        progressionPath: 'Principal Clinical Investigator or Medical School Professor.',
        categoryKey: 'Health',
        facultyName: 'Health & Medical Sciences',
      },
    ],
  },
  {
    id: 'science_agriculture',
    filterKey: 'Science',
    number: 4,
    name: 'Science & Agriculture',
    shortName: 'Science & Agri',
    codePrefix: 'FAC-SCI',
    description:
      'Natural sciences, cellular biotechnology, mathematical modeling, and sustainable agricultural systems.',
    departments: [
      {
        id: 'natural_physical',
        name: 'Natural & Physical Sciences',
        focusArea: 'Experimental physics, molecular chemistry, earth systems, climate ecology, and marine science.',
        programs: [
          'Physics',
          'Chemistry',
          'Geology',
          'Environmental Science',
          'Oceanography',
        ],
      },
      {
        id: 'life_biological',
        name: 'Life & Biological Sciences',
        focusArea: 'Enzymology, microbial genomics, evolutionary genetics, bio-engineering, and ecosystem conservation.',
        programs: [
          'Biochemistry',
          'Microbiology',
          'Genetics',
          'Biotechnology',
          'Zoology',
          'Ecology',
        ],
      },
      {
        id: 'mathematical_sciences',
        name: 'Mathematical Sciences',
        focusArea: 'Differential modeling, Bayesian inference, stochastic processes, and genomic data algorithms.',
        programs: [
          'Applied Mathematics',
          'Statistics',
          'Applied Bioinformatics',
        ],
      },
      {
        id: 'agricultural_sciences',
        name: 'Agricultural Sciences',
        focusArea: 'Food-system economics, precision agronomy, livestock science, and sustainable forestry.',
        programs: [
          'Agricultural Economics',
          'Crop Science',
          'Animal Science',
          'Forestry',
        ],
      },
    ],
    qualifications: [
      {
        id: 'sci_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / Diploma in Laboratory & Agricultural Sciences',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'Senior Certificate with Mathematics and Natural/Agricultural Sciences.',
        academicFocus: 'Analytical chemistry instrumentation, soil agronomy, and field sampling.',
        assessmentFormat: 'Wet-lab practicals, field station reports, and quantitative exams.',
        progressionPath: 'Research Technician / Agronomist or BSc articulation.',
        categoryKey: 'Science',
        facultyName: 'Science & Agriculture',
      },
      {
        id: 'sci_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: "Bachelor's Degree (BSc Physical/Life Sciences, BSc Agric)",
        typicalDuration: '3–4 Years',
        nqfCredits: '360–480 Credits',
        entryRequirement: 'University Exemption with strong Mathematics and Science scores.',
        academicFocus: 'Quantum/chemical principles, molecular genetics, statistical modeling, and crop yield.',
        assessmentFormat: 'Experimental laboratory reports, computational models, and final exams.',
        progressionPath: 'Junior Scientist / Quantitative Analyst or BSc Honours.',
        categoryKey: 'Science',
        facultyName: 'Science & Agriculture',
      },
      {
        id: 'sci_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'BSc (Hons) / Postgraduate Diploma in Mathematical & Life Sciences',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Completed BSc or BSc Agric with 65%+ major average.',
        academicFocus: 'Applied bioinformatics pipelines, experimental physics, and molecular biotechnology.',
        assessmentFormat: 'Supervised research project, laboratory seminar, and written exams.',
        progressionPath: 'Master of Science (MSc) candidacy.',
        categoryKey: 'Science',
        facultyName: 'Science & Agriculture',
      },
      {
        id: 'sci_pg_master',
        level: 'Postgraduate',
        qualificationType: "Master's Degree (MSc, MSc Agriculture, MSc Bioinformatics)",
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: 'BSc (Hons) or 4-year BSc Agric degree.',
        academicFocus: 'Independent scientific discovery, statistical genomics, and climate resilience.',
        assessmentFormat: 'Empirical research thesis and peer-reviewed manuscript submission.',
        progressionPath: 'Senior Research Scientist or Doctoral (PhD) study.',
        categoryKey: 'Science',
        facultyName: 'Science & Agriculture',
      },
      {
        id: 'sci_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Science (DSc)',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Recognized MSc degree with approved original research proposal.',
        academicFocus: 'Fundamental breakthroughs in physics, genomics, statistics, or food security.',
        assessmentFormat: 'Published scientific papers, full dissertation, and viva voce.',
        progressionPath: 'Principal Investigator, National Lab Fellow, or Professor.',
        categoryKey: 'Science',
        facultyName: 'Science & Agriculture',
      },
    ],
  },
  {
    id: 'humanities_arts',
    filterKey: 'Humanities',
    number: 5,
    name: 'Humanities, Social Sciences & Arts',
    shortName: 'Humanities & Arts',
    codePrefix: 'FAC-HUM',
    description:
      'Behavioral science, civic governance, philosophy, cultural media, and visual/performing arts.',
    departments: [
      {
        id: 'social_sciences',
        name: 'Social Sciences',
        focusArea: 'Cognitive behavior, social institutions, diplomatic statecraft, culture, and criminological policy.',
        programs: [
          'Psychology',
          'Sociology',
          'Political Science',
          'International Relations',
          'Anthropology',
          'Criminology',
        ],
      },
      {
        id: 'humanities',
        name: 'Humanities',
        focusArea: 'Critical ethics, historiography, comparative literature, strategic media, and linguistics.',
        programs: [
          'Philosophy',
          'History',
          'Literature',
          'Media & Communication Studies',
          'Languages',
        ],
      },
      {
        id: 'creative_performing_arts',
        name: 'Creative & Performing Arts',
        focusArea: 'Studio practice, visual communication systems, music composition, stage craft, and cinema.',
        programs: [
          'Fine Arts',
          'Graphic Design',
          'Music',
          'Theatre & Drama',
          'Film Production',
        ],
      },
    ],
    qualifications: [
      {
        id: 'hum_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / Diploma in Media, Design & Performing Arts',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'National Senior Certificate (plus portfolio or audition for Arts).',
        academicFocus: 'Visual communication, film production craft, journalism, and music performance.',
        assessmentFormat: 'Studio exhibitions, media productions, and critical essays.',
        progressionPath: 'Creative Practitioner / Media Coordinator or BA articulation.',
        categoryKey: 'Humanities',
        facultyName: 'Humanities, Social Sciences & Arts',
      },
      {
        id: 'hum_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: "Bachelor's Degree (BA, BSocSci, Bachelor of Fine Arts BFA, BMus)",
        typicalDuration: '3–4 Years',
        nqfCredits: '360–480 Credits',
        entryRequirement: 'University Exemption with strong language and analytical writing skills.',
        academicFocus: 'Psychological inquiry, political governance, ethics, literature, and studio arts.',
        assessmentFormat: 'Research essays, ethnographic fieldwork, and final creative exhibition.',
        progressionPath: 'Policy Analyst / Clinical Honours Track / Creative Director.',
        categoryKey: 'Humanities',
        facultyName: 'Humanities, Social Sciences & Arts',
      },
      {
        id: 'hum_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'BA (Hons) / BSocSci (Hons) in Psychology, Politics or Arts',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Completed BA, BSocSci, or BFA degree.',
        academicFocus: 'Psychometrics, diplomatic theory, archival historiography, and curatorial practice.',
        assessmentFormat: 'Graduate seminars, qualitative fieldwork, and Honours thesis.',
        progressionPath: 'Master of Arts (MA) or Master of Fine Arts (MFA).',
        categoryKey: 'Humanities',
        facultyName: 'Humanities, Social Sciences & Arts',
      },
      {
        id: 'hum_pg_master',
        level: 'Postgraduate',
        qualificationType: "Master's Degree (MA, MSocSci, Master of Fine Arts MFA)",
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: 'Honours degree in Humanities, Social Sciences, or Fine Arts.',
        academicFocus: 'Clinical/counseling psychology, international relations, or major artistic works.',
        assessmentFormat: 'Full academic dissertation or practice-led exhibition & exegesis.',
        progressionPath: 'Registered Psychologist / Senior Diplomat / Doctoral candidacy.',
        categoryKey: 'Humanities',
        facultyName: 'Humanities, Social Sciences & Arts',
      },
      {
        id: 'hum_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Philosophy & Literature (DPhil / DLitt)',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Recognized MA / MSocSci / MFA with approved research proposal.',
        academicFocus: 'Original philosophical, social, cultural, or linguistic scholarship.',
        assessmentFormat: 'Doctoral monograph/thesis and formal scholarly defense.',
        progressionPath: 'University Professor, Cultural Curator, or Policy Fellow.',
        categoryKey: 'Humanities',
        facultyName: 'Humanities, Social Sciences & Arts',
      },
    ],
  },
  {
    id: 'education',
    filterKey: 'Education',
    number: 6,
    name: 'Education',
    shortName: 'Education',
    codePrefix: 'FAC-EDU',
    description:
      'Early literacy pedagogy, secondary STEM/humanities/business instruction, and educational leadership.',
    departments: [
      {
        id: 'early_childhood',
        name: 'Early Childhood & Primary',
        focusArea: 'Developmental psychology, foundational numeracy, and structured early literacy pedagogy.',
        programs: ['Foundation Phase Teaching'],
      },
      {
        id: 'secondary_fet',
        name: 'Secondary & FET',
        focusArea: 'Intermediate, Senior Phase, and FET curriculum delivery across STEM, Languages, and Business.',
        programs: [
          'Intermediate & Senior Phase Teaching',
          'FET Teaching (STEM Specialization)',
          'FET Teaching (Languages Specialization)',
          'FET Teaching (Business Subjects Specialization)',
        ],
      },
      {
        id: 'postgrad_education',
        name: 'Postgraduate Education',
        focusArea: 'Professional teaching certification, institutional curriculum design, and school governance.',
        programs: [
          'Post-Graduate Certificate in Education (PGCE)',
          'Educational Leadership',
        ],
      },
    ],
    qualifications: [
      {
        id: 'edu_ug_diploma',
        level: 'Undergraduate',
        qualificationType: 'Higher Certificate / Diploma in Early Childhood Development',
        typicalDuration: '1–3 Years',
        nqfCredits: '120–360 Credits',
        entryRequirement: 'National Senior Certificate with language proficiency.',
        academicFocus: 'Early childhood cognitive milestones, classroom facilitation, and play-based literacy.',
        assessmentFormat: 'Supervised school practicums and teaching portfolio.',
        progressionPath: 'Early Childhood Practitioner or BEd Foundation Phase.',
        categoryKey: 'Education',
        facultyName: 'Education',
      },
      {
        id: 'edu_ug_bachelor',
        level: 'Undergraduate',
        qualificationType: 'Bachelor of Education (BEd: Foundation, Intermediate, Senior & FET)',
        typicalDuration: '4 Years',
        nqfCredits: '480 Credits',
        entryRequirement: 'University Exemption with specialization subject prerequisites (STEM/Languages/Business).',
        academicFocus: 'Pedagogical content mastery, inclusive education, and classroom assessment.',
        assessmentFormat: 'Teaching practice placements, lesson design, and subject methodology exams.',
        progressionPath: 'Qualified Educator Registration or BEd Honours / PGCE.',
        categoryKey: 'Education',
        facultyName: 'Education',
      },
      {
        id: 'edu_pg_honours',
        level: 'Postgraduate',
        qualificationType: 'Post-Graduate Certificate in Education (PGCE) / BEd (Hons)',
        typicalDuration: '1 Year',
        nqfCredits: '120 Credits',
        entryRequirement: 'Recognized subject Bachelor’s degree (BA/BSc/BCom) for PGCE, or BEd for Honours.',
        academicFocus: 'Professional teacher qualification in Senior/FET subjects and educational psychology.',
        assessmentFormat: 'Mentored school practicum, curriculum portfolios, and honors treatise.',
        progressionPath: 'Senior Subject Specialist or Master of Education (MEd).',
        categoryKey: 'Education',
        facultyName: 'Education',
      },
      {
        id: 'edu_pg_master',
        level: 'Postgraduate',
        qualificationType: 'Master of Education (MEd) in Curriculum & Educational Leadership',
        typicalDuration: '1–2 Years',
        nqfCredits: '180–240 Credits',
        entryRequirement: 'Completed BEd (Hons) or PGCE plus recognized Honours degree.',
        academicFocus: 'Institutional governance, STEM pedagogy innovation, and national policy design.',
        assessmentFormat: 'Action-research dissertation and institutional improvement study.',
        progressionPath: 'School Principal, Curriculum Director, or Doctoral research.',
        categoryKey: 'Education',
        facultyName: 'Education',
      },
      {
        id: 'edu_doc_phd',
        level: 'Doctoral',
        qualificationType: 'PhD / Doctor of Education (DEd)',
        typicalDuration: '2–4 Years',
        nqfCredits: '360 Credits',
        entryRequirement: 'Recognized MEd or cognate Master’s degree with research proposal.',
        academicFocus: 'Cognitive learning science, comparative education policy, and teacher development.',
        assessmentFormat: 'Original doctoral dissertation and academic oral examination.',
        progressionPath: 'Education Professor, Dean of Pedagogy, or Policy Commissioner.',
        categoryKey: 'Education',
        facultyName: 'Education',
      },
    ],
  },
];

export const STANDARD_QUALIFICATION_LEVELS: AcademicQualificationLevel[] = [
  {
    id: 'ug_cert_diploma',
    level: 'Undergraduate',
    qualificationType: 'Higher Certificate / Diploma',
    typicalDuration: '1–3 Years',
    nqfCredits: '120–360 Credits',
    entryRequirement: 'National Senior Certificate or equivalent foundational secondary credential.',
    academicFocus: 'Applied technical competency, industry-ready laboratory/studio skills, and occupational practice.',
    assessmentFormat: 'Practical portfolios, workplace practicum evaluations, and competency examinations.',
    progressionPath: 'Direct industry placement or articulation into a related Bachelor’s Degree.',
  },
  {
    id: 'ug_bachelor',
    level: 'Undergraduate',
    qualificationType: "Bachelor's Degree (BA, BSc, BCom, BEng)",
    typicalDuration: '3–4 Years',
    nqfCredits: '360–480 Credits',
    entryRequirement: 'University Exemption / Matriculation endorsement with subject-specific prerequisites.',
    academicFocus: 'Comprehensive disciplinary theory, analytical problem-solving, and capstone research foundations.',
    assessmentFormat: 'Semester coursework, written examinations, studio/lab critiques, and senior capstone project.',
    progressionPath: 'Professional practice or progression to Honours Degree / Postgraduate Diploma.',
  },
  {
    id: 'pg_honours_diploma',
    level: 'Postgraduate',
    qualificationType: 'Honours Degree / Postgraduate Diploma',
    typicalDuration: '1 Year',
    nqfCredits: '120 Credits',
    entryRequirement: "Completed Bachelor's Degree (typically 65%+ major average) in a cognate field.",
    academicFocus: 'Intensive specialist theory, empirical research methodology, and an independent Honours treatise.',
    assessmentFormat: 'Graduate seminars, methodological papers, comprehensive exams, and supervised research project.',
    progressionPath: 'Specialist professional registration or admission into Master’s Degree programmes.',
  },
  {
    id: 'pg_master',
    level: 'Postgraduate',
    qualificationType: "Master's Degree (MA, MSc, MBA, MEng)",
    typicalDuration: '1–2 Years',
    nqfCredits: '180–240 Credits',
    entryRequirement: 'Recognized Honours Degree, Postgraduate Diploma, or 4-Year professional Bachelor’s Degree.',
    academicFocus: 'Original applied or theoretical inquiry, executive strategy, and peer-reviewed thesis composition.',
    assessmentFormat: 'Full dissertation by research or coursework modules combined with a minor research thesis.',
    progressionPath: 'Senior leadership, policy advisory roles, or Doctoral (PhD) candidacy.',
  },
  {
    id: 'doc_phd',
    level: 'Doctoral',
    qualificationType: 'PhD / Doctorate (Doctor of Philosophy/Engineering)',
    typicalDuration: '2–4 Years',
    nqfCredits: '360 Credits',
    entryRequirement: "Recognized Master's Degree plus an approved original doctoral research proposal.",
    academicFocus: 'Frontier knowledge creation producing publishable, original contributions to the discipline.',
    assessmentFormat: 'Doctoral dissertation examination by external peers and formal oral defense (viva voce).',
    progressionPath: 'University professorship, principal investigator, or executive research fellowship.',
  },
];

export function buildIndividualProgramDetail(
  faculty: AcademicFaculty,
  department: AcademicDepartment,
  programName: string
): IndividualProgramDetail {
  const cleanCodeToken = programName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.slice(0, 3).toUpperCase())
    .join('-');

  const programCode = `${faculty.codePrefix}-${cleanCodeToken || 'GEN'}`;
  const isPostgradOnly =
    programName.includes('PGCE') ||
    programName.includes('Educational Leadership') ||
    programName.includes('MBA');

  const sourceQualifications = faculty.qualifications.length > 0
    ? faculty.qualifications
    : STANDARD_QUALIFICATION_LEVELS;

  const applicableQualifications = isPostgradOnly
    ? sourceQualifications.filter((q) => q.level !== 'Undergraduate')
    : sourceQualifications;

  return {
    faculty,
    department,
    programName,
    programCode,
    overview: `${programName} within the ${department.name} department (${faculty.name}) focuses on ${department.focusArea.charAt(0).toLowerCase()}${department.focusArea.slice(1)} Students develop rigorous foundational theory alongside applied laboratory, clinical, or studio execution.`,
    coreModules: [
      `Foundations & First Principles of ${programName}`,
      `Analytical Methods & Applied Tools in ${department.name}`,
      `Systems Design, Ethics & Professional Governance`,
      `Senior Capstone Seminar & Empirical Practicum`,
    ],
    careerOutcomes: [
      `Lead ${programName.split('(')[0].trim()} Specialist`,
      `${department.name} Research & Strategy Analyst`,
      `Institutional Consultant · ${faculty.shortName}`,
      `Graduate Academic & Policy Fellow`,
    ],
    typicalStudyLoad: isPostgradOnly
      ? '1–2 Years (Postgraduate Track)'
      : '1–4 Years (Configurable by Qualification Level)',
    applicableQualifications,
  };
}

export function resolveQualificationCoreModules(
  qual: AcademicQualificationLevel,
  faculty?: AcademicFaculty
): string[] {
  if (qual.coreModules && qual.coreModules.length > 0) {
    return qual.coreModules;
  }

  const matchedFaculty =
    faculty ||
    ACADEMIC_FACULTIES.find(
      (f) => f.filterKey === qual.categoryKey || f.name === qual.facultyName
    );

  const deptNames = matchedFaculty?.departments.map((d) => d.name) || [];
  const samplePrograms = matchedFaculty?.departments.flatMap((d) => d.programs).slice(0, 3) || [];
  const domainLabel = matchedFaculty?.shortName || qual.categoryKey || 'Core Discipline';

  if (qual.level === 'Undergraduate' && qual.id.includes('diploma')) {
    return [
      `Applied Foundations in ${deptNames[0] || domainLabel}`,
      samplePrograms[0]
        ? `${samplePrograms[0]} Practical Lab & Workshop`
        : `Technical Drafting & Practice in ${domainLabel}`,
      `Quantitative & Professional Communication Skills`,
      `Supervised Field / Studio Practicum`,
    ];
  }

  if (qual.level === 'Undergraduate') {
    return [
      `Core Theory of ${deptNames[0] || domainLabel}`,
      samplePrograms[0] && samplePrograms[1]
        ? `${samplePrograms[0]} & ${samplePrograms[1]} Systems`
        : `Disciplinary Methods in ${domainLabel}`,
      `Analytical Problem-Solving & Research Ethics`,
      `Senior Undergraduate Capstone Project`,
    ];
  }

  if (qual.level === 'Postgraduate' && qual.id.includes('honours')) {
    return [
      `Advanced Specialist Seminars in ${deptNames[0] || domainLabel}`,
      `Empirical Research Methodology & Quantitative Design`,
      samplePrograms[1]
        ? `Directed Specialization: ${samplePrograms[1]}`
        : `Applied Case Analysis in ${domainLabel}`,
      `Independent Honours Treatise / Research Paper`,
    ];
  }

  if (qual.level === 'Postgraduate') {
    return [
      `Graduate Seminar in ${deptNames[1] || deptNames[0] || domainLabel}`,
      `Strategic Architecture & Institutional Governance`,
      `Peer-Reviewed Empirical Study Design`,
      `Master's Research Dissertation / Consulting Capstone`,
    ];
  }

  return [
    `Frontier Theoretical Inquiry in ${domainLabel}`,
    `Doctoral Colloquium & Peer Review Methodology`,
    `Original Knowledge Contribution & Experimental Proof`,
    `Doctoral Dissertation & Viva Voce Defense`,
  ];
}

export interface QualificationLevelTagInfo {
  tagLabel: 'Certificate / Diploma' | 'Bachelor' | 'Honours' | 'Master' | 'PhD';
  tierLabel: 'Undergraduate' | 'Postgraduate' | 'Doctoral';
  trackId: 'ug_cert_diploma' | 'ug_bachelor' | 'pg_honours_diploma' | 'pg_master' | 'doc_phd';
  entryQualificationLabel: string;
  badgeClassName: string;
}

export function resolveQualificationLevelTag(
  qual: Pick<AcademicQualificationLevel, 'id' | 'level' | 'qualificationType'>
): QualificationLevelTagInfo {
  const typeLower = qual.qualificationType.toLowerCase();
  const idLower = qual.id.toLowerCase();

  if (idLower.includes('diploma') || idLower.includes('cert') || typeLower.includes('certificate') && !typeLower.includes('pgce')) {
    return {
      tagLabel: 'Certificate / Diploma',
      tierLabel: 'Undergraduate',
      trackId: 'ug_cert_diploma',
      entryQualificationLabel: 'High School Graduate / Matriculation Exemption / IB',
      badgeClassName:
        'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
    };
  }

  if (qual.level === 'Undergraduate') {
    return {
      tagLabel: 'Bachelor',
      tierLabel: 'Undergraduate',
      trackId: 'ug_bachelor',
      entryQualificationLabel: 'High School Graduate / Matriculation Exemption / IB',
      badgeClassName:
        'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    };
  }

  if (idLower.includes('honours') || typeLower.includes('hons') || typeLower.includes('honours') || typeLower.includes('pgce')) {
    return {
      tagLabel: 'Honours',
      tierLabel: 'Postgraduate',
      trackId: 'pg_honours_diploma',
      entryQualificationLabel: "Bachelor's / Honours Graduate Applying for Postgraduate",
      badgeClassName:
        'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    };
  }

  if (qual.level === 'Doctoral' || idLower.includes('phd') || typeLower.includes('phd') || typeLower.includes('doctor')) {
    return {
      tagLabel: 'PhD',
      tierLabel: 'Doctoral',
      trackId: 'doc_phd',
      entryQualificationLabel: "Master's Degree Holder Applying for Doctoral Research",
      badgeClassName:
        'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
    };
  }

  return {
    tagLabel: 'Master',
    tierLabel: 'Postgraduate',
    trackId: 'pg_master',
    entryQualificationLabel: "Bachelor's / Honours Graduate Applying for Postgraduate",
    badgeClassName:
      'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
  };
}

export function buildApplicationPrefillForQualification(
  qual: AcademicQualificationLevel,
  faculty?: AcademicFaculty,
  preferredProgramName?: string
) {
  const resolvedFaculty =
    faculty ||
    ACADEMIC_FACULTIES.find(
      (f) => f.filterKey === qual.categoryKey || f.name === qual.facultyName
    ) ||
    ACADEMIC_FACULTIES[0];

  let resolvedDept = resolvedFaculty.departments[0];
  let resolvedProgram = resolvedDept.programs[0];

  if (preferredProgramName) {
    const matchedDept = resolvedFaculty.departments.find((d) =>
      d.programs.some((p) => p.toLowerCase() === preferredProgramName.toLowerCase())
    );
    if (matchedDept) {
      resolvedDept = matchedDept;
      resolvedProgram =
        matchedDept.programs.find(
          (p) => p.toLowerCase() === preferredProgramName.toLowerCase()
        ) || matchedDept.programs[0];
    }
  } else if (qual.level !== 'Undergraduate') {
    const pgDept = resolvedFaculty.departments.find((d) =>
      d.programs.some(
        (p) => p.includes('PGCE') || p.includes('Educational Leadership') || p.includes('MBA')
      )
    );
    if (pgDept) {
      resolvedDept = pgDept;
      resolvedProgram =
        pgDept.programs.find(
          (p) => p.includes('PGCE') || p.includes('Educational Leadership') || p.includes('MBA')
        ) || pgDept.programs[0];
    }
  }

  const levelTag = resolveQualificationLevelTag(qual);

  return {
    category: 'course_educare' as const,
    facultyId: resolvedFaculty.id,
    departmentId: resolvedDept.id,
    programName: resolvedProgram,
    trackId: levelTag.trackId,
    qualificationLevel: levelTag.entryQualificationLabel,
    statementNote: `Applying for ${qual.qualificationType} (${levelTag.tagLabel} · ${qual.typicalDuration}) in ${resolvedProgram} under ${resolvedFaculty.name}.`,
  };
}

