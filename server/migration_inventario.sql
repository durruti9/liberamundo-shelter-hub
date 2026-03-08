-- Inventario / Almacén
CREATE TABLE IF NOT EXISTS inventario_categorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT 'Package',
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventario_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES inventario_categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'unidades',
  stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ubicacion TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_items_albergue ON inventario_items(albergue_id);
CREATE INDEX IF NOT EXISTS idx_inventario_items_categoria ON inventario_items(categoria_id);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id TEXT NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'entrada', -- 'entrada' | 'salida'
  cantidad NUMERIC(10,2) NOT NULL,
  motivo TEXT NOT NULL DEFAULT '',
  usuario TEXT NOT NULL DEFAULT '',
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_mov_item ON inventario_movimientos(item_id);
CREATE INDEX IF NOT EXISTS idx_inventario_mov_fecha ON inventario_movimientos(fecha DESC);

-- Seed default categories
-- (will be inserted per albergue when needed)
