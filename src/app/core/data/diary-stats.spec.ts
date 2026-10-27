import { PainEntry } from './app-database';
import { averagePain, dailySeries } from './diary-stats';

const today = new Date(2026, 9, 16, 15, 0);

function entry(daysAgo: number, pain: number, exercises: PainEntry['exercises'] = null): PainEntry {
  const at = new Date(2026, 9, 16 - daysAgo, 9, 30);
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
  it('monta a série dos últimos dias com a média de cada dia', () => {
    const series = dailySeries([entry(0, 4), entry(0, 6), entry(2, 3)], [], 7, today);
    expect(series).toHaveLength(7);
    expect(series[6].date).toEqual(new Date(2026, 9, 16));
    expect(series[6].pain).toBe(5);
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

  it('calcula a média das médias diárias (DIA-04)', () => {
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
