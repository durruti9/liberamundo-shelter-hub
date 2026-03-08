import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();

// --- Rate limiting: max 5 attempts per IP per 15 min ---
const loginAttempts = new Map(); // ip -> { count, firstAttempt }
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

// Cleanup old entries every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

router.post('/login', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const ipStr = typeof ip === 'string' ? ip : String(ip);

    // Rate limit check
    if (!checkRateLimit(ipStr)) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
    }

    const { email, password } = req.body;
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

    // Check if this is the default admin account
    const isDefaultAdmin = user.email === 'admin';

    res.json({
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      albergueIds,
      isDefaultAdmin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
