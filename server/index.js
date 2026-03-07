import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
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
import recoveryRoutes from './routes/recovery.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Routes
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
app.use('/api/recovery', recoveryRoutes);

// Serve static frontend
app.use(express.static('/app/public'));
app.get('*', (_, res) => {
  res.sendFile('/app/public/index.html');
});

// Init DB and start
async function start() {
  try {
    const initSQL = readFileSync(new URL('./init.sql', import.meta.url), 'utf8');
    await pool.query(initSQL);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
}

start();
