import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { WodService } from '@core/services/wod.service';
import { BookingService } from '@core/services/booking.service';
import { PrService } from '@core/services/pr.service';
import { AdminService } from '@core/services/admin.service';
import { AnnouncementService } from '@core/services/announcement.service';
import { Wod, Score, ClassSlot, PersonalRecord, Announcement } from '@core/models/wod.model';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-athlete-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>🐺 FC ACTIVE WOLF - Zona de Atletas</h1>
        <div class="user-info">
          <span>Hola, {{ userProfile()?.nombre || 'Atleta' }} | 🔥 Racha: {{ trainingStreak() }} días</span>
          <button class="logout-btn" (click)="logout()">Cerrar Sesión</button>
        </div>
      </header>

      <main class="content">
        @if (activeView() === 'menu') {
          <div class="section-title">
            <h2>🏠 Menú Principal</h2>
          </div>
          
          @if (announcements().length > 0) {
            <div class="announcement-banner">
              <h3>📢 Aviso del Box: {{ announcements()[0].titulo }}</h3>
              <p>{{ announcements()[0].contenido }}</p>
              <small>Publicado por {{ announcements()[0].coachName }} el {{ announcements()[0].fecha }}</small>
            </div>
          }

          <div class="menu-grid">
            <div class="menu-card" (click)="activeView.set('wod')">
              <div class="menu-icon">🏋️‍♂️</div>
              <h3>WOD & Clases</h3>
              <p>Revisa el entrenamiento del día, leaderboard y reserva tu cupo.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('prs')">
              <div class="menu-icon">🏆</div>
              <h3>Mis Récords & Progreso</h3>
              <p>Registra tus marcas personales y analiza tu evolución.</p>
            </div>

            <div class="menu-card" (click)="loadCommunityUsers(); activeView.set('social')">
              <div class="menu-icon">👥</div>
              <h3>Comunidad Social</h3>
              <p>Explora los perfiles, biografías y avances de los miembros del box.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('profile')">
              <div class="menu-icon">⚙️</div>
              <h3>Mi Perfil</h3>
              <p>Actualiza tu nombre, foto de dispositivo, biografía y datos.</p>
            </div>
          </div>
        } @else {
          <button class="back-menu-btn" (click)="activeView.set('menu')">⬅️ Volver al Menú</button>
        }

        @if (activeView() === 'wod') {
          <section class="booking-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>📅 Clases del Día ({{ today }})</h2>
            </div>

            @if (classes().length === 0) {
              <p class="loading-text">No hay horarios de clases publicados para hoy.</p>
            } @else {
              <div class="classes-grid">
                @for (c of classes(); track c.id) {
                  <div class="class-card" [class.full]="c.atletasInscritos.length >= c.capacidadMaxima">
                    <div class="time-badge">{{ c.horario }}</div>
                    <h3>Coach: {{ c.coachName }}</h3>
                    <p class="spots-info">
                      Cupos: <strong>{{ c.atletasInscritos.length }} / {{ c.capacidadMaxima }}</strong>
                    </p>

                    @if (isEnrolled(c)) {
                      <button class="cancel-btn" (click)="cancelBooking(c.id!)">Cancelar Reserva</button>
                    } @else if (c.atletasInscritos.length >= c.capacidadMaxima) {
                      <button class="full-btn" disabled>Clase Llena</button>
                    } @else {
                      <button class="book-btn" (click)="bookClass(c.id!)">Reservar Cupo</button>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <section class="wod-section" style="margin-top: 40px;">
            <div class="section-title">
              <h2>🏋️‍♂️ WOD del Día</h2>
            </div>

            @if (loadingWod()) {
              <p class="loading-text">Cargando entrenamiento...</p>
            } @else if (wod()) {
              <div class="wod-card">
                <div class="wod-badge">{{ wod()?.tipo }}</div>
                <h3>{{ wod()?.titulo }}</h3>
                <p class="wod-desc">{{ wod()?.descripcion }}</p>
                @if (wod()?.notaCoach) {
                  <div class="coach-note">
                    <strong>Nota del Coach:</strong> {{ wod()?.notaCoach }}
                  </div>
                }
              </div>

              <div class="score-form-card">
                <h4>Registrar tu Score</h4>
                <form [formGroup]="scoreForm" (ngSubmit)="submitScore()">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Resultado (ej. 4:25 o 12 Rondas)</label>
                      <input type="text" formControlName="resultado" placeholder="Tu marca..." />
                    </div>
                    <div class="form-group checkbox-group">
                      <label>
                        <input type="checkbox" formControlName="esRx" />
                        ¿Es RX?
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Comentarios (opcional)</label>
                    <input type="text" formControlName="comentarios" placeholder="Ej. Pesado pero divertido..." />
                  </div>
                  <button type="submit" class="submit-btn" [disabled]="scoreForm.invalid || submitting()">
                    {{ submitting() ? 'Guardando...' : 'GUARDAR SCORE' }}
                  </button>
                </form>
              </div>

              <div class="leaderboard-section">
                <h4>🏆 Leaderboard del Día</h4>
                @if (scores().length === 0) {
                  <p class="no-scores">Aún no hay scores registrados hoy.</p>
                } @else {
                  <ul class="score-list">
                    @for (s of scores(); track s.id) {
                      <li class="score-item">
                        <div class="athlete-info">
                          <strong>{{ s.athleteName }}</strong>
                          <span class="badge" [class.rx]="s.esRx" [class.scaled]="!s.esRx">
                            {{ s.esRx ? 'RX' : 'SCALED' }}
                          </span>
                        </div>
                        <div class="score-result">
                          <span>{{ s.resultado }}</span>
                          @if (s.comentarios) {
                            <small class="comment">"{{ s.comentarios }}"</small>
                          }
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>

            } @else {
              <div class="no-wod-card">
                <p>El Coach aún no ha publicado el WOD para hoy.</p>
              </div>
            }
          </section>

        } @else if (activeView() === 'prs') {
          <section class="prs-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>🏆 Mis Récords & Evolución de PRs</h2>
            </div>

            @if (myPrs().length > 0) {
              <div class="progress-chart-card">
                <h4>📊 Evolución Visual de Marcas</h4>
                <div class="bar-chart">
                  @for (pr of myPrs(); track pr.id) {
                    <div class="bar-item">
                      <div class="bar-label">{{ pr.movimiento }}</div>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: 85%;"></div>
                      </div>
                      <div class="bar-value">{{ pr.marca }}</div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="form-card" style="margin-bottom: 30px;">
              <h4>Añadir / Actualizar PR</h4>
              <form [formGroup]="prForm" (ngSubmit)="submitPr()">
                <div class="form-row">
                  <div class="form-group">
                    <label>Movimiento / Ejercicio</label>
                    <input type="text" formControlName="movimiento" placeholder="Ej. Clean & Jerk, Back Squat, Fran..." />
                  </div>
                  <div class="form-group">
                    <label>Marca (Peso o Tiempo)</label>
                    <input type="text" formControlName="marca" placeholder="Ej. 225 lbs o 3:45..." />
                  </div>
                </div>
                <button type="submit" class="submit-btn" [disabled]="prForm.invalid || addingPr()">
                  {{ addingPr() ? 'Guardando...' : 'GUARDAR PR' }}
                </button>
              </form>
            </div>

            <div class="table-container">
              @if (myPrs().length === 0) {
                <p class="loading-text" style="padding: 20px;">Aún no tienes marcas personales registradas.</p>
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
                    @for (pr of myPrs(); track pr.id) {
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
          </section>

        } @else if (activeView() === 'social') {
          <section class="social-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>👥 Comunidad del Box (Atletas y Coaches)</h2>
            </div>

            @if (loadingCommunity()) {
              <p class="loading-text">Cargando miembros de la comunidad...</p>
            } @else {
              <div class="community-grid">
                @for (member of communityMembers(); track member.uid) {
                  <div class="member-card">
                    <div class="member-avatar">
                      @if (member.fotoUrl) {
                        <img [src]="member.fotoUrl" alt="Avatar" class="avatar-img" />
                      } @else {
                        🐺
                      }
                    </div>
                    <h3>{{ member.nombre }}</h3>
                    <span class="role-badge" [class]="member.rol">{{ member.rol | uppercase }}</span>
                    <p class="member-bio">"{{ member.bio || 'Sin biografía aún.' }}"</p>
                  </div>
                }
              </div>
            }
          </section>

        } @else if (activeView() === 'profile') {
          <section class="profile-section" style="margin-top: 20px;">
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
                  <label>Subir Foto de Perfil (Dispositivo / Cámara)</label>
                  <input type="file" accept="image/*" (change)="onFileSelected($event)" class="file-input" />
                  @if (profileForm.get('fotoUrl')?.value) {
                    <div class="preview-container">
                      <img [src]="profileForm.get('fotoUrl')?.value" alt="Vista previa" class="preview-img" />
                      <small style="color: #2e7d32;">✔ Imagen cargada correctamente</small>
                    </div>
                  }
                </div>

                <div class="form-group">
                  <label>Biografía o Frase de Motivación</label>
                  <textarea formControlName="bio" rows="4" placeholder="Ej. Atleta enfocado en dar lo mejor en cada WOD..."></textarea>
                </div>
                @if (profileSuccess()) {
                  <div class="success-msg">{{ profileSuccess() }}</div>
                }
                <button type="submit" class="submit-btn" [disabled]="profileForm.invalid || savingProfile()">
                  {{ savingProfile() ? 'Guardando...' : 'ACTUALIZAR PERFIL' }}
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
    .section-title h2 { color: #fff; border-left: 4px solid #ff4500; padding-left: 12px; margin-bottom: 24px; font-size: 18px; }

    .announcement-banner { background: rgba(255, 69, 0, 0.1); border: 1px solid #ff4500; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .announcement-banner h3 { margin: 0 0 8px 0; color: #ff4500; font-size: 16px; }
    .announcement-banner p { color: #ddd; margin: 0 0 10px 0; font-size: 14px; }
    .announcement-banner small { color: #888; font-style: italic; }

    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .menu-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 24px; cursor: pointer; transition: all 0.2s ease; text-align: center; }
    .menu-card:hover { border-color: #ff4500; transform: translateY(-4px); background: #222; }
    .menu-icon { font-size: 36px; margin-bottom: 12px; }
    .menu-card h3 { margin: 0 0 8px 0; color: #fff; font-size: 18px; }
    .menu-card p { color: #aaa; font-size: 13px; margin: 0; line-height: 1.4; }
    .back-menu-btn { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
    .back-menu-btn:hover { background: #ff4500; }

    .progress-chart-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .progress-chart-card h4 { margin: 0 0 16px 0; color: #ff4500; font-size: 16px; }
    .bar-chart { display: flex; flex-direction: column; gap: 12px; }
    .bar-item { display: flex; align-items: center; gap: 15px; }
    .bar-label { width: 130px; font-size: 13px; font-weight: bold; color: #ccc; }
    .bar-track { flex: 1; background: #2a2a2a; height: 12px; border-radius: 6px; overflow: hidden; }
    .bar-fill { background: #ff4500; height: 100%; border-radius: 6px; }
    .bar-value { width: 80px; text-align: right; font-size: 13px; font-weight: bold; color: #ff6b4a; }

    .community-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .member-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; text-align: center; }
    .member-avatar { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; border: 2px solid #ff4500; display: flex; align-items: center; justify-content: center; background: #2a2a2a; font-size: 28px; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .member-card h3 { margin: 0 0 6px 0; color: #fff; font-size: 16px; }
    .role-badge { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
    .role-badge.athlete { background: #1565c0; color: #fff; }
    .role-badge.coach { background: #ef6c00; color: #fff; }
    .member-bio { color: #aaa; font-style: italic; font-size: 13px; margin: 0; }

    .preview-container { margin-top: 10px; display: flex; align-items: center; gap: 12px; background: #252525; padding: 10px; border-radius: 6px; }
    .preview-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ff4500; }
    .file-input { background: #2a2a2a; color: #aaa; padding: 10px; border-radius: 6px; border: 1px solid #333; cursor: pointer; }

    .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
    .class-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; position: relative; }
    .time-badge { background: #ff4500; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
    .class-card h3 { margin: 0 0 10px 0; font-size: 16px; color: #fff; }
    .spots-info { font-size: 13px; color: #aaa; margin-bottom: 16px; }
    .book-btn { background: #2e7d32; color: #fff; border: none; width: 100%; padding: 10px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .cancel-btn { background: #c62828; color: #fff; border: none; width: 100%; padding: 10px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .full-btn { background: #444; color: #888; border: none; width: 100%; padding: 10px; border-radius: 4px; font-weight: bold; cursor: not-allowed; }

    .loading-text, .no-scores { color: #888; font-style: italic; }
    .wod-card { background: #1e1e1e; border-radius: 8px; padding: 24px; border: 1px solid #333; position: relative; margin-bottom: 24px; }
    .wod-badge { position: absolute; top: 20px; right: 20px; background: #ff4500; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .wod-card h3 { margin-top: 0; font-size: 22px; color: #fff; }
    .wod-desc { white-space: pre-line; color: #ccc; line-height: 1.6; font-family: monospace; font-size: 14px; background: #121212; padding: 16px; border-radius: 6px; }
    .coach-note { margin-top: 16px; background: rgba(255, 69, 0, 0.1); border-left: 3px solid #ff4500; padding: 10px 14px; font-size: 13px; color: #ffab91; }
    
    .score-form-card, .leaderboard-section, .form-card { background: #1e1e1e; border-radius: 8px; padding: 24px; border: 1px solid #333; margin-bottom: 24px; }
    .score-form-card h4, .leaderboard-section h4, .form-card h4 { margin-top: 0; margin-bottom: 16px; color: #ff4500; }
    .form-row { display: flex; gap: 20px; }
    .form-group { margin-bottom: 16px; flex: 1; }
    .checkbox-group { display: flex; align-items: center; }
    .checkbox-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ddd; }
    label { display: block; margin-bottom: 6px; font-size: 13px; color: #bbb; }
    input[type="text"], textarea { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: white; box-sizing: border-box; font-family: inherit; }
    textarea { resize: vertical; }
    .success-msg { background: rgba(46, 125, 50, 0.2); color: #81c784; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center; }
    .submit-btn { background: #ff4500; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .no-wod-card { background: #1e1e1e; padding: 30px; border-radius: 8px; text-align: center; color: #888; border: 1px dashed #444; }
    
    .score-list { list-style: none; padding: 0; margin: 0; }
    .score-item { display: flex; justify-content: space-between; align-items: center; background: #252525; padding: 12px 16px; border-radius: 6px; margin-bottom: 10px; }
    .athlete-info { display: flex; align-items: center; gap: 12px; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .badge.rx { background: #2e7d32; color: #fff; }
    .badge.scaled { background: #ef6c00; color: #fff; }
    .score-result { text-align: right; }
    .score-result span { font-weight: bold; font-size: 16px; display: block; color: #ff4500; }
    .comment { color: #888; font-style: italic; }

    .table-container { background: #1e1e1e; border-radius: 8px; border: 1px solid #333; overflow: hidden; }
    .prs-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .prs-table th, .prs-table td { padding: 14px; border-bottom: 1px solid #2a2a2a; }
    .prs-table th { background: #252525; color: #ff4500; }
    .pr-badge { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 4px 10px; border-radius: 4px; font-weight: bold; }
  `]
})
export class AthleteDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private wodService = inject(WodService);
  private bookingService = inject(BookingService);
  private prService = inject(PrService);
  private adminService = inject(AdminService);
  private announcementService = inject(AnnouncementService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  userProfile = this.authService.currentUserProfile;
  today = new Date().toISOString().split('T')[0];
  
  activeView = signal<'menu' | 'wod' | 'prs' | 'social' | 'profile'>('menu');
  wod = signal<Wod | null>(null);
  scores = signal<Score[]>([]);
  classes = signal<ClassSlot[]>([]);
  myPrs = signal<PersonalRecord[]>([]);
  communityMembers = signal<UserProfile[]>([]);
  announcements = signal<Announcement[]>([]);
  trainingStreak = signal<number>(3);
  
  loadingWod = signal<boolean>(true);
  loadingCommunity = signal<boolean>(false);
  submitting = signal<boolean>(false);
  addingPr = signal<boolean>(false);
  savingProfile = signal<boolean>(false);
  profileSuccess = signal<string | null>(null);

  scoreForm: FormGroup = this.fb.group({
    resultado: ['', Validators.required],
    esRx: [true],
    comentarios: ['']
  });

  prForm: FormGroup = this.fb.group({
    movimiento: ['', Validators.required],
    marca: ['', Validators.required]
  });

  profileForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    fotoUrl: [''],
    bio: ['']
  });

  async ngOnInit() {
    await this.loadData();
    this.initProfileForm();
  }

  initProfileForm() {
    const profile = this.userProfile();
    if (profile) {
      this.profileForm.patchValue({
        nombre: profile.nombre || '',
        fotoUrl: profile.fotoUrl || '',
        bio: profile.bio || ''
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileForm.patchValue({ fotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  async loadData() {
    this.loadingWod.set(true);
    try {
      const foundWod = await this.wodService.getWodByDate(this.today);
      this.wod.set(foundWod);
      if (foundWod && foundWod.id) {
        const wodScores = await this.wodService.getScoresByWod(foundWod.id);
        this.scores.set(wodScores);
      }
      const loadedClasses = await this.bookingService.getClassesByDate(this.today);
      this.classes.set(loadedClasses);

      const anns = await this.announcementService.getAllAnnouncements();
      this.announcements.set(anns);

      const uid = this.userProfile()?.uid;
      if (uid) {
        const prs = await this.prService.getPrsByAthlete(uid);
        this.myPrs.set(prs);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      this.loadingWod.set(false);
    }
  }

  async loadCommunityUsers() {
    this.loadingCommunity.set(true);
    try {
      const allUsers = await this.adminService.getAllUsers();
      const filtered = allUsers.filter(u => u.rol === 'athlete' || u.rol === 'coach');
      this.communityMembers.set(filtered);
    } catch (err) {
      console.error('Error cargando comunidad:', err);
    } finally {
      this.loadingCommunity.set(false);
    }
  }

  isEnrolled(c: ClassSlot): boolean {
    const uid = this.userProfile()?.uid;
    return uid ? (c.atletasInscritos || []).includes(uid) : false;
  }

  async bookClass(classId: string) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;
    const success = await this.bookingService.bookClass(classId, uid);
    if (success) {
      this.trainingStreak.update(s => s + 1);
      await this.loadData();
    }
  }

  async cancelBooking(classId: string) {
    const uid = this.userProfile()?.uid;
    if (!uid) return;
    await this.bookingService.cancelBooking(classId, uid);
    await this.loadData();
  }

  submitScore() {
    if (this.scoreForm.invalid || !this.wod()?.id) return;
    this.submitting.set(true);
    const profile = this.userProfile();

    const newScore: Score = {
      wodId: this.wod()!.id!,
      athleteId: profile?.uid || 'unknown',
      athleteName: profile?.nombre || 'Atleta Anónimo',
      resultado: this.scoreForm.value.resultado,
      esRx: this.scoreForm.value.esRx,
      comentarios: this.scoreForm.value.comentarios,
      createdAt: new Date()
    };

    this.wodService.submitScore(newScore).subscribe({
      next: async () => {
        this.scoreForm.reset({ esRx: true });
        this.submitting.set(false);
        if (this.wod()?.id) {
          const updatedScores = await this.wodService.getScoresByWod(this.wod()!.id!);
          this.scores.set(updatedScores);
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  submitPr() {
    if (this.prForm.invalid) return;
    this.addingPr.set(true);
    const profile = this.userProfile();

    const newPr: PersonalRecord = {
      athleteId: profile?.uid || 'unknown',
      movimiento: this.prForm.value.movimiento,
      marca: this.prForm.value.marca,
      fecha: this.today
    };

    this.prService.addPr(newPr).subscribe({
      next: async () => {
        this.prForm.reset();
        this.addingPr.set(false);
        const uid = profile?.uid;
        if (uid) {
          const updatedPrs = await this.prService.getPrsByAthlete(uid);
          this.myPrs.set(updatedPrs);
        }
      },
      error: () => this.addingPr.set(false)
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    const uid = this.userProfile()?.uid;
    if (!uid) return;
    this.savingProfile.set(true);
    this.profileSuccess.set(null);

    this.adminService.updateProfile(uid, this.profileForm.value).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSuccess.set('¡Perfil actualizado con éxito!');
      },
      error: () => this.savingProfile.set(false)
    });
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/auth']));
  }
}