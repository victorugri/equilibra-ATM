import realBank from '../../../content/pt-BR.json';
import { ContentBank } from '../../core/content/content.model';
import { PAIN_QUESTION, splitQuestion } from './pain-question';

describe('splitQuestion', () => {
  it('separa a pergunta do DIA-01 da explicação da escala', () => {
    const text = (realBank as ContentBank).entries[PAIN_QUESTION].text;
    expect(splitQuestion(text)).toEqual({
      question: 'Quanto está doendo agora?',
      hint: '0 = nenhuma dor; 10 = a pior dor possível',
    });
  });

  it('mantém o texto inteiro quando não há parênteses', () => {
    expect(splitQuestion('Como está sua dor?')).toEqual({
      question: 'Como está sua dor?',
      hint: '',
    });
  });
});
