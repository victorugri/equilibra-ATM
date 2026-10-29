import { PainEntry } from './app-database';
import { averagePain, dailySeries, latestPerDay } from './diary-stats';

const today = new Date(2026, 9, 16, 15, 0);

function entry(
  daysAgo: number,
  pain: number,
  exercises: PainEntry['exercises'] = null,
  hour = 9,
): PainEntry {
  const at = new Date(2026, 9, 16 - daysAgo, hour, 30);
  return {
    uid: `e${daysAgo}-${pain}`,
    at,
    pain,
    exercises,
    splint: null,
    sleptWell: null,
    note: '',
    dirty: 0,
  };
}

describe('estatísticas do diário', () => {
  it('monta a série dos últimos dias com o último registro de cada dia', () => {
    const series = dailySeries([entry(0, 4, null, 14), entry(0, 6), entry(2, 3)], [], 7, today);
    expect(series).toHaveLength(7);
    expect(series[6].date).toEqual(new Date(2026, 9, 16));
    expect(series[6].pain).toBe(4);
    expect(series[4].pain).toBe(3);
    expect(series[5].pain).toBeNull();
  });

  it('marca exercício por sessão do 6x6 ou pela resposta do diário', () => {
    const series = dailySeries(
      [entry(1, 2, 'yes'), entry(3, 7, 'no')],
      [{ at: new Date(2026, 9, 16, 8, 0) }],
      7,
      today,
    );
    expect(series.map((d) => d.exercised)).toEqual([false, false, false, false, false, true, true]);
  });

  it('ignora registros fora do período', () => {
    const series = dailySeries([entry(10, 9), entry(1, 2)], [], 7, today);
    expect(averagePain(series)).toBe(2);
  });

  it('a resposta de exercício também é a do último registro do dia', () => {
    const series = dailySeries([entry(0, 4, 'yes'), entry(0, 4, 'no', 14)], [], 7, today);
    expect(series[6].exercised).toBe(false);
  });

  it('guarda um registro por dia, o mais recente, em ordem', () => {
    const kept = latestPerDay([
      entry(0, 4, null, 14),
      entry(2, 3),
      entry(0, 6),
      entry(2, 5, null, 8),
    ]);
    expect(kept.map((e) => e.pain)).toEqual([3, 4]);
  });

  it('calcula a média da dor dos dias com registro (DIA-04)', () => {
    const series = dailySeries(
      [entry(0, 6), entry(1, 2, 'yes'), entry(2, 3, 'yes'), entry(3, 8)],
      [],
      7,
      today,
    );
    expect(averagePain(series)).toBe(4.8);
  });

  it('devolve null sem registros', () => {
    const series = dailySeries([], [{ at: today }], 7, today);
    expect(averagePain(series)).toBeNull();
  });
});
