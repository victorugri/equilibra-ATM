import {
  DEFAULT_QUIET_END,
  DEFAULT_QUIET_START,
  MAX_DAILY_REMINDERS,
  ReminderPlan,
  activeTimes,
  inQuietHours,
  isoDate,
  nextReminder,
  planForCount,
  quietHoursLength,
  spreadTimes,
  timesFor,
} from './reminder-schedule';

const plan = (changes: Partial<ReminderPlan> = {}): ReminderPlan => ({
  mode: 'three',
  customTimes: [],
  quietStart: '22:00',
  quietEnd: '07:00',
  pausedOn: null,
  exerciseReminders: true,
  ...changes,
});

describe('horários dos lembretes', () => {
  it('cada opção tem os seus horários (personalizados em ordem e sem repetir)', () => {
    expect(timesFor('three', [])).toEqual(['10:00', '15:00', '20:00']);
    expect(timesFor('custom', ['17:30', '09:30', '17:30'])).toEqual(['09:30', '17:30']);
    expect(timesFor('off', ['09:00'])).toEqual([]);
  });

  it('nunca passa de 6 lembretes por dia', () => {
    const many = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    expect(timesFor('custom', many)).toEqual(many.slice(0, MAX_DAILY_REMINDERS));
    expect(MAX_DAILY_REMINDERS).toBe(6);
  });

  it('padrão conservador: silêncio das 21h às 8h deixa os 3 horários tocarem', () => {
    const quiet = { quietStart: DEFAULT_QUIET_START, quietEnd: DEFAULT_QUIET_END };
    expect(quiet).toEqual({ quietStart: '21:00', quietEnd: '08:00' });
    expect(activeTimes(plan(quiet))).toEqual(['10:00', '15:00', '20:00']);
  });

  it('silêncio que passa da meia-noite', () => {
    expect(inQuietHours('23:00', '22:00', '07:00')).toBe(true);
    expect(inQuietHours('06:59', '22:00', '07:00')).toBe(true);
    expect(inQuietHours('07:00', '22:00', '07:00')).toBe(false);
    expect(inQuietHours('13:00', '12:00', '14:00')).toBe(true);
    expect(inQuietHours('13:00', '10:00', '10:00')).toBe(false);
    expect(quietHoursLength('22:00', '07:00')).toBe(9);
  });

  it('horários no silêncio não tocam', () => {
    expect(activeTimes(plan({ mode: 'custom', customTimes: ['06:00', '12:00', '23:30'] }))).toEqual(
      ['12:00'],
    );
  });

  it('próximo lembrete: ainda hoje, amanhã cedo, ou depois da pausa', () => {
    const morning = new Date(2026, 9, 17, 10, 0);
    expect(nextReminder(plan(), morning)).toEqual(new Date(2026, 9, 17, 15, 0));
    const night = new Date(2026, 9, 17, 21, 0);
    expect(nextReminder(plan(), night)).toEqual(new Date(2026, 9, 18, 10, 0));
    const paused = plan({ pausedOn: isoDate(morning) });
    expect(nextReminder(paused, morning)).toEqual(new Date(2026, 9, 18, 10, 0));
    expect(nextReminder(plan({ mode: 'off' }), morning)).toBeNull();
  });

  it('lembretes sugeridos pelo dentista: horários espalhados das 10h às 20h', () => {
    expect(spreadTimes(0)).toEqual([]);
    expect(spreadTimes(1)).toEqual(['15:00']);
    expect(spreadTimes(2)).toEqual(['10:00', '20:00']);
    expect(spreadTimes(4)).toEqual(['10:00', '13:30', '16:30', '20:00']);
    expect(spreadTimes(9)).toHaveLength(6);
    expect(planForCount(0)).toEqual({ mode: 'off', customTimes: [] });
    expect(planForCount(3)).toEqual({ mode: 'three', customTimes: [] });
    expect(planForCount(5)).toEqual({ mode: 'custom', customTimes: spreadTimes(5) });
  });

  it('data local no formato do banco', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
