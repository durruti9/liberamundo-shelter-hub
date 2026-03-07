import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Get all suggestions (admin only)
router.get('/:albergueId', async (req, res) => {
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
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a suggestion (guest)
router.post('/:albergueId', async (req, res) => {
  try {
    const { nombre, anonimo, email, telefono, mensaje } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO sugerencias (albergue_id, nombre, anonimo, email, telefono, mensaje, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [req.params.albergueId, nombre || '', anonimo || false, email || '', telefono || '', mensaje]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update suggestion (admin reply, mark read, translation)
router.put('/:id', async (req, res) => {
  try {
    const { respuesta, leida, traduccion } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (respuesta !== undefined) { updates.push(`respuesta = $${idx++}`); values.push(respuesta); }
    if (leida !== undefined) { updates.push(`leida = $${idx++}`); values.push(leida); }
    if (traduccion !== undefined) { updates.push(`traduccion = $${idx++}`); values.push(traduccion); }

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

export default router;
