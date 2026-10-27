import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService, AuthUser } from '../auth/auth.service';
import { APP_DATABASE, AppDatabase } from '../data/app-database';
import { ExerciseSessions } from '../data/exercise-sessions.service';
import { PainDiary } from '../data/pain-diary.service';
import { ProfileStore } from '../data/profile.service';
import { CheckinStore } from '../reminders/checkins.service';
import { ReminderSettingsStore } from '../reminders/reminder-settings.service';
import { PAGE_SIZE, SyncService } from './sync.service';

type Row = Record<string, unknown>;
type Result = { data: unknown; error: unknown };

/** Servidor falso: as tabelas de uma única conta, com o limite de linhas do Supabase. */
class FakeServer {
  readonly tables: Record<string, Row[]> = {
    profiles: [],
    consents: [],
    pain_entries: [],
    exercise_sessions: [],
    reminder_settings: [],
    reminder_events: [],
  };
  failing = false;
  /** Tabelas que respondem erro (ex.: ainda não criadas no servidor). */
  readonly missing = new Set<string>();
  /** Roda antes de cada gravação (para simular o usuário mexendo durante o envio). */
  beforeWrite: ((table: string) => Promise<void>) | null = null;

  client(): SupabaseClient {
    return { from: (table: string) => new FakeQuery(this, table) } as unknown as SupabaseClient;
  }
}

/** Imita o encadeamento do supabase-js usado pelo SyncService. */
class FakeQuery implements PromiseLike<Result> {
  private payload: Row[] | null = null;
  private changes: Row | null = null;
  private filter: [string, unknown] | null = null;
  private ignoreDuplicates = false;
  private window: [number, number] | null = null;
  private single = false;

  constructor(
    private readonly server: FakeServer,
    private readonly table: string,
  ) {}

  select() {
    return this;
  }
  order() {
    return this;
  }
  range(from: number, to: number) {
    this.window = [from, to];
    return this;
  }
  maybeSingle() {
    this.single = true;
    return this;
  }
  update(changes: Row) {
    this.changes = changes;
    return this;
  }
  eq(column: string, value: unknown) {
    this.filter = [column, value];
    return this;
  }
  upsert(rows: Row | Row[], options?: { ignoreDuplicates?: boolean }) {
    this.payload = [rows].flat();
    this.ignoreDuplicates = !!options?.ignoreDuplicates;
    return this;
  }

  then<A = Result, B = never>(
    resolve?: ((value: Result) => A | PromiseLike<A>) | null,
    reject?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.execute().then(resolve, reject);
  }

  private async execute(): Promise<Result> {
    if (this.server.failing) return { data: null, error: new Error('sem conexão') };
    if (this.server.missing.has(this.table))
      return { data: null, error: new Error(`tabela ${this.table} não existe`) };
    if (this.payload || this.changes) await this.server.beforeWrite?.(this.table);
    const rows = this.server.tables[this.table];
    // reminder_settings tem uma linha por conta (chave user_id); as outras tabelas, id.
    const key = this.table === 'reminder_settings' ? 'user_id' : 'id';
    if (this.changes) {
      const [column, value] = this.filter!;
      for (const row of rows) if (row[column] === value) Object.assign(row, this.changes);
      return { data: null, error: null };
    }
    if (this.payload) {
      for (const row of this.payload) {
        const index = rows.findIndex((saved) => saved[key] === row[key]);
        if (index < 0) rows.push({ ...row });
        else if (!this.ignoreDuplicates) rows[index] = { ...rows[index], ...row };
      }
      return { data: null, error: null };
    }
    const sorted = [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
    if (this.single) return { data: sorted[0] ?? null, error: null };
    const [from, to] = this.window ?? [0, sorted.length - 1];
    return { data: sorted.slice(from, Math.min(to + 1, from + PAGE_SIZE)), error: null };
  }
}

const USER: AuthUser = { id: 'user-1', email: 'ana@teste.local', createdAt: null };
let counter = 0;

describe('SyncService', () => {
  let db: AppDatabase;
  let server: FakeServer;
  let user: ReturnType<typeof signal<AuthUser | null>>;

  function setup() {
    db = new AppDatabase(`sync-${++counter}`);
    server = new FakeServer();
    user = signal<AuthUser | null>(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_DATABASE, useValue: db },
        { provide: AuthService, useValue: { user, client: async () => server.client() } },
      ],
    });
    return TestBed.inject(SyncService);
  }

  async function addLocalData() {
    const profile = TestBed.inject(ProfileStore);
    await profile.ready;
    await profile.acceptConsent('PER-01', 'teste');
    await profile.saveProfile({ nickname: 'Ana', usesSplint: 'no' });
    await TestBed.inject(PainDiary).add({
      pain: 4,
      exercises: 'yes',
      splint: 'not-used',
      sleptWell: 'no',
      note: 'manhã',
    });
    await TestBed.inject(ExerciseSessions).record();
  }

  it('sem conta não envia nada', async () => {
    const sync = setup();
    await addLocalData();
    await sync.sync();
    expect(server.tables['pain_entries']).toHaveLength(0);
    expect(await db.pain.where('dirty').equals(1).count()).toBe(1);
  });

  it('com conta, envia o que está pendente e marca como enviado', async () => {
    const sync = setup();
    await addLocalData();
    user.set(USER);
    await sync.sync();

    expect(sync.status()).toBe('idle');
    expect(server.tables['profiles']).toEqual([
      expect.objectContaining({ id: USER.id, nickname: 'Ana', uses_splint: 'no' }),
    ]);
    expect(server.tables['consents']).toEqual([
      expect.objectContaining({ content_code: 'PER-01' }),
    ]);
    expect(server.tables['pain_entries']).toEqual([
      expect.objectContaining({ pain: 4, exercises: 'yes', splint: 'not-used', note: 'manhã' }),
    ]);
    expect(server.tables['exercise_sessions']).toHaveLength(1);

    const profile = TestBed.inject(ProfileStore);
    expect(profile.profile().dirty).toBe(0);
    expect(profile.consent()?.dirty).toBe(0);
    expect(await db.pain.where('dirty').equals(1).count()).toBe(0);
    expect(await db.sessions.where('dirty').equals(1).count()).toBe(0);
  });

  it('sincronizar de novo não duplica nada, nem no servidor nem no aparelho', async () => {
    const sync = setup();
    await addLocalData();
    user.set(USER);
    await sync.sync();
    await sync.sync();
    expect(server.tables['pain_entries']).toHaveLength(1);
    expect(server.tables['exercise_sessions']).toHaveLength(1);
    expect(await db.pain.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
  });

  it('num aparelho novo, traz o perfil e todos os registros da conta (mais de 1000)', async () => {
    const sync = setup();
    server.tables['profiles'].push({
      id: USER.id,
      nickname: 'Ana',
      uses_splint: 'yes',
      dentist_name: 'Dra. X',
      dentist_phone: null,
    });
    server.tables['pain_entries'].push({
      id: 'dor-1',
      recorded_at: '2026-10-01T10:00:00.000Z',
      pain: 6,
      exercises: 'no',
      splint: 'yes',
      slept_well: 'yes',
      note: '',
    });
    const total = PAGE_SIZE + 500;
    for (let i = 0; i < total; i++) {
      server.tables['exercise_sessions'].push({
        id: `sessao-${String(i).padStart(5, '0')}`,
        completed_at: new Date(2026, 4, 1, 8, i).toISOString(),
      });
    }

    user.set(USER);
    await sync.sync();

    const profile = TestBed.inject(ProfileStore);
    expect(profile.profile()).toMatchObject({ nickname: 'Ana', usesSplint: 'yes', dirty: 0 });
    expect(profile.profile().dentistName).toBe('Dra. X');
    expect(TestBed.inject(PainDiary).entries()).toEqual([
      expect.objectContaining({ uid: 'dor-1', pain: 6, dirty: 0 }),
    ]);
    expect(TestBed.inject(ExerciseSessions).all()).toHaveLength(total);
    expect(await db.sessions.where('dirty').equals(1).count()).toBe(0);
  });

  it('uma edição feita durante o envio não se perde', async () => {
    const sync = setup();
    await addLocalData();
    const profile = TestBed.inject(ProfileStore);
    server.beforeWrite = async (table) => {
      server.beforeWrite = null;
      if (table === 'profiles') await profile.saveProfile({ nickname: 'Ana Maria' });
    };
    user.set(USER);
    await sync.sync();
    await sync.sync();
    expect(server.tables['profiles'][0]['nickname']).toBe('Ana Maria');
    expect(profile.profile()).toMatchObject({ nickname: 'Ana Maria', dirty: 0 });
    expect(server.tables['consents']).toHaveLength(1);
  });

  it('envia as preferências de lembrete com os horários prontos para o agendador', async () => {
    const sync = setup();
    const reminders = TestBed.inject(ReminderSettingsStore);
    await reminders.ready;
    await reminders.save({ mode: 'three' });
    user.set(USER);
    await sync.sync();
    expect(server.tables['reminder_settings']).toEqual([
      expect.objectContaining({
        user_id: USER.id,
        mode: 'three',
        times: ['10:00', '15:00', '20:00'],
        quiet_start: '21:00',
        quiet_end: '08:00',
        exercise_reminders: true,
        timezone: expect.any(String),
      }),
    ]);
    expect(reminders.settings().dirty).toBe(0);
  });

  it('num aparelho novo, traz as preferências de lembrete da conta', async () => {
    const sync = setup();
    server.tables['reminder_settings'].push({
      user_id: USER.id,
      mode: 'custom',
      times: ['09:30:00', '17:30:00'],
      quiet_start: '23:00:00',
      quiet_end: '06:00:00',
      paused_on: null,
      exercise_reminders: false,
    });
    user.set(USER);
    await sync.sync();
    expect(TestBed.inject(ReminderSettingsStore).settings()).toMatchObject({
      mode: 'custom',
      customTimes: ['09:30', '17:30'],
      quietStart: '23:00',
      quietEnd: '06:00',
      exerciseReminders: false,
      dirty: 0,
    });
  });

  it('envia a resposta ao lembrete e não perde uma resposta dada durante o envio', async () => {
    const sync = setup();
    const eventId = '00000000-0000-4000-8000-000000000001';
    server.tables['reminder_events'].push({ id: eventId, answer: null });
    const checkins = TestBed.inject(CheckinStore);
    await checkins.open(eventId);
    server.beforeWrite = async (table) => {
      server.beforeWrite = null;
      if (table === 'reminder_events') await checkins.answer(eventId, 'touching');
    };
    user.set(USER);
    await sync.sync();
    await sync.sync();
    expect(server.tables['reminder_events'][0]).toMatchObject({
      answer: 'touching',
      opened_at: expect.any(String),
      answered_at: expect.any(String),
    });
    expect((await checkins.find(eventId))?.dirty).toBe(0);
  });

  it('uma tabela com erro não impede o resto de sincronizar', async () => {
    const sync = setup();
    await addLocalData();
    server.missing.add('reminder_settings');
    server.tables['exercise_sessions'].push({
      id: 'sessao-de-outro-aparelho',
      completed_at: '2026-10-01T10:00:00.000Z',
    });
    user.set(USER);
    await sync.sync();
    expect(sync.status()).toBe('error');
    expect(server.tables['pain_entries']).toHaveLength(1);
    expect(TestBed.inject(ExerciseSessions).all()).toHaveLength(2);
  });

  it('se o envio falhar, os dados continuam pendentes para a próxima vez', async () => {
    const sync = setup();
    await addLocalData();
    server.failing = true;
    user.set(USER);
    await sync.sync();
    expect(sync.status()).toBe('error');
    expect(await db.pain.where('dirty').equals(1).count()).toBe(1);

    server.failing = false;
    await sync.sync();
    expect(sync.status()).toBe('idle');
    expect(server.tables['pain_entries']).toHaveLength(1);
    expect(await db.pain.where('dirty').equals(1).count()).toBe(0);
  });
});
