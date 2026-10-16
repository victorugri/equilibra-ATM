import realBank from '../../../../content/pt-BR.json';
import { ContentBank } from '../../../core/content/content.model';
import { indicatorParts } from './indicator-text';

const body = (code: string) => (realBank as ContentBank).entries[code].body ?? '';

describe('indicatorParts (textos INI do banco)', () => {
  it('INI-01: dias se cuidando, com singular para 1 dia', () => {
    expect(indicatorParts(body('INI-01'), { n: '12' })).toEqual({
      value: '12',
      unit: 'dias',
      detail: 'desde que você começou',
    });
    expect(indicatorParts(body('INI-01'), { n: '1' })?.unit).toBe('dia');
  });

  it('INI-02: última dor, omitindo a intensidade ainda não definida', () => {
    expect(
      indicatorParts(body('INI-02'), { x: '2', intensidade: null, 'data e hora': 'hoje, 8h10' }),
    ).toEqual({ value: '2', unit: '/10', detail: 'hoje, 8h10' });
    expect(
      indicatorParts(body('INI-02'), { x: '2', intensidade: 'Leve', 'data e hora': 'hoje, 8h10' })
        ?.detail,
    ).toBe('Leve · hoje, 8h10');
  });

  it('INI-03 e INI-04', () => {
    expect(indicatorParts(body('INI-03'), { x: '3,1' })).toEqual({
      value: '3,1',
      unit: '/10',
      detail: 'últimos 7 dias',
    });
    expect(indicatorParts(body('INI-04'), { 'hh:mm': '14:30' })).toEqual({
      value: '14:30',
      unit: '',
      detail: 'Relaxar a mandíbula',
    });
  });

  it('devolve null sem o valor principal', () => {
    expect(indicatorParts(body('INI-03'), { x: null })).toBeNull();
  });
});
