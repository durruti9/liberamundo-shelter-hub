import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Get access logs (last 500)
router.get('/', async (_, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, user_email, user_role, ip_address, user_agent, timestamp FROM access_logs ORDER BY timestamp DESC LIMIT 500'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all logs
router.delete('/', async (_, res) => {
  try {
    await pool.query('DELETE FROM access_logs');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
