-- Migration: Add unique constraint for per-task upsert (concurrency fix)
-- Run this on your production PostgreSQL database

-- Add unique constraint on (albergue_id, fecha, orden) for individual task upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tareas_dia_albergue_fecha_orden_key'
  ) THEN
    ALTER TABLE tareas_dia ADD CONSTRAINT tareas_dia_albergue_fecha_orden_key UNIQUE (albergue_id, fecha, orden);
  END IF;
END $$;
