import { ExerciseSession, PainEntry } from './app-database';
import { dayKey, lastDays } from './day';

/** Um dia do período: dor do dia (ou null sem registro) e se houve exercício. */
export interface DayPoint {
  date: Date;
  pain: number | null;
  exercised: boolean;
}

/**
 * Um registro por dia: o último de cada dia, do dia mais antigo para o mais novo.
 * Atualizar o registro do dia grava um novo (o servidor só aceita inclusões e o histórico
 * fica guardado); vale sempre o mais recente. Cobre também dois aparelhos no mesmo dia.
 */
export function latestPerDay<T extends Pick<PainEntry, 'at'>>(entries: readonly T[]): T[] {
  const byDay = new Map<string, T>();
  for (const entry of entries) {
    const key = dayKey(entry.at);
    const kept = byDay.get(key);
    if (!kept || entry.at.getTime() >= kept.at.getTime()) byDay.set(key, entry);
  }
  return [...byDay.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * Série diária dos últimos `days` dias. Com mais de um registro no dia, vale o último.
 * "Exercício feito" = sessão do 6x6 registrada no dia ou "fiz os exercícios" no diário.
 */
export function dailySeries(
  entries: readonly Pick<PainEntry, 'at' | 'pain' | 'exercises'>[],
  sessions: readonly Pick<ExerciseSession, 'at'>[],
  days: number,
  today: Date,
): DayPoint[] {
  const painByDay = new Map<string, number>();
  const exercisedDays = new Set<string>();
  for (const entry of latestPerDay(entries)) {
    const key = dayKey(entry.at);
    painByDay.set(key, entry.pain);
    if (entry.exercises === 'yes') exercisedDays.add(key);
  }
  for (const session of sessions) exercisedDays.add(dayKey(session.at));

  return lastDays(days, today).map((date) => {
    const key = dayKey(date);
    return { date, pain: painByDay.get(key) ?? null, exercised: exercisedDays.has(key) };
  });
}

/**
 * Média da dor dos dias com registro (cada dia pesa igual).
 * Dor e exercício ficam lado a lado, nunca cruzados: não calcular a dor "dos dias com exercício",
 * que sugere causa e efeito (ajustes da Dra. Tayná, design/ajustes-tayna.md, seção 2).
 */
export function averagePain(series: readonly DayPoint[]): number | null {
  const values = series.flatMap((day) => (day.pain === null ? [] : [day.pain]));
  return values.length ? round1(mean(values)) : null;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
