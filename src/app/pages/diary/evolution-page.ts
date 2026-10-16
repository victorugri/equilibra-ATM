import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { averageOnExerciseDays, averagePain, dailySeries } from '../../core/data/diary-stats';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DiaryTabs } from './diary-tabs';
import { PainChart } from './pain-chart';
import { dayMonth, formatPain, weekdayShort } from './weekday';

/** Resumo descritivo dos 7 dias (DIA-04) e média da semana, quando não há dia com exercício. */
const SUMMARY = 'DIA-04';
const WEEK_AVERAGE = 'INI-03';
/** Texto do cartão do relatório para o dentista. */
export const REPORT_TEXT = 'PER-02';

type Period = 7 | 30;

/** Diário — evolução e relatório (Figma 7:2851; ver design/7-2851-diario-evolucao.md). */
@Component({
  selector: 'app-evolution-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe, DiaryTabs, PainChart],
  templateUrl: './evolution-page.html',
  styleUrl: './evolution-page.scss',
})
export class EvolutionPage {
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);
  private readonly content = inject(ContentService);

  protected readonly reportText = REPORT_TEXT;
  protected readonly periods: readonly Period[] = [7, 30];
  protected readonly period = signal<Period>(7);

  private readonly week = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), 7, new Date()),
  );
  protected readonly series = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), this.period(), new Date()),
  );

  /** DIA-04 quando há as duas médias; só a média da semana (INI-03) quando não há exercício. */
  protected readonly summary = computed(() => {
    const x = averagePain(this.week());
    if (x === null) return null;
    const y = averageOnExerciseDays(this.week());
    if (y !== null) {
      return {
        title: null,
        text: this.content.get(SUMMARY, 'text', { x: formatPain(x), y: formatPain(y) }),
      };
    }
    const entry = this.content.entry(WEEK_AVERAGE);
    return {
      title: entry?.title ?? null,
      text: this.content.get(WEEK_AVERAGE, 'body', { x: formatPain(x) }),
    };
  });

  protected readonly exerciseDays = computed(() => this.series().filter((d) => d.exercised).length);
  protected readonly painDays = computed(() => this.series().filter((d) => d.pain !== null).length);

  /** Tabela com os mesmos valores do gráfico (do dia mais recente para o mais antigo). */
  protected readonly table = computed(() =>
    [...this.series()].reverse().map((day) => ({
      key: day.date.getTime(),
      date: `${weekdayShort(day.date)}, ${dayMonth(day.date)}`,
      pain: day.pain === null ? '—' : formatPain(day.pain),
      exercised: day.exercised ? 'Sim' : '—',
    })),
  );
}
