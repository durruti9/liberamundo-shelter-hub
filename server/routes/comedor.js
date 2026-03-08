import { Router } from 'express';
import pool from '../db.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

// Get comedor entries by albergue (validates albergue access)
router.get('/:albergueId', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.* FROM comedor c
       JOIN huespedes h ON c.huesped_id = h.id
       WHERE h.albergue_id = $1`,
      [req.params.albergueId]
    );
    res.json(rows.map(r => ({
      huespedId: r.huesped_id, estado: r.estado,
      separarComidas: r.separar_comidas, diasSeparar: r.dias_separar,
      motivoAusencia: r.motivo_ausencia, observaciones: r.observaciones,
      particularidades: r.particularidades,
      ultimaModificacion: r.ultima_modificacion,
      ultimoUsuario: r.ultimo_usuario,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update comedor entry — editable by ALL authenticated roles
// Validates the huesped belongs to an albergue the user has access to
router.put('/:huespedId', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const huespedId = req.params.huespedId;

    // Verify huesped exists and get albergue
    const { rows: huespedRows } = await pool.query(
      'SELECT albergue_id FROM huespedes WHERE id = $1', [huespedId]
    );
    if (huespedRows.length === 0) return res.status(404).json({ error: 'Huésped no encontrado' });

    // Verify user has access to the huesped's albergue
    const huespedAlbergueId = huespedRows[0].albergue_id;
    if (user.role !== 'admin') {
      const { rows: access } = await pool.query(
        'SELECT 1 FROM user_albergues WHERE user_email = $1 AND albergue_id = $2',
        [user.email, huespedAlbergueId]
      );
      if (access.length === 0) return res.status(403).json({ error: 'Sin acceso a este albergue' });
    }

    const { estado, separarComidas, diasSeparar, motivoAusencia, observaciones, particularidades } = req.body;
    const ultimoUsuario = user.nombre || user.email || 'desconocido';

    console.log(`[comedor PUT] user=${user.email} huespedId=${huespedId} fields=${Object.keys(req.body).join(',')}`);

    // Check if row exists
    const { rows: existing } = await pool.query(
      'SELECT huesped_id FROM comedor WHERE huesped_id = $1', [huespedId]
    );

    if (existing.length > 0) {
      // UPDATE: only set provided fields
      const sets = [];
      const vals = [];
      let idx = 1;

      if (estado !== undefined) { sets.push(`estado = $${idx++}`); vals.push(estado); }
      if (separarComidas !== undefined) { sets.push(`separar_comidas = $${idx++}`); vals.push(separarComidas); }
      if (diasSeparar !== undefined) { sets.push(`dias_separar = $${idx++}`); vals.push(diasSeparar); }
      if (motivoAusencia !== undefined) { sets.push(`motivo_ausencia = $${idx++}`); vals.push(motivoAusencia); }
      if (observaciones !== undefined) { sets.push(`observaciones = $${idx++}`); vals.push(observaciones); }
      if (particularidades !== undefined) { sets.push(`particularidades = $${idx++}`); vals.push(particularidades); }

      // Always update timestamp and user
      sets.push(`ultima_modificacion = NOW()`);
      sets.push(`ultimo_usuario = $${idx++}`);
      vals.push(ultimoUsuario);

      vals.push(huespedId);
      await pool.query(
        `UPDATE comedor SET ${sets.join(', ')} WHERE huesped_id = $${idx}`,
        vals
      );
    } else {
      // INSERT: use defaults for any missing field
      await pool.query(
        `INSERT INTO comedor (huesped_id, estado, separar_comidas, dias_separar, motivo_ausencia, observaciones, particularidades, ultima_modificacion, ultimo_usuario)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
        [
          huespedId,
          estado || 'Activo',
          separarComidas || ['Todas'],
          diasSeparar || ['Todos los días'],
          motivoAusencia || '',
          observaciones || '',
          particularidades || '',
          ultimoUsuario,
        ]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[comedor PUT] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
