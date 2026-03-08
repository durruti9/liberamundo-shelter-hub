import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/notas/:userEmail — only own notas (or admin can see all)
router.get('/:userEmail', async (req, res) => {
  try {
    const requestedEmail = req.params.userEmail;
    const user = req.user;

    // Non-admins can only access their own notas
    if (user.role !== 'admin' && user.email !== requestedEmail) {
      return res.status(403).json({ error: 'Sin permisos para ver estas notas' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM notas WHERE user_email = $1 ORDER BY pinned DESC, updated_at DESC',
      [requestedEmail]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notas/:userEmail — only own notas
router.post('/:userEmail', async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    const user = req.user;

    if (user.role !== 'admin' && user.email !== userEmail) {
      return res.status(403).json({ error: 'Sin permisos para crear notas aquí' });
    }

    const { titulo, contenido, color, pinned } = req.body;

    // Verify user exists (foreign key requirement)
    const userCheck = await pool.query('SELECT email FROM users WHERE email = $1', [userEmail]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: `User "${userEmail}" not found. Please log out and log in again.` });
    }

    const { rows } = await pool.query(
      `INSERT INTO notas (user_email, titulo, contenido, color, pinned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userEmail, titulo || '', contenido || '', color || 'default', pinned || false]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notas/:id — verify ownership
router.put('/:id', async (req, res) => {
  try {
    const user = req.user;
    const { titulo, contenido, color, pinned } = req.body;

    // Verify the nota belongs to the user (unless admin)
    if (user.role !== 'admin') {
      const ownerCheck = await pool.query('SELECT user_email FROM notas WHERE id = $1', [req.params.id]);
      if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      if (ownerCheck.rows[0].user_email !== user.email) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
    }

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

// DELETE /api/notas/:id — verify ownership
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'admin') {
      const ownerCheck = await pool.query('SELECT user_email FROM notas WHERE id = $1', [req.params.id]);
      if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      if (ownerCheck.rows[0].user_email !== user.email) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
    }

    await pool.query('DELETE FROM notas WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
