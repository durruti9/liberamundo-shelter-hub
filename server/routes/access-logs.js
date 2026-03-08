import { Router } from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Only admin can view/clear access logs
router.get('/', requireRole('admin'), async (_, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, user_email, user_role, ip_address, user_agent, timestamp FROM access_logs ORDER BY timestamp DESC LIMIT 500'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', requireRole('admin'), async (_, res) => {
  try {
    await pool.query('DELETE FROM access_logs');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
