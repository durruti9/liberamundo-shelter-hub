import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Get assigned albergues
    const { rows: albergueRows } = await pool.query(
      'SELECT albergue_id FROM user_albergues WHERE user_email = $1', [email]
    );
    const albergueIds = albergueRows.map(r => r.albergue_id);

    // Log access
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    try {
      await pool.query(
        'INSERT INTO access_logs (user_email, user_role, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [user.email, user.role, typeof ip === 'string' ? ip : String(ip), ua]
      );
    } catch (logErr) {
      console.error('Error logging access:', logErr.message);
    }

    res.json({
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      albergueIds,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
