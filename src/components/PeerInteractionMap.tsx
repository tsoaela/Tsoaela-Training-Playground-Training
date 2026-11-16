import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Users,
  Network,
  Video,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { EnrolledStudentRecord, StudyGuide, UserProfile } from '../types';

interface PeerInteractionMapProps {
  user: UserProfile;
  enrollments: EnrolledStudentRecord[];
  studyGuides: StudyGuide[];
  onNavigateToCourse?: (guideId: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string) => void;
}

type NodeKind = 'self' | 'peer' | 'study_group';
type EdgeKind = 'shared_course' | 'study_group' | 'common_interest';
type EdgeFilter = 'all' | EdgeKind;

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  subLabel: string;
  kind: NodeKind;
  courseIds: string[];
  courseTitles: string[];
  sharedInterests: string[];
  progressPercent?: number;
  testScore?: number;
  qualificationLevel?: string;
  peerReviewCount: number;
  primaryCourseId?: string;
  primaryCourseTitle?: string;
  radius: number;
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  kind: EdgeKind;
  label: string;
  strength: number;
  courseId?: string;
}

const EDGE_STYLE_META: Record<
  EdgeKind,
  { stroke: string; label: string; dashArray?: string }
> = {
  shared_course: {
    stroke: '#3b82f6',
    label: 'Same Course Co-Enrollment',
  },
  study_group: {
    stroke: '#8b5cf6',
    label: 'Collaborative Study Group',
  },
  common_interest: {
    stroke: '#10b981',
    label: 'Common Academic Interests',
    dashArray: '5 4',
  },
};

export const PeerInteractionMap: React.FC<PeerInteractionMapProps> = ({
  user,
  enrollments,
  studyGuides,
  onNavigateToCourse,
  onStartStudyRoom,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [edgeFilter, setEdgeFilter] = useState<EdgeFilter>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('self');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 720,
    height: 430,
  });

  // Measure responsive SVG viewport cleanly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const nextWidth = Math.max(320, Math.round(el.clientWidth));
      setDimensions({ width: nextWidth, height: nextWidth < 540 ? 360 : 430 });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Determine the user's enrolled/active courses and derive collaborative graph
  const graphData = useMemo(() => {
    const userEmailLower = user.email.toLowerCase();
    const userNameLower = user.name.toLowerCase();

    const isSelfRecord = (rec: EnrolledStudentRecord) =>
      rec.studentEmail.toLowerCase() === userEmailLower ||
      rec.studentName.toLowerCase() === userNameLower;

    const userEnrollments = enrollments.filter(isSelfRecord);
    const enrolledCourseIdSet = new Set(userEnrollments.map((e) => e.courseId));

    // Include study guides from user enrollments, falling back to first 3 guides so graph always has rich structure
    const relevantCourseIds =
      enrolledCourseIdSet.size > 0
        ? Array.from(enrolledCourseIdSet)
        : studyGuides.slice(0, 3).map((g) => g.id);

    const courseLookup = new Map<string, StudyGuide>();
    studyGuides.forEach((g) => courseLookup.set(g.id, g));

    const userSubjectInterests = new Set<string>();
    userEnrollments.forEach((rec) => {
      if (rec.facultyName) userSubjectInterests.add(rec.facultyName);
      if (rec.subjectScores) {
        Object.entries(rec.subjectScores).forEach(([subject, score]) => {
          if (score >= 85) userSubjectInterests.add(subject);
        });
      }
    });
    if (user.specialization) {
      userSubjectInterests.add(user.specialization);
    }
    relevantCourseIds.forEach((cid) => {
      const g = courseLookup.get(cid);
      if (g?.field) userSubjectInterests.add(g.field);
      else if (g?.category) userSubjectInterests.add(g.category);
    });

    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // 1. Self Anchor Node
    nodesMap.set('self', {
      id: 'self',
      label: user.name || 'You',
      subLabel: 'Your Learning Hub',
      kind: 'self',
      courseIds: relevantCourseIds,
      courseTitles: relevantCourseIds.map((id) => courseLookup.get(id)?.title || id),
      sharedInterests: Array.from(userSubjectInterests).slice(0, 5),
      progressPercent:
        userEnrollments.length > 0
          ? Math.round(
              userEnrollments.reduce((s, r) => s + r.progressPercent, 0) /
                userEnrollments.length
            )
          : undefined,
      qualificationLevel: userEnrollments[0]?.qualificationLevel || 'Scholar Profile',
      peerReviewCount: userEnrollments.reduce(
        (sum, r) => sum + (r.peerReviews?.length || 0),
        0
      ),
      primaryCourseId: relevantCourseIds[0],
      primaryCourseTitle:
        courseLookup.get(relevantCourseIds[0])?.title || relevantCourseIds[0],
      radius: 26,
    });

    // 2. Group peer enrollments by peer identity (shared courses or shared faculty interests)
    const peerRecordsByKey = new Map<string, EnrolledStudentRecord[]>();
    enrollments.forEach((rec) => {
      if (isSelfRecord(rec)) return;
      const inSameCourse = enrolledCourseIdSet.has(rec.courseId);
      const sharesFaculty = userEnrollments.some(
        (ur) => ur.facultyName && ur.facultyName === rec.facultyName
      );
      if (!inSameCourse && !sharesFaculty && enrollments.length > 6) return;

      const peerKey = rec.studentEmail.toLowerCase();
      const existing = peerRecordsByKey.get(peerKey) || [];
      existing.push(rec);
      peerRecordsByKey.set(peerKey, existing);
    });

    peerRecordsByKey.forEach((records, peerKey) => {
      const primary = records[0];
      const peerNodeId = `peer_${peerKey}`;
      const peerCourses = Array.from(new Set(records.map((r) => r.courseId)));
      const peerCourseTitles = peerCourses.map(
        (cid) =>
          courseLookup.get(cid)?.title ||
          records.find((r) => r.courseId === cid)?.courseTitle ||
          cid
      );

      // Compute common academic interests between self and peer
      const sharedInterestsSet = new Set<string>();
      records.forEach((rec) => {
        const g = courseLookup.get(rec.courseId);
        if (g?.field && userSubjectInterests.has(g.field)) sharedInterestsSet.add(g.field);
        if (rec.facultyName && userSubjectInterests.has(rec.facultyName)) {
          sharedInterestsSet.add(rec.facultyName);
        }
        if (rec.subjectScores) {
          Object.entries(rec.subjectScores).forEach(([subject, score]) => {
            if (score >= 82 && userSubjectInterests.has(subject)) {
              sharedInterestsSet.add(subject);
            }
          });
        }
      });
      if (sharedInterestsSet.size === 0 && primary.facultyName) {
        sharedInterestsSet.add(primary.facultyName);
      }

      const exchangedReviewsCount = records.reduce(
        (sum, r) =>
          sum +
          (r.peerReviews || []).filter(
            (pr) =>
              pr.reviewerEmail.toLowerCase() === userEmailLower ||
              pr.reviewerName.toLowerCase() === userNameLower
          ).length,
        0
      );

      const avgPeerProgress = Math.round(
        records.reduce((sum, r) => sum + r.progressPercent, 0) / records.length
      );
      const scoredRecords = records.filter((r) => typeof r.testScore === 'number');
      const avgTestScore =
        scoredRecords.length > 0
          ? Math.round(
              scoredRecords.reduce((sum, r) => sum + (r.testScore || 0), 0) /
                scoredRecords.length
            )
          : undefined;

      const sharedCourseIds = peerCourses.filter((cid) => enrolledCourseIdSet.has(cid));

      nodesMap.set(peerNodeId, {
        id: peerNodeId,
        label: primary.studentName,
        subLabel:
          sharedCourseIds.length > 0
            ? `${sharedCourseIds.length} Shared Course${sharedCourseIds.length > 1 ? 's' : ''}`
            : primary.facultyName,
        kind: 'peer',
        courseIds: peerCourses,
        courseTitles: peerCourseTitles,
        sharedInterests: Array.from(sharedInterestsSet).slice(0, 4),
        progressPercent: avgPeerProgress,
        testScore: avgTestScore,
        qualificationLevel: primary.qualificationLevel,
        peerReviewCount: exchangedReviewsCount,
        primaryCourseId: sharedCourseIds[0] || peerCourses[0],
        primaryCourseTitle:
          courseLookup.get(sharedCourseIds[0] || peerCourses[0])?.title ||
          primary.courseTitle,
        radius: 17 + Math.min(5, sharedCourseIds.length * 2),
      });

      // Add shared_course edge to self if they share an enrolled course
      sharedCourseIds.forEach((cid) => {
        edges.push({
          id: `edge_sc_${peerNodeId}_${cid}`,
          source: 'self',
          target: peerNodeId,
          kind: 'shared_course',
          label: courseLookup.get(cid)?.title || 'Co-Enrolled Course',
          strength: 2,
          courseId: cid,
        });
      });

      // Add common_interest edge when domain/subject interests align or peer reviews exist
      if (sharedInterestsSet.size > 0) {
        edges.push({
          id: `edge_ci_${peerNodeId}`,
          source: 'self',
          target: peerNodeId,
          kind: 'common_interest',
          label: Array.from(sharedInterestsSet).slice(0, 2).join(' · '),
          strength: 1 + Math.min(2, exchangedReviewsCount),
          courseId: sharedCourseIds[0] || peerCourses[0],
        });
      }
    });

    // 3. Collaborative Study Group Hub Nodes for each relevant course
    const groupTargetCourseIds = Array.from(
      new Set([
        ...relevantCourseIds,
        ...Array.from(nodesMap.values()).flatMap((n) => n.courseIds),
      ])
    ).slice(0, 4);

    groupTargetCourseIds.forEach((cid) => {
      const course = courseLookup.get(cid);
      if (!course) return;
      const groupNodeId = `group_${cid}`;
      const memberPeers = Array.from(nodesMap.values()).filter(
        (n) => n.kind === 'peer' && n.courseIds.includes(cid)
      );
      if (memberPeers.length === 0) return;

      const shortName =
        course.title.length > 26 ? `${course.title.slice(0, 24)}…` : course.title;

      nodesMap.set(groupNodeId, {
        id: groupNodeId,
        label: `Study Group: ${shortName}`,
        subLabel: `${memberPeers.length + 1} Collaborative Members`,
        kind: 'study_group',
        courseIds: [cid],
        courseTitles: [course.title],
        sharedInterests: [course.field || course.category, 'Live Peer Room'].filter(Boolean),
        peerReviewCount: 0,
        primaryCourseId: cid,
        primaryCourseTitle: course.title,
        radius: 21,
      });

      edges.push({
        id: `edge_sg_self_${cid}`,
        source: 'self',
        target: groupNodeId,
        kind: 'study_group',
        label: `${course.title} Study Group`,
        strength: 2,
        courseId: cid,
      });

      memberPeers.forEach((peer) => {
        edges.push({
          id: `edge_sg_${peer.id}_${cid}`,
          source: groupNodeId,
          target: peer.id,
          kind: 'study_group',
          label: `${course.title} Study Group`,
          strength: 1.5,
          courseId: cid,
        });
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
      filterCourses: groupTargetCourseIds
        .map((cid) => ({
          id: cid,
          title: courseLookup.get(cid)?.title || cid,
        }))
        .filter((c) => Boolean(c.title)),
    };
  }, [user, enrollments, studyGuides]);

  // Apply course & edge-type filters cleanly
  const filteredGraph = useMemo(() => {
    const validEdges = graphData.edges.filter((edge) => {
      const matchesKind = edgeFilter === 'all' || edge.kind === edgeFilter;
      const matchesCourse =
        selectedCourseId === 'all' || edge.courseId === selectedCourseId;
      return matchesKind && matchesCourse;
    });

    const activeNodeIds = new Set<string>(['self']);
    validEdges.forEach((edge) => {
      const src = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id;
      activeNodeIds.add(src);
      activeNodeIds.add(tgt);
    });

    const visibleNodes = graphData.nodes.filter((n) => activeNodeIds.has(n.id));
    return {
      nodes: visibleNodes.map((n) => ({ ...n })),
      edges: validEdges.map((e) => ({ ...e })),
    };
  }, [graphData, edgeFilter, selectedCourseId]);

  const selectedNode = useMemo(() => {
    return (
      filteredGraph.nodes.find((n) => n.id === selectedNodeId) ||
      filteredGraph.nodes[0] ||
      null
    );
  }, [filteredGraph.nodes, selectedNodeId]);

  // Render D3 force-directed graph
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const zoomLayer = svg.append('g').attr('class', 'peer-map-zoom-layer');

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.55, 2.4])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    const nodesCopy: GraphNode[] = filteredGraph.nodes.map((n, index) => {
      if (n.id === 'self') {
        return { ...n, x: width / 2, y: height / 2, fx: width / 2, fy: height / 2 };
      }
      const angle = (index / Math.max(1, filteredGraph.nodes.length)) * Math.PI * 2;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * 140,
        y: height / 2 + Math.sin(angle) * 120,
      };
    });

    const edgesCopy: GraphEdge[] = filteredGraph.edges.map((e) => ({ ...e }));

    const simulation = d3
      .forceSimulation<GraphNode>(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(edgesCopy)
          .id((d) => d.id)
          .distance((d) => (d.kind === 'study_group' ? 115 : d.kind === 'shared_course' ? 135 : 155))
          .strength((d) => (d.kind === 'study_group' ? 0.55 : 0.4))
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(-360))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 26)
      );

    // Edge lines
    const linkSelection = zoomLayer
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edgesCopy)
      .join('line')
      .attr('stroke', (d) => EDGE_STYLE_META[d.kind].stroke)
      .attr('stroke-opacity', 0.62)
      .attr('stroke-width', (d) => (d.kind === 'shared_course' ? 2.4 : 1.75))
      .attr('stroke-dasharray', (d) => EDGE_STYLE_META[d.kind].dashArray || null);

    // Edge tooltips
    linkSelection.append('title').text((d) => `${EDGE_STYLE_META[d.kind].label}: ${d.label}`);

    // Node groups
    const nodeSelection = zoomLayer
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodesCopy)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.label} (${d.subLabel})`)
      .on('click', (_event, d) => {
        setSelectedNodeId(d.id);
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setSelectedNodeId(d.id);
        }
      });

    // Outer highlight ring for selected node or self anchor
    nodeSelection
      .append('circle')
      .attr('r', (d) => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        d.id === selectedNodeId
          ? '#f59e0b'
          : d.kind === 'self'
          ? '#d97706'
          : 'transparent'
      )
      .attr('stroke-width', 2.5);

    // Core node circle
    nodeSelection
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) =>
        d.kind === 'self'
          ? '#1c1917'
          : d.kind === 'study_group'
          ? '#5b21b6'
          : '#0f172a'
      )
      .attr('stroke', (d) =>
        d.kind === 'self'
          ? '#f59e0b'
          : d.kind === 'study_group'
          ? '#c4b5fd'
          : '#93c5fd'
      )
      .attr('stroke-width', 2);

    // Node glyph / initials inside circle
    nodeSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fafaf9')
      .attr('font-size', (d) => (d.kind === 'self' ? '11px' : '10px'))
      .attr('font-weight', '700')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .text((d) => {
        if (d.kind === 'study_group') return 'GRP';
        const parts = d.label.trim().split(/\s+/);
        return parts
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || '')
          .join('');
      });

    // Readable node label beneath circle
    nodeSelection
      .append('text')
      .attr('y', (d) => d.radius + 14)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-stone-800 dark:fill-stone-200')
      .attr('font-size', '11px')
      .attr('font-weight', (d) => (d.kind === 'self' ? '700' : '600'))
      .text((d) => (d.label.length > 22 ? `${d.label.slice(0, 20)}…` : d.label));

    // Drag behavior
    const dragBehavior = d3
      .drag<SVGGElement, GraphNode>()
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
        if (d.id !== 'self') {
          d.fx = null;
          d.fy = null;
        }
      });

    nodeSelection.call(dragBehavior);

    const updatePositions = () => {
      linkSelection
        .attr('x1', (d) => ((d.source as GraphNode).x ?? width / 2))
        .attr('y1', (d) => ((d.source as GraphNode).y ?? height / 2))
        .attr('x2', (d) => ((d.target as GraphNode).x ?? width / 2))
        .attr('y2', (d) => ((d.target as GraphNode).y ?? height / 2));

      nodeSelection.attr(
        'transform',
        (d) =>
          `translate(${Math.max(36, Math.min(width - 36, d.x ?? width / 2))},${Math.max(
            32,
            Math.min(height - 32, d.y ?? height / 2)
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
    d3.select(svgRef.current).transition().duration(180).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const peerNodesCount = filteredGraph.nodes.filter((n) => n.kind === 'peer').length;
  const groupNodesCount = filteredGraph.nodes.filter((n) => n.kind === 'study_group').length;

  return (
    <section
      aria-labelledby="peer-interaction-map-heading"
      className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">
            <Network className="w-4 h-4" />
            <span>Collaborative Network · D3 Force Graph</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {peerNodesCount} Peers · {groupNodesCount} Study Groups
            </span>
          </div>
          <h2
            id="peer-interaction-map-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Peer Interaction Map
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Explore connections between you, co-enrolled peers, collaborative study groups, and shared academic interests. Drag or select any node to inspect links.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label="Filter peer interaction map by course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 max-w-xs truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
          >
            <option value="all">All Enrolled Courses</option>
            {graphData.filterCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            {[
              { id: 'all' as EdgeFilter, label: 'All Links' },
              { id: 'shared_course' as EdgeFilter, label: 'Same Course' },
              { id: 'study_group' as EdgeFilter, label: 'Study Groups' },
              { id: 'common_interest' as EdgeFilter, label: 'Interests' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEdgeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  edgeFilter === tab.id
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

      {/* Main Split Canvas + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Left/Center D3 Graph Canvas */}
        <div
          ref={containerRef}
          className="lg:col-span-2 relative rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 overflow-hidden"
        >
          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-700 rounded-lg p-1 shadow-xs">
            <button
              type="button"
              onClick={() => handleZoomStep(1.2)}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Zoom in peer interaction map"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomStep(0.82)}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Zoom out peer interaction map"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Reset zoom and center peer map"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredGraph.nodes.length <= 1 ? (
            <div className="h-[360px] flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Users className="w-7 h-7 text-stone-400" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No peer connections match the current filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setEdgeFilter('all');
                  setSelectedCourseId('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Reset Filters
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
              aria-label="Force-directed peer interaction network graph"
            />
          )}

          {/* Legend */}
          <div className="px-4 py-2.5 border-t border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-600 dark:text-stone-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                <span>Same Course</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-violet-500 inline-block" />
                <span>Collaborative Study Group</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-emerald-500 inline-block" />
                <span>Common Academic Interests</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-stone-400">
              Drag nodes · Scroll/Zoom
            </span>
          </div>
        </div>

        {/* Right Selected Node Inspector */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950 p-4 flex flex-col justify-between gap-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
                <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                  {selectedNode.kind === 'self'
                    ? 'Active Scholar'
                    : selectedNode.kind === 'study_group'
                    ? 'Collaborative Study Group'
                    : 'Course Peer'}
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {selectedNode.subLabel}
                  {selectedNode.qualificationLevel ? ` · ${selectedNode.qualificationLevel}` : ''}
                </p>
              </div>

              {typeof selectedNode.progressPercent === 'number' && (
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                      Course Progress
                    </span>
                    <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                      {selectedNode.progressPercent}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                      Avg Assessment
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                      {typeof selectedNode.testScore === 'number'
                        ? `${selectedNode.testScore}%`
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  Shared Courses
                </div>
                <ul className="space-y-1 text-xs text-stone-800 dark:text-stone-200">
                  {selectedNode.courseTitles.slice(0, 3).map((title, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  Common Academic Interests
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selectedNode.sharedInterests.length > 0
                    ? selectedNode.sharedInterests.join(' · ')
                    : 'Systems Architecture · Applied Research'}
                </p>
              </div>

              {selectedNode.peerReviewCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {selectedNode.peerReviewCount} peer critique
                    {selectedNode.peerReviewCount === 1 ? '' : 's'} exchanged
                  </span>
                </div>
              )}

              {/* Quick Node Switcher (keyboard-friendly) */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <label
                  htmlFor="peer-map-node-select"
                  className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1"
                >
                  Inspect Connected Peer / Study Group
                </label>
                <select
                  id="peer-map-node-select"
                  value={selectedNode.id}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                >
                  {filteredGraph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.kind === 'self' ? 'You' : n.kind === 'study_group' ? 'Study Group' : 'Peer'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Select a peer or study group node to inspect details.</span>
            </div>
          )}

          {/* Action Buttons */}
          {selectedNode?.primaryCourseId && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              {onStartStudyRoom && (
                <button
                  type="button"
                  onClick={() =>
                    onStartStudyRoom(
                      selectedNode.primaryCourseTitle || 'Collaborative Study Session',
                      selectedNode.primaryCourseId!
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Collaborative Study Room</span>
                </button>
              )}
              {onNavigateToCourse && (
                <button
                  type="button"
                  onClick={() => onNavigateToCourse(selectedNode.primaryCourseId!)}
                  className="w-full py-2 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Course Materials</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
