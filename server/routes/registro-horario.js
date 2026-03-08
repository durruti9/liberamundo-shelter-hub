import { Router } from 'express';
import pool from '../db.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

// ====== EMPLEADOS ======

router.get('/empleados/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM empleados_horario WHERE albergue_id = $1 ORDER BY nombre_completo',
      [req.params.albergueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/empleados/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { nombre_completo, jornada_diaria_horas, vacaciones_anuales } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO empleados_horario (albergue_id, nombre_completo, jornada_diaria_horas, vacaciones_anuales)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.albergueId, nombre_completo, jornada_diaria_horas || 40, vacaciones_anuales || 22]
    );
    const year = new Date().getFullYear();
    await pool.query(
      `INSERT INTO vacaciones_saldo (empleado_id, anio, asignadas) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [rows[0].id, year, vacaciones_anuales || 22]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/empleados/:id', async (req, res) => {
  try {
    const { nombre_completo, jornada_diaria_horas, vacaciones_anuales, activo } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;
    if (nombre_completo !== undefined) { updates.push(`nombre_completo = $${idx++}`); values.push(nombre_completo); }
    if (jornada_diaria_horas !== undefined) { updates.push(`jornada_diaria_horas = $${idx++}`); values.push(jornada_diaria_horas); }
    if (vacaciones_anuales !== undefined) { updates.push(`vacaciones_anuales = $${idx++}`); values.push(vacaciones_anuales); }
    if (activo !== undefined) { updates.push(`activo = $${idx++}`); values.push(activo); }
    if (updates.length === 0) return res.json({ ok: true });
    values.push(req.params.id);
    await pool.query(`UPDATE empleados_horario SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/empleados/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM empleados_horario WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== REGISTROS DIARIOS ======

router.get('/registros/:empleadoId', async (req, res) => {
  try {
    const { start, end } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM registros_horario WHERE empleado_id = $1 AND fecha >= $2 AND fecha <= $3 ORDER BY fecha',
      [req.params.empleadoId, start, end]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registros/:empleadoId', async (req, res) => {
  try {
    const { fecha, estado, entrada_manana, salida_manana, entrada_tarde, salida_tarde,
            entrada_noche, salida_noche, pausa_min, horas_ordinarias, horas_extra,
            horas_complementarias, horas_vacaciones, horas_totales, observaciones,
            firma_data, firmado_en, marcado_revision, motivo_revision } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO registros_horario 
        (empleado_id, fecha, estado, entrada_manana, salida_manana, entrada_tarde, salida_tarde,
         entrada_noche, salida_noche, pausa_min, horas_ordinarias, horas_extra,
         horas_complementarias, horas_vacaciones, horas_totales, observaciones, firma_data, firmado_en,
         marcado_revision, motivo_revision, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, NOW())
       ON CONFLICT (empleado_id, fecha) DO UPDATE SET
         estado = EXCLUDED.estado,
         entrada_manana = EXCLUDED.entrada_manana,
         salida_manana = EXCLUDED.salida_manana,
         entrada_tarde = EXCLUDED.entrada_tarde,
         salida_tarde = EXCLUDED.salida_tarde,
         entrada_noche = EXCLUDED.entrada_noche,
         salida_noche = EXCLUDED.salida_noche,
         pausa_min = EXCLUDED.pausa_min,
         horas_ordinarias = EXCLUDED.horas_ordinarias,
         horas_extra = EXCLUDED.horas_extra,
         horas_complementarias = EXCLUDED.horas_complementarias,
         horas_vacaciones = EXCLUDED.horas_vacaciones,
         horas_totales = EXCLUDED.horas_totales,
         observaciones = EXCLUDED.observaciones,
         firma_data = EXCLUDED.firma_data,
         firmado_en = EXCLUDED.firmado_en,
         marcado_revision = EXCLUDED.marcado_revision,
         motivo_revision = EXCLUDED.motivo_revision,
         updated_at = NOW()
       RETURNING *`,
      [req.params.empleadoId, fecha, estado || 'trabajado',
       entrada_manana || null, salida_manana || null,
       entrada_tarde || null, salida_tarde || null,
       entrada_noche || null, salida_noche || null,
       pausa_min || 0, horas_ordinarias || 0, horas_extra || 0,
       horas_complementarias || 0, horas_vacaciones || 0, horas_totales || 0,
       observaciones || '', firma_data || '', firmado_en || null,
       marcado_revision || false, motivo_revision || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== VACACIONES SALDO ======

router.get('/vacaciones/:empleadoId/:anio', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vacaciones_saldo WHERE empleado_id = $1 AND anio = $2',
      [req.params.empleadoId, req.params.anio]
    );
    if (rows.length === 0) {
      const { rows: emp } = await pool.query('SELECT vacaciones_anuales FROM empleados_horario WHERE id = $1', [req.params.empleadoId]);
      const asignadas = emp[0]?.vacaciones_anuales || 22;
      const { rows: created } = await pool.query(
        'INSERT INTO vacaciones_saldo (empleado_id, anio, asignadas) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *',
        [req.params.empleadoId, req.params.anio, asignadas]
      );
      if (created.length > 0) return res.json(created[0]);
      const { rows: existing } = await pool.query(
        'SELECT * FROM vacaciones_saldo WHERE empleado_id = $1 AND anio = $2',
        [req.params.empleadoId, req.params.anio]
      );
      return res.json(existing[0] || { asignadas, consumidas: 0 });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vacaciones/:empleadoId/:anio', async (req, res) => {
  try {
    const { asignadas, consumidas } = req.body;
    await pool.query(
      `INSERT INTO vacaciones_saldo (empleado_id, anio, asignadas, consumidas)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (empleado_id, anio) DO UPDATE SET asignadas = $3, consumidas = $4`,
      [req.params.empleadoId, req.params.anio, asignadas, consumidas]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== CONFIG EMPRESA ======

router.get('/config-empresa/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM config_empresa WHERE albergue_id = $1',
      [req.params.albergueId]
    );
    res.json(rows[0] || { razon_social: '', cif: '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/config-empresa/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { razon_social, cif } = req.body;
    await pool.query(
      `INSERT INTO config_empresa (id, albergue_id, razon_social, cif, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
       ON CONFLICT (albergue_id) DO UPDATE SET razon_social = $2, cif = $3, updated_at = NOW()`,
      [req.params.albergueId, razon_social || '', cif || '']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== AUDITORÍA ======

router.get('/auditoria/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.* FROM auditoria_registros a
       JOIN empleados_horario e ON a.empleado_id = e.id
       WHERE e.albergue_id = $1
       ORDER BY a.created_at DESC
       LIMIT 200`,
      [req.params.albergueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auditoria', async (req, res) => {
  try {
    const { empleado_id, empleado_nombre, fecha_registro, campo_modificado, valor_anterior, valor_nuevo, modificado_por } = req.body;
    await pool.query(
      `INSERT INTO auditoria_registros (empleado_id, empleado_nombre, fecha_registro, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [empleado_id, empleado_nombre || '', fecha_registro, campo_modificado || '', valor_anterior || '', valor_nuevo || '', modificado_por || '']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
