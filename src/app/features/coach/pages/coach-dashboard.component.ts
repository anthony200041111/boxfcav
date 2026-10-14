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
      <!-- HEADER PRINCIPAL CON IDENTIDAD WOLF -->
      <header class="dashboard-header">
        <div class="brand-box">
          <div class="wolf-logo-badge">🐺</div>
          <div>
            <h1>FC ACTIVE WOLF</h1>
            <span class="subtitle-tag">Panel de Control Staff / Coach</span>
          </div>
        </div>
        <div class="user-info-card">
          <div class="user-avatar-small">
            @if (userProfile()?.fotoUrl) {
              <img [src]="userProfile()?.fotoUrl" alt="Avatar" />
            } @else {
              <span>🔥</span>
            }
          </div>
          <div class="user-details">
            <span class="user-name">Coach: {{ userProfile()?.nombre || 'Entrenador' }}</span>
            <span class="streak-badge">Staff Autorizado</span>
          </div>
          <button class="logout-btn" (click)="logout()" title="Cerrar Sesión">⏻ Salir</button>
        </div>
      </header>

      <main class="content-grid-layout">
        
        <!-- MENÚ DE NAVEGACIÓN RÁPIDA O VISTAS -->
        @if (activeView() === 'menu') {
          <div class="welcome-banner-hero">
            <div class="hero-text">
              <h2>Panel de Control y Gestión del Box 🐺🔥</h2>
              <p>Selecciona una opción abajo para programar entrenamientos, gestionar torneos, cupos de clases, anuncios o supervisar a la manada.</p>
            </div>
          </div>

          <div class="menu-grid-cards">
            <div class="interactive-card" (click)="activeView.set('wod')">
              <div class="card-icon-wrapper">📝</div>
              <h3>Gestión de WODs</h3>
              <p>Publica los entrenamientos diarios del box y edita el historial de la pizarra.</p>
              <span class="card-action-link">Administrar WODs &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('classes')">
              <div class="card-icon-wrapper">📅</div>
              <h3>Clases & Horarios</h3>
              <p>Crea turnos de clases, configura cupos máximos y vincula WODs específicos.</p>
              <span class="card-action-link">Gestionar Clases &rarr;</span>
            </div>

            <!-- ACCESO DIRECTO A COMPETENCIAS DESDE EL PANEL DE COACH -->
            <div class="interactive-card" (click)="goToCompetitions()">
              <div class="card-icon-wrapper">🏆</div>
              <h3>Arena de Competencias</h3>
              <p>Supervisa los torneos, throws y eventos activos de la comunidad.</p>
              <span class="card-action-link">Ir a Torneos &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('announcements')">
              <div class="card-icon-wrapper">📢</div>
              <h3>Muro de Anuncios</h3>
              <p>Publica avisos importantes y mantén informada a toda la comunidad de atletas.</p>
              <span class="card-action-link">Ver Muro &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('athletes')">
              <div class="card-icon-wrapper">👥</div>
              <h3>Atletas del Box</h3>
              <p>Supervisa los miembros inscritos y monitorea el estado actual de sus membresías.</p>
              <span class="card-action-link">Ver Atletas &rarr;</span>
            </div>

            <div class="interactive-card" (click)="loadCommunityUsers(); activeView.set('social')">
              <div class="card-icon-wrapper">🌍</div>
              <h3>Comunidad Social</h3>
              <p>Visualiza los perfiles, avatares y biografías de la comunidad del box.</p>
              <span class="card-action-link">Explorar Comunidad &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('profile')">
              <div class="card-icon-wrapper">⚙️</div>
              <h3>Mi Perfil Coach</h3>
              <p>Personaliza tu foto de dispositivo, nombre y biografía profesional como entrenador.</p>
              <span class="card-action-link">Editar Perfil &rarr;</span>
            </div>
          </div>

        } @else {
          <!-- BOTÓN DE RETORNO FLUIDO -->
          <div class="navigation-top-bar">
            <button class="back-menu-btn" (click)="activeView.set('menu')">
              ⬅️ Volver al Menú Principal
            </button>
          </div>
        }

        <!-- VISTA: GESTIÓN DE WODS -->
        @if (activeView() === 'wod') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>{{ editingWodId() ? '✏️ Editar WOD Existente' : '📝 Publicar WOD del Día' }}</h2>
              <p>Crea o modifica el entrenamiento oficial para los atletas.</p>
            </div>

            <div class="form-card-modern">
              <form [formGroup]="wodForm" (ngSubmit)="saveWod()">
                <div class="form-grid-row">
                  <div class="input-field-group">
                    <label>Fecha del WOD</label>
                    <input type="date" formControlName="fecha" />
                  </div>
                  <div class="input-field-group">
                    <label>Tipo de Entrenamiento</label>
                    <select formControlName="tipo">
                      @for (type of wodTypes; track type) {
                        <option [value]="type">{{ type }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="input-field-group">
                  <label>Título del WOD</label>
                  <input type="text" formControlName="titulo" placeholder="Ej. WOD - Fran o Heavy Squat Clean" />
                </div>

                <div class="input-field-group">
                  <label>Descripción / Movimientos</label>
                  <textarea formControlName="descripcion" rows="5" placeholder="21-15-9 Thrusters..."></textarea>
                </div>

                <div class="input-field-group">
                  <label>Nota del Coach (Opcional)</label>
                  <input type="text" formControlName="notaCoach" placeholder="Consejo estratégico o estímulo..." />
                </div>

                @if (successMessage()) {
                  <div class="success-alert-box">{{ successMessage() }}</div>
                }

                <div class="form-button-row">
                  <button type="submit" class="btn-submit-primary" [disabled]="wodForm.invalid || publishing()">
                    {{ publishing() ? 'Guardando WOD...' : (editingWodId() ? 'ACTUALIZAR WOD' : 'PUBLICAR WOD 🐺') }}
                  </button>
                  @if (editingWodId()) {
                    <button type="button" class="btn-action-cancel" (click)="cancelEditWod()">Cancelar</button>
                  }
                </div>
              </form>
            </div>

            <div class="section-heading" style="margin-top: 40px;">
              <h2>📚 Historial de Wods Creados</h2>
              <p>Registro completo de entrenamientos anteriores.</p>
            </div>

            <div class="wods-modern-grid">
              @for (w of wodsList(); track w.id) {
                <div class="wod-item-card-box">
                  <div class="wod-item-meta">
                    <span class="time-pill">{{ w.fecha }}</span>
                    <span class="spots-pill">{{ w.tipo }}</span>
                  </div>
                  <h4>{{ w.titulo }}</h4>
                  <p class="wod-desc-text">{{ w.descripcion }}</p>
                  <button class="btn-edit-small" (click)="selectWodForEdit(w)">Modificar WOD</button>
                </div>
              }
            </div>
          </div>
        }

        <!-- VISTA: CLASES Y HORARIOS -->
        @if (activeView() === 'classes') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>{{ editingClassId() ? '✏️ Modificar Horario de Clase' : '📅 Programar Horario de Clase & WOD' }}</h2>
              <p>Define los turnos disponibles y asigna el entrenamiento correspondiente.</p>
            </div>

            <div class="form-card-modern">
              <form [formGroup]="classForm" (ngSubmit)="saveClassSlot()">
                <div class="form-grid-row">
                  <div class="input-field-group">
                    <label>Fecha de la Clase</label>
                    <input type="date" formControlName="fecha" />
                  </div>
                  <div class="input-field-group">
                    <label>Horario (Ej. 07:00 AM)</label>
                    <input type="text" formControlName="horario" placeholder="07:00 AM" />
                  </div>
                </div>

                <div class="form-grid-row">
                  <div class="input-field-group">
                    <label>Capacidad Máxima de Atletas</label>
                    <input type="number" formControlName="capacidadMaxima" />
                  </div>
                  <div class="input-field-group">
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
                  <div class="success-alert-box">{{ classSuccessMessage() }}</div>
                }

                <div class="form-button-row">
                  <button type="submit" class="btn-submit-primary" [disabled]="classForm.invalid || savingClass()">
                    {{ savingClass() ? 'Guardando...' : (editingClassId() ? 'ACTUALIZAR CLASE' : 'CREAR HORARIO DE CLASE 🐺') }}
                  </button>
                  @if (editingClassId()) {
                    <button type="button" class="btn-action-cancel" (click)="cancelEditClass()">Cancelar</button>
                  }
                </div>
              </form>
            </div>

            <div class="section-heading" style="margin-top: 40px;">
              <h2>📋 Listado de Clases Programadas</h2>
              <p>Control de cupos y ocupación en tiempo real.</p>
            </div>

            <div class="classes-grid-modern">
              @for (c of classesList(); track c.id) {
                <div class="class-card-item">
                  <div class="class-card-header">
                    <span class="time-pill">{{ c.fecha }} - {{ c.horario }}</span>
                    <span class="spots-pill">{{ c.atletasInscritos.length }} / {{ c.capacidadMaxima }} inscritos</span>
                  </div>
                  <div class="class-card-body">
                    <h4>Coach: {{ c.coachName || 'Staff' }}</h4>
                  </div>
                  <div class="class-card-footer">
                    <button class="btn-edit-small" style="width: 100%;" (click)="selectClassForEdit(c)">Modificar Clase</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- VISTA: ANUNCIOS -->
        @if (activeView() === 'announcements') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>📢 Muro de Anuncios Oficiales</h2>
              <p>Comunícate directamente con toda la comunidad del box.</p>
            </div>

            <div class="form-card-modern">
              <form [formGroup]="announcementForm" (ngSubmit)="publishAnnouncement()">
                <div class="input-field-group">
                  <label>Título del Anuncio</label>
                  <input type="text" formControlName="titulo" placeholder="Ej. Horario especial por Feriado" />
                </div>

                <div class="input-field-group">
                  <label>Contenido del Mensaje</label>
                  <textarea formControlName="contenido" rows="4" placeholder="Escribe los detalles del aviso..."></textarea>
                </div>

                @if (announcementSuccess()) {
                  <div class="success-alert-box">{{ announcementSuccess() }}</div>
                }

                <button type="submit" class="btn-submit-primary" [disabled]="announcementForm.invalid || publishingAnnouncement()">
                  {{ publishingAnnouncement() ? 'Publicando...' : 'PUBLICAR AVISO EN EL MURO 🐺' }}
                </button>
              </form>
            </div>

            <div class="section-heading" style="margin-top: 40px;">
              <h2>📚 Anuncios Activos</h2>
            </div>

            <div class="wods-modern-grid">
              @if (announcementsList().length === 0) {
                <div class="empty-card-state">No hay anuncios publicados actualmente.</div>
              } @else {
                @for (ann of announcementsList(); track ann.id) {
                  <div class="wod-item-card-box">
                    <div class="wod-item-meta">
                      <span class="time-pill">{{ ann.fecha }}</span>
                      <span class="spots-pill">Por: {{ ann.coachName }}</span>
                    </div>
                    <h4>{{ ann.titulo }}</h4>
                    <p class="wod-desc-text">{{ ann.contenido }}</p>
                    <button class="btn-action-cancel" style="padding: 6px 12px; font-size: 12px; width: auto;" (click)="deleteAnnouncement(ann.id!)">Eliminar Anuncio</button>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- VISTA: ATLETAS -->
        @if (activeView() === 'athletes') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>👥 Listado de Atletas del Box</h2>
              <p>Supervisión de miembros y estados de suscripción.</p>
            </div>

            <div class="table-card-wrapper">
              <table class="modern-data-table">
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
                      <td><span class="date-text">{{ a.email }}</span></td>
                      <td>
                        <span class="badge-rx-scaled" [class.rx-badge]="a.estadoMembresia === 'activo'" [class.scaled-badge]="a.estadoMembresia !== 'activo'">
                          {{ (a.estadoMembresia || 'activo') | uppercase }}
                        </span>
                      </td>
                      <td><span class="role-pill-badge badge-athlete">{{ a.rol | uppercase }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- VISTA: COMUNIDAD SOCIAL -->
        @if (activeView() === 'social') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>🌍 Comunidad Social del Box</h2>
              <p>Perfiles y biografías de atletas y entrenadores. Haz clic en cualquiera para ver su detalle y PRs.</p>
            </div>

            @if (loadingCommunity()) {
              <div class="empty-card-state">Cargando miembros de la comunidad...</div>
            } @else {
              <div class="community-grid-cards">
                @for (member of communityMembers(); track member.uid) {
                  <div class="member-profile-card clickable-card" (click)="goToProfile(member.uid)" title="Ver perfil y PRs">
                    <div class="member-avatar-box">
                      @if (member.fotoUrl) {
                        <img [src]="member.fotoUrl" alt="Avatar" class="avatar-real-img" />
                      } @else {
                        <span class="wolf-emoji-icon">🐺</span>
                      }
                    </div>
                    <h3>{{ member.nombre }}</h3>
                    <span class="role-pill-badge" [class.badge-athlete]="member.rol === 'athlete'" [class.badge-coach]="member.rol === 'coach'">
                      {{ member.rol === 'coach' ? '🔥 COACH' : '💪 ATLETA' }}
                    </span>
                    <p class="member-bio-text">"{{ member.bio || 'Sin biografía aún.' }}"</p>
                    <span class="view-profile-link">Ver PRs & Perfil &rarr;</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- VISTA: MI PERFIL -->
        @if (activeView() === 'profile') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>⚙️ Configuración de Mi Perfil Coach</h2>
              <p>Personaliza tu identidad profesional dentro de la plataforma.</p>
            </div>

            <div class="form-card-modern profile-edit-box">
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="input-field-group">
                  <label>Nombre Completo</label>
                  <input type="text" formControlName="nombre" placeholder="Tu nombre..." />
                </div>

                <div class="input-field-group">
                  <label>Foto de Perfil (Dispositivo / Cámara)</label>
                  <div class="file-upload-wrapper">
                    <input type="file" accept="image/*" (change)="onFileSelected($event)" class="custom-file-input" />
                  </div>
                  @if (profileForm.get('fotoUrl')?.value) {
                    <div class="preview-badge-container">
                      <img [src]="profileForm.get('fotoUrl')?.value" alt="Vista previa" class="img-preview-circle" />
                      <span class="success-preview-text">✔ Imagen lista para guardar</span>
                    </div>
                  }
                </div>

                <div class="input-field-group">
                  <label>Biografía o Frase de Motivación</label>
                  <textarea formControlName="bio" rows="4" placeholder="Ej. Entrenador apasionado por el CrossFit..."></textarea>
                </div>

                @if (profileSuccess()) {
                  <div class="success-alert-box">{{ profileSuccess() }}</div>
                }

                <button type="submit" class="btn-submit-primary" [disabled]="profileForm.invalid || savingProfile()">
                  {{ savingProfile() ? 'Guardando...' : 'ACTUALIZAR PERFIL COACH 🐺' }}
                </button>
              </form>
            </div>
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background: #0d0d0d; color: #f1f1f1; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding-bottom: 60px; }
    
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: #161616; border-bottom: 3px solid #ff4500; box-shadow: 0 4px 20px rgba(0,0,0,0.5); flex-wrap: wrap; gap: 16px; }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .wolf-logo-badge { font-size: 32px; background: rgba(255, 69, 0, 0.15); width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid rgba(255, 69, 0, 0.4); }
    .dashboard-header h1 { font-size: 22px; margin: 0; color: #ff4500; font-weight: 800; letter-spacing: 0.5px; }
    .subtitle-tag { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }

    .user-info-card { display: flex; align-items: center; gap: 14px; background: #202020; padding: 8px 16px; border-radius: 30px; border: 1px solid #333; }
    .user-avatar-small { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; background: #2a2a2a; display: flex; align-items: center; justify-content: center; border: 2px solid #ff4500; font-size: 18px; }
    .user-avatar-small img { width: 100%; height: 100%; object-fit: cover; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 13px; font-weight: bold; color: #fff; }
    .streak-badge { font-size: 11px; color: #ffab91; }
    .logout-btn { background: #2a2a2a; color: #ccc; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .logout-btn:hover { background: #ff4500; color: #fff; }

    .content-grid-layout { padding: 32px 24px; max-width: 1000px; margin: 0 auto; }
    .section-heading { margin-bottom: 24px; }
    .section-heading h2 { color: #fff; border-left: 5px solid #ff4500; padding-left: 14px; margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .section-heading p { color: #888; margin: 0; font-size: 13px; }

    .welcome-banner-hero { background: linear-gradient(135deg, #1e1e1e 0%, #141414 100%); border: 1px solid #333; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .hero-text h2 { margin: 0 0 8px 0; color: #ff4500; font-size: 22px; }
    .hero-text p { margin: 0; color: #aaa; font-size: 14px; }

    .menu-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .interactive-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 14px; padding: 24px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .interactive-card:hover { border-color: #ff4500; transform: translateY(-5px); background: #222; box-shadow: 0 10px 25px rgba(255, 69, 0, 0.15); }
    .card-icon-wrapper { font-size: 38px; margin-bottom: 14px; background: #242424; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .interactive-card h3 { margin: 0 0 8px 0; color: #fff; font-size: 17px; }
    .interactive-card p { color: #999; font-size: 12px; margin: 0 0 16px 0; line-height: 1.4; flex: 1; }
    .card-action-link { font-size: 12px; font-weight: bold; color: #ff4500; }

    .navigation-top-bar { margin-bottom: 24px; }
    .back-menu-btn { background: #222; color: #fff; border: 1px solid #444; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s; }
    .back-menu-btn:hover { background: #ff4500; border-color: #ff4500; }

    .classes-grid-modern, .wods-modern-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .class-card-item, .wod-item-card-box { background: #181818; border: 1px solid #282828; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .class-card-header, .wod-item-meta { display: flex; justify-content: space-between; align-items: center; }
    .time-pill { background: #ff4500; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 6px; }
    .spots-pill { font-size: 11px; color: #aaa; background: #252525; padding: 3px 8px; border-radius: 6px; }
    .class-card-body h4, .wod-item-card-box h4 { margin: 0; color: #fff; font-size: 16px; }
    .wod-desc-text { color: #aaa; font-size: 13px; margin: 0; white-space: pre-line; line-height: 1.4; }
    
    .btn-edit-small { background: #222; color: #fff; border: 1px solid #444; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .btn-edit-small:hover { background: #ff4500; border-color: #ff4500; }

    .form-card-modern, .table-card-wrapper { background: #181818; border-radius: 14px; padding: 24px; border: 1px solid #2c2c2c; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .form-grid-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .input-field-group { margin-bottom: 16px; flex: 1; min-width: 220px; }
    label { display: block; margin-bottom: 6px; font-size: 12px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    input[type="text"], input[type="date"], input[type="number"], select, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; box-sizing: border-box; font-family: inherit; font-size: 13px; outline: none; transition: border-color 0.2s; }
    input:focus, select:focus, textarea:focus { border-color: #ff4500; }
    textarea { resize: vertical; }

    .form-button-row { display: flex; gap: 12px; align-items: center; }
    .btn-submit-primary { background: #ff4500; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; font-size: 13px; letter-spacing: 0.5px; transition: background 0.2s; }
    .btn-submit-primary:hover:not(:disabled) { background: #e03d00; }
    .btn-submit-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    
    .btn-action-cancel { background: #444; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s; }
    .btn-action-cancel:hover { background: #c62828; }

    .success-alert-box { background: rgba(46, 125, 50, 0.2); color: #81c784; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(46, 125, 50, 0.4); }
    .empty-card-state { background: #161616; padding: 40px; border-radius: 12px; text-align: center; color: #777; border: 1px dashed #333; font-style: italic; }

    .modern-data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    .modern-data-table th, .modern-data-table td { padding: 14px 16px; border-bottom: 1px solid #252525; }
    .modern-data-table th { background: #141414; color: #ff4500; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .date-text { color: #888; }
    .badge-rx-scaled { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .rx-badge { background: #2e7d32; color: #fff; }
    .scaled-badge { background: #ef6c00; color: #fff; }

    .community-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
    .member-profile-card { background: #181818; border: 1px solid #2c2c2c; border-radius: 14px; padding: 22px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: transform 0.2s, border-color 0.2s; }
    .member-profile-card.clickable-card { cursor: pointer; }
    .member-profile-card.clickable-card:hover { border-color: #ff4500; transform: translateY(-4px); }
    .member-avatar-box { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; margin: 0 auto 14px auto; border: 2px solid #ff4500; display: flex; align-items: center; justify-content: center; background: #222; font-size: 30px; box-shadow: 0 0 15px rgba(255,69,0,0.3); }
    .avatar-real-img { width: 100%; height: 100%; object-fit: cover; }
    .member-profile-card h3 { margin: 0 0 8px 0; color: #fff; font-size: 16px; }
    .role-pill-badge { font-size: 10px; padding: 4px 10px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 12px; letter-spacing: 0.5px; }
    .badge-athlete { background: rgba(21, 101, 192, 0.2); color: #64b5f6; border: 1px solid rgba(21, 101, 192, 0.4); }
    .badge-coach { background: rgba(239, 108, 0, 0.2); color: #ffb74d; border: 1px solid rgba(239, 108, 0, 0.4); }
    .member-bio-text { color: #999; font-style: italic; font-size: 12px; margin: 0 0 12px 0; line-height: 1.4; }
    .view-profile-link { font-size: 11px; font-weight: bold; color: #ff4500; text-transform: uppercase; }

    .profile-edit-box { max-width: 600px; margin: 0 auto; }
    .file-upload-wrapper { margin-bottom: 8px; }
    .custom-file-input { background: #222; color: #aaa; padding: 10px; border-radius: 8px; border: 1px solid #333; cursor: pointer; width: 100%; box-sizing: border-box; font-size: 12px; }
    .preview-badge-container { display: flex; align-items: center; gap: 14px; background: #202020; padding: 10px 14px; border-radius: 8px; margin-top: 8px; border: 1px solid #333; }
    .img-preview-circle { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #ff4500; }
    .success-preview-text { color: #81c784; font-size: 12px; font-weight: 600; }
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
    bio: ['', Validators.required]
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

  goToProfile(uid: string) {
    this.router.navigate(['/community/profile', uid]);
  }

  goToCompetitions() {
    this.router.navigate(['/competitions']);
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

  deleteAnnouncement(id: string) {
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
        this.profileSuccess.set('¡Perfil actualizado con éxito en la manada!');
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