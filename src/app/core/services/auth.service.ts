import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { UserProfile } from '@core/models/user.model';
import { Observable, from, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  public currentUserProfile = signal<UserProfile | null>(null);
  public authState$ = authState(this.auth);

  constructor() {
    this.authState$.pipe(
      switchMap((user: User | null) => {
        if (user && user.uid) {
          return this.getUserProfile(user.uid);
        } else {
          return of(null);
        }
      })
    ).subscribe((profile: UserProfile | null) => {
      this.currentUserProfile.set(profile);
    });
  }

  login(email: string, pass: string) {
    return from(signInWithEmailAndPassword(this.auth, email, pass));
  }

register(email: string, pass: string, nombre: string, rol: 'athlete' | 'coach' = 'athlete') {
    return from(
      createUserWithEmailAndPassword(this.auth, email, pass).then(async (credential) => {
        const user = credential.user;
        const userProfile: UserProfile = {
          uid: user.uid,
          email: email,
          nombre: nombre,
          rol: rol,
          estadoMembresia: 'activo',
          fechaVencimiento: new Date() // <--- Cambiado de string a objeto Date
        };
        // Guardar el perfil del usuario en la colección 'users' de Firestore
        await setDoc(doc(this.firestore, `users/${user.uid}`), userProfile);
        return userProfile;
      })
    );
  }

  private async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }

  logout() {
    return from(signOut(this.auth));
  }
}