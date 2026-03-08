import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Get huespedes by albergue
router.get('/:albergueId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM huespedes WHERE albergue_id = $1 ORDER BY fecha_entrada DESC',
      [req.params.albergueId]
    );
    res.json(rows.map(r => ({
      id: r.id, nombre: r.nombre, nie: r.nie, nacionalidad: r.nacionalidad,
      idioma: r.idioma, dieta: r.dieta, fechaEntrada: r.fecha_entrada,
      fechaCheckout: r.fecha_checkout, notas: r.notas, habitacion: r.habitacion,
      cama: r.cama, activo: r.activo,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check in
router.post('/:albergueId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, nie, nacionalidad, idioma, dieta, fechaEntrada, notas, habitacion, cama } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }
    const id = crypto.randomUUID();
    
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO huespedes (id, albergue_id, nombre, nie, nacionalidad, idioma, dieta, fecha_entrada, notas, habitacion, cama, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
      [id, req.params.albergueId, nombre.trim(), nie || '', nacionalidad || '', idioma || '', dieta || 'Omnívora estándar', fechaEntrada, notas || '', habitacion, cama]
    );
    // Auto-create comedor entry
    await client.query(
      `INSERT INTO comedor (huesped_id, estado, separar_comidas, dias_separar, motivo_ausencia, observaciones, particularidades)
       VALUES ($1,'Activo',ARRAY['Todas'],ARRAY['Todos los días'],'','','')`,
      [id]
    );
    await client.query('COMMIT');
    
    res.json({ id, nombre: nombre.trim(), nie: nie || '', nacionalidad: nacionalidad || '', idioma: idioma || '', dieta: dieta || 'Omnívora estándar', fechaEntrada, notas: notas || '', habitacion, cama, activo: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Edit huesped
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const mapping = {
      nombre: 'nombre', nie: 'nie', nacionalidad: 'nacionalidad', idioma: 'idioma',
      dieta: 'dieta', fechaEntrada: 'fecha_entrada', fechaCheckout: 'fecha_checkout',
      notas: 'notas', habitacion: 'habitacion', cama: 'cama', activo: 'activo',
    };
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      if (mapping[k]) { sets.push(`${mapping[k]} = $${i}`); vals.push(v); i++; }
    }
    if (sets.length > 0) {
      vals.push(req.params.id);
      await pool.query(`UPDATE huespedes SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete huesped
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM huespedes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check out
router.post('/:id/checkout', async (req, res) => {
  const client = await pool.connect();
  try {
    const { fecha } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await client.query('BEGIN');
    if (fecha > today) {
      await client.query('UPDATE huespedes SET fecha_checkout = $1 WHERE id = $2', [fecha, req.params.id]);
    } else {
      await client.query('UPDATE huespedes SET activo = false, fecha_checkout = $1 WHERE id = $2', [fecha, req.params.id]);
      await client.query('DELETE FROM comedor WHERE huesped_id = $1', [req.params.id]);
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

// Reincorporar
router.post('/:id/reincorporar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { habitacion, cama } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await client.query('BEGIN');
    await client.query(
      'UPDATE huespedes SET activo = true, habitacion = $1, cama = $2, fecha_checkout = NULL, fecha_entrada = $3 WHERE id = $4',
      [habitacion, cama, today, req.params.id]
    );
    await client.query(
      `INSERT INTO comedor (huesped_id, estado, separar_comidas, dias_separar, motivo_ausencia, observaciones, particularidades)
       VALUES ($1,'Activo',ARRAY['Todas'],ARRAY['Todos los días'],'','','') ON CONFLICT (huesped_id) DO NOTHING`,
      [req.params.id]
    );
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
