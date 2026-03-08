import { Router } from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

// Get board messages by albergue
router.get('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows: messages } = await pool.query(
      'SELECT * FROM board_messages WHERE albergue_id = $1 ORDER BY fecha DESC', [req.params.albergueId]
    );
    const { rows: replies } = await pool.query(
      `SELECT br.* FROM board_replies br
       JOIN board_messages bm ON br.message_id = bm.id
       WHERE bm.albergue_id = $1 ORDER BY br.fecha`, [req.params.albergueId]
    );

    const result = messages.map(m => ({
      id: m.id, tipo: m.tipo, autor: m.autor, fecha: m.fecha,
      texto: m.texto, visibilidad: m.visibilidad, resuelta: m.resuelta,
      resolucion: m.resolucion_autor ? {
        autor: m.resolucion_autor, fecha: m.resolucion_fecha, descripcion: m.resolucion_descripcion,
      } : undefined,
      respuestas: replies.filter(r => r.message_id === m.id).map(r => ({
        id: r.id, autor: r.autor, fecha: r.fecha, texto: r.texto,
      })),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { tipo, autor, fecha, texto, visibilidad } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO board_messages (id, albergue_id, tipo, autor, fecha, texto, visibilidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, req.params.albergueId, tipo, autor, fecha, texto, visibilidad]
    );
    res.json({ id, tipo, autor, fecha, texto, visibilidad, resuelta: false, respuestas: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:messageId/reply', async (req, res) => {
  try {
    const { autor, fecha, texto } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO board_replies (id, message_id, autor, fecha, texto) VALUES ($1,$2,$3,$4,$5)',
      [id, req.params.messageId, autor, fecha, texto]
    );
    res.json({ id, autor, fecha, texto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only admin and gestor can resolve board messages
router.put('/:messageId/resolve', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { autor, fecha, descripcion } = req.body;
    await pool.query(
      `UPDATE board_messages SET resuelta = true, resolucion_autor = $1, resolucion_fecha = $2, resolucion_descripcion = $3 WHERE id = $4`,
      [autor, fecha, descripcion, req.params.messageId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only admin and gestor can delete board messages
router.delete('/:messageId', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    await pool.query('DELETE FROM board_messages WHERE id = $1', [req.params.messageId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
