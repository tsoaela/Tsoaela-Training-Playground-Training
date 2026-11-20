import { useState, useEffect, useCallback } from 'react';
import { AcceptedRegisteredStudent, StudentAdmissionStatus } from '../types';

const STORAGE_KEY = 'ttg_accepted_students_cache_v1';

export type AddAcceptedStudentPayload = Omit<
  AcceptedRegisteredStudent,
  'id' | 'registrationNumber'
> & {
  id?: string;
  registrationNumber?: string;
};

export function useAcceptedStudents() {
  const [students, setStudents] = useState<AcceptedRegisteredStudent[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? (JSON.parse(cached) as AcceptedRegisteredStudent[]) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const persistCache = useCallback((list: AcceptedRegisteredStudent[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore quota limits
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accepted-students');
      if (!res.ok) throw new Error('Unable to load accepted & registered students.');
      const data = (await res.json()) as { students?: AcceptedRegisteredStudent[] };
      if (Array.isArray(data.students)) {
        setStudents(data.students);
        persistCache(data.students);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to sync accepted students roster.');
    } finally {
      setIsLoading(false);
    }
  }, [persistCache]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addStudent = useCallback(
    async (payload: AddAcceptedStudentPayload): Promise<AcceptedRegisteredStudent | null> => {
      try {
        const res = await fetch('/api/accepted-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save accepted student.');
        const data = (await res.json()) as { student?: AcceptedRegisteredStudent };
        if (data.student) {
          setStudents((prev) => {
            const existsIdx = prev.findIndex((s) => s.id === data.student!.id);
            const next =
              existsIdx >= 0
                ? prev.map((s, i) => (i === existsIdx ? data.student! : s))
                : [data.student!, ...prev];
            persistCache(next);
            return next;
          });
          return data.student;
        }
        return null;
      } catch {
        // Optimistic local persistence fallback when offline
        const todayIso = new Date().toISOString().slice(0, 10);
        const fallbackRecord: AcceptedRegisteredStudent = {
          id: payload.id || `stu_local_${Date.now()}`,
          registrationNumber:
            payload.registrationNumber ||
            `TTG-REG-2026-${Math.floor(100000 + Math.random() * 899999)}`,
          studentName: payload.studentName.trim(),
          studentEmail: payload.studentEmail.trim(),
          admissionStatus: payload.admissionStatus,
          facultyId: payload.facultyId,
          facultyName: payload.facultyName,
          departmentName: payload.departmentName,
          programName: payload.programName,
          qualificationLevel: payload.qualificationLevel,
          assignedCourseId: payload.assignedCourseId,
          assignedCourseTitle: payload.assignedCourseTitle,
          leadLecturerName: payload.leadLecturerName,
          cohortTerm: payload.cohortTerm || '2026 Academic Cohort',
          acceptedDate: payload.acceptedDate || todayIso,
          registeredDate:
            payload.admissionStatus === 'Accepted'
              ? undefined
              : payload.registeredDate || todayIso,
          accreditor: payload.accreditor,
          standingNotes: payload.standingNotes,
        };
        setStudents((prev) => {
          const next = [fallbackRecord, ...prev];
          persistCache(next);
          return next;
        });
        return fallbackRecord;
      }
    },
    [persistCache]
  );

  const updateStudentStatus = useCallback(
    async (
      id: string,
      admissionStatus: StudentAdmissionStatus,
      extra?: {
        assignedCourseId?: string;
        assignedCourseTitle?: string;
        leadLecturerName?: string;
        standingNotes?: string;
      }
    ): Promise<AcceptedRegisteredStudent | null> => {
      try {
        const res = await fetch(`/api/accepted-students/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admissionStatus, ...extra }),
        });
        if (!res.ok) throw new Error('Failed to update status.');
        const data = (await res.json()) as { student?: AcceptedRegisteredStudent };
        if (data.student) {
          setStudents((prev) => {
            const next = prev.map((s) => (s.id === id ? data.student! : s));
            persistCache(next);
            return next;
          });
          return data.student;
        }
        return null;
      } catch {
        const todayIso = new Date().toISOString().slice(0, 10);
        let updatedLocal: AcceptedRegisteredStudent | null = null;
        setStudents((prev) => {
          const next = prev.map((s) => {
            if (s.id !== id) return s;
            updatedLocal = {
              ...s,
              admissionStatus,
              registeredDate:
                admissionStatus === 'Accepted'
                  ? s.registeredDate
                  : s.registeredDate || todayIso,
              ...extra,
            };
            return updatedLocal;
          });
          persistCache(next);
          return next;
        });
        return updatedLocal;
      }
    },
    [persistCache]
  );

  return {
    students,
    isLoading,
    error,
    addStudent,
    updateStudentStatus,
    refresh,
  };
}
