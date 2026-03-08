import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// === PROTECTED: Bulk/clear routes MUST come before /:param routes ===

// Bulk delete suggestions
router.post('/bulk-delete', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || !ids.length) return res.json({ ok: true });
    // Validate all ids are strings
    const safeIds = ids.filter(id => typeof id === 'string' && id.length > 0);
    if (safeIds.length === 0) return res.json({ ok: true });
    await pool.query(`DELETE FROM sugerencias WHERE id = ANY($1::text[])`, [safeIds]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all suggestions for an albergue
router.delete('/clear/:albergueId', requireAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM sugerencias WHERE albergue_id = $1`, [req.params.albergueId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === PUBLIC: Add a suggestion (guest) — no auth required ===
router.post('/:albergueId', async (req, res) => {
  try {
    const { nombre, anonimo, email, telefono, mensaje, adjunto, adjuntoNombre, adjuntoTipo } = req.body;
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }
    if (mensaje.length > 5000) {
      return res.status(400).json({ error: 'El mensaje es demasiado largo (máx. 5000 caracteres)' });
    }
    const { rows } = await pool.query(
      `INSERT INTO sugerencias (albergue_id, nombre, anonimo, email, telefono, mensaje, fecha, adjunto, adjunto_nombre, adjunto_tipo)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
       RETURNING id`,
      [req.params.albergueId, (nombre || '').slice(0, 200), anonimo || false, (email || '').slice(0, 200), (telefono || '').slice(0, 50), mensaje.trim(), adjunto || '', (adjuntoNombre || '').slice(0, 200), (adjuntoTipo || '').slice(0, 100)]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === PROTECTED: All management endpoints require auth ===

// Get all suggestions (admin only)
router.get('/:albergueId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sugerencias WHERE albergue_id = $1 ORDER BY fecha DESC`,
      [req.params.albergueId]
    );
    res.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      anonimo: r.anonimo,
      email: r.email,
      telefono: r.telefono,
      mensaje: r.mensaje,
      fecha: r.fecha,
      leida: r.leida,
      respuesta: r.respuesta,
      traduccion: r.traduccion,
      resuelta: r.resuelta ?? false,
      adjunto: r.adjunto || '',
      adjuntoNombre: r.adjunto_nombre || '',
      adjuntoTipo: r.adjunto_tipo || '',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update suggestion (admin reply, mark read, translation, resolved)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { respuesta, leida, traduccion, resuelta } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (respuesta !== undefined) { updates.push(`respuesta = $${idx++}`); values.push(respuesta); }
    if (leida !== undefined) { updates.push(`leida = $${idx++}`); values.push(leida); }
    if (traduccion !== undefined) { updates.push(`traduccion = $${idx++}`); values.push(traduccion); }
    if (resuelta !== undefined) { updates.push(`resuelta = $${idx++}`); values.push(resuelta); }

    if (updates.length === 0) return res.json({ ok: true });

    values.push(req.params.id);
    await pool.query(
      `UPDATE sugerencias SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a single suggestion
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM sugerencias WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
