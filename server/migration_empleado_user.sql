-- Migration: Link empleados_horario to user accounts
ALTER TABLE empleados_horario ADD COLUMN IF NOT EXISTS user_email TEXT REFERENCES users(email) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_empleados_horario_user ON empleados_horario(user_email);
