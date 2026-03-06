import { useState, useEffect, useCallback } from 'react';
import { Huesped, ComedorEntry, ProximaLlegada, ROOMS, Dieta, UserAccount, UserRole } from '@/types';

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

const DEFAULT_USERS: UserAccount[] = [
  { email: 'albergue@liberamundo.com', password: 'admin123', role: 'admin', nombre: 'Administrador' },
];

export function useAlbergueStore() {
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => loadFromStorage('huespedes', []));
  const [comedor, setComedor] = useState<ComedorEntry[]>(() => loadFromStorage('comedor', []));
  const [llegadas, setLlegadas] = useState<ProximaLlegada[]>(() => loadFromStorage('llegadas', []));
  const [users, setUsers] = useState<UserAccount[]>(() => loadFromStorage('users', DEFAULT_USERS));

  useEffect(() => saveToStorage('huespedes', huespedes), [huespedes]);
  useEffect(() => saveToStorage('comedor', comedor), [comedor]);
  useEffect(() => saveToStorage('llegadas', llegadas), [llegadas]);
  useEffect(() => saveToStorage('users', users), [users]);

  // Auto-process: checkout guests with past checkout dates, auto-confirm llegadas with past entry dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Auto checkout guests whose fechaCheckout has passed
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
    const newHuesped: Huesped = {
      ...huesped,
      id: crypto.randomUUID(),
      activo: true,
    };
    setHuespedes(prev => [...prev, newHuesped]);
    setComedor(prev => [...prev, {
      huespedId: newHuesped.id,
      separarComidas: ['Todas'],
      diasSeparar: ['Todos los días'],
      motivoAusencia: '',
      observaciones: '',
      particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
    return newHuesped;
  }, []);

  const checkOut = useCallback((id: string, fecha?: string) => {
    const checkoutDate = fecha || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    if (checkoutDate > today) {
      // Future date: keep active but set checkout date, will auto-deactivate
      setHuespedes(prev => prev.map(h =>
        h.id === id ? { ...h, fechaCheckout: checkoutDate } : h
      ));
    } else {
      // Today or past: immediate checkout
      setHuespedes(prev => prev.map(h =>
        h.id === id ? { ...h, activo: false, fechaCheckout: checkoutDate } : h
      ));
      setComedor(prev => prev.filter(c => c.huespedId !== id));
    }
  }, []);

  const deleteHuesped = useCallback((id: string) => {
    setHuespedes(prev => prev.filter(h => h.id !== id));
    setComedor(prev => prev.filter(c => c.huespedId !== id));
  }, []);

  const editHuesped = useCallback((id: string, data: Partial<Huesped>) => {
    setHuespedes(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  }, []);

  const reincorporar = useCallback((id: string, habitacion: string, cama: number) => {
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, activo: true, habitacion, cama, fechaCheckout: undefined, fechaEntrada: new Date().toISOString().split('T')[0] } : h
    ));
    setComedor(prev => [...prev, {
      huespedId: id,
      separarComidas: ['Todas'],
      diasSeparar: ['Todos los días'],
      motivoAusencia: '',
      observaciones: '',
      particularidades: '',
      ultimaModificacion: new Date().toISOString(),
    }]);
  }, []);

  const cambiarCama = useCallback((id: string, habitacion: string, cama: number) => {
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, habitacion, cama } : h
    ));
  }, []);

  const addLlegada = useCallback((llegada: Omit<ProximaLlegada, 'id'>) => {
    setLlegadas(prev => [...prev, { ...llegada, id: crypto.randomUUID() }]);
  }, []);

  const editLlegada = useCallback((id: string, data: Partial<ProximaLlegada>) => {
    setLlegadas(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const confirmarLlegada = useCallback((llegadaId: string) => {
    const llegada = llegadas.find(l => l.id === llegadaId);
    if (!llegada || !llegada.habitacionAsignada || !llegada.camaAsignada) return;
    checkIn({
      nombre: llegada.nombre,
      nie: llegada.nie,
      nacionalidad: llegada.nacionalidad,
      idioma: llegada.idioma,
      dieta: llegada.dieta,
      fechaEntrada: llegada.fechaLlegada,
      notas: llegada.notas,
      habitacion: llegada.habitacionAsignada,
      cama: llegada.camaAsignada,
    });
    setLlegadas(prev => prev.filter(l => l.id !== llegadaId));
  }, [llegadas, checkIn]);

  const updateComedor = useCallback((huespedId: string, data: Partial<ComedorEntry>) => {
    setComedor(prev => {
      const idx = prev.findIndex(c => c.huespedId === huespedId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data, ultimaModificacion: new Date().toISOString() };
        return updated;
      }
      return [...prev, {
        huespedId,
        separarComidas: ['Todas'],
        diasSeparar: ['Todos los días'],
        motivoAusencia: '',
        observaciones: '',
        particularidades: '',
        ...data,
        ultimaModificacion: new Date().toISOString(),
      }];
    });
  }, []);

  const deleteLlegada = useCallback((id: string) => {
    setLlegadas(prev => prev.filter(l => l.id !== id));
  }, []);

  const huespedActivos = huespedes.filter(h => h.activo);

  const getOccupant = useCallback((habitacion: string, cama: number) => {
    return huespedActivos.find(h => h.habitacion === habitacion && h.cama === cama);
  }, [huespedActivos]);

  const getFreeBeds = useCallback(() => {
    const occupied = new Set(huespedActivos.map(h => `${h.habitacion}-${h.cama}`));
    const free: { habitacion: string; cama: number }[] = [];
    for (const room of ROOMS) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) {
          free.push({ habitacion: room.id, cama: i });
        }
      }
    }
    return free;
  }, [huespedActivos]);

  // User management
  const addUser = useCallback((account: UserAccount) => {
    setUsers(prev => [...prev, account]);
  }, []);

  const removeUser = useCallback((email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  }, []);

  const authenticate = useCallback((email: string, password: string): UserAccount | null => {
    return users.find(u => u.email === email && u.password === password) || null;
  }, [users]);

  return {
    huespedes, huespedActivos, comedor, llegadas, users,
    checkIn, checkOut, cambiarCama, deleteHuesped, editHuesped, reincorporar,
    addLlegada, editLlegada, confirmarLlegada, deleteLlegada,
    updateComedor,
    getOccupant, getFreeBeds,
    addUser, removeUser, authenticate,
  };
}
