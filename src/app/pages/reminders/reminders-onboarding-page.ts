import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ContentPipe } from '../../core/content/content.pipe';
import { PushService, PushStatus } from '../../core/reminders/push.service';
import {
  DEFAULT_QUIET_END,
  DEFAULT_QUIET_START,
  ReminderMode,
} from '../../core/reminders/reminder-schedule';
import { ReminderSettingsStore } from '../../core/reminders/reminder-settings.service';
import { SyncService } from '../../core/sync/sync.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PushStatusNote } from './push-status';
import { QuietHours } from './quiet-hours';
import { ReminderModePicker } from './reminder-mode-picker';

/** Entrada no app, depois do cadastro: escolher os lembretes (Figma 7:483). */
@Component({
  selector: 'app-reminders-onboarding-page',
  imports: [PageHeader, Icon, ContentPipe, ReminderModePicker, QuietHours, PushStatusNote],
  template: `
    <app-page-header title="Equilibra ATM" variant="onboarding" [showSkip]="true" (skip)="skip()" />
    <div class="page">
      <section class="intro">
        <h1>Seus lembretes de relaxamento</h1>
        <p>{{ 'LEM-05' | content }}</p>
      </section>

      <app-reminder-mode-picker
        legend="Qual ritmo combina melhor com você?"
        offLabel="Não quero lembretes agora"
        [(mode)]="mode"
        [(customTimes)]="customTimes"
      />

      @if (mode() !== 'off') {
        <app-quiet-hours [(start)]="quietStart" [(end)]="quietEnd" />
        <app-push-status />
      }

      <div class="actions">
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button type="button" class="btn-primary" (click)="continue()" [disabled]="busy()">
          Continuar
          <app-icon name="seta-continuar" />
        </button>
        <p class="hint">Você terá controle total sobre esses alertas no seu perfil.</p>
      </div>
    </div>
  `,
  styleUrl: './reminders.scss',
})
export class RemindersOnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly store = inject(ReminderSettingsStore);
  private readonly push = inject(PushService);
  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  protected readonly mode = signal<ReminderMode>('three');
  protected readonly customTimes = signal<readonly string[]>([]);
  protected readonly quietStart = signal(DEFAULT_QUIET_START);
  protected readonly quietEnd = signal(DEFAULT_QUIET_END);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  /** Depois de um aviso (ex.: notificações bloqueadas), o próximo "Continuar" segue em frente. */
  private warned = false;

  constructor() {
    // Lembretes exigem conta: sem ela, esta etapa não se aplica.
    void this.auth.ready.then(() => {
      if (!this.auth.signedIn()) void this.router.navigateByUrl('/inicio');
    });
  }

  protected async continue(): Promise<void> {
    this.error.set('');
    const mode = this.mode();
    if (mode === 'custom' && !this.customTimes().length) {
      this.error.set('Adicione pelo menos um horário ou escolha outra opção.');
      return;
    }
    this.busy.set(true);
    try {
      // A permissão é pedida antes de qualquer outra espera: o Safari (iPhone) só mostra o
      // pedido se ele vier logo depois do toque.
      let status: PushStatus | null = null;
      let pushFailed = false;
      if (mode !== 'off' && !this.warned) {
        try {
          status = await this.push.enable();
        } catch {
          pushFailed = true;
        }
      }
      await this.store.save({
        mode,
        customTimes: mode === 'custom' ? this.customTimes() : [],
        quietStart: this.quietStart(),
        quietEnd: this.quietEnd(),
        pausedOn: null,
      });
      this.sync.schedule();
      if (pushFailed) {
        this.warned = true;
        this.error.set(
          'Não deu para ativar as notificações agora. Você pode tentar de novo no Perfil, em Meus lembretes.',
        );
        return;
      }
      if (status === 'denied' || status === 'default') {
        this.warned = true;
        if (status === 'default')
          this.error.set(
            'Para receber os lembretes, permita as notificações quando o celular perguntar.',
          );
        return;
      }
      await this.router.navigateByUrl('/inicio');
    } finally {
      this.busy.set(false);
    }
  }

  protected async skip(): Promise<void> {
    await this.router.navigateByUrl('/inicio');
  }
}
