// src/app/core/models/competition.model.ts
export interface CompetitionTeam {
  id: string;
  nombreEquipo: string;
  categoria: string; // 'RX', 'Scaled', etc.
  tipo: 'individual' | 'pareja' | 'equipo';
  integrantesUids: string[]; // UIDs de los atletas registrados en la app
  integrantesNombres: string[]; // Nombres para visualización rápida
}

export interface CompetitionWod {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'For Time' | 'AMRAP' | 'EMOM' | 'Max Weight';
}

export interface CompetitionScore {
  teamId: string;
  wodId: string;
  resultado: string; // Ej: "4:12" o "320 reps"
  puntos?: number;
}

export interface Competition {
  id?: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'proxima' | 'en_curso' | 'finalizada';
  creadoPor: string;
  equiposInscritos: CompetitionTeam[];
  wodsCompetencia: CompetitionWod[];
  scores: CompetitionScore[];
}