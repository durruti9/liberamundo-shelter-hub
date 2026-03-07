-- Add resuelta column to sugerencias table
ALTER TABLE sugerencias ADD COLUMN IF NOT EXISTS resuelta BOOLEAN DEFAULT FALSE;
