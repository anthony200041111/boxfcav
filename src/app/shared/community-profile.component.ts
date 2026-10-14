import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '@core/services/admin.service';
import { PrService } from '@core/services/pr.service';
import { UserProfile } from '@core/models/user.model';
import { PersonalRecord } from '@core/models/wod.model';

@Component({
  selector: 'app-community-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="brand-box">
          <div class="wolf-logo-badge">🐺</div>
          <div>
            <h1>FC ACTIVE WOLF</h1>
            <span class="subtitle-tag">Perfil del Miembro de la Manada</span>
          </div>
        </div>
        <button class="logout-btn" (click)="goBack()">⬅️ Volver</button>
      </header>

      <main class="content-grid-layout">
        @if (loading()) {
          <div class="empty-card-state">Cargando perfil del atleta...</div>
        } @else if (profile()) {
          
          <!-- TARJETA DE PERFIL MODERNA WOLF -->
          <div class="profile-hero-card">
            <div class="profile-avatar-large">
              @if (profile()?.fotoUrl) {
                <img [src]="profile()?.fotoUrl" alt="Avatar" class="avatar-real-img" />
              } @else {
                <span>🐺</span>
              }
            </div>
            <h2>{{ profile()?.nombre }}</h2>
            <span class="role-pill-badge" [class.badge-athlete]="profile()?.rol === 'athlete'" [class.badge-coach]="profile()?.rol === 'coach'">
              {{ profile()?.rol === 'coach' ? '🔥 COACH' : '💪 ATLETA' }}
            </span>
            <p class="member-bio-text">"{{ profile()?.bio || 'Atleta enfocado en dar lo mejor en cada WOD.' }}"</p>
            
            <div class="profile-extra-info">
              <div class="info-pill">
                <span>📧 Correo:</span> <strong>{{ profile()?.email }}</strong>
              </div>
            </div>
          </div>

          <div class="section-heading" style="margin-top: 40px;">
            <h2>🏆 Marcas Personales & PRs Registrados</h2>
            <p>Historial de fuerza y rendimiento de este miembro.</p>
          </div>

          <div class="table-card-wrapper">
            @if (prs().length === 0) {
              <div class="empty-card-state">Este usuario aún no ha registrado marcas personales en la plataforma.</div>
            } @else {
              <table class="modern-data-table">
                <thead>
                  <tr>
                    <th>Movimiento</th>
                    <th>Marca Récord</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pr of prs(); track pr.id) {
                    <tr>
                      <td><strong>{{ pr.movimiento }}</strong></td>
                      <td><span class="pr-pill">{{ pr.marca }}</span></td>
                      <td><span class="date-text">{{ pr.fecha }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

        } @else {
          <div class="empty-card-state">Usuario no encontrado o perfil no disponible.</div>
        }
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background: #0d0d0d; color: #f1f1f1; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding-bottom: 60px; }
    
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: #161616; border-bottom: 3px solid #ff4500; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .wolf-logo-badge { font-size: 32px; background: rgba(255, 69, 0, 0.15); width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid rgba(255, 69, 0, 0.4); }
    .dashboard-header h1 { font-size: 22px; margin: 0; color: #ff4500; font-weight: 800; letter-spacing: 0.5px; }
    .subtitle-tag { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }

    .logout-btn { background: #222; color: #fff; border: 1px solid #444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s; }
    .logout-btn:hover { background: #ff4500; border-color: #ff4500; }

    .content-grid-layout { padding: 32px 24px; max-width: 900px; margin: 0 auto; }
    .section-heading { margin-bottom: 24px; }
    .section-heading h2 { color: #fff; border-left: 5px solid #ff4500; padding-left: 14px; margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .section-heading p { color: #888; margin: 0; font-size: 13px; }

    .profile-hero-card { background: #181818; border: 1px solid #2c2c2c; border-radius: 16px; padding: 36px 24px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .profile-avatar-large { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; margin: 0 auto 16px auto; border: 3px solid #ff4500; display: flex; align-items: center; justify-content: center; background: #222; font-size: 40px; box-shadow: 0 0 20px rgba(255,69,0,0.4); }
    .avatar-real-img { width: 100%; height: 100%; object-fit: cover; }
    .profile-hero-card h2 { margin: 0 0 10px 0; color: #fff; font-size: 22px; }
    
    .role-pill-badge { font-size: 11px; padding: 4px 12px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 16px; letter-spacing: 0.5px; }
    .badge-athlete { background: rgba(21, 101, 192, 0.2); color: #64b5f6; border: 1px solid rgba(21, 101, 192, 0.4); }
    .badge-coach { background: rgba(239, 108, 0, 0.2); color: #ffb74d; border: 1px solid rgba(239, 108, 0, 0.4); }

    .member-bio-text { color: #aaa; font-style: italic; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5; }
    
    .profile-extra-info { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; border-top: 1px solid #282828; padding-top: 20px; }
    .info-pill { background: #222; padding: 8px 16px; border-radius: 8px; font-size: 12px; color: #ccc; border: 1px solid #333; }
    .info-pill strong { color: #fff; }

    .table-card-wrapper { background: #181818; border-radius: 14px; padding: 24px; border: 1px solid #2c2c2c; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .modern-data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    .modern-data-table th, .modern-data-table td { padding: 14px 16px; border-bottom: 1px solid #252525; }
    .modern-data-table th { background: #141414; color: #ff4500; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .pr-pill { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 5px 12px; border-radius: 6px; font-weight: bold; border: 1px solid rgba(255, 69, 0, 0.3); }
    .date-text { color: #888; }
    .empty-card-state { background: #161616; padding: 40px; border-radius: 12px; text-align: center; color: #777; border: 1px dashed #333; font-style: italic; }
  `]
})
export class CommunityProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private prService = inject(PrService);

  profile = signal<UserProfile | null>(null);
  prs = signal<PersonalRecord[]>([]);
  loading = signal<boolean>(true);

  async ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      try {
        const user = await this.adminService.getUserById(uid);
        this.profile.set(user);
        const userPrs = await this.prService.getPrsByAthlete(uid);
        this.prs.set(userPrs);
      } catch (err) {
        console.error('Error cargando perfil de comunidad:', err);
      }
    }
    this.loading.set(false);
  }

  goBack() {
    window.history.back();
  }
}