import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// List all albergues
router.get('/', async (_, res) => {
  try {
    const { rows: albergues } = await pool.query('SELECT * FROM albergues ORDER BY nombre');
    const { rows: rooms } = await pool.query('SELECT * FROM rooms ORDER BY id');
    const result = albergues.map(a => ({
      ...a,
      rooms: rooms.filter(r => r.albergue_id === a.id).map(r => ({ id: r.id, nombre: r.nombre, camas: r.camas })),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create albergue
router.post('/', async (req, res) => {
  try {
    const { nombre, rooms: initialRooms = [] } = req.body;
    const id = crypto.randomUUID();
    await pool.query('INSERT INTO albergues (id, nombre) VALUES ($1, $2)', [id, nombre]);
    for (const r of initialRooms) {
      await pool.query('INSERT INTO rooms (id, albergue_id, nombre, camas) VALUES ($1, $2, $3, $4)',
        [r.id, id, r.nombre, r.camas]);
    }
    res.json({ id, nombre, rooms: initialRooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update albergue name
router.put('/:id', async (req, res) => {
  try {
    const { nombre } = req.body;
    await pool.query('UPDATE albergues SET nombre = $1 WHERE id = $2', [nombre, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete albergue
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM albergues WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update rooms for albergue
router.put('/:id/rooms', async (req, res) => {
  try {
    const { rooms } = req.body;
    const albergueId = req.params.id;
    await pool.query('DELETE FROM rooms WHERE albergue_id = $1', [albergueId]);
    for (const r of rooms) {
      await pool.query('INSERT INTO rooms (id, albergue_id, nombre, camas) VALUES ($1, $2, $3, $4)',
        [r.id, albergueId, r.nombre, r.camas]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
