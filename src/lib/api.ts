import type { Room, UserRole } from '@/types';

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
    
    if (res.status === 401 && err.code === 'TOKEN_EXPIRED') {
      clearToken();
      localStorage.removeItem('auth');
      window.location.reload();
    }
    
    throw error;
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`[API] ${options?.method || 'GET'} ${path} → unexpected content-type: ${contentType}`);
    throw new Error(`API returned non-JSON response for ${path}`);
  }

  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

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
  getAlbergues: () => request<Any[]>('/albergues'),
  createAlbergue: (nombre: string, rooms: Room[] = []) =>
    request<Any>('/albergues', { method: 'POST', body: JSON.stringify({ nombre, rooms }) }),
  updateAlbergueName: (id: string, nombre: string) =>
    request<Any>(`/albergues/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteAlbergue: (id: string) =>
    request<OkResponse>(`/albergues/${id}`, { method: 'DELETE' }),
  updateRooms: (albergueId: string, rooms: Room[]) =>
    request<OkResponse>(`/albergues/${albergueId}/rooms`, { method: 'PUT', body: JSON.stringify({ rooms }) }),
  updateRoomCleaning: (albergueId: string, roomId: string, ultimaLimpieza: string) =>
    request<OkResponse>(`/albergues/${albergueId}/rooms/${roomId}/limpieza`, { method: 'PUT', body: JSON.stringify({ ultimaLimpieza }) }),

  // Huespedes
  getHuespedes: (albergueId: string) => request<Any[]>(`/huespedes/${albergueId}`),
  checkIn: (albergueId: string, data: Any) =>
    request<Any>(`/huespedes/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editHuesped: (id: string, data: Any) =>
    request<Any>(`/huespedes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHuesped: (id: string) =>
    request<OkResponse>(`/huespedes/${id}`, { method: 'DELETE' }),
  checkOut: (id: string, fecha: string) =>
    request<OkResponse>(`/huespedes/${id}/checkout`, { method: 'POST', body: JSON.stringify({ fecha }) }),
  reincorporar: (id: string, habitacion: string, cama: number) =>
    request<Any>(`/huespedes/${id}/reincorporar`, { method: 'POST', body: JSON.stringify({ habitacion, cama }) }),

  // Comedor
  getComedor: (albergueId: string) => request<Any[]>(`/comedor/${albergueId}`),
  updateComedor: (huespedId: string, data: Any) =>
    request<Any>(`/comedor/${huespedId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Menu
  getMenuInfo: (albergueId: string) => request<Any>(`/menu/${albergueId}`),
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
    return res.json();
  },
  getMenuDownloadUrl: (albergueId: string) => `${API_BASE}/menu/${albergueId}/download`,
  deleteMenu: (albergueId: string) =>
    request<OkResponse>(`/menu/${albergueId}`, { method: 'DELETE' }),

  // Llegadas
  getLlegadas: (albergueId: string) => request<Any[]>(`/llegadas/${albergueId}`),
  addLlegada: (albergueId: string, data: Any) =>
    request<Any>(`/llegadas/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editLlegada: (id: string, data: Any) =>
    request<Any>(`/llegadas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLlegada: (id: string) =>
    request<OkResponse>(`/llegadas/${id}`, { method: 'DELETE' }),

  // Incidencias
  getIncidencias: (albergueId: string) => request<Any[]>(`/incidencias/${albergueId}`),
  addIncidencia: (albergueId: string, data: Any) =>
    request<Any>(`/incidencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  toggleIncidencia: (id: string) =>
    request<Any>(`/incidencias/${id}/toggle`, { method: 'PUT' }),
  deleteIncidencia: (id: string) =>
    request<OkResponse>(`/incidencias/${id}`, { method: 'DELETE' }),

  // Board
  getBoardMessages: (albergueId: string) => request<Any[]>(`/board/${albergueId}`),
  addBoardMessage: (albergueId: string, data: Any) =>
    request<Any>(`/board/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  addBoardReply: (messageId: string, data: Any) =>
    request<Any>(`/board/${messageId}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  resolveBoardMessage: (messageId: string, data: Any) =>
    request<Any>(`/board/${messageId}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBoardMessage: (messageId: string) =>
    request<OkResponse>(`/board/${messageId}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request<Any[]>('/users'),
  addUser: (data: Any) => request<Any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  removeUser: (email: string) => request<OkResponse>(`/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  changePassword: (email: string, newPassword: string) =>
    request<OkResponse>(`/users/${encodeURIComponent(email)}/password`, { method: 'PUT', body: JSON.stringify({ password: newPassword }) }),
  updateUserAlbergues: (email: string, albergueIds: string[]) =>
    request<OkResponse>(`/users/${encodeURIComponent(email)}/albergues`, { method: 'PUT', body: JSON.stringify({ albergueIds }) }),

  // Tareas Empleados
  getTareasDia: (albergueId: string, start: string, end: string) =>
    request<Any[]>(`/tareas/${albergueId}?start=${start}&end=${end}`),
  saveTareasDia: (albergueId: string, fecha: string, tareas: Any[]) =>
    request<OkResponse>(`/tareas/${albergueId}/${fecha}`, { method: 'POST', body: JSON.stringify({ tareas }) }),

  // Notas
  getNotas: (userEmail: string) => request<Any[]>(`/notas/${encodeURIComponent(userEmail)}`),
  addNota: (userEmail: string, data: Any) =>
    request<Any>(`/notas/${encodeURIComponent(userEmail)}`, { method: 'POST', body: JSON.stringify(data) }),
  updateNota: (id: string, data: Any) =>
    request<Any>(`/notas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNota: (id: string) =>
    request<OkResponse>(`/notas/${id}`, { method: 'DELETE' }),

  // Sugerencias
  getSugerencias: (albergueId: string) => request<Any[]>(`/sugerencias/${albergueId}`),
  addSugerencia: (albergueId: string, data: Any) =>
    request<Any>(`/sugerencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSugerencia: (id: string, data: Any) =>
    request<Any>(`/sugerencias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSugerencia: (id: string) =>
    request<OkResponse>(`/sugerencias/${id}`, { method: 'DELETE' }),
  bulkDeleteSugerencias: (ids: string[]) =>
    request<OkResponse>(`/sugerencias/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  clearSugerencias: (albergueId: string) =>
    request<OkResponse>(`/sugerencias/clear/${albergueId}`, { method: 'DELETE' }),

  // Access Logs
  getAccessLogs: () => request<Any[]>('/access-logs'),
  clearAccessLogs: () => request<OkResponse>('/access-logs', { method: 'DELETE' }),

  // Debug
  getDebugStatus: () => request<Any>('/debug/status'),

  // Registro Horario
  getEmpleadosHorario: (albergueId: string) => request<Any[]>(`/registro-horario/empleados/${albergueId}`),
  addEmpleadoHorario: (albergueId: string, data: Any) =>
    request<Any>(`/registro-horario/empleados/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateEmpleadoHorario: (id: string, data: Any) =>
    request<Any>(`/registro-horario/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmpleadoHorario: (id: string) =>
    request<OkResponse>(`/registro-horario/empleados/${id}`, { method: 'DELETE' }),
  getRegistrosHorario: (empleadoId: string, start: string, end: string) =>
    request<Any[]>(`/registro-horario/registros/${empleadoId}?start=${start}&end=${end}`),
  saveRegistroHorario: (empleadoId: string, data: Any) =>
    request<OkResponse>(`/registro-horario/registros/${empleadoId}`, { method: 'POST', body: JSON.stringify(data) }),
  getVacacionesSaldo: (empleadoId: string, anio: number) =>
    request<Any>(`/registro-horario/vacaciones/${empleadoId}/${anio}`),
  updateVacacionesSaldo: (empleadoId: string, anio: number, data: Any) =>
    request<OkResponse>(`/registro-horario/vacaciones/${empleadoId}/${anio}`, { method: 'PUT', body: JSON.stringify(data) }),
  getConfigEmpresa: (albergueId: string) =>
    request<Any>(`/registro-horario/config-empresa/${albergueId}`),
  updateConfigEmpresa: (albergueId: string, data: Any) =>
    request<OkResponse>(`/registro-horario/config-empresa/${albergueId}`, { method: 'PUT', body: JSON.stringify(data) }),
  logAuditoria: (data: Any) =>
    request<OkResponse>(`/registro-horario/auditoria`, { method: 'POST', body: JSON.stringify(data) }),
  getAuditoria: (albergueId: string) =>
    request<Any[]>(`/registro-horario/auditoria/${albergueId}`),

  // Inventario (fully typed)
  getInventarioCategorias: (albergueId: string) => request<InventarioCategoria[]>(`/inventario/${albergueId}/categorias`),
  addInventarioCategoria: (albergueId: string, data: { nombre: string; icono?: string }) =>
    request<InventarioCategoria>(`/inventario/${albergueId}/categorias`, { method: 'POST', body: JSON.stringify(data) }),
  deleteInventarioCategoria: (id: string) =>
    request<OkResponse>(`/inventario/categorias/${id}`, { method: 'DELETE' }),
  updateInventarioCategoria: (id: string, data: { nombre: string }) =>
    request<InventarioCategoria>(`/inventario/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  getInventarioMovimientosGlobal: (albergueId: string, filters?: { start?: string; end?: string; categoria?: string; usuario?: string }) => {
    const params = new URLSearchParams();
    if (filters?.start) params.set('start', filters.start);
    if (filters?.end) params.set('end', filters.end);
    if (filters?.categoria) params.set('categoria', filters.categoria);
    if (filters?.usuario) params.set('usuario', filters.usuario);
    const qs = params.toString();
    return request<InventarioMovimiento[]>(`/inventario/${albergueId}/movimientos${qs ? '?' + qs : ''}`);
  },
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
