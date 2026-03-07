-- Migration: Add sugerencias table
-- Run this SQL in your production PostgreSQL database

CREATE TABLE IF NOT EXISTS sugerencias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  anonimo BOOLEAN NOT NULL DEFAULT false,
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  mensaje TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leida BOOLEAN NOT NULL DEFAULT false,
  respuesta TEXT NOT NULL DEFAULT '',
  traduccion TEXT NOT NULL DEFAULT ''
);
