import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PainEntry } from '../../core/data/app-database';
import { addDays, dayKey, startOfDay } from '../../core/data/day';
import { averageOnExerciseDays, averagePain, dailySeries } from '../../core/data/diary-stats';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { Disclaimer } from '../../shared/ui/disclaimer/disclaimer';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ContentService } from '../../core/content/content.service';
import { PAIN_QUESTION, splitQuestion } from './pain-question';
import { dayMonth, formatPain } from './weekday';

const PERIOD_DAYS = 30;

const ANSWER: Record<string, string> = { yes: 'Sim', no: 'Não', 'not-used': 'Não usa' };

/**
 * Relatório para levar ao dentista (PER-02): resumo e registros dos últimos 30 dias.
 * É gerado no próprio aparelho; a pessoa imprime ou salva em PDF pelo navegador.
 */
@Component({
  selector: 'app-report-page',
  imports: [DatePipe, PageHeader, Disclaimer],
  templateUrl: './report-page.html',
  styleUrl: './report-page.scss',
})
export class ReportPage {
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);

  /** Explicação da escala, do próprio texto da pergunta (DIA-01). */
  protected readonly scale = splitQuestion(inject(ContentService).get(PAIN_QUESTION)).hint;

  protected readonly generatedAt = new Date();
  protected readonly start = addDays(startOfDay(this.generatedAt), -(PERIOD_DAYS - 1));
  protected readonly periodDays = PERIOD_DAYS;

  private readonly inPeriod = <T extends { at: Date }>(items: readonly T[]) =>
    items.filter((item) => item.at >= this.start);

  private readonly series = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), PERIOD_DAYS, this.generatedAt),
  );
  private readonly week = computed(() => this.series().slice(-7));

  protected readonly summary = computed(() => {
    const format = (value: number | null) => (value === null ? '—' : `${formatPain(value)}/10`);
    return [
      { label: 'Dor média nos últimos 30 dias', value: format(averagePain(this.series())) },
      { label: 'Dor média nos últimos 7 dias', value: format(averagePain(this.week())) },
      {
        label: 'Dor média nos dias com exercício (30 dias)',
        value: format(averageOnExerciseDays(this.series())),
      },
      {
        label: 'Dias com registro de dor',
        value: `${this.series().filter((d) => d.pain !== null).length} de ${PERIOD_DAYS}`,
      },
      {
        label: 'Dias com exercício',
        value: `${this.series().filter((d) => d.exercised).length} de ${PERIOD_DAYS}`,
      },
      {
        label: 'Sessões do Programa 6x6',
        value: String(this.inPeriod(this.sessions.all()).length),
      },
    ];
  });

  /** Registros do diário, do mais recente para o mais antigo. */
  protected readonly entries = computed(() =>
    [...this.inPeriod(this.diary.entries())].reverse().map((entry: PainEntry) => ({
      key: entry.id ?? entry.at.getTime(),
      at: entry.at,
      pain: entry.pain,
      exercises: answer(entry.exercises),
      splint: answer(entry.splint),
      sleptWell: answer(entry.sleptWell),
      note: entry.note || '—',
    })),
  );

  /** Sessões do 6x6 por dia, só dos dias com sessão. */
  protected readonly sessionsByDay = computed(() => {
    const byDay = new Map<string, { date: Date; count: number }>();
    for (const session of this.inPeriod(this.sessions.all())) {
      const key = dayKey(session.at);
      const day = byDay.get(key) ?? { date: startOfDay(session.at), count: 0 };
      day.count++;
      byDay.set(key, day);
    }
    return [...byDay.values()].reverse().map((day) => ({ ...day, label: dayMonth(day.date) }));
  });

  protected print(): void {
    globalThis.print?.();
  }
}

function answer(value: string | null): string {
  return value === null ? '—' : (ANSWER[value] ?? value);
}
