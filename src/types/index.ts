export type UserRole = 'admin' | 'gestor' | 'personal_albergue';

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

export type EstadoComedor = 'Activo' | 'Pausado';

export interface ComedorEntry {
  huespedId: string;
  estado: EstadoComedor;
  separarComidas: string[];
  diasSeparar: string[];
  motivoAusencia: string;
  observaciones: string;
  particularidades: string;
  ultimaModificacion: string;
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

export type IncidentType = 'behavioral' | 'medical' | 'administrative' | 'social' | 'general' | 'other';

export interface Incidencia {
  id: string;
  huespedId: string; // empty string for general incidents
  huespedNombre: string; // 'General' for general incidents
  tipo: IncidentType;
  descripcion: string;
  fecha: string;
  resuelta: boolean;
  creadoPor: string;
}

export interface Room {
  id: string;
  nombre: string;
  camas: number;
  ultimaLimpieza?: string;
}

export interface Albergue {
  id: string;
  nombre: string;
  rooms: Room[];
}

export const DEFAULT_ROOMS: Room[] = [
  { id: '1.1', nombre: 'Habitación 1.1', camas: 2 },
  { id: '1.2', nombre: 'Habitación 1.2', camas: 2 },
  { id: '1.3', nombre: 'Habitación 1.3', camas: 4 },
  { id: '2.1', nombre: 'Habitación 2.1', camas: 5 },
  { id: '2.2', nombre: 'Habitación 2.2', camas: 4 },
  { id: '2.3', nombre: 'Habitación 2.3', camas: 4 },
];

export const DEFAULT_ALBERGUE: Albergue = {
  id: 'default',
  nombre: 'Albergue LiberaMundo',
  rooms: DEFAULT_ROOMS,
};

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

export interface UserAccount {
  email: string;
  password: string;
  role: UserRole;
}

export type BoardType = 'instrucciones' | 'peticiones';
export type BoardVisibility = 'todos' | 'gestor' | 'personal_albergue';

export interface BoardReply {
  id: string;
  autor: string;
  fecha: string;
  texto: string;
}

export interface BoardMessage {
  id: string;
  tipo: BoardType;
  autor: string;
  fecha: string;
  texto: string;
  visibilidad: BoardVisibility;
  resuelta: boolean;
  resolucion?: {
    autor: string;
    fecha: string;
    descripcion: string;
  };
  respuestas: BoardReply[];
}
