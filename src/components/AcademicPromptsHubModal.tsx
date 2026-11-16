import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  GraduationCap, 
  FileEdit, 
  Code, 
  Stethoscope, 
  Calculator, 
  PenTool, 
  HelpCircle, 
  Cpu, 
  ArrowRight,
  Download,
  Share2,
  ListOrdered,
  Layers
} from 'lucide-react';
import { UserProfile, AuthorDocument } from '../types';

interface AcademicPromptsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onInsertIntoEditor?: (doc: Partial<AuthorDocument>) => void;
}

export interface PromptTemplate {
  id: string;
  category: 'course_design' | 'subject_specific' | 'exam_prep';
  title: string;
  role: string;
  targetAudience: 'Professors & Instructors' | 'Students & Researchers' | 'Universal';
  description: string;
  defaultInputs: Record<string, string>;
  generatePrompt: (inputs: Record<string, string>) => string;
  sampleOutput: string;
}

export const ACADEMIC_PROMPT_TEMPLATES: PromptTemplate[] = [
  // 1. Course Design
  {
    id: 'syllabus_architect',
    category: 'course_design',
    title: 'Complete Course Syllabus Architect',
    role: 'Senior University Curriculum Designer',
    targetAudience: 'Professors & Instructors',
    description: 'Draft a complete 15-week university syllabus with Bloom’s Taxonomy SLOs, weekly schedules, grading criteria, and GenAI acceptable-use policies.',
    defaultInputs: {
      courseName: 'Intro to Data Science & Cognitive Systems',
      academicLevel: 'Undergraduate',
      department: 'Computer Science & Decision Sciences',
      aiPolicyMode: 'Permitted with Explicit Citation',
    },
    generatePrompt: (inputs) => `Role: Senior University Curriculum Designer
Task: Draft a complete 15-week university syllabus for a course titled "${inputs.courseName || 'Intro to Data Science'}" at the [${inputs.academicLevel || 'Undergraduate'}] level in the ${inputs.department || 'Academic Department'}.

Instructions:
1. Formulate 4–5 measurable Student Learning Outcomes (SLOs) using Bloom’s Taxonomy action verbs (e.g., Analyze, Evaluate, Synthesize, Implement).
2. Provide a week-by-week schedule (Weeks 1–15) including weekly lecture topics, required readings, assignment deadlines, and exam schedules (Midterm Week 8, Final Exam Week 15).
3. Include a detailed grading criteria table (e.g., Homework 20%, Quizzes 15%, Midterm 25%, Final Project & Presentation 40%).
4. Include a clear AI policy clause stating acceptable vs. unacceptable uses of GenAI (${inputs.aiPolicyMode || 'Permitted with Explicit Citation'}), attribution standards, and penalties for unapproved automated submissions.
Format: Clean Markdown with structured headers and a syllabus table.`,
    sampleOutput: `# Syllabus: Intro to Data Science & Cognitive Systems (15-Week University Course)
**Level:** Undergraduate | **Quality Benchmark:** TTG Internal Curriculum Standard (Non-Accredited)

## Student Learning Outcomes (SLOs)
- **SLO 1 (Analyze):** Deconstruct multi-modal datasets using statistical distributions and Bayesian heuristics.
- **SLO 2 (Implement):** Build robust supervised and unsupervised machine learning pipelines.
- **SLO 3 (Evaluate):** Assess algorithmic bias and precision-recall trade-offs in high-stakes environments.
- **SLO 4 (Synthesize):** Author an institutional reproducible research paper documenting model performance.

## 15-Week Schedule Matrix
| Week | Lecture Focus | Required Readings | Assignments & Milestones |
|---|---|---|---|
| W1 | Foundations of Cognitive Data | Bishop Ch. 1; TTG Module 1 | Problem Set 1 Released |
| W2 | Exploratory Analysis & Vectors | Goodfellow Ch. 2 | Lab 1: Dimensionality Reduction |
| ... | ... | ... | ... |
| W8 | Midterm Examination | Midterm Review Dossier | Midterm Exam (25%) |
| W15 | Final Defense & Project | Capstone Research Papers | Final Defense & Submission (40%) |

## Acceptable GenAI Policy Clause
GenAI tools (e.g. Gemini, Claude) may be utilized for ideation and syntax debugging provided each prompt and synthesis is documented in an appendix. Submitting unedited AI-generated prose without attribution constitutes academic misconduct.`,
  },
  {
    id: 'lesson_plan_generator',
    category: 'course_design',
    title: 'Weekly Module & Lesson Plan Generator',
    role: 'Expert University Lecturer',
    targetAudience: 'Professors & Instructors',
    description: 'Structure 3-hour weekly instruction into interactive lectures, laboratory seminars, group discussions, and active-learning drills.',
    defaultInputs: {
      moduleNumber: 'Module 4: Superposition & Heuristics in Decision Making',
      subject: 'Cognitive Architecture & Game Theory',
      learningGoal: 'Quantify cognitive load under high-uncertainty negotiation scenarios',
    },
    generatePrompt: (inputs) => `Role: Expert University Lecturer
Task: Create a detailed 1-week lesson plan for Module "${inputs.moduleNumber}" in [${inputs.subject}].
Context: The learning objective is for students to [${inputs.learningGoal}].

Instructions:
1. Break the 3-hour weekly instruction into:
   (a) 50-minute interactive lecture (with conceptual check-ins)
   (b) 50-minute lab/seminar activity (hands-on modeling/simulation)
   (c) 50-minute group discussion (student-led debate & peer review)
2. Provide 3 discussion prompt options to spark student engagement.
3. Include 1 active-learning classroom activity (e.g., Think-Pair-Share, Case Study drill, or Simulation Roleplay).
Format: Structured Markdown lesson plan with pedagogical time allocations.`,
    sampleOutput: `# Module 4 Lesson Plan: Superposition & Heuristics in Decision Making

### Block A (0–50 min): Interactive Lecture & Foundations
- **00-15 min:** First-principles deconstruction of bounded rationality.
- **15-35 min:** Mathematical formalism of heuristic pruning.
- **35-50 min:** Live interactive poll: Evaluating Nash equilibrium under ambiguity.

### Block B (50–100 min): Laboratory Seminar & Simulation Drill
- Hands-on execution of multi-agent negotiation matrix in Python/R. Students test algorithmic response rates under randomized payoff degradation.

### Block C (100–150 min): Discussion & Active Learning Drill
- **Active Learning Exercise:** *Think-Pair-Share Negotiation Protocol* (15 min).
- **Prompt 1:** How does cognitive bias amplify when payoff matrices are asymmetric?
- **Prompt 2:** Can automated heuristic pruning replace human moral judgment in crisis response?`,
  },
  {
    id: 'rubric_builder',
    category: 'course_design',
    title: 'Rubric Builder with Criteria & Observable Levels',
    role: 'Academic Assessment Specialist',
    targetAudience: 'Professors & Instructors',
    description: 'Construct an analytical 4x4 grading rubric evaluating Exemplary, Proficient, Developing, and Unacceptable performance.',
    defaultInputs: {
      assignmentName: '10-Page Research Proposal: AI-Augmented Cognitive Systems',
      targetLevel: 'Upper Undergraduate / Masters',
    },
    generatePrompt: (inputs) => `Role: Academic Assessment Specialist
Task: Build an analytical grading rubric for an assignment titled "${inputs.assignmentName}" at the [${inputs.targetLevel}] level.

Instructions:
1. Create a matrix evaluating 4 performance levels: Exemplary (4), Proficient (3), Developing (2), Unacceptable (1) across 4 key criteria:
   - Criterion 1: Thesis Clarity & Argumentation
   - Criterion 2: Methodological Rigor & Evidence
   - Criterion 3: Academic Writing Structure & Formatting
   - Criterion 4: Source Integration & Citation Compliance
Output: Render as a Markdown Table with explicit, observable descriptors in every cell.`,
    sampleOutput: `# Analytical Grading Rubric: ${'10-Page Research Proposal'}

| Criterion | Exemplary (4) | Proficient (3) | Developing (2) | Unacceptable (1) |
|---|---|---|---|---|
| **Thesis Clarity & Argumentation** | Nuanced, original thesis with logical progression and preemptive counter-arguments. | Clear, defensible thesis with coherent sequential arguments. | Broad or descriptive thesis; logic occasionally breaks down. | Missing or contradictory thesis with unsupported assertions. |
| **Methodological Rigor** | Empirical or theoretical framework rigorously validated with edge cases addressed. | Sound methodology with appropriate empirical models applied correctly. | Methodology described but contains procedural gaps or untested assumptions. | Unsubstantiated claims with no recognizable methodology. |
| **Academic Writing & Structure** | Publication-grade prose, impeccable transitions, concise institutional register. | Clear professional register, standard academic transitions. | Repetitive phrasing, occasional mechanical errors or rambling. | Pervasive grammatical errors obscuring semantic meaning. |
| **Citation & Source Integration** | Synthesizes 15+ peer-reviewed sources with flawless citation standard. | 10+ reputable sources integrated smoothly with minor citation errors. | Relies on secondary summaries; citations incomplete. | Egregious citation deficiencies or unvetted internet blogs. |`,
  },

  // 2. Subject-Specific Prompts
  {
    id: 'socratic_stem_tutor',
    category: 'subject_specific',
    title: 'STEM & Quantitative Socratic Tutor',
    role: 'Socratic STEM Tutor',
    targetAudience: 'Students & Researchers',
    description: 'Interactive STEM tutor enforcing a 3-tier hint system without giving away the direct answer.',
    defaultInputs: {
      subject: 'Calculus III / Multivariable Calculus',
      problemStatement: 'Evaluate the surface integral of vector field F(x, y, z) = <z, y, x> over the sphere x^2 + y^2 + z^2 = 9 oriented outward using the Divergence Theorem.',
    },
    generatePrompt: (inputs) => `Role: Socratic STEM Tutor
Task: Act as a Socratic tutor for the following problem in [${inputs.subject}]:
"${inputs.problemStatement}"

Guardrails:
1. Do NOT give me the answer or solve the equation directly.
2. Use a 3-Tier Hint System:
   - Tier 1: Ask me a guiding question about the underlying formula, theorem statement, or physical rule.
   - Tier 2 (if I get stuck): Give me a targeted micro-hint about the derivative, integral bounds, or coordinate system.
   - Tier 3 (if I struggle further): Point out the specific algebraic or trigonometric step to check.
3. Ask me one single question at a time and wait for my response before moving forward.`,
    sampleOutput: `Hello. I am your Socratic STEM Tutor.

Before we calculate any integrals, let's look at the theorem specified: **The Divergence Theorem**.

Can you state what the Divergence Theorem converts a surface integral of a vector field F into, and what operator you must apply to F first?

*(Reply with your understanding to begin step 1)*`,
  },
  {
    id: 'premed_clinical_vignette',
    category: 'subject_specific',
    title: 'Pre-Med, Biology & Nursing Pathophysiology Coach',
    role: 'Medical School Instructor & Pathophysiology Expert',
    targetAudience: 'Students & Researchers',
    description: 'Pathophysiological mechanism breakdown, Pathway Knockout scenarios, and USMLE/MCAT/NCLEX clinical vignettes.',
    defaultInputs: {
      biologicalProcess: 'The Renin-Angiotensin-Aldosterone System (RAAS)',
      inhibitedFactor: 'ACE (Angiotensin-Converting Enzyme)',
    },
    generatePrompt: (inputs) => `Role: Medical School Instructor & Pathophysiology Expert
Task: Help me master [${inputs.biologicalProcess}].

Instructions:
1. Explain the physiological mechanism step-by-step from trigger stimulus to systemic target organs.
2. Create a "Pathway Knockout Scenario": What specific physiological sequelae happen downstream if [${inputs.inhibitedFactor}] is inhibited or overexpressed?
3. Present 1 high-yield clinical vignette (MCAT/USMLE/NCLEX style) testing my second-order reasoning on this mechanism, and wait for my answer before giving feedback.`,
    sampleOutput: `# Physiological Mechanism: Renin-Angiotensin-Aldosterone System (RAAS)
1. **Trigger:** Decreased renal perfusion pressure sensed by juxtaglomerular (JG) cells in afferent arterioles.
2. **Renin Secretion:** Cleaves hepatic angiotensinogen into Angiotensin I.
3. **ACE Conversion:** Pulmonary vascular endothelial ACE converts Ang I into Angiotensin II.
4. **Effector Actions:**
   - Arteriolar vasoconstriction (efferent > afferent to preserve GFR).
   - Aldosterone release from adrenal cortex (increases ENaC expression, reabsorbing Na+ in exchange for K+/H+).

### Pathway Knockout: ACE Inhibition
- Angiotensin II levels drop, leading to decreased systemic vascular resistance and reduced aldosterone.
- Downstream result: Natriuresis, mild hyperkalemia, and bradykinin accumulation (due to lack of ACE breakdown).

### Clinical Vignette Challenge
A 58-year-old male with type 2 diabetes and hypertension is started on an antihypertensive medication. Three weeks later, his serum creatinine rises from 1.0 to 1.3 mg/dL and potassium is 5.2 mEq/L. Which intra-renal hemodynamic change explains this finding?
A) Afferent arteriolar vasoconstriction
B) Efferent arteriolar vasodilation
C) Direct toxic tubular necrosis
D) Increased mesangial contraction

*(Select an option and justify your mechanism)*`,
  },
  {
    id: 'cs_code_reviewer',
    category: 'subject_specific',
    title: 'Computer Science Code Reviewer & Edge-Case Drill',
    role: 'Senior Software Engineer & CS Teaching Assistant',
    targetAudience: 'Students & Researchers',
    description: 'Comprehensive code review checking logic bugs, Big-O complexity, 2+ edge-case challenges, and pseudo-code hints.',
    defaultInputs: {
      topic: 'LRU Cache Implementation with Doubly Linked List',
      codeSnippet: `class Node:
    def __init__(self, key, val):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(0, 0), Node(0, 0)
        self.head.next, self.tail.prev = self.tail, self.head

    def get(self, key: int) -> int:
        if key in self.cache:
            self.remove(self.cache[key])
            self.insert(self.cache[key])
            return self.cache[key].val
        return -1`,
    },
    generatePrompt: (inputs) => `Role: Senior Software Engineer & CS Teaching Assistant
Task: Review my solution for [${inputs.topic}]:

\`\`\`python
${inputs.codeSnippet}
\`\`\`

Instructions:
1. Check for logical bugs, syntax errors, and time/space complexity (Big-O notation).
2. Identify at least 2 potential edge cases my code fails to handle (e.g., zero capacity, updating existing key with new value, duplicate eviction).
3. Rather than writing the corrected code directly, provide pseudo-code hints and ask me to patch the flaw.`,
    sampleOutput: `# Code Review: LRU Cache

### Complexity Analysis
- **Time Complexity:** O(1) for \`get\` and \`put\` (assuming double-linked list operations are O(1)).
- **Space Complexity:** O(C) where C is capacity.

### Detected Flaws & Missing Edge Cases
1. **Edge Case 1 (Capacity Overwrite):** In your \`put\` method (not shown), what happens if you insert an already existing key? If you don't update the value and only evict the tail, the size invariant breaks.
2. **Edge Case 2 (Capacity = 0 or Negative):** Your constructor does not guard against zero or negative capacity.
3. **Pointer Leak:** Notice in \`get\`, if \`self.insert\` doesn't properly hook both \`next\` and \`prev\`, circular references occur.

**Guided Challenge:**
Write pseudo-code for \`put(key, value)\` handling both key existence update and capacity eviction in O(1) time.`,
  },
  {
    id: 'humanities_essay_coach',
    category: 'subject_specific',
    title: 'Humanities & Literature Thesis & Essay Coach',
    role: 'Academic Essay & Writing Coach',
    targetAudience: 'Students & Researchers',
    description: 'Critique thesis strength, play devil’s advocate with counter-arguments, and execute a reverse outline without rewriting.',
    defaultInputs: {
      paperTitle: 'Algorithmic Hegemony: The Panoptic Dimension of Generative Architectures',
      draftOutline: `Thesis: Generative AI models function as digital panopticons by internalizing societal biases while decentralizing accountability away from institutional architects.
P1: Historical grounding of Foucault's panopticism in modern surveillance capitalism.
P2: Algorithmic bias as implicit behavioral reinforcement.
P3: Decentralization of responsibility across distributed model deployment.
P4: Conclusion: Reclaiming individual epistemic autonomy.`,
    },
    generatePrompt: (inputs) => `Role: Academic Essay & Writing Coach
Task: Critique my draft outline for a paper titled "${inputs.paperTitle}":

${inputs.draftOutline}

Instructions:
1. Evaluate the strength and original contribution of my thesis statement.
2. Play Devil's Advocate: Provide the single strongest counter-argument against my central position.
3. Perform a Reverse Outline: Summarize what each paragraph currently accomplishes and flag logical leaps or weak transitions between points.
Constraint: Do not rewrite my essay paragraphs for me; guide me with probing rhetorical questions.`,
    sampleOutput: `# Rhetorical Coaching Report: Algorithmic Hegemony

### 1. Thesis Evaluation
Your thesis is ambitious and conceptually rich. However, it risks conflating two distinct theoretical frameworks: **surveillance capitalism** (extractive observation) and **panopticism** (self-policing through visibility). Clarify whether the user is the inmate or the guard in this architecture.

### 2. Devil's Advocate Position
*Counter-Argument:* Unlike Bentham's Panopticon which relied on centralized architectural symmetry, generative models are open, fine-tunable, and democratically accessible. How do you answer critics who argue that local open-weights models dismantle centralized hegemony rather than reinforce it?

### 3. Reverse Outline & Structural Audit
- **P1 -> P2 Leap:** You jump from Foucault's disciplinary prison to mathematical weight distributions without explaining how statistical training mirrors carceral surveillance.
- **P3 -> P4 Gap:** The transition to "reclaiming autonomy" feels utopian without addressing the material infrastructure of compute clusters.`,
  },

  // 3. Study & Exam Prep
  {
    id: 'feynman_explainer',
    category: 'exam_prep',
    title: 'Feynman Technique Multi-Level Explainer',
    role: 'Feynman Technique Tutor',
    targetAudience: 'Universal',
    description: 'Deconstruct complex concepts across Level 1 (10-year-old analogy) and Level 2 (College rigor) with a bridging synthesis.',
    defaultInputs: {
      concept: 'Quantum Entanglement & Non-Locality',
    },
    generatePrompt: (inputs) => `Role: Feynman Technique Tutor
Task: Explain [${inputs.concept}].

Instructions:
1. Level 1: Explain it to a 10-year-old using a vivid everyday analogy (no academic jargon or math allowed).
2. Level 2: Re-explain it at a college level, introducing technical terms, formal definitions, and governing equations or principles.
3. Highlight the key conceptual bridge between the simple everyday analogy and the formal academic definition.`,
    sampleOutput: `# Feynman Technique Deconstruction: Quantum Entanglement

### Level 1: For a 10-Year-Old (The Magical Shoe Boxes)
Imagine you have a pair of shoes: one left shoe and one right shoe. You place each shoe into its own sealed cardboard box without looking. You give one box to your friend who flies in a spaceship to Mars, while you stay on Earth.
The moment you open your box on Earth and see the Left shoe, you instantly know your friend on Mars has the Right shoe—even though Mars is millions of miles away! They didn't have to send a radio text; the two boxes were secretly linked from the second they were packed together.

### Level 2: University Level (State Vector Superposition)
In quantum mechanics, two particles exist in an entangled state represented by a non-separable composite wave function:
|Ψ⟩ = (1/√2) [ |0⟩_A ⊗ |1⟩_B - |1⟩_A ⊗ |0⟩_B ]
Neither particle possesses a determinate eigenvalue prior to measurement. Performing a projective measurement on Observable A instantaneously collapses the global wave function, determining the outcome for Observable B regardless of spatial separation, violating Bell's inequality while respecting the no-communication theorem.

### The Conceptual Bridge
The shoe box analogy illustrates the *correlation*, but the crucial quantum leap is that unlike shoes (which had definite orientations all along), quantum particles *are both left and right shoes simultaneously* until the box is opened!`,
  },
  {
    id: 'exam_gap_identifier',
    category: 'exam_prep',
    title: 'Practice Exam & Knowledge Gap Identifier',
    role: 'University Exam Commissioner',
    targetAudience: 'Universal',
    description: 'Generates 5 MCQs and 2 short-answer diagnostic questions, evaluates responses, and creates a targeted 3-step review plan.',
    defaultInputs: {
      courseChapter: 'Behavioral Game Theory & Mechanism Design',
      examType: 'Midterm Comprehensive',
    },
    generatePrompt: (inputs) => `Role: University Exam Commissioner
Task: Quiz me on [${inputs.courseChapter}] to prepare for my [${inputs.examType}].

Instructions:
1. Ask me 5 multiple-choice questions (testing first and second-order concepts) and 2 short-answer diagnostic questions one by one.
2. Do NOT reveal the answers until I respond to each question.
3. After the quiz, summarize my specific knowledge gaps and provide an actionable 3-step review plan based on where I struggled.
Start by presenting Question 1.`,
    sampleOutput: `# University Examination: Behavioral Game Theory (Diagnostic Module)

### Question 1 of 7 (Multiple Choice)
In a standard Beauty Contest game where n players pick a number between 0 and 100, and the winner is the player closest to 2/3 of the average:
What is the Level-1 response if Level-0 players are assumed to pick numbers uniformly at random?

A) 50
B) 33.3
C) 22.2
D) 0

*(Reply with your choice and a 1-sentence reasoning to move to Question 2)*`,
  },
];

export const AcademicPromptsHubModal: React.FC<AcademicPromptsHubModalProps> = ({
  isOpen,
  onClose,
  user,
  onInsertIntoEditor,
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(ACADEMIC_PROMPT_TEMPLATES[0].id);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'course_design' | 'subject_specific' | 'exam_prep'>('all');
  const [promptInputs, setPromptInputs] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    ACADEMIC_PROMPT_TEMPLATES.forEach(p => {
      init[p.id] = { ...p.defaultInputs };
    });
    return init;
  });
  const [viewMode, setViewMode] = useState<'prompt' | 'sample'>('prompt');
  const [copiedState, setCopiedState] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = ACADEMIC_PROMPT_TEMPLATES.find(p => p.id === selectedPromptId) || ACADEMIC_PROMPT_TEMPLATES[0];
  const currentInputs = promptInputs[currentTemplate.id] || currentTemplate.defaultInputs;
  const generatedPromptText = currentTemplate.generatePrompt(currentInputs);

  const handleInputChange = (field: string, val: string) => {
    setPromptInputs(prev => ({
      ...prev,
      [currentTemplate.id]: {
        ...prev[currentTemplate.id],
        [field]: val,
      },
    }));
  };

  const handleCopy = () => {
    const textToCopy = viewMode === 'prompt' ? generatedPromptText : currentTemplate.sampleOutput;
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);
  };

  const handleInsertDocument = () => {
    if (onInsertIntoEditor) {
      onInsertIntoEditor({
        title: `${currentTemplate.title} Draft`,
        content: viewMode === 'prompt' ? generatedPromptText : currentTemplate.sampleOutput,
        format: 'pdf',
      });
      onClose();
    }
  };

  const filteredTemplates = ACADEMIC_PROMPT_TEMPLATES.filter(p => 
    activeTabFilter === 'all' || p.category === activeTabFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-2xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Academic Curriculum & Prompt Studio
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                University-grade syllabus architects, Socratic tutors, rubrics, and diagnostic exam generators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader Filter Tabs */}
        <div className="px-6 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTabFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All Prompts ({ACADEMIC_PROMPT_TEMPLATES.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('course_design')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTabFilter === 'course_design'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            1. Syllabus & Course Design
          </button>
          <button
            onClick={() => setActiveTabFilter('subject_specific')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTabFilter === 'subject_specific'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            2. Subject-Specific Academic
          </button>
          <button
            onClick={() => setActiveTabFilter('exam_prep')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTabFilter === 'exam_prep'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            3. Study & Exam Prep
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-stone-900">
          
          {/* Left Column: Template Selection Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-r border-stone-200 dark:border-stone-800 p-4 overflow-y-auto space-y-2 bg-stone-50/50 dark:bg-stone-950/50">
            {filteredTemplates.map(template => {
              const isSelected = template.id === selectedPromptId;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedPromptId(template.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-stone-900 border-purple-500 shadow-md ring-1 ring-purple-500/20'
                      : 'bg-white/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                      template.category === 'course_design' 
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : template.category === 'subject_specific'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}>
                      {template.targetAudience}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {template.role.split(' ')[0]}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {template.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Parameters & Live Output */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-stone-900 p-5 space-y-4">
            
            {/* Template Header & Input Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{currentTemplate.title}</span>
                    <span className="text-xs font-normal text-stone-500">({currentTemplate.role})</span>
                  </h3>
                  <p className="text-xs text-stone-500">{currentTemplate.description}</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs">
                  <button
                    onClick={() => setViewMode('prompt')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'prompt' 
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold' 
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Engineered Prompt
                  </button>
                  <button
                    onClick={() => setViewMode('sample')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'sample' 
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold' 
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Sample Output
                  </button>
                </div>
              </div>

              {/* Dynamic Input Parameter Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs">
                {Object.entries(currentTemplate.defaultInputs).map(([fieldKey, defaultVal]) => (
                  <div key={fieldKey} className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
                      {fieldKey.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      value={currentInputs[fieldKey] ?? defaultVal}
                      onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Preview / Output Area */}
            <div className="flex-1 relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 bg-white dark:bg-stone-900">
                <span className="font-mono text-[11px]">
                  {viewMode === 'prompt' ? 'Ready to execute or paste into AI Superagent' : 'Curriculum Specimen Preview'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-semibold transition-all text-xs"
                  >
                    {copiedState ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedState ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                  </button>
                  {onInsertIntoEditor && (
                    <button
                      onClick={handleInsertDocument}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all text-xs"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Open in Document Editor</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap selection:bg-purple-100">
                {viewMode === 'prompt' ? generatedPromptText : currentTemplate.sampleOutput}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 flex items-center justify-between text-xs text-stone-500">
          <span>TTG Academic Curriculum Prompts · Compliant with Bloom’s Taxonomy & Socratic Guardrails</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 text-white font-bold transition-all"
            >
              Copy & Use
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
