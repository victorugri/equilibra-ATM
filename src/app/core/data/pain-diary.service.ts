import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE, PainEntry } from './app-database';
import { dayKey } from './day';

/** Diário da dor guardado no aparelho. */
@Service()
export class PainDiary {
  private readonly db = inject(APP_DATABASE);
  private readonly list = signal<readonly PainEntry[]>([]);

  /** Registros do mais antigo para o mais novo. */
  readonly entries = this.list.asReadonly();
  readonly loaded = signal(false);
  /** Resolve quando os registros guardados foram lidos. */
  readonly ready: Promise<void> = this.load();

  readonly last = computed(() => this.list().at(-1) ?? null);
  readonly hasEntryToday = computed(() => {
    const today = dayKey(new Date());
    return this.list().some((entry) => dayKey(entry.at) === today);
  });

  async add(entry: Omit<PainEntry, 'id' | 'at'>, at = new Date()): Promise<PainEntry> {
    if (!Number.isInteger(entry.pain) || entry.pain < 0 || entry.pain > 10) {
      throw new RangeError('A dor deve ser um número inteiro de 0 a 10.');
    }
    const saved: PainEntry = { ...entry, note: entry.note.trim(), at };
    saved.id = await this.db.pain.add(saved);
    this.list.update((list) => [...list, saved]);
    return saved;
  }

  private async load(): Promise<void> {
    const entries = await this.db.pain.orderBy('at').toArray();
    this.list.set(entries);
    this.loaded.set(true);
  }
}
