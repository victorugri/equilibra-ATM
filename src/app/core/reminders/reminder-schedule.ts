/** Horários dos lembretes (Figma 7:483 e 7:2142). Funções puras, no fuso do aparelho. */

/**
 * "3 vezes ao dia", "Horários personalizados" ou desligados. O "a cada 2 horas" (7 por dia)
 * saiu: passava do teto de lembretes (design/ajustes-tayna.md, seção 5).
 */
export type ReminderMode = 'three' | 'custom' | 'off';

/** "3 vezes ao dia": manhã, tarde e noite (padrão conservador da Dra. Tayná). */
export const THREE_TIMES: readonly string[] = ['10:00', '15:00', '20:00'];
/** Teto de lembretes por dia, somando tudo. Também é o máximo de horários personalizados. */
export const MAX_DAILY_REMINDERS = 6;
export const MAX_CUSTOM_TIMES = MAX_DAILY_REMINDERS;
/** Horário de silêncio padrão: nada entre 21h e 8h. */
export const DEFAULT_QUIET_START = '21:00';
export const DEFAULT_QUIET_END = '08:00';

/** O que a pessoa escolheu. Horários em "HH:MM"; pausedOn em "AAAA-MM-DD" (data local). */
export interface ReminderPlan {
  mode: ReminderMode;
  customTimes: readonly string[];
  quietStart: string;
  quietEnd: string;
  pausedOn: string | null;
  /** A sessão de exercício prescrita vai junto com o lembrete mais próximo. Padrão: sim. */
  exerciseReminders: boolean;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Horários da opção escolhida, em ordem e sem repetição. */
export function timesFor(mode: ReminderMode, customTimes: readonly string[]): string[] {
  const times = mode === 'three' ? THREE_TIMES : mode === 'custom' ? customTimes : [];
  return [...new Set(times)]
    .sort((a, b) => toMinutes(a) - toMinutes(b))
    .slice(0, MAX_DAILY_REMINDERS);
}

/** Primeiro e último horário quando o dentista sugere quantos lembretes por dia. */
const SPREAD_START = '10:00';
const SPREAD_END = '20:00';

/**
 * `n` horários espalhados das 10h às 20h, de meia em meia hora (ex.: 4 → 10:00, 13:30, 16:30,
 * 20:00). Usado quando o dentista sugere um número de lembretes (LEM-P01).
 */
export function spreadTimes(n: number): string[] {
  const count = Math.max(0, Math.min(Math.round(n), MAX_DAILY_REMINDERS));
  if (count === 0) return [];
  if (count === 1) return ['15:00'];
  const start = toMinutes(SPREAD_START);
  const step = (toMinutes(SPREAD_END) - start) / (count - 1);
  const pad = (value: number) => String(value).padStart(2, '0');
  return Array.from({ length: count }, (_, i) => {
    const minutes = Math.round((start + step * i) / 30) * 30;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  });
}

/** O plano equivalente a "n lembretes por dia": desligado, "3 vezes ao dia" ou personalizado. */
export function planForCount(n: number): Pick<ReminderPlan, 'mode' | 'customTimes'> {
  if (n <= 0) return { mode: 'off', customTimes: [] };
  if (n === THREE_TIMES.length) return { mode: 'three', customTimes: [] };
  return { mode: 'custom', customTimes: spreadTimes(n) };
}

/** O horário cai no silêncio? O intervalo pode passar da meia-noite (21:00 às 08:00). */
export function inQuietHours(time: string, quietStart: string, quietEnd: string): boolean {
  const t = toMinutes(time);
  const start = toMinutes(quietStart);
  const end = toMinutes(quietEnd);
  if (start === end) return false;
  return start < end ? t >= start && t < end : t >= start || t < end;
}

/** Horários que de fato tocam: os da opção, menos os que caem no silêncio. */
export function activeTimes(plan: ReminderPlan): string[] {
  return timesFor(plan.mode, plan.customTimes).filter(
    (time) => !inQuietHours(time, plan.quietStart, plan.quietEnd),
  );
}

/** Data local em "AAAA-MM-DD" (o formato do banco). */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Próximo lembrete depois de `now` (pula hoje se estiver pausado), ou null. */
export function nextReminder(plan: ReminderPlan, now: Date): Date | null {
  const times = activeTimes(plan);
  if (!times.length) return null;
  for (let offset = 0; offset < 3; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (plan.pausedOn === isoDate(day)) continue;
    for (const time of times) {
      const minutes = toMinutes(time);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
      if (at > now) return at;
    }
  }
  return null;
}

/** "9 horas de descanso" (duração do silêncio). */
export function quietHoursLength(quietStart: string, quietEnd: string): number {
  const minutes = (toMinutes(quietEnd) - toMinutes(quietStart) + 24 * 60) % (24 * 60);
  return Math.round((minutes / 60) * 10) / 10;
}
