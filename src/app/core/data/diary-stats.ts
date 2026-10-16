import { ExerciseSession, PainEntry } from './app-database';
import { dayKey, lastDays } from './day';

/** Um dia do período: dor média do dia (ou null sem registro) e se houve exercício. */
export interface DayPoint {
  date: Date;
  pain: number | null;
  exercised: boolean;
}

/**
 * Série diária dos últimos `days` dias. Com mais de um registro no dia, vale a média do dia.
 * "Exercício feito" = sessão do 6x6 registrada no dia ou "fiz os exercícios" no diário.
 */
export function dailySeries(
  entries: readonly PainEntry[],
  sessions: readonly ExerciseSession[],
  days: number,
  today: Date,
): DayPoint[] {
  const painByDay = new Map<string, number[]>();
  const exercisedDays = new Set<string>();
  for (const entry of entries) {
    const key = dayKey(entry.at);
    painByDay.set(key, [...(painByDay.get(key) ?? []), entry.pain]);
    if (entry.exercises === 'yes') exercisedDays.add(key);
  }
  for (const session of sessions) exercisedDays.add(dayKey(session.at));

  return lastDays(days, today).map((date) => {
    const key = dayKey(date);
    const values = painByDay.get(key);
    return { date, pain: values ? round1(mean(values)) : null, exercised: exercisedDays.has(key) };
  });
}

/** Média das médias diárias (cada dia com registro pesa igual). */
export function averagePain(series: readonly DayPoint[]): number | null {
  const values = series.flatMap((day) => (day.pain === null ? [] : [day.pain]));
  return values.length ? round1(mean(values)) : null;
}

/** Média dos dias com exercício que têm registro de dor (DIA-04, valor {y}). */
export function averageOnExerciseDays(series: readonly DayPoint[]): number | null {
  return averagePain(series.filter((day) => day.exercised));
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
