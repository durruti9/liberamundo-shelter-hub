import { Router } from 'express';
import pool from '../db.js';
import { requireAlbergueAccess } from '../middleware/albergueAccess.js';

const router = Router();

const DEFAULT_CATEGORIES = [
  { nombre: 'Ropa y calzado', icono: 'Shirt', orden: 1 },
  { nombre: 'Higiene personal', icono: 'Droplets', orden: 2 },
  { nombre: 'Limpieza', icono: 'SprayCan', orden: 3 },
  { nombre: 'Alimentación', icono: 'Apple', orden: 4 },
  { nombre: 'Ropa de cama', icono: 'BedDouble', orden: 5 },
  { nombre: 'Material oficina', icono: 'Paperclip', orden: 6 },
  { nombre: 'Otros', icono: 'Package', orden: 7 },
];

// Ensure default categories exist for an albergue
async function ensureCategories(albergueId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as cnt FROM inventario_categorias WHERE albergue_id = $1',
    [albergueId]
  );
  if (parseInt(rows[0].cnt) === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await pool.query(
        'INSERT INTO inventario_categorias (albergue_id, nombre, icono, orden) VALUES ($1, $2, $3, $4)',
        [albergueId, cat.nombre, cat.icono, cat.orden]
      );
    }
  }
}

// GET categories
router.get('/:albergueId/categorias', requireAlbergueAccess(), async (req, res) => {
  try {
    await ensureCategories(req.params.albergueId);
    const { rows } = await pool.query(
      'SELECT * FROM inventario_categorias WHERE albergue_id = $1 ORDER BY orden, nombre',
      [req.params.albergueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST category
router.post('/:albergueId/categorias', requireAlbergueAccess(), async (req, res) => {
  try {
    const { nombre, icono } = req.body;
    const { rows: maxOrder } = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) + 1 as next FROM inventario_categorias WHERE albergue_id = $1',
      [req.params.albergueId]
    );
    const { rows } = await pool.query(
      'INSERT INTO inventario_categorias (albergue_id, nombre, icono, orden) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.albergueId, nombre, icono || 'Package', maxOrder[0].next]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category
router.delete('/categorias/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventario_categorias WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET items
router.get('/:albergueId/items', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.nombre as categoria_nombre 
       FROM inventario_items i 
       JOIN inventario_categorias c ON i.categoria_id = c.id
       WHERE i.albergue_id = $1 
       ORDER BY c.orden, i.nombre`,
      [req.params.albergueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST item
router.post('/:albergueId/items', requireAlbergueAccess(), async (req, res) => {
  try {
    const { categoria_id, nombre, unidad, stock_actual, stock_minimo, ubicacion, notas } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO inventario_items (albergue_id, categoria_id, nombre, unidad, stock_actual, stock_minimo, ubicacion, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.albergueId, categoria_id, nombre, unidad || 'unidades', stock_actual || 0, stock_minimo || 0, ubicacion || '', notas || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT item
router.put('/items/:id', async (req, res) => {
  try {
    const { nombre, unidad, stock_minimo, ubicacion, notas } = req.body;
    const { rows } = await pool.query(
      `UPDATE inventario_items SET nombre = COALESCE($1, nombre), unidad = COALESCE($2, unidad), 
       stock_minimo = COALESCE($3, stock_minimo), ubicacion = COALESCE($4, ubicacion), 
       notas = COALESCE($5, notas), updated_at = NOW() WHERE id = $6 RETURNING *`,
      [nombre, unidad, stock_minimo, ubicacion, notas, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
router.delete('/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventario_items WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST movement (entrada/salida)
router.post('/items/:itemId/movimiento', async (req, res) => {
  const client = await pool.connect();
  try {
    const { tipo, cantidad, motivo } = req.body;
    const usuario = req.user?.email || '';
    
    await client.query('BEGIN');
    
    // Insert movement
    await client.query(
      'INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario) VALUES ($1, $2, $3, $4, $5)',
      [req.params.itemId, tipo, cantidad, motivo || '', usuario]
    );
    
    // Update stock
    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    const { rows } = await client.query(
      'UPDATE inventario_items SET stock_actual = GREATEST(0, stock_actual + $1), updated_at = NOW() WHERE id = $2 RETURNING *',
      [delta, req.params.itemId]
    );
    
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET movements for item
router.get('/items/:itemId/movimientos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM inventario_movimientos WHERE item_id = $1 ORDER BY fecha DESC LIMIT 50',
      [req.params.itemId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET alerts (items below minimum stock)
router.get('/:albergueId/alertas', requireAlbergueAccess(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.nombre as categoria_nombre 
       FROM inventario_items i 
       JOIN inventario_categorias c ON i.categoria_id = c.id
       WHERE i.albergue_id = $1 AND i.stock_actual <= i.stock_minimo AND i.stock_minimo > 0
       ORDER BY (i.stock_actual / NULLIF(i.stock_minimo, 0)) ASC NULLS FIRST`,
      [req.params.albergueId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
