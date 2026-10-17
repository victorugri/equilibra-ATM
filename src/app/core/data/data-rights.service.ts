import { Service, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SyncService } from '../sync/sync.service';
import { APP_DATABASE } from './app-database';
import { AppUsage } from './app-usage.service';
import { ExerciseSessions } from './exercise-sessions.service';
import { PainDiary } from './pain-diary.service';
import { ProfileStore } from './profile.service';

/** Erro de quem tenta sair da conta com registros ainda não enviados. */
export class PendingDataError extends Error {
  constructor() {
    super('Há registros que ainda não foram enviados para a sua conta.');
  }
}

/**
 * Direitos do titular (LGPD, art. 18): ver, baixar e apagar os próprios dados, e sair da
 * conta sem perder nada.
 */
@Service()
export class DataRights {
  private readonly db = inject(APP_DATABASE);
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);
  private readonly profile = inject(ProfileStore);
  private readonly usage = inject(AppUsage);

  /** Arquivo JSON com tudo o que o app guarda sobre a pessoa. */
  async exportJson(): Promise<Blob> {
    await Promise.all([this.diary.ready, this.sessions.ready, this.profile.ready]);
    const { dirty: _profileDirty, ...profile } = this.profile.profile();
    const consent = this.profile.consent();
    const data = {
      app: 'Equilibra ATM',
      exportedAt: new Date().toISOString(),
      account: this.auth.user()?.email ?? null,
      profile,
      consent: consent && {
        contentCode: consent.contentCode,
        contentVersion: consent.contentVersion,
        acceptedAt: consent.acceptedAt,
      },
      painEntries: this.diary
        .entries()
        .map(({ uid, at, pain, exercises, splint, sleptWell, note }) => ({
          id: uid,
          at,
          pain,
          exercises,
          splint,
          sleptWell,
          note,
        })),
      exerciseSessions: this.sessions.all().map(({ uid, at }) => ({ id: uid, at })),
    };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  /**
   * Sai da conta. Os dados ficam guardados na conta e são apagados deste aparelho (assim
   * outra pessoa que entre neste aparelho não vê nada). Só sai com tudo enviado.
   */
  async signOut(): Promise<void> {
    await this.sync.sync();
    if (this.sync.pending() > 0 || this.profile.profile().dirty) throw new PendingDataError();
    await this.auth.signOut();
    await this.clearDevice({ everything: false });
  }

  /** Apaga a conta (com todos os dados no servidor) e os dados deste aparelho. */
  async deleteAccount(): Promise<void> {
    await this.auth.deleteAccount();
    await this.clearDevice({ everything: true });
  }

  /** Sem conta: apaga os dados deste aparelho. */
  async deleteLocalData(): Promise<void> {
    await this.clearDevice({ everything: true });
  }

  private async clearDevice(options: { everything: boolean }): Promise<void> {
    await this.db.clearPersonalData(options);
    await Promise.all([this.diary.reload(), this.sessions.reload(), this.profile.reload()]);
    if (options.everything) await this.usage.reload();
  }
}
