import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  ArrowUpRight,
  Clock,
  Flame,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  DeepWorkState,
  PomodoroSessionLog,
  StudyGuide,
} from '../types';
import {
  buildDeepWorkHeatmapData,
  DeepWorkHeatmapCell,
} from '../utils/deepWorkAnalytics';

interface DeepWorkHeatmapD3Props {
  deepWorkState?: DeepWorkState;
  pomodoroLogs: PomodoroSessionLog[];
  studyGuides: StudyGuide[];
  onNavigateToCourse?: (guideId: string) => void;
  onStartDeepWork?: (minutes?: number, guideId?: string) => void;
}

export const DeepWorkHeatmapD3: React.FC<DeepWorkHeatmapD3Props> = ({
  deepWorkState,
  pomodoroLogs,
  studyGuides,
  onNavigateToCourse,
  onStartDeepWork,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [resolution, setResolution] = useState<'3h' | '1h'>('3h');
  const [includePomodoroFocus, setIncludePomodoroFocus] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(840);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );
  const [hoveredCell, setHoveredCell] = useState<{
    cell: DeepWorkHeatmapCell;
    x: number;
    y: number;
  } | null>(null);
  const [selectedCell, setSelectedCell] = useState<DeepWorkHeatmapCell | null>(null);

  // Sync dark mode state dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Measure SVG container width responsively
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const next = Math.max(520, Math.round(el.clientWidth));
      setContainerWidth(next);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const summary = useMemo(
    () =>
      buildDeepWorkHeatmapData({
        deepWorkState,
        pomodoroLogs,
        studyGuides,
        resolution,
        includePomodoroFocus,
      }),
    [deepWorkState, pomodoroLogs, studyGuides, resolution, includePomodoroFocus]
  );

  // Auto-select most recent active cell on initial load or resolution switch
  useEffect(() => {
    const activeCells = summary.cells.filter((c) => c.totalMinutes > 0);
    if (activeCells.length > 0) {
      setSelectedCell(activeCells[activeCells.length - 1]);
    } else {
      setSelectedCell(null);
    }
  }, [resolution, includePomodoroFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render interactive D3 matrix heatmap
  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode) return;

    const width = Math.max(600, containerWidth);
    const margin = {
      top: 28,
      right: 18,
      bottom: 34,
      left: resolution === '3h' ? 68 : 48,
    };
    const rowHeight = resolution === '3h' ? 28 : 14;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = summary.slots.length * rowHeight;
    const totalHeight = innerHeight + margin.top + margin.bottom;

    const svg = d3
      .select(svgNode)
      .attr('viewBox', `0 0 ${width} ${totalHeight}`)
      .attr('width', width)
      .attr('height', totalHeight);

    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(summary.days.map((d) => d.dateKey))
      .range([0, innerWidth])
      .padding(0.14);

    const yScale = d3
      .scaleBand<string>()
      .domain(summary.slots.map((s) => String(s.slotIndex)))
      .range([0, innerHeight])
      .padding(resolution === '3h' ? 0.16 : 0.14);

    // 5-stop color ramp (light/dark mode aware)
    const emptyColor = isDark ? '#1c1917' : '#f5f5f4';
    const emptyStroke = isDark ? '#292524' : '#e7e5e4';
    const activePalette = isDark
      ? ['#064e3b', '#047857', '#10b981', '#84cc16']
      : ['#bbf7d0', '#34d399', '#059669', '#065f46'];

    const colorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 30, 55, 85])
      .range([emptyColor, ...activePalette]);

    // Highlight Peak Study Hour row cleanly in background
    const peakSlotStr = String(summary.peakSlotIndex);
    const peakY = yScale(peakSlotStr);
    if (peakY !== undefined && summary.peakWindowMinutes > 0) {
      g.append('rect')
        .attr('x', -4)
        .attr('y', peakY - 2)
        .attr('width', innerWidth + 8)
        .attr('height', yScale.bandwidth() + 4)
        .attr('rx', 5)
        .attr('fill', isDark ? 'rgba(132, 204, 22, 0.08)' : 'rgba(16, 185, 129, 0.08)')
        .attr('stroke', isDark ? 'rgba(163, 230, 53, 0.35)' : 'rgba(5, 150, 105, 0.28)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');
    }

    // X-Axis ticks (every 5th day + today)
    const xLabelColor = isDark ? '#a8a29e' : '#57534e';
    const xGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight + 16})`);

    summary.days.forEach((day, idx) => {
      if (idx % 5 === 0 || day.isToday) {
        const cx = (xScale(day.dateKey) || 0) + xScale.bandwidth() / 2;
        xGroup
          .append('text')
          .attr('x', cx)
          .attr('y', 0)
          .attr('text-anchor', day.isToday ? 'end' : 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
          .attr('font-weight', day.isToday ? '700' : '500')
          .attr('fill', day.isToday ? (isDark ? '#bef264' : '#065f46') : xLabelColor)
          .text(day.isToday ? 'Today' : day.shortDate);
      }
    });

    // Top weekday markers (S M T W T F S subtle single-letter cues every 3 days + peak header note)
    g.append('text')
      .attr('x', 0)
      .attr('y', -12)
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
      .attr('fill', xLabelColor)
      .text('Last 30 Days (Oldest → Today)');

    if (summary.peakWindowMinutes > 0) {
      g.append('text')
        .attr('x', innerWidth)
        .attr('y', -12)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', '700')
        .attr('fill', isDark ? '#bef264' : '#047857')
        .text(
          `Peak Window: ${
            resolution === '3h' ? summary.peakWindowLabel : summary.peakSingleHourLabel
          }`
        );
    }

    // Y-Axis Slot Labels
    const yGroup = g.append('g');
    summary.slots.forEach((slot) => {
      const showLabel = resolution === '3h' || slot.slotIndex % 3 === 0;
      if (!showLabel) return;
      const cy = (yScale(String(slot.slotIndex)) || 0) + yScale.bandwidth() / 2 + 3.5;
      const isPeak = slot.slotIndex === summary.peakSlotIndex && summary.peakWindowMinutes > 0;
      yGroup
        .append('text')
        .attr('x', -8)
        .attr('y', cy)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, monospace')
        .attr('font-weight', isPeak ? '700' : '500')
        .attr('fill', isPeak ? (isDark ? '#bef264' : '#047857') : xLabelColor)
        .text(slot.shortLabel);
    });

    // Render Heatmap Matrix Cells
    const rects = g
      .selectAll<SVGRectElement, DeepWorkHeatmapCell>('rect.dw-cell')
      .data(summary.cells, (d) => d.id)
      .join('rect')
      .attr('class', 'dw-cell')
      .attr('x', (d) => xScale(d.dateKey) || 0)
      .attr('y', (d) => yScale(String(d.slotIndex)) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', resolution === '3h' ? 4 : 2.5)
      .attr('ry', resolution === '3h' ? 4 : 2.5)
      .attr('fill', (d) => (d.totalMinutes === 0 ? emptyColor : colorScale(d.totalMinutes)))
      .attr('stroke', (d) => {
        if (selectedCell?.id === d.id) {
          return isDark ? '#fef08a' : '#022c22';
        }
        return d.totalMinutes === 0
          ? emptyStroke
          : d.interruptedCount > 0 && d.completedCount === 0
          ? '#f59e0b'
          : 'transparent';
      })
      .attr('stroke-width', (d) => (selectedCell?.id === d.id ? 1.8 : 1))
      .style('cursor', (d) => (d.totalMinutes > 0 ? 'pointer' : 'default'));

    rects
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .attr('stroke', isDark ? '#bef264' : '#064e3b')
          .attr('stroke-width', 1.6);

        const rectX = (xScale(d.dateKey) || 0) + margin.left + xScale.bandwidth() / 2;
        const rectY = (yScale(String(d.slotIndex)) || 0) + margin.top;
        setHoveredCell({ cell: d, x: rectX, y: rectY });
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .attr(
            'stroke',
            selectedCell?.id === d.id
              ? isDark
                ? '#fef08a'
                : '#022c22'
              : d.totalMinutes === 0
              ? emptyStroke
              : d.interruptedCount > 0 && d.completedCount === 0
              ? '#f59e0b'
              : 'transparent'
          )
          .attr('stroke-width', selectedCell?.id === d.id ? 1.8 : 1);
        setHoveredCell(null);
      })
      .on('click', (_event, d) => {
        if (d.totalMinutes > 0) {
          setSelectedCell(d);
        }
      });
  }, [summary, containerWidth, resolution, isDark, selectedCell]);

  const legendStops = isDark
    ? [
        { label: '0m', color: '#1c1917', border: '#292524' },
        { label: '1–29m', color: '#064e3b', border: '#065f46' },
        { label: '30–54m', color: '#047857', border: '#059669' },
        { label: '55–84m', color: '#10b981', border: '#34d399' },
        { label: '85m+', color: '#84cc16', border: '#a3e635' },
      ]
    : [
        { label: '0m', color: '#f5f5f4', border: '#e7e5e4' },
        { label: '1–29m', color: '#bbf7d0', border: '#86efac' },
        { label: '30–54m', color: '#34d399', border: '#10b981' },
        { label: '55–84m', color: '#059669', border: '#047857' },
        { label: '85m+', color: '#065f46', border: '#064e3b' },
      ];

  return (
    <section
      aria-labelledby="deep-work-heatmap-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>D3 Temporal Focus Matrix</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-stone-500 dark:text-stone-400 normal-case font-medium">
              Rolling 30-Day Deep Work Cadence
            </span>
          </div>
          <h2
            id="deep-work-heatmap-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            30-Day Deep Work &amp; Peak Productivity Heatmap
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Pinpoints your highest-output study hours across the last 30 days. Hover or select any block to inspect completed Deep Work sessions and distractions shielded.
          </p>
        </div>

        {/* Interactive Resolution & Source Toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIncludePomodoroFocus((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              includePomodoroFocus
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
            }`}
          >
            {includePomodoroFocus ? 'Deep Work + Focus Logs' : 'Deep Work Blocks Only'}
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setResolution('3h')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                resolution === '3h'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              3h Windows
            </button>
            <button
              type="button"
              onClick={() => setResolution('1h')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                resolution === '1h'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              24h Hourly
            </button>
          </div>
        </div>
      </div>

      {/* Key Peak-Hour KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="font-medium">Most Productive Window</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {summary.peakWindowLabel}
          </div>
          <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 block">
            Peak hour: {summary.peakSingleHourLabel} ({summary.peakSingleHourMinutes}m)
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="font-medium">30-Day Deep Work</span>
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {summary.totalHours30d.toFixed(1)} hrs
          </div>
          <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 block">
            {summary.totalSessions30d} focus block{summary.totalSessions30d === 1 ? '' : 's'} logged
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="font-medium">Active Study Days</span>
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {summary.activeDaysCount} / 30
          </div>
          <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 block">
            Avg {summary.avgMinutesPerActiveDay}m per active day
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="font-medium">Block Completion Rate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {summary.completionDisciplinePercent}%
          </div>
          <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 block">
            {summary.completedSessions30d} finished uninterrupted
          </span>
        </div>
      </div>

      {/* D3 Matrix SVG Canvas */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/40 p-3 sm:p-4">
        <div ref={containerRef} className="relative w-full overflow-x-auto">
          <svg
            ref={svgRef}
            role="img"
            aria-label="30-day Deep Work hour-by-day D3 matrix heatmap"
            className="block min-w-[600px] select-none"
          />

          {/* Floating Tooltip */}
          {hoveredCell && (
            <div
              className="pointer-events-none absolute z-20 w-60 rounded-xl border border-stone-700 bg-stone-950 text-stone-100 p-3 shadow-xl text-xs space-y-1.5"
              style={{
                left: `${Math.min(Math.max(12, hoveredCell.x - 110), Math.max(24, containerWidth - 252))}px`,
                top: `${Math.max(8, hoveredCell.y - 96)}px`,
              }}
            >
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-emerald-400 font-bold">
                <span>
                  {hoveredCell.cell.weekday}, {hoveredCell.cell.shortDate}
                </span>
                <span>{hoveredCell.cell.slotLabel}</span>
              </div>
              {hoveredCell.cell.totalMinutes > 0 ? (
                <>
                  <div className="font-mono tabular-nums font-bold text-white text-sm">
                    {hoveredCell.cell.totalMinutes} min Deep Work
                  </div>
                  <div className="text-[11px] text-stone-300">
                    {hoveredCell.cell.completedCount} completed · {hoveredCell.cell.interruptedCount} partial
                    {hoveredCell.cell.distractionsBlocked > 0
                      ? ` · ${hoveredCell.cell.distractionsBlocked} shielded`
                      : ''}
                  </div>
                  {hoveredCell.cell.topCourseTitle && (
                    <div className="text-[11px] text-stone-400 truncate pt-1 border-t border-stone-800">
                      {hoveredCell.cell.topCourseTitle}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-stone-400">
                  No Deep Work minutes recorded in this window.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend Row */}
        <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              Highlighted band marks your highest-focus window ({summary.peakWindowLabel}). Click any shaded cell to inspect sessions.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>Less</span>
            {legendStops.map((stop) => (
              <span key={stop.label} className="inline-flex items-center gap-1" title={stop.label}>
                <span
                  className="w-3.5 h-3.5 rounded-sm inline-block border"
                  style={{ backgroundColor: stop.color, borderColor: stop.border }}
                />
              </span>
            ))}
            <span>85m+</span>
          </div>
        </div>
      </div>

      {/* Selected Cell Session Breakdown */}
      {selectedCell && selectedCell.totalMinutes > 0 && (
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
              <span>
                {selectedCell.weekday}, {selectedCell.shortDate} ({selectedCell.dateKey})
              </span>
              <span aria-hidden="true">·</span>
              <span>Window {selectedCell.slotLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{selectedCell.totalMinutes} min focused</span>
            </div>
            <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
              {selectedCell.topCourseTitle || 'Independent Deep Work Study Block'}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {selectedCell.sessions
                .map((s) => `${s.elapsedMinutes}m (${s.status === 'live' ? 'Live Now' : s.status})`)
                .join(' · ')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedCell.topCourseId &&
              selectedCell.topCourseId !== 'pomodoro_focus' &&
              onNavigateToCourse && (
                <button
                  type="button"
                  onClick={() => onNavigateToCourse(selectedCell.topCourseId!)}
                  className="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Open Course</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            {onStartDeepWork && (
              <button
                type="button"
                onClick={() =>
                  onStartDeepWork(
                    50,
                    selectedCell.topCourseId && selectedCell.topCourseId !== 'pomodoro_focus'
                      ? selectedCell.topCourseId
                      : undefined
                  )
                }
                className="px-3.5 py-2 rounded-lg bg-[#052e16] hover:bg-[#064e3b] text-[#bef264] border border-[#84cc16]/60 font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Start Deep Work Block</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
