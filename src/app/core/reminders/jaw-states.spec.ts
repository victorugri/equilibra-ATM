import bank from '../../../content/pt-BR.json';
import { parseCheckinQuestion } from './jaw-states';

describe('pergunta do check-in (LEM-02)', () => {
  it('separa a pergunta e as 4 opções sem mudar o texto do banco', () => {
    const { question, options } = parseCheckinQuestion(bank.entries['LEM-02'].text);
    expect(question).toBe('Neste momento, sua mandíbula está:');
    expect(options).toEqual([
      { value: 'relaxed', label: 'Relaxada, com os dentes separados' },
      { value: 'touching', label: 'Com os dentes encostando' },
      { value: 'clenching', label: 'Apertando os dentes' },
      { value: 'tense', label: 'Com os músculos tensos, sem encostar os dentes' },
    ]);
  });

  it('recusa um texto com outro número de opções', () => {
    expect(() => parseCheckinQuestion('Como está? (1) Bem; (2) Mal.')).toThrow();
  });
});
