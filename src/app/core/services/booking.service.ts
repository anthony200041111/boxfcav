import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from '@angular/fire/firestore';
import { ClassSlot } from '@core/models/wod.model';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private firestore = inject(Firestore);

  // Obtener todas las clases (para el panel del coach)
  async getAllClasses(): Promise<ClassSlot[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'classes'));
    const classes: ClassSlot[] = [];
    querySnapshot.forEach((docSnap) => {
      classes.push({ id: docSnap.id, ...docSnap.data() } as ClassSlot);
    });
    return classes;
  }

  // Obtener las clases disponibles para una fecha específica
  async getClassesByDate(fecha: string): Promise<ClassSlot[]> {
    const q = query(collection(this.firestore, 'classes'), where('fecha', '==', fecha));
    const querySnapshot = await getDocs(q);
    const classes: ClassSlot[] = [];
    querySnapshot.forEach((docSnap) => {
      classes.push({ id: docSnap.id, ...docSnap.data() } as ClassSlot);
    });
    return classes;
  }

  // El coach crea un horario de clase
  createClassSlot(slot: ClassSlot) {
    return from(addDoc(collection(this.firestore, 'classes'), slot));
  }

  // El coach actualiza un horario de clase (ej. cambiar WOD o capacidad)
  updateClassSlot(classId: string, data: Partial<ClassSlot>) {
    const classRef = doc(this.firestore, `classes/${classId}`);
    return from(updateDoc(classRef, data));
  }

  // Reservar un cupo (Atleta)
  async bookClass(classId: string, athleteUid: string): Promise<boolean> {
    const classRef = doc(this.firestore, `classes/${classId}`);
    const snap = await getDoc(classRef);
    if (!snap.exists()) return false;

    const data = snap.data() as ClassSlot;
    const inscritos = data.atletasInscritos || [];

    if (inscritos.includes(athleteUid)) return false;
    if (inscritos.length >= (data.capacidadMaxima || 20)) return false;

    await updateDoc(classRef, {
      atletasInscritos: arrayUnion(athleteUid)
    });
    return true;
  }

  // Cancelar reserva (Atleta)
  async cancelBooking(classId: string, athleteUid: string): Promise<void> {
    const classRef = doc(this.firestore, `classes/${classId}`);
    await updateDoc(classRef, {
      atletasInscritos: arrayRemove(athleteUid)
    });
  }
}