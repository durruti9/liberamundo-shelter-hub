import { Router } from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

router.get('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM incidencias WHERE albergue_id = $1 ORDER BY fecha DESC', [req.params.albergueId]
    );
    res.json(rows.map(r => ({
      id: r.id, huespedId: r.huesped_id, huespedNombre: r.huesped_nombre,
      tipo: r.tipo, descripcion: r.descripcion, fecha: r.fecha,
      resuelta: r.resuelta, creadoPor: r.creado_por,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { huespedId, huespedNombre, tipo, descripcion, fecha, creadoPor } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO incidencias (id, albergue_id, huesped_id, huesped_nombre, tipo, descripcion, fecha, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, req.params.albergueId, huespedId, huespedNombre, tipo, descripcion, fecha, creadoPor]
    );
    res.json({ id, huespedId, huespedNombre, tipo, descripcion, fecha, resuelta: false, creadoPor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Only admin and gestor can toggle/resolve incidencias
router.put('/:id/toggle', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const user = req.user;
    // Verify gestor has access to this incidencia's albergue
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
    await pool.query('DELETE FROM incidencias WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
