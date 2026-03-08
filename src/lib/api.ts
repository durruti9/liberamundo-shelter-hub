import type { Albergue, Room, Huesped, Incidencia, ProximaLlegada, ComedorEntry, BoardMessage, UserRole } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setToken(token: string) {
  localStorage.setItem('authToken', token);
}

export function clearToken() {
  localStorage.removeItem('authToken');
}

// --- Typed response interfaces ---

interface LoginResponse {
  email: string;
  role: string;
  nombre: string;
  albergueIds: string[];
  isDefaultAdmin?: boolean;
  token: string;
}

interface OkResponse {
  ok: boolean;
}

interface HealthResponse {
  status: string;
}

interface UserRecord {
  email: string;
  role: UserRole;
  nombre: string;
  albergueIds?: string[];
}

interface AlbergueRecord {
  id: string;
  nombre: string;
  rooms: Room[];
}

interface ComedorRecord {
  huesped_id: string;
  estado: string;
  separar_comidas: string[];
  dias_separar: string[];
  motivo_ausencia: string;
  observaciones: string;
  particularidades: string;
  ultima_modificacion: string;
  ultimo_usuario?: string;
}

interface MenuInfo {
  exists: boolean;
  filename?: string;
  size?: number;
  uploaded_at?: string;
}

interface TareaDia {
  id: string;
  fecha: string;
  tareaId: string;
  tareaNombre: string;
  estado: string;
  turno: string;
  hechoPor: string;
  observacion: string;
  orden: number;
  adminObs: string;
  respuestaEmpleado: string;
}

interface NotaRecord {
  id: string;
  user_email: string;
  titulo: string;
  contenido: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface SugerenciaRecord {
  id: string;
  albergue_id: string;
  nombre: string;
  mensaje: string;
  tipo: string;
  estado: string;
  created_at: string;
  respuesta?: string;
}

interface AccessLogRecord {
  id: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface EmpleadoHorario {
  id: string;
  albergue_id: string;
  nombre: string;
  puesto: string;
  tipo_jornada: string;
  horas_semanales: number;
  activo: boolean;
}

interface RegistroHorario {
  id: string;
  empleado_id: string;
  fecha: string;
  entrada: string;
  salida: string;
  tipo: string;
  notas: string;
}

interface VacacionesSaldo {
  total: number;
  usados: number;
  disponibles: number;
}

interface ConfigEmpresa {
  nombre_empresa: string;
  cif: string;
  centro_trabajo: string;
}

interface AuditoriaRecord {
  id: string;
  accion: string;
  usuario: string;
  detalles: string;
  created_at: string;
}

interface InventarioCategoria {
  id: string;
  albergue_id: string;
  nombre: string;
  icono: string;
  orden: number;
}

interface InventarioItem {
  id: string;
  albergue_id: string;
  categoria_id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string;
  notas: string;
  categoria_nombre?: string;
  updated_at?: string;
}

interface InventarioMovimiento {
  id: string;
  item_id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  usuario: string;
  fecha: string;
}

interface ConsumoMensual {
  mes: string;
  item_nombre: string;
  categoria_nombre: string;
  total_salidas: number;
  total_entradas: number;
}

// --- Request helper ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`[API] ${options?.method || 'GET'} ${path} → ${res.status}`, err);
    const error = new Error(err.error || res.statusText) as Error & { status: number; code: string; debug: unknown };
    error.status = res.status;
    error.code = err.code;
    error.debug = err.debug;
    
    // Auto-logout on expired/invalid token
    if (res.status === 401 && err.code === 'TOKEN_EXPIRED') {
      clearToken();
      localStorage.removeItem('auth');
      window.location.reload();
    }
    
    throw error;
  }

  // Validate response is actually JSON
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`[API] ${options?.method || 'GET'} ${path} → unexpected content-type: ${contentType}`);
    throw new Error(`API returned non-JSON response for ${path}`);
  }

  return res.json();
}

export const api = {
  // Health
  health: () => request<HealthResponse>('/health'),

  // Auth
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  emergencyCreateUser: (secretCode: string, email: string, password: string, role: string) =>
    request<OkResponse>('/auth/emergency-create', {
      method: 'POST', body: JSON.stringify({ secretCode, email, password, role }),
    }),
  verifyEmergencyCode: (secretCode: string) =>
    request<OkResponse>('/auth/verify-emergency', {
      method: 'POST', body: JSON.stringify({ secretCode }),
    }),

  // Albergues
  getAlbergues: () => request<AlbergueRecord[]>('/albergues'),
  createAlbergue: (nombre: string, rooms: Room[] = []) =>
    request<AlbergueRecord>('/albergues', { method: 'POST', body: JSON.stringify({ nombre, rooms }) }),
  updateAlbergueName: (id: string, nombre: string) =>
    request<AlbergueRecord>(`/albergues/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteAlbergue: (id: string) =>
    request<OkResponse>(`/albergues/${id}`, { method: 'DELETE' }),
  updateRooms: (albergueId: string, rooms: Room[]) =>
    request<OkResponse>(`/albergues/${albergueId}/rooms`, { method: 'PUT', body: JSON.stringify({ rooms }) }),
  updateRoomCleaning: (albergueId: string, roomId: string, ultimaLimpieza: string) =>
    request<OkResponse>(`/albergues/${albergueId}/rooms/${roomId}/limpieza`, { method: 'PUT', body: JSON.stringify({ ultimaLimpieza }) }),

  // Huespedes
  getHuespedes: (albergueId: string) => request<Huesped[]>(`/huespedes/${albergueId}`),
  checkIn: (albergueId: string, data: Partial<Huesped>) =>
    request<Huesped>(`/huespedes/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editHuesped: (id: string, data: Partial<Huesped>) =>
    request<Huesped>(`/huespedes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHuesped: (id: string) =>
    request<OkResponse>(`/huespedes/${id}`, { method: 'DELETE' }),
  checkOut: (id: string, fecha: string) =>
    request<OkResponse>(`/huespedes/${id}/checkout`, { method: 'POST', body: JSON.stringify({ fecha }) }),
  reincorporar: (id: string, habitacion: string, cama: number) =>
    request<Huesped>(`/huespedes/${id}/reincorporar`, { method: 'POST', body: JSON.stringify({ habitacion, cama }) }),

  // Comedor
  getComedor: (albergueId: string) => request<ComedorRecord[]>(`/comedor/${albergueId}`),
  updateComedor: (huespedId: string, data: Partial<ComedorEntry>) =>
    request<ComedorRecord>(`/comedor/${huespedId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Menu
  getMenuInfo: (albergueId: string) => request<MenuInfo>(`/menu/${albergueId}`),
  uploadMenu: async (albergueId: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/menu/${albergueId}`, {
      method: 'POST',
      body: formData,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json() as Promise<OkResponse>;
  },
  getMenuDownloadUrl: (albergueId: string) => `${API_BASE}/menu/${albergueId}/download`,
  deleteMenu: (albergueId: string) =>
    request<OkResponse>(`/menu/${albergueId}`, { method: 'DELETE' }),

  // Llegadas
  getLlegadas: (albergueId: string) => request<ProximaLlegada[]>(`/llegadas/${albergueId}`),
  addLlegada: (albergueId: string, data: Partial<ProximaLlegada>) =>
    request<ProximaLlegada>(`/llegadas/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editLlegada: (id: string, data: Partial<ProximaLlegada>) =>
    request<ProximaLlegada>(`/llegadas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLlegada: (id: string) =>
    request<OkResponse>(`/llegadas/${id}`, { method: 'DELETE' }),

  // Incidencias
  getIncidencias: (albergueId: string) => request<Incidencia[]>(`/incidencias/${albergueId}`),
  addIncidencia: (albergueId: string, data: Partial<Incidencia>) =>
    request<Incidencia>(`/incidencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  toggleIncidencia: (id: string) =>
    request<Incidencia>(`/incidencias/${id}/toggle`, { method: 'PUT' }),
  deleteIncidencia: (id: string) =>
    request<OkResponse>(`/incidencias/${id}`, { method: 'DELETE' }),

  // Board
  getBoardMessages: (albergueId: string) => request<BoardMessage[]>(`/board/${albergueId}`),
  addBoardMessage: (albergueId: string, data: Partial<BoardMessage>) =>
    request<BoardMessage>(`/board/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  addBoardReply: (messageId: string, data: { autor: string; texto: string }) =>
    request<BoardMessage>(`/board/${messageId}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  resolveBoardMessage: (messageId: string, data: { autor: string; descripcion: string }) =>
    request<BoardMessage>(`/board/${messageId}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBoardMessage: (messageId: string) =>
    request<OkResponse>(`/board/${messageId}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request<UserRecord[]>('/users'),
  addUser: (data: { email: string; password: string; role: UserRole; albergueIds?: string[] }) =>
    request<UserRecord>('/users', { method: 'POST', body: JSON.stringify(data) }),
  removeUser: (email: string) => request<OkResponse>(`/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  changePassword: (email: string, newPassword: string) =>
    request<OkResponse>(`/users/${encodeURIComponent(email)}/password`, { method: 'PUT', body: JSON.stringify({ password: newPassword }) }),
  updateUserAlbergues: (email: string, albergueIds: string[]) =>
    request<OkResponse>(`/users/${encodeURIComponent(email)}/albergues`, { method: 'PUT', body: JSON.stringify({ albergueIds }) }),

  // Tareas Empleados
  getTareasDia: (albergueId: string, start: string, end: string) =>
    request<TareaDia[]>(`/tareas/${albergueId}?start=${start}&end=${end}`),
  saveTareasDia: (albergueId: string, fecha: string, tareas: TareaDia[]) =>
    request<OkResponse>(`/tareas/${albergueId}/${fecha}`, { method: 'POST', body: JSON.stringify({ tareas }) }),

  // Notas
  getNotas: (userEmail: string) => request<NotaRecord[]>(`/notas/${encodeURIComponent(userEmail)}`),
  addNota: (userEmail: string, data: Partial<NotaRecord>) =>
    request<NotaRecord>(`/notas/${encodeURIComponent(userEmail)}`, { method: 'POST', body: JSON.stringify(data) }),
  updateNota: (id: string, data: Partial<NotaRecord>) =>
    request<NotaRecord>(`/notas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNota: (id: string) =>
    request<OkResponse>(`/notas/${id}`, { method: 'DELETE' }),

  // Sugerencias
  getSugerencias: (albergueId: string) => request<SugerenciaRecord[]>(`/sugerencias/${albergueId}`),
  addSugerencia: (albergueId: string, data: Partial<SugerenciaRecord>) =>
    request<SugerenciaRecord>(`/sugerencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSugerencia: (id: string, data: Partial<SugerenciaRecord>) =>
    request<SugerenciaRecord>(`/sugerencias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSugerencia: (id: string) =>
    request<OkResponse>(`/sugerencias/${id}`, { method: 'DELETE' }),
  bulkDeleteSugerencias: (ids: string[]) =>
    request<OkResponse>(`/sugerencias/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  clearSugerencias: (albergueId: string) =>
    request<OkResponse>(`/sugerencias/clear/${albergueId}`, { method: 'DELETE' }),

  // Access Logs
  getAccessLogs: () => request<AccessLogRecord[]>('/access-logs'),
  clearAccessLogs: () => request<OkResponse>('/access-logs', { method: 'DELETE' }),

  // Debug
  getDebugStatus: () => request<{ albergues: AlbergueRecord[]; users: UserRecord[]; userAlbergues: { user_email: string; albergue_id: string }[]; huespedesCount: { albergue_id: string; total: string }[]; timestamp: string }>('/debug/status'),

  // Registro Horario
  getEmpleadosHorario: (albergueId: string) => request<EmpleadoHorario[]>(`/registro-horario/empleados/${albergueId}`),
  addEmpleadoHorario: (albergueId: string, data: Partial<EmpleadoHorario>) =>
    request<EmpleadoHorario>(`/registro-horario/empleados/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateEmpleadoHorario: (id: string, data: Partial<EmpleadoHorario>) =>
    request<EmpleadoHorario>(`/registro-horario/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmpleadoHorario: (id: string) =>
    request<OkResponse>(`/registro-horario/empleados/${id}`, { method: 'DELETE' }),
  getRegistrosHorario: (empleadoId: string, start: string, end: string) =>
    request<RegistroHorario[]>(`/registro-horario/registros/${empleadoId}?start=${start}&end=${end}`),
  saveRegistroHorario: (empleadoId: string, data: Partial<RegistroHorario>) =>
    request<OkResponse>(`/registro-horario/registros/${empleadoId}`, { method: 'POST', body: JSON.stringify(data) }),
  getVacacionesSaldo: (empleadoId: string, anio: number) =>
    request<VacacionesSaldo>(`/registro-horario/vacaciones/${empleadoId}/${anio}`),
  updateVacacionesSaldo: (empleadoId: string, anio: number, data: Partial<VacacionesSaldo>) =>
    request<OkResponse>(`/registro-horario/vacaciones/${empleadoId}/${anio}`, { method: 'PUT', body: JSON.stringify(data) }),
  getConfigEmpresa: (albergueId: string) =>
    request<ConfigEmpresa>(`/registro-horario/config-empresa/${albergueId}`),
  updateConfigEmpresa: (albergueId: string, data: Partial<ConfigEmpresa>) =>
    request<OkResponse>(`/registro-horario/config-empresa/${albergueId}`, { method: 'PUT', body: JSON.stringify(data) }),
  logAuditoria: (data: { accion: string; usuario: string; detalles: string }) =>
    request<OkResponse>(`/registro-horario/auditoria`, { method: 'POST', body: JSON.stringify(data) }),
  getAuditoria: (albergueId: string) =>
    request<AuditoriaRecord[]>(`/registro-horario/auditoria/${albergueId}`),

  // Inventario
  getInventarioCategorias: (albergueId: string) => request<InventarioCategoria[]>(`/inventario/${albergueId}/categorias`),
  addInventarioCategoria: (albergueId: string, data: { nombre: string; icono?: string }) =>
    request<InventarioCategoria>(`/inventario/${albergueId}/categorias`, { method: 'POST', body: JSON.stringify(data) }),
  deleteInventarioCategoria: (id: string) =>
    request<OkResponse>(`/inventario/categorias/${id}`, { method: 'DELETE' }),
  getInventarioItems: (albergueId: string) => request<InventarioItem[]>(`/inventario/${albergueId}/items`),
  addInventarioItem: (albergueId: string, data: Partial<InventarioItem>) =>
    request<InventarioItem>(`/inventario/${albergueId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateInventarioItem: (id: string, data: Partial<InventarioItem>) =>
    request<InventarioItem>(`/inventario/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventarioItem: (id: string) =>
    request<OkResponse>(`/inventario/items/${id}`, { method: 'DELETE' }),
  addInventarioMovimiento: (itemId: string, data: { tipo: 'entrada' | 'salida'; cantidad: number; motivo?: string }) =>
    request<InventarioItem>(`/inventario/items/${itemId}/movimiento`, { method: 'POST', body: JSON.stringify(data) }),
  getInventarioMovimientos: (itemId: string) => request<InventarioMovimiento[]>(`/inventario/items/${itemId}/movimientos`),
  getInventarioAlertas: (albergueId: string) => request<InventarioItem[]>(`/inventario/${albergueId}/alertas`),
  getInventarioConsumoMensual: (albergueId: string) => request<ConsumoMensual[]>(`/inventario/${albergueId}/consumo-mensual`),
};

// Check if API is available
export async function isApiAvailable(): Promise<boolean> {
  try {
    await api.health();
    return true;
  } catch {
    return false;
  }
}
