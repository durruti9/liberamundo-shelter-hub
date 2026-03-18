import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// --- Rate limiting: max 10 FAILED attempts per IP+email per 10 min ---
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getRateLimitKey(ip, email) {
  return `${ip}::${(email || '').toLowerCase().trim()}`;
}

function checkRateLimit(ip, email) {
  const now = Date.now();
  const key = getRateLimitKey(ip, email);
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    return true;
  }
  return record.count < RATE_LIMIT_MAX;
}

function recordFailedAttempt(ip, email) {
  const now = Date.now();
  const key = getRateLimitKey(ip, email);
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearAttempts(ip, email) {
  loginAttempts.delete(getRateLimitKey(ip, email));
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW) loginAttempts.delete(key);
  }
}, 10 * 60 * 1000);

router.post('/login', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const ipStr = typeof ip === 'string' ? ip : String(ip);

    const { email, password } = req.body;

    if (!checkRateLimit(ipStr, email)) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos.' });
    }

    let rows;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      rows = result.rows;
    } catch (dbErr) {
      console.error('[AUTH] DB error during login:', dbErr.message);
      return res.status(503).json({ error: 'Error de conexión con la base de datos. Inténtalo de nuevo.' });
    }

    if (rows.length === 0) {
      recordFailedAttempt(ipStr, email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      recordFailedAttempt(ipStr, email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Successful login — clear any failed attempts
    clearAttempts(ipStr, email);

    // Get assigned albergues
    let { rows: albergueRows } = await pool.query(
      'SELECT albergue_id FROM user_albergues WHERE user_email = $1', [email]
    );
    console.log(`[AUTH] User ${email} (${user.role}) login. Existing albergue assignments:`, albergueRows.map(r => r.albergue_id));

    // Auto-assign all albergues if user has none (safety net for users created before auto-assign fix)
    if (albergueRows.length === 0) {
      const { rows: allAlbs } = await pool.query('SELECT id FROM albergues');
      console.log(`[AUTH] No assignments found. All albergues in system:`, allAlbs.map(a => a.id));
      if (allAlbs.length > 0) {
        for (const alb of allAlbs) {
          await pool.query(
            'INSERT INTO user_albergues (user_email, albergue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [email, alb.id]
          );
        }
        albergueRows = allAlbs.map(a => ({ albergue_id: a.id }));
        console.log(`[AUTH] Auto-assigned albergues to ${email}:`, albergueRows.map(r => r.albergue_id));
      }
    }

    const albergueIds = albergueRows.map(r => r.albergue_id);
    console.log(`[AUTH] Final albergueIds for ${email}:`, albergueIds);

    // Log access
    const ua = req.headers['user-agent'] || '';
    try {
      await pool.query(
        'INSERT INTO access_logs (user_email, user_role, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [user.email, user.role, ipStr, ua]
      );
    } catch (logErr) {
      console.error('Error logging access:', logErr.message);
    }

    const isDefaultAdmin = user.email === 'admin';

    // Generate JWT token
    const token = generateToken({
      email: user.email,
      role: user.role,
      nombre: user.nombre,
    });

    res.json({
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      albergueIds,
      isDefaultAdmin,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency code: env var required, no fallback (fully hidden)
function getEmergencySecret() {
  return process.env.EMERGENCY_SECRET || null;
}

// Verify emergency code (no user creation, just validation)
router.post('/verify-emergency', async (req, res) => {
  try {
    const { secretCode } = req.body;
    const emergencySecret = getEmergencySecret();
    if (!emergencySecret || !secretCode || secretCode !== emergencySecret) {
      return res.status(403).json({ error: 'Código inválido' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency user creation (validates secret code server-side)
router.post('/emergency-create', async (req, res) => {
  try {
    const { secretCode, email, password, role } = req.body;
    
    const emergencySecret = getEmergencySecret();
    if (!emergencySecret || !secretCode || secretCode !== emergencySecret) {
      return res.status(403).json({ error: 'Código inválido' });
    }
    
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'Usuario requerido' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Contraseña mínimo 4 caracteres' });
    }
    const validRoles = ['admin', 'gestor', 'personal_albergue'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO users (email, password_hash, role, nombre) VALUES ($1, $2, $3, $4)',
        [email.trim(), hash, role, '']
      );
      // Auto-assign all albergues
      const { rows: allAlbs } = await client.query('SELECT id FROM albergues');
      for (const alb of allAlbs) {
        await client.query(
          'INSERT INTO user_albergues (user_email, albergue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [email.trim(), alb.id]
        );
      }
      await client.query('COMMIT');
      console.log(`[EMERGENCY] User ${email} created with role ${role}`);
      res.json({ ok: true });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Ese usuario ya existe' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
