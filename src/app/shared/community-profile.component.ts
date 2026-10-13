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
        <h1>🐺 FC ACTIVE WOLF - Comunidad</h1>
        <button class="logout-btn" (click)="goBack()">Volver</button>
      </header>

      <main class="content">
        @if (loading()) {
          <p class="loading-text">Cargando perfil del atleta...</p>
        } @else if (profile()) {
          <div class="profile-card">
            <div class="profile-avatar">🐺</div>
            <h2>{{ profile()?.nombre }}</h2>
            <p class="role-tag">{{ profile()?.rol | uppercase }}</p>
            <p class="bio">"{{ profile()?.bio || 'Atleta enfocado en dar lo mejor en cada WOD.' }}"</p>
          </div>

          <div class="section-title" style="margin-top: 30px;">
            <h2>🏆 Marcas Personales (PRs)</h2>
          </div>

          <div class="table-container">
            @if (prs().length === 0) {
              <p class="loading-text" style="padding: 20px;">Este usuario aún no ha registrado marcas personales.</p>
            } @else {
              <table class="prs-table">
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
                      <td><span class="pr-badge">{{ pr.marca }}</span></td>
                      <td>{{ pr.fecha }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        } @else {
          <p class="loading-text">Usuario no encontrado.</p>
        }
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background: #121212; color: #fff; font-family: sans-serif; padding-bottom: 40px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: #1e1e1e; border-bottom: 2px solid #ff4500; }
    .dashboard-header h1 { font-size: 20px; margin: 0; color: #ff4500; }
    .logout-btn { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .logout-btn:hover { background: #ff4500; }
    .content { padding: 40px; max-width: 800px; margin: 0 auto; }
    .loading-text { color: #888; font-style: italic; }

    .profile-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 30px; text-align: center; }
    .profile-avatar { font-size: 50px; background: #2a2a2a; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; margin: 0 auto 16px auto; border: 2px solid #ff4500; }
    .profile-card h2 { margin: 0 0 8px 0; color: #fff; }
    .role-tag { font-size: 11px; background: #ff4500; color: #fff; padding: 3px 10px; border-radius: 12px; display: inline-block; font-weight: bold; margin-bottom: 12px; }
    .bio { color: #aaa; font-style: italic; font-size: 14px; margin: 0; }

    .section-title h2 { color: #fff; border-left: 4px solid #ff4500; padding-left: 12px; font-size: 18px; }
    .table-container { background: #1e1e1e; border-radius: 8px; border: 1px solid #333; overflow: hidden; margin-top: 16px; }
    .prs-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .prs-table th, .prs-table td { padding: 14px; border-bottom: 1px solid #2a2a2a; }
    .prs-table th { background: #252525; color: #ff4500; }
    .pr-badge { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 4px 10px; border-radius: 4px; font-weight: bold; }
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
      const user = await this.adminService.getUserById(uid);
      this.profile.set(user);
      const userPrs = await this.prService.getPrsByAthlete(uid);
      this.prs.set(userPrs);
    }
    this.loading.set(false);
  }

  goBack() {
    window.history.back();
  }
}