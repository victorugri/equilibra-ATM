import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { averagePain, dailySeries } from '../../core/data/diary-stats';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DiaryTabs } from './diary-tabs';
import { PainChart } from './pain-chart';
import { dayMonth, formatPain, weekdayShort } from './weekday';

/** Resumo descritivo dos 7 dias. */
const SUMMARY = 'DIA-04';
/** Título do gráfico e da tabela (dor e sessões lado a lado, sem comparação). */
const CHART_SUBTITLE = 'REL-P01';
/** Textos do cartão do relatório para o dentista. */
export const REPORT_TEXT = 'PER-02';
const REPORT_NOTE = 'REL-P02';

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
  protected readonly reportNote = REPORT_NOTE;
  protected readonly chartSubtitle = CHART_SUBTITLE;
  protected readonly periods: readonly Period[] = [7, 30];
  protected readonly period = signal<Period>(7);

  private readonly week = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), 7, new Date()),
  );
  protected readonly series = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), this.period(), new Date()),
  );

  /** DIA-04 com a média dos 7 dias, ou null sem registros. */
  protected readonly summary = computed(() => {
    const x = averagePain(this.week());
    return x === null ? null : this.content.get(SUMMARY, 'text', { x: formatPain(x) });
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
