import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { authErrorMessage } from '../../core/auth/auth-errors';
import { AuthService } from '../../core/auth/auth.service';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PRIVACY_CODE } from '../onboarding/privacy-page';
import { PasswordField } from './password-field';

/** Criar conta (Figma 23:2). A conta é opcional: "Usar sem criar conta" segue sem ela. */
@Component({
  selector: 'app-sign-up-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe, PasswordField],
  template: `
    <app-page-header title="Equilibra ATM" variant="onboarding" />
    <div class="page">
      @if (confirmEmailFor(); as email) {
        <section class="title">
          <h1>Confirme seu e-mail</h1>
          <p>
            Enviamos um link para <strong>{{ email }}</strong
            >. Abra o e-mail, toque no link e depois entre com seu e-mail e senha.
          </p>
        </section>
        <a class="btn-primary" routerLink="/conta/entrar">Já confirmei · Entrar</a>
        <button type="button" class="btn-outline" (click)="useWithoutAccount()">
          Continuar sem conta por enquanto
        </button>
      } @else {
        <section class="title">
          <h1>Crie seu acesso</h1>
          <p>Só precisamos de um e-mail e uma senha. Não pedimos nome, CPF nem telefone.</p>
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
                aria-describedby="email-help"
                [value]="email()"
                (input)="email.set($any($event.target).value)"
              />
            </div>
            <p id="email-help" class="field-help">
              Usado apenas para entrar e para recuperar a senha.
            </p>
          </div>

          <app-password-field
            label="Senha"
            placeholder="Crie uma senha"
            help="Pelo menos 8 caracteres."
            autocomplete="new-password"
            [(value)]="password"
          />

          <label class="consent">
            <input
              type="checkbox"
              [checked]="consent()"
              (change)="consent.set($any($event.target).checked)"
            />
            <span class="checkbox" aria-hidden="true"><app-icon name="check" /></span>
            <span>
              Concordo com o uso dos meus registros de saúde (dor, exercícios e sono) para o
              funcionamento do aplicativo, conforme a LGPD.
              <span class="consent-detail">{{ privacyCode | content }}</span>
            </span>
          </label>

          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary" [disabled]="busy()">
            {{ busy() ? 'Criando conta…' : 'Criar conta' }}
          </button>
        </form>

        <a class="btn-link" routerLink="/conta/entrar">Já tenho conta · Entrar</a>

        <div class="divider" aria-hidden="true"><span>ou</span></div>

        <button type="button" class="btn-outline" (click)="useWithoutAccount()">
          <app-icon name="celular" />
          Usar sem criar conta
        </button>
        <p class="field-help center">
          Seus registros ficam só neste celular e não podem ser recuperados se você trocar de
          aparelho.
        </p>
      }
    </div>
  `,
  styleUrl: './account.scss',
})
export class SignUpPage {
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileStore);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);

  protected readonly privacyCode = PRIVACY_CODE;
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly consent = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmEmailFor = signal<string | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const email = this.email().trim();
    if (!email.includes('@')) return this.error.set('Digite um e-mail válido.');
    if (this.password().length < 8)
      return this.error.set('A senha precisa ter pelo menos 8 caracteres.');
    if (!this.consent()) {
      return this.error.set(
        'Para criar a conta, marque que concorda com o uso dos seus registros.',
      );
    }
    this.error.set('');
    this.busy.set(true);
    try {
      const result = await this.auth.signUp(email, this.password());
      // Consentimento explícito para guardar os dados de saúde na conta (LGPD, art. 11).
      await this.profile.acceptConsent(PRIVACY_CODE, this.content.version());
      await this.profile.completeOnboarding();
      if (result === 'signed-in') {
        await this.router.navigateByUrl('/conta/cadastro');
      } else {
        this.confirmEmailFor.set(email);
      }
    } catch (error) {
      this.error.set(authErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async useWithoutAccount(): Promise<void> {
    await this.profile.completeOnboarding();
    await this.router.navigateByUrl('/inicio');
  }
}
