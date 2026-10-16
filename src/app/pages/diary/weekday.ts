const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Dia da semana abreviado, como no Figma ("Seg", "Ter"…). */
export function weekdayShort(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/** "14/10" */
export function dayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Nota com vírgula decimal: 3.1 → "3,1"; 4 → "4". */
export function formatPain(value: number): string {
  return String(value).replace('.', ',');
}
