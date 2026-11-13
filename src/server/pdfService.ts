import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DocumentPdfPayload {
  title: string;
  content: string;
  author?: string;
  format?: 'text' | 'word' | 'pdf';
  lastModified?: string;
  wordCount?: number;
  gradeLevel?: number;
  fleschReadingLevel?: string;
}

const LOGO_CANDIDATE_PATHS = [
  path.resolve(process.cwd(), 'public/assets/aistudio/InShot_20260522_150628190_3d2729ca.jpg'),
  path.resolve(__dirname, '../../public/assets/aistudio/InShot_20260522_150628190_3d2729ca.jpg'),
];

function resolveLogoFilePath(): string | null {
  for (const candidate of LOGO_CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Service-side utility that uses headless PDFKit to export Document Editor content
 * as a publication-ready formatted PDF document.
 */
export function generateDocumentPdfBuffer(payload: DocumentPdfPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 54,
          bottom: 54,
          left: 54,
          right: 54,
        },
        info: {
          Title: payload.title || 'Untitled TTG Document',
          Author: payload.author || 'TTG Digital World of Education',
          Subject: 'TTG Academic & Institutional Authorship Export',
          Keywords: 'TTG, Educare, PDF Export, Academic Paper, Digital Education',
          CreationDate: new Date(),
        },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      const title = payload.title?.trim() || 'Untitled Document';
      const author = payload.author || 'Institutional Scholar';
      const lastModified = payload.lastModified || new Date().toISOString().slice(0, 10);
      const content = payload.content || '';
      const wordCount = payload.wordCount ?? content.split(/\s+/).filter(Boolean).length;
      const readingLevel = payload.fleschReadingLevel || 'Standard Executive Level';
      const logoPath = resolveLogoFilePath();

      // 1. Header Banner / Brand Lockup with Tai-one Logo
      doc
        .rect(54, 40, doc.page.width - 108, 3)
        .fill('#65a30d');

      if (logoPath) {
        doc.image(logoPath, 54, 48, { width: 34, height: 34 });
      }

      const textStartX = logoPath ? 98 : 54;

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#365314')
        .text('TAI-ONE DIGITAL DEVELOPER · TTG DIGITAL WORLD OF EDUCATION', textStartX, 50, {
          characterSpacing: 1.2,
        });

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text('EXECUTIVE AUTHOR ARCHIVES · VERIFIED DOCUMENT RECORD', textStartX, 62, {
          characterSpacing: 0.8,
        });

      doc.y = logoPath ? 92 : 76;

      // 2. Document Title
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text(title, {
          lineGap: 4,
        });

      doc.moveDown(0.5);

      // 3. Metadata Panel Box
      const metaY = doc.y;
      const metaWidth = doc.page.width - 108;
      const metaHeight = 52;

      doc
        .roundedRect(54, metaY, metaWidth, metaHeight, 6)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      doc
        .fillColor('#334155')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('AUTHOR:', 68, metaY + 12)
        .font('Helvetica')
        .fillColor('#0f172a')
        .text(author, 120, metaY + 12);

      doc
        .fillColor('#334155')
        .font('Helvetica-Bold')
        .text('PUBLISHED:', 68, metaY + 30)
        .font('Helvetica')
        .fillColor('#0f172a')
        .text(lastModified, 120, metaY + 30);

      doc
        .fillColor('#334155')
        .font('Helvetica-Bold')
        .text('WORD COUNT:', 260, metaY + 12)
        .font('Helvetica')
        .fillColor('#0f172a')
        .text(`${wordCount} words`, 340, metaY + 12);

      doc
        .fillColor('#334155')
        .font('Helvetica-Bold')
        .text('GRADE LEVEL:', 260, metaY + 30)
        .font('Helvetica')
        .fillColor('#0f172a')
        .text(readingLevel, 340, metaY + 30);

      doc.y = metaY + metaHeight + 20;

      // 4. Content Rendering with formatting heuristics
      const paragraphs = content.split('\n');

      for (let i = 0; i < paragraphs.length; i++) {
        const rawLine = paragraphs[i];
        const line = rawLine.trim();

        // Empty line
        if (!line) {
          doc.moveDown(0.5);
          continue;
        }

        // Heading 1 (# Heading)
        if (line.startsWith('# ')) {
          doc.moveDown(0.6);
          doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#1e1b4b')
            .text(line.replace(/^#\s+/, ''), { lineGap: 3 });
          doc.moveDown(0.3);
          continue;
        }

        // Heading 2 (## Heading)
        if (line.startsWith('## ')) {
          doc.moveDown(0.5);
          doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .fillColor('#312e81')
            .text(line.replace(/^##\s+/, ''), { lineGap: 2 });
          doc.moveDown(0.2);
          continue;
        }

        // Heading 3 (### Heading)
        if (line.startsWith('### ')) {
          doc.moveDown(0.4);
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#4338ca')
            .text(line.replace(/^###\s+/, ''), { lineGap: 2 });
          doc.moveDown(0.2);
          continue;
        }

        // Blockquote (> Quote)
        if (line.startsWith('>')) {
          doc.moveDown(0.3);
          const quoteText = line.replace(/^>\s*/, '');
          const quoteY = doc.y;

          doc
            .fontSize(9.5)
            .font('Helvetica-Oblique')
            .fillColor('#475569')
            .text(quoteText, {
              indent: 14,
              lineGap: 3,
            });

          const currentY = doc.y;
          doc
            .rect(58, quoteY, 3, Math.max(12, currentY - quoteY))
            .fill('#a855f7');

          doc.moveDown(0.3);
          continue;
        }

        // Bullet point (- or * or •)
        if (/^[-*•]\s+/.test(line)) {
          const bulletText = line.replace(/^[-*•]\s+/, '');
          doc
            .fontSize(9.5)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(`•   ${bulletText}`, {
              indent: 10,
              lineGap: 2,
            });
          doc.moveDown(0.2);
          continue;
        }

        // Regular paragraph text
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(line, {
            align: 'justify',
            lineGap: 3.5,
          });

        doc.moveDown(0.4);
      }

      // 5. Running Page Footers (Buffered pages)
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let p = 0; p < totalPages; p++) {
        doc.switchToPage(p);
        const originalBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Footer divider
        doc
          .rect(54, doc.page.height - 42, doc.page.width - 108, 0.5)
          .fill('#cbd5e1');

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('TTG Academic & Professional Qualification Standard · Verifiable Credential', 54, doc.page.height - 34, {
            lineBreak: false,
          });

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text(`Page ${p + 1} of ${totalPages}`, doc.page.width - 130, doc.page.height - 34, {
            align: 'right',
            width: 76,
            lineBreak: false,
          });

        doc.page.margins.bottom = originalBottom;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
