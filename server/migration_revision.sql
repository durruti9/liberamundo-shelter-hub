-- Migration: Add review flag columns to registros_horario
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS marcado_revision BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE registros_horario ADD COLUMN IF NOT EXISTS motivo_revision TEXT NOT NULL DEFAULT '';
