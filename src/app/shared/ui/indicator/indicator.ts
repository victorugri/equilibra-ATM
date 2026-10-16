import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type IndicatorTone = 'days' | 'pain' | 'average' | 'reminder';

const ICONS: Record<IndicatorTone, IconName> = {
  days: 'indicador-dias',
  pain: 'indicador-dor',
  average: 'indicador-media',
  reminder: 'indicador-lembrete',
};

/** Quadro do painel do Início — "Indicador (Início)", Figma 42:276. */
@Component({
  selector: 'app-indicator',
  imports: [Icon],
  template: `
    <span class="icon"><app-icon [name]="icons[tone()]" /></span>
    <p class="label">{{ label() }}</p>
    <p class="value">
      <strong>{{ value() }}</strong>
      @if (unit()) {
        <span class="unit">{{ unit() }}</span>
      }
    </p>
    <p class="detail">{{ detail() }}</p>
  `,
  host: { '[class]': 'tone()' },
  styles: `
    :host {
      --tone: var(--color-indicator-days);
      --tone-bg: var(--color-indicator-days-bg);
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: var(--space-lg);
      border-radius: 18px;
      background: var(--color-surface);
      box-shadow: 0 4px 8px rgb(0 51 64 / 8%);
    }

    :host(.pain) {
      --tone: var(--color-indicator-pain);
      --tone-bg: var(--color-indicator-pain-bg);
    }

    :host(.average) {
      --tone: var(--color-indicator-average);
      --tone-bg: var(--color-indicator-average-bg);
    }

    :host(.reminder) {
      --tone: var(--color-indicator-reminder);
      --tone-bg: var(--color-indicator-reminder-bg);
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-bottom: var(--space-xs);
      border-radius: var(--radius-sm);
      background: var(--tone-bg);
      color: var(--tone);
    }

    .label,
    .detail {
      color: var(--color-text-secondary);
      font-size: var(--text-caption);
      line-height: 1.3;
    }

    .label {
      font-weight: var(--font-weight-semibold);
    }

    .value {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-xs);

      strong {
        color: var(--tone);
        font-size: 2.125rem;
        font-weight: var(--font-weight-extrabold);
        line-height: 1.15;
      }
    }

    .unit {
      color: var(--color-text-secondary);
      font-size: var(--text-label);
      font-weight: var(--font-weight-bold);
    }
  `,
})
export class Indicator {
  readonly tone = input.required<IndicatorTone>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input('');
  readonly detail = input('');

  protected readonly icons = ICONS;
}
