import { CareLogData, EMPTY_CARE_LOG } from '../data/care-log.service';
import { dayKey } from '../data/day';
import { TIP_ROTATION, dailyPlan, dayOfYear, nextModule } from './daily-plan';

// 27/10/2026 é terça; 26/10/2026, segunda.
const tuesday = new Date(2026, 9, 27, 9, 0);
const monday = new Date(2026, 9, 26, 9, 0);

const plan = (today: Date, painToday: number | null, care: Partial<CareLogData> = {}) =>
  dailyPlan({
    today,
    painToday,
    care: { ...EMPTY_CARE_LOG, ...care },
    moduleCount: 6,
    sessionsGoal: null,
    sessionsToday: 0,
  });

describe('Plano de hoje', () => {
  it('nunca passa de 3 itens e sempre começa pela dor', () => {
    for (const today of [monday, tuesday]) {
      for (const pain of [null, 0, 5]) {
        const items = plan(today, pain);
        expect(items.length).toBeLessThanOrEqual(3);
        expect(items[0]).toMatchObject({ kind: 'pain', route: '/diario', done: pain !== null });
      }
    }
  });

  it('com qualquer dor registrada hoje, sugere a compressa (e marca quando o timer termina)', () => {
    expect(plan(tuesday, 1)[1]).toMatchObject({
      kind: 'compress',
      route: '/sos',
      query: { passo: 3 },
      done: false,
    });
    expect(plan(monday, 7)[1].kind).toBe('compress');
    expect(plan(tuesday, 1, { compressOn: dayKey(tuesday) })[1].done).toBe(true);
    // Dor 0 não pede compressa.
    expect(plan(tuesday, 0)[1].kind).toBe('tip');
  });

  it('às segundas, o próximo módulo; o lido hoje fica marcado como feito', () => {
    expect(plan(monday, null)[1]).toMatchObject({
      kind: 'module',
      module: 1,
      route: '/aprender/modulo/1',
      done: false,
    });
    const readBefore = { modulesRead: { 1: '2026-10-19', 2: '2026-10-19' } };
    expect(plan(monday, null, readBefore)[1].module).toBe(3);
    const readToday = { modulesRead: { 1: '2026-10-19', 2: dayKey(monday) } };
    expect(plan(monday, null, readToday)[1]).toMatchObject({ module: 2, done: true });
  });

  it('com todos os módulos lidos, a segunda volta ao rodízio', () => {
    const all = Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [n, '2026-10-01']));
    expect(plan(monday, null, { modulesRead: all })[1].kind).toBe('tip');
    expect(nextModule({ ...EMPTY_CARE_LOG, modulesRead: all }, 6)).toBeNull();
  });

  it('nos outros dias, rodízio fixo pelo dia do ano', () => {
    const today = plan(tuesday, null)[1];
    const tomorrow = plan(new Date(2026, 9, 28), null)[1];
    expect(today.kind).toBe('tip');
    expect(today.route).toBeNull();
    expect(TIP_ROTATION).toContain(today.code);
    expect(tomorrow.code).not.toBe(today.code);
    expect(plan(tuesday, null, { tipOn: dayKey(tuesday) })[1].done).toBe(true);
    expect(plan(tuesday, null, { tipOn: '2026-10-26' })[1].done).toBe(false);
  });

  it('com prescrição, as sessões do dia entram como item 2 (meta da prescrição)', () => {
    const base = { today: tuesday, painToday: 4, care: EMPTY_CARE_LOG, moduleCount: 6 };
    const items = dailyPlan({ ...base, sessionsGoal: 2, sessionsToday: 1 });
    expect(items.map((item) => item.kind)).toEqual(['pain', 'exercises', 'compress']);
    expect(items[1]).toMatchObject({
      route: '/exercicios',
      progress: { done: 1, goal: 2 },
      done: false,
    });
    const extra = dailyPlan({ ...base, sessionsGoal: 2, sessionsToday: 5 })[1];
    expect(extra).toMatchObject({ progress: { done: 2, goal: 2 }, done: true });
    expect(plan(tuesday, 4).map((item) => item.kind)).toEqual(['pain', 'compress']);
  });

  it('dia do ano', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    expect(dayOfYear(new Date(2026, 11, 31, 23, 59))).toBe(365);
  });
});
