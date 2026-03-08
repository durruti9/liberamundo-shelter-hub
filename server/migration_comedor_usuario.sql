-- Add ultimo_usuario column to comedor table
ALTER TABLE comedor ADD COLUMN IF NOT EXISTS ultimo_usuario TEXT;
