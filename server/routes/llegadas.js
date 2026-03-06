import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/:albergueId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM llegadas WHERE albergue_id = $1 ORDER BY fecha_llegada', [req.params.albergueId]
    );
    res.json(rows.map(r => ({
      id: r.id, nombre: r.nombre, nie: r.nie, nacionalidad: r.nacionalidad,
      idioma: r.idioma, dieta: r.dieta, fechaLlegada: r.fecha_llegada,
      notas: r.notas, habitacionAsignada: r.habitacion_asignada, camaAsignada: r.cama_asignada,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:albergueId', async (req, res) => {
  try {
    const { nombre, nie, nacionalidad, idioma, dieta, fechaLlegada, notas, habitacionAsignada, camaAsignada } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO llegadas (id, albergue_id, nombre, nie, nacionalidad, idioma, dieta, fecha_llegada, notas, habitacion_asignada, cama_asignada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, req.params.albergueId, nombre, nie, nacionalidad, idioma, dieta, fechaLlegada, notas, habitacionAsignada || null, camaAsignada || null]
    );
    res.json({ id, nombre, nie, nacionalidad, idioma, dieta, fechaLlegada, notas, habitacionAsignada, camaAsignada });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, nie, nacionalidad, idioma, dieta, fechaLlegada, notas, habitacionAsignada, camaAsignada } = req.body;
    await pool.query(
      `UPDATE llegadas SET nombre=COALESCE($1,nombre), nie=COALESCE($2,nie), nacionalidad=COALESCE($3,nacionalidad),
       idioma=COALESCE($4,idioma), dieta=COALESCE($5,dieta), fecha_llegada=COALESCE($6,fecha_llegada),
       notas=COALESCE($7,notas), habitacion_asignada=$8, cama_asignada=$9 WHERE id=$10`,
      [nombre, nie, nacionalidad, idioma, dieta, fechaLlegada, notas, habitacionAsignada || null, camaAsignada || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM llegadas WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
