import { ReminderMode, ReminderPlan, nextReminder } from '../../core/reminders/reminder-schedule';

export const MODE_LABELS: Record<ReminderMode, string> = {
  three: '3 vezes ao dia',
  custom: 'Horários personalizados',
  off: 'Desligados',
};

/** "14:30" */
export function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Resumo para o Perfil: "3 vezes ao dia · próximo às 14:30". */
export function reminderSummary(plan: ReminderPlan, signedIn: boolean, now: Date): string {
  if (!signedIn) return 'Com uma conta, você recebe lembretes nos horários que escolher.';
  if (plan.mode === 'off') return 'Desligados. Você pode ativar quando quiser.';
  const next = nextReminder(plan, now);
  const label = MODE_LABELS[plan.mode];
  if (!next) return label;
  const tomorrow = next.getDate() !== now.getDate();
  return `${label} · próximo ${tomorrow ? 'amanhã ' : ''}às ${formatTime(next)}`;
}
