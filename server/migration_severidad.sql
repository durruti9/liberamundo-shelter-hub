-- Migration: Add severity column to incidencias
-- Run this SQL in your production PostgreSQL database

ALTER TABLE incidencias ADD COLUMN IF NOT EXISTS severidad TEXT NOT NULL DEFAULT 'S3';
