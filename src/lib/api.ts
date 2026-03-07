const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Auth
  login: (email: string, password: string) =>
    request<{ email: string; role: string; nombre: string; albergueIds: string[] }>('/auth/login', {
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
