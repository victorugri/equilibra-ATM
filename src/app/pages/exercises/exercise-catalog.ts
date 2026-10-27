import { ContentService } from '../../core/content/content.service';
import { ROCABADO_EXERCISES } from './rocabado';

/** Um exercício que o dentista pode prescrever (design/ajustes-tayna.md, seção 4). */
export interface CatalogExercise {
  /** Código do passo a passo no banco. */
  code: string;
  group: 'rocabado' | 'other';
  /** Vídeo vertical em public/videos; null enquanto não for gravado. */
  video: string | null;
}

/**
 * Exercícios prescritíveis: os 6 do Programa 6x6 e os outros exercícios citados nas fontes da
 * revisão de literatura, na ordem em que aparecem para o paciente. EX-07 a EX-12 repetem o 6x6
 * (o app usa EX-R1 a EX-R6). Um código bloqueado na planilha (Lacuna) sai sozinho da lista.
 */
export const EXERCISE_CATALOG: readonly CatalogExercise[] = [
  ...ROCABADO_EXERCISES.map((e): CatalogExercise => ({ ...e, group: 'rocabado' })),
  { code: 'EX-02', group: 'other', video: null }, // respiração diafragmática
  { code: 'EX-03', group: 'other', video: null }, // alongamento passivo com os dedos
  { code: 'EX-04', group: 'other', video: null }, // movimentos na frente do espelho
  { code: 'EX-01', group: 'other', video: null }, // exercícios com resistência
  { code: 'EX-05', group: 'other', video: null }, // movimentos laterais e com objeto
  { code: 'EX-15', group: 'other', video: null }, // relaxamento muscular progressivo
];

/** Os exercícios do catálogo que podem aparecer (texto liberado no banco). */
export function availableExercises(content: ContentService): CatalogExercise[] {
  return EXERCISE_CATALOG.filter((exercise) => content.has(exercise.code));
}

/** Os prescritos, na ordem do catálogo (o 6x6 primeiro, na ordem do programa). */
export function prescribedExercises(
  content: ContentService,
  codes: ReadonlySet<string>,
): CatalogExercise[] {
  return availableExercises(content).filter((exercise) => codes.has(exercise.code));
}

/** Nome do exercício: o título do texto ("Nome — passos") ou, sem título, a tela da planilha. */
export function exerciseName(content: ContentService, code: string): string {
  const entry = content.entry(code);
  return entry?.title ?? entry?.screen ?? '';
}

/** Passos do exercício: o corpo do texto ou, sem título, o texto todo. */
export function exerciseText(content: ContentService, code: string): string {
  const entry = content.entry(code);
  return entry?.body ?? entry?.text ?? '';
}
