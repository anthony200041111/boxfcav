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
      <!-- HEADER PRINCIPAL CON IDENTIDAD WOLF -->
      <header class="dashboard-header">
        <div class="brand-box">
          <div class="wolf-logo-badge">🐺</div>
          <div>
            <h1>FC ACTIVE WOLF</h1>
            <span class="subtitle-tag">Zona Exclusiva de Atletas</span>
          </div>
        </div>
        <div class="user-info-card">
          <div class="user-avatar-small">
            @if (userProfile()?.fotoUrl) {
              <img [src]="userProfile()?.fotoUrl" alt="Avatar" />
            } @else {
              <span>🐺</span>
            }
          </div>
          <div class="user-details">
            <span class="user-name">Hola, {{ userProfile()?.nombre || 'Atleta' }}</span>
            <span class="streak-badge">🔥 Racha: {{ trainingStreak() }} días</span>
          </div>
          <button class="logout-btn" (click)="logout()" title="Cerrar Sesión">⏻ Salir</button>
        </div>
      </header>

      <main class="content-grid-layout">
        
        <!-- MENÚ DE NAVEGACIÓN RÁPIDA O VISTAS -->
        @if (activeView() === 'menu') {
          <div class="welcome-banner-hero">
            <div class="hero-text">
              <h2>Entrena, Domina la Pizarra 🐺💪</h2>
              <p>Selecciona una opción abajo para gestionar tus reservas, inscribirte a competencias, registrar tus marcas o conectar con la manada.</p>
            </div>
          </div>

          @if (announcements().length > 0) {
            <div class="announcement-banner">
              <div class="announcement-icon">📢</div>
              <div class="announcement-content">
                <h3>Aviso Oficial del Box: {{ announcements()[0].titulo }}</h3>
                <p>{{ announcements()[0].contenido }}</p>
                <small>Publicado por Coach {{ announcements()[0].coachName }} el {{ announcements()[0].fecha }}</small>
              </div>
            </div>
          }

          <div class="menu-grid-cards">
            <div class="interactive-card" (click)="activeView.set('wod')">
              <div class="card-icon-wrapper">🏋️‍♂️</div>
              <h3>WOD & Clases</h3>
              <p>Consulta el entrenamiento de hoy, anota tu score en el leaderboard y reserva tu horario.</p>
              <span class="card-action-link">Ver Pizarra &rarr;</span>
            </div>

            <!-- ACCESO DIRECTO A COMPETENCIAS -->
            <div class="interactive-card" (click)="goToCompetitions()">
              <div class="card-icon-wrapper">🏆</div>
              <h3>Competencias</h3>
              <p>Inscríbete en los próximos Throwdowns y torneos oficiales del box.</p>
              <span class="card-action-link">Ir a la Arena &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('prs')">
              <div class="card-icon-wrapper">📈</div>
              <h3>Récords & PRs</h3>
              <p>Lleva el control de tus pesos máximos en levantamientos y tiempos en benchmarks.</p>
              <span class="card-action-link">Ver Mis Marcas &rarr;</span>
            </div>

            <div class="interactive-card" (click)="loadCommunityUsers(); activeView.set('social')">
              <div class="card-icon-wrapper">👥</div>
              <h3>Manada Social</h3>
              <p>Explora los perfiles, biografías y motivación de los demás atletas y coaches del box.</p>
              <span class="card-action-link">Ver Manada &rarr;</span>
            </div>

            <div class="interactive-card" (click)="activeView.set('profile')">
              <div class="card-icon-wrapper">⚙️</div>
              <h3>Mi Perfil Wolf</h3>
              <p>Personaliza tu foto de dispositivo, nombre y frase de motivación para que todos te conozcan.</p>
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

        <!-- VISTA: WOD Y CLASES -->
        @if (activeView() === 'wod') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>📅 Clases Disponibles ({{ today }})</h2>
              <p>Asegura tu lugar en el entrenamiento de hoy.</p>
            </div>

            @if (classes().length === 0) {
              <div class="empty-card-state">No hay horarios de clases publicados para hoy todavía.</div>
            } @else {
              <div class="classes-grid-modern">
                @for (c of classes(); track c.id) {
                  <div class="class-card-item" [class.is-full]="c.atletasInscritos.length >= c.capacidadMaxima">
                    <div class="class-card-header">
                      <span class="time-pill">{{ c.horario }}</span>
                      <span class="spots-pill" [class.full-text]="c.atletasInscritos.length >= c.capacidadMaxima">
                        {{ c.atletasInscritos.length }} / {{ c.capacidadMaxima }} cupos
                      </span>
                    </div>
                    <div class="class-card-body">
                      <h4>Coach: {{ c.coachName }}</h4>
                    </div>
                    <div class="class-card-footer">
                      @if (isEnrolled(c)) {
                        <button class="btn-action-cancel" (click)="cancelBooking(c.id!)">Cancelar Reserva</button>
                      } @else if (c.atletasInscritos.length >= c.capacidadMaxima) {
                        <button class="btn-action-disabled" disabled>Clase Llena 🚫</button>
                      } @else {
                        <button class="btn-action-book" (click)="bookClass(c.id!)">Reservar Cupo 🐺</button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <div class="section-heading" style="margin-top: 50px;">
              <h2>🔥 WOD del Día & Leaderboard</h2>
              <p>Mide tu rendimiento frente a la manada.</p>
            </div>

            @if (loadingWod()) {
              <div class="empty-card-state">Cargando pizarra de entrenamiento...</div>
            } @else if (wod()) {
              <div class="wod-display-card">
                <div class="wod-top-meta">
                  <span class="wod-type-badge">{{ wod()?.tipo }}</span>
                  <span class="wod-date-tag">Fecha: {{ today }}</span>
                </div>
                <h3>{{ wod()?.titulo }}</h3>
                <div class="wod-description-box">{{ wod()?.descripcion }}</div>
                @if (wod()?.notaCoach) {
                  <div class="coach-note-box">
                    <strong>💡 Nota Estratégica del Coach:</strong> {{ wod()?.notaCoach }}
                  </div>
                }
              </div>

              <!-- FORMULARIO DE SCORE -->
              <div class="form-card-modern">
                <h4>📝 Registrar mi Score en la Pizarra</h4>
                <form [formGroup]="scoreForm" (ngSubmit)="submitScore()">
                  <div class="form-grid-row">
                    <div class="input-field-group">
                      <label>Resultado (Ej. 4:25 min, 12 Rondas, 225 lbs)</label>
                      <input type="text" formControlName="resultado" placeholder="Tu marca aquí..." />
                    </div>
                    <div class="input-field-group checkbox-align">
                      <label class="checkbox-container">
                        <input type="checkbox" formControlName="esRx" />
                        <span class="checkmark-text">¿Trabajo realizado en RX? 🔥</span>
                      </label>
                    </div>
                  </div>
                  <div class="input-field-group">
                    <label>Comentarios o sensaciones (Opcional)</label>
                    <input type="text" formControlName="comentarios" placeholder="Ej. Duro en las dominadas, pero salió..." />
                  </div>
                  <button type="submit" class="btn-submit-primary" [disabled]="scoreForm.invalid || submitting()">
                    {{ submitting() ? 'Guardando en la pizarra...' : 'PUBLICAR MI SCORE 🐺' }}
                  </button>
                </form>
              </div>

              <!-- LEADERBOARD -->
              <div class="leaderboard-card-container">
                <h4>🏆 Leaderboard de la Manada (Hoy)</h4>
                @if (scores().length === 0) {
                  <p class="empty-card-state" style="margin: 10px 0;">Sé el primer lobo en registrar su score hoy.</p>
                } @else {
                  <ul class="score-ranking-list">
                    @for (s of scores(); track s.id; let idx = $index) {
                      <li class="score-row-item">
                        <div class="rank-number">#{{ idx + 1 }}</div>
                        <div class="athlete-info-col">
                          <strong>{{ s.athleteName }}</strong>
                          <span class="badge-rx-scaled" [class.rx-badge]="s.esRx" [class.scaled-badge]="!s.esRx">
                            {{ s.esRx ? 'RX' : 'SCALED' }}
                          </span>
                        </div>
                        <div class="score-result-col">
                          <span class="score-val">{{ s.resultado }}</span>
                          @if (s.comentarios) {
                            <small class="score-comment">"{{ s.comentarios }}"</small>
                          }
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>

            } @else {
              <div class="empty-card-state">
                <span style="font-size: 32px;">🐺💤</span>
                <p>El Coach aún no ha publicado el WOD para el día de hoy.</p>
              </div>
            }
          </div>
        }

        <!-- VISTA: PRs Y PROGRESO -->
        @if (activeView() === 'prs') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>🏆 Mis Récords Personales (PRs)</h2>
              <p>Tu evolución de fuerza y velocidad registrada.</p>
            </div>

            @if (myPrs().length > 0) {
              <div class="progress-chart-card">
                <h4>📊 Resumen de Evolución</h4>
                <div class="bar-chart-container">
                  @for (pr of myPrs(); track pr.id) {
                    <div class="bar-row-item">
                      <div class="bar-movement-label">{{ pr.movimiento }}</div>
                      <div class="bar-line-track">
                        <div class="bar-line-fill" style="width: 85%;"></div>
                      </div>
                      <div class="bar-score-label">{{ pr.marca }}</div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="form-card-modern">
              <h4>➕ Registrar Nuevo PR o Marca</h4>
              <form [formGroup]="prForm" (ngSubmit)="submitPr()">
                <div class="form-grid-row">
                  <div class="input-field-group">
                    <label>Movimiento / Ejercicio</label>
                    <input type="text" formControlName="movimiento" placeholder="Ej. Clean & Jerk, Back Squat, Fran..." />
                  </div>
                  <div class="input-field-group">
                    <label>Marca Récord (Peso o Tiempo)</label>
                    <input type="text" formControlName="marca" placeholder="Ej. 245 lbs o 2:30 min..." />
                  </div>
                </div>
                <button type="submit" class="btn-submit-primary" [disabled]="prForm.invalid || addingPr()">
                  {{ addingPr() ? 'Guardando récord...' : 'GUARDAR NUEVO PR 📈' }}
                </button>
              </form>
            </div>

            <div class="table-card-wrapper">
              @if (myPrs().length === 0) {
                <div class="empty-card-state">Aún no tienes marcas personales registradas. ¡Empieza a registrar tus PRs!</div>
              } @else {
                <table class="modern-data-table">
                  <thead>
                    <tr>
                      <th>Movimiento</th>
                      <th>Marca Registrada</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (pr of myPrs(); track pr.id) {
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
          </div>
        }

        <!-- VISTA: COMUNIDAD SOCIAL -->
        @if (activeView() === 'social') {
          <div class="view-section-fade">
            <div class="section-heading">
              <h2>🐺 La Manada FC Active Wolf</h2>
              <p>Atletas y coaches unidos por la misma pasión. Haz clic en cualquiera para ver su perfil y PRs.</p>
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
                    <p class="member-bio-text">"{{ member.bio || 'Entrenando duro para superar mis límites en el box.' }}"</p>
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
              <h2>⚙️ Configuración de Mi Perfil</h2>
              <p>Personaliza tu identidad dentro de la comunidad.</p>
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
                  <label>Biografía / Frase Motivacional</label>
                  <textarea formControlName="bio" rows="4" placeholder="Ej. El dolor es temporal, la gloria es para siempre..."></textarea>
                </div>

                @if (profileSuccess()) {
                  <div class="success-alert-box">{{ profileSuccess() }}</div>
                }

                <button type="submit" class="btn-submit-primary" [disabled]="profileForm.invalid || savingProfile()">
                  {{ savingProfile() ? 'Actualizando...' : 'GUARDAR CAMBIOS DE PERFIL 🐺' }}
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

    .announcement-banner { display: flex; gap: 16px; background: rgba(255, 69, 0, 0.08); border: 1px solid rgba(255, 69, 0, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px; align-items: flex-start; }
    .announcement-icon { font-size: 24px; }
    .announcement-content h3 { margin: 0 0 6px 0; color: #ff4500; font-size: 15px; }
    .announcement-content p { color: #ddd; margin: 0 0 8px 0; font-size: 13px; line-height: 1.4; }
    .announcement-content small { color: #777; font-style: italic; font-size: 11px; }

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

    .classes-grid-modern { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .class-card-item { background: #181818; border: 1px solid #282828; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
    .class-card-item.is-full { border-color: #552222; background: #161212; }
    .class-card-header { display: flex; justify-content: space-between; align-items: center; }
    .time-pill { background: #ff4500; color: #fff; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 6px; }
    .spots-pill { font-size: 11px; color: #aaa; background: #252525; padding: 3px 8px; border-radius: 6px; }
    .spots-pill.full-text { color: #ff6b6b; background: rgba(255, 0, 0, 0.1); }
    .class-card-body h4 { margin: 0; color: #fff; font-size: 15px; }
    .btn-action-book { background: #2e7d32; color: #fff; border: none; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s; }
    .btn-action-book:hover { background: #388e3c; }
    .btn-action-cancel { background: #c62828; color: #fff; border: none; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
    .btn-action-disabled { background: #2a2a2a; color: #666; border: none; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; cursor: not-allowed; font-size: 13px; }

    .wod-display-card { background: #181818; border-radius: 14px; padding: 26px; border: 1px solid #313131; position: relative; margin-bottom: 24px; box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
    .wod-top-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .wod-type-badge { background: #ff4500; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .wod-date-tag { font-size: 12px; color: #777; }
    .wod-display-card h3 { margin: 0 0 14px 0; font-size: 20px; color: #fff; }
    .wod-description-box { white-space: pre-line; color: #d0d0d0; line-height: 1.6; font-family: monospace; font-size: 13px; background: #111; padding: 18px; border-radius: 10px; border: 1px solid #222; }
    .coach-note-box { margin-top: 16px; background: rgba(255, 69, 0, 0.1); border-left: 3px solid #ff4500; padding: 12px 16px; font-size: 13px; color: #ffab91; border-radius: 0 8px 8px 0; }

    .form-card-modern, .leaderboard-card-container, .progress-chart-card, .table-card-wrapper { background: #181818; border-radius: 14px; padding: 24px; border: 1px solid #2c2c2c; margin-bottom: 24px; }
    .form-card-modern h4, .leaderboard-card-container h4, .progress-chart-card h4 { margin-top: 0; margin-bottom: 18px; color: #ff4500; font-size: 16px; }
    .form-grid-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .input-field-group { margin-bottom: 16px; flex: 1; min-width: 220px; }
    .checkbox-align { display: flex; align-items: center; }
    .checkbox-container { display: flex; align-items: center; gap: 10px; cursor: pointer; color: #ccc; font-size: 13px; margin-top: 8px; }
    .checkbox-container input { width: 18px; height: 18px; accent-color: #ff4500; cursor: pointer; }
    label { display: block; margin-bottom: 6px; font-size: 12px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    input[type="text"], textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; box-sizing: border-box; font-family: inherit; font-size: 13px; outline: none; transition: border-color 0.2s; }
    input[type="text"]:focus, textarea:focus { border-color: #ff4500; }
    textarea { resize: vertical; }

    .btn-submit-primary { background: #ff4500; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 13px; letter-spacing: 0.5px; transition: background 0.2s; }
    .btn-submit-primary:hover:not(:disabled) { background: #e03d00; }
    .btn-submit-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .success-alert-box { background: rgba(46, 125, 50, 0.2); color: #81c784; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; text-align: center; border: 1px solid rgba(46, 125, 50, 0.4); }
    .empty-card-state { background: #161616; padding: 40px; border-radius: 12px; text-align: center; color: #777; border: 1px dashed #333; font-style: italic; }

    .score-ranking-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .score-row-item { display: flex; justify-content: space-between; align-items: center; background: #202020; padding: 12px 18px; border-radius: 10px; border: 1px solid #2a2a2a; }
    .rank-number { font-weight: 800; color: #ff4500; font-size: 15px; width: 35px; }
    .athlete-info-col { flex: 1; display: flex; align-items: center; gap: 12px; }
    .badge-rx-scaled { font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .rx-badge { background: #2e7d32; color: #fff; }
    .scaled-badge { background: #ef6c00; color: #fff; }
    .score-result-col { text-align: right; }
    .score-val { font-weight: bold; font-size: 15px; display: block; color: #ff4500; }
    .score-comment { color: #888; font-style: italic; font-size: 11px; }

    .modern-data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    .modern-data-table th, .modern-data-table td { padding: 14px 16px; border-bottom: 1px solid #252525; }
    .modern-data-table th { background: #141414; color: #ff4500; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .pr-pill { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 5px 12px; border-radius: 6px; font-weight: bold; border: 1px solid rgba(255, 69, 0, 0.3); }
    .date-text { color: #888; }

    .bar-chart-container { display: flex; flex-direction: column; gap: 14px; }
    .bar-row-item { display: flex; align-items: center; gap: 15px; }
    .bar-movement-label { width: 130px; font-size: 12px; font-weight: bold; color: #ccc; }
    .bar-line-track { flex: 1; background: #222; height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid #333; }
    .bar-line-fill { background: linear-gradient(90deg, #ff4500, #ff7b00); height: 100%; border-radius: 5px; }
    .bar-score-label { width: 90px; text-align: right; font-size: 13px; font-weight: bold; color: #ffab91; }

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

  goToProfile(uid: string) {
    this.router.navigate(['/community/profile', uid]);
  }

  goToCompetitions() {
    this.router.navigate(['/competitions']);
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
        this.profileSuccess.set('¡Perfil actualizado con éxito en la manada!');
      },
      error: () => this.savingProfile.set(false)
    });
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/auth']));
  }
}