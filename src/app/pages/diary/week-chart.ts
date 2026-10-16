import { Component, computed, input } from '@angular/core';
import { DayPoint } from '../../core/data/diary-stats';
import { dayMonth, formatPain, weekdayShort } from './weekday';

/**
 * Mini gráfico dos últimos 7 dias (colunas da dor média de cada dia). Só o último valor
 * tem rótulo; cada coluna tem o valor no texto para leitor de tela e na dica (title).
 */
@Component({
  selector: 'app-week-chart',
  template: `
    <ol class="bars">
      @for (day of days(); track day.key) {
        <li [title]="day.description">
          <span class="plot" [style.--bar.%]="(day.pain ?? 0) * 10">
            @if (day.pain !== null) {
              @if (day.isLast) {
                <span class="label" aria-hidden="true">{{ day.painText }}</span>
              }
              <span class="bar" [style.height.%]="day.pain * 10"></span>
            } @else {
              <span class="empty" aria-hidden="true"></span>
            }
          </span>
          <span class="day" aria-hidden="true">{{ day.weekday }}</span>
          <span class="visually-hidden">{{ day.description }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .bars {
      display: flex;
      justify-content: space-between;
      gap: var(--space-xs);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
    }

    .plot {
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      width: 100%;
      height: 88px;
      border-bottom: 1px solid var(--color-border);
    }

    .bar {
      width: 100%;
      max-width: 24px;
      min-height: 3px;
      border-radius: 4px 4px 0 0;
      background: var(--color-primary);
    }

    .label {
      position: absolute;
      bottom: calc(var(--bar) + 2px);
      color: var(--color-text);
      font-size: var(--text-caption);
      font-weight: var(--font-weight-bold);
    }

    .empty {
      width: 12px;
      height: 2px;
      margin-bottom: 4px;
      border-radius: 1px;
      background: var(--color-input-border);
    }

    .day {
      color: var(--color-text-secondary);
      font-size: var(--text-caption);
      font-weight: var(--font-weight-semibold);
    }
  `,
})
export class WeekChart {
  readonly series = input.required<readonly DayPoint[]>();

  protected readonly days = computed(() => {
    const series = this.series();
    const lastWithValue = series.reduce((last, day, i) => (day.pain !== null ? i : last), -1);
    return series.map((day, i) => ({
      key: day.date.getTime(),
      pain: day.pain,
      painText: day.pain === null ? '' : formatPain(day.pain),
      isLast: i === lastWithValue,
      weekday: weekdayShort(day.date),
      description:
        `${weekdayShort(day.date)}, ${dayMonth(day.date)}: ` +
        (day.pain === null ? 'sem registro' : `dor ${formatPain(day.pain)} de 10`),
    }));
  });
}
