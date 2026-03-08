import { Router } from 'express';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const router = Router();
const MENU_DIR = '/app/data/menus';

// Ensure directory exists
if (!existsSync(MENU_DIR)) {
  mkdirSync(MENU_DIR, { recursive: true });
}

// Get current menu info for an albergue
router.get('/:albergueId', (req, res) => {
  try {
    const files = readdirSync(MENU_DIR).filter(f => f.startsWith(`${req.params.albergueId}_menu`));
    if (files.length === 0) return res.json({ exists: false });

    const filename = files[0];
    const ext = extname(filename);
    const stats = require('fs').statSync(join(MENU_DIR, filename));
    res.json({
      exists: true,
      filename: `menu${ext}`,
      uploadedAt: stats.mtime.toISOString(),
      size: stats.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download current menu
router.get('/:albergueId/download', (req, res) => {
  try {
    const files = readdirSync(MENU_DIR).filter(f => f.startsWith(`${req.params.albergueId}_menu`));
    if (files.length === 0) return res.status(404).json({ error: 'No menu found' });

    const filename = files[0];
    const ext = extname(filename);
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
    };

    const filePath = join(MENU_DIR, filename);
    const content = readFileSync(filePath);
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="menu${ext}"`);
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload menu (replaces previous)
router.post('/:albergueId', express_upload_handler);

function express_upload_handler(req, res) {
  const albergueId = req.params.albergueId;
  const chunks = [];

  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks);

      // Parse multipart form data manually (simple parser)
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return res.status(400).json({ error: 'Must be multipart/form-data' });
      }

      const boundary = contentType.split('boundary=')[1];
      if (!boundary) return res.status(400).json({ error: 'No boundary found' });

      const parts = parseMultipart(body, boundary);
      const filePart = parts.find(p => p.name === 'file');
      if (!filePart) return res.status(400).json({ error: 'No file provided' });

      // Determine extension from original filename
      const origName = filePart.filename || 'menu.pdf';
      const ext = extname(origName).toLowerCase() || '.pdf';
      const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.jpg', '.png'];
      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: `File type ${ext} not allowed` });
      }

      // Remove previous menu files for this albergue
      const existing = readdirSync(MENU_DIR).filter(f => f.startsWith(`${albergueId}_menu`));
      existing.forEach(f => unlinkSync(join(MENU_DIR, f)));

      // Save new file
      const newFilename = `${albergueId}_menu${ext}`;
      writeFileSync(join(MENU_DIR, newFilename), filePart.data);

      res.json({
        ok: true,
        filename: `menu${ext}`,
        uploadedAt: new Date().toISOString(),
        size: filePart.data.length,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Delete menu
router.delete('/:albergueId', (req, res) => {
  try {
    const files = readdirSync(MENU_DIR).filter(f => f.startsWith(`${req.params.albergueId}_menu`));
    files.forEach(f => unlinkSync(join(MENU_DIR, f)));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple multipart parser
function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBuffer = Buffer.from(`--${boundary}--`);

  let start = body.indexOf(boundaryBuffer) + boundaryBuffer.length + 2; // skip \r\n

  while (start < body.length) {
    const nextBoundary = body.indexOf(boundaryBuffer, start);
    if (nextBoundary === -1) break;

    const partData = body.slice(start, nextBoundary - 2); // -2 for \r\n before boundary
    const headerEnd = partData.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = nextBoundary + boundaryBuffer.length + 2; continue; }

    const headers = partData.slice(0, headerEnd).toString();
    const content = partData.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        data: content,
      });
    }

    start = nextBoundary + boundaryBuffer.length + 2;
    if (body.indexOf(endBuffer, nextBoundary) === nextBoundary) break;
  }

  return parts;
}

export default router;
