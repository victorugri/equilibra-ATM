import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { authErrorMessage } from '../../core/auth/auth-errors';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PasswordField } from './password-field';

/** Entrar na conta. Não existe no Figma: segue o modelo de "Criar conta" (23:2). */
@Component({
  selector: 'app-sign-in-page',
  imports: [RouterLink, PageHeader, Icon, PasswordField],
  template: `
    <app-page-header title="Entrar" variant="internal" backTo="/perfil" />
    <div class="page">
      <section class="title">
        <h1>Entrar na sua conta</h1>
        <p>Seus registros guardados na conta voltam para este aparelho.</p>
      </section>

      <form class="form" (submit)="submit($event)" novalidate>
        <div class="field">
          <label class="field-label" for="email">E-mail</label>
          <div class="input-box">
            <app-icon name="email" />
            <input
              id="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="seuemail@exemplo.com"
              [value]="email()"
              (input)="email.set($any($event.target).value)"
            />
          </div>
        </div>

        <app-password-field label="Senha" autocomplete="current-password" [(value)]="password" />

        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn-primary" [disabled]="busy()">
          {{ busy() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <a class="btn-link" routerLink="/conta/esqueci-senha">Esqueci minha senha</a>
      <a class="btn-link" routerLink="/conta/criar">Ainda não tenho conta · Criar conta</a>
    </div>
  `,
  styleUrl: './account.scss',
})
export class SignInPage {
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email().trim() || !this.password()) {
      return this.error.set('Digite seu e-mail e sua senha.');
    }
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.signIn(this.email().trim(), this.password());
      await this.profile.completeOnboarding();
      await this.router.navigateByUrl('/inicio');
    } catch (error) {
      this.error.set(authErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
