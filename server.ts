import express from 'express';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocumentPdfBuffer } from './src/server/pdfService';
import {
  applyBackgroundSyncBatch,
  createAppeal,
  createRegisteredStudyGroup,
  generateTaiOneW3CAccreditation,
  getLiveStudySession,
  getOrCreateStudyGroupForRoom,
  getStudyRoomSharedNote,
  getSyncedUserState,
  issueOrUpdateCertificate,
  listAcceptedStudents,
  listAppeals,
  listCertificates,
  listRegisteredStudyGroups,
  listTaiOneW3CAccreditations,
  recordStudyGroupAttendance,
  recordStudyHeartbeat,
  registerMemberInStudyGroup,
  updateAcceptedStudentStatus,
  updateAppealStatus,
  updateStudyRoomSharedNote,
  upsertAcceptedStudent,
  verifyCertificateBySerial,
} from './src/server/syncDatabase';
import {
  analyzeStudyProgressWithGemini,
  explainStudyPassageWithGemini,
  generateStudyBuddyFlashcards,
} from './src/server/focusAiService';
import {
  AccreditationTier,
  AppealStatus,
  StudentAdmissionStatus,
  StudyRoomActiveParticipant,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory SSE subscriber registry keyed by userId
const sseSubscribers = new Map<string, Set<express.Response>>();

function broadcastStudyEvent(userId: string, eventName: string, payload: unknown) {
  const clients = sseSubscribers.get(userId);
  if (!clients || clients.size === 0) return;
  const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const clientRes of clients) {
    try {
      clientRes.write(serialized);
    } catch {
      clients.delete(clientRes);
    }
  }
}

function resolveServerPort(isProduction: boolean): number {
  const portFlagIdx = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = parseInt(process.argv[portFlagIdx + 1], 10);
    if (!Number.isNaN(cliPort) && cliPort > 0) return cliPort;
  }

  const eqPortArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (eqPortArg) {
    const cliPort = parseInt(eqPortArg.split('=')[1], 10);
    if (!Number.isNaN(cliPort) && cliPort > 0) return cliPort;
  }

  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  if (!isProduction) {
    // In dev, nginx occupies 8080 and proxies to 3000; never accidentally bind 8080 in dev.
    return !Number.isNaN(envPort) && envPort > 0 && envPort !== 8080 ? envPort : 3000;
  }

  return !Number.isNaN(envPort) && envPort > 0 ? envPort : 3000;
}

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = resolveServerPort(isProduction);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'TTG Digital World of Education Engine',
      headlessPdfAvailable: true,
      verificationLedgerActive: true,
      appealsQueueActive: true,
      realtimeStudySseActive: true,
      studyRoomSharedNotesWsActive: true,
      timestamp: new Date().toISOString(),
    });
  });

  // ----------------------------------------------------
  // Registered Study Groups & Shared Room Notes API + WebSocket Room State
  // ----------------------------------------------------

  const PARTICIPANT_PALETTE = [
    '#10b981',
    '#8b5cf6',
    '#3b82f6',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
  ];

  // Room-scoped WebSocket participant registry: roomId -> Map<WebSocket, StudyRoomActiveParticipant>
  const studyRoomConnections = new Map<string, Map<WebSocket, StudyRoomActiveParticipant>>();

  const getRoomParticipantsList = (roomId: string): StudyRoomActiveParticipant[] => {
    const roomMap = studyRoomConnections.get(roomId);
    if (!roomMap) return [];
    return Array.from(roomMap.values());
  };

  const broadcastToStudyRoom = (
    roomId: string,
    payload: unknown,
    excludeSocket?: WebSocket
  ) => {
    const roomMap = studyRoomConnections.get(roomId);
    if (!roomMap || roomMap.size === 0) return;
    const serialized = JSON.stringify(payload);
    for (const [clientWs] of roomMap.entries()) {
      if (excludeSocket && clientWs === excludeSocket) continue;
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(serialized);
        } catch {
          roomMap.delete(clientWs);
        }
      } else if (clientWs.readyState === WebSocket.CLOSED || clientWs.readyState === WebSocket.CLOSING) {
        roomMap.delete(clientWs);
      }
    }
  };

  app.get('/api/study-groups', async (req, res) => {
    try {
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const groups = await listRegisteredStudyGroups(courseId);
      const enriched = groups.map((g) => ({
        ...g,
        activeCount: getRoomParticipantsList(g.id).length,
      }));
      return res.json({ groups: enriched });
    } catch (err: any) {
      console.error('Error listing study groups:', err);
      return res.status(500).json({ error: 'Failed to list registered study groups' });
    }
  });

  app.post('/api/study-groups', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.name || !body.courseId) {
        return res.status(400).json({
          error: 'Group name and courseId are required to register a study group.',
        });
      }
      const created = await createRegisteredStudyGroup({
        name: String(body.name),
        topic: String(body.topic || 'Shared Peer Study Session'),
        courseId: String(body.courseId),
        courseTitle: String(body.courseTitle || body.courseId),
        hostName: String(body.hostName || 'Academic Scholar'),
        hostEmail: String(body.hostEmail || 'scholar@ttg-platform.local'),
        dateKey: typeof body.dateKey === 'string' ? body.dateKey : undefined,
      });
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Error creating study group:', err);
      return res.status(500).json({ error: 'Failed to register study group' });
    }
  });

  app.post('/api/study-groups/:roomId/join', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const body = req.body || {};
      if (!roomId || !body.memberEmail) {
        return res.status(400).json({ error: 'roomId and memberEmail are required.' });
      }
      const updatedGroup = await registerMemberInStudyGroup(
        roomId,
        String(body.memberName || 'Academic Scholar'),
        String(body.memberEmail),
        typeof body.dateKey === 'string' ? body.dateKey : undefined
      );
      if (!updatedGroup) {
        return res.status(404).json({ error: 'Registered study group not found.' });
      }
      broadcastToStudyRoom(roomId, {
        type: 'group:updated',
        roomId,
        group: updatedGroup,
      });
      return res.json({ group: updatedGroup });
    } catch (err: any) {
      console.error('Error joining study group:', err);
      return res.status(500).json({ error: 'Failed to register membership in study group' });
    }
  });

  app.post('/api/study-groups/:roomId/attendance', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const body = req.body || {};
      if (!roomId) {
        return res.status(400).json({ error: 'roomId is required.' });
      }
      const updatedGroup = await recordStudyGroupAttendance({
        roomId,
        memberEmail: typeof body.memberEmail === 'string' ? body.memberEmail : undefined,
        memberName: typeof body.memberName === 'string' ? body.memberName : undefined,
        dateKey: typeof body.dateKey === 'string' ? body.dateKey : undefined,
      });
      if (!updatedGroup) {
        return res.status(404).json({ error: 'Registered study group not found.' });
      }
      broadcastToStudyRoom(roomId, {
        type: 'group:updated',
        roomId,
        group: updatedGroup,
      });
      return res.json({ group: updatedGroup });
    } catch (err: any) {
      console.error('Error recording study group attendance:', err);
      return res.status(500).json({ error: 'Failed to record study group attendance' });
    }
  });

  app.get('/api/study-rooms/:roomId/notes', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const courseId =
        typeof req.query.courseId === 'string' && req.query.courseId.trim()
          ? req.query.courseId.trim()
          : 'general';
      const courseTitle =
        typeof req.query.courseTitle === 'string' && req.query.courseTitle.trim()
          ? req.query.courseTitle.trim()
          : 'Study Group Session';
      if (!roomId) {
        return res.status(400).json({ error: 'roomId is required.' });
      }
      const state = await getStudyRoomSharedNote(roomId, courseId, courseTitle);
      return res.json({
        ...state,
        participants: getRoomParticipantsList(state.group.id),
      });
    } catch (err: any) {
      console.error('Error loading shared room notes:', err);
      return res.status(500).json({ error: 'Failed to fetch shared study room notes' });
    }
  });

  app.put('/api/study-rooms/:roomId/notes', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const body = req.body || {};
      if (!roomId || typeof body.content !== 'string') {
        return res.status(400).json({ error: 'roomId and content string are required.' });
      }
      const result = await updateStudyRoomSharedNote({
        roomId,
        courseId: typeof body.courseId === 'string' ? body.courseId : undefined,
        courseTitle: typeof body.courseTitle === 'string' ? body.courseTitle : undefined,
        title: typeof body.title === 'string' ? body.title : undefined,
        content: body.content,
        editedBy: String(body.editedBy || 'Academic Scholar'),
        editedByEmail: typeof body.editedByEmail === 'string' ? body.editedByEmail : undefined,
      });

      broadcastToStudyRoom(result.note.roomId, {
        type: 'notes:synced',
        roomId: result.note.roomId,
        note: result.note,
        sourceClientId: typeof body.clientId === 'string' ? body.clientId : null,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Error saving shared room notes:', err);
      return res.status(500).json({ error: 'Failed to update shared study room notes' });
    }
  });

  // ----------------------------------------------------
  // Accepted & Registered Students Roster API
  // ----------------------------------------------------

  app.get('/api/accepted-students', async (req, res) => {
    try {
      const statusParam = typeof req.query.status === 'string' ? req.query.status : 'all';
      const facultyId = typeof req.query.facultyId === 'string' ? req.query.facultyId : 'all';
      const students = await listAcceptedStudents({
        status: statusParam as StudentAdmissionStatus | 'all',
        facultyId,
      });
      return res.json({ students });
    } catch (err: any) {
      console.error('Error listing accepted students:', err);
      return res.status(500).json({ error: 'Failed to fetch accepted and registered students' });
    }
  });

  app.post('/api/accepted-students', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.studentName || !body.studentEmail || !body.programName) {
        return res.status(400).json({
          error: 'studentName, studentEmail, and programName are required.',
        });
      }
      const allowedStatuses: StudentAdmissionStatus[] = [
        'Accepted',
        'Registered',
        'Accepted & Registered',
      ];
      const status: StudentAdmissionStatus = allowedStatuses.includes(body.admissionStatus)
        ? body.admissionStatus
        : 'Accepted & Registered';

      const student = await upsertAcceptedStudent({
        id: typeof body.id === 'string' ? body.id : undefined,
        registrationNumber:
          typeof body.registrationNumber === 'string' ? body.registrationNumber : undefined,
        studentName: String(body.studentName),
        studentEmail: String(body.studentEmail),
        admissionStatus: status,
        facultyId: String(body.facultyId || 'eng_tech_built'),
        facultyName: String(body.facultyName || 'Engineering, Technology & Built Environment'),
        departmentName: String(body.departmentName || 'General Academic Division'),
        programName: String(body.programName),
        qualificationLevel: String(body.qualificationLevel || "Bachelor's Degree"),
        assignedCourseId:
          typeof body.assignedCourseId === 'string' ? body.assignedCourseId : undefined,
        assignedCourseTitle:
          typeof body.assignedCourseTitle === 'string' ? body.assignedCourseTitle : undefined,
        leadLecturerName:
          typeof body.leadLecturerName === 'string' ? body.leadLecturerName : undefined,
        cohortTerm: String(body.cohortTerm || '2026 Academic Cohort'),
        acceptedDate:
          typeof body.acceptedDate === 'string'
            ? body.acceptedDate
            : new Date().toISOString().slice(0, 10),
        registeredDate:
          typeof body.registeredDate === 'string' ? body.registeredDate : undefined,
        accreditor: String(body.accreditor || 'Free Productivity Accreditation Council (FPAC)'),
        standingNotes: typeof body.standingNotes === 'string' ? body.standingNotes : undefined,
      });

      return res.status(201).json({ student });
    } catch (err: any) {
      console.error('Error creating accepted student record:', err);
      return res.status(500).json({ error: 'Failed to add accepted/registered student' });
    }
  });

  app.patch('/api/accepted-students/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const body = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Student record id is required.' });
      }
      const updated = await updateAcceptedStudentStatus(id, {
        admissionStatus: body.admissionStatus,
        assignedCourseId: body.assignedCourseId,
        assignedCourseTitle: body.assignedCourseTitle,
        leadLecturerName: body.leadLecturerName,
        standingNotes: body.standingNotes,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Accepted student record not found.' });
      }
      return res.json({ student: updated });
    } catch (err: any) {
      console.error('Error updating accepted student status:', err);
      return res.status(500).json({ error: 'Failed to update student registration status' });
    }
  });

  // ----------------------------------------------------
  // Public Certificate Verification Ledger API
  // ----------------------------------------------------

  app.get('/api/certificates/verify/:serial', async (req, res) => {
    try {
      const serial = String(req.params.serial || '').trim();
      if (!serial) {
        return res.status(400).json({ error: 'Certificate serial number is required.' });
      }
      const verification = await verifyCertificateBySerial(serial);
      return res.json(verification);
    } catch (err: any) {
      console.error('Certificate verification error:', err);
      return res.status(500).json({ error: 'Failed to query verification ledger' });
    }
  });

  app.get('/api/certificates', async (req, res) => {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
      const items = await listCertificates({ userId, courseId });
      return res.json({ certificates: items });
    } catch (err: any) {
      console.error('Certificate listing error:', err);
      return res.status(500).json({ error: 'Failed to list issued certificates' });
    }
  });

  app.post('/api/certificates/issue', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.serialNumber || !body.courseId || !body.recipientName) {
        return res.status(400).json({
          error: 'serialNumber, courseId, and recipientName are required to issue a certificate record.',
        });
      }
      if (body.isAccredited === false) {
        return res.status(400).json({
          error: 'Non-accredited certificates are disabled. Only accredited internal or external certificates can be issued.',
        });
      }

      const rawTier = body.accreditationTier;
      const accreditationTier: AccreditationTier | undefined =
        rawTier === 'accredited_external' || rawTier === 'accredited_internal'
          ? rawTier
          : undefined;

      const record = await issueOrUpdateCertificate({
        serialNumber: String(body.serialNumber),
        courseId: String(body.courseId),
        courseTitle: String(body.courseTitle || 'Platform Study Course'),
        categoryKey: String(body.categoryKey || 'Institutional Studies'),
        credentialTitle: String(body.credentialTitle || 'Accredited Course Completion Certificate'),
        accreditor: String(body.accreditor || 'TTG Internal Accreditation Board (Accredited Internal)'),
        accreditationTier,
        recipientName: String(body.recipientName),
        recipientEmail: String(body.recipientEmail || 'learner@ttg-platform.local'),
        userId: String(body.userId || 'user_88219'),
        issueDate: typeof body.issueDate === 'string' ? body.issueDate : undefined,
        progressPercent: Number(body.progressPercent) || 100,
        quizScore: typeof body.quizScore === 'number' ? body.quizScore : undefined,
      });

      return res.status(201).json({ certificate: record });
    } catch (err: any) {
      console.error('Certificate issue error:', err);
      return res.status(500).json({ error: 'Failed to record certificate in verification ledger' });
    }
  });

  // ----------------------------------------------------
  // Tai-One W3C Certification Accreditation API
  // ----------------------------------------------------

  app.get('/api/accreditation/tai-one-w3c', async (req, res) => {
    try {
      const rawTier = typeof req.query.tier === 'string' ? req.query.tier : 'all';
      const tier =
        rawTier === 'accredited_external' || rawTier === 'accredited_internal'
          ? rawTier
          : 'all';
      const accreditations = await listTaiOneW3CAccreditations({ tier });
      return res.json({ accreditations });
    } catch (err: any) {
      console.error('Error listing Tai-One W3C accreditations:', err);
      return res.status(500).json({ error: 'Failed to list Tai-One W3C accreditations' });
    }
  });

  app.post('/api/accreditation/tai-one-w3c/generate', async (req, res) => {
    try {
      const body = req.body || {};
      const tier = body.accreditationTier;
      if (tier !== 'accredited_external' && tier !== 'accredited_internal') {
        return res.status(400).json({
          error: 'Only accredited_external or accredited_internal tiers are permitted.',
        });
      }
      if (!body.programTitle || !body.recipientName) {
        return res.status(400).json({
          error: 'programTitle and recipientName are required to generate Tai-One W3C accreditation.',
        });
      }

      const result = await generateTaiOneW3CAccreditation({
        accreditationTier: tier,
        programTitle: String(body.programTitle),
        courseId: typeof body.courseId === 'string' ? body.courseId : undefined,
        categoryKey: String(body.categoryKey || 'Frontier AI & Systems'),
        recipientName: String(body.recipientName),
        recipientEmail: String(body.recipientEmail || 'scholar@ttg-platform.local'),
        organizationName: String(
          body.organizationName || 'TTG - Tsoaela Training Ground Platform'
        ),
        nqfCreditsReference: String(
          body.nqfCreditsReference || 'NQF Level 7 · 15 Accredited Credits'
        ),
        userId: typeof body.userId === 'string' ? body.userId : 'user_88219',
      });

      return res.status(201).json(result);
    } catch (err: any) {
      console.error('Error generating Tai-One W3C accreditation:', err);
      return res.status(500).json({
        error: 'Failed to generate Tai-One W3C certification accreditation',
      });
    }
  });

  // ----------------------------------------------------
  // Learner Assessment & Verification Appeals API
  // ----------------------------------------------------

  app.get('/api/appeals', async (req, res) => {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;
      const status = typeof req.query.status === 'string' ? (req.query.status as AppealStatus) : undefined;
      const appeals = await listAppeals({ userId, email, status });
      return res.json({ appeals });
    } catch (err: any) {
      console.error('Error listing appeals:', err);
      return res.status(500).json({ error: 'Failed to load appeals queue' });
    }
  });

  app.post('/api/appeals', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.appellantName || !body.courseTitle || !body.subject || !body.statement) {
        return res.status(400).json({
          error: 'appellantName, courseTitle, subject, and statement are required to file an appeal.',
        });
      }

      const created = await createAppeal({
        userId: String(body.userId || 'user_88219'),
        appellantName: String(body.appellantName),
        appellantEmail: String(body.appellantEmail || 'learner@ttg-platform.local'),
        courseId: String(body.courseId || 'general_course'),
        courseTitle: String(body.courseTitle),
        certificateSerial:
          typeof body.certificateSerial === 'string' && body.certificateSerial.trim()
            ? body.certificateSerial.trim()
            : undefined,
        category: body.category || 'Grade & Assessment Dispute',
        subject: String(body.subject),
        statement: String(body.statement),
        evidenceSummary: String(body.evidenceSummary || 'Learner platform reading & assessment history.'),
        requestedResolution: String(
          body.requestedResolution || 'Moderator re-evaluation and updated record verification.'
        ),
      });

      return res.status(201).json({ appeal: created });
    } catch (err: any) {
      console.error('Error creating appeal:', err);
      return res.status(500).json({ error: 'Failed to submit verification appeal' });
    }
  });

  app.patch('/api/appeals/:id', async (req, res) => {
    try {
      const appealId = String(req.params.id || '').trim();
      const body = req.body || {};
      const validStatuses: AppealStatus[] = [
        'Submitted',
        'Under Moderator Review',
        'Resolved - Approved',
        'Resolved - Upheld',
      ];
      if (!appealId || !validStatuses.includes(body.status)) {
        return res.status(400).json({ error: 'Valid appeal id and status are required.' });
      }

      const updated = await updateAppealStatus(appealId, {
        status: body.status,
        reviewedBy: String(body.reviewedBy || 'Faculty Moderator'),
        moderatorNotes: String(body.moderatorNotes || 'Status updated by Faculty Moderator.'),
        updatedQuizScore:
          typeof body.updatedQuizScore === 'number' ? body.updatedQuizScore : undefined,
        revokeCertificate: Boolean(body.revokeCertificate),
      });

      if (!updated) {
        return res.status(404).json({ error: 'Appeal case not found.' });
      }

      return res.json({ appeal: updated });
    } catch (err: any) {
      console.error('Error updating appeal:', err);
      return res.status(500).json({ error: 'Failed to update appeal status' });
    }
  });

  // ----------------------------------------------------
  // Real-Time Study Progress SSE Stream & Heartbeat API
  // ----------------------------------------------------

  app.get('/api/study-progress/stream', async (req, res) => {
    const userId =
      typeof req.query.userId === 'string' && req.query.userId.trim()
        ? req.query.userId.trim()
        : 'user_88219';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let subscribers = sseSubscribers.get(userId);
    if (!subscribers) {
      subscribers = new Set();
      sseSubscribers.set(userId, subscribers);
    }
    subscribers.add(res);

    try {
      const latestSession = await getLiveStudySession(userId);
      res.write(
        `event: connected\ndata: ${JSON.stringify({
          userId,
          connectedAt: new Date().toISOString(),
          latestSession,
        })}\n\n`
      );
    } catch {
      res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);
    }

    const keepAliveTimer = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        clearInterval(keepAliveTimer);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAliveTimer);
      const userSet = sseSubscribers.get(userId);
      if (userSet) {
        userSet.delete(res);
        if (userSet.size === 0) {
          sseSubscribers.delete(userId);
        }
      }
    });
  });

  app.post('/api/study-progress/heartbeat', async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.userId || !body.courseId) {
        return res.status(400).json({
          error: 'userId and courseId are required for real-time study heartbeat.',
        });
      }

      const result = await recordStudyHeartbeat({
        userId: String(body.userId),
        courseId: String(body.courseId),
        courseTitle: String(body.courseTitle || body.courseId),
        activeChapterIdx:
          typeof body.activeChapterIdx === 'number' ? body.activeChapterIdx : undefined,
        progressPercent:
          typeof body.progressPercent === 'number' ? body.progressPercent : undefined,
        deltaSeconds: typeof body.deltaSeconds === 'number' ? body.deltaSeconds : 0,
        sessionSeconds: typeof body.sessionSeconds === 'number' ? body.sessionSeconds : 0,
        isActive: body.isActive !== false,
      });

      broadcastStudyEvent(result.snapshot.userId, 'study_progress', result);
      return res.json(result);
    } catch (err: any) {
      console.error('Study heartbeat error:', err);
      return res.status(500).json({ error: 'Failed to record live study progress heartbeat' });
    }
  });

  // Retrieve Synchronized Student Study Progress & Assignments
  app.get('/api/sync/state', async (req, res) => {
    try {
      const userId =
        typeof req.query.userId === 'string' && req.query.userId.trim()
          ? req.query.userId.trim()
          : 'user_88219';
      const state = await getSyncedUserState(userId);
      return res.json(state);
    } catch (err: any) {
      console.error('Error reading sync state:', err);
      return res.status(500).json({ error: 'Failed to read sync database state' });
    }
  });

  // Background Synchronization Endpoint: persists locally cached study progress & offline assignments
  app.post('/api/sync', async (req, res) => {
    try {
      const { userId, readingProgressUpdates, offlineAssignments } = req.body || {};
      if (!userId && !readingProgressUpdates && !offlineAssignments) {
        return res.status(400).json({ error: 'Sync payload requires userId or pending records.' });
      }
      const result = await applyBackgroundSyncBatch({
        userId: userId || 'user_88219',
        readingProgressUpdates,
        offlineAssignments,
      });
      return res.json(result);
    } catch (err: any) {
      console.error('Background sync error:', err);
      return res.status(500).json({ error: 'Failed to commit background sync batch' });
    }
  });

  // Focus AI Mode: Server-side Gemini analysis of current study progress & past performance trends
  app.post('/api/focus-ai/analyze', async (req, res) => {
    try {
      const payload = req.body || {};
      if (!Array.isArray(payload.courses) || payload.courses.length === 0) {
        return res.status(400).json({
          error: 'At least one course telemetry entry is required for Focus AI analysis.',
          code: 'INVALID_PAYLOAD',
        });
      }

      const result = await analyzeStudyProgressWithGemini({
        userName:
          typeof payload.userName === 'string' && payload.userName.trim()
            ? payload.userName
            : 'Scholar',
        specialization:
          typeof payload.specialization === 'string' ? payload.specialization : undefined,
        syncedFocusMinutes: Number(payload.syncedFocusMinutes) || 0,
        averageQuizScore: Number(payload.averageQuizScore) || 0,
        courses: payload.courses,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Focus AI Gemini error:', err);
      const statusCode =
        typeof err?.statusCode === 'number'
          ? err.statusCode
          : typeof err?.status === 'number'
          ? err.status
          : 500;
      return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
        error: err?.message || 'Unable to generate Focus AI study recommendations.',
        code: err?.code || 'GEMINI_ANALYSIS_FAILED',
      });
    }
  });

  // TAI Tutor: Context-aware explanation for highlighted passages across study pages
  app.post('/api/tutor/explain', async (req, res) => {
    try {
      const payload = req.body || {};
      const highlightedText =
        typeof payload.highlightedText === 'string' ? payload.highlightedText.trim() : '';
      const question = typeof payload.question === 'string' ? payload.question.trim() : '';

      if (!highlightedText && !question) {
        return res.status(400).json({
          error: 'Highlighted text or a study question is required.',
          code: 'INVALID_PAYLOAD',
        });
      }

      const result = await explainStudyPassageWithGemini({
        highlightedText: highlightedText || question,
        question,
        mode: payload.mode,
        courseTitle: typeof payload.courseTitle === 'string' ? payload.courseTitle : undefined,
        chapterTitle: typeof payload.chapterTitle === 'string' ? payload.chapterTitle : undefined,
        pageLabel: typeof payload.pageLabel === 'string' ? payload.pageLabel : undefined,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('TAI Tutor error:', err);
      const statusCode =
        typeof err?.statusCode === 'number'
          ? err.statusCode
          : typeof err?.status === 'number'
          ? err.status
          : 500;
      return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
        error: err?.message || 'Unable to generate TAI Tutor explanation.',
        code: err?.code || 'GEMINI_TUTOR_FAILED',
      });
    }
  });

  // Virtual Study Buddy: Generate summarized flashcards based on active chapter progress using Gemini API
  app.post('/api/study-buddy/flashcards', async (req, res) => {
    try {
      const payload = req.body || {};
      const courseTitle = typeof payload.courseTitle === 'string' ? payload.courseTitle.trim() : '';
      const chapterTitle = typeof payload.chapterTitle === 'string' ? payload.chapterTitle.trim() : '';

      if (!courseTitle && !chapterTitle) {
        return res.status(400).json({
          error: 'Course title or chapter title is required to generate study buddy flashcards.',
          code: 'INVALID_PAYLOAD',
        });
      }

      const result = await generateStudyBuddyFlashcards({
        courseTitle: courseTitle || 'Advanced Academic Guide',
        chapterTitle: chapterTitle || 'Core Module Concepts',
        chapterSummary: typeof payload.chapterSummary === 'string' ? payload.chapterSummary : undefined,
        completedChaptersCount: Number(payload.completedChaptersCount) || 1,
        totalChapters: Number(payload.totalChapters) || 8,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('Study Buddy Flashcards error:', err);
      const statusCode =
        typeof err?.statusCode === 'number'
          ? err.statusCode
          : typeof err?.status === 'number'
          ? err.status
          : 500;
      return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
        error: err?.message || 'Unable to generate Study Buddy flashcards via Gemini API.',
        code: err?.code || 'GEMINI_FLASHCARDS_FAILED',
      });
    }
  });

  // Service-Side Headless PDF Generation Route
  app.post('/api/export-pdf', async (req, res) => {
    try {
      const {
        title,
        content,
        author,
        format,
        lastModified,
        wordCount,
        gradeLevel,
        fleschReadingLevel,
      } = req.body;

      if (!content && !title) {
        return res.status(400).json({ error: 'Title or content is required to generate a PDF.' });
      }

      const pdfBuffer = await generateDocumentPdfBuffer({
        title,
        content: content || '',
        author,
        format,
        lastModified,
        wordCount,
        gradeLevel,
        fleschReadingLevel,
      });

      const sanitizedFilename = (title || 'document')
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .substring(0, 50);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      return res.status(500).json({
        error: 'Failed to generate PDF via headless service',
        details: err?.message,
      });
    }
  });

  // Mount Vite middlewares in development
  if (!isProduction) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false, // Disable Vite WebSocket server (port 24678) in AI Studio iframe / middleware mode
        watch: hmrDisabled
          ? null
          : {
              ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/data/**'],
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/study-rooms' });

  wss.on('connection', (ws) => {
    let joinedRoomId: string | null = null;
    let clientId = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const leaveCurrentRoom = () => {
      if (!joinedRoomId) return;
      const roomMap = studyRoomConnections.get(joinedRoomId);
      if (roomMap) {
        roomMap.delete(ws);
        const remaining = Array.from(roomMap.values());
        if (remaining.length === 0) {
          studyRoomConnections.delete(joinedRoomId);
        } else {
          broadcastToStudyRoom(joinedRoomId, {
            type: 'presence:state',
            roomId: joinedRoomId,
            participants: remaining,
          });
        }
      }
      joinedRoomId = null;
    };

    ws.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(String(rawData));
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'room:join') {
          if (joinedRoomId) leaveCurrentRoom();

          const requestedRoomId =
            typeof msg.roomId === 'string' && msg.roomId.trim() ? msg.roomId.trim() : undefined;
          const courseId = String(msg.courseId || 'general').trim();
          const courseTitle = String(msg.courseTitle || 'Study Group Session').trim();
          const userId = String(msg.userId || 'user_88219').trim();
          const userName = String(msg.userName || msg.name || 'Academic Scholar').trim();
          const userEmail = String(msg.userEmail || msg.email || 'scholar@ttg-platform.local')
            .trim()
            .toLowerCase();
          if (typeof msg.clientId === 'string' && msg.clientId.trim()) {
            clientId = msg.clientId.trim();
          }

          const { group, note } = await getOrCreateStudyGroupForRoom({
            roomId: requestedRoomId,
            courseId,
            courseTitle,
            userName,
            userEmail,
          });

          const effectiveRoomId = group.id;
          joinedRoomId = effectiveRoomId;

          let roomMap = studyRoomConnections.get(effectiveRoomId);
          if (!roomMap) {
            roomMap = new Map();
            studyRoomConnections.set(effectiveRoomId, roomMap);
          }

          const nowIso = new Date().toISOString();
          const colorIdx =
            Array.from(userEmail + clientId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
            PARTICIPANT_PALETTE.length;

          const participant: StudyRoomActiveParticipant = {
            clientId,
            userId,
            name: userName,
            email: userEmail,
            color: PARTICIPANT_PALETTE[colorIdx],
            isTyping: false,
            joinedAt: nowIso,
            lastActiveAt: nowIso,
          };

          roomMap.set(ws, participant);
          const participants = Array.from(roomMap.values());

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'room:init',
                roomId: effectiveRoomId,
                selfClientId: clientId,
                group,
                note,
                participants,
              })
            );
          }

          broadcastToStudyRoom(
            effectiveRoomId,
            {
              type: 'presence:state',
              roomId: effectiveRoomId,
              participants,
            },
            ws
          );
          return;
        }

        if (msg.type === 'notes:update' && joinedRoomId) {
          const roomMap = studyRoomConnections.get(joinedRoomId);
          const participant = roomMap?.get(ws);
          if (participant) {
            participant.lastActiveAt = new Date().toISOString();
            participant.isTyping = Boolean(msg.isTyping);
          }

          const result = await updateStudyRoomSharedNote({
            roomId: joinedRoomId,
            courseId: typeof msg.courseId === 'string' ? msg.courseId : undefined,
            courseTitle: typeof msg.courseTitle === 'string' ? msg.courseTitle : undefined,
            title: typeof msg.title === 'string' ? msg.title : undefined,
            content: typeof msg.content === 'string' ? msg.content : '',
            editedBy: String(msg.userName || msg.name || participant?.name || 'Academic Scholar'),
            editedByEmail: String(msg.userEmail || msg.email || participant?.email || ''),
          });

          broadcastToStudyRoom(joinedRoomId, {
            type: 'notes:synced',
            roomId: joinedRoomId,
            note: result.note,
            sourceClientId: participant?.clientId || clientId,
          });
          return;
        }

        if (msg.type === 'presence:typing' && joinedRoomId) {
          const roomMap = studyRoomConnections.get(joinedRoomId);
          const participant = roomMap?.get(ws);
          if (participant) {
            participant.isTyping = Boolean(msg.isTyping);
            if (typeof msg.cursorLine === 'number') {
              participant.cursorLine = msg.cursorLine;
            }
            participant.lastActiveAt = new Date().toISOString();
            broadcastToStudyRoom(
              joinedRoomId,
              {
                type: 'presence:state',
                roomId: joinedRoomId,
                participants: Array.from(roomMap!.values()),
              },
              ws
            );
          }
          return;
        }

        if (msg.type === 'room:leave') {
          leaveCurrentRoom();
        }
      } catch (err) {
        console.error('WebSocket study-room message error:', err);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom();
    });

    ws.on('error', () => {
      leaveCurrentRoom();
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`TTG Platform Server + StudyRoom WS listening on port ${PORT} (dev: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
