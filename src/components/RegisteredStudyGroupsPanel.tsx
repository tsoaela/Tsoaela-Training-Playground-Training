import React, { useEffect, useMemo, useState } from 'react';
import {
  Video,
  Plus,
  UserPlus,
  CheckCircle2,
  FileEdit,
  Flame,
  CalendarCheck2,
} from 'lucide-react';
import {
  RegisteredStudyGroup,
  StudyGuide,
  UserProfile,
} from '../types';
import {
  computeStudyGroupStreak,
  getLocalDateKey,
} from '../utils/studyGroupStreak';

export interface RegisteredStudyGroupsPanelProps {
  user: UserProfile;
  isAuthenticated: boolean;
  studyGuides: StudyGuide[];
  onRequireAuth: (action: () => void, message: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string, roomId?: string) => void;
}

interface EnrichedGroup extends RegisteredStudyGroup {
  activeCount?: number;
}

export const RegisteredStudyGroupsPanel: React.FC<RegisteredStudyGroupsPanelProps> = ({
  user,
  isAuthenticated,
  studyGuides,
  onRequireAuth,
  onStartStudyRoom,
}) => {
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [checkingInRoomId, setCheckingInRoomId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newCourseId, setNewCourseId] = useState(
    studyGuides[0]?.id || 'sg_ai_test_time_search'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userEmailLower = (user.email || 'scholar@ttg-platform.local').trim().toLowerCase();
  const todayKey = getLocalDateKey();

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/study-groups');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.groups)) {
        setGroups(data.groups);
      }
    } catch {
      // Ignore silent load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
  }, []);

  const streakOverview = useMemo(() => {
    if (groups.length === 0) {
      return { topStreak: 0, checkedInTodayCount: 0, totalCohortDays: 0 };
    }
    let topStreak = 0;
    let checkedInTodayCount = 0;
    let totalCohortDays = 0;
    for (const grp of groups) {
      const stats = computeStudyGroupStreak(grp, todayKey, 7);
      if (stats.currentStreak > topStreak) topStreak = stats.currentStreak;
      if (stats.attendedToday) checkedInTodayCount += 1;
      totalCohortDays += stats.totalActiveDays;
    }
    return { topStreak, checkedInTodayCount, totalCohortDays };
  }, [groups, todayKey]);

  const handleRegisterGroupMember = async (group: EnrichedGroup) => {
    onRequireAuth(async () => {
      setJoiningRoomId(group.id);
      try {
        const res = await fetch(
          `/api/study-groups/${encodeURIComponent(group.id)}/join`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberName: user.name || 'Academic Scholar',
              memberEmail: userEmailLower,
              dateKey: todayKey,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.group) {
            setGroups((prev) =>
              prev.map((g) => (g.id === group.id ? { ...g, ...data.group } : g))
            );
          }
        }
      } finally {
        setJoiningRoomId(null);
      }
    }, 'Sign in to register for a collaborative study group.');
  };

  const handleCheckInAttendance = async (group: EnrichedGroup) => {
    onRequireAuth(async () => {
      setCheckingInRoomId(group.id);
      try {
        const res = await fetch(
          `/api/study-groups/${encodeURIComponent(group.id)}/attendance`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberName: user.name || 'Academic Scholar',
              memberEmail: userEmailLower,
              dateKey: todayKey,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.group) {
            setGroups((prev) =>
              prev.map((g) => (g.id === group.id ? { ...g, ...data.group } : g))
            );
          }
        }
      } finally {
        setCheckingInRoomId(null);
      }
    }, 'Sign in to log daily study group attendance.');
  };

  const handleEnterStudyRoom = async (group: EnrichedGroup) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(
          `/api/study-groups/${encodeURIComponent(group.id)}/attendance`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberName: user.name || 'Academic Scholar',
              memberEmail: userEmailLower,
              dateKey: todayKey,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.group) {
            setGroups((prev) =>
              prev.map((g) => (g.id === group.id ? { ...g, ...data.group } : g))
            );
          }
        }
      } catch {
        // Non-blocking attendance update when entering room
      }
    }
    onStartStudyRoom?.(group.courseTitle, group.courseId, group.id);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const selectedCourse = studyGuides.find((g) => g.id === newCourseId) || studyGuides[0];
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          topic: newTopic.trim() || 'Shared Peer Study Session',
          courseId: selectedCourse?.id || newCourseId,
          courseTitle: selectedCourse?.title || 'Curriculum Course',
          hostName: user.name || 'Academic Scholar',
          hostEmail: userEmailLower,
          dateKey: todayKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.group) {
          setGroups((prev) => [data.group, ...prev]);
        }
        setNewName('');
        setNewTopic('');
        setIsCreating(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="registered-study-groups-heading"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <FileEdit className="w-3.5 h-3.5" />
            <span>Registered Study Groups · Real-Time Collaborative Notes &amp; Study Streaks</span>
          </div>
          <h3
            id="registered-study-groups-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Study Group Rooms &amp; Shared Notes
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Register in a study group cohort, build consecutive daily attendance streaks, and co-edit live synchronized Markdown notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onRequireAuth(() => {
              setIsCreating((prev) => !prev);
            }, 'Sign in to register a new collaborative study group.')
          }
          className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreating ? 'Close Form' : 'Register Study Group'}</span>
        </button>
      </div>

      {/* Study Streak Tracker Summary Strip */}
      {!loading && groups.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-xs">
          <div className="flex items-center gap-2 font-semibold text-stone-800 dark:text-stone-200">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
            <span>Cohort Study Streak Tracker</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-stone-600 dark:text-stone-400 font-mono tabular-nums">
            <span>
              Top Streak:{' '}
              <strong className="text-amber-600 dark:text-amber-400">
                {streakOverview.topStreak}d
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Active Today:{' '}
              <strong className="text-stone-900 dark:text-stone-100">
                {streakOverview.checkedInTodayCount}/{groups.length}
              </strong>{' '}
              groups
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Logged Days:{' '}
              <strong className="text-stone-900 dark:text-stone-100">
                {streakOverview.totalCohortDays}
              </strong>
            </span>
          </div>
        </div>
      )}

      {isCreating && (
        <form
          onSubmit={handleCreateGroup}
          className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Study Group Name
              </span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Evening Mechanism Design Circle"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Course Alignment
              </span>
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {studyGuides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Current Focus Topic
              </span>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Chapter 3 Problem Set Walkthrough"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isSubmitting ? 'Registering…' : 'Create & Register Room'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="h-44 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 animate-pulse"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
          No registered study groups found yet. Create the first study group above to start collaborating on shared notes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => {
            const isRegistered =
              isAuthenticated &&
              (grp.memberEmails.some((e) => e.toLowerCase() === userEmailLower) ||
                grp.hostEmail.toLowerCase() === userEmailLower);
            const streak = computeStudyGroupStreak(grp, todayKey, 7);

            return (
              <div
                key={grp.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="font-mono tabular-nums">
                      {grp.memberEmails.length} registered · {grp.activeCount || 0} active now
                    </span>
                    {isRegistered && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Registered</span>
                      </span>
                    )}
                  </div>

                  {/* Group Name with Inline Small Fire Icon & Study Streak */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {grp.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold shrink-0 ${
                          streak.currentStreak > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                        title={
                          streak.currentStreak > 0
                            ? `${streak.currentStreak}-day consecutive study group attendance streak (Best: ${streak.bestStreak}d)`
                            : 'No active consecutive streak yet — check in today to start a streak'
                        }
                      >
                        <Flame
                          className={`w-3.5 h-3.5 shrink-0 ${
                            streak.currentStreak > 0
                              ? 'text-amber-500 fill-amber-500/25'
                              : 'text-stone-400 dark:text-stone-600'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{streak.currentStreak}d</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
                    Course: {grp.courseTitle}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Topic: {grp.topic} · Host: {grp.hostName}
                  </p>
                </div>

                {/* 7-Day Study Streak Attendance Calendar Strip */}
                <div className="pt-2.5 border-t border-stone-200/70 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      7-Day Attendance Streak
                    </span>
                    <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      {streak.currentStreak > 0
                        ? `${streak.currentStreak}d current · Best ${streak.bestStreak}d`
                        : streak.isStreakAtRisk
                        ? 'Check in today to extend'
                        : `Best ${streak.bestStreak}d`}
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-7 gap-1.5"
                    role="group"
                    aria-label={`${grp.name} 7-day study attendance history`}
                  >
                    {streak.recentDays.map((day) => (
                      <div
                        key={day.dateKey}
                        title={`${day.fullLabel}: ${
                          day.isActive
                            ? `${day.attendeeCount} member${day.attendeeCount === 1 ? '' : 's'} attended`
                            : 'No attendance logged'
                        }`}
                        className={`flex flex-col items-center justify-center py-1 rounded-lg border text-[10px] font-mono tabular-nums transition-colors ${
                          day.isActive
                            ? 'border-amber-400/70 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                            : day.isToday
                            ? 'border-dashed border-stone-400 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                            : 'border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        <span className="leading-tight">{day.shortDay}</span>
                        <span className="text-[9px] opacity-80 leading-tight">
                          {day.isToday ? 'Now' : day.dayNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/70 dark:border-stone-800">
                  {!isRegistered && (
                    <button
                      type="button"
                      disabled={joiningRoomId === grp.id}
                      onClick={() => void handleRegisterGroupMember(grp)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{joiningRoomId === grp.id ? 'Joining…' : 'Register'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={streak.attendedToday || checkingInRoomId === grp.id}
                    onClick={() => void handleCheckInAttendance(grp)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      streak.attendedToday
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 cursor-pointer'
                    }`}
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>
                      {checkingInRoomId === grp.id
                        ? 'Logging…'
                        : streak.attendedToday
                        ? 'Checked In'
                        : 'Check In Today'}
                    </span>
                  </button>

                  {onStartStudyRoom && (
                    <button
                      type="button"
                      onClick={() => void handleEnterStudyRoom(grp)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Enter Room &amp; Shared Notes</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

