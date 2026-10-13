import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-area">
          <h1>🐺 FC ACTIVE WOLF</h1>
          <p>Registro de Nuevo Atleta</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" formControlName="nombre" placeholder="Nombre y Apellido" />
            @if (registerForm.get('nombre')?.touched && registerForm.get('nombre')?.invalid) {
              <small class="error-text">El nombre completo es obligatorio.</small>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input type="email" formControlName="email" placeholder="correo@domain.com" />
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                <small class="error-text">Correo inválido.</small>
              }
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres" />
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <small class="error-text">Mínimo 6 caracteres requeridos.</small>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha de Nacimiento</label>
              <input type="date" formControlName="fechaNacimiento" />
              @if (registerForm.get('fechaNacimiento')?.touched && registerForm.get('fechaNacimiento')?.invalid) {
                <small class="error-text">Selecciona tu fecha de nacimiento.</small>
              }
            </div>
            <div class="form-group">
              <label>Teléfono Celular</label>
              <input type="tel" formControlName="telefono" placeholder="0991234567" />
              @if (registerForm.get('telefono')?.touched && registerForm.get('telefono')?.invalid) {
                <small class="error-text">Ingresa un número de teléfono válido.</small>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Contacto de Emergencia</label>
              <input type="text" formControlName="contactoEmergencia" placeholder="Familiar / Amigo (099...)" />
            </div>
            <div class="form-group">
              <label>Tipo de Sangre</label>
              <select formControlName="tipoSangre">
                <option value="">Seleccione...</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Enfermedades o Lesiones (Opcional)</label>
            <textarea formControlName="condicionesMedicas" rows="2" placeholder="Ej. Asma leve, lesión en hombro..."></textarea>
          </div>

          @if (errorMessage()) {
            <div class="error-alert">{{ errorMessage() }}</div>
          }

          <button type="submit" class="auth-btn" [disabled]="registerForm.invalid || loading()">
            {{ loading() ? 'Registrando...' : 'COMPLETAR REGISTRO' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; background: #121212; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; }
    .auth-card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 40px; width: 100%; max-width: 550px; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .logo-area { text-align: center; margin-bottom: 30px; }
    .logo-area h1 { color: #ff4500; margin: 0 0 10px 0; font-size: 24px; }
    .logo-area p { color: #888; font-size: 14px; margin: 0; }
    
    .form-row { display: flex; gap: 16px; }
    .form-group { margin-bottom: 16px; flex: 1; }
    label { display: block; margin-bottom: 6px; font-size: 13px; color: #bbb; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: white; box-sizing: border-box; font-family: inherit; font-size: 14px; }
    input:focus, select:focus, textarea:focus { border-color: #ff4500; outline: none; }
    textarea { resize: vertical; }

    .error-text { color: #ff6b6b; font-size: 11px; display: block; margin-top: 4px; }
    .error-alert { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center; }

    .auth-btn { background: #ff4500; color: #fff; border: none; padding: 14px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; font-size: 14px; transition: background 0.2s; margin-top: 10px; }
    .auth-btn:hover { background: #e03d00; }
    .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #888; }
    .auth-footer a { color: #ff4500; text-decoration: none; font-weight: bold; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class RegisterPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  registerForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fechaNacimiento: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
    contactoEmergencia: ['', Validators.required],
    tipoSangre: ['', Validators.required],
    condicionesMedicas: ['']
  });

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.value;
    const { email, password, ...additionalData } = formValue;

    this.authService.register(email, password, additionalData).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/athlete']);
      },
      error: (err) => {
        console.error('Error de registro:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al registrar usuario. El correo podría estar en uso.');
      }
    });
  }
}