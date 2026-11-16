import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  GitBranch,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { EnrolledStudentRecord, ReadingProgress, StudyGuide, UserProfile } from '../types';

interface KnowledgeGraphSectionProps {
  user: UserProfile;
  studyGuides: StudyGuide[];
  readingProgress: Record<string, ReadingProgress>;
  enrollments?: EnrolledStudentRecord[];
  onNavigateToCourse?: (guideId: string) => void;
}

type KgNodeKind = 'course' | 'chapter' | 'concept';
type MasteryState = 'mastered' | 'gap';
type MasteryFilter = 'all' | 'mastered' | 'gap';

interface KgNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  shortLabel: string;
  kind: KgNodeKind;
  masteryState: MasteryState;
  guideId: string;
  courseTitle: string;
  chapterIdx?: number;
  summaryText: string;
  linkedConcepts: string[];
  radius: number;
}

interface KgEdge extends d3.SimulationLinkDatum<KgNode> {
  id: string;
  source: string | KgNode;
  target: string | KgNode;
  masteryState: MasteryState;
  guideId: string;
  relationship: string;
}

const BLUE_MASTERED = '#2563eb';
const BLUE_MASTERED_DARK = '#1d4ed8';
const RED_GAP = '#dc2626';
const RED_GAP_DARK = '#b91c1c';

export const KnowledgeGraphSection: React.FC<KnowledgeGraphSectionProps> = ({
  user,
  studyGuides,
  readingProgress,
  enrollments = [],
  onNavigateToCourse,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<MasteryFilter>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 740,
    height: 440,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const nextWidth = Math.max(320, Math.round(el.clientWidth));
      setDimensions({ width: nextWidth, height: nextWidth < 540 ? 370 : 440 });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Identify enrolled / started courses and construct D3 Knowledge Graph
  const graphData = useMemo(() => {
    const userEmailLower = user.email.toLowerCase();
    const userNameLower = user.name.toLowerCase();

    const enrolledIds = new Set<string>();
    enrollments.forEach((rec) => {
      if (
        rec.studentEmail.toLowerCase() === userEmailLower ||
        rec.studentName.toLowerCase() === userNameLower
      ) {
        enrolledIds.add(rec.courseId);
      }
    });

    Object.entries(readingProgress).forEach(([gid, prog]) => {
      if (prog && ((prog.completedChapters?.length || 0) > 0 || prog.isCompleted)) {
        enrolledIds.add(gid);
      }
    });

    const enrolledGuides =
      enrolledIds.size > 0
        ? studyGuides.filter((g) => enrolledIds.has(g.id))
        : studyGuides.slice(0, 3);

    const nodes: KgNode[] = [];
    const edges: KgEdge[] = [];

    enrolledGuides.forEach((guide) => {
      const prog = readingProgress[guide.id];
      const completedSet = new Set(prog?.completedChapters || []);
      const totalChapters = Math.max(1, guide.chapters.length);

      const primaryQuiz = guide.quizzes?.[0];
      const quizScore =
        primaryQuiz && prog?.quizScores ? prog.quizScores[primaryQuiz.id] : undefined;
      const quizPassed =
        primaryQuiz !== undefined
          ? quizScore !== undefined && quizScore >= (primaryQuiz.minScoreToPass || 70)
          : true;

      const courseMastered =
        Boolean(prog?.isCompleted) ||
        (completedSet.size >= totalChapters && quizPassed);

      const courseNodeId = `kg_course_${guide.id}`;
      const shortCourse =
        guide.title.length > 24 ? `${guide.title.slice(0, 22)}…` : guide.title;

      nodes.push({
        id: courseNodeId,
        label: guide.title,
        shortLabel: shortCourse,
        kind: 'course',
        masteryState: courseMastered ? 'mastered' : 'gap',
        guideId: guide.id,
        courseTitle: guide.title,
        summaryText: courseMastered
          ? `Course mastered (${completedSet.size}/${totalChapters} chapters complete${
              typeof quizScore === 'number' ? `, quiz ${quizScore}%` : ''
            }).`
          : `${totalChapters - completedSet.size} unread chapter${
              totalChapters - completedSet.size === 1 ? '' : 's'
            }${
              primaryQuiz && !quizPassed
                ? ` · ${primaryQuiz.title} ${
                    typeof quizScore === 'number' ? `scored ${quizScore}%` : 'pending'
                  }`
                : ''
            }.`,
        linkedConcepts: guide.learning_outcomes.slice(0, 3),
        radius: 23,
      });

      // Chapter nodes inside course
      const chapterNodeIds: string[] = [];
      guide.chapters.forEach((ch, idx) => {
        const chMastered = completedSet.has(idx);
        const chNodeId = `kg_ch_${guide.id}_${idx}`;
        chapterNodeIds.push(chNodeId);
        const cleanChapter = ch.title.replace(/^\d+\.\s*/, '');
        const shortCh =
          cleanChapter.length > 22 ? `${cleanChapter.slice(0, 20)}…` : cleanChapter;

        nodes.push({
          id: chNodeId,
          label: ch.title,
          shortLabel: shortCh,
          kind: 'chapter',
          masteryState: chMastered ? 'mastered' : 'gap',
          guideId: guide.id,
          courseTitle: guide.title,
          chapterIdx: idx,
          summaryText: ch.content,
          linkedConcepts: [
            guide.learning_outcomes[idx] ||
              guide.learning_outcomes[idx % Math.max(1, guide.learning_outcomes.length)] ||
              guide.field ||
              guide.category,
          ],
          radius: 16,
        });

        edges.push({
          id: `kg_e_c_ch_${guide.id}_${idx}`,
          source: courseNodeId,
          target: chNodeId,
          masteryState: chMastered ? 'mastered' : 'gap',
          guideId: guide.id,
          relationship: chMastered ? 'Mastered Chapter' : 'Incomplete Chapter',
        });
      });

      // Concept nodes derived from learning outcomes / core domain axioms
      const concepts =
        guide.learning_outcomes.length > 0
          ? guide.learning_outcomes.slice(0, 3)
          : [`Core Theory: ${guide.field || guide.category}`];

      concepts.forEach((conceptTitle, cIdx) => {
        const linkedChapterIdx = Math.min(cIdx, guide.chapters.length - 1);
        const linkedChapterDone = completedSet.has(linkedChapterIdx);
        const isLastConcept = cIdx === concepts.length - 1;
        const conceptMastered = linkedChapterDone && (!isLastConcept || quizPassed);
        const conceptNodeId = `kg_concept_${guide.id}_${cIdx}`;
        const shortConcept =
          conceptTitle.length > 24 ? `${conceptTitle.slice(0, 22)}…` : conceptTitle;

        nodes.push({
          id: conceptNodeId,
          label: conceptTitle,
          shortLabel: shortConcept,
          kind: 'concept',
          masteryState: conceptMastered ? 'mastered' : 'gap',
          guideId: guide.id,
          courseTitle: guide.title,
          chapterIdx: linkedChapterIdx,
          summaryText: conceptMastered
            ? `Concept reinforced via "${guide.chapters[linkedChapterIdx]?.title || 'Module'}".`
            : `Knowledge gap linked to "${guide.chapters[linkedChapterIdx]?.title || 'Unread Module'}"${
                isLastConcept && primaryQuiz && !quizPassed
                  ? ` and pending assessment "${primaryQuiz.title}"`
                  : ''
              }.`,
          linkedConcepts: [guide.chapters[linkedChapterIdx]?.title || guide.title],
          radius: 13,
        });

        edges.push({
          id: `kg_e_ch_con_${guide.id}_${cIdx}`,
          source: chapterNodeIds[linkedChapterIdx] || courseNodeId,
          target: conceptNodeId,
          masteryState: conceptMastered ? 'mastered' : 'gap',
          guideId: guide.id,
          relationship: conceptMastered ? 'Mastered Concept Link' : 'Concept Gap Link',
        });

        // Cross-link consecutive concepts inside the same course so the knowledge graph forms connected chains
        if (cIdx > 0) {
          const prevConceptId = `kg_concept_${guide.id}_${cIdx - 1}`;
          const prevMastered = completedSet.has(Math.min(cIdx - 1, guide.chapters.length - 1));
          const chainMastered = conceptMastered && prevMastered;
          edges.push({
            id: `kg_e_con_chain_${guide.id}_${cIdx}`,
            source: prevConceptId,
            target: conceptNodeId,
            masteryState: chainMastered ? 'mastered' : 'gap',
            guideId: guide.id,
            relationship: chainMastered ? 'Reinforced Prerequisite' : 'Prerequisite Gap',
          });
        }
      });
    });

    return {
      nodes,
      edges,
      courses: enrolledGuides.map((g) => ({ id: g.id, title: g.title })),
    };
  }, [user.email, user.name, studyGuides, readingProgress, enrollments]);

  // Filter graph nodes & edges cleanly
  const filteredGraph = useMemo(() => {
    const scopedNodes = graphData.nodes.filter((n) => {
      const courseMatch = selectedCourseId === 'all' || n.guideId === selectedCourseId;
      const statusMatch = statusFilter === 'all' || n.masteryState === statusFilter;
      return courseMatch && statusMatch;
    });

    const nodeIdSet = new Set(scopedNodes.map((n) => n.id));
    const scopedEdges = graphData.edges.filter((e) => {
      const src = typeof e.source === 'string' ? e.source : e.source.id;
      const tgt = typeof e.target === 'string' ? e.target : e.target.id;
      return nodeIdSet.has(src) && nodeIdSet.has(tgt);
    });

    return {
      nodes: scopedNodes.map((n) => ({ ...n })),
      edges: scopedEdges.map((e) => ({ ...e })),
    };
  }, [graphData, selectedCourseId, statusFilter]);

  // Ensure a valid selectedNodeId when data or filter changes
  useEffect(() => {
    if (
      filteredGraph.nodes.length > 0 &&
      !filteredGraph.nodes.some((n) => n.id === selectedNodeId)
    ) {
      const firstGap = filteredGraph.nodes.find((n) => n.masteryState === 'gap');
      setSelectedNodeId((firstGap || filteredGraph.nodes[0]).id);
    }
  }, [filteredGraph.nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => filteredGraph.nodes.find((n) => n.id === selectedNodeId) || null,
    [filteredGraph.nodes, selectedNodeId]
  );

  // Metrics across all enrolled courses (or current course filter)
  const metrics = useMemo(() => {
    const courseScoped = graphData.nodes.filter(
      (n) => selectedCourseId === 'all' || n.guideId === selectedCourseId
    );
    const masteredCount = courseScoped.filter((n) => n.masteryState === 'mastered').length;
    const gapCount = courseScoped.filter((n) => n.masteryState === 'gap').length;
    const coveragePct =
      courseScoped.length > 0 ? Math.round((masteredCount / courseScoped.length) * 100) : 0;
    return { masteredCount, gapCount, coveragePct };
  }, [graphData.nodes, selectedCourseId]);

  // Render D3 Knowledge Graph
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (filteredGraph.nodes.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const zoomLayer = svg.append('g').attr('class', 'kg-zoom-layer');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    const nodesCopy: KgNode[] = filteredGraph.nodes.map((n, index) => {
      const angle = (index / Math.max(1, filteredGraph.nodes.length)) * Math.PI * 2;
      const spread = n.kind === 'course' ? 75 : n.kind === 'chapter' ? 140 : 195;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * spread,
        y: height / 2 + Math.sin(angle) * (spread * 0.72),
      };
    });

    const edgesCopy: KgEdge[] = filteredGraph.edges.map((e) => ({ ...e }));

    const simulation = d3
      .forceSimulation<KgNode>(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<KgNode, KgEdge>(edgesCopy)
          .id((d) => d.id)
          .distance((d) => (d.relationship.includes('Chapter') ? 95 : 85))
          .strength(0.65)
      )
      .force('charge', d3.forceManyBody<KgNode>().strength(-270))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<KgNode>().radius((d) => d.radius + 24)
      );

    // Mastered connections in Blue, Knowledge Gap connections in Red
    const linkSelection = zoomLayer
      .append('g')
      .attr('class', 'kg-links')
      .selectAll('line')
      .data(edgesCopy)
      .join('line')
      .attr('stroke', (d) => (d.masteryState === 'mastered' ? BLUE_MASTERED : RED_GAP))
      .attr('stroke-opacity', (d) => (d.masteryState === 'mastered' ? 0.78 : 0.82))
      .attr('stroke-width', (d) => (d.masteryState === 'mastered' ? 2.4 : 2.1))
      .attr('stroke-dasharray', (d) => (d.masteryState === 'gap' ? '5 4' : null));

    linkSelection
      .append('title')
      .text((d) => `${d.relationship} (${d.masteryState === 'mastered' ? 'Mastered' : 'Knowledge Gap'})`);

    const nodeSelection = zoomLayer
      .append('g')
      .attr('class', 'kg-nodes')
      .selectAll<SVGGElement, KgNode>('g')
      .data(nodesCopy)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr(
        'aria-label',
        (d) =>
          `${d.label} - ${d.kind} - ${d.masteryState === 'mastered' ? 'Mastered' : 'Knowledge Gap'}`
      )
      .on('click', (_event, d) => setSelectedNodeId(d.id))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setSelectedNodeId(d.id);
        }
      });

    // Selection halo
    nodeSelection
      .append('circle')
      .attr('r', (d) => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        d.id === selectedNodeId
          ? '#f59e0b'
          : d.masteryState === 'mastered'
          ? 'rgba(37, 99, 235, 0.28)'
          : 'rgba(220, 38, 38, 0.28)'
      )
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 3 : 1.5));

    // Main Node Circle: Blue for mastered, Red for knowledge gap
    nodeSelection
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) =>
        d.masteryState === 'mastered'
          ? d.kind === 'course'
            ? BLUE_MASTERED_DARK
            : BLUE_MASTERED
          : d.kind === 'course'
          ? RED_GAP_DARK
          : RED_GAP
      )
      .attr('stroke', (d) =>
        d.masteryState === 'mastered' ? '#93c5fd' : '#fca5a5'
      )
      .attr('stroke-width', 1.8);

    // Code/Kind Glyph inside circle
    nodeSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => (d.kind === 'course' ? '10px' : '9px'))
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) =>
        d.kind === 'course'
          ? 'CRS'
          : d.kind === 'chapter'
          ? `C${(d.chapterIdx ?? 0) + 1}`
          : d.masteryState === 'mastered'
          ? 'OK'
          : 'GAP'
      );

    // Readable Label
    nodeSelection
      .append('text')
      .attr('y', (d) => d.radius + 13)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-stone-800 dark:fill-stone-200')
      .attr('font-size', '10.5px')
      .attr('font-weight', (d) => (d.kind === 'course' ? '700' : '500'))
      .text((d) => d.shortLabel);

    const dragBehavior = d3
      .drag<SVGGElement, KgNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSelection.call(dragBehavior);

    const updatePositions = () => {
      linkSelection
        .attr('x1', (d) => ((d.source as KgNode).x ?? width / 2))
        .attr('y1', (d) => ((d.source as KgNode).y ?? height / 2))
        .attr('x2', (d) => ((d.target as KgNode).x ?? width / 2))
        .attr('y2', (d) => ((d.target as KgNode).y ?? height / 2));

      nodeSelection.attr(
        'transform',
        (d) =>
          `translate(${Math.max(32, Math.min(width - 32, d.x ?? width / 2))},${Math.max(
            28,
            Math.min(height - 28, d.y ?? height / 2)
          )})`
      );
    };

    if (prefersReducedMotion) {
      simulation.stop();
      for (let i = 0; i < 160; i++) simulation.tick();
      updatePositions();
    } else {
      simulation.on('tick', updatePositions);
    }

    return () => {
      simulation.stop();
    };
  }, [filteredGraph, dimensions, selectedNodeId]);

  const handleZoomStep = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(180)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <section
      aria-labelledby="knowledge-graph-heading"
      className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            <GitBranch className="w-4 h-4" />
            <span>Interactive Curriculum Knowledge Graph · D3 Map</span>
          </div>
          <h2
            id="knowledge-graph-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Course Mastery &amp; Concept Gap Graph
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Maps your completed chapters and mastered modules to related course concepts. Mastered links appear in <span className="font-semibold text-blue-600 dark:text-blue-400">blue</span> and knowledge gaps appear in <span className="font-semibold text-red-600 dark:text-red-400">red</span>.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label="Filter knowledge graph by course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 max-w-xs truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <option value="all">All Enrolled Courses ({graphData.courses.length})</option>
            {graphData.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            {[
              { id: 'all' as MasteryFilter, label: 'All Nodes' },
              { id: 'mastered' as MasteryFilter, label: 'Mastered (Blue)' },
              { id: 'gap' as MasteryFilter, label: 'Knowledge Gaps (Red)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mastery Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 flex items-center justify-between">
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">Mastered Modules &amp; Concepts</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {metrics.masteredCount} Mastered
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 flex items-center justify-between">
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">Open Knowledge Gaps</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-red-600 dark:text-red-400">
              {metrics.gapCount} Gaps
            </span>
          </div>
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 flex items-center justify-between">
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">Graph Mastery Coverage</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
              {metrics.coveragePct}%
            </span>
          </div>
          <div className="w-16 h-2 rounded-full bg-red-200 dark:bg-red-950 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${metrics.coveragePct}%` }} />
          </div>
        </div>
      </div>

      {/* Main D3 Canvas + Node Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div
          ref={containerRef}
          className="lg:col-span-2 relative rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 overflow-hidden"
        >
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-700 rounded-lg p-1 shadow-xs">
            <button
              type="button"
              onClick={() => handleZoomStep(1.2)}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              aria-label="Zoom in knowledge graph"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomStep(0.82)}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              aria-label="Zoom out knowledge graph"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              aria-label="Reset knowledge graph zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredGraph.nodes.length === 0 ? (
            <div className="h-[370px] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No nodes match this mastery filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedCourseId('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Show All Nodes
              </button>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="block w-full select-none"
              role="img"
              aria-label="Interactive course knowledge graph showing mastered concepts in blue and knowledge gaps in red"
            />
          )}

          {/* Explicit Dual-Coded Legend (Color + Text) */}
          <div className="px-4 py-2.5 border-t border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-600 dark:text-stone-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
                <span className="w-4 h-0.5 bg-blue-600 inline-block" />
                <span>Mastered Connection / Chapter</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-red-700 dark:text-red-400">
                <span className="w-4 border-t-2 border-dashed border-red-600 inline-block" />
                <span>Knowledge Gap / Unread Concept</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-stone-400">
              CRS Course · C# Chapter · OK/GAP Concept
            </span>
          </div>
        </div>

        {/* Selected Knowledge Node Inspector */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950 p-4 flex flex-col justify-between gap-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200 dark:border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {selectedNode.kind === 'course'
                      ? 'Enrolled Course'
                      : selectedNode.kind === 'chapter'
                      ? 'Study Chapter'
                      : 'Core Concept'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      selectedNode.masteryState === 'mastered'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {selectedNode.masteryState === 'mastered' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Knowledge Gap</span>
                      </>
                    )}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {selectedNode.courseTitle}
                </p>
              </div>

              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {selectedNode.summaryText}
              </p>

              <div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                  Related Concepts &amp; Prerequisites
                </div>
                <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                  {selectedNode.linkedConcepts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <label
                  htmlFor="kg-node-picker"
                  className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1"
                >
                  Jump to Node
                </label>
                <select
                  id="kg-node-picker"
                  value={selectedNode.id}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                >
                  {filteredGraph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.masteryState === 'mastered' ? 'Mastered' : 'Gap'}] {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {selectedNode && onNavigateToCourse && (
            <button
              type="button"
              onClick={() => onNavigateToCourse(selectedNode.guideId)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                selectedNode.masteryState === 'gap'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>
                {selectedNode.masteryState === 'gap'
                  ? 'Close Knowledge Gap in Course'
                  : 'Review Mastered Module'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
