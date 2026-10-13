export type WodType = 'AMRAP' | 'For Time' | 'EMOM' | 'Strength' | 'Tabata';

export interface Wod {
  id?: string;
  fecha: string;        // Formato 'YYYY-MM-DD'
  titulo: string;       // Ejemplo: "WOD - Fran" o "Heavy Murph Prep"
  tipo: WodType;
  descripcion: string;  // Detalle de los movimientos (ej. 21-15-9 Thrusters y Pull-ups)
  notaCoach?: string;   // Consejos o estímulo del coach
  creadoPor: string;    // UID del Coach que lo publicó
}

export interface Score {
  id?: string;
  wodId: string;
  athleteId: string;
  athleteName: string;
  resultado: string;    // Ejemplo: "4:25" o "12 Rondas + 5 reps"
  esRx: boolean;        // true si es RX, false si es Scaled
  comentarios?: string;
  createdAt: Date;
}

export interface ClassSlot {
  id?: string;
  fecha: string;        // 'YYYY-MM-DD'
  horario: string;      // Ej: '07:00 AM', '06:00 PM'
  coachName: string;
  capacidadMaxima: number; // Por defecto 20 atletas
  atletasInscritos: string[]; // Array de UIDs de los atletas
}

export interface PersonalRecord {
  id?: string;
  athleteId: string;
  movimiento: string;  // Ej: "Clean & Jerk", "Back Squat", "Fran"
  marca: string;       // Ej: "225 lbs" o "3:15"
  fecha: string;       // 'YYYY-MM-DD'
}

export interface ClassSlot {
  id?: string;
  fecha: string;        // 'YYYY-MM-DD'
  horario: string;      // Ej: '07:00 AM', '06:00 PM'
  coachName: string;
  capacidadMaxima: number; // Por defecto 20 atletas
  atletasInscritos: string[]; // Array de UIDs de los atletas
  wodId?: string;       // ID del WOD asignado a esta clase
}

export interface Announcement {
  id?: string;
  titulo: string;
  contenido: string;
  fecha: string;
  coachName: string;
  createdAt: Date;
}