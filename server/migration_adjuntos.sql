-- Migration: Add attachment columns to sugerencias table
-- Run this SQL in your production PostgreSQL database

ALTER TABLE sugerencias ADD COLUMN IF NOT EXISTS adjunto TEXT DEFAULT '';
ALTER TABLE sugerencias ADD COLUMN IF NOT EXISTS adjunto_nombre TEXT DEFAULT '';
ALTER TABLE sugerencias ADD COLUMN IF NOT EXISTS adjunto_tipo TEXT DEFAULT '';
