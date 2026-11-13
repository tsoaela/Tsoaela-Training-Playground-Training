import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'ttg_notifications';
const REGISTERED_COURSES_STORAGE_KEY = 'ttg_registered_courses';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_seed_1',
    type: 'assignment_graded',
    title: 'Assignment Graded: 94%',
    message: 'Dr. Evelyn Brand graded "Process-Supervised Verifier Rollout Lab" in Large Reasoning Models (LRMs) & Test-Time Search Compute.',
    courseId: 'sg_ai_test_time_search',
    courseTitle: 'Large Reasoning Models (LRMs) & Test-Time Search Compute',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    read: false,
    metadata: {
      score: 94,
      assignmentTitle: 'Process-Supervised Verifier Rollout Lab',
      feedback: 'Strong KV-cache rollback derivation and clean ablation bounds.',
    },
  },
  {
    id: 'notif_seed_2',
    type: 'chapter_added',
    title: 'New Chapter Published',
    message: 'Chapter "03. Operational Exercise: Root Cause Deconstruction" was updated in Foundations of First-Principles Systems Thinking.',
    courseId: 'sg_foundations_systems',
    courseTitle: 'Foundations of First-Principles Systems Thinking',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    read: false,
    metadata: {
      chapterTitle: '03. Operational Exercise: Root Cause Deconstruction',
    },
  },
];

export interface AssignmentGradedPayload {
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  score: number;
  feedback?: string;
  studentName?: string;
  force?: boolean;
}

export interface NewChapterPayload {
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  force?: boolean;
}

export interface StudyGroupInitiatedPayload {
  courseId: string;
  courseTitle: string;
  hostName: string;
  topic?: string;
  force?: boolean;
}

export function useNotifications(initialCourseIds: string[] = [
  'sg_foundations_systems',
  'sg_ai_test_time_search',
  'sg_ai_swarm_consensus',
  'sg_long_term_leadership',
]) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [registeredCourseIds, setRegisteredCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(REGISTERED_COURSES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialCourseIds;
    } catch {
      return initialCourseIds;
    }
  });

  const [activeAlert, setActiveAlert] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTERED_COURSES_STORAGE_KEY, JSON.stringify(registeredCourseIds));
    } catch (e) {
      console.error(e);
    }
  }, [registeredCourseIds]);

  const registerCourse = useCallback((courseId: string) => {
    setRegisteredCourseIds(prev => (prev.includes(courseId) ? prev : [...prev, courseId]));
  }, []);

  const isRegisteredForCourse = useCallback(
    (courseId: string) => registeredCourseIds.includes(courseId),
    [registeredCourseIds]
  );

  const pushNotification = useCallback((item: AppNotification) => {
    setNotifications(prev => [item, ...prev].slice(0, 50));
    setActiveAlert(item);
  }, []);

  // Auto-dismiss live alert banner after 6 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(prev => (prev?.id === activeAlert.id ? null : prev));
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  const notifyAssignmentGraded = useCallback(
    ({ courseId, courseTitle, assignmentTitle, score, feedback, studentName, force }: AssignmentGradedPayload) => {
      if (!force && !registeredCourseIds.includes(courseId)) return false;

      const notif: AppNotification = {
        id: `notif_grade_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'assignment_graded',
        title: `Assignment Graded: ${score}%`,
        message: `${studentName ? `${studentName}: ` : ''}"${assignmentTitle}" in ${courseTitle} has been graded (${score}%).${feedback ? ` Feedback: ${feedback}` : ''}`,
        courseId,
        courseTitle,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: { score, assignmentTitle, feedback },
      };

      pushNotification(notif);
      return true;
    },
    [registeredCourseIds, pushNotification]
  );

  const notifyNewChapterAdded = useCallback(
    ({ courseId, courseTitle, chapterTitle, force }: NewChapterPayload) => {
      if (!force && !registeredCourseIds.includes(courseId)) return false;

      const notif: AppNotification = {
        id: `notif_chapter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'chapter_added',
        title: 'New Course Chapter Added',
        message: `"${chapterTitle}" has been added to ${courseTitle}.`,
        courseId,
        courseTitle,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: { chapterTitle },
      };

      pushNotification(notif);
      return true;
    },
    [registeredCourseIds, pushNotification]
  );

  const notifyStudyGroupInitiated = useCallback(
    ({ courseId, courseTitle, hostName, topic, force }: StudyGroupInitiatedPayload) => {
      if (!force && !registeredCourseIds.includes(courseId)) return false;

      const notif: AppNotification = {
        id: `notif_room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'study_group_started',
        title: 'Live Study Group Initiated',
        message: `${hostName} opened a WebRTC Study Group session for ${courseTitle}${topic ? ` (${topic})` : ''}.`,
        courseId,
        courseTitle,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: { hostName, topic },
      };

      pushNotification(notif);
      return true;
    },
    [registeredCourseIds, pushNotification]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissActiveAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    registeredCourseIds,
    isRegisteredForCourse,
    registerCourse,
    notifyAssignmentGraded,
    notifyNewChapterAdded,
    notifyStudyGroupInitiated,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    activeAlert,
    dismissActiveAlert,
  };
}
