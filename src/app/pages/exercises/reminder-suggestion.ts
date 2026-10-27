import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ContentService } from '../../core/content/content.service';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { activeTimes, planForCount } from '../../core/reminders/reminder-schedule';
import { ReminderSettingsStore } from '../../core/reminders/reminder-settings.service';
import { SyncService } from '../../core/sync/sync.service';

const SUGGESTION = 'LEM-P01';

/**
 * "Seu dentista sugeriu {n} lembretes por dia. Usar?" (seção 5). Só para quem já tem lembretes
 * ligados e um número diferente do sugerido; a escolha é sempre do paciente.
 */
@Component({
  selector: 'app-reminder-suggestion',
  template: `
    @if (suggested(); as n) {
      <section class="suggestion" aria-labelledby="suggestion-text">
        <p id="suggestion-text">{{ text() }}</p>
        <div class="actions">
          <button type="button" class="btn-primary" (click)="accept(n)">Usar</button>
          <button type="button" class="btn-outline" (click)="decline()">Agora não</button>
        </div>
      </section>
    }
  `,
  styles: `
    .suggestion {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-page);
      border-radius: var(--radius-sm);
      background: var(--color-surface-light);

      p {
        color: var(--color-text);
        font-size: var(--text-body-lg);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-body);
      }
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
  `,
})
export class ReminderSuggestion {
  private readonly content = inject(ContentService);
  private readonly prescription = inject(PrescriptionStore);
  private readonly reminders = inject(ReminderSettingsStore);
  private readonly signedIn = inject(AuthService).signedIn;
  private readonly sync = inject(SyncService);

  /** Número sugerido, quando faz sentido perguntar; senão null. */
  protected readonly suggested = computed(() => {
    const current = this.prescription.active() ? this.prescription.current() : null;
    const settings = this.reminders.settings();
    if (!current || !this.signedIn() || settings.mode === 'off') return null;
    if (this.prescription.remindersAnsweredFor() === current.code) return null;
    const n = current.remindersPerDay;
    return activeTimes(settings).length === n ? null : n;
  });

  protected readonly text = computed(() =>
    this.content.get(SUGGESTION, 'text', { n: this.suggested() ?? 0 }),
  );

  protected async accept(n: number): Promise<void> {
    await this.reminders.save({ ...planForCount(n), pausedOn: null });
    this.sync.schedule();
    await this.answer();
  }

  protected async decline(): Promise<void> {
    await this.answer();
  }

  private async answer(): Promise<void> {
    const code = this.prescription.current()?.code;
    if (code) await this.prescription.answerReminders(code);
  }
}
