import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocumentPdfBuffer } from './src/server/pdfService';
import { applyBackgroundSyncBatch, getSyncedUserState } from './src/server/syncDatabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Explicitly disabled to prevent WebSocket connection errors in AI Studio iframe
        watch: {
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
