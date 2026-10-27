import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from '../auth/auth.service';
import { APP_DATABASE, AppDatabase } from '../data/app-database';
import {
  Prescription,
  PrescriptionError,
  PrescriptionStore,
  isActive,
  isValidCode,
  normalizeCode,
} from './prescription.service';

const PRESCRIPTION: Prescription = {
  code: 'ABC234',
  active: true,
  exercises: ['EX-R1', 'EX-02'],
  sessionsPerDay: 2,
  remindersPerDay: 4,
  note: 'Devagar, sem dor.',
  validUntil: null,
  dentistName: 'Dra. Ana',
};

type RpcResult = { data: unknown; error: { code: string } | null };

let counter = 0;

/** Supabase de mentira: responde as funções do banco com o que o teste mandar. */
function setup(answer: (fn: string, args?: Record<string, string>) => RpcResult) {
  const db = new AppDatabase(`prescricao-${++counter}`);
  const calls: string[] = [];
  const user = signal<AuthUser | null>(null);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: APP_DATABASE, useValue: db },
      {
        provide: AuthService,
        useValue: {
          available: true,
          user,
          client: async () => ({
            rpc: async (fn: string, args?: Record<string, string>) => {
              calls.push(`${fn}(${args?.['p_code'] ?? ''})`);
              return answer(fn, args);
            },
          }),
        },
      },
    ],
  });
  return { db, calls, user, store: TestBed.inject(PrescriptionStore) };
}

describe('PrescriptionStore', () => {
  it('código: maiúsculo, sem espaço nem traço, sem letras que se confundem', () => {
    expect(normalizeCode(' abc-234 ')).toBe('ABC234');
    expect(isValidCode('abc 234')).toBe(true);
    expect(isValidCode('ABC1O4')).toBe(false);
    expect(isValidCode('ABC23')).toBe(false);
  });

  it('validade conferida no aparelho (funciona off-line)', () => {
    const today = new Date(2026, 9, 27);
    expect(isActive(PRESCRIPTION, today)).toBe(true);
    expect(isActive({ ...PRESCRIPTION, validUntil: '2026-10-27' }, today)).toBe(true);
    expect(isActive({ ...PRESCRIPTION, validUntil: '2026-10-26' }, today)).toBe(false);
    expect(isActive({ ...PRESCRIPTION, active: false }, today)).toBe(false);
    expect(isActive(null, today)).toBe(false);
  });

  it('resgata pelo código, guarda no aparelho e libera só os exercícios prescritos', async () => {
    const { db, store } = setup(() => ({ data: PRESCRIPTION, error: null }));
    await store.redeem('abc-234');
    expect(store.active()).toBe(true);
    expect(store.canSee('EX-R1')).toBe(true);
    expect(store.canSee('EX-R2')).toBe(false);
    expect((await db.meta.get('prescription'))?.value).toEqual(PRESCRIPTION);
  });

  it('código errado, encerrado ou tentativas demais viram motivos para a mensagem', async () => {
    const reason = async (answer: RpcResult, text = 'ABC234') => {
      const { store } = setup(() => answer);
      await store.ready;
      return store.redeem(text).then(
        () => 'ok',
        (error: PrescriptionError) => error.reason,
      );
    };
    expect(await reason({ data: null, error: null })).toBe('invalid');
    expect(await reason({ data: PRESCRIPTION, error: null }, 'ABC')).toBe('invalid');
    expect(await reason({ data: { ...PRESCRIPTION, active: false }, error: null })).toBe('ended');
    expect(await reason({ data: null, error: { code: 'P0429' } })).toBe('too-many');
    expect(await reason({ data: null, error: { code: 'PGRST202' } })).toBe('unavailable');
  });

  it('ao abrir on-line, acompanha a edição e o encerramento do dentista', async () => {
    let latest: Prescription | null = { ...PRESCRIPTION, sessionsPerDay: 3 };
    const { db, store } = setup(() => ({ data: latest, error: null }));
    await db.meta.put({ key: 'prescription', value: PRESCRIPTION });
    await store.reload();

    await store.refresh();
    expect(store.current()?.sessionsPerDay).toBe(3);

    latest = { ...PRESCRIPTION, active: false };
    await store.refresh();
    expect(store.active()).toBe(false);
    expect(store.ended()).toBe(true);
    expect(store.canSee('EX-R1')).toBe(false);
  });

  it('com erro de rede, fica com a cópia do aparelho', async () => {
    const { db, store } = setup(() => ({ data: null, error: { code: '08000' } }));
    await db.meta.put({ key: 'prescription', value: PRESCRIPTION });
    await store.reload();
    await store.refresh();
    expect(store.active()).toBe(true);
  });

  it('ao entrar na conta num aparelho novo, traz a prescrição dela', async () => {
    const { calls, user, store } = setup((fn) => ({
      data: fn === 'my_prescription' ? PRESCRIPTION : null,
      error: null,
    }));
    await store.refresh();
    expect(calls).toEqual([]);
    user.set({ id: 'paciente-1', email: 'p@exemplo.com' } as AuthUser);
    await store.refresh();
    expect(calls).toContain('my_prescription()');
    expect(store.current()?.code).toBe('ABC234');
  });
});
