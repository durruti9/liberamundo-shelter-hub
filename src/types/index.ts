export interface Huesped {
  id: string;
  nombre: string;
  nie: string;
  nacionalidad: string;
  idioma: string;
  dieta: Dieta;
  fechaEntrada: string;
  fechaCheckout?: string;
  notas: string;
  habitacion: string;
  cama: number;
  activo: boolean;
}

export type Dieta =
  | 'Omnívora estándar'
  | 'Halal'
  | 'Kosher'
  | 'Vegetariana'
  | 'Vegana'
  | 'Hindú / sin vacuno'
  | 'Jain / estricto vegetariano'
  | 'Sin cerdo (no halal)'
  | 'Sin vacuno / sin ternera'
  | 'Situación especial'
  | 'Alergias e intolerancias';

export interface ComedorEntry {
  huespedId: string;
  semana: string;
  separarComidas: string;
  diasSeparar: string;
  motivoAusencia: string;
  observaciones: string;
  particularidades: string;
}

export interface ProximaLlegada {
  id: string;
  nombre: string;
  nie: string;
  nacionalidad: string;
  idioma: string;
  dieta: Dieta;
  fechaLlegada: string;
  notas: string;
  habitacionAsignada?: string;
  camaAsignada?: number;
}

export interface Room {
  id: string;
  nombre: string;
  camas: number;
}

export const ROOMS: Room[] = [
  { id: '1.1', nombre: 'Habitación 1.1', camas: 2 },
  { id: '1.2', nombre: 'Habitación 1.2', camas: 2 },
  { id: '1.3', nombre: 'Habitación 1.3', camas: 4 },
  { id: '2.1', nombre: 'Habitación 2.1', camas: 5 },
  { id: '2.2', nombre: 'Habitación 2.2', camas: 4 },
  { id: '2.3', nombre: 'Habitación 2.3', camas: 4 },
];

export const DIETAS: Dieta[] = [
  'Omnívora estándar',
  'Halal',
  'Kosher',
  'Vegetariana',
  'Vegana',
  'Hindú / sin vacuno',
  'Jain / estricto vegetariano',
  'Sin cerdo (no halal)',
  'Sin vacuno / sin ternera',
  'Situación especial',
  'Alergias e intolerancias',
];

export const TOTAL_CAMAS = ROOMS.reduce((acc, r) => acc + r.camas, 0);
