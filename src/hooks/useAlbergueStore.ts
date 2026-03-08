import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Huesped, ComedorEntry, ProximaLlegada, Incidencia, Room, Albergue, DEFAULT_ALBERGUE, UserAccount, BoardMessage, BoardReply } from '@/types';
import { api, isApiAvailable } from '@/lib/api';

// ── localStorage helpers (fallback) ──
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}
function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

const DEFAULT_USERS: UserAccount[] = [
  { email: 'admin', password: 'admin', role: 'admin' },
];

export function useAlbergueStore(albergueId: string = 'default') {
  const prefix = albergueId;
  // Derive API mode from token existence - if we logged in via API, the API is available
  const [useApi, setUseApi] = useState(() => !!localStorage.getItem('authToken'));
  const apiChecked = useRef(false);
  const dataLoaded = useRef(false);

  // Load data from API on mount if token exists, or check health as fallback
  useEffect(() => {
    if (apiChecked.current) return;
    apiChecked.current = true;

    const token = localStorage.getItem('authToken');
    if (token) {
      // Token exists = API was used for login = API is available
      console.log('[Store] Token found, using API mode. AlbergueId:', albergueId);
      setUseApi(true);
      loadFromApi();
    } else {
      // No token, check if API is available (localStorage fallback mode)
      isApiAvailable().then(available => {
        console.log('[Store] Health check result:', available);
        setUseApi(available);
        if (available) loadFromApi();
      });
    }
  }, []);

  // ── State ──
  const [albergues, setAlbergues] = useState<Albergue[]>(() => {
    const stored = loadFromStorage<Albergue[]>('albergues', [DEFAULT_ALBERGUE]);
    return stored.map(a => ({ ...a, rooms: Array.isArray(a.rooms) ? a.rooms : [] }));
  });
  const currentAlbergue = useMemo(() => albergues.find(a => a.id === albergueId) || albergues[0], [albergues, albergueId]);
  const rooms: Room[] = Array.isArray(currentAlbergue?.rooms) ? currentAlbergue.rooms : [];
  const totalCamas = useMemo(() => rooms.reduce((acc, r) => acc + r.camas, 0), [rooms]);

  const [huespedes, setHuespedes] = useState<Huesped[]>(() => loadFromStorage(`${prefix}_huespedes`, []));
  const [comedor, setComedor] = useState<ComedorEntry[]>(() => loadFromStorage(`${prefix}_comedor`, []));
  const [llegadas, setLlegadas] = useState<ProximaLlegada[]>(() => loadFromStorage(`${prefix}_llegadas`, []));
  const [incidencias, setIncidencias] = useState<Incidencia[]>(() => loadFromStorage(`${prefix}_incidencias`, []));
  const [boardMessages, setBoardMessages] = useState<BoardMessage[]>(() => loadFromStorage(`${prefix}_board`, []));
  const [users, setUsers] = useState<UserAccount[]>(() => {
    return loadFromStorage<UserAccount[]>('users', DEFAULT_USERS);
  });

  // ── Load from API ──
  const loadFromApi = useCallback(async () => {
    try {
      console.log('[Store] Loading data for albergueId:', albergueId);
      // Core data — all roles can access these
      const [albs, huesps, com, llegs, incs, msgs] = await Promise.all([
        api.getAlbergues(),
        api.getHuespedes(albergueId),
        api.getComedor(albergueId),
        api.getLlegadas(albergueId),
        api.getIncidencias(albergueId),
        api.getBoardMessages(albergueId),
      ]);
      console.log('[Store] Loaded:', { albergues: albs.length, huespedes: huesps.length, comedor: com.length });
      setAlbergues(albs);
      setHuespedes(huesps);
      setComedor(com);
      setLlegadas(llegs);
      setIncidencias(incs);
      setBoardMessages(msgs);

      // Admin-only: user list (non-admins get 403, ignore gracefully)
      try {
        const usrs = await api.getUsers();
        setUsers(usrs);
      } catch {
        // Non-admin users don't have access to user management
      }
    } catch (err: any) {
      console.error('[Store] Error loading from API:', err);
      if (err.status === 403) {
        console.error('[Store] 403 FORBIDDEN - User does not have access to albergue:', albergueId);
        console.error('[Store] Debug info:', err.message);
      }
      // If API call fails, try health check - maybe API went down
      if (err.status !== 403) {
        const available = await isApiAvailable();
        if (!available) {
          console.warn('[Store] API unavailable, falling back to localStorage');
          setUseApi(false);
        }
      }
    }
  }, [albergueId]);

  // Auto-refresh data every 30s when in API mode (keeps data in sync between users)
  useEffect(() => {
    if (!useApi) return;
    const interval = setInterval(() => {
      loadFromApi();
    }, 30000);
    return () => clearInterval(interval);
  }, [useApi, loadFromApi]);

  // ── Persist to localStorage only when NOT using API ──
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_huespedes`, huespedes); }, [huespedes, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_comedor`, comedor); }, [comedor, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_llegadas`, llegadas); }, [llegadas, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_incidencias`, incidencias); }, [incidencias, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_board`, boardMessages); }, [boardMessages, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage('users', users); }, [users, useApi]);
  useEffect(() => { if (!useApi) saveToStorage('albergues', albergues); }, [albergues, useApi]);

  // Auto-checkout past dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setHuespedes(prev => {
      const updated = prev.map(h => {
        if (h.activo && h.fechaCheckout && h.fechaCheckout <= today) return { ...h, activo: false };
        return h;
      });
      if (JSON.stringify(updated) !== JSON.stringify(prev)) return updated;
      return prev;
    });
  }, []);

  // ── Actions (API-aware) ──
  const checkIn = useCallback(async (huesped: Omit<Huesped, 'id' | 'activo'>) => {
    if (useApi) {
      const result = await api.checkIn(albergueId, huesped);
      await loadFromApi();
      return result;
    }
    const newHuesped: Huesped = { ...huesped, id: crypto.randomUUID(), activo: true };
    setHuespedes(prev => [...prev, newHuesped]);
    setComedor(prev => [...prev, {
      huespedId: newHuesped.id, estado: 'Activo' as const,
      separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
      motivoAusencia: '', observaciones: '', particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
    return newHuesped;
  }, [useApi, albergueId, loadFromApi]);

  const checkOut = useCallback(async (id: string, fecha?: string) => {
    const checkoutDate = fecha || new Date().toISOString().split('T')[0];
    if (useApi) {
      await api.checkOut(id, checkoutDate);
      await loadFromApi();
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (checkoutDate > today) {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, fechaCheckout: checkoutDate } : h));
    } else {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, activo: false, fechaCheckout: checkoutDate } : h));
      setComedor(prev => prev.filter(c => c.huespedId !== id));
    }
  }, [useApi, loadFromApi]);

  const deleteHuesped = useCallback(async (id: string) => {
    if (useApi) { await api.deleteHuesped(id); await loadFromApi(); return; }
    setHuespedes(prev => prev.filter(h => h.id !== id));
    setComedor(prev => prev.filter(c => c.huespedId !== id));
    setIncidencias(prev => prev.filter(i => i.huespedId !== id));
  }, [useApi, loadFromApi]);

  const editHuesped = useCallback(async (id: string, data: Partial<Huesped>) => {
    if (useApi) { await api.editHuesped(id, data); await loadFromApi(); return; }
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  }, [useApi, loadFromApi]);

  const reincorporar = useCallback(async (id: string, habitacion: string, cama: number) => {
    if (useApi) { await api.reincorporar(id, habitacion, cama); await loadFromApi(); return; }
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, activo: true, habitacion, cama, fechaCheckout: undefined, fechaEntrada: new Date().toISOString().split('T')[0] } : h
    ));
    setComedor(prev => [...prev, {
      huespedId: id, estado: 'Activo' as const,
      separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
      motivoAusencia: '', observaciones: '', particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
  }, [useApi, loadFromApi]);

  const cambiarCama = useCallback(async (id: string, habitacion: string, cama: number) => {
    if (useApi) { await api.editHuesped(id, { habitacion, cama }); await loadFromApi(); return; }
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, habitacion, cama } : h));
  }, [useApi, loadFromApi]);

  const addLlegada = useCallback(async (llegada: Omit<ProximaLlegada, 'id'>) => {
    if (useApi) { await api.addLlegada(albergueId, llegada); await loadFromApi(); return; }
    setLlegadas(prev => [...prev, { ...llegada, id: crypto.randomUUID() }]);
  }, [useApi, albergueId, loadFromApi]);

  const editLlegada = useCallback(async (id: string, data: Partial<ProximaLlegada>) => {
    if (useApi) { await api.editLlegada(id, data); await loadFromApi(); return; }
    setLlegadas(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, [useApi, loadFromApi]);

  const confirmarLlegada = useCallback(async (llegadaId: string) => {
    const llegada = llegadas.find(l => l.id === llegadaId);
    if (!llegada || !llegada.habitacionAsignada || !llegada.camaAsignada) return;
    await checkIn({
      nombre: llegada.nombre, nie: llegada.nie, nacionalidad: llegada.nacionalidad,
      idioma: llegada.idioma, dieta: llegada.dieta, fechaEntrada: llegada.fechaLlegada,
      notas: llegada.notas, habitacion: llegada.habitacionAsignada, cama: llegada.camaAsignada,
    });
    if (useApi) { await api.deleteLlegada(llegadaId); await loadFromApi(); }
    else setLlegadas(prev => prev.filter(l => l.id !== llegadaId));
  }, [llegadas, checkIn, useApi, loadFromApi]);

  const updateComedor = useCallback(async (huespedId: string, data: Partial<ComedorEntry>) => {
    if (useApi) {
      await api.updateComedor(huespedId, data);
      await loadFromApi();
      return;
    }
    setComedor(prev => {
      const idx = prev.findIndex(c => c.huespedId === huespedId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data, ultimaModificacion: new Date().toISOString() };
        return updated;
      }
      return [...prev, {
        huespedId, estado: 'Activo' as const,
        separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
        motivoAusencia: '', observaciones: '', particularidades: '',
        ...data, ultimaModificacion: new Date().toISOString(),
      }];
    });
  }, [useApi, loadFromApi]);

  const deleteLlegada = useCallback(async (id: string) => {
    if (useApi) { await api.deleteLlegada(id); await loadFromApi(); return; }
    setLlegadas(prev => prev.filter(l => l.id !== id));
  }, [useApi, loadFromApi]);

  const addIncidencia = useCallback(async (data: Omit<Incidencia, 'id'>) => {
    if (useApi) { await api.addIncidencia(albergueId, data); await loadFromApi(); return; }
    setIncidencias(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  }, [useApi, albergueId, loadFromApi]);

  const toggleIncidenciaResuelta = useCallback(async (id: string) => {
    if (useApi) { await api.toggleIncidencia(id); await loadFromApi(); return; }
    setIncidencias(prev => prev.map(i => i.id === id ? { ...i, resuelta: !i.resuelta } : i));
  }, [useApi, loadFromApi]);

  const deleteIncidencia = useCallback(async (id: string) => {
    if (useApi) { await api.deleteIncidencia(id); await loadFromApi(); return; }
    setIncidencias(prev => prev.filter(i => i.id !== id));
  }, [useApi, loadFromApi]);

  const huespedActivos = useMemo(() => huespedes.filter(h => h.activo), [huespedes]);

  const getOccupant = useCallback((habitacion: string, cama: number) => {
    return huespedActivos.find(h => h.habitacion === habitacion && h.cama === cama);
  }, [huespedActivos]);

  const getFreeBeds = useCallback(() => {
    const occupied = new Set(huespedActivos.map(h => `${h.habitacion}-${h.cama}`));
    const free: { habitacion: string; cama: number }[] = [];
    for (const room of rooms) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) free.push({ habitacion: room.id, cama: i });
      }
    }
    return free;
  }, [huespedActivos, rooms]);

  const addUser = useCallback(async (account: UserAccount) => {
    if (useApi) { await api.addUser(account); await loadFromApi(); return; }
    setUsers(prev => [...prev, account]);
  }, [useApi, loadFromApi]);

  const removeUser = useCallback(async (email: string) => {
    if (useApi) { await api.removeUser(email); await loadFromApi(); return; }
    setUsers(prev => prev.filter(u => u.email !== email));
  }, [useApi, loadFromApi]);

  const changePassword = useCallback(async (email: string, newPassword: string) => {
    if (useApi) { await api.changePassword(email, newPassword); return; }
    setUsers(prev => prev.map(u => u.email === email ? { ...u, password: newPassword } : u));
  }, [useApi]);

  const authenticate = useCallback((email: string, password: string): UserAccount | null => {
    // For API mode, authentication is handled via api.login() in LoginPage
    return users.find(u => u.email === email && u.password === password) || null;
  }, [users]);

  const addAlbergue = useCallback(async (nombre: string, initialRooms: Room[] = []) => {
    if (useApi) {
      const result = await api.createAlbergue(nombre, initialRooms);
      await loadFromApi();
      return result;
    }
    const newAlbergue: Albergue = { id: crypto.randomUUID(), nombre, rooms: initialRooms };
    setAlbergues(prev => [...prev, newAlbergue]);
    return newAlbergue;
  }, [useApi, loadFromApi]);

  const editAlbergueName = useCallback(async (id: string, nombre: string) => {
    if (useApi) { await api.updateAlbergueName(id, nombre); await loadFromApi(); return; }
    setAlbergues(prev => prev.map(a => a.id === id ? { ...a, nombre } : a));
  }, [useApi, loadFromApi]);

  const deleteAlbergue = useCallback(async (id: string) => {
    if (useApi) { await api.deleteAlbergue(id); await loadFromApi(); return; }
    setAlbergues(prev => prev.filter(a => a.id !== id));
    localStorage.removeItem(`${id}_huespedes`);
    localStorage.removeItem(`${id}_comedor`);
    localStorage.removeItem(`${id}_llegadas`);
    localStorage.removeItem(`${id}_incidencias`);
  }, [useApi, loadFromApi]);

  const updateRooms = useCallback(async (newRooms: Room[]) => {
    if (useApi) { await api.updateRooms(albergueId, newRooms); await loadFromApi(); return; }
    setAlbergues(prev => prev.map(a => a.id === albergueId ? { ...a, rooms: newRooms } : a));
  }, [useApi, albergueId, loadFromApi]);

  const updateRoomCleaning = useCallback(async (roomId: string, ultimaLimpieza: string) => {
    if (useApi) { await api.updateRoomCleaning(albergueId, roomId, ultimaLimpieza); await loadFromApi(); return; }
    setAlbergues(prev => prev.map(a => a.id === albergueId ? {
      ...a, rooms: a.rooms.map(r => r.id === roomId ? { ...r, ultimaLimpieza } : r)
    } : a));
  }, [useApi, albergueId, loadFromApi]);

  const addBoardMessage = useCallback(async (msg: Omit<BoardMessage, 'id' | 'resuelta' | 'respuestas'>) => {
    if (useApi) { await api.addBoardMessage(albergueId, msg); await loadFromApi(); return; }
    setBoardMessages(prev => [...prev, { ...msg, id: crypto.randomUUID(), resuelta: false, respuestas: [] }]);
  }, [useApi, albergueId, loadFromApi]);

  const addBoardReply = useCallback(async (messageId: string, reply: Omit<BoardReply, 'id'>) => {
    if (useApi) { await api.addBoardReply(messageId, reply); await loadFromApi(); return; }
    setBoardMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, respuestas: [...m.respuestas, { ...reply, id: crypto.randomUUID() }] } : m
    ));
  }, [useApi, loadFromApi]);

  const resolveBoardMessage = useCallback(async (messageId: string, resolucion: { autor: string; fecha: string; descripcion: string }) => {
    if (useApi) { await api.resolveBoardMessage(messageId, resolucion); await loadFromApi(); return; }
    setBoardMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, resuelta: true, resolucion } : m
    ));
  }, [useApi, loadFromApi]);

  const deleteBoardMessage = useCallback(async (messageId: string) => {
    if (useApi) { await api.deleteBoardMessage(messageId); await loadFromApi(); return; }
    setBoardMessages(prev => prev.filter(m => m.id !== messageId));
  }, [useApi, loadFromApi]);

  return {
    huespedes, huespedActivos, comedor, llegadas, users, incidencias, boardMessages,
    rooms, totalCamas, albergues, currentAlbergue, useApi,
    checkIn, checkOut, cambiarCama, deleteHuesped, editHuesped, reincorporar,
    addLlegada, editLlegada, confirmarLlegada, deleteLlegada,
    updateComedor,
    addIncidencia, toggleIncidenciaResuelta, deleteIncidencia,
    getOccupant, getFreeBeds,
    addUser, removeUser, changePassword, authenticate,
    addAlbergue, editAlbergueName, deleteAlbergue, updateRooms, updateRoomCleaning,
    addBoardMessage, addBoardReply, resolveBoardMessage, deleteBoardMessage,
    refreshData: loadFromApi,
  };
}
