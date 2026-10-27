import { Service, inject } from '@angular/core';
import { APP_DATABASE, Checkin } from '../data/app-database';
import { JawState } from './jaw-states';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Respostas aos lembretes (check-in rápido). Ficam primeiro no aparelho e vão para a conta
 * na sincronização; é daqui que sai a adesão aos lembretes da pesquisa.
 */
@Service()
export class CheckinStore {
  private readonly db = inject(APP_DATABASE);

  /** O id veio da notificação? (o check-in aberto de outro jeito não é registrado) */
  static isEventId(value: string | null | undefined): value is string {
    return !!value && UUID.test(value);
  }

  /** Registra que a pessoa abriu o check-in deste lembrete. */
  async open(eventId: string): Promise<Checkin> {
    const saved = await this.find(eventId);
    if (saved) return saved;
    const checkin: Checkin = {
      eventId,
      openedAt: new Date(),
      answer: null,
      answeredAt: null,
      skippedAt: null,
      dirty: 1,
    };
    checkin.id = await this.db.checkins.add(checkin);
    return checkin;
  }

  /** Primeira resposta vale (como no servidor). */
  async answer(eventId: string, answer: JawState): Promise<void> {
    await this.open(eventId);
    await this.db.checkins
      .where('eventId')
      .equals(eventId)
      .modify((checkin) => {
        if (checkin.answer) return;
        checkin.answer = answer;
        checkin.answeredAt = new Date();
        checkin.dirty = 1;
      });
  }

  async skip(eventId: string): Promise<void> {
    await this.open(eventId);
    await this.db.checkins
      .where('eventId')
      .equals(eventId)
      .modify((checkin) => {
        if (checkin.answer || checkin.skippedAt) return;
        checkin.skippedAt = new Date();
        checkin.dirty = 1;
      });
  }

  find(eventId: string): Promise<Checkin | undefined> {
    return this.db.checkins.where('eventId').equals(eventId).first();
  }

  all(): Promise<Checkin[]> {
    return this.db.checkins.orderBy('id').toArray();
  }
}
