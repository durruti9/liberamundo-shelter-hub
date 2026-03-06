import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT email, role, nombre FROM users ORDER BY email');
    // Get albergue assignments
    const { rows: assignments } = await pool.query('SELECT * FROM user_albergues');
    const result = rows.map(u => ({
      email: u.email, role: u.role, nombre: u.nombre, password: '',
      albergueIds: assignments.filter(a => a.user_email === u.email).map(a => a.albergue_id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email, password, role, nombre, albergueIds = [] } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, role, nombre) VALUES ($1, $2, $3, $4)',
      [email, hash, role, nombre]
    );
    for (const aid of albergueIds) {
      await pool.query('INSERT INTO user_albergues (user_email, albergue_id) VALUES ($1, $2)', [email, aid]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    await pool.query('DELETE FROM users WHERE email = $1', [req.params.email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
