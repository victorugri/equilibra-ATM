/**
 * Programa 6x6 de Rocabado (EX-06). As sessões por dia vêm da prescrição do dentista
 * (design/ajustes-tayna.md, seção 4).
 */

/** Título e posologia do programa. */
export const PROGRAM_CODE = 'EX-R0';

/** Linha de segurança dos exercícios. */
export const SAFETY_CODE = 'EX-00';

export interface RocabadoExercise {
  n: number;
  /** Código do passo a passo no banco ("Nome — 1. … 2. … 3. … (6 repetições)"). */
  code: string;
  /** Vídeo vertical (9:16, MP4) em public/videos; null enquanto não for gravado. */
  video: string | null;
}

/** Os 6 exercícios, nesta ordem. Vídeos: public/videos/6x6-exercicio-N.mp4. */
export const ROCABADO_EXERCISES: readonly RocabadoExercise[] = [
  { n: 1, code: 'EX-R1', video: null },
  { n: 2, code: 'EX-R2', video: null },
  { n: 3, code: 'EX-R3', video: null },
  { n: 4, code: 'EX-R4', video: null },
  { n: 5, code: 'EX-R5', video: null },
  { n: 6, code: 'EX-R6', video: null },
];
