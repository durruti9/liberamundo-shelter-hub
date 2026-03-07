-- Migration: Add admin observations and employee replies to tareas_dia
-- Run this on your production PostgreSQL database

-- Add new columns (safe to run multiple times thanks to IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tareas_dia' AND column_name = 'admin_obs') THEN
    ALTER TABLE tareas_dia ADD COLUMN admin_obs TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tareas_dia' AND column_name = 'respuesta_empleado') THEN
    ALTER TABLE tareas_dia ADD COLUMN respuesta_empleado TEXT NOT NULL DEFAULT '';
  END IF;
END $$;
