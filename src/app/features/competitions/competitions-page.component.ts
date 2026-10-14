import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompetitionService } from '@core/services/competition.service';
import { AuthService } from '@core/services/auth.service';
import { AdminService } from '@core/services/admin.service';
import { Competition, CompetitionTeam, CompetitionWod, CompetitionScore } from '@core/models/competition.model';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-competitions-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="brand-box">
          <div class="wolf-logo-badge">🐺</div>
          <div>
            <h1>FC ACTIVE WOLF</h1>
            <span class="subtitle-tag">Arena de Competencias & Throwdowns</span>
          </div>
        </div>
        <button class="logout-btn" (click)="goBack()">⬅️ Volver al Menú</button>
      </header>

      <main class="content-grid-layout">
        <div class="section-heading">
          <h2>🏆 Arena de Torneos y Eventos</h2>
          <p>Supervisa competencias, gestiona equipos y registra puntuaciones oficiales.</p>
        </div>

        @if (isCoachOrAdmin()) {
          <div class="coach-actions-bar">
            <button class="btn-submit-primary" (click)="toggleCreateModal()">
              {{ showCreateForm() ? '❌ Cerrar Formulario' : '➕ Crear Nueva Competencia' }}
            </button>
          </div>

          @if (showCreateForm()) {
            <div class="form-card-modern">
              <h4>Crear Torneo / Throwdown</h4>
              <form [formGroup]="compForm" (ngSubmit)="saveCompetition()">
                <div class="input-field-group">
                  <label>Título del Evento</label>
                  <input type="text" formControlName="titulo" placeholder="Ej. WOLF WINTER THROWDOWN 2026" />
                </div>
                <div class="input-field-group">
                  <label>Descripción y Normativas</label>
                  <textarea formControlName="descripcion" rows="3" placeholder="Detalles de la competencia..."></textarea>
                </div>
                <div class="form-grid-row">
                  <div class="input-field-group">
                    <label>Fecha de Inicio</label>
                    <input type="date" formControlName="fechaInicio" />
                  </div>
                  <div class="input-field-group">
                    <label>Fecha de Fin</label>
                    <input type="date" formControlName="fechaFin" />
                  </div>
                </div>
                <button type="submit" class="btn-submit-primary" [disabled]="compForm.invalid">GUARDAR TORNEO 🐺</button>
              </form>
            </div>
          }
        }

        @if (loading()) {
          <div class="empty-card-state">Cargando competencias...</div>
        } @else if (competitionsList().length === 0) {
          <div class="empty-card-state">No hay competencias creadas aún.</div>
        } @else {
          
          <!-- VISTA DE DETALLE DE UNA COMPETENCIA SELECCIONADA -->
          @if (selectedCompetition()) {
            <div class="competition-detail-view">
              <button class="back-menu-btn" (click)="selectedCompetition.set(null)">⬅️ Volver a la Lista</button>
              
              <div class="wod-display-card">
                <div class="wod-top-meta">
                  <span class="wod-type-badge">{{ selectedCompetition()?.estado | uppercase }}</span>
                  <span class="wod-date-tag">{{ selectedCompetition()?.fechaInicio }} al {{ selectedCompetition()?.fechaFin }}</span>
                </div>
                <h2>{{ selectedCompetition()?.titulo }}</h2>
                <p>{{ selectedCompetition()?.descripcion }}</p>
              </div>

              <!-- PESTAÑAS DE GESTIÓN (WODS, EQUIPOS, SCORES) -->
              <div class="tab-navigation">
                <button [class.active]="activeTab() === 'wods'" (click)="activeTab.set('wods')">🏋️ WODs del Torneo</button>
                <button [class.active]="activeTab() === 'teams'" (click)="activeTab.set('teams')">👥 Equipos & Atletas</button>
                <button [class.active]="activeTab() === 'leaderboard'" (click)="activeTab.set('leaderboard')">🏆 Leaderboard</button>
              </div>

              <!-- CONTENIDO DE WODS -->
              @if (activeTab() === 'wods') {
                <div class="form-card-modern">
                  <h4>Pruebas / WODs de la Competencia</h4>
                  @if (isCoachOrAdmin()) {
                    <form [formGroup]="wodCompForm" (ngSubmit)="addWodToCompetition()">
                      <div class="input-field-group">
                        <label>Título del WOD (Ej. WOD 1 - Max Clean)</label>
                        <input type="text" formControlName="titulo" placeholder="Nombre de la prueba..." />
                      </div>
                      <div class="input-field-group">
                        <label>Descripción / Estándares</label>
                        <textarea formControlName="descripcion" rows="2" placeholder="Detalles de movimientos..."></textarea>
                      </div>
                      <div class="input-field-group">
                        <label>Tipo de Resultado</label>
                        <select formControlName="tipo">
                          <option value="For Time">For Time</option>
                          <option value="AMRAP">AMRAP</option>
                          <option value="EMOM">EMOM</option>
                          <option value="Max Weight">Max Weight</option>
                        </select>
                      </div>
                      <button type="submit" class="btn-submit-primary" [disabled]="wodCompForm.invalid">AÑADIR WOD ➕</button>
                    </form>
                  }

                  <div class="wods-modern-grid" style="margin-top: 20px;">
                    @for (w of selectedCompetition()?.wodsCompetencia || []; track w.id) {
                      <div class="wod-item-card-box">
                        <span class="time-pill">{{ w.tipo }}</span>
                        <h4>{{ w.titulo }}</h4>
                        <p class="wod-desc-text">{{ w.descripcion }}</p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- CONTENIDO DE EQUIPOS / PAREJAS / ATLETAS -->
              @if (activeTab() === 'teams') {
                <div class="form-card-modern">
                  <h4>Inscripción de Atletas, Parejas o Equipos</h4>
                  @if (isCoachOrAdmin()) {
                    <form [formGroup]="teamForm" (ngSubmit)="addTeamToCompetition()">
                      <div class="input-field-group">
                        <label>Nombre del Equipo / Atleta</label>
                        <input type="text" formControlName="nombreEquipo" placeholder="Ej. Lobos Rojos o Juan Pérez" />
                      </div>
                      <div class="form-grid-row">
                        <div class="input-field-group">
                          <label>Modalidad</label>
                          <select formControlName="tipo">
                            <option value="individual">Individual</option>
                            <option value="pareja">Pareja</option>
                            <option value="equipo">Equipo</option>
                          </select>
                        </div>
                        <div class="input-field-group">
                          <label>Categoría</label>
                          <input type="text" formControlName="categoria" placeholder="Ej. RX, Scaled, Master" />
                        </div>
                      </div>

                      <div class="input-field-group">
                        <label>Seleccionar Integrantes Registrados en la App</label>
                        <div class="athletes-checkbox-list">
                          @for (athlete of registeredAthletes(); track athlete.uid) {
                            <label class="athlete-check-item">
                              <input type="checkbox" [value]="athlete.uid" (change)="onAthleteToggle(athlete.uid, $event)" />
                              {{ athlete.nombre }} ({{ athlete.email }})
                            </label>
                          }
                        </div>
                      </div>

                      <button type="submit" class="btn-submit-primary" [disabled]="teamForm.invalid">INSCRIBIR EQUIPO 🐺</button>
                    </form>
                  }

                  <div class="table-card-wrapper" style="margin-top: 20px;">
                    <table class="modern-data-table">
                      <thead>
                        <tr>
                          <th>Equipo / Atleta</th>
                          <th>Modalidad</th>
                          <th>Categoría</th>
                          <th>Integrantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (t of selectedCompetition()?.equiposInscritos || []; track t.id) {
                          <tr>
                            <td><strong>{{ t.nombreEquipo }}</strong></td>
                            <td><span class="spots-pill">{{ t.tipo | uppercase }}</span></td>
                            <td>{{ t.categoria }}</td>
                            <td>{{ t.integrantesNombres.join(', ') }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- CONTENIDO DE LEADERBOARD & REGISTRO DE SCORES -->
              @if (activeTab() === 'leaderboard') {
                <div class="form-card-modern">
                  <h4>🏆 Leaderboard & Puntuaciones</h4>
                  
                  @if (isCoachOrAdmin() && (selectedCompetition()?.wodsCompetencia || []).length > 0 && (selectedCompetition()?.equiposInscritos || []).length > 0) {
                    <form [formGroup]="scoreForm" (ngSubmit)="submitScore()" style="background: #141414; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                      <h5 style="color: #ff4500; margin-top: 0;">Juez: Registrar Score / Tiempo</h5>
                      <div class="form-grid-row">
                        <div class="input-field-group">
                          <label>Seleccionar WOD</label>
                          <select formControlName="wodId">
                            @for (w of selectedCompetition()?.wodsCompetencia || []; track w.id) {
                              <option [value]="w.id">{{ w.titulo }}</option>
                            }
                          </select>
                        </div>
                        <div class="input-field-group">
                          <label>Seleccionar Equipo / Atleta</label>
                          <select formControlName="teamId">
                            @for (t of selectedCompetition()?.equiposInscritos || []; track t.id) {
                              <option [value]="t.id">{{ t.nombreEquipo }} ({{ t.categoria }})</option>
                            }
                          </select>
                        </div>
                      </div>
                      <div class="input-field-group">
                        <label>Resultado (Ej. 3:45 min, 120 reps, 250 lbs)</label>
                        <input type="text" formControlName="resultado" placeholder="Marca obtenida..." />
                      </div>
                      <button type="submit" class="btn-submit-primary" [disabled]="scoreForm.invalid">GUARDAR PUNTUACIÓN 📊</button>
                    </form>
                  }

                  <div class="table-card-wrapper">
                    <table class="modern-data-table">
                      <thead>
                        <tr>
                          <th>Equipo / Atleta</th>
                          @for (w of selectedCompetition()?.wodsCompetencia || []; track w.id) {
                            <th>{{ w.titulo }}</th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (t of selectedCompetition()?.equiposInscritos || []; track t.id) {
                          <tr>
                            <td><strong>{{ t.nombreEquipo }}</strong></td>
                            @for (w of selectedCompetition()?.wodsCompetencia || []; track w.id) {
                              <td>
                                <span class="pr-pill">{{ getScoreResult(t.id, w.id) }}</span>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

            </div>
          } @else {
            <div class="competitions-grid">
              @for (comp of competitionsList(); track comp.id) {
                <div class="competition-card-item" (click)="selectCompetition(comp)" style="cursor: pointer;">
                  <div class="comp-card-header">
                    <span class="time-pill">{{ comp.fechaInicio }}</span>
                    <span class="status-badge active">{{ comp.estado | uppercase }}</span>
                  </div>
                  <h3>{{ comp.titulo }}</h3>
                  <p class="comp-desc">{{ comp.descripcion }}</p>
                  
                  <div class="comp-card-footer">
                    <span class="spots-info">Equipos / Atletas inscritos: <strong>{{ comp.equiposInscritos.length || 0 }}</strong></span>
                    <span class="card-action-link">Ver Torneo & Leaderboard &rarr;</span>
                  </div>
                </div>
              }
            </div>
          }

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

    .content-grid-layout { padding: 32px 24px; max-width: 1000px; margin: 0 auto; }
    .section-heading { margin-bottom: 24px; }
    .section-heading h2 { color: #fff; border-left: 5px solid #ff4500; padding-left: 14px; margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .section-heading p { color: #888; margin: 0; font-size: 13px; }

    .coach-actions-bar { margin-bottom: 24px; }
    .competitions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .competition-card-item { background: #181818; border: 1px solid #2c2c2c; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-shadow: 0 6px 16px rgba(0,0,0,0.3); transition: border-color 0.2s; }
    .competition-card-item:hover { border-color: #ff4500; }
    
    .comp-card-header { display: flex; justify-content: space-between; align-items: center; }
    .time-pill { background: #ff4500; color: #fff; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 6px; }
    .status-badge { font-size: 10px; padding: 4px 10px; border-radius: 6px; font-weight: bold; background: #2e7d32; color: #fff; }
    .competition-card-item h3 { margin: 0; color: #fff; font-size: 18px; }
    .comp-desc { color: #aaa; font-size: 13px; margin: 0; line-height: 1.4; }
    .comp-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #252525; padding-top: 14px; }
    .spots-info { font-size: 12px; color: #aaa; }
    .card-action-link { font-size: 12px; font-weight: bold; color: #ff4500; }

    .tab-navigation { display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid #222; padding-bottom: 12px; }
    .tab-navigation button { background: #181818; color: #aaa; border: 1px solid #333; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; }
    .tab-navigation button.active { background: #ff4500; color: #fff; border-color: #ff4500; }

    .form-card-modern, .table-card-wrapper { background: #181818; border-radius: 14px; padding: 24px; border: 1px solid #2c2c2c; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .form-card-modern h4 { margin-top: 0; margin-bottom: 18px; color: #ff4500; font-size: 16px; }
    .form-grid-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .input-field-group { margin-bottom: 16px; flex: 1; min-width: 220px; }
    label { display: block; margin-bottom: 6px; font-size: 12px; color: #aaa; font-weight: 600; text-transform: uppercase; }
    input[type="text"], input[type="date"], select, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; box-sizing: border-box; font-family: inherit; font-size: 13px; outline: none; }
    input:focus, select:focus, textarea:focus { border-color: #ff4500; }
    textarea { resize: vertical; }

    .btn-submit-primary { background: #ff4500; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 13px; transition: background 0.2s; }
    .btn-submit-primary:hover:not(:disabled) { background: #e03d00; }
    .btn-submit-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .wods-modern-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .wod-item-card-box { background: #141414; border: 1px solid #282828; border-radius: 10px; padding: 16px; }
    .wod-item-card-box h4 { margin: 8px 0; color: #fff; font-size: 15px; }
    .wod-desc-text { color: #aaa; font-size: 12px; margin: 0; white-space: pre-line; }

    .athletes-checkbox-list { background: #141414; border: 1px solid #333; border-radius: 8px; max-height: 150px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .athlete-check-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #ccc; cursor: pointer; }
    .athlete-check-item input { accent-color: #ff4500; width: 16px; height: 16px; }

    .modern-data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    .modern-data-table th, .modern-data-table td { padding: 14px 16px; border-bottom: 1px solid #252525; }
    .modern-data-table th { background: #141414; color: #ff4500; font-weight: 700; text-transform: uppercase; font-size: 11px; }
    .pr-pill { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
    .spots-pill { font-size: 11px; color: #aaa; background: #252525; padding: 3px 8px; border-radius: 6px; }

    .wod-display-card { background: #181818; border-radius: 14px; padding: 24px; border: 1px solid #313131; margin-bottom: 24px; }
    .wod-top-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .wod-type-badge { background: #ff4500; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .wod-date-tag { font-size: 12px; color: #777; }
    .wod-display-card h2 { margin: 0 0 8px 0; color: #fff; font-size: 20px; }
    .wod-display-card p { color: #aaa; font-size: 13px; margin: 0; }
    .back-menu-btn { background: #222; color: #fff; border: 1px solid #444; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; margin-bottom: 20px; }
    .empty-card-state { background: #161616; padding: 40px; border-radius: 12px; text-align: center; color: #777; border: 1px dashed #333; font-style: italic; }
  `]
})
export class CompetitionsPageComponent implements OnInit {
  private competitionService = inject(CompetitionService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  userProfile = this.authService.currentUserProfile;
  competitionsList = signal<Competition[]>([]);
  selectedCompetition = signal<Competition | null>(null);
  registeredAthletes = signal<UserProfile[]>([]);
  
  loading = signal<boolean>(true);
  showCreateForm = signal<boolean>(false);
  activeTab = signal<'wods' | 'teams' | 'leaderboard'>('wods');

  selectedIntegrantesUids: string[] = [];

  fb = inject(FormBuilder);
  compForm: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required]
  });

  wodCompForm: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    tipo: ['For Time', Validators.required]
  });

  teamForm: FormGroup = this.fb.group({
    nombreEquipo: ['', Validators.required],
    tipo: ['individual', Validators.required],
    categoria: ['RX', Validators.required]
  });

  scoreForm: FormGroup = this.fb.group({
    wodId: ['', Validators.required],
    teamId: ['', Validators.required],
    resultado: ['', Validators.required]
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const comps = await this.competitionService.getCompetitions();
      this.competitionsList.set(comps);
      const users = await this.adminService.getAllUsers();
      this.registeredAthletes.set(users);
    } catch (err) {
      console.error('Error cargando datos de competencias:', err);
    } finally {
      this.loading.set(false);
    }
  }

  isCoachOrAdmin(): boolean {
    const rol = this.userProfile()?.rol;
    return rol === 'coach' || rol === 'admin';
  }

  toggleCreateModal() {
    this.showCreateForm.update(v => !v);
  }

  async saveCompetition() {
    if (this.compForm.invalid) return;
    const formVal = this.compForm.value;
    const newComp: Competition = {
      ...formVal,
      estado: 'proxima',
      creadoPor: this.userProfile()?.uid || 'coach',
      equiposInscritos: [],
      wodsCompetencia: [],
      scores: []
    };

    this.competitionService.createCompetition(newComp).subscribe({
      next: async () => {
        this.compForm.reset();
        this.showCreateForm.set(false);
        await this.loadData();
      }
    });
  }

  selectCompetition(comp: Competition) {
    this.selectedCompetition.set(comp);
    this.activeTab.set('wods');
  }

  async addWodToCompetition() {
    if (this.wodCompForm.invalid || !this.selectedCompetition()?.id) return;
    const comp = this.selectedCompetition()!;
    const newWod: CompetitionWod = {
      id: 'wod_' + Date.now(),
      ...this.wodCompForm.value
    };

    const updatedWods = [...(comp.wodsCompetencia || []), newWod];
    await this.competitionService.updateCompetitionData(comp.id!, { wodsCompetencia: updatedWods });
    
    comp.wodsCompetencia = updatedWods;
    this.selectedCompetition.set({ ...comp });
    this.wodCompForm.reset({ tipo: 'For Time' });
  }

  onAthleteToggle(uid: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedIntegrantesUids.includes(uid)) {
        this.selectedIntegrantesUids.push(uid);
      }
    } else {
      this.selectedIntegrantesUids = this.selectedIntegrantesUids.filter(id => id !== uid);
    }
  }

  async addTeamToCompetition() {
    if (this.teamForm.invalid || !this.selectedCompetition()?.id) return;
    const comp = this.selectedCompetition()!;
    const formVal = this.teamForm.value;

    const nombresIntegrantes = this.registeredAthletes()
      .filter(u => this.selectedIntegrantesUids.includes(u.uid))
      .map(u => u.nombre || u.email);

    const newTeam: CompetitionTeam = {
      id: 'team_' + Date.now(),
      nombreEquipo: formVal.nombreEquipo,
      categoria: formVal.categoria,
      tipo: formVal.tipo,
      integrantesUids: [...this.selectedIntegrantesUids],
      integrantesNombres: nombresIntegrantes.length > 0 ? nombresIntegrantes : ['Atleta Independiente']
    };

    const updatedTeams = [...(comp.equiposInscritos || []), newTeam];
    await this.competitionService.updateCompetitionData(comp.id!, { equiposInscritos: updatedTeams });

    comp.equiposInscritos = updatedTeams;
    this.selectedCompetition.set({ ...comp });
    this.teamForm.reset({ tipo: 'individual', categoria: 'RX' });
    this.selectedIntegrantesUids = [];
  }

  async submitScore() {
    if (this.scoreForm.invalid || !this.selectedCompetition()?.id) return;
    const comp = this.selectedCompetition()!;
    const formVal = this.scoreForm.value;

    const newScore: CompetitionScore = {
      wodId: formVal.wodId,
      teamId: formVal.teamId,
      resultado: formVal.resultado
    };

    const existingScores = (comp.scores || []).filter(s => !(s.wodId === newScore.wodId && s.teamId === newScore.teamId));
    const updatedScores = [...existingScores, newScore];

    await this.competitionService.updateCompetitionData(comp.id!, { scores: updatedScores });

    comp.scores = updatedScores;
    this.selectedCompetition.set({ ...comp });
    this.scoreForm.reset();
  }

  getScoreResult(teamId: string, wodId: string): string {
    const score = (this.selectedCompetition()?.scores || []).find(s => s.teamId === teamId && s.wodId === wodId);
    return score ? score.resultado : '-';
  }

  goBack() {
    window.history.back();
  }
}