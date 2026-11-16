import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocumentPdfBuffer } from './src/server/pdfService';
import { applyBackgroundSyncBatch, getSyncedUserState } from './src/server/syncDatabase';
import {
  analyzeStudyProgressWithGemini,
  explainStudyPassageWithGemini,
} from './src/server/focusAiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      timestamp: new Date().toISOString(),
    });
  });

  // Retrieve Synchronized Student Study Progress & Assignments
  app.get('/api/sync/state', async (req, res) => {
    try {
      const userId = typeof req.query.userId === 'string' && req.query.userId.trim()
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
        userName: typeof payload.userName === 'string' && payload.userName.trim() ? payload.userName : 'Scholar',
        specialization: typeof payload.specialization === 'string' ? payload.specialization : undefined,
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTG Platform Server listening on port ${PORT} (dev: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
