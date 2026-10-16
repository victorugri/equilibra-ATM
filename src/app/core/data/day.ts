/** Datas no fuso do aparelho: um "dia" vai da meia-noite à meia-noite local. */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Os últimos `count` dias terminando em `today`, do mais antigo para o mais novo. */
export function lastDays(count: number, today: Date): Date[] {
  const end = startOfDay(today);
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

/** Diferença em dias de calendário (b − a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}
