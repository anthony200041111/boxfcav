import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-area">
          <h1>🐺 FC ACTIVE WOLF</h1>
          <p>Control de Asistencia & WODs</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" formControlName="email" placeholder="atleta&#64;fcactivewolf.com" />
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <small class="error-text">Ingresa un correo válido.</small>
            }
          </div>

          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" formControlName="password" placeholder="••••••••" />
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <small class="error-text">La contraseña es obligatoria.</small>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-alert">{{ errorMessage() }}</div>
          }

          <button type="submit" class="auth-btn" [disabled]="loginForm.invalid || loading()">
            {{ loading() ? 'Ingresando...' : 'ENTRAR AL BOX' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿No tienes una cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #121212; font-family: sans-serif; padding: 20px; }
    .auth-card { background: #1e1e1e; border: 1px solid #333; padding: 40px; border-radius: 8px; width: 100%; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); box-sizing: border-box; }
    .logo-area { text-align: center; margin-bottom: 30px; }
    .logo-area h1 { color: #ff4500; margin: 0 0 10px 0; font-size: 24px; }
    .logo-area p { color: #888; font-size: 14px; margin: 0; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 6px; font-size: 13px; color: #bbb; font-weight: bold; }
    input { width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: white; box-sizing: border-box; font-family: inherit; }
    input:focus { border-color: #ff4500; outline: none; }
    .auth-btn { background: #ff4500; color: #fff; border: none; width: 100%; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 15px; transition: background 0.2s; }
    .auth-btn:hover { background: #e03d00; }
    .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-text { color: #ff6b6b; font-size: 11px; display: block; margin-top: 4px; }
    .error-alert { background: rgba(255, 69, 0, 0.15); color: #ff6b4a; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; text-align: center; }
    .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #888; }
    .auth-footer a { color: #ff4500; text-decoration: none; font-weight: bold; }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        const profile = this.authService.currentUserProfile();
        if (profile?.rol === 'admin') {
          this.router.navigate(['/admin']);
        } else if (profile?.rol === 'coach') {
          this.router.navigate(['/coach']);
        } else {
          this.router.navigate(['/athlete']);
        }
      },
      error: (err) => {
        console.error('Error de login:', err);
        this.loading.set(false);
        this.errorMessage.set('Correo o contraseña incorrectos.');
      }
    });
  }
}