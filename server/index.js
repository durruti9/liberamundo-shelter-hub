import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import bcrypt from 'bcrypt';
import pool from './db.js';
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

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health check (tests DB connection)
app.get('/api/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/albergues', albergueRoutes);
app.use('/api/huespedes', huespedRoutes);
app.use('/api/comedor', comedorRoutes);
app.use('/api/llegadas', llegadaRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/sugerencias', sugerenciasRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/menu', menuRoutes);

// Catch-all for unknown API routes (return 404 JSON, NOT index.html)
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
      // Test connection
      await pool.query('SELECT 1');
      console.log('✅ Database connection established');

      // Run schema
      const initSQL = readFileSync(new URL('./init.sql', import.meta.url), 'utf8');
      await pool.query(initSQL);

      // Ensure default admin user exists with password "admin"
      const { rows } = await pool.query("SELECT email FROM users WHERE email = 'admin'");
      if (rows.length === 0) {
        const hash = await bcrypt.hash('admin', 10);
        await pool.query(
          "INSERT INTO users (email, password_hash, role, nombre) VALUES ('admin', $1, 'admin', '')",
          [hash]
        );
        console.log('✅ Default admin user created (admin/admin)');
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
  console.error('❌ Could not connect to database after all retries. Starting server anyway for health checks.');
  return false;
}

async function start() {
  await initDB();

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log(`🚀 Server running on port ${port}`));
}

start();
