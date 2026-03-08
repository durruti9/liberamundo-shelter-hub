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
    const error = new Error(err.error || res.statusText);
    (error as any).status = res.status;
    (error as any).code = err.code;
    
    // Auto-logout on expired/invalid token
    if (res.status === 401 && err.code === 'TOKEN_EXPIRED') {
      clearToken();
      localStorage.removeItem('auth');
      window.location.reload();
    }
    
    throw error;
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Auth
  login: (email: string, password: string) =>
    request<{ email: string; role: string; nombre: string; albergueIds: string[]; isDefaultAdmin?: boolean; token: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  // Albergues
  getAlbergues: () => request<any[]>('/albergues'),
  createAlbergue: (nombre: string, rooms: any[] = []) =>
    request<any>('/albergues', { method: 'POST', body: JSON.stringify({ nombre, rooms }) }),
  updateAlbergueName: (id: string, nombre: string) =>
    request<any>(`/albergues/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deleteAlbergue: (id: string) =>
    request<any>(`/albergues/${id}`, { method: 'DELETE' }),
  updateRooms: (albergueId: string, rooms: any[]) =>
    request<any>(`/albergues/${albergueId}/rooms`, { method: 'PUT', body: JSON.stringify({ rooms }) }),

  // Huespedes
  getHuespedes: (albergueId: string) => request<any[]>(`/huespedes/${albergueId}`),
  checkIn: (albergueId: string, data: any) =>
    request<any>(`/huespedes/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editHuesped: (id: string, data: any) =>
    request<any>(`/huespedes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHuesped: (id: string) =>
    request<any>(`/huespedes/${id}`, { method: 'DELETE' }),
  checkOut: (id: string, fecha: string) =>
    request<any>(`/huespedes/${id}/checkout`, { method: 'POST', body: JSON.stringify({ fecha }) }),
  reincorporar: (id: string, habitacion: string, cama: number) =>
    request<any>(`/huespedes/${id}/reincorporar`, { method: 'POST', body: JSON.stringify({ habitacion, cama }) }),

  // Comedor
  getComedor: (albergueId: string) => request<any[]>(`/comedor/${albergueId}`),
  updateComedor: (huespedId: string, data: any) =>
    request<any>(`/comedor/${huespedId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Menu
  getMenuInfo: (albergueId: string) => request<any>(`/menu/${albergueId}`),
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
    request<any>(`/menu/${albergueId}`, { method: 'DELETE' }),

  // Llegadas
  getLlegadas: (albergueId: string) => request<any[]>(`/llegadas/${albergueId}`),
  addLlegada: (albergueId: string, data: any) =>
    request<any>(`/llegadas/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  editLlegada: (id: string, data: any) =>
    request<any>(`/llegadas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLlegada: (id: string) =>
    request<any>(`/llegadas/${id}`, { method: 'DELETE' }),

  // Incidencias
  getIncidencias: (albergueId: string) => request<any[]>(`/incidencias/${albergueId}`),
  addIncidencia: (albergueId: string, data: any) =>
    request<any>(`/incidencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  toggleIncidencia: (id: string) =>
    request<any>(`/incidencias/${id}/toggle`, { method: 'PUT' }),
  deleteIncidencia: (id: string) =>
    request<any>(`/incidencias/${id}`, { method: 'DELETE' }),

  // Board
  getBoardMessages: (albergueId: string) => request<any[]>(`/board/${albergueId}`),
  addBoardMessage: (albergueId: string, data: any) =>
    request<any>(`/board/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  addBoardReply: (messageId: string, data: any) =>
    request<any>(`/board/${messageId}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  resolveBoardMessage: (messageId: string, data: any) =>
    request<any>(`/board/${messageId}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBoardMessage: (messageId: string) =>
    request<any>(`/board/${messageId}`, { method: 'DELETE' }),

  // Users
  getUsers: () => request<any[]>('/users'),
  addUser: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  removeUser: (email: string) => request<any>(`/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  changePassword: (email: string, newPassword: string) =>
    request<any>(`/users/${encodeURIComponent(email)}/password`, { method: 'PUT', body: JSON.stringify({ password: newPassword }) }),

  // Tareas Empleados
  getTareasDia: (albergueId: string, start: string, end: string) =>
    request<any[]>(`/tareas/${albergueId}?start=${start}&end=${end}`),
  saveTareasDia: (albergueId: string, fecha: string, tareas: any[]) =>
    request<any>(`/tareas/${albergueId}/${fecha}`, { method: 'POST', body: JSON.stringify({ tareas }) }),

  // Notas
  getNotas: (userEmail: string) => request<any[]>(`/notas/${encodeURIComponent(userEmail)}`),
  addNota: (userEmail: string, data: any) =>
    request<any>(`/notas/${encodeURIComponent(userEmail)}`, { method: 'POST', body: JSON.stringify(data) }),
  updateNota: (id: string, data: any) =>
    request<any>(`/notas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNota: (id: string) =>
    request<any>(`/notas/${id}`, { method: 'DELETE' }),

  // Sugerencias
  getSugerencias: (albergueId: string) => request<any[]>(`/sugerencias/${albergueId}`),
  addSugerencia: (albergueId: string, data: any) =>
    request<any>(`/sugerencias/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSugerencia: (id: string, data: any) =>
    request<any>(`/sugerencias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSugerencia: (id: string) =>
    request<any>(`/sugerencias/${id}`, { method: 'DELETE' }),
  bulkDeleteSugerencias: (ids: string[]) =>
    request<any>(`/sugerencias/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  clearSugerencias: (albergueId: string) =>
    request<any>(`/sugerencias/clear/${albergueId}`, { method: 'DELETE' }),

  // Access Logs
  getAccessLogs: () => request<any[]>('/access-logs'),
  clearAccessLogs: () => request<any>('/access-logs', { method: 'DELETE' }),

  // Registro Horario
  getEmpleadosHorario: (albergueId: string) => request<any[]>(`/registro-horario/empleados/${albergueId}`),
  addEmpleadoHorario: (albergueId: string, data: any) =>
    request<any>(`/registro-horario/empleados/${albergueId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateEmpleadoHorario: (id: string, data: any) =>
    request<any>(`/registro-horario/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmpleadoHorario: (id: string) =>
    request<any>(`/registro-horario/empleados/${id}`, { method: 'DELETE' }),
  getRegistrosHorario: (empleadoId: string, start: string, end: string) =>
    request<any[]>(`/registro-horario/registros/${empleadoId}?start=${start}&end=${end}`),
  saveRegistroHorario: (empleadoId: string, data: any) =>
    request<any>(`/registro-horario/registros/${empleadoId}`, { method: 'POST', body: JSON.stringify(data) }),
  getVacacionesSaldo: (empleadoId: string, anio: number) =>
    request<any>(`/registro-horario/vacaciones/${empleadoId}/${anio}`),
  updateVacacionesSaldo: (empleadoId: string, anio: number, data: any) =>
    request<any>(`/registro-horario/vacaciones/${empleadoId}/${anio}`, { method: 'PUT', body: JSON.stringify(data) }),
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
