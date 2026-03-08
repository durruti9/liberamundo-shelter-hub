import { Router } from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// List all albergues (any authenticated user)
router.get('/', async (_, res) => {
  try {
    const { rows: albergues } = await pool.query('SELECT * FROM albergues ORDER BY nombre');
    const { rows: rooms } = await pool.query('SELECT * FROM rooms ORDER BY id');
    const result = albergues.map(a => ({
      ...a,
      rooms: rooms.filter(r => r.albergue_id === a.id).map(r => ({
        id: r.id, nombre: r.nombre, camas: r.camas, ultimaLimpieza: r.ultima_limpieza || null,
      })),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create albergue (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, rooms: initialRooms = [] } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }
    const id = crypto.randomUUID();
    
    await client.query('BEGIN');
    await client.query('INSERT INTO albergues (id, nombre) VALUES ($1, $2)', [id, nombre.trim()]);
    for (const r of initialRooms) {
      await client.query('INSERT INTO rooms (id, albergue_id, nombre, camas) VALUES ($1, $2, $3, $4)',
        [r.id, id, r.nombre, r.camas]);
    }
    await client.query('COMMIT');
    
    res.json({ id, nombre: nombre.trim(), rooms: initialRooms });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update albergue name (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }
    await pool.query('UPDATE albergues SET nombre = $1 WHERE id = $2', [nombre.trim(), req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete albergue (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    // Prevent deleting the last albergue
    const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM albergues');
    if (parseInt(rows[0].cnt) <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último albergue' });
    }
    await pool.query('DELETE FROM albergues WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update rooms for albergue (admin only)
router.put('/:id/rooms', requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { rooms } = req.body;
    const albergueId = req.params.id;
    
    await client.query('BEGIN');
    await client.query('DELETE FROM rooms WHERE albergue_id = $1', [albergueId]);
    for (const r of rooms) {
      await client.query(
        'INSERT INTO rooms (id, albergue_id, nombre, camas, ultima_limpieza) VALUES ($1, $2, $3, $4, $5)',
        [r.id, albergueId, r.nombre, r.camas, r.ultimaLimpieza || null]
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

// Update cleaning date for a room (admin + personal_albergue)
router.put('/:id/rooms/:roomId/limpieza', requireRole('admin', 'personal_albergue'), async (req, res) => {
  try {
    const { ultimaLimpieza } = req.body;
    const { id: albergueId, roomId } = req.params;
    console.log(`[limpieza] Updating room ${roomId} in albergue ${albergueId} to ${ultimaLimpieza}`);
    const result = await pool.query(
      'UPDATE rooms SET ultima_limpieza = $1 WHERE id = $2 AND albergue_id = $3',
      [ultimaLimpieza || null, roomId, albergueId]
    );
    console.log(`[limpieza] Rows updated: ${result.rowCount}`);
    if (result.rowCount === 0) {
      // Try without albergue_id filter in case of mismatch
      const result2 = await pool.query(
        'UPDATE rooms SET ultima_limpieza = $1 WHERE id = $2',
        [ultimaLimpieza || null, roomId]
      );
      console.log(`[limpieza] Retry without albergue filter - rows updated: ${result2.rowCount}`);
      if (result2.rowCount === 0) {
        return res.status(404).json({ error: `Room ${roomId} not found` });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[limpieza] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
