import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE, ExerciseSession, newUid } from './app-database';
import { dayKey } from './day';

/** Chave usada na fase 2, quando as sessões ficavam no localStorage. */
const LEGACY_STORAGE_KEY = 'equilibra.sessoes-6x6';

/**
 * Sessões do Programa 6x6 feitas pela pessoa. A contagem diária (0–6) é variável de pesquisa
 * (adesão, metodologia módulo VI-d), então cada sessão é guardada com data e hora.
 */
@Service()
export class ExerciseSessions {
  private readonly db = inject(APP_DATABASE);
  private readonly list = signal<readonly ExerciseSession[]>([]);
  /** Muda à meia-noite via refresh(), para "hoje" ser recalculado. */
  private readonly todayKey = signal(dayKey(new Date()));

  readonly all = this.list.asReadonly();
  /** Resolve quando as sessões guardadas foram lidas. */
  readonly ready: Promise<void> = this.load();

  /** Sessões de hoje, da mais antiga para a mais nova. */
  readonly today = computed(() =>
    this.list().filter((session) => dayKey(session.at) === this.todayKey()),
  );

  /** Registra uma sessão concluída e devolve quantas foram feitas hoje. */
  async record(at = new Date()): Promise<number> {
    await this.ready;
    const session: ExerciseSession = { at, uid: newUid(), dirty: 1 };
    session.id = await this.db.sessions.add(session);
    this.list.update((list) => [...list, session]);
    this.refresh();
    return this.today().length;
  }

  /** Atualiza o "hoje" (ex.: ao abrir a tela depois da meia-noite). */
  refresh(): void {
    this.todayKey.set(dayKey(new Date()));
  }

  /** Relê o banco local (ex.: depois de baixar sessões da conta ou sair dela). */
  async reload(): Promise<void> {
    this.list.set(await this.db.sessions.orderBy('at').toArray());
  }

  private async load(): Promise<void> {
    await this.migrateFromLocalStorage();
    await this.reload();
  }

  /** Leva para o IndexedDB as sessões guardadas no localStorage pela fase 2. */
  private async migrateFromLocalStorage(): Promise<void> {
    let raw: string | null = null;
    try {
      raw = globalThis.localStorage?.getItem(LEGACY_STORAGE_KEY) ?? null;
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const list: unknown = JSON.parse(raw);
      const sessions = (Array.isArray(list) ? list : [])
        .map((iso): ExerciseSession => ({ at: new Date(String(iso)), uid: newUid(), dirty: 1 }))
        .filter((session) => !isNaN(session.at.getTime()));
      if (sessions.length) await this.db.sessions.bulkAdd(sessions);
    } catch {
      // Dado antigo ilegível: não há o que migrar.
    }
    globalThis.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}
