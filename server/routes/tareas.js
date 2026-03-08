import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Get tareas for date range
router.get('/:albergueId', async (req, res) => {
  try {
    const { start, end } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM tareas_dia WHERE albergue_id = $1 AND fecha >= $2 AND fecha <= $3 ORDER BY fecha, orden`,
      [req.params.albergueId, start, end]
    );
    res.json(rows.map(r => ({
      id: r.id,
      fecha: r.fecha instanceof Date ? r.fecha.toISOString().split('T')[0] : String(r.fecha).split('T')[0],
      tareaId: r.tarea_id,
      tareaNombre: r.tarea_nombre,
      estado: r.estado,
      turno: r.turno,
      hechoPor: r.hecho_por,
      observacion: r.observacion,
      orden: r.orden,
      adminObs: r.admin_obs || '',
      respuestaEmpleado: r.respuesta_empleado || '',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save tareas for a day (replace all for that date)
router.post('/:albergueId/:fecha', async (req, res) => {
  const client = await pool.connect();
  try {
    const { albergueId, fecha } = req.params;
    const { tareas } = req.body;

    await client.query('BEGIN');
    await client.query('DELETE FROM tareas_dia WHERE albergue_id = $1 AND fecha = $2', [albergueId, fecha]);

    for (const t of tareas) {
      await client.query(
        `INSERT INTO tareas_dia (albergue_id, fecha, tarea_id, tarea_nombre, estado, turno, hecho_por, observacion, orden, admin_obs, respuesta_empleado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [albergueId, fecha, t.tareaId, t.tareaNombre, t.estado, t.turno, t.hechoPor || '', t.observacion || '', t.orden, t.adminObs || '', t.respuestaEmpleado || '']
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
