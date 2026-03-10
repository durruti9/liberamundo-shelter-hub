-- Migration: Allow admin to create vacation/special records for employees
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS creado_por_admin BOOLEAN NOT NULL DEFAULT false;
