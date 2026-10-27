import { DestroyRef, Service, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { APP_DATABASE } from '../data/app-database';
import { isoDate } from '../reminders/reminder-schedule';

/** Exercícios liberados pelo dentista (supabase/migrations/20261027120000_prescricoes.sql). */
export interface Prescription {
  code: string;
  /** false quando o dentista encerrou ou venceu (os exercícios saem do app). */
  active: boolean;
  /** Códigos do banco de conteúdo (ex.: EX-R1). */
  exercises: readonly string[];
  sessionsPerDay: number;
  remindersPerDay: number;
  note: string | null;
  /** "AAAA-MM-DD" ou null. */
  validUntil: string | null;
  dentistName: string | null;
}

/** offline: sem internet; unavailable: o servidor não respondeu como esperado. */
export type PrescriptionErrorReason = 'invalid' | 'ended' | 'too-many' | 'offline' | 'unavailable';

export class PrescriptionError extends Error {
  constructor(readonly reason: PrescriptionErrorReason) {
    super(reason);
  }
}

const KEY = 'prescription';
/** Código da prescrição cuja sugestão de lembretes (LEM-P01) já foi respondida. */
const REMINDERS_KEY = 'prescription-reminders';
/** Sem letras ou números que se confundem (como o código gerado no banco). */
const CODE = /^[A-HJKMNP-Z2-9]{6}$/;

/** Deixa o código como o banco espera: maiúsculo, sem espaço nem traço. */
export function normalizeCode(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidCode(text: string): boolean {
  return CODE.test(normalizeCode(text));
}

/** Ativa e dentro da validade (conferida também no aparelho, para funcionar off-line). */
export function isActive(prescription: Prescription | null, today: Date): boolean {
  if (!prescription?.active) return false;
  return !prescription.validUntil || prescription.validUntil >= isoDate(today);
}

/**
 * Prescrição do dentista, guardada no aparelho (com ou sem conta). Resgatada pelo código e
 * atualizada ao abrir o app on-line: se o dentista editou ou encerrou, o app acompanha.
 */
@Service()
export class PrescriptionStore {
  private readonly db = inject(APP_DATABASE);
  private readonly auth = inject(AuthService);

  readonly current = signal<Prescription | null>(null);
  readonly remindersAnsweredFor = signal<string | null>(null);
  readonly ready: Promise<void> = this.reload();

  readonly active = computed(() => isActive(this.current(), new Date()));
  /** Havia prescrição, mas o dentista encerrou (ou venceu): aviso EX-P07. */
  readonly ended = computed(() => !!this.current() && !this.active());
  readonly allowed = computed(
    () => new Set(this.active() ? (this.current()?.exercises ?? []) : []),
  );

  constructor() {
    // Ao abrir o app, ao entrar na conta e ao voltar a internet.
    effect(() => {
      this.auth.user();
      untracked(() => void this.refresh());
    });
    const online = () => void this.refresh();
    globalThis.addEventListener?.('online', online);
    inject(DestroyRef).onDestroy(() => globalThis.removeEventListener?.('online', online));
  }

  canSee(code: string): boolean {
    return this.allowed().has(code);
  }

  /** Resgata pelo código digitado. Erros: PrescriptionError (motivo para a mensagem). */
  async redeem(text: string): Promise<Prescription> {
    const code = normalizeCode(text);
    if (!CODE.test(code)) throw new PrescriptionError('invalid');
    if (!this.auth.available) throw new PrescriptionError('unavailable');
    if (globalThis.navigator && !navigator.onLine) throw new PrescriptionError('offline');
    const prescription = await this.call('redeem_prescription', { p_code: code });
    if (!prescription) throw new PrescriptionError('invalid');
    if (!isActive(prescription, new Date())) throw new PrescriptionError('ended');
    await this.put(prescription);
    return prescription;
  }

  /** Atualiza a cópia do aparelho. Sem internet ou com erro, mantém o que tem. */
  async refresh(): Promise<void> {
    await this.ready;
    if (!this.auth.available || (globalThis.navigator && !navigator.onLine)) return;
    try {
      const saved = this.current();
      if (saved) {
        const latest = await this.call('redeem_prescription', { p_code: saved.code });
        // Código apagado do banco: é como se o dentista tivesse encerrado.
        await this.put(latest ?? { ...saved, active: false });
      } else if (this.auth.user()) {
        const mine = await this.call('my_prescription');
        if (mine) await this.put(mine);
      }
    } catch {
      // Fica com a cópia local; tenta de novo na próxima abertura.
    }
  }

  /** Tira a prescrição do aparelho (ex.: depois do aviso de encerrada). */
  /** "Seu dentista sugeriu {n} lembretes por dia. Usar?" respondida (sim ou não). */
  async answerReminders(code: string): Promise<void> {
    await this.db.meta.put({ key: REMINDERS_KEY, value: code });
    this.remindersAnsweredFor.set(code);
  }

  async remove(): Promise<void> {
    await this.db.meta.delete(KEY);
    this.current.set(null);
  }

  async reload(): Promise<void> {
    const [saved, answered] = await this.db.meta.bulkGet([KEY, REMINDERS_KEY]);
    this.current.set((saved?.value as Prescription | undefined) ?? null);
    this.remindersAnsweredFor.set((answered?.value as string | undefined) ?? null);
  }

  private async call(
    fn: 'redeem_prescription' | 'my_prescription',
    args?: Record<string, string>,
  ): Promise<Prescription | null> {
    const client = await this.auth.client();
    const { data, error } = await client.rpc(fn, args);
    if (error) {
      throw new PrescriptionError(error.code === 'P0429' ? 'too-many' : 'unavailable');
    }
    return (data as Prescription | null) ?? null;
  }

  private async put(prescription: Prescription): Promise<void> {
    await this.db.meta.put({ key: KEY, value: prescription });
    this.current.set(prescription);
  }
}
