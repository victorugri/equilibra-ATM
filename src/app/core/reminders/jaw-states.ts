/** Respostas do check-in, na ordem do LEM-02 (é o que vai para o banco). */
export const JAW_STATES = ['relaxed', 'touching', 'clenching', 'tense'] as const;
export type JawState = (typeof JAW_STATES)[number];

export interface CheckinQuestion {
  question: string;
  options: { value: JawState; label: string }[];
}

/**
 * Separa o texto do LEM-02 ("Neste momento, sua mandíbula está: (1) …; (2) …") em pergunta
 * e opções, sem mudar as palavras do banco de conteúdo.
 */
export function parseCheckinQuestion(text: string): CheckinQuestion {
  const [question, ...parts] = text.split(/\s*\(\d\)\s*/);
  const labels = parts.map((part) => part.replace(/[;.]\s*$/, '').trim());
  if (labels.length !== JAW_STATES.length) {
    throw new Error(`LEM-02 deveria ter ${JAW_STATES.length} opções (tem ${labels.length}).`);
  }
  return {
    question: question.trim(),
    options: labels.map((label, i) => ({ value: JAW_STATES[i], label })),
  };
}
