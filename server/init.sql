-- LiberaMundo Database Schema

CREATE TABLE IF NOT EXISTS albergues (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT NOT NULL,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  camas INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (id, albergue_id)
);

CREATE TABLE IF NOT EXISTS huespedes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nie TEXT NOT NULL DEFAULT '',
  nacionalidad TEXT NOT NULL DEFAULT '',
  idioma TEXT NOT NULL DEFAULT '',
  dieta TEXT NOT NULL DEFAULT 'Omnívora estándar',
  fecha_entrada TEXT NOT NULL,
  fecha_checkout TEXT,
  notas TEXT NOT NULL DEFAULT '',
  habitacion TEXT NOT NULL,
  cama INTEGER NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS comedor (
  huesped_id TEXT PRIMARY KEY REFERENCES huespedes(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'Activo',
  separar_comidas TEXT[] NOT NULL DEFAULT ARRAY['Todas'],
  dias_separar TEXT[] NOT NULL DEFAULT ARRAY['Todos los días'],
  motivo_ausencia TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT '',
  particularidades TEXT NOT NULL DEFAULT '',
  ultima_modificacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS llegadas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nie TEXT NOT NULL DEFAULT '',
  nacionalidad TEXT NOT NULL DEFAULT '',
  idioma TEXT NOT NULL DEFAULT '',
  dieta TEXT NOT NULL DEFAULT 'Omnívora estándar',
  fecha_llegada TEXT NOT NULL,
  notas TEXT NOT NULL DEFAULT '',
  habitacion_asignada TEXT,
  cama_asignada INTEGER
);

CREATE TABLE IF NOT EXISTS incidencias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  huesped_id TEXT NOT NULL,
  huesped_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'other',
  descripcion TEXT NOT NULL,
  fecha TEXT NOT NULL,
  resuelta BOOLEAN NOT NULL DEFAULT false,
  creado_por TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'personal_albergue',
  nombre TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_albergues (
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  PRIMARY KEY (user_email, albergue_id)
);

CREATE TABLE IF NOT EXISTS board_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'instrucciones',
  autor TEXT NOT NULL,
  fecha TEXT NOT NULL,
  texto TEXT NOT NULL,
  visibilidad TEXT NOT NULL DEFAULT 'todos',
  resuelta BOOLEAN NOT NULL DEFAULT false,
  resolucion_autor TEXT,
  resolucion_fecha TEXT,
  resolucion_descripcion TEXT
);

CREATE TABLE IF NOT EXISTS board_replies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES board_messages(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  fecha TEXT NOT NULL,
  texto TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tareas_dia (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  tarea_id TEXT NOT NULL,
  tarea_nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  turno TEXT NOT NULL DEFAULT 'mañana',
  hecho_por TEXT NOT NULL DEFAULT '',
  observacion TEXT NOT NULL DEFAULT '',
  orden INTEGER NOT NULL DEFAULT 0,
  admin_obs TEXT NOT NULL DEFAULT '',
  respuesta_empleado TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tareas_dia_albergue_fecha ON tareas_dia(albergue_id, fecha);

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
  traduccion TEXT NOT NULL DEFAULT '',
  resuelta BOOLEAN NOT NULL DEFAULT false,
  adjunto TEXT DEFAULT '',
  adjunto_nombre TEXT DEFAULT '',
  adjunto_tipo TEXT DEFAULT ''
);

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

-- Seed default albergue and admin user
INSERT INTO albergues (id, nombre) VALUES ('default', 'Albergue LiberaMundo') ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, albergue_id, nombre, camas) VALUES
  ('1.1', 'default', 'Habitación 1.1', 2),
  ('1.2', 'default', 'Habitación 1.2', 2),
  ('1.3', 'default', 'Habitación 1.3', 4),
  ('2.1', 'default', 'Habitación 2.1', 5),
  ('2.2', 'default', 'Habitación 2.2', 4),
  ('2.3', 'default', 'Habitación 2.3', 4)
ON CONFLICT DO NOTHING;

-- Default admin user is created dynamically by server/index.js on startup (admin/admin)

CREATE TABLE IF NOT EXISTS access_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp DESC);

-- Registro Horario Empleados
CREATE TABLE IF NOT EXISTS empleados_horario (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  albergue_id TEXT NOT NULL REFERENCES albergues(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  jornada_diaria_horas NUMERIC(4,2) NOT NULL DEFAULT 8,
  vacaciones_anuales INTEGER NOT NULL DEFAULT 22,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registros_horario (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  empleado_id TEXT NOT NULL REFERENCES empleados_horario(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'trabajado',
  entrada_manana TIME,
  salida_manana TIME,
  entrada_tarde TIME,
  salida_tarde TIME,
  entrada_noche TIME,
  salida_noche TIME,
  pausa_min INTEGER NOT NULL DEFAULT 0,
  horas_ordinarias NUMERIC(5,2) NOT NULL DEFAULT 0,
  horas_extra NUMERIC(5,2) NOT NULL DEFAULT 0,
  horas_complementarias NUMERIC(5,2) NOT NULL DEFAULT 0,
  horas_vacaciones NUMERIC(3,1) NOT NULL DEFAULT 0,
  horas_totales NUMERIC(5,2) NOT NULL DEFAULT 0,
  observaciones TEXT NOT NULL DEFAULT '',
  firma_data TEXT NOT NULL DEFAULT '',
  firmado_en TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empleado_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_registros_horario_emp_fecha ON registros_horario(empleado_id, fecha);

CREATE TABLE IF NOT EXISTS vacaciones_saldo (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  empleado_id TEXT NOT NULL REFERENCES empleados_horario(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL,
  asignadas INTEGER NOT NULL DEFAULT 22,
  consumidas NUMERIC(4,1) NOT NULL DEFAULT 0,
  UNIQUE(empleado_id, anio)
);
