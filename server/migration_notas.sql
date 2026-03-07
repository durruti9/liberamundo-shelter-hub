-- Migration: Add notas table
CREATE TABLE IF NOT EXISTS notas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT '',
  contenido TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'default',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_user ON notas(user_email);
