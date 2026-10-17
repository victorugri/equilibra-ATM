import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileStore, UsesSplint } from '../../core/data/profile.service';
import { SyncService } from '../../core/sync/sync.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';

const SPLINT_OPTIONS: { value: Exclude<UsesSplint, null>; label: string }[] = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unsure', label: 'Não sei' },
];

/**
 * Cadastro opcional (Figma 24:2): como prefere ser chamado(a), se usa placa e o contato do
 * dentista. Logo depois de criar a conta (modo "signup") ou pelo Perfil (modo "edit").
 */
@Component({
  selector: 'app-profile-form-page',
  imports: [PageHeader, Icon],
  template: `
    @if (mode() === 'signup') {
      <app-page-header title="Equilibra ATM" variant="onboarding" />
    } @else {
      <app-page-header title="Editar dados" variant="internal" backTo="/perfil" />
    }
    <div class="page">
      <section class="title">
        @if (mode() === 'signup') {
          <p class="eyebrow">Conta criada ✓</p>
          <h1>Complete seu cadastro</h1>
        } @else {
          <h1>Seus dados</h1>
        }
        <p>Tudo aqui é opcional. Você pode preencher ou mudar depois, no Perfil.</p>
      </section>

      <form class="form" (submit)="save($event)" novalidate>
        <div class="field">
          <label class="field-label" for="nickname">
            Como prefere ser chamado(a)?
            <span class="optional">Opcional</span>
          </label>
          <div class="input-box">
            <app-icon name="pessoa" />
            <input
              id="nickname"
              type="text"
              maxlength="40"
              autocomplete="nickname"
              placeholder="Ex.: Maria"
              aria-describedby="nickname-help"
              [value]="nickname()"
              (input)="nickname.set($any($event.target).value)"
            />
          </div>
          <p id="nickname-help" class="field-help">Usado só para a saudação do app.</p>
        </div>

        <fieldset class="field">
          <legend class="field-label">
            Você usa placa para dormir?
            <span class="optional">Opcional</span>
          </legend>
          <div class="options">
            @for (option of splintOptions; track option.value) {
              <label class="option" [class.selected]="usesSplint() === option.value">
                <input
                  class="visually-hidden"
                  type="radio"
                  name="uses-splint"
                  [value]="option.value"
                  [checked]="usesSplint() === option.value"
                  (change)="usesSplint.set(option.value)"
                />
                {{ option.label }}
              </label>
            }
          </div>
          <p class="field-help">Se não usa, o diário não pergunta sobre a placa.</p>
        </fieldset>

        <fieldset class="field">
          <legend class="field-label">
            Contato do seu dentista
            <span class="optional">Opcional</span>
          </legend>
          <div class="input-box">
            <app-icon name="dente" />
            <input
              type="text"
              maxlength="80"
              aria-label="Nome do dentista"
              placeholder="Nome do dentista"
              [value]="dentistName()"
              (input)="dentistName.set($any($event.target).value)"
            />
          </div>
          <div class="input-box">
            <app-icon name="telefone" />
            <input
              type="tel"
              maxlength="30"
              autocomplete="off"
              inputmode="tel"
              aria-label="Telefone ou WhatsApp do dentista"
              placeholder="Telefone ou WhatsApp"
              aria-describedby="dentist-help"
              [value]="dentistPhone()"
              (input)="dentistPhone.set($any($event.target).value)"
            />
          </div>
          <p id="dentist-help" class="field-help">
            Para ligar pelo botão SOS. Nada é enviado ao dentista sem a sua autorização.
          </p>
        </fieldset>

        <button type="submit" class="btn-primary" [disabled]="saving()">
          {{ mode() === 'signup' ? 'Salvar e continuar' : 'Salvar' }}
        </button>
      </form>

      @if (mode() === 'signup') {
        <button type="button" class="btn-link" (click)="done()">Pular por agora</button>
      }
      <p class="minimal-note">
        Não pedimos CPF, endereço nem data de nascimento: o app funciona sem esses dados.
      </p>
    </div>
  `,
  styleUrl: './account.scss',
})
export class ProfileFormPage {
  /** "signup": logo depois de criar a conta; "edit": pelo Perfil (vem de data.mode da rota). */
  readonly mode = input<'signup' | 'edit'>('edit');

  private readonly profile = inject(ProfileStore);
  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  protected readonly splintOptions = SPLINT_OPTIONS;
  // Começam com o que está salvo (e se atualizam quando o perfil termina de carregar).
  protected readonly nickname = linkedSignal(() => this.profile.profile().nickname);
  protected readonly usesSplint = linkedSignal<UsesSplint>(() => this.profile.profile().usesSplint);
  protected readonly dentistName = linkedSignal(() => this.profile.profile().dentistName);
  protected readonly dentistPhone = linkedSignal(() => this.profile.profile().dentistPhone);
  protected readonly saving = signal(false);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.saving.set(true);
    await this.profile.saveProfile({
      nickname: this.nickname().trim(),
      usesSplint: this.usesSplint(),
      dentistName: this.dentistName().trim(),
      dentistPhone: this.dentistPhone().trim(),
    });
    this.sync.schedule();
    await this.done();
  }

  protected async done(): Promise<void> {
    await this.router.navigateByUrl(this.mode() === 'signup' ? '/inicio' : '/perfil');
  }
}
