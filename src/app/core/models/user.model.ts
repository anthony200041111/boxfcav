export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  rol: 'athlete' | 'coach' | 'admin';
  estadoMembresia: 'activo' | 'inactivo' | 'vencido';
  fechaVencimiento: Date;
  apodo?: string;
  bio?: string;
  fotoUrl?: string;
  // Nuevos campos médicos y personales
  fechaNacimiento?: string;
  telefono?: string;
  contactoEmergencia?: string;
  condicionesMedicas?: string;
  tipoSangre?: string;
}