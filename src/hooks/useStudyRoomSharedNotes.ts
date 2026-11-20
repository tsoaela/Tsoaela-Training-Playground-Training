import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RegisteredStudyGroup,
  StudyRoomActiveParticipant,
  StudyRoomSharedNote,
  UserProfile,
} from '../types';

interface UseStudyRoomSharedNotesParams {
  isOpen: boolean;
  roomId: string;
  courseId: string;
  courseTitle: string;
  user: UserProfile;
}

export type SharedNotesConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export function useStudyRoomSharedNotes({
  isOpen,
  roomId,
  courseId,
  courseTitle,
  user,
}: UseStudyRoomSharedNotesParams) {
  const [group, setGroup] = useState<RegisteredStudyGroup | null>(null);
  const [note, setNote] = useState<StudyRoomSharedNote | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftContent, setDraftContent] = useState<string>('');
  const [participants, setParticipants] = useState<StudyRoomActiveParticipant[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<SharedNotesConnectionStatus>('disconnected');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState<boolean>(false);

  const clientIdRef = useRef<string>(
    `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const wsRef = useRef<WebSocket | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const pendingEditRef = useRef<{ title: string; content: string } | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const latestNoteVersionRef = useRef<number>(0);

  const userEmailLower = (user.email || 'scholar@ttg-platform.local').trim().toLowerCase();
  const isMemberRegistered = Boolean(
    group &&
      (group.memberEmails.some((e) => e.toLowerCase() === userEmailLower) ||
        group.hostEmail.toLowerCase() === userEmailLower)
  );

  const flushEditToServer = useCallback(
    async (title: string, content: string, isTyping = false) => {
      const targetRoomId = group?.id || roomId;
      const ws = wsRef.current;

      if (ws && ws.readyState === WebSocket.OPEN) {
        setIsSaving(true);
        ws.send(
          JSON.stringify({
            type: 'notes:update',
            roomId: targetRoomId,
            courseId,
            courseTitle,
            title,
            content,
            clientId: clientIdRef.current,
            userName: user.name || 'Academic Scholar',
            userEmail: userEmailLower,
            isTyping,
          })
        );
        pendingEditRef.current = null;
        return;
      }

      // Buffer locally while offline/reconnecting and attempt HTTP persistence
      pendingEditRef.current = { title, content };
      try {
        setIsSaving(true);
        const res = await fetch(
          `/api/study-rooms/${encodeURIComponent(targetRoomId)}/notes`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId,
              courseTitle,
              title,
              content,
              clientId: clientIdRef.current,
              editedBy: user.name || 'Academic Scholar',
              editedByEmail: userEmailLower,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.note) {
            setNote(data.note);
            latestNoteVersionRef.current = data.note.version;
            setLastSyncedAt(data.note.lastEditedAt);
          }
          if (data.group) setGroup(data.group);
          pendingEditRef.current = null;
        }
      } catch {
        // Retain pendingEditRef for next WebSocket reconnect flush
      } finally {
        setIsSaving(false);
      }
    },
    [group?.id, roomId, courseId, courseTitle, user.name, userEmailLower]
  );

  // Connect WebSocket to /ws/study-rooms and auto-reconnect if dropped
  useEffect(() => {
    if (!isOpen || !roomId) {
      setConnectionStatus('disconnected');
      return;
    }

    let isDisposed = false;
    let reconnectAttempt = 0;

    const applyIncomingNote = (incoming: StudyRoomSharedNote, sourceClientId?: string | null) => {
      setNote(incoming);
      latestNoteVersionRef.current = incoming.version;
      setLastSyncedAt(incoming.lastEditedAt);
      setIsSaving(false);

      // Guard against overwriting active local typing from our own echo
      if (sourceClientId && sourceClientId === clientIdRef.current) {
        return;
      }

      isRemoteUpdateRef.current = true;
      setDraftTitle(incoming.title);
      setDraftContent(incoming.content);
      window.setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 0);
    };

    const hydrateInitialViaHttp = async () => {
      try {
        const res = await fetch(
          `/api/study-rooms/${encodeURIComponent(roomId)}/notes?courseId=${encodeURIComponent(
            courseId
          )}&courseTitle=${encodeURIComponent(courseTitle)}`
        );
        if (!res.ok || isDisposed) return;
        const data = await res.json();
        if (data.group) setGroup(data.group);
        if (data.note && !pendingEditRef.current) {
          applyIncomingNote(data.note, null);
        }
        if (Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
      } catch {
        // WebSocket init will still populate
      }
    };

    void hydrateInitialViaHttp();

    const connectSocket = () => {
      if (isDisposed) return;
      setConnectionStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/study-rooms`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isDisposed) {
          ws.close();
          return;
        }
        reconnectAttempt = 0;
        setConnectionStatus('connected');

        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomId,
            courseId,
            courseTitle,
            userId: user.id || 'user_88219',
            userName: user.name || 'Academic Scholar',
            userEmail: userEmailLower,
            clientId: clientIdRef.current,
          })
        );

        // Flush any buffered offline edits upon reconnection
        if (pendingEditRef.current) {
          const buffered = pendingEditRef.current;
          pendingEditRef.current = null;
          window.setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'notes:update',
                  roomId,
                  courseId,
                  courseTitle,
                  title: buffered.title,
                  content: buffered.content,
                  clientId: clientIdRef.current,
                  userName: user.name || 'Academic Scholar',
                  userEmail: userEmailLower,
                  isTyping: false,
                })
              );
            }
          }, 120);
        }
      };

      ws.onmessage = (event) => {
        if (isDisposed) return;
        try {
          const payload = JSON.parse(event.data);
          if (!payload || typeof payload !== 'object') return;

          if (payload.type === 'room:init') {
            if (payload.group) setGroup(payload.group);
            if (Array.isArray(payload.participants)) setParticipants(payload.participants);
            if (payload.note && !pendingEditRef.current) {
              applyIncomingNote(payload.note, null);
            }
            return;
          }

          if (payload.type === 'notes:synced' && payload.note) {
            if (payload.roomId === (group?.id || roomId) || payload.roomId === roomId) {
              applyIncomingNote(payload.note, payload.sourceClientId);
            }
            return;
          }

          if (payload.type === 'presence:state' && Array.isArray(payload.participants)) {
            setParticipants(payload.participants);
            return;
          }

          if (payload.type === 'group:updated' && payload.group) {
            setGroup(payload.group);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        if (isDisposed) return;
        setConnectionStatus('reconnecting');
        const delayMs = Math.min(8000, 1000 * Math.pow(1.6, reconnectAttempt));
        reconnectAttempt += 1;
        reconnectTimerRef.current = window.setTimeout(connectSocket, delayMs);
      };

      ws.onerror = () => {
        // onclose handles reconnection cleanly
      };
    };

    connectSocket();

    return () => {
      isDisposed = true;
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'room:leave', roomId }));
          }
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [isOpen, roomId, courseId, courseTitle, user.id, user.name, userEmailLower]);

  const scheduleSync = useCallback(
    (nextTitle: string, nextContent: string) => {
      if (isRemoteUpdateRef.current) return;

      // Broadcast immediate typing presence
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'presence:typing',
            roomId: group?.id || roomId,
            isTyping: true,
          })
        );
      }

      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        const sock = wsRef.current;
        if (sock && sock.readyState === WebSocket.OPEN) {
          sock.send(
            JSON.stringify({
              type: 'presence:typing',
              roomId: group?.id || roomId,
              isTyping: false,
            })
          );
        }
      }, 1500);

      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        void flushEditToServer(nextTitle, nextContent, false);
      }, 160);
    },
    [flushEditToServer, group?.id, roomId]
  );

  const updateLocalTitle = useCallback(
    (nextTitle: string) => {
      setDraftTitle(nextTitle);
      scheduleSync(nextTitle, draftContent);
    },
    [draftContent, scheduleSync]
  );

  const updateLocalContent = useCallback(
    (nextContent: string) => {
      setDraftContent(nextContent);
      scheduleSync(draftTitle, nextContent);
    },
    [draftTitle, scheduleSync]
  );

  const syncNow = useCallback(() => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    void flushEditToServer(draftTitle, draftContent, false);
  }, [draftTitle, draftContent, flushEditToServer]);

  const registerSelfInGroup = useCallback(async () => {
    const targetRoomId = group?.id || roomId;
    if (!targetRoomId) return;
    setIsJoiningGroup(true);
    try {
      const res = await fetch(
        `/api/study-groups/${encodeURIComponent(targetRoomId)}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberName: user.name || 'Academic Scholar',
            memberEmail: userEmailLower,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.group) setGroup(data.group);
      }
    } finally {
      setIsJoiningGroup(false);
    }
  }, [group?.id, roomId, user.name, userEmailLower]);

  return {
    selfClientId: clientIdRef.current,
    group,
    note,
    draftTitle,
    draftContent,
    participants,
    connectionStatus,
    lastSyncedAt,
    isSaving,
    isMemberRegistered,
    isJoiningGroup,
    updateLocalTitle,
    updateLocalContent,
    syncNow,
    registerSelfInGroup,
  };
}
