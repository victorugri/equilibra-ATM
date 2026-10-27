import { Service, inject, signal } from '@angular/core';
import { APP_DATABASE } from './app-database';
import { dayKey } from './day';

/**
 * O que a pessoa fez no "Cuidado do dia" do Plano de hoje: compressa, módulos lidos e dica.
 * Datas em `dayKey` (dia local). Fica só neste aparelho; não é registro do diário.
 */
export interface CareLogData {
  /** Dia em que a compressa chegou ao fim do timer. */
  compressOn: string | null;
  /** Dia em que a dica (ou o "Faça agora") foi marcada como feita. */
  tipOn: string | null;
  /** Número do módulo → último dia em que foi aberto. */
  modulesRead: Readonly<Record<number, string>>;
}

export const EMPTY_CARE_LOG: CareLogData = { compressOn: null, tipOn: null, modulesRead: {} };

export const CARE_LOG_KEY = 'care';

@Service()
export class CareLog {
  private readonly db = inject(APP_DATABASE);

  readonly data = signal<CareLogData>(EMPTY_CARE_LOG);
  readonly ready: Promise<void> = this.reload();

  async markCompress(at = new Date()): Promise<void> {
    await this.save({ compressOn: dayKey(at) });
  }

  async markTip(at = new Date()): Promise<void> {
    await this.save({ tipOn: dayKey(at) });
  }

  async markModuleRead(n: number, at = new Date()): Promise<void> {
    await this.save({ modulesRead: { ...this.data().modulesRead, [n]: dayKey(at) } });
  }

  async reload(): Promise<void> {
    const saved = await this.db.meta.get(CARE_LOG_KEY);
    this.data.set({ ...EMPTY_CARE_LOG, ...(saved?.value as Partial<CareLogData> | undefined) });
  }

  private async save(changes: Partial<CareLogData>): Promise<void> {
    await this.ready;
    const data: CareLogData = { ...this.data(), ...changes };
    await this.db.meta.put({ key: CARE_LOG_KEY, value: data });
    this.data.set(data);
  }
}
