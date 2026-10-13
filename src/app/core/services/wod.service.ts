import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, updateDoc, doc } from '@angular/fire/firestore';
import { Wod, Score } from '@core/models/wod.model';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WodService {
  private firestore = inject(Firestore);

  // Obtener todos los WODs creados
  async getAllWods(): Promise<Wod[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'wods'));
    const wods: Wod[] = [];
    querySnapshot.forEach((docSnap) => {
      wods.push({ id: docSnap.id, ...docSnap.data() } as Wod);
    });
    return wods;
  }

  // Obtener el WOD de una fecha específica
  async getWodByDate(fecha: string): Promise<Wod | null> {
    // ... (mantén tu lógica actual o usa getAllWods si prefieres filtrarlos)
    const querySnapshot = await getDocs(collection(this.firestore, 'wods'));
    let found: Wod | null = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Wod;
      if (data.fecha === fecha) {
        found = { id: docSnap.id, ...data };
      }
    });
    return found;
  }

  // Publicar un nuevo WOD
  createWod(wod: Wod) {
    return from(addDoc(collection(this.firestore, 'wods'), wod));
  }

  // Actualizar un WOD existente
  updateWod(wodId: string, wodData: Partial<Wod>) {
    const wodRef = doc(this.firestore, `wods/${wodId}`);
    return from(updateDoc(wodRef, wodData));
  }

  // Registrar score...
  submitScore(score: Score) {
    return from(addDoc(collection(this.firestore, 'scores'), {
      ...score,
      createdAt: new Date()
    }));
  }

  async getScoresByWod(wodId: string): Promise<Score[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'scores'));
    const scores: Score[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Score;
      if (data.wodId === wodId) {
        scores.push({ id: docSnap.id, ...data });
      }
    });
    return scores;
  }
}