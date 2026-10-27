/**
 * Plano de hoje (design/ajustes-tayna.md, seção 5): no máximo 3 tarefas por dia no Início;
 * o resto do app fica como consulta. Funções puras, no fuso do aparelho.
 */
import { CareLogData } from '../data/care-log.service';
import { dayKey } from '../data/day';

/**
 * Item 1: dor do dia (com o "dormiu bem?" do diário). Item 2: sessões de exercício, só com
 * prescrição do dentista (seção 4). Item 3: um cuidado, em rodízio.
 */
export type PlanItemKind = 'pain' | 'exercises' | 'compress' | 'module' | 'tip';

export interface PlanItem {
  kind: PlanItemKind;
  /** Código do texto no banco ("Título — corpo"). */
  code: string;
  /** Número do módulo, para "Ler o Módulo {n}". */
  module?: number;
  /** Sessões feitas hoje e a meta da prescrição, para "{x} de {n} sessões". */
  progress?: { done: number; goal: number };
  /** Rota da tarefa; a dica não tem rota (é feita ali mesmo). */
  route: string | null;
  query?: Record<string, number>;
  done: boolean;
}

export interface PlanInput {
  today: Date;
  /** Última nota de dor registrada hoje, ou null. */
  painToday: number | null;
  care: CareLogData;
  moduleCount: number;
  /** Com prescrição ativa: sessões por dia. Sem prescrição: null (o item não aparece). */
  sessionsGoal: number | null;
  sessionsToday: number;
}

/** Compressa com qualquer dor registrada no dia (decisão da Dra. Tayná). */
export const PAIN_FOR_COMPRESS = 1;
/** Dia da semana do módulo (segunda-feira), até terminar os módulos. */
export const MODULE_WEEKDAY = 1;
/** Rodízio dos outros dias: "Faça agora" do Módulo 3 e a dica do dia. */
export const TIP_ROTATION: readonly string[] = ['APR-M3.6', 'INI-06'];

export const PAIN_CODE = 'INI-P02';
export const EXERCISES_CODE = 'INI-P03';
export const COMPRESS_CODE = 'INI-P04';
export const MODULE_CODE = 'INI-P05';

export function dailyPlan(input: PlanInput): PlanItem[] {
  const { today, painToday, care, moduleCount, sessionsGoal, sessionsToday } = input;
  const items: PlanItem[] = [
    { kind: 'pain', code: PAIN_CODE, route: '/diario', done: painToday !== null },
  ];
  if (sessionsGoal) {
    const done = Math.min(sessionsToday, sessionsGoal);
    items.push({
      kind: 'exercises',
      code: EXERCISES_CODE,
      route: '/exercicios',
      progress: { done, goal: sessionsGoal },
      done: done >= sessionsGoal,
    });
  }
  items.push(careOfTheDay(today, painToday, care, moduleCount));
  return items; // nunca mais de 3
}

/** O cuidado do dia, nesta ordem: compressa (se doeu hoje), módulo (às segundas) ou rodízio. */
export function careOfTheDay(
  today: Date,
  painToday: number | null,
  care: CareLogData,
  moduleCount: number,
): PlanItem {
  const key = dayKey(today);
  if (painToday !== null && painToday >= PAIN_FOR_COMPRESS) {
    return {
      kind: 'compress',
      code: COMPRESS_CODE,
      route: '/sos',
      // Abre direto no passo do timer da compressa.
      query: { passo: 3 },
      done: care.compressOn === key,
    };
  }
  if (today.getDay() === MODULE_WEEKDAY) {
    // O módulo lido hoje continua no plano, marcado como feito (e não pula para o próximo).
    const readToday = Object.entries(care.modulesRead).find(([, on]) => on === key);
    const module = readToday ? Number(readToday[0]) : nextModule(care, moduleCount);
    if (module !== null) {
      return {
        kind: 'module',
        code: MODULE_CODE,
        module,
        route: `/aprender/modulo/${module}`,
        done: !!readToday,
      };
    }
  }
  return {
    kind: 'tip',
    code: TIP_ROTATION[dayOfYear(today) % TIP_ROTATION.length],
    route: null,
    done: care.tipOn === key,
  };
}

/** Primeiro módulo ainda não aberto, ou null se já leu todos. */
export function nextModule(care: CareLogData, moduleCount: number): number | null {
  for (let n = 1; n <= moduleCount; n++) if (!care.modulesRead[n]) return n;
  return null;
}

/** 1 em 1º de janeiro. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day.getTime() - start.getTime()) / 86_400_000);
}
