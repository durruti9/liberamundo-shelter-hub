import { Router } from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

// Helper to parse multi-guest fields (backward compat: single value -> array)
function parseMulti(val) {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val ? [val] : [];
}

router.get('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM incidencias WHERE albergue_id = $1 ORDER BY fecha DESC', [req.params.albergueId]
    );

    // Fetch all comments for these incidencias
    const incIds = rows.map(r => r.id);
    let commentsMap = {};
    if (incIds.length > 0) {
      const { rows: comments } = await pool.query(
        'SELECT * FROM incidencia_comentarios WHERE incidencia_id = ANY($1) ORDER BY fecha ASC',
        [incIds]
      );
      comments.forEach(c => {
        if (!commentsMap[c.incidencia_id]) commentsMap[c.incidencia_id] = [];
        commentsMap[c.incidencia_id].push({
          id: c.id, autor: c.autor, fecha: c.fecha, texto: c.texto,
        });
      });
    }

    res.json(rows.map(r => ({
      id: r.id,
      huespedIds: parseMulti(r.huesped_id),
      huespedNombres: parseMulti(r.huesped_nombre),
      tipo: r.tipo,
      severidad: r.severidad || 'S3',
      descripcion: r.descripcion,
      fecha: r.fecha,
      resuelta: r.resuelta,
      creadoPor: r.creado_por,
      visibilidad: r.visibilidad || 'todos',
      adjunto: r.adjunto || '',
      adjuntoNombre: r.adjunto_nombre || '',
      adjuntoTipo: r.adjunto_tipo || '',
      comentarios: commentsMap[r.id] || [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { huespedIds, huespedNombres, tipo, descripcion, fecha, creadoPor, visibilidad, adjunto, adjuntoNombre, adjuntoTipo } = req.body;
    const id = crypto.randomUUID();

    // Store arrays as JSON strings
    const hIdStr = JSON.stringify(huespedIds || []);
    const hNameStr = JSON.stringify(huespedNombres || []);

    await pool.query(
      `INSERT INTO incidencias (id, albergue_id, huesped_id, huesped_nombre, tipo, descripcion, fecha, creado_por, visibilidad, adjunto, adjunto_nombre, adjunto_tipo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, req.params.albergueId, hIdStr, hNameStr, tipo, descripcion, fecha, creadoPor,
       visibilidad || 'todos', adjunto || '', adjuntoNombre || '', adjuntoTipo || '']
    );
    res.json({
      id, huespedIds: huespedIds || [], huespedNombres: huespedNombres || [],
      tipo, descripcion, fecha, resuelta: false, creadoPor,
      visibilidad: visibilidad || 'todos',
      adjunto: adjunto || '', adjuntoNombre: adjuntoNombre || '', adjuntoTipo: adjuntoTipo || '',
      comentarios: [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/:id/comment', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { autor, texto } = req.body;
    if (!texto || !texto.trim()) return res.status(400).json({ error: 'Texto requerido' });

    const commentId = crypto.randomUUID();
    const fecha = new Date().toISOString();
    await pool.query(
      'INSERT INTO incidencia_comentarios (id, incidencia_id, autor, fecha, texto) VALUES ($1,$2,$3,$4,$5)',
      [commentId, req.params.id, autor || user.email, fecha, texto.trim()]
    );
    res.json({ id: commentId, autor: autor || user.email, fecha, texto: texto.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only admin and gestor can toggle/resolve incidencias
router.put('/:id/toggle', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      const { rows: inc } = await pool.query('SELECT albergue_id FROM incidencias WHERE id = $1', [req.params.id]);
      if (inc.length === 0) return res.status(404).json({ error: 'No encontrada' });
      const { rows: access } = await pool.query(
        'SELECT 1 FROM user_albergues WHERE user_email = $1 AND albergue_id = $2',
        [user.email, inc[0].albergue_id]
      );
      if (access.length === 0) return res.status(403).json({ error: 'Sin acceso a este albergue' });
    }
    await pool.query('UPDATE incidencias SET resuelta = NOT resuelta WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only admin and gestor can delete incidencias
router.delete('/:id', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      const { rows: inc } = await pool.query('SELECT albergue_id FROM incidencias WHERE id = $1', [req.params.id]);
      if (inc.length === 0) return res.status(404).json({ error: 'No encontrada' });
      const { rows: access } = await pool.query(
        'SELECT 1 FROM user_albergues WHERE user_email = $1 AND albergue_id = $2',
        [user.email, inc[0].albergue_id]
      );
      if (access.length === 0) return res.status(403).json({ error: 'Sin acceso a este albergue' });
    }
    await pool.query('DELETE FROM incidencias WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
