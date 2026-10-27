import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE, Dirty } from '../data/app-database';
import { DEFAULT_QUIET_END, DEFAULT_QUIET_START, ReminderPlan, isoDate } from './reminder-schedule';

/** Preferências de lembrete guardadas no aparelho (e na conta, pela sincronização). */
export interface ReminderSettings extends ReminderPlan {
  dirty: Dirty;
}

const KEY = 'reminders';

export const DEFAULT_REMINDERS: ReminderSettings = {
  mode: 'off',
  customTimes: [],
  quietStart: DEFAULT_QUIET_START,
  quietEnd: DEFAULT_QUIET_END,
  pausedOn: null,
  exerciseReminders: true,
  dirty: 0,
};

/** Preferências de lembrete (Figma 7:2142). Lembretes exigem conta. */
@Service()
export class ReminderSettingsStore {
  private readonly db = inject(APP_DATABASE);

  readonly settings = signal<ReminderSettings>(DEFAULT_REMINDERS);
  readonly ready: Promise<void> = this.reload();
  readonly active = computed(() => this.settings().mode !== 'off');

  async save(changes: Partial<ReminderPlan>): Promise<void> {
    await this.put({ ...this.settings(), ...changes, dirty: 1 });
  }

  /** "Pausar por hoje": volta sozinho amanhã. */
  async pauseToday(paused: boolean): Promise<void> {
    await this.save({ pausedOn: paused ? isoDate(new Date()) : null });
  }

  /** Marca como enviado à conta, se não mudou enquanto era enviado. */
  async markSynced(sent: ReminderSettings): Promise<void> {
    if (this.settings() !== sent) return;
    await this.put({ ...sent, dirty: 0 });
  }

  /** Usa as preferências da conta (aparelho novo), se não houver mudança local pendente. */
  async applyRemote(remote: ReminderPlan): Promise<void> {
    if (this.settings().dirty) return;
    await this.put({ ...remote, dirty: 0 });
  }

  async reload(): Promise<void> {
    const saved = await this.db.meta.get(KEY);
    this.settings.set({
      ...DEFAULT_REMINDERS,
      ...(saved?.value as Partial<ReminderSettings> | undefined),
    });
  }

  private async put(settings: ReminderSettings): Promise<void> {
    await this.db.meta.put({ key: KEY, value: settings });
    this.settings.set(settings);
  }
}
