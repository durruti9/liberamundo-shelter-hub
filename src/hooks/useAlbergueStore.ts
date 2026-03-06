import { useState, useEffect, useCallback } from 'react';
import { Huesped, ComedorEntry, ProximaLlegada } from '@/types';

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

export function useAlbergueStore() {
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => loadFromStorage('huespedes', []));
  const [comedor, setComedor] = useState<ComedorEntry[]>(() => loadFromStorage('comedor', []));
  const [llegadas, setLlegadas] = useState<ProximaLlegada[]>(() => loadFromStorage('llegadas', []));

  useEffect(() => saveToStorage('huespedes', huespedes), [huespedes]);
  useEffect(() => saveToStorage('comedor', comedor), [comedor]);
  useEffect(() => saveToStorage('llegadas', llegadas), [llegadas]);

  const checkIn = useCallback((huesped: Omit<Huesped, 'id' | 'activo'>) => {
    const newHuesped: Huesped = {
      ...huesped,
      id: crypto.randomUUID(),
      activo: true,
    };
    setHuespedes(prev => [...prev, newHuesped]);
    // Auto-add comedor entry
    const semana = getCurrentWeek();
    setComedor(prev => [...prev, {
      huespedId: newHuesped.id,
      semana,
      separarComidas: ['Todas'],
      dias: 'Todos',
      motivoAusencia: '',
      observaciones: '',
      particularidades: '',
    }]);
    return newHuesped;
  }, []);

  const checkOut = useCallback((id: string) => {
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, activo: false, fechaCheckout: new Date().toISOString().split('T')[0] } : h
    ));
    setComedor(prev => prev.filter(c => c.huespedId !== id));
  }, []);

  const cambiarCama = useCallback((id: string, habitacion: string, cama: number) => {
    setHuespedes(prev => prev.map(h =>
      h.id === id ? { ...h, habitacion, cama } : h
    ));
  }, []);

  const addLlegada = useCallback((llegada: Omit<ProximaLlegada, 'id'>) => {
    setLlegadas(prev => [...prev, { ...llegada, id: crypto.randomUUID() }]);
  }, []);

  const confirmarLlegada = useCallback((llegadaId: string, habitacion: string, cama: number) => {
    const llegada = llegadas.find(l => l.id === llegadaId);
    if (!llegada) return;
    checkIn({
      nombre: llegada.nombre,
      nie: llegada.nie,
      nacionalidad: llegada.nacionalidad,
      idioma: llegada.idioma,
      dieta: llegada.dieta,
      fechaEntrada: llegada.fechaLlegada,
      notas: llegada.notas,
      habitacion,
      cama,
    });
    setLlegadas(prev => prev.filter(l => l.id !== llegadaId));
  }, [llegadas, checkIn]);

  const updateComedor = useCallback((huespedId: string, semana: string, data: Partial<ComedorEntry>) => {
    setComedor(prev => {
      const idx = prev.findIndex(c => c.huespedId === huespedId && c.semana === semana);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data };
        return updated;
      }
      return [...prev, { huespedId, semana, separarComidas: ['Todas'], dias: 'Todos', motivoAusencia: '', observaciones: '', particularidades: '', ...data }];
    });
  }, []);

  const nuevaSemana = useCallback(() => {
    const semana = getCurrentWeek();
    const activos = huespedes.filter(h => h.activo);
    const newEntries: ComedorEntry[] = activos.map(h => {
      const existing = comedor.find(c => c.huespedId === h.id);
      return {
        huespedId: h.id,
        semana,
        separarComidas: existing?.separarComidas || ['Todas'],
        dias: existing?.dias || 'Todos',
        motivoAusencia: '',
        observaciones: '',
        particularidades: existing?.particularidades || '',
      };
    });
    setComedor(prev => [...prev.filter(c => c.semana !== semana), ...newEntries]);
  }, [huespedes, comedor]);

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
    const { ROOMS } = require('@/types');
    for (const room of ROOMS) {
      for (let i = 1; i <= room.camas; i++) {
        if (!occupied.has(`${room.id}-${i}`)) {
          free.push({ habitacion: room.id, cama: i });
        }
      }
    }
    return free;
  }, [huespedActivos]);

  return {
    huespedes, huespedActivos, comedor, llegadas,
    checkIn, checkOut, cambiarCama,
    addLlegada, confirmarLlegada, deleteLlegada,
    updateComedor, nuevaSemana,
    getOccupant, getFreeBeds,
  };
}

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} a ${fmt(end)}`;
}

export { getCurrentWeek };
