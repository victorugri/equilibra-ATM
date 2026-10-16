import { InjectionToken } from '@angular/core';
import Dexie, { EntityTable, Table } from 'dexie';

/** Resposta rápida sim/não do diário; null = não respondeu. */
export type YesNo = 'yes' | 'no' | null;

/** Registro do diário da dor (versão enxuta, seção 6 do contexto). */
export interface PainEntry {
  id?: number;
  at: Date;
  /** Nota de 0 a 10 (DIA-01). */
  pain: number;
  exercises: YesNo;
  /** "Usei a placa": inclui "não uso" para quem não tem placa. */
  splint: YesNo | 'not-used';
  sleptWell: YesNo;
  /** Observação opcional de uma linha. */
  note: string;
}

/** Sessão concluída do Programa 6x6 (variável de adesão da pesquisa). */
export interface ExerciseSession {
  id?: number;
  at: Date;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

/**
 * Banco local do app (IndexedDB). Todos os dados de saúde ficam só neste aparelho até
 * existir conta e sincronização (fase 4).
 */
export class AppDatabase extends Dexie {
  pain!: EntityTable<PainEntry, 'id'>;
  sessions!: EntityTable<ExerciseSession, 'id'>;
  meta!: Table<MetaEntry, string>;

  constructor(name = 'equilibra-atm') {
    super(name);
    this.version(1).stores({
      pain: '++id, at',
      sessions: '++id, at',
      meta: '&key',
    });
  }
}

export const APP_DATABASE = new InjectionToken<AppDatabase>('APP_DATABASE', {
  factory: () => {
    const db = new AppDatabase();
    // Pede ao navegador para não apagar os dados quando faltar espaço (melhor esforço).
    void globalThis.navigator?.storage?.persist?.().catch(() => false);
    return db;
  },
});
