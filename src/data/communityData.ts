import { CommunityPost } from '../types';

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_01',
    title: 'Formal Proof: Asymptotic Convergence in Test-Time Compute for MCTS Reasoning Tokens',
    content: `Following this week's discussion in the Faculty of Frontier AI & Search Theory, our research cohort completed the verification of asymptotic convergence bounds when coupling Monte Carlo Tree Search with process reward verifiers. 

By bounding branch divergence with an epsilon-greedy heuristic, test-time reasoning compute scales logarithmically rather than exponentially. Check out our LaTeX proof preprint in the institutional repository!`,
    authorName: 'Dr. Evelyn Brand',
    authorEmail: 'evelyn.brand@ttg.edu',
    authorRole: 'Dean & Principal Investigator',
    tag: 'Research Thesis',
    facultyCategory: 'Faculty of Frontier AI & Search Theory',
    relatedCourseId: 'guide_ai_scaling',
    relatedCourseTitle: 'Frontier AI & Heuristic Search Theory',
    timestamp: '2 hours ago',
    likes: 42,
    commentsCount: 6,
    pinned: true,
    projectUrl: 'https://github.com/tsoaela-research/mcts-test-time-bounds',
    codeSnippet: `def evaluate_reasoning_beam(tree, verifier, max_depth=12):
    # Epsilon-greedy frontier expansion with bounded verifier variance
    frontier = PriorityQueue(key=lambda node: -verifier.score(node))
    while not frontier.empty() and tree.depth < max_depth:
        best_candidate = frontier.pop()
        yield best_candidate.synthesize_step()`,
    comments: [
      {
        id: 'comm_01',
        authorName: 'Marcus Thorne',
        authorEmail: 'marcus.t@ttg.edu',
        authorRole: 'Fellow',
        content: 'Remarkable work on the epsilon bound. Does this assumption hold when transitioning from mathematical theorems to multi-agent dialogue negotiation?',
        timestamp: '1 hour ago',
        likes: 8
      },
      {
        id: 'comm_02',
        authorName: 'Dr. Evelyn Brand',
        authorEmail: 'evelyn.brand@ttg.edu',
        authorRole: 'Dean & Principal Investigator',
        content: 'Yes, provided the utility matrix satisfies strict supermodularity. We are testing this in Friday’s Study Group video room.',
        timestamp: '45 mins ago',
        likes: 5
      }
    ]
  },
  {
    id: 'post_02',
    title: 'Showcase: Real-Time Thermodynamic Micro-Reactor Dispatcher Simulator',
    content: `Built a full browser simulation demonstrating zero-marginal compute arbitration for the Faculty of Sovereign Economics. 

The scheduler dynamically prices GPU inference clusters based on real-time megawatt output from modular nuclear micro-reactors and ambient cooling gradients. Open source and ready for peer review!`,
    authorName: 'Elena Vance, Ph.D.',
    authorEmail: 'elena.vance@ttg.edu',
    authorRole: 'Energy Economist Fellow',
    tag: 'Project Showcase',
    facultyCategory: 'Faculty of Sovereign Economics',
    relatedCourseId: 'guide_zero_marginal_compute',
    relatedCourseTitle: 'Zero-Marginal Compute: Economics of Abundance',
    timestamp: '5 hours ago',
    likes: 38,
    commentsCount: 4,
    projectUrl: 'https://github.com/tsoaela-research/reactor-compute-grid',
    comments: [
      {
        id: 'comm_03',
        authorName: 'Tsoaelat S.',
        authorEmail: 'Tsoaelat.s@gmail.com',
        authorRole: 'Academic Scholar',
        content: 'Testing the dispatcher logic now. The way it throttles batch fine-tuning jobs during grid peak demand is brilliant.',
        timestamp: '3 hours ago',
        likes: 12
      }
    ]
  },
  {
    id: 'post_03',
    title: 'Discussion: Can Byzantine Fault Tolerant Swarms Obsolete Institutional Board Governance?',
    content: `Reading through Chapter 4 of the Autonomous Swarms study guide. If micro-contracts execute with zero latency via threshold multi-signatures, do we still need traditional quarterly board approvals for treasury allocations? 

Where are the legal vulnerabilities in jurisdiction-less state machines? Let us debate below!`,
    authorName: 'Kaelen Thorne',
    authorEmail: 'kaelen.thorne@ttg.edu',
    authorRole: 'Autonomous Systems TA',
    tag: 'Discussion Thread',
    facultyCategory: 'Faculty of Autonomous Swarms',
    relatedCourseId: 'guide_autonomous_swarms',
    relatedCourseTitle: 'Autonomous Swarms & The Cybernetic State',
    timestamp: '1 day ago',
    likes: 29,
    commentsCount: 3,
    comments: [
      {
        id: 'comm_04',
        authorName: 'Soraya M. Khemir',
        authorEmail: 'soraya.k@ttg.edu',
        authorRole: 'Mechanism Design Chair',
        content: 'The vulnerability is Byzantine collusion across relayers. Without an objective social recovery mechanism, a 51% algorithmic attack can permanently drain liquid reserves.',
        timestamp: '22 hours ago',
        likes: 15
      }
    ]
  },
  {
    id: 'post_04',
    title: 'Curriculum Update: New 15-Week Syllabus Released for Cognitive Systems 401',
    content: `Attention all enrolled students in the Faculty of Cognitive Architecture: The updated 15-week syllabus, active learning drills (Think-Pair-Share), and analytical grading rubric have been published to the Academic Prompt Studio. 

Please review the revised Bloom’s Taxonomy Student Learning Outcomes before Module 2's group session.`,
    authorName: 'Office of the Academic Registrar',
    authorEmail: 'registrar@ttg.edu',
    authorRole: 'Administration',
    tag: 'Academic Update',
    facultyCategory: 'Faculty of Cognitive Architecture',
    relatedCourseId: 'guide_cognitive_latency',
    relatedCourseTitle: 'The Sovereign Mind: Cognitive Architecture',
    timestamp: '2 days ago',
    likes: 54,
    commentsCount: 1,
    comments: [
      {
        id: 'comm_05',
        authorName: 'Lucian Du Maurier',
        authorEmail: 'lucian.m@ttg.edu',
        authorRole: 'Producer Fellow',
        content: 'Received. Incorporating the psychoacoustic spatialization references into Module 4.',
        timestamp: '1 day ago',
        likes: 4
      }
    ]
  }
];
