import { InjectionToken } from '@angular/core';
import Dexie, { EntityTable, Table } from 'dexie';
import type { JawState } from '../reminders/jaw-states';

/** Resposta rápida sim/não do diário; null = não respondeu. */
export type YesNo = 'yes' | 'no' | null;

/** 1 = ainda não enviado para a conta; 0 = já está no servidor (ou não há conta). */
export type Dirty = 0 | 1;

/** Registro do diário da dor (versão enxuta, seção 6 do contexto). */
export interface PainEntry {
  id?: number;
  /** Identificador universal: o mesmo no aparelho e no servidor. */
  uid: string;
  at: Date;
  /** Nota de 0 a 10 (DIA-01). */
  pain: number;
  exercises: YesNo;
  /** "Usei a placa": inclui "não uso" para quem não tem placa. */
  splint: YesNo | 'not-used';
  sleptWell: YesNo;
  /** Observação opcional de uma linha. */
  note: string;
  dirty: Dirty;
}

/** Sessão concluída do Programa 6x6 (variável de adesão da pesquisa). */
export interface ExerciseSession {
  id?: number;
  uid: string;
  at: Date;
  dirty: Dirty;
}

/**
 * Resposta a um lembrete (check-in rápido, Figma 7:2020). O lembrete é criado no servidor;
 * aqui fica o que a pessoa fez com ele, até ser enviado.
 */
export interface Checkin {
  id?: number;
  /** Id do lembrete no servidor (reminder_events.id). */
  eventId: string;
  openedAt: Date | null;
  answer: JawState | null;
  answeredAt: Date | null;
  skippedAt: Date | null;
  dirty: Dirty;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

/**
 * Banco local do app (IndexedDB). Sem conta, os dados ficam só neste aparelho; com conta,
 * o aparelho continua sendo a fonte e os registros novos são enviados ao servidor.
 */
export class AppDatabase extends Dexie {
  pain!: EntityTable<PainEntry, 'id'>;
  sessions!: EntityTable<ExerciseSession, 'id'>;
  checkins!: EntityTable<Checkin, 'id'>;
  meta!: Table<MetaEntry, string>;

  constructor(name = 'equilibra-atm') {
    super(name);
    this.version(1).stores({
      pain: '++id, at',
      sessions: '++id, at',
      meta: '&key',
    });
    // Fase 4: id universal (uid) e marca de envio pendente (dirty) para a sincronização.
    this.version(2)
      .stores({
        pain: '++id, at, &uid, dirty',
        sessions: '++id, at, &uid, dirty',
        meta: '&key',
      })
      .upgrade(async (tx) => {
        const addSyncFields = (record: { uid?: string; dirty?: Dirty }) => {
          record.uid ??= newUid();
          record.dirty = 1;
        };
        await tx.table('pain').toCollection().modify(addSyncFields);
        await tx.table('sessions').toCollection().modify(addSyncFields);
      });
    // Fase 5: respostas aos lembretes.
    this.version(3).stores({ checkins: '++id, &eventId, dirty' });
  }

  /**
   * Apaga do aparelho os dados de saúde e o perfil. Com `everything`, apaga também o
   * consentimento, a entrada no app e a data do primeiro acesso (o app volta ao início).
   */
  async clearPersonalData({ everything = false } = {}): Promise<void> {
    await this.transaction('rw', this.pain, this.sessions, this.checkins, this.meta, async () => {
      await this.pain.clear();
      await this.sessions.clear();
      await this.checkins.clear();
      await this.meta.bulkDelete(everything ? [...PROFILE_KEYS, ...DEVICE_KEYS] : PROFILE_KEYS);
    });
  }
}

/** Dados da pessoa no meta: apagados ao sair da conta (continuam guardados nela). */
const PROFILE_KEYS = ['profile', 'reminders', 'care', 'prescription', 'prescription-reminders'];
/** Dados do uso do app neste aparelho: apagados só quando a pessoa apaga tudo. */
const DEVICE_KEYS = ['consent', 'onboarding', 'firstUse'];

export function newUid(): string {
  return crypto.randomUUID();
}

export const APP_DATABASE = new InjectionToken<AppDatabase>('APP_DATABASE', {
  factory: () => {
    const db = new AppDatabase();
    // Pede ao navegador para não apagar os dados quando faltar espaço (melhor esforço).
    void globalThis.navigator?.storage?.persist?.().catch(() => false);
    return db;
  },
});
