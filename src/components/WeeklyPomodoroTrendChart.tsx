import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Calendar, Clock, Flame, Timer } from 'lucide-react';
import { PomodoroSessionLog } from '../types';

interface WeeklyPomodoroTrendChartProps {
  pomodoroLogs: PomodoroSessionLog[];
  syncedFocusMinutes?: number;
  dailyGoalHours?: number;
  onChangeDailyGoalHours?: (hours: number) => void;
}

interface DailyPomodoroPoint {
  dateKey: string;
  dayLabel: string;
  fullDateLabel: string;
  pomodoroHours: number;
  pomodoroMinutes: number;
  sessionsCount: number;
  consistencyTargetHours: number;
  rollingAvgHours: number;
}

function toLocalDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const WeeklyPomodoroTrendChart: React.FC<WeeklyPomodoroTrendChartProps> = ({
  pomodoroLogs = [],
  syncedFocusMinutes = 0,
  dailyGoalHours: controlledGoalHours,
  onChangeDailyGoalHours,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [localDailyGoalHours, setLocalDailyGoalHours] = useState<number>(1.0);
  const dailyGoalHours = controlledGoalHours ?? localDailyGoalHours;
  const setDailyGoalHours = (hours: number) => {
    setLocalDailyGoalHours(hours);
    onChangeDailyGoalHours?.(hours);
  };

  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayKey = toLocalDateKey(todayStart);

    // Aggregate logged Pomodoro focus sessions by YYYY-MM-DD
    const focusLogs = pomodoroLogs.filter((log) => log.phase === 'focus');
    const minutesByDate = new Map<string, number>();
    const countByDate = new Map<string, number>();

    for (const log of focusLogs) {
      const dt = new Date(log.completedAt);
      if (Number.isNaN(dt.getTime())) continue;
      const key = toLocalDateKey(dt);
      minutesByDate.set(key, (minutesByDate.get(key) || 0) + (log.durationMinutes || 0));
      countByDate.set(key, (countByDate.get(key) || 0) + 1);
    }

    // Reconcile unsourced syncedFocusMinutes into today's bucket if total logged mins < syncedFocusMinutes
    const totalLoggedFocusMins = focusLogs.reduce(
      (sum, l) => sum + (l.durationMinutes || 0),
      0
    );
    const unsourcedMins = Math.max(0, syncedFocusMinutes - totalLoggedFocusMins);
    if (unsourcedMins > 0) {
      minutesByDate.set(todayKey, (minutesByDate.get(todayKey) || 0) + unsourcedMins);
      countByDate.set(todayKey, (countByDate.get(todayKey) || 0) + 1);
    }

    // Build rolling 7-day daily sequence (6 days ago -> today)
    const rawDays: Omit<DailyPomodoroPoint, 'rollingAvgHours'>[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() - offset);
      const key = toLocalDateKey(d);
      const mins = minutesByDate.get(key) || 0;
      const hours = parseFloat((mins / 60).toFixed(2));
      const sessions = countByDate.get(key) || 0;

      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateShort = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      rawDays.push({
        dateKey: key,
        dayLabel: offset === 0 ? `${dayShort} (Today)` : dayShort,
        fullDateLabel: `${dayShort}, ${dateShort}`,
        pomodoroMinutes: mins,
        pomodoroHours: hours,
        sessionsCount: sessions,
        consistencyTargetHours: dailyGoalHours,
      });
    }

    // Add 3-day moving consistency average
    const points: DailyPomodoroPoint[] = rawDays.map((day, idx) => {
      const start = Math.max(0, idx - 2);
      const slice = rawDays.slice(start, idx + 1);
      const avg =
        slice.reduce((sum, entry) => sum + entry.pomodoroHours, 0) / slice.length;
      return {
        ...day,
        rollingAvgHours: parseFloat(avg.toFixed(2)),
      };
    });

    const totalWeekHours = parseFloat(
      points.reduce((sum, p) => sum + p.pomodoroHours, 0).toFixed(2)
    );
    const totalWeekMinutes = points.reduce((sum, p) => sum + p.pomodoroMinutes, 0);
    const activeStudyDays = points.filter((p) => p.pomodoroMinutes > 0).length;
    const avgDailyHours = parseFloat((totalWeekHours / 7).toFixed(2));
    const peakDay = points.reduce(
      (best, curr) => (curr.pomodoroHours > best.pomodoroHours ? curr : best),
      points[0]
    );
    const goalMetDays = points.filter(
      (p) => p.pomodoroHours >= dailyGoalHours
    ).length;

    return {
      points,
      totalWeekHours,
      totalWeekMinutes,
      activeStudyDays,
      avgDailyHours,
      peakDay,
      goalMetDays,
    };
  }, [pomodoroLogs, syncedFocusMinutes, dailyGoalHours]);

  return (
    <section
      aria-labelledby="weekly-pomodoro-trend-heading"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
            <Timer className="w-3.5 h-3.5" />
            <span>7-Day Consistency Telemetry</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Daily Pomodoro Hours</span>
          </div>
          <h3
            id="weekly-pomodoro-trend-heading"
            className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100"
          >
            Weekly Pomodoro Study Hours &amp; Consistency Trend
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Plots your daily logged Pomodoro focus hours over the past 7 days alongside your rolling 3-day consistency trend and daily goal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-auto">
          {/* Daily Goal Target Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <span className="px-2 text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
              Goal:
            </span>
            {[0.5, 1.0, 2.0].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setDailyGoalHours(goal)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  dailyGoalHours === goal
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {goal.toFixed(1)}h
              </button>
            ))}
          </div>

          {/* Series Visualization Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'area'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Trend Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Daily Bars
            </button>
          </div>
        </div>
      </div>

      {/* Consistency KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>7-Day Pomodoro Total</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {weeklyTrend.totalWeekHours.toFixed(2)}h
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
            {weeklyTrend.totalWeekMinutes} focus min synced
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Active Consistency</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {weeklyTrend.activeStudyDays}/7 Days
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
            {weeklyTrend.goalMetDays} day{weeklyTrend.goalMetDays === 1 ? '' : 's'} ≥ {dailyGoalHours.toFixed(1)}h target
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Timer className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Daily Average</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {weeklyTrend.avgDailyHours.toFixed(2)}h
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
            Per day across 7-day window
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Peak Focus Day</span>
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
            {weeklyTrend.peakDay.pomodoroHours > 0
              ? `${weeklyTrend.peakDay.pomodoroHours.toFixed(2)}h`
              : '0.00h'}
          </div>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
            {weeklyTrend.peakDay.pomodoroHours > 0
              ? weeklyTrend.peakDay.fullDateLabel
              : 'Start Pomodoro timer to log'}
          </span>
        </div>
      </div>

      {/* Recharts Daily Trend Graph */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={weeklyTrend.points}
            margin={{ top: 12, right: 12, left: -14, bottom: 4 }}
          >
            <defs>
              <linearGradient id="pomodoroDailyAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="h"
              domain={[0, (dataMax: number) => Math.max(dailyGoalHours + 0.5, Math.ceil((dataMax + 0.25) * 2) / 2)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1917',
                borderColor: '#292524',
                borderRadius: '0.75rem',
                color: '#fafaf9',
                fontSize: '12px',
              }}
              labelFormatter={(_, payload) => {
                const pt = payload?.[0]?.payload as DailyPomodoroPoint | undefined;
                return pt
                  ? `${pt.fullDateLabel} · ${pt.sessionsCount} session${pt.sessionsCount === 1 ? '' : 's'} (${pt.pomodoroMinutes}m)`
                  : 'Daily Focus';
              }}
              formatter={(value: unknown, name: unknown) => [
                `${Number(value).toFixed(2)} hrs`,
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            {chartType === 'area' ? (
              <Area
                type="monotone"
                dataKey="pomodoroHours"
                name="Daily Pomodoro Study Hours"
                stroke="#d97706"
                strokeWidth={2.5}
                fill="url(#pomodoroDailyAreaFill)"
                dot={{ r: 4, fill: '#d97706', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            ) : (
              <Bar
                dataKey="pomodoroHours"
                name="Daily Pomodoro Study Hours"
                fill="#d97706"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            )}

            <Line
              type="monotone"
              dataKey="rollingAvgHours"
              name="3-Day Rolling Consistency"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981' }}
            />

            <Line
              type="monotone"
              dataKey="consistencyTargetHours"
              name={`Daily Target (${dailyGoalHours.toFixed(1)}h)`}
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
