import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// All user management routes require admin role
router.use(requireRole('admin'));

router.get('/', async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.email, u.role, COALESCE(
        (SELECT json_agg(ua.albergue_id) FROM user_albergues ua WHERE ua.user_email = u.email), '[]'
      ) as albergue_ids
      FROM users u ORDER BY u.email
    `);
    const result = rows.map(u => ({
      email: u.email, role: u.role, password: '',
      albergueIds: u.albergue_ids || [],
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, role, albergueIds } = req.body;
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
    
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO users (email, password_hash, role, nombre) VALUES ($1, $2, $3, $4)',
      [email.trim(), hash, role, '']
    );
    
    // Assign albergues if provided
    if (Array.isArray(albergueIds) && albergueIds.length > 0) {
      for (const albId of albergueIds) {
        await client.query(
          'INSERT INTO user_albergues (user_email, albergue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [email.trim(), albId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese usuario ya existe' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update user albergue assignments
router.put('/:email/albergues', async (req, res) => {
  const client = await pool.connect();
  try {
    const { albergueIds } = req.body;
    const email = req.params.email;
    
    await client.query('BEGIN');
    await client.query('DELETE FROM user_albergues WHERE user_email = $1', [email]);
    if (Array.isArray(albergueIds)) {
      for (const albId of albergueIds) {
        await client.query(
          'INSERT INTO user_albergues (user_email, albergue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [email, albId]
        );
      }
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

router.put('/:email/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) return res.status(400).json({ error: 'Contraseña demasiado corta' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, req.params.email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:email', async (req, res) => {
  try {
    // Prevent deleting the last admin
    const { rows } = await pool.query("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'");
    const { rows: target } = await pool.query('SELECT role FROM users WHERE email = $1', [req.params.email]);
    if (target.length > 0 && target[0].role === 'admin' && parseInt(rows[0].cnt) <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
    }
    await pool.query('DELETE FROM users WHERE email = $1', [req.params.email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
