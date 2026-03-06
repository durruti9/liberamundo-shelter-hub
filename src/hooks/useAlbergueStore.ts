import { useState, useEffect, useCallback, useMemo } from 'react';
import { Huesped, ComedorEntry, ProximaLlegada, Incidencia, Room, Albergue, DEFAULT_ALBERGUE, Dieta, UserAccount, UserRole, IncidentType } from '@/types';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Migrate old data (pre multi-albergue) to default albergue prefix
function migrateOldData() {
  if (localStorage.getItem('_migrated_v2')) return;
  const keys = ['huespedes', 'comedor', 'llegadas', 'incidencias'];
  keys.forEach(key => {
    const old = localStorage.getItem(key);
    if (old && !localStorage.getItem(`default_${key}`)) {
      localStorage.setItem(`default_${key}`, old);
    }
  });
  localStorage.setItem('_migrated_v2', 'true');
}
migrateOldData();

const DEFAULT_USERS: UserAccount[] = [
  { email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador', albergueIds: [] },
];

export function useAlbergueStore(albergueId: string = 'default') {
  const prefix = albergueId;

  // Global: albergues list
  const [albergues, setAlbergues] = useState<Albergue[]>(() => loadFromStorage('albergues', [DEFAULT_ALBERGUE]));
  const currentAlbergue = useMemo(() => albergues.find(a => a.id === albergueId) || albergues[0], [albergues, albergueId]);
  const rooms: Room[] = currentAlbergue?.rooms || [];
  const totalCamas = useMemo(() => rooms.reduce((acc, r) => acc + r.camas, 0), [rooms]);

  // Per-albergue data
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => loadFromStorage(`${prefix}_huespedes`, []));
  const [comedor, setComedor] = useState<ComedorEntry[]>(() => loadFromStorage(`${prefix}_comedor`, []));
  const [llegadas, setLlegadas] = useState<ProximaLlegada[]>(() => loadFromStorage(`${prefix}_llegadas`, []));
  const [incidencias, setIncidencias] = useState<Incidencia[]>(() => loadFromStorage(`${prefix}_incidencias`, []));

  // Global: users
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const stored = loadFromStorage<UserAccount[]>('users', DEFAULT_USERS);
    // Ensure albergueIds exists on all users (backward compat)
    return stored.map(u => ({ ...u, albergueIds: u.albergueIds || ['default'] }));
  });

  useEffect(() => saveToStorage(`${prefix}_huespedes`, huespedes), [huespedes, prefix]);
  useEffect(() => saveToStorage(`${prefix}_comedor`, comedor), [comedor, prefix]);
  useEffect(() => saveToStorage(`${prefix}_llegadas`, llegadas), [llegadas, prefix]);
  useEffect(() => saveToStorage(`${prefix}_incidencias`, incidencias), [incidencias, prefix]);
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('albergues', albergues), [albergues]);

  // Auto-process: checkout guests with past checkout dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setHuespedes(prev => {
      const updated = prev.map(h => {
        if (h.activo && h.fechaCheckout && h.fechaCheckout <= today) {
          return { ...h, activo: false };
        }
        return h;
      });
      if (JSON.stringify(updated) !== JSON.stringify(prev)) return updated;
      return prev;
    });
  }, []);

  const checkIn = useCallback((huesped: Omit<Huesped, 'id' | 'activo'>) => {
    const newHuesped: Huesped = { ...huesped, id: crypto.randomUUID(), activo: true };
    setHuespedes(prev => [...prev, newHuesped]);
    setComedor(prev => [...prev, {
      huespedId: newHuesped.id, estado: 'Activo' as const,
      separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
      motivoAusencia: '', observaciones: '', particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
    return newHuesped;
  }, []);

  const checkOut = useCallback((id: string, fecha?: string) => {
    const checkoutDate = fecha || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    if (checkoutDate > today) {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, fechaCheckout: checkoutDate } : h));
    } else {
      setHuespedes(prev => prev.map(h => h.id === id ? { ...h, activo: false, fechaCheckout: checkoutDate } : h));
      setComedor(prev => prev.filter(c => c.huespedId !== id));
    }
  }, []);

  const deleteHuesped = useCallback((id: string) => {
    setHuespedes(prev => prev.filter(h => h.id !== id));
    setComedor(prev => prev.filter(c => c.huespedId !== id));
    setIncidencias(prev => prev.filter(i => i.huespedId !== id));
  }, []);

  const editHuesped = useCallback((id: string, data: Partial<Huesped>) => {
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  }, []);

  const reincorporar = useCallback((id: string, habitacion: string, cama: number) => {
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, activo: true, habitacion, cama, fechaCheckout: undefined, fechaEntrada: new Date().toISOString().split('T')[0] } : h
    ));
    setComedor(prev => [...prev, {
      huespedId: id, estado: 'Activo' as const,
      separarComidas: ['Todas'], diasSeparar: ['Todos los días'],
      motivoAusencia: '', observaciones: '', particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
  }, []);

  const cambiarCama = useCallback((id: string, habitacion: string, cama: number) => {
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, habitacion, cama } : h));
  }, []);

  const addLlegada = useCallback((llegada: Omit<ProximaLlegada, 'id'>) => {
    setLlegadas(prev => [...prev, { ...llegada, id: crypto.randomUUID() }]);
  }, []);

  const editLlegada = useCallback((id: string, data: Partial<ProximaLlegada>) => {
    setLlegadas(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const confirmarLlegada = useCallback((llegadaId: string) => {
    setLlegadas(prev => {
      const llegada = prev.find(l => l.id === llegadaId);
      if (!llegada || !llegada.habitacionAsignada || !llegada.camaAsignada) return prev;
      checkIn({
        nombre: llegada.nombre, nie: llegada.nie, nacionalidad: llegada.nacionalidad,
        idioma: llegada.idioma, dieta: llegada.dieta, fechaEntrada: llegada.fechaLlegada,
        notas: llegada.notas, habitacion: llegada.habitacionAsignada, cama: llegada.camaAsignada,
      });
      return prev.filter(l => l.id !== llegadaId);
    });
  }, [checkIn]);

  const updateComedor = useCallback((huespedId: string, data: Partial<ComedorEntry>) => {
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
  }, []);

  const deleteLlegada = useCallback((id: string) => {
    setLlegadas(prev => prev.filter(l => l.id !== id));
  }, []);

  // Incidencias
  const addIncidencia = useCallback((data: Omit<Incidencia, 'id'>) => {
    setIncidencias(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  }, []);

  const toggleIncidenciaResuelta = useCallback((id: string) => {
    setIncidencias(prev => prev.map(i => i.id === id ? { ...i, resuelta: !i.resuelta } : i));
  }, []);

  const deleteIncidencia = useCallback((id: string) => {
    setIncidencias(prev => prev.filter(i => i.id !== id));
  }, []);

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

  const addUser = useCallback((account: UserAccount) => { setUsers(prev => [...prev, account]); }, []);
  const removeUser = useCallback((email: string) => { setUsers(prev => prev.filter(u => u.email !== email)); }, []);
  const authenticate = useCallback((email: string, password: string): UserAccount | null => {
    return users.find(u => u.email === email && u.password === password) || null;
  }, [users]);

  // Albergue management
  const addAlbergue = useCallback((nombre: string) => {
    const newAlbergue: Albergue = { id: crypto.randomUUID(), nombre, rooms: [] };
    setAlbergues(prev => [...prev, newAlbergue]);
    return newAlbergue;
  }, []);

  const editAlbergueName = useCallback((id: string, nombre: string) => {
    setAlbergues(prev => prev.map(a => a.id === id ? { ...a, nombre } : a));
  }, []);

  const deleteAlbergue = useCallback((id: string) => {
    setAlbergues(prev => prev.filter(a => a.id !== id));
    localStorage.removeItem(`${id}_huespedes`);
    localStorage.removeItem(`${id}_comedor`);
    localStorage.removeItem(`${id}_llegadas`);
    localStorage.removeItem(`${id}_incidencias`);
  }, []);

  const updateRooms = useCallback((newRooms: Room[]) => {
    setAlbergues(prev => prev.map(a => a.id === albergueId ? { ...a, rooms: newRooms } : a));
  }, [albergueId]);

  return {
    huespedes, huespedActivos, comedor, llegadas, users, incidencias,
    rooms, totalCamas, albergues, currentAlbergue,
    checkIn, checkOut, cambiarCama, deleteHuesped, editHuesped, reincorporar,
    addLlegada, editLlegada, confirmarLlegada, deleteLlegada,
    updateComedor,
    addIncidencia, toggleIncidenciaResuelta, deleteIncidencia,
    getOccupant, getFreeBeds,
    addUser, removeUser, authenticate,
    addAlbergue, editAlbergueName, deleteAlbergue, updateRooms,
  };
}
