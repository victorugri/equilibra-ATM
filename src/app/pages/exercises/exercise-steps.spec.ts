import realBank from '../../../content/pt-BR.json';
import { ContentBank } from '../../core/content/content.model';
import { splitSteps } from './exercise-steps';
import { ROCABADO_EXERCISES } from './rocabado';

describe('splitSteps', () => {
  it('separa os passos numerados e as repetições', () => {
    expect(splitSteps('1. Faça isto. 2. Depois aquilo, com calma. 3. Fim. (6 repetições)')).toEqual(
      {
        steps: ['Faça isto.', 'Depois aquilo, com calma.', 'Fim.'],
        repetitions: '6 repetições',
      },
    );
  });

  it('mantém um texto sem numeração como um passo', () => {
    expect(splitSteps('Respire devagar.')).toEqual({
      steps: ['Respire devagar.'],
      repetitions: null,
    });
  });

  it('dá 3 passos e 6 repetições para cada exercício do 6x6 do banco', () => {
    const bank = realBank as ContentBank;
    for (const exercise of ROCABADO_EXERCISES) {
      const body = bank.entries[exercise.code]?.body ?? '';
      const result = splitSteps(body);
      expect(result.steps, exercise.code).toHaveLength(3);
      expect(result.repetitions, exercise.code).toBe('6 repetições');
      // Nenhuma palavra se perde na divisão.
      expect(result.steps.join(' '), exercise.code).toBe(
        body
          .replace(/^1\.\s+/, '')
          .replace(/\s+\d\.\s+/g, ' ')
          .replace(/\s*\(6 repetições\)$/, ''),
      );
    }
  });
});
