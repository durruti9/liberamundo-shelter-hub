import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import albergueRoutes from './routes/albergues.js';
import huespedRoutes from './routes/huespedes.js';
import comedorRoutes from './routes/comedor.js';
import llegadaRoutes from './routes/llegadas.js';
import incidenciaRoutes from './routes/incidencias.js';
import boardRoutes from './routes/board.js';
import userRoutes from './routes/users.js';
import tareasRoutes from './routes/tareas.js';
import sugerenciasRoutes from './routes/sugerencias.js';
import notasRoutes from './routes/notas.js';
import menuRoutes from './routes/menu.js';
import accessLogRoutes from './routes/access-logs.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health check (public, no auth)
app.get('/api/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Auth routes (public - login)
app.use('/api/auth', authRoutes);

// Sugerencias public endpoint (no auth needed for guest submissions)
app.use('/api/sugerencias', sugerenciasRoutes);

// All other API routes require JWT
app.use('/api/albergues', requireAuth, albergueRoutes);
app.use('/api/huespedes', requireAuth, huespedRoutes);
app.use('/api/comedor', requireAuth, comedorRoutes);
app.use('/api/llegadas', requireAuth, llegadaRoutes);
app.use('/api/incidencias', requireAuth, incidenciaRoutes);
app.use('/api/board', requireAuth, boardRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/tareas', requireAuth, tareasRoutes);
app.use('/api/notas', requireAuth, notasRoutes);
app.use('/api/menu', requireAuth, menuRoutes);
app.use('/api/access-logs', requireAuth, accessLogRoutes);

// Catch-all for unknown API routes
app.all('/api/*', (_, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Serve static frontend
app.use(express.static('/app/public'));
app.get('*', (_, res) => {
  res.sendFile('/app/public/index.html');
});

// Init DB with retries
async function initDB(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connection established');

      const initSQL = readFileSync(new URL('./init.sql', import.meta.url), 'utf8');
      await pool.query(initSQL);

      // Only create default admin on first install
      const { rows: userCount } = await pool.query("SELECT COUNT(*) as cnt FROM users");
      if (parseInt(userCount[0].cnt) === 0) {
        const hash = await bcrypt.hash('admin', 10);
        await pool.query(
          "INSERT INTO users (email, password_hash, role, nombre) VALUES ('admin', $1, 'admin', '')",
          [hash]
        );
        console.log('✅ Default admin user created (first install)');
      } else {
        console.log('✅ Users table already has data, skipping default admin');
      }

      console.log('✅ Database initialized');
      return true;
    } catch (err) {
      console.error(`❌ DB init attempt ${i + 1}/${retries}: ${err.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  console.error('❌ Could not connect to database after all retries.');
  return false;
}

async function start() {
  await initDB();
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log(`🚀 Server running on port ${port}`));
}

start();
