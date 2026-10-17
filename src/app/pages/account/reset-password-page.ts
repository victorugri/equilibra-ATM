import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { authErrorMessage } from '../../core/auth/auth-errors';
import { AuthService } from '../../core/auth/auth.service';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PasswordField } from './password-field';

/** Nova senha, aberta pelo link do e-mail de recuperação. */
@Component({
  selector: 'app-reset-password-page',
  imports: [RouterLink, PageHeader, PasswordField],
  template: `
    <app-page-header title="Nova senha" variant="internal" backTo="/conta/entrar" />
    <div class="page">
      <section class="title">
        <h1>Crie uma nova senha</h1>
      </section>

      @if (done()) {
        <p class="form-success" role="status">Senha alterada. Você já está na sua conta.</p>
        <a class="btn-primary" routerLink="/inicio">Ir para o início</a>
      } @else if (!auth.signedIn()) {
        <p class="field-help">
          Abra esta tela pelo link do e-mail de recuperação. Se o link expirou, peça outro.
        </p>
        <a class="btn-primary" routerLink="/conta/esqueci-senha">Pedir novo link</a>
      } @else {
        <form class="form" (submit)="submit($event)" novalidate>
          <app-password-field
            label="Nova senha"
            help="Pelo menos 8 caracteres."
            autocomplete="new-password"
            [(value)]="password"
          />
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary" [disabled]="busy()">
            {{ busy() ? 'Salvando…' : 'Salvar nova senha' }}
          </button>
        </form>
      }
    </div>
  `,
  styleUrl: './account.scss',
})
export class ResetPasswordPage {
  protected readonly auth = inject(AuthService);

  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly done = signal(false);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.password().length < 8) {
      return this.error.set('A senha precisa ter pelo menos 8 caracteres.');
    }
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.updatePassword(this.password());
      this.done.set(true);
    } catch (error) {
      this.error.set(authErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
