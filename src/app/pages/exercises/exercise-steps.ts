/** Passo a passo de um exercício, separado do texto do banco. */
export interface ExerciseSteps {
  steps: string[];
  /** Ex.: "6 repetições", quando o texto termina com "(6 repetições)". */
  repetitions: string | null;
}

/**
 * Divide o corpo de um texto "1. … 2. … 3. … (6 repetições)" em passos, sem mudar as
 * palavras. Um texto sem numeração vira um passo só.
 */
export function splitSteps(body: string): ExerciseSteps {
  const repetitionsMatch = body.match(/\s*\(([^)]*repetiç[^)]*)\)\s*$/i);
  const text = repetitionsMatch ? body.slice(0, repetitionsMatch.index).trim() : body.trim();
  const steps = [...text.matchAll(/(?:^|\s)\d+\.\s+(.+?)(?=\s+\d+\.\s|$)/gs)].map((m) =>
    m[1].trim(),
  );
  return {
    steps: steps.length ? steps : [text],
    repetitions: repetitionsMatch?.[1] ?? null,
  };
}
