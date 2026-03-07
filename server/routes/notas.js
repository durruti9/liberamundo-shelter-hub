import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/notas/:userEmail
router.get('/:userEmail', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notas WHERE user_email = $1 ORDER BY pinned DESC, updated_at DESC',
      [req.params.userEmail]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notas/:userEmail
router.post('/:userEmail', async (req, res) => {
  try {
    const { titulo, contenido, color, pinned } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO notas (user_email, titulo, contenido, color, pinned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.userEmail, titulo || '', contenido || '', color || 'default', pinned || false]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notas/:id
router.put('/:id', async (req, res) => {
  try {
    const { titulo, contenido, color, pinned } = req.body;
    const { rows } = await pool.query(
      `UPDATE notas SET titulo = COALESCE($1, titulo), contenido = COALESCE($2, contenido),
       color = COALESCE($3, color), pinned = COALESCE($4, pinned), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [titulo, contenido, color, pinned, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notas/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notas WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
