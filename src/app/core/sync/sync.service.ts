import { DestroyRef, Service, effect, inject, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { liveQuery } from 'dexie';
import { AuthService } from '../auth/auth.service';
import { APP_DATABASE } from '../data/app-database';
import { ExerciseSessions } from '../data/exercise-sessions.service';
import { PainDiary } from '../data/pain-diary.service';
import { ProfileStore } from '../data/profile.service';
import {
  PainRow,
  ProfileRow,
  SessionRow,
  consentToRow,
  painFromRow,
  painToRow,
  profileFromRow,
  profileToRow,
  sessionFromRow,
  sessionToRow,
} from './sync-mapping';

export type SyncStatus = 'idle' | 'syncing' | 'error';

/** Espera depois de uma mudança local antes de enviar (junta várias mudanças seguidas). */
const DEBOUNCE_MS = 1500;

/** Linhas por página na leitura: o limite padrão do Supabase (max_rows em config.toml). */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/** Lê todas as linhas de uma consulta, página por página. */
async function selectAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/**
 * Sincronização do aparelho com a conta. O aparelho é sempre a fonte: tudo é gravado
 * primeiro no IndexedDB, marcado como pendente (dirty = 1), e enviado quando houver conta
 * e internet. Na sincronização também chegam os registros feitos em outro aparelho.
 * Registros do diário e sessões não mudam depois de criados, então não há conflito.
 */
@Service()
export class SyncService {
  private readonly auth = inject(AuthService);
  private readonly db = inject(APP_DATABASE);
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);
  private readonly profile = inject(ProfileStore);

  readonly status = signal<SyncStatus>('idle');
  readonly lastSyncedAt = signal<Date | null>(null);
  /** Registros do diário e sessões ainda não enviados. */
  readonly pending = signal(0);

  private running: Promise<void> | null = null;
  private again = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Ao entrar (ou ao abrir o app com a sessão salva), sincroniza.
    effect(() => {
      if (this.auth.user()) void this.sync();
    });

    const pending = liveQuery(async () => {
      const [pain, sessions] = await Promise.all([
        this.db.pain.where('dirty').equals(1).count(),
        this.db.sessions.where('dirty').equals(1).count(),
      ]);
      return pain + sessions;
    }).subscribe((count) => {
      this.pending.set(count);
      if (count > 0) this.schedule();
    });

    const online = () => void this.sync();
    globalThis.addEventListener?.('online', online);
    inject(DestroyRef).onDestroy(() => {
      pending.unsubscribe();
      globalThis.removeEventListener?.('online', online);
      clearTimeout(this.timer);
    });
  }

  /** Pede uma sincronização em breve (ex.: depois de salvar o perfil). */
  schedule(): void {
    if (!this.auth.user()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), DEBOUNCE_MS);
  }

  /**
   * Sincroniza agora. Sem conta ou sem internet, não faz nada (os dados ficam pendentes).
   * Se já houver uma sincronização em andamento, faz mais uma rodada no fim; a Promise só
   * resolve depois da última.
   */
  sync(): Promise<void> {
    if (!this.auth.user() || (globalThis.navigator && !navigator.onLine)) {
      return Promise.resolve();
    }
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      try {
        do {
          this.again = false;
          await this.run();
        } while (this.again);
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  }

  private async run(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    this.status.set('syncing');
    try {
      const client = await this.auth.client();
      await this.syncProfile(client, user.id);
      await this.pushConsent(client);
      await this.pushPain(client);
      await this.pushSessions(client);
      await this.pull(client);
      this.status.set('idle');
      this.lastSyncedAt.set(new Date());
    } catch (error) {
      console.error('Falha na sincronização', error);
      this.status.set('error');
    }
  }

  /** Perfil: o do aparelho vale se foi mudado; senão, usa o da conta (aparelho novo). */
  private async syncProfile(client: SupabaseClient, userId: string): Promise<void> {
    await this.profile.ready;
    const local = this.profile.profile();
    if (local.dirty) {
      const { error } = await client.from('profiles').upsert(profileToRow(userId, local));
      if (error) throw error;
      await this.profile.markProfileSynced(local);
      return;
    }
    const { data, error } = await client
      .from('profiles')
      .select('id, nickname, uses_splint, dentist_name, dentist_phone')
      .maybeSingle();
    if (error) throw error;
    if (data) await this.profile.applyRemoteProfile(profileFromRow(data as ProfileRow));
  }

  private async pushConsent(client: SupabaseClient): Promise<void> {
    const consent = this.profile.consent();
    if (!consent?.dirty) return;
    const { error } = await client
      .from('consents')
      .upsert(consentToRow(consent), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    await this.profile.markConsentSynced(consent);
  }

  private async pushPain(client: SupabaseClient): Promise<void> {
    const entries = await this.db.pain.where('dirty').equals(1).toArray();
    if (!entries.length) return;
    const { error } = await client
      .from('pain_entries')
      .upsert(entries.map(painToRow), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    await this.db.pain
      .where('uid')
      .anyOf(entries.map((entry) => entry.uid))
      .modify({ dirty: 0 });
  }

  private async pushSessions(client: SupabaseClient): Promise<void> {
    const sessions = await this.db.sessions.where('dirty').equals(1).toArray();
    if (!sessions.length) return;
    const { error } = await client
      .from('exercise_sessions')
      .upsert(sessions.map(sessionToRow), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    await this.db.sessions
      .where('uid')
      .anyOf(sessions.map((session) => session.uid))
      .modify({ dirty: 0 });
  }

  /** Traz os registros da conta que ainda não estão neste aparelho. */
  private async pull(client: SupabaseClient): Promise<void> {
    const [pain, sessions] = await Promise.all([
      selectAll<PainRow>((from, to) =>
        client
          .from('pain_entries')
          .select('id, recorded_at, pain, exercises, splint, slept_well, note')
          .order('id')
          .range(from, to),
      ),
      selectAll<SessionRow>((from, to) =>
        client.from('exercise_sessions').select('id, completed_at').order('id').range(from, to),
      ),
    ]);

    const localPain = new Set(await this.db.pain.orderBy('uid').keys());
    const localSessions = new Set(await this.db.sessions.orderBy('uid').keys());
    const newPain = pain.filter((row) => !localPain.has(row.id)).map(painFromRow);
    const newSessions = sessions.filter((row) => !localSessions.has(row.id)).map(sessionFromRow);

    if (newPain.length) {
      await this.db.pain.bulkAdd(newPain);
      await this.diary.reload();
    }
    if (newSessions.length) {
      await this.db.sessions.bulkAdd(newSessions);
      await this.sessions.reload();
    }
  }
}
