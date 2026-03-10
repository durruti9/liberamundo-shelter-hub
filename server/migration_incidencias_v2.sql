-- Migration: Incidencias v2 - visibility, attachments, comments, multi-guest
-- Run this SQL in your production PostgreSQL database

ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS visibilidad TEXT NOT NULL DEFAULT 'todos';
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS adjunto TEXT DEFAULT '';
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS adjunto_nombre TEXT DEFAULT '';
ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS adjunto_tipo TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS incidencia_comentarios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incidencia_id TEXT NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  fecha TEXT NOT NULL,
  texto TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidencia_comentarios ON incidencia_comentarios(incidencia_id);
