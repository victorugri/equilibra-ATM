import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE } from './app-database';
import { daysBetween } from './day';

const FIRST_USE_KEY = 'firstUse';

/** Uso do app: data do primeiro acesso, para o indicador "Dias se cuidando" (INI-01). */
@Service()
export class AppUsage {
  private readonly db = inject(APP_DATABASE);
  private readonly firstUse = signal<Date | null>(null);

  /** Resolve quando a data do primeiro acesso foi lida (ou gravada, no primeiro uso). */
  readonly ready: Promise<void> = this.load();

  /** Dias de uso desde o primeiro acesso, contando o dia de hoje (primeiro dia = 1). */
  readonly daysUsing = computed(() => {
    const first = this.firstUse();
    return first ? daysBetween(first, new Date()) + 1 : null;
  });

  private async load(): Promise<void> {
    const saved = await this.db.meta.get(FIRST_USE_KEY);
    if (saved?.value instanceof Date) {
      this.firstUse.set(saved.value);
      return;
    }
    const now = new Date();
    await this.db.meta.put({ key: FIRST_USE_KEY, value: now });
    this.firstUse.set(now);
  }
}
