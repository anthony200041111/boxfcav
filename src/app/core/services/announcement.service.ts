import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { Announcement } from '@core/models/wod.model';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private firestore = inject(Firestore);

  async getAllAnnouncements(): Promise<Announcement[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'announcements'));
    const announcements: Announcement[] = [];
    querySnapshot.forEach((docSnap) => {
      announcements.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
    });
    return announcements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  createAnnouncement(announcement: Announcement) {
    return from(addDoc(collection(this.firestore, 'announcements'), announcement));
  }

  // Eliminar un anuncio por su ID
  deleteAnnouncement(id: string) {
    const annRef = doc(this.firestore, `announcements/${id}`);
    return from(deleteDoc(annRef));
  }
}