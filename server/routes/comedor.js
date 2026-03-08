import { Router } from 'express';
import pool from '../db.js';
import { requireAlbergueAccess, requireHuespedAccess } from '../middleware/albergueAccess.js';

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

// Update comedor entry (all roles can edit, but validates huésped belongs to user's albergue)
router.put('/:huespedId', requireHuespedAccess('huespedId'), async (req, res) => {
  try {
    const { estado, separarComidas, diasSeparar, motivoAusencia, observaciones, particularidades } = req.body;
    const ultimoUsuario = req.user?.nombre || req.user?.email || 'desconocido';
    await pool.query(
      `INSERT INTO comedor (huesped_id, estado, separar_comidas, dias_separar, motivo_ausencia, observaciones, particularidades, ultima_modificacion, ultimo_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
       ON CONFLICT (huesped_id) DO UPDATE SET
         estado = COALESCE($2, comedor.estado),
         separar_comidas = COALESCE($3, comedor.separar_comidas),
         dias_separar = COALESCE($4, comedor.dias_separar),
         motivo_ausencia = COALESCE($5, comedor.motivo_ausencia),
         observaciones = COALESCE($6, comedor.observaciones),
         particularidades = COALESCE($7, comedor.particularidades),
         ultima_modificacion = NOW(),
         ultimo_usuario = $8`,
      [req.params.huespedId, estado, separarComidas, diasSeparar, motivoAusencia, observaciones, particularidades, ultimoUsuario]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
