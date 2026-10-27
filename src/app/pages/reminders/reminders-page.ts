import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ContentPipe } from '../../core/content/content.pipe';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { PushService, PushStatus } from '../../core/reminders/push.service';
import { isoDate } from '../../core/reminders/reminder-schedule';
import { ReminderSettingsStore } from '../../core/reminders/reminder-settings.service';
import { SyncService } from '../../core/sync/sync.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PushStatusNote } from './push-status';
import { QuietHours } from './quiet-hours';
import { ReminderModePicker } from './reminder-mode-picker';

/** Meus lembretes: frequência, horários, silêncio e pausa (Figma 7:2142). */
@Component({
  selector: 'app-reminders-page',
  imports: [
    RouterLink,
    PageHeader,
    Icon,
    ContentPipe,
    ReminderModePicker,
    QuietHours,
    PushStatusNote,
  ],
  template: `
    <app-page-header title="Meus lembretes" variant="internal" backTo="/perfil" />
    <div class="page">
      <p class="lead">{{ 'LEM-05' | content }}</p>

      @if (!signedIn()) {
        <section class="card" aria-labelledby="account-title">
          <h2 id="account-title">Lembretes precisam de conta</h2>
          <p>
            É o servidor que envia as notificações nos horários que você escolher. Seus registros
            continuam guardados no aparelho.
          </p>
          <a class="btn-primary" routerLink="/conta/criar">Criar conta</a>
          <a class="btn-outline" routerLink="/conta/entrar">Já tenho conta · Entrar</a>
        </section>
      } @else {
        @if (mode() !== 'off') {
          <app-push-status />
        }

        @if (savedActive()) {
          <section class="card" aria-labelledby="pause-title">
            <div class="pause-head">
              <span class="pause-icon"><app-icon name="pausar" /></span>
              <span class="pause-title">
                <h2 id="pause-title">Pausar por hoje</h2>
                <small>Pausa temporária</small>
              </span>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-labelledby="pause-title"
                [attr.aria-checked]="pausedToday()"
                (click)="togglePause()"
              >
                <span class="knob"></span>
              </button>
            </div>
            <p>
              Para um dia cheio ou para descansar das notificações. Os lembretes voltam sozinhos
              amanhã.
            </p>
          </section>
        }

        <app-reminder-mode-picker [(mode)]="mode" [(customTimes)]="customTimes" />

        @if (mode() !== 'off') {
          <app-quiet-hours [(start)]="quietStart" [(end)]="quietEnd" />
        }

        @if (savedActive() && hasPrescription()) {
          <section class="card" aria-labelledby="exercise-title">
            <div class="pause-head">
              <span class="pause-icon"><app-icon name="exercicio-guiado" /></span>
              <span class="pause-title">
                <h2 id="exercise-title">Sessão de exercício no lembrete</h2>
                <small>Indicada pelo seu dentista</small>
              </span>
              <button
                type="button"
                class="switch"
                role="switch"
                aria-labelledby="exercise-title"
                [attr.aria-checked]="saved().exerciseReminders"
                (click)="toggleExercise()"
              >
                <span class="knob"></span>
              </button>
            </div>
            <p>
              Sem notificação a mais: a sessão vem junto com o lembrete mais próximo, até você fazer
              as sessões do dia.
            </p>
          </section>
        }

        <div class="actions">
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button type="button" class="btn-primary save" (click)="save()" [disabled]="busy()">
            <app-icon name="salvar-preferencias" />
            Salvar preferências de lembrete
          </button>
          @if (message()) {
            <p class="message" role="status">{{ message() }}</p>
          }
          <p class="hint">Suas preferências ficam guardadas na sua conta.</p>
        </div>
      }
    </div>
  `,
  styleUrl: './reminders.scss',
})
export class RemindersPage {
  private readonly auth = inject(AuthService);
  private readonly store = inject(ReminderSettingsStore);
  private readonly push = inject(PushService);
  private readonly sync = inject(SyncService);

  protected readonly signedIn = this.auth.signedIn;
  protected readonly saved = this.store.settings;
  protected readonly hasPrescription = inject(PrescriptionStore).active;
  protected readonly savedActive = this.store.active;
  protected readonly pausedToday = computed(() => this.saved().pausedOn === isoDate(new Date()));

  // O formulário começa com o que está salvo e acompanha a sincronização.
  protected readonly mode = linkedSignal(() => this.saved().mode);
  protected readonly customTimes = linkedSignal(() => this.saved().customTimes);
  protected readonly quietStart = linkedSignal(() => this.saved().quietStart);
  protected readonly quietEnd = linkedSignal(() => this.saved().quietEnd);

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');

  protected async toggleExercise(): Promise<void> {
    await this.store.save({ exerciseReminders: !this.saved().exerciseReminders });
    this.sync.schedule();
  }

  protected async togglePause(): Promise<void> {
    await this.store.pauseToday(!this.pausedToday());
    this.sync.schedule();
  }

  protected async save(): Promise<void> {
    this.error.set('');
    this.message.set('');
    const mode = this.mode();
    if (mode === 'custom' && !this.customTimes().length) {
      this.error.set('Adicione pelo menos um horário ou escolha outra opção.');
      return;
    }
    this.busy.set(true);
    // A permissão é pedida antes de qualquer outra espera: o Safari (iPhone) só mostra o
    // pedido se ele vier logo depois do toque.
    let status: PushStatus | null = null;
    let pushFailed = false;
    try {
      if (mode === 'off') await this.push.disable();
      else status = await this.push.enable();
    } catch {
      pushFailed = true;
    }
    try {
      await this.store.save({
        mode,
        customTimes: mode === 'custom' ? this.customTimes() : [],
        quietStart: this.quietStart(),
        quietEnd: this.quietEnd(),
      });
      this.sync.schedule();
      if (pushFailed) {
        this.error.set(
          'As preferências foram salvas, mas não deu para ativar as notificações agora. Confira a internet e tente de novo.',
        );
      } else if (mode === 'off') {
        this.message.set('Lembretes desligados.');
      } else {
        this.message.set(
          status === 'granted'
            ? 'Preferências salvas. Este aparelho vai receber os lembretes.'
            : 'Preferências salvas.',
        );
      }
    } finally {
      this.busy.set(false);
    }
  }
}
