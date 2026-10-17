import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { authErrorMessage } from '../../core/auth/auth-errors';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/** Pede o e-mail com o link para criar uma nova senha. */
@Component({
  selector: 'app-forgot-password-page',
  imports: [RouterLink, PageHeader, Icon],
  template: `
    <app-page-header title="Recuperar senha" variant="internal" backTo="/conta/entrar" />
    <div class="page">
      <section class="title">
        <h1>Esqueceu a senha?</h1>
        <p>Digite o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>
      </section>

      @if (sent()) {
        <p class="form-success" role="status">
          Pronto. Se existir uma conta com este e-mail, o link chega em alguns minutos. Confira
          também a caixa de spam.
        </p>
        <a class="btn-primary" routerLink="/conta/entrar">Voltar para entrar</a>
      } @else {
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
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary" [disabled]="busy()">
            {{ busy() ? 'Enviando…' : 'Enviar link' }}
          </button>
        </form>
      }
    </div>
  `,
  styleUrl: './account.scss',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  protected readonly email = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly sent = signal(false);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email().includes('@')) return this.error.set('Digite um e-mail válido.');
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.requestPasswordReset(this.email().trim());
      this.sent.set(true);
    } catch (error) {
      this.error.set(authErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
