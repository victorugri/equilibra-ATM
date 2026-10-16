/** Pergunta da dor no diário (DIA-01). */
export const PAIN_QUESTION = 'DIA-01';

/** "Quanto está doendo agora? (0 = nenhuma dor; 10 = …)" → pergunta e explicação da escala. */
export function splitQuestion(text: string): { question: string; hint: string } {
  const match = text.match(/^(.+?)\s*\((.+)\)\s*$/);
  return match ? { question: match[1], hint: match[2] } : { question: text, hint: '' };
}
