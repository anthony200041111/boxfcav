import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { AdminService } from '@core/services/admin.service';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>🐺 FC ACTIVE WOLF - Panel de Administración</h1>
        <div class="user-info">
          <span>Admin: {{ userProfile()?.nombre || 'Administrador' }}</span>
          <button class="logout-btn" (click)="logout()">Cerrar Sesión</button>
        </div>
      </header>

      <main class="content">
        <!-- Pestañas de navegación -->
        <div class="tabs">
          <button [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">👥 Gestión de Usuarios</button>
          <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">⚙️ Editar Mi Perfil</button>
        </div>

        @if (activeTab() === 'users') {
          <section class="admin-section">
            <div class="section-title">
              <h2>👥 Listado General y Roles</h2>
            </div>

            @if (loading()) {
              <p class="loading-text">Cargando usuarios del sistema...</p>
            } @else {
              <div class="table-container">
                <table class="users-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Membresía</th>
                      <th>Rol Actual</th>
                      <th>Acciones / Cambiar Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of users(); track u.uid) {
                      <tr>
                        <td><strong>{{ u.nombre }}</strong></td>
                        <td>{{ u.email }}</td>
                        <td>
                          <span class="badge" [class.active]="u.estadoMembresia === 'activo'">
                            {{ u.estadoMembresia | uppercase }}
                          </span>
                        </td>
                        <td>
                          <span class="role-badge" [class]="u.rol">
                            {{ u.rol | uppercase }}
                          </span>
                        </td>
                        <td>
                          <div class="action-buttons">
                            @if (u.rol !== 'athlete') {
                              <button class="role-btn athlete" (click)="changeRole(u.uid, 'athlete')">Hacer Atleta</button>
                            }
                            @if (u.rol !== 'coach') {
                              <button class="role-btn coach" (click)="changeRole(u.uid, 'coach')">Hacer Coach</button>
                            }
                            @if (u.rol !== 'admin') {
                              <button class="role-btn admin" (click)="changeRole(u.uid, 'admin')">Hacer Admin</button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        } @else {
          <!-- SECCIÓN EDITAR PERFIL -->
          <section class="profile-section">
            <div class="section-title">
              <h2>⚙️ Configuración de Mi Perfil Social</h2>
            </div>

            <div class="form-card">
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" formControlName="nombre" placeholder="Tu nombre..." />
                </div>

                <div class="form-group">
                  <label>Biografía o Frase de Motivación</label>
                  <textarea formControlName="bio" rows="4" placeholder="Ej. Atleta enfocado en dar lo mejor en cada WOD..."></textarea>
                </div>

                @if (successMessage()) {
                  <div class="success-msg">{{ successMessage() }}</div>
                }

                <button type="submit" class="submit-btn" [disabled]="profileForm.invalid || saving()">
                  {{ saving() ? 'Guardando...' : 'ACTUALIZAR PERFIL' }}
                </button>
              </form>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background: #121212; color: #fff; font-family: sans-serif; padding-bottom: 40px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: #1e1e1e; border-bottom: 2px solid #ff4500; }
    .dashboard-header h1 { font-size: 20px; margin: 0; color: #ff4500; }
    .user-info { display: flex; align-items: center; gap: 20px; }
    .logout-btn { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .logout-btn:hover { background: #ff4500; }
    
    .content { padding: 40px; max-width: 900px; margin: 0 auto; }
    .tabs { display: flex; gap: 10px; margin-bottom: 30px; }
    .tabs button { background: #1e1e1e; color: #aaa; border: 1px solid #333; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .tabs button.active { background: #ff4500; color: #fff; border-color: #ff4500; }

    .section-title h2 { color: #fff; border-left: 4px solid #ff4500; padding-left: 12px; margin-bottom: 20px; font-size: 18px; }
    .loading-text { color: #888; font-style: italic; }
    
    .table-container { background: #1e1e1e; border-radius: 8px; border: 1px solid #333; overflow: hidden; }
    .users-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .users-table th, .users-table td { padding: 16px; border-bottom: 1px solid #2a2a2a; }
    .users-table th { background: #252525; color: #ff4500; font-weight: bold; }
    .users-table tr:hover { background: rgba(255, 69, 0, 0.03); }
    
    .badge { font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: bold; background: #333; color: #aaa; }
    .badge.active { background: #2e7d32; color: #fff; }
    
    .role-badge { font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .role-badge.athlete { background: #1565c0; color: #fff; }
    .role-badge.coach { background: #ef6c00; color: #fff; }
    .role-badge.admin { background: #c62828; color: #fff; }

    .action-buttons { display: flex; gap: 8px; }
    .role-btn { border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; color: #fff; transition: opacity 0.2s; }
    .role-btn:hover { opacity: 0.8; }
    .role-btn.athlete { background: #1565c0; }
    .role-btn.coach { background: #ef6c00; }
    .role-btn.admin { background: #c62828; }

    .form-card { background: #1e1e1e; border-radius: 8px; padding: 24px; border: 1px solid #333; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 6px; font-size: 13px; color: #bbb; }
    input, textarea { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: white; box-sizing: border-box; font-family: inherit; }
    input:focus, textarea:focus { border-color: #ff4500; outline: none; }
    textarea { resize: vertical; }
    .success-msg { background: rgba(46, 125, 50, 0.2); color: #81c784; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center; }
    .submit-btn { background: #ff4500; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  userProfile = this.authService.currentUserProfile;
  users = signal<UserProfile[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  activeTab = signal<'users' | 'profile'>('users');

  profileForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    bio: ['']
  });

  async ngOnInit() {
    await this.loadUsers();
    this.initProfileForm();
  }

  initProfileForm() {
    const profile = this.userProfile();
    if (profile) {
      this.profileForm.patchValue({
        nombre: profile.nombre || '',
        bio: profile.bio || ''
      });
    }
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const allUsers = await this.adminService.getAllUsers();
      this.users.set(allUsers);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async changeRole(uid: string, nuevoRol: 'athlete' | 'coach' | 'admin') {
    this.adminService.updateUserRole(uid, nuevoRol).subscribe({
      next: async () => {
        await this.loadUsers();
      },
      error: (err) => {
        console.error('Error actualizando rol:', err);
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    const profile = this.userProfile();
    if (!profile?.uid) return;

    this.saving.set(true);
    this.successMessage.set(null);

    this.adminService.updateProfile(profile.uid, this.profileForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('¡Perfil actualizado con éxito!');
      },
      error: (err) => {
        console.error('Error actualizando perfil:', err);
        this.saving.set(false);
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/auth']));
  }
}