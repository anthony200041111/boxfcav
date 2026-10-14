// src/app/core/services/competition.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Competition, CompetitionTeam, CompetitionWod, CompetitionScore } from '@core/models/competition.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompetitionService {
  private firestore = inject(Firestore);

  async getCompetitions(): Promise<Competition[]> {
    const colRef = collection(this.firestore, 'competitions');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Competition));
  }

  async getCompetitionById(id: string): Promise<Competition | null> {
    const docRef = doc(this.firestore, 'competitions', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Competition) : null;
  }

  createCompetition(competition: Competition): Observable<any> {
    const colRef = collection(this.firestore, 'competitions');
    return from(addDoc(colRef, competition));
  }

  async updateCompetitionData(competitionId: string, data: Partial<Competition>): Promise<void> {
    const docRef = doc(this.firestore, 'competitions', competitionId);
    await updateDoc(docRef, data);
  }
}