import {
  AcceptedRegisteredStudent,
  EnrolledStudentRecord,
  StudyGuide,
  UserProfile,
} from '../types';

export interface FocusBuddyStudentProfile {
  id: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  facultyName: string;
  weeklyStudyHours: number;
  focusIntensityScore: number;
  preferredWindow: string;
  isCurrentUser: boolean;
}

export interface FocusBuddyPairSuggestion {
  pairId: string;
  courseId: string;
  courseTitle: string;
  facultyName: string;
  studentA: FocusBuddyStudentProfile;
  studentB: FocusBuddyStudentProfile;
  hourDifference: number;
  similarityPercent: number;
  combinedWeeklyHours: number;
  recommendedSessionMinutes: number;
  sharedWindow: string;
  includesCurrentUser: boolean;
  collaborationReason: string;
}

const STUDY_WINDOWS = [
  '09:00 – 11:00 Morning Block',
  '14:00 – 16:00 Afternoon Lab',
  '19:00 – 21:00 Evening Flow',
];

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function resolveGuideForEnrollment(
  courseId: string | undefined,
  courseTitle: string | undefined,
  studyGuides: StudyGuide[]
): StudyGuide | undefined {
  if (!studyGuides.length) return undefined;
  const byId = courseId
    ? studyGuides.find((g) => g.id === courseId)
    : undefined;
  if (byId) return byId;

  if (courseTitle) {
    const titleLower = courseTitle.trim().toLowerCase();
    const exact = studyGuides.find(
      (g) => g.title.trim().toLowerCase() === titleLower
    );
    if (exact) return exact;
    const partial = studyGuides.find(
      (g) =>
        titleLower.includes(g.title.trim().toLowerCase().slice(0, 14)) ||
        g.title.trim().toLowerCase().includes(titleLower.slice(0, 14))
    );
    if (partial) return partial;
  }
  return undefined;
}

export function buildFocusBuddySuggestions(params: {
  user: UserProfile;
  userWeeklyMinutes: number;
  userFocusIntensityScore?: number;
  studyGuides: StudyGuide[];
  enrollments?: EnrolledStudentRecord[];
  acceptedStudents?: AcceptedRegisteredStudent[];
  activeCourseId?: string;
}): {
  courses: Array<{ id: string; title: string; pairCount: number }>;
  pairs: FocusBuddyPairSuggestion[];
  personalBestPair: FocusBuddyPairSuggestion | null;
} {
  const {
    user,
    userWeeklyMinutes,
    userFocusIntensityScore = 82,
    studyGuides,
    enrollments = [],
    acceptedStudents = [],
    activeCourseId,
  } = params;

  const userEmailLower = (user.email || '').trim().toLowerCase();
  const userNameLower = (user.name || '').trim().toLowerCase();
  const userWeeklyHours = parseFloat(
    Math.max(1.5, userWeeklyMinutes / 60).toFixed(1)
  );

  // Group candidate students by resolved studyGuide.id
  const courseRosterMap = new Map<
    string,
    {
      courseId: string;
      courseTitle: string;
      facultyName: string;
      students: Map<string, FocusBuddyStudentProfile>;
    }
  >();

  const ensureCourseBucket = (guide: StudyGuide) => {
    let bucket = courseRosterMap.get(guide.id);
    if (!bucket) {
      bucket = {
        courseId: guide.id,
        courseTitle: guide.title,
        facultyName: guide.category,
        students: new Map(),
      };
      courseRosterMap.set(guide.id, bucket);
    }
    return bucket;
  };

  studyGuides.slice(0, 6).forEach((g) => ensureCourseBucket(g));

  // 1. Add enrolled students mapped to their course
  enrollments.forEach((rec) => {
    const matchedGuide = resolveGuideForEnrollment(
      rec.courseId,
      rec.courseTitle,
      studyGuides
    );
    if (!matchedGuide) return;
    const bucket = ensureCourseBucket(matchedGuide);
    const emailKey = rec.studentEmail.trim().toLowerCase();
    const isSelf =
      emailKey === userEmailLower ||
      rec.studentName.trim().toLowerCase() === userNameLower;

    const h = hashSeed(`${rec.studentEmail}_${matchedGuide.id}`);
    const baseHours = isSelf
      ? userWeeklyHours
      : parseFloat(
          Math.max(
            2.2,
            Math.min(
              14.5,
              userWeeklyHours + (((h % 25) - 12) * 0.25)
            )
          ).toFixed(1)
        );

    bucket.students.set(emailKey, {
      id: rec.id,
      studentName: isSelf ? user.name : rec.studentName,
      studentEmail: rec.studentEmail,
      courseId: matchedGuide.id,
      courseTitle: matchedGuide.title,
      facultyName: rec.facultyName || matchedGuide.category,
      weeklyStudyHours: baseHours,
      focusIntensityScore: isSelf
        ? userFocusIntensityScore
        : 72 + (h % 23),
      preferredWindow: STUDY_WINDOWS[h % STUDY_WINDOWS.length],
      isCurrentUser: isSelf,
    });
  });

  // 2. Add accepted/registered cohort students
  acceptedStudents.forEach((stu, idx) => {
    const matchedGuide =
      resolveGuideForEnrollment(
        stu.assignedCourseId,
        stu.assignedCourseTitle,
        studyGuides
      ) || studyGuides[idx % Math.max(1, Math.min(4, studyGuides.length))];
    if (!matchedGuide) return;

    const bucket = ensureCourseBucket(matchedGuide);
    const emailKey = stu.studentEmail.trim().toLowerCase();
    const isSelf =
      emailKey === userEmailLower ||
      stu.studentName.trim().toLowerCase() === userNameLower;

    if (!bucket.students.has(emailKey)) {
      const h = hashSeed(`${stu.studentEmail}_${matchedGuide.id}`);
      const estHours = isSelf
        ? userWeeklyHours
        : parseFloat(
            Math.max(
              2.0,
              Math.min(13.5, userWeeklyHours + (((h % 19) - 9) * 0.3))
            ).toFixed(1)
          );

      bucket.students.set(emailKey, {
        id: stu.id,
        studentName: isSelf ? user.name : stu.studentName,
        studentEmail: stu.studentEmail,
        courseId: matchedGuide.id,
        courseTitle: matchedGuide.title,
        facultyName: stu.facultyName || matchedGuide.category,
        weeklyStudyHours: estHours,
        focusIntensityScore: isSelf
          ? userFocusIntensityScore
          : 74 + (h % 22),
        preferredWindow: STUDY_WINDOWS[h % STUDY_WINDOWS.length],
        isCurrentUser: isSelf,
      });
    }
  });

  // 3. Ensure active learner is enrolled in primary courses & ensure fallback cohort peers if sparse
  const fallbackCohort = [
    { name: 'Thabo Mokoena', email: 'thabo.mokoena@ttg.edu' },
    { name: 'Naledi Khumalo', email: 'naledi.khumalo@ttg.edu' },
    { name: 'Sipho Dlamini', email: 'sipho.dlamini@ttg.edu' },
    { name: 'Amina Patel', email: 'amina.patel@ttg.edu' },
    { name: 'Lerato Ndlovu', email: 'lerato.ndlovu@ttg.edu' },
    { name: 'Kagiso Molefe', email: 'kagiso.molefe@ttg.edu' },
  ];

  const targetActiveCourse =
    studyGuides.find((g) => g.id === activeCourseId) || studyGuides[0];

  courseRosterMap.forEach((bucket, cIdxKey) => {
    const isPrimaryUserCourse =
      targetActiveCourse && bucket.courseId === targetActiveCourse.id;
    if (isPrimaryUserCourse && !bucket.students.has(userEmailLower)) {
      bucket.students.set(userEmailLower, {
        id: `self_${user.id}_${bucket.courseId}`,
        studentName: user.name,
        studentEmail: user.email,
        courseId: bucket.courseId,
        courseTitle: bucket.courseTitle,
        facultyName: bucket.facultyName,
        weeklyStudyHours: userWeeklyHours,
        focusIntensityScore: userFocusIntensityScore,
        preferredWindow: STUDY_WINDOWS[0],
        isCurrentUser: true,
      });
    }

    let cohortOffset = hashSeed(cIdxKey) % fallbackCohort.length;
    let safety = 0;
    while (bucket.students.size < 3 && safety < fallbackCohort.length) {
      const cand = fallbackCohort[cohortOffset % fallbackCohort.length];
      cohortOffset += 1;
      safety += 1;
      const emailKey = cand.email.toLowerCase();
      if (bucket.students.has(emailKey) || emailKey === userEmailLower) continue;

      const h = hashSeed(`${cand.email}_${bucket.courseId}`);
      const delta = ((h % 9) - 4) * 0.25;
      const peerHours = parseFloat(
        Math.max(1.8, Math.min(14.0, userWeeklyHours + delta)).toFixed(1)
      );

      bucket.students.set(emailKey, {
        id: `buddy_peer_${bucket.courseId}_${safety}`,
        studentName: cand.name,
        studentEmail: cand.email,
        courseId: bucket.courseId,
        courseTitle: bucket.courseTitle,
        facultyName: bucket.facultyName,
        weeklyStudyHours: peerHours,
        focusIntensityScore: 76 + (h % 20),
        preferredWindow: STUDY_WINDOWS[h % STUDY_WINDOWS.length],
        isCurrentUser: false,
      });
    }
  });

  // 4. Form best same-course 2-student pairs ranked by closest weeklyStudyHours
  const pairs: FocusBuddyPairSuggestion[] = [];

  courseRosterMap.forEach((bucket) => {
    const list = Array.from(bucket.students.values());
    if (list.length < 2) return;

    const candidates: FocusBuddyPairSuggestion[] = [];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const rawA = list[i];
        const rawB = list[j];
        // Put current user first if included
        const [studentA, studentB] = rawB.isCurrentUser
          ? [rawB, rawA]
          : [rawA, rawB];

        const hourDifference = parseFloat(
          Math.abs(studentA.weeklyStudyHours - studentB.weeklyStudyHours).toFixed(1)
        );
        const similarityPercent = Math.max(
          55,
          Math.min(99, Math.round(100 - hourDifference * 11))
        );
        const includesCurrentUser =
          studentA.isCurrentUser || studentB.isCurrentUser;

        const sharedWindow =
          studentA.preferredWindow === studentB.preferredWindow
            ? studentA.preferredWindow
            : studentA.preferredWindow;

        const avgWeekly = (studentA.weeklyStudyHours + studentB.weeklyStudyHours) / 2;
        const recommendedSessionMinutes = avgWeekly >= 6 ? 90 : 50;

        candidates.push({
          pairId: `pair_${bucket.courseId}_${studentA.id}_${studentB.id}`,
          courseId: bucket.courseId,
          courseTitle: bucket.courseTitle,
          facultyName: bucket.facultyName,
          studentA,
          studentB,
          hourDifference,
          similarityPercent,
          combinedWeeklyHours: parseFloat(
            (studentA.weeklyStudyHours + studentB.weeklyStudyHours).toFixed(1)
          ),
          recommendedSessionMinutes,
          sharedWindow,
          includesCurrentUser,
          collaborationReason:
            hourDifference <= 0.6
              ? `Near-identical study cadence (${hourDifference.toFixed(1)}h/wk gap) in ${bucket.courseTitle}`
              : `Aligned weekly study pace (${studentA.weeklyStudyHours}h vs ${studentB.weeklyStudyHours}h) in ${bucket.courseTitle}`,
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.includesCurrentUser !== b.includesCurrentUser) {
        return a.includesCurrentUser ? -1 : 1;
      }
      if (a.hourDifference !== b.hourDifference) {
        return a.hourDifference - b.hourDifference;
      }
      return b.similarityPercent - a.similarityPercent;
    });

    // Keep top 2 pairs per course so the dashboard stays focused and diverse
    candidates.slice(0, 2).forEach((p) => pairs.push(p));
  });

  pairs.sort((a, b) => {
    if (a.includesCurrentUser !== b.includesCurrentUser) {
      return a.includesCurrentUser ? -1 : 1;
    }
    if (a.hourDifference !== b.hourDifference) {
      return a.hourDifference - b.hourDifference;
    }
    return b.similarityPercent - a.similarityPercent;
  });

  const personalBestPair = pairs.find((p) => p.includesCurrentUser) || pairs[0] || null;

  const coursesMap = new Map<string, { id: string; title: string; pairCount: number }>();
  pairs.forEach((p) => {
    const existing = coursesMap.get(p.courseId);
    if (existing) {
      existing.pairCount += 1;
    } else {
      coursesMap.set(p.courseId, {
        id: p.courseId,
        title: p.courseTitle,
        pairCount: 1,
      });
    }
  });

  return {
    courses: Array.from(coursesMap.values()),
    pairs,
    personalBestPair,
  };
}
