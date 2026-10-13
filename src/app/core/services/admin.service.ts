import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { UserProfile } from '@core/models/user.model';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore = inject(Firestore);

  // Obtener todos los usuarios registrados en el sistema
  async getAllUsers(): Promise<UserProfile[]> {
    const querySnapshot = await getDocs(collection(this.firestore, 'users'));
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as UserProfile);
    });
    return users;
  }

  // Obtener un usuario por su UID
  async getUserById(uid: string): Promise<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }

  // Actualizar el rol de un usuario ('athlete', 'coach', 'admin')
  updateUserRole(uid: string, nuevoRol: 'athlete' | 'coach' | 'admin') {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(updateDoc(userRef, { rol: nuevoRol }));
  }

  // Actualizar información del perfil (Nombre, Biografía, etc.)
  updateProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(updateDoc(userRef, data));
  }
}