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

const DEFAULT_USERS: UserAccount[] = [];

export function useAlbergueStore(albergueId: string = 'default') {
  const prefix = albergueId;
  const [useApi, setUseApi] = useState(() => !!localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

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

  // ── Granular reload helpers ──
  const reloadHuespedes = useCallback(async () => {
    try {
      const data = await api.getHuespedes(albergueId);
      setHuespedes(data);
    } catch {}
  }, [albergueId]);

  const reloadComedor = useCallback(async () => {
    try {
      const data = await api.getComedor(albergueId);
      setComedor(data);
    } catch {}
  }, [albergueId]);

  const reloadLlegadas = useCallback(async () => {
    try {
      const data = await api.getLlegadas(albergueId);
      setLlegadas(data);
    } catch {}
  }, [albergueId]);

  const reloadIncidencias = useCallback(async () => {
    try {
      const data = await api.getIncidencias(albergueId);
      setIncidencias(data);
    } catch {}
  }, [albergueId]);

  const reloadBoard = useCallback(async () => {
    try {
      const data = await api.getBoardMessages(albergueId);
      setBoardMessages(data);
    } catch {}
  }, [albergueId]);

  const reloadAlbergues = useCallback(async () => {
    try {
      const data = await api.getAlbergues();
      if (data.length > 0) setAlbergues(data);
    } catch {}
  }, []);

  const reloadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {}
  }, []);

  // ── Full load (used on mount and periodic refresh) ──
  const loadFromApi = useCallback(async () => {
    try {
      console.log('[Store] Loading data for albergueId:', albergueId);

      const safeLoad = async <T,>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fn();
        } catch (err: any) {
          console.warn(`[Store] Failed to load ${name}:`, err.message);
          return fallback;
        }
      };

      const [albs, huesps, com, llegs, incs, msgs] = await Promise.all([
        safeLoad('albergues', () => api.getAlbergues(), []),
        safeLoad('huespedes', () => api.getHuespedes(albergueId), []),
        safeLoad('comedor', () => api.getComedor(albergueId), []),
        safeLoad('llegadas', () => api.getLlegadas(albergueId), []),
        safeLoad('incidencias', () => api.getIncidencias(albergueId), []),
        safeLoad('board', () => api.getBoardMessages(albergueId), []),
      ]);

      if (albs.length > 0) setAlbergues(albs);
      setHuespedes(huesps);
      setComedor(com);
      setLlegadas(llegs);
      setIncidencias(incs);
      setBoardMessages(msgs);

      try {
        const usrs = await api.getUsers();
        setUsers(usrs);
      } catch {}
    } catch (err: any) {
      console.error('[Store] Critical error:', err);
      const available = await isApiAvailable();
      if (!available) {
        console.warn('[Store] API unavailable, falling back to localStorage');
        setUseApi(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [albergueId]);

  // Load on mount / albergueId change
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setUseApi(true);
      setIsLoading(true);
      loadFromApi();
      initialLoadDone.current = true;
    } else if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      isApiAvailable().then(available => {
        setUseApi(available);
        if (available) loadFromApi();
        else setIsLoading(false);
      });
    }
  }, [albergueId]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!useApi) return;
    const interval = setInterval(loadFromApi, 30000);
    return () => clearInterval(interval);
  }, [useApi, loadFromApi]);

  // Persist to localStorage when NOT using API
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_huespedes`, huespedes); }, [huespedes, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_comedor`, comedor); }, [comedor, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_llegadas`, llegadas); }, [llegadas, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_incidencias`, incidencias); }, [incidencias, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage(`${prefix}_board`, boardMessages); }, [boardMessages, prefix, useApi]);
  useEffect(() => { if (!useApi) saveToStorage('users', users); }, [users, useApi]);
  useEffect(() => { if (!useApi) saveToStorage('albergues', albergues); }, [albergues, useApi]);

  // Auto-checkout
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

  // ── Actions (optimistic where safe) ──
  const checkIn = useCallback(async (huesped: Omit<Huesped, 'id' | 'activo'>) => {
    if (useApi) {
      const result = await api.checkIn(albergueId, huesped);
      // Granular: only reload huespedes + comedor
      await Promise.all([reloadHuespedes(), reloadComedor()]);
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
  }, [useApi, albergueId, reloadHuespedes, reloadComedor]);

  const checkOut = useCallback(async (id: string, fecha?: string) => {
    const checkoutDate = fecha || new Date().toISOString().split('T')[0];
    if (useApi) {
      // Optimistic
      const today = new Date().toISOString().split('T')[0];
      if (checkoutDate <= today) {
        setHuespedes(prev => prev.map(h => h.id === id ? { ...h, activo: false, fechaCheckout: checkoutDate } : h));
      } else {
        setHuespedes(prev => prev.map(h => h.id === id ? { ...h, fechaCheckout: checkoutDate } : h));
      }
      await api.checkOut(id, checkoutDate);
      await reloadHuespedes();
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (checkoutDate > today) {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, fechaCheckout: checkoutDate } : h));
    } else {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, activo: false, fechaCheckout: checkoutDate } : h));
      setComedor(prev => prev.filter(c => c.huespedId !== id));
    }
  }, [useApi, reloadHuespedes]);

  const deleteHuesped = useCallback(async (id: string) => {
    // Optimistic
    setHuespedes(prev => prev.filter(h => h.id !== id));
    setComedor(prev => prev.filter(c => c.huespedId !== id));
    if (useApi) {
      await api.deleteHuesped(id);
    } else {
      setIncidencias(prev => prev.filter(i => i.huespedId !== id));
    }
  }, [useApi]);

  const editHuesped = useCallback(async (id: string, data: Partial<Huesped>) => {
    // Optimistic
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
    if (useApi) {
      await api.editHuesped(id, data);
    }
  }, [useApi]);

  const reincorporar = useCallback(async (id: string, habitacion: string, cama: number) => {
    if (useApi) {
      await api.reincorporar(id, habitacion, cama);
      await Promise.all([reloadHuespedes(), reloadComedor()]);
      return;
    }
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, activo: true, habitacion, cama, fechaCheckout: undefined, fechaEntrada: new Date().toISOString().split('T')[0] } : h
    ));
    setComedor(prev => [...prev, {
      huespedId: id, estado: 'Activo' as const,
      separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
      motivoAusencia: '', observaciones: '', particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
  }, [useApi, reloadHuespedes, reloadComedor]);

  const cambiarCama = useCallback(async (id: string, habitacion: string, cama: number) => {
    // Optimistic
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, habitacion, cama } : h));
    if (useApi) {
      await api.editHuesped(id, { habitacion, cama });
    }
  }, [useApi]);

  const addLlegada = useCallback(async (llegada: Omit<ProximaLlegada, 'id'>) => {
    if (useApi) {
      await api.addLlegada(albergueId, llegada);
      await reloadLlegadas();
      return;
    }
    setLlegadas(prev => [...prev, { ...llegada, id: crypto.randomUUID() }]);
  }, [useApi, albergueId, reloadLlegadas]);

  const editLlegada = useCallback(async (id: string, data: Partial<ProximaLlegada>) => {
    // Optimistic
    setLlegadas(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    if (useApi) {
      await api.editLlegada(id, data);
    }
  }, [useApi]);

  const confirmarLlegada = useCallback(async (llegadaId: string) => {
    const llegada = llegadas.find(l => l.id === llegadaId);
    if (!llegada || !llegada.habitacionAsignada || !llegada.camaAsignada) return;
    await checkIn({
      nombre: llegada.nombre, nie: llegada.nie, nacionalidad: llegada.nacionalidad,
      idioma: llegada.idioma, dieta: llegada.dieta, fechaEntrada: llegada.fechaLlegada,
      notas: llegada.notas, habitacion: llegada.habitacionAsignada, cama: llegada.camaAsignada,
    });
    // Optimistic remove
    setLlegadas(prev => prev.filter(l => l.id !== llegadaId));
    if (useApi) {
      await api.deleteLlegada(llegadaId);
    }
  }, [llegadas, checkIn, useApi]);

  const updateComedor = useCallback(async (huespedId: string, data: Partial<ComedorEntry>) => {
    // Optimistic
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
    if (useApi) {
      await api.updateComedor(huespedId, data);
    }
  }, [useApi]);

  const deleteLlegada = useCallback(async (id: string) => {
    // Optimistic
    setLlegadas(prev => prev.filter(l => l.id !== id));
    if (useApi) {
      await api.deleteLlegada(id);
    }
  }, [useApi]);

  const addIncidencia = useCallback(async (data: Omit<Incidencia, 'id'>) => {
    if (useApi) {
      await api.addIncidencia(albergueId, data);
      await reloadIncidencias();
      return;
    }
    setIncidencias(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  }, [useApi, albergueId, reloadIncidencias]);

  const toggleIncidenciaResuelta = useCallback(async (id: string) => {
    // Optimistic
    setIncidencias(prev => prev.map(i => i.id === id ? { ...i, resuelta: !i.resuelta } : i));
    if (useApi) {
      await api.toggleIncidencia(id);
    }
  }, [useApi]);

  const deleteIncidencia = useCallback(async (id: string) => {
    // Optimistic
    setIncidencias(prev => prev.filter(i => i.id !== id));
    if (useApi) {
      await api.deleteIncidencia(id);
    }
  }, [useApi]);

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
    if (useApi) { await api.addUser(account); await reloadUsers(); return; }
    setUsers(prev => [...prev, account]);
  }, [useApi, reloadUsers]);

  const removeUser = useCallback(async (email: string) => {
    // Optimistic
    setUsers(prev => prev.filter(u => u.email !== email));
    if (useApi) { await api.removeUser(email); }
  }, [useApi]);

  const changePassword = useCallback(async (email: string, newPassword: string) => {
    if (useApi) { await api.changePassword(email, newPassword); return; }
    setUsers(prev => prev.map(u => u.email === email ? { ...u, password: newPassword } : u));
  }, [useApi]);

  const authenticate = useCallback((email: string, password: string): UserAccount | null => {
    return users.find(u => u.email === email && u.password === password) || null;
  }, [users]);

  const addAlbergue = useCallback(async (nombre: string, initialRooms: Room[] = []) => {
    if (useApi) {
      const result = await api.createAlbergue(nombre, initialRooms);
      await reloadAlbergues();
      return result;
    }
    const newAlbergue: Albergue = { id: crypto.randomUUID(), nombre, rooms: initialRooms };
    setAlbergues(prev => [...prev, newAlbergue]);
    return newAlbergue;
  }, [useApi, reloadAlbergues]);

  const editAlbergueName = useCallback(async (id: string, nombre: string) => {
    // Optimistic
    setAlbergues(prev => prev.map(a => a.id === id ? { ...a, nombre } : a));
    if (useApi) { await api.updateAlbergueName(id, nombre); }
  }, [useApi]);

  const deleteAlbergue = useCallback(async (id: string) => {
    // Optimistic
    setAlbergues(prev => prev.filter(a => a.id !== id));
    if (useApi) { await api.deleteAlbergue(id); }
    else {
      localStorage.removeItem(`${id}_huespedes`);
      localStorage.removeItem(`${id}_comedor`);
      localStorage.removeItem(`${id}_llegadas`);
      localStorage.removeItem(`${id}_incidencias`);
    }
  }, [useApi]);

  const updateRooms = useCallback(async (newRooms: Room[]) => {
    // Optimistic
    setAlbergues(prev => prev.map(a => a.id === albergueId ? { ...a, rooms: newRooms } : a));
    if (useApi) { await api.updateRooms(albergueId, newRooms); }
  }, [useApi, albergueId]);

  const updateRoomCleaning = useCallback(async (roomId: string, ultimaLimpieza: string) => {
    // Optimistic
    setAlbergues(prev => prev.map(a => a.id === albergueId ? {
      ...a, rooms: a.rooms.map(r => r.id === roomId ? { ...r, ultimaLimpieza } : r)
    } : a));
    if (useApi) { await api.updateRoomCleaning(albergueId, roomId, ultimaLimpieza); }
  }, [useApi, albergueId]);

  const addBoardMessage = useCallback(async (msg: Omit<BoardMessage, 'id' | 'resuelta' | 'respuestas'>) => {
    if (useApi) {
      await api.addBoardMessage(albergueId, msg);
      await reloadBoard();
      return;
    }
    setBoardMessages(prev => [...prev, { ...msg, id: crypto.randomUUID(), resuelta: false, respuestas: [] }]);
  }, [useApi, albergueId, reloadBoard]);

  const addBoardReply = useCallback(async (messageId: string, reply: Omit<BoardReply, 'id'>) => {
    // Optimistic
    setBoardMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, respuestas: [...m.respuestas, { ...reply, id: crypto.randomUUID() }] } : m
    ));
    if (useApi) { await api.addBoardReply(messageId, reply); }
  }, [useApi]);

  const resolveBoardMessage = useCallback(async (messageId: string, resolucion: { autor: string; fecha: string; descripcion: string }) => {
    // Optimistic
    setBoardMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, resuelta: true, resolucion } : m
    ));
    if (useApi) { await api.resolveBoardMessage(messageId, resolucion); }
  }, [useApi]);

  const deleteBoardMessage = useCallback(async (messageId: string) => {
    // Optimistic
    setBoardMessages(prev => prev.filter(m => m.id !== messageId));
    if (useApi) { await api.deleteBoardMessage(messageId); }
  }, [useApi]);

  return {
    huespedes, huespedActivos, comedor, llegadas, users, incidencias, boardMessages,
    rooms, totalCamas, albergues, currentAlbergue, useApi, isLoading,
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
