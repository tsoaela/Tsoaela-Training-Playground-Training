import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Clock, Sun, Sunset, Moon, TrendingUp } from 'lucide-react';
import { DeepWorkState, PomodoroSessionLog, StudyGuide } from '../types';
import {
  buildDailyFocusIntensityTrend30d,
  DailyFocusIntensityPoint,
} from '../utils/deepWorkAnalytics';

interface FocusIntensityTrendChartProps {
  deepWorkState?: DeepWorkState;
  pomodoroLogs?: PomodoroSessionLog[];
  studyGuides?: StudyGuide[];
}

interface CustomTrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number | null;
    dataKey?: string;
    payload?: DailyFocusIntensityPoint;
  }>;
}

const CustomTrendTooltip: React.FC<CustomTrendTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 shadow-lg text-xs space-y-1.5 min-w-[210px]">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-1.5">
        <span className="font-bold text-stone-900 dark:text-stone-100">
          {point.weekday}, {point.shortDate}
          {point.isToday ? ' (Today)' : ''}
        </span>
        <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
          {point.dailyFocusIntensity !== null
            ? `${point.dailyFocusIntensity}/100`
            : 'Rest Day'}
        </span>
      </div>

      <div className="space-y-1 font-mono tabular-nums text-[11px]">
        <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
          <span>7-Day Rolling Avg</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {point.rolling7DayAvg !== null ? `${point.rolling7DayAvg}/100` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
          <span>Study Volume</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {point.totalMinutes}m ({point.sessionsCount} blocks)
          </span>
        </div>
        {point.peakSlotLabel && (
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
            <span>Peak Window</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {point.peakSlotLabel}
            </span>
          </div>
        )}
      </div>

      {point.topCourseTitle && (
        <div className="pt-1 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[230px]">
          Top Focus: {point.topCourseTitle}
        </div>
      )}
    </div>
  );
};

export const FocusIntensityTrendChart: React.FC<
  FocusIntensityTrendChartProps
> = ({ deepWorkState, pomodoroLogs = [], studyGuides = [] }) => {
  const [includeRestZeros, setIncludeRestZeros] = useState<boolean>(false);
  const [includePomodoro, setIncludePomodoro] = useState<boolean>(true);

  const trend = useMemo(
    () =>
      buildDailyFocusIntensityTrend30d({
        deepWorkState,
        pomodoroLogs,
        studyGuides,
        includePomodoroFocus: includePomodoro,
      }),
    [deepWorkState, pomodoroLogs, studyGuides, includePomodoro]
  );

  const primarySeriesKey = includeRestZeros
    ? 'dailyFocusIntensityZeroed'
    : 'dailyFocusIntensity';

  const dayWindows = trend.timeOfDayBreakdown.filter((w) => w.id !== 'late_night');

  return (
    <section
      aria-labelledby="focus-intensity-trend-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>30-Day Focus Intensity Telemetry</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono normal-case text-stone-500 dark:text-stone-400 font-medium">
              Peak Window: {trend.peakProductivityWindowLabel} (
              {trend.peakProductivityWindowRange})
            </span>
          </div>
          <h2
            id="focus-intensity-trend-heading"
            className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Daily Focus Intensity Score Trend (Last 30 Days)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl">
            Track daily cognitive focus intensity against your 7-day rolling baseline and High Focus (76+) benchmark to pinpoint peak study windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setIncludePomodoro(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                includePomodoro
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Deep Work + Pomodoro
            </button>
            <button
              type="button"
              onClick={() => setIncludePomodoro(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                !includePomodoro
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Deep Work Only
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIncludeRestZeros((v) => !v)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            {includeRestZeros ? 'Showing Rest Days (0)' : 'Connecting Active Days'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            30-Day Avg Intensity
          </div>
          <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {trend.avgIntensity30d}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              / 100
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            15-Day Momentum Delta
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono tabular-nums">
            <TrendingUp
              className={`w-4 h-4 ${
                trend.trendDelta >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <span
              className={`text-xl font-extrabold ${
                trend.trendDelta >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {trend.trendDelta >= 0 ? `+${trend.trendDelta}` : trend.trendDelta}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              pts
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Peak Intensity Day
          </div>
          <div className="mt-1 font-mono tabular-nums">
            <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {trend.peakDayScore}/100
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              {trend.peakDayLabel || 'No sessions yet'}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            Active Focus Days (30d)
          </div>
          <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400">
              {trend.activeDaysCount}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              / 30 days
            </span>
          </div>
        </div>
      </div>

      {/* Recharts 30-Day Line Chart */}
      <div className="h-[290px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trend.points}
            margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#78716c"
              strokeOpacity={0.2}
              vertical={false}
            />
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 11, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 76, 100]}
              tick={{ fontSize: 11, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <ReferenceLine
              y={76}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: 'High Focus (76)',
                position: 'insideTopRight',
                fill: '#d97706',
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey={primarySeriesKey}
              name="Daily Focus Intensity"
              stroke="#10b981"
              strokeWidth={2.5}
              connectNulls={!includeRestZeros}
              dot={{ r: 3, strokeWidth: 1.5, fill: '#10b981' }}
              activeDot={{ r: 5, strokeWidth: 2, fill: '#059669' }}
            />
            <Line
              type="monotone"
              dataKey="rolling7DayAvg"
              name="7-Day Rolling Baseline"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 4"
              connectNulls
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Productivity Time-of-Day Breakdown */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-900 dark:text-stone-100 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Peak Productivity Time Windows (30-Day Breakdown)</span>
          </span>
          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
            Highest efficiency: {trend.peakProductivityWindowRange}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {dayWindows.map((win) => {
            const Icon =
              win.id === 'morning'
                ? Sun
                : win.id === 'afternoon'
                ? Sunset
                : Moon;
            return (
              <div
                key={win.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  win.isPeak
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/25'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        win.isPeak
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-400'
                      }`}
                    />
                    <span>{win.label}</span>
                  </span>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                    {win.rangeLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono tabular-nums text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {win.avgIntensity > 0 ? `${win.avgIntensity}/100 avg` : 'No data'}
                  </span>
                  <span className="text-stone-600 dark:text-stone-400">
                    {win.totalHours}h · {win.sessionsCount} blocks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
