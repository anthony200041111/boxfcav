import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { WodService } from '@core/services/wod.service';
import { BookingService } from '@core/services/booking.service';
import { AdminService } from '@core/services/admin.service';
import { AnnouncementService } from '@core/services/announcement.service';
import { Wod, WodType, ClassSlot, Announcement } from '@core/models/wod.model';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>🐺 FC ACTIVE WOLF - Panel de Coach</h1>
        <div class="user-info">
          <span>Coach: {{ userProfile()?.nombre || 'Entrenador' }}</span>
          <button class="logout-btn" (click)="logout()">Cerrar Sesión</button>
        </div>
      </header>

      <main class="content">
        @if (activeView() === 'menu') {
          <div class="section-title">
            <h2>🏠 Menú Principal - Staff</h2>
          </div>
          <div class="menu-grid">
            <div class="menu-card" (click)="activeView.set('wod')">
              <div class="menu-icon">📝</div>
              <h3>Gestión de WODs</h3>
              <p>Publica entrenamientos diarios y edita el historial de WODs.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('classes')">
              <div class="menu-icon">📅</div>
              <h3>Horarios & WODs de Clases</h3>
              <p>Crea turnos de clases, asigna cupos y vincula un WOD específico.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('announcements')">
              <div class="menu-icon">📢</div>
              <h3>Muro de Anuncios</h3>
              <p>Publica avisos importantes y gestiona o elimina noticias del box.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('athletes')">
              <div class="menu-icon">👥</div>
              <h3>Atletas del Box</h3>
              <p>Monitorea los miembros inscritos y el estado de sus membresías.</p>
            </div>

            <div class="menu-card" (click)="loadCommunityUsers(); activeView.set('social')">
              <div class="menu-icon">🌍</div>
              <h3>Comunidad Social</h3>
              <p>Visualiza los perfiles y biografías de los atletas y coaches.</p>
            </div>

            <div class="menu-card" (click)="activeView.set('profile')">
              <div class="menu-icon">⚙️</div>
              <h3>Mi Perfil</h3>
              <p>Actualiza tu foto, información personal y biografía de coach.</p>
            </div>
          </div>
        } @else {
          <button class="back-menu-btn" (click)="activeView.set('menu')">⬅️ Volver al Menú</button>
        }

        @if (activeView() === 'wod') {
          <div class="wod-layout" style="margin-top: 20px;">
            <section class="publish-section">
              <div class="section-title">
                <h2>{{ editingWodId() ? '✏️ Editar WOD' : '📝 Publicar WOD del Día' }}</h2>
              </div>

              <div class="form-card">
                <form [formGroup]="wodForm" (ngSubmit)="saveWod()">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Fecha del WOD</label>
                      <input type="date" formControlName="fecha" />
                    </div>
                    <div class="form-group">
                      <label>Tipo de Entrenamiento</label>
                      <select formControlName="tipo">
                        @for (type of wodTypes; track type) {
                          <option [value]="type">{{ type }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Título del WOD</label>
                    <input type="text" formControlName="titulo" placeholder="Ej. WOD - Fran o Heavy Squat Clean" />
                  </div>

                  <div class="form-group">
                    <label>Descripción / Movimientos</label>
                    <textarea formControlName="descripcion" rows="5" placeholder="21-15-9 Thrusters..."></textarea>
                  </div>

                  <div class="form-group">
                    <label>Nota del Coach (opcional)</label>
                    <input type="text" formControlName="notaCoach" placeholder="Consejo o estímulo..." />
                  </div>

                  @if (successMessage()) {
                    <div class="success-msg">{{ successMessage() }}</div>
                  }

                  <div class="button-group">
                    <button type="submit" class="submit-btn" [disabled]="wodForm.invalid || publishing()">
                      {{ publishing() ? 'Guardando...' : (editingWodId() ? 'ACTUALIZAR WOD' : 'PUBLICAR WOD') }}
                    </button>
                    @if (editingWodId()) {
                      <button type="button" class="cancel-edit-btn" (click)="cancelEditWod()">Cancelar</button>
                    }
                  </div>
                </form>
              </div>
            </section>

            <section class="history-section" style="margin-top: 30px;">
              <div class="section-title">
                <h2>📚 Historial de WODs Creados</h2>
              </div>
              <div class="wods-list">
                @for (w of wodsList(); track w.id) {
                  <div class="wod-item-card">
                    <div class="wod-item-header">
                      <span class="date-tag">{{ w.fecha }}</span>
                      <span class="type-badge">{{ w.tipo }}</span>
                    </div>
                    <h4>{{ w.titulo }}</h4>
                    <p>{{ w.descripcion }}</p>
                    <button class="edit-btn" (click)="selectWodForEdit(w)">Editar WOD</button>
                  </div>
                }
              </div>
            </section>
          </div>

        } @else if (activeView() === 'classes') {
          <section class="classes-mgmt-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>{{ editingClassId() ? '✏️ Modificar Horario de Clase' : '📅 Programar Horario de Clase & WOD' }}</h2>
            </div>

            <div class="form-card" style="margin-bottom: 30px;">
              <form [formGroup]="classForm" (ngSubmit)="saveClassSlot()">
                <div class="form-row">
                  <div class="form-group">
                    <label>Fecha de la Clase</label>
                    <input type="date" formControlName="fecha" />
                  </div>
                  <div class="form-group">
                    <label>Horario (Ej. 07:00 AM)</label>
                    <input type="text" formControlName="horario" placeholder="07:00 AM" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Capacidad Máxima de Atletas</label>
                    <input type="number" formControlName="capacidadMaxima" />
                  </div>
                  <div class="form-group">
                    <label>Asignar WOD</label>
                    <select formControlName="wodId">
                      <option value="">-- Sin WOD asignado --</option>
                      @for (w of wodsList(); track w.id) {
                        <option [value]="w.id">{{ w.fecha }} - {{ w.titulo }} ({{ w.tipo }})</option>
                      }
                    </select>
                  </div>
                </div>

                @if (classSuccessMessage()) {
                  <div class="success-msg">{{ classSuccessMessage() }}</div>
                }

                <div class="button-group">
                  <button type="submit" class="submit-btn" [disabled]="classForm.invalid || savingClass()">
                    {{ savingClass() ? 'Guardando...' : (editingClassId() ? 'ACTUALIZAR CLASE' : 'CREAR HORARIO DE CLASE') }}
                  </button>
                  @if (editingClassId()) {
                    <button type="button" class="cancel-edit-btn" (click)="cancelEditClass()">Cancelar</button>
                  }
                </div>
              </form>
            </div>

            <div class="section-title">
              <h2>📋 Listado de Clases Programadas</h2>
            </div>
            <div class="classes-grid">
              @for (c of classesList(); track c.id) {
                <div class="class-card">
                  <div class="time-badge">{{ c.fecha }} - {{ c.horario }}</div>
                  <h3>Coach: {{ c.coachName || 'Staff' }}</h3>
                  <p class="spots-info">Cupos Máximos: <strong>{{ c.capacidadMaxima }}</strong></p>
                  <p class="spots-info">Inscritos: <strong>{{ c.atletasInscritos?.length || 0 }}</strong></p>
                  <button class="edit-btn" style="width: 100%; margin-top: 10px;" (click)="selectClassForEdit(c)">Modificar Clase</button>
                </div>
              }
            </div>
          </section>

        } @else if (activeView() === 'announcements') {
          <section class="announcements-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>📢 Gestión del Muro de Anuncios</h2>
            </div>

            <div class="form-card" style="margin-bottom: 30px;">
              <form [formGroup]="announcementForm" (ngSubmit)="publishAnnouncement()">
                <div class="form-group">
                  <label>Título del Anuncio</label>
                  <input type="text" formControlName="titulo" placeholder="Ej. Horario especial por Feriado" />
                </div>

                <div class="form-group">
                  <label>Contenido del Mensaje</label>
                  <textarea formControlName="contenido" rows="4" placeholder="Escribe los detalles del aviso..."></textarea>
                </div>

                @if (announcementSuccess()) {
                  <div class="success-msg">{{ announcementSuccess() }}</div>
                }

                <button type="submit" class="submit-btn" [disabled]="announcementForm.invalid || publishingAnnouncement()">
                  {{ publishingAnnouncement() ? 'Publicando...' : 'PUBLICAR AVISO' }}
                </button>
              </form>
            </div>

            <div class="section-title">
              <h2>📚 Anuncios Activos en el Muro</h2>
            </div>
            <div class="wods-list">
              @if (announcementsList().length === 0) {
                <p class="loading-text">No hay anuncios publicados actualmente.</p>
              } @else {
                @for (ann of announcementsList(); track ann.id) {
                  <div class="wod-item-card">
                    <div class="wod-item-header">
                      <span class="date-tag">{{ ann.fecha }}</span>
                      <span class="type-badge">Por: {{ ann.coachName }}</span>
                    </div>
                    <h4>{{ ann.titulo }}</h4>
                    <p>{{ ann.contenido }}</p>
                    <button class="delete-btn" (click)="deleteAnnouncement(ann.id!)">Eliminar Anuncio</button>
                  </div>
                }
              }
            </div>
          </section>

        } @else if (activeView() === 'athletes') {
          <section class="athletes-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>👥 Listado de Atletas Inscritos</h2>
            </div>
            <div class="table-container">
              <table class="athletes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Estado Membresía</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of athletesList(); track a.uid) {
                    <tr>
                      <td><strong>{{ a.nombre }}</strong></td>
                      <td>{{ a.email }}</td>
                      <td>
                        <span class="badge" [class.active]="a.estadoMembresia === 'activo'">
                          {{ a.estadoMembresia | uppercase }}
                        </span>
                      </td>
                      <td><span class="role-tag">{{ a.rol | uppercase }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

        } @else if (activeView() === 'social') {
          <section class="social-section" style="margin-top: 20px;">
            <div class="section-title">
              <h2>🌍 Comunidad Social del Box</h2>
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
                  <textarea formControlName="bio" rows="4" placeholder="Ej. Entrenador apasionado por el CrossFit..."></textarea>
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

    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .menu-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 24px; cursor: pointer; transition: all 0.2s ease; text-align: center; }
    .menu-card:hover { border-color: #ff4500; transform: translateY(-4px); background: #222; }
    .menu-icon { font-size: 36px; margin-bottom: 12px; }
    .menu-card h3 { margin: 0 0 8px 0; color: #fff; font-size: 18px; }
    .menu-card p { color: #aaa; font-size: 13px; margin: 0; line-height: 1.4; }
    .back-menu-btn { background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 20px; }
    .back-menu-btn:hover { background: #ff4500; }

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
    .file-input { background: #2a2a2a; color: #aaa; padding: 10px; border-radius: 6px; border: 1px solid #333; cursor: pointer; width: 100%; box-sizing: border-box; }

    .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-top: 16px; }
    .class-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; position: relative; }
    .time-badge { background: #ff4500; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
    .class-card h3 { margin: 0 0 10px 0; font-size: 16px; color: #fff; }
    .spots-info { font-size: 13px; color: #aaa; margin-bottom: 6px; }

    .form-card { background: #1e1e1e; border-radius: 8px; padding: 24px; border: 1px solid #333; }
    .form-row { display: flex; gap: 20px; }
    .form-group { margin-bottom: 16px; flex: 1; }
    label { display: block; margin-bottom: 6px; font-size: 13px; color: #bbb; }
    input, select, textarea { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: white; box-sizing: border-box; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #ff4500; outline: none; }
    textarea { resize: vertical; }
    
    .success-msg { background: rgba(46, 125, 50, 0.2); color: #81c784; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center; }
    .button-group { display: flex; gap: 10px; }
    .submit-btn { background: #ff4500; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; flex: 1; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .cancel-edit-btn { background: #444; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }

    .wods-list { display: flex; flex-direction: column; gap: 12px; }
    .wod-item-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 16px; position: relative; }
    .wod-item-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .date-tag { font-size: 12px; color: #ff4500; font-weight: bold; }
    .type-badge { font-size: 10px; background: #333; padding: 2px 8px; border-radius: 4px; }
    .wod-item-card h4 { margin: 0 0 6px 0; color: #fff; font-size: 16px; }
    .wod-item-card p { color: #aaa; font-size: 13px; margin: 0 0 12px 0; white-space: pre-line; }
    .edit-btn { background: #333; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
    .edit-btn:hover { background: #ff4500; }
    .delete-btn { background: #c62828; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: bold; }
    .delete-btn:hover { background: #b71c1c; }

    .table-container { background: #1e1e1e; border-radius: 8px; border: 1px solid #333; overflow: hidden; }
    .athletes-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    .athletes-table th, .athletes-table td { padding: 14px; border-bottom: 1px solid #2a2a2a; }
    .athletes-table th { background: #252525; color: #ff4500; }
    .badge { font-size: 10px; padding: 3px 6px; border-radius: 4px; font-weight: bold; background: #333; color: #aaa; }
    .badge.active { background: #2e7d32; color: #fff; }
    .role-tag { font-size: 10px; background: #1565c0; color: #fff; padding: 3px 6px; border-radius: 4px; font-weight: bold; }
  `]
})
export class CoachDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private wodService = inject(WodService);
  private bookingService = inject(BookingService);
  private adminService = inject(AdminService);
  private announcementService = inject(AnnouncementService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  userProfile = this.authService.currentUserProfile;
  today = new Date().toISOString().split('T')[0];
  wodTypes: WodType[] = ['AMRAP', 'For Time', 'EMOM', 'Strength', 'Tabata'];
  
  activeView = signal<'menu' | 'wod' | 'classes' | 'announcements' | 'athletes' | 'social' | 'profile'>('menu');
  publishing = signal<boolean>(false);
  savingClass = signal<boolean>(false);
  publishingAnnouncement = signal<boolean>(false);
  savingProfile = signal<boolean>(false);
  loadingCommunity = signal<boolean>(false);
  
  successMessage = signal<string | null>(null);
  classSuccessMessage = signal<string | null>(null);
  announcementSuccess = signal<string | null>(null);
  profileSuccess = signal<string | null>(null);

  wodsList = signal<Wod[]>([]);
  classesList = signal<ClassSlot[]>([]);
  athletesList = signal<UserProfile[]>([]);
  communityMembers = signal<UserProfile[]>([]);
  announcementsList = signal<Announcement[]>([]);
  
  editingWodId = signal<string | null>(null);
  editingClassId = signal<string | null>(null);

  wodForm: FormGroup = this.fb.group({
    fecha: [this.today, Validators.required],
    tipo: ['For Time', Validators.required],
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    notaCoach: ['']
  });

  classForm: FormGroup = this.fb.group({
    fecha: [this.today, Validators.required],
    horario: ['', Validators.required],
    capacidadMaxima: [20, [Validators.required, Validators.min(1)]],
    wodId: ['']
  });

  announcementForm: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    contenido: ['', Validators.required]
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
    try {
      const wods = await this.wodService.getAllWods();
      this.wodsList.set(wods);

      const classes = await this.bookingService.getAllClasses();
      this.classesList.set(classes);

      const users = await this.adminService.getAllUsers();
      this.athletesList.set(users);

      await this.loadAnnouncements();
    } catch (err) {
      console.error('Error cargando datos del coach:', err);
    }
  }

  async loadAnnouncements() {
    const anns = await this.announcementService.getAllAnnouncements();
    this.announcementsList.set(anns);
  }

  selectWodForEdit(wod: Wod) {
    this.editingWodId.set(wod.id || null);
    this.wodForm.patchValue({
      fecha: wod.fecha,
      tipo: wod.tipo,
      titulo: wod.titulo,
      descripcion: wod.descripcion,
      notaCoach: wod.notaCoach || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditWod() {
    this.editingWodId.set(null);
    this.wodForm.reset({ fecha: this.today, tipo: 'For Time' });
  }

  selectClassForEdit(c: ClassSlot) {
    this.editingClassId.set(c.id || null);
    this.classForm.patchValue({
      fecha: c.fecha,
      horario: c.horario,
      capacidadMaxima: c.capacidadMaxima,
      wodId: c.wodId || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditClass() {
    this.editingClassId.set(null);
    this.classForm.reset({ fecha: this.today, capacidadMaxima: 20, wodId: '' });
  }

  saveWod() {
    if (this.wodForm.invalid) return;
    this.publishing.set(true);
    this.successMessage.set(null);
    const formValue = this.wodForm.value;
    const profile = this.userProfile();

    if (this.editingWodId()) {
      this.wodService.updateWod(this.editingWodId()!, formValue).subscribe({
        next: async () => {
          this.publishing.set(false);
          this.successMessage.set('¡WOD actualizado con éxito!');
          this.cancelEditWod();
          await this.loadData();
        },
        error: () => this.publishing.set(false)
      });
    } else {
      const newWod: Wod = { ...formValue, creadoPor: profile?.uid || 'coach-unknown' };
      this.wodService.createWod(newWod).subscribe({
        next: async () => {
          this.publishing.set(false);
          this.successMessage.set('¡WOD publicado con éxito!');
          this.wodForm.reset({ fecha: this.today, tipo: 'For Time' });
          await this.loadData();
        },
        error: () => this.publishing.set(false)
      });
    }
  }

  saveClassSlot() {
    if (this.classForm.invalid) return;
    this.savingClass.set(true);
    this.classSuccessMessage.set(null);

    const formValue = this.classForm.value;
    const profile = this.userProfile();

    if (this.editingClassId()) {
      this.bookingService.updateClassSlot(this.editingClassId()!, formValue).subscribe({
        next: async () => {
          this.savingClass.set(false);
          this.classSuccessMessage.set('¡Clase modificada con éxito!');
          this.cancelEditClass();
          await this.loadData();
        },
        error: () => this.savingClass.set(false)
      });
    } else {
      const newClass: ClassSlot = {
        fecha: formValue.fecha,
        horario: formValue.horario,
        coachName: profile?.nombre || 'Coach',
        capacidadMaxima: formValue.capacidadMaxima,
        atletasInscritos: [],
        wodId: formValue.wodId || ''
      };

      this.bookingService.createClassSlot(newClass).subscribe({
        next: async () => {
          this.savingClass.set(false);
          this.classSuccessMessage.set('¡Horario de clase creado con éxito!');
          this.classForm.reset({ fecha: this.today, capacidadMaxima: 20, wodId: '' });
          await this.loadData();
        },
        error: () => this.savingClass.set(false)
      });
    }
  }

  publishAnnouncement() {
    if (this.announcementForm.invalid) return;
    this.publishingAnnouncement.set(true);
    this.announcementSuccess.set(null);

    const profile = this.userProfile();
    const ann: Announcement = {
      ...this.announcementForm.value,
      fecha: new Date().toISOString().split('T')[0],
      coachName: profile?.nombre || 'Coach',
      createdAt: new Date()
    };

    this.announcementService.createAnnouncement(ann).subscribe({
      next: async () => {
        this.publishingAnnouncement.set(false);
        this.announcementSuccess.set('¡Aviso publicado con éxito!');
        this.announcementForm.reset();
        await this.loadAnnouncements();
      },
      error: () => this.publishingAnnouncement.set(false)
    });
  }

  async deleteAnnouncement(id: string) {
    if (confirm('¿Estás seguro de eliminar este anuncio del muro?')) {
      this.announcementService.deleteAnnouncement(id).subscribe({
        next: async () => {
          await this.loadAnnouncements();
        },
        error: (err) => console.error('Error eliminando anuncio:', err)
      });
    }
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

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/auth']));
  }
}