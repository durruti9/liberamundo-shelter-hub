import { Router } from 'express';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const MENU_DIR = process.env.MENU_DIR || '/app/data/menus';

// Ensure directory exists
try {
  if (!existsSync(MENU_DIR)) {
    mkdirSync(MENU_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Could not create menu directory:', e.message);
}

// Get all menus for an albergue (returns array)
router.get('/:albergueId', (req, res) => {
  try {
    if (!existsSync(MENU_DIR)) return res.json({ exists: false, menus: [] });
    const files = readdirSync(MENU_DIR)
      .filter(f => f.startsWith(`${req.params.albergueId}_menu`))
      .sort();
    if (files.length === 0) return res.json({ exists: false, menus: [] });

    const menus = files.map(filename => {
      const ext = extname(filename);
      const stats = statSync(join(MENU_DIR, filename));
      // Extract index from filename: albergueId_menu_0.pdf -> 0
      const idxMatch = filename.match(/_menu_(\d+)/);
      const index = idxMatch ? parseInt(idxMatch[1]) : 0;
      return {
        index,
        filename: filename.replace(`${req.params.albergueId}_`, ''),
        displayName: `menu${ext}`,
        uploadedAt: stats.mtime.toISOString(),
        size: stats.size,
      };
    });

    // Backward compat: also return first menu info as top-level fields
    const first = menus[0];
    res.json({
      exists: true,
      filename: first.displayName,
      uploadedAt: first.uploadedAt,
      size: first.size,
      menus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve a specific menu by index (shared logic)
function serveMenu(req, res, disposition) {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    try {
      verifyToken(token);
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const menuIndex = req.params.menuIndex || '0';
    const files = readdirSync(MENU_DIR).filter(f => f.startsWith(`${req.params.albergueId}_menu`)).sort();
    
    const targetFile = files.find(f => f.includes(`_menu_${menuIndex}`));
    const filename = targetFile || (menuIndex === '0' ? files[0] : null);
    
    if (!filename) return res.status(404).json({ error: 'No menu found' });

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
    res.setHeader('Content-Disposition', `${disposition}; filename="menu_${menuIndex}${ext}"`);
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Download a specific menu by index
router.get('/:albergueId/download/:menuIndex?', (req, res) => serveMenu(req, res, 'attachment'));

// View a specific menu inline (for PDF preview)
router.get('/:albergueId/view/:menuIndex?', (req, res) => serveMenu(req, res, 'inline'));

// Upload menu (adds a new one, doesn't replace all)
router.post('/:albergueId', (req, res) => {
  const albergueId = req.params.albergueId;
  const contentType = req.headers['content-type'] || '';

  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Must be multipart/form-data' });
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) return res.status(400).json({ error: 'No boundary found' });

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks);
      const parts = parseMultipart(body, boundary);
      const filePart = parts.find(p => p.name === 'file');

      if (!filePart || !filePart.data || filePart.data.length === 0) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const origName = filePart.filename || 'menu.pdf';
      const ext = extname(origName).toLowerCase() || '.pdf';
      const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.jpg', '.png'];
      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: `File type ${ext} not allowed` });
      }

      if (!existsSync(MENU_DIR)) {
        mkdirSync(MENU_DIR, { recursive: true });
      }

      // Find next available index
      const existing = readdirSync(MENU_DIR).filter(f => f.startsWith(`${albergueId}_menu`));
      let nextIndex = 0;
      existing.forEach(f => {
        const m = f.match(/_menu_(\d+)/);
        if (m) nextIndex = Math.max(nextIndex, parseInt(m[1]) + 1);
      });
      // If there are legacy files without index, rename them first
      existing.forEach(f => {
        if (!f.match(/_menu_\d+/)) {
          const legacyExt = extname(f);
          const newName = `${albergueId}_menu_0${legacyExt}`;
          const oldPath = join(MENU_DIR, f);
          const newPath = join(MENU_DIR, newName);
          if (!existsSync(newPath)) {
            writeFileSync(newPath, readFileSync(oldPath));
            unlinkSync(oldPath);
          }
          nextIndex = Math.max(nextIndex, 1);
        }
      });

      const newFilename = `${albergueId}_menu_${nextIndex}${ext}`;
      writeFileSync(join(MENU_DIR, newFilename), filePart.data);

      console.log(`✅ Menu uploaded: ${newFilename} (${filePart.data.length} bytes)`);

      res.json({
        ok: true,
        index: nextIndex,
        filename: `menu_${nextIndex}${ext}`,
        uploadedAt: new Date().toISOString(),
        size: filePart.data.length,
      });
    } catch (err) {
      console.error('❌ Menu upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  req.on('error', err => {
    console.error('❌ Menu upload stream error:', err);
    res.status(500).json({ error: err.message });
  });
});

// Delete a specific menu by index
router.delete('/:albergueId/:menuIndex?', (req, res) => {
  try {
    if (!existsSync(MENU_DIR)) return res.json({ ok: true });
    const menuIndex = req.params.menuIndex;
    
    if (menuIndex !== undefined) {
      // Delete specific menu
      const files = readdirSync(MENU_DIR).filter(f => 
        f.startsWith(`${req.params.albergueId}_menu`) && f.includes(`_menu_${menuIndex}`)
      );
      files.forEach(f => unlinkSync(join(MENU_DIR, f)));
    } else {
      // Delete all menus for this albergue
      const files = readdirSync(MENU_DIR).filter(f => f.startsWith(`${req.params.albergueId}_menu`));
      files.forEach(f => unlinkSync(join(MENU_DIR, f)));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple multipart parser
function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);

  let pos = body.indexOf(boundaryBuf);
  if (pos === -1) return parts;

  while (pos < body.length) {
    const partStart = pos + boundaryBuf.length;
    if (partStart >= body.length) break;
    if (body[partStart] === 0x2D && body[partStart + 1] === 0x2D) break;

    const headerStart = partStart + 2;
    const headerEnd = body.indexOf('\r\n\r\n', headerStart);
    if (headerEnd === -1) break;

    const headers = body.slice(headerStart, headerEnd).toString('utf8');
    const dataStart = headerEnd + 4;
    const nextBoundary = body.indexOf(boundaryBuf, dataStart);
    if (nextBoundary === -1) break;

    const dataEnd = nextBoundary - 2;
    const data = body.slice(dataStart, dataEnd);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        data,
      });
    }

    pos = nextBoundary;
  }

  return parts;
}

export default router;
