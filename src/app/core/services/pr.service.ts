import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';
import { PersonalRecord } from '@core/models/wod.model';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrService {
  private firestore = inject(Firestore);

  // Obtener los PRs de un atleta específico
  async getPrsByAthlete(athleteId: string): Promise<PersonalRecord[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'prs'));
    const prs: PersonalRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as PersonalRecord;
      if (data.athleteId === athleteId) {
        prs.push({ id: docSnap.id, ...data });
      }
    });
    return prs;
  }

  // Añadir un nuevo PR
  addPr(pr: PersonalRecord) {
    return from(addDoc(collection(this.firestore, 'prs'), pr));
  }
}