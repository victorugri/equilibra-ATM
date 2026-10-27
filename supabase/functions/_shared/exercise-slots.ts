/**
 * Em quais lembretes vai a sessão de exercício (design/ajustes-tayna.md, seção 5): sem
 * notificação a mais, cada sessão prescrita vai junto com um lembrete do dia, espalhadas como
 * as sessões ao longo do dia. Para quando as sessões do dia já foram feitas.
 */

/** "10:00:00" (Postgres) e "10:00" (app) são o mesmo horário. */
const hhmm = (time: string) => time.slice(0, 5);

/**
 * Posições (0 = primeiro lembrete) que levam a sessão: `goal` sessões entre `count` lembretes.
 * 1 sessão → o lembrete do meio; 2 → o primeiro e o último; meta ≥ lembretes → todos.
 */
export function exerciseSlots(count: number, goal: number): number[] {
  if (count <= 0 || goal <= 0) return [];
  if (goal >= count) return Array.from({ length: count }, (_, i) => i);
  if (goal === 1) return [Math.round((count - 1) / 2)];
  const slots = Array.from({ length: goal }, (_, i) => Math.round((i * (count - 1)) / (goal - 1)));
  return [...new Set(slots)];
}

export interface ExerciseContext {
  /** Horário deste lembrete. */
  timeOfDay: string;
  /** Horários que tocam hoje (fora do silêncio), em ordem. */
  activeTimes: readonly string[];
  /** Sessões por dia da prescrição ativa; null sem prescrição ou com a opção desligada. */
  goal: number | null;
  /** Sessões feitas hoje. */
  done: number;
}

/** Este lembrete leva a sessão de exercício? */
export function carriesExercise({ timeOfDay, activeTimes, goal, done }: ExerciseContext): boolean {
  if (!goal || done >= goal) return false;
  const position = activeTimes.map(hhmm).indexOf(hhmm(timeOfDay));
  return position >= 0 && exerciseSlots(activeTimes.length, goal).includes(position);
}
