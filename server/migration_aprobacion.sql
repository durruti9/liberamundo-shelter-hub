-- Migration: Add approval system for past-day edits
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS pendiente_aprobacion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS aprobado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS fecha_original_fichada DATE;
