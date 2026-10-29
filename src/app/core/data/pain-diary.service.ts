import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE, PainEntry, newUid } from './app-database';
import { dayKey } from './day';
import { latestPerDay } from './diary-stats';

/** Campos que a pessoa preenche no diário. */
export type PainEntryInput = Pick<
  PainEntry,
  'pain' | 'exercises' | 'splint' | 'sleptWell' | 'note'
>;

/**
 * Diário da dor guardado no aparelho (e enviado à conta, se houver). Um registro por dia:
 * atualizar o dia grava um registro novo, e vale o mais recente (ver `latestPerDay`).
 */
@Service()
export class PainDiary {
  private readonly db = inject(APP_DATABASE);
  private readonly list = signal<readonly PainEntry[]>([]);

  /** Tudo o que foi gravado, inclusive versões substituídas (exportação LGPD). */
  readonly history = this.list.asReadonly();
  /** O registro que vale de cada dia, do mais antigo para o mais novo. */
  readonly entries = computed(() => latestPerDay(this.list()));
  readonly loaded = signal(false);
  /** Resolve quando os registros guardados foram lidos. */
  readonly ready: Promise<void> = this.reload();

  readonly last = computed(() => this.entries().at(-1) ?? null);
  /** Registro de hoje, ou null. */
  readonly today = computed(() => {
    const last = this.last();
    return last && dayKey(last.at) === dayKey(new Date()) ? last : null;
  });
  readonly hasEntryToday = computed(() => this.today() !== null);

  /** Grava o registro do dia; se já houver um, este passa a valer no lugar dele. */
  async add(entry: PainEntryInput, at = new Date()): Promise<PainEntry> {
    if (!Number.isInteger(entry.pain) || entry.pain < 0 || entry.pain > 10) {
      throw new RangeError('A dor deve ser um número inteiro de 0 a 10.');
    }
    const saved: PainEntry = { ...entry, note: entry.note.trim(), at, uid: newUid(), dirty: 1 };
    saved.id = await this.db.pain.add(saved);
    this.list.update((list) => [...list, saved]);
    return saved;
  }

  /** Relê o banco local (ex.: depois de baixar registros da conta ou sair dela). */
  async reload(): Promise<void> {
    this.list.set(await this.db.pain.orderBy('at').toArray());
    this.loaded.set(true);
  }
}
