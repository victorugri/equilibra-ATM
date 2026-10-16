import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DayPoint } from '../../core/data/diary-stats';
import { dayMonth, formatPain, weekdayShort } from './weekday';

const HEIGHT = 200;
const MARGIN = { top: 20, right: 16, bottom: 52, left: 28 };
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
/** Faixa dos dias com exercício, entre o eixo X e os rótulos dos dias. */
const STRIP_Y = HEIGHT - 34;

/**
 * Histórico de dor (Figma 7:2851): linha da dor média diária (0–10) e, numa faixa abaixo,
 * os dias com exercício (✓). Uma cor só; o exercício é marcado por forma, não por cor.
 * Linha fina, eixo e grade discretos, só o último valor rotulado; a mira (crosshair) com a
 * leitura do dia funciona por toque, mouse e teclado. A tabela com todos os valores fica na página.
 */
@Component({
  selector: 'app-pain-chart',
  template: `
    <div class="frame">
      <svg
        [attr.width]="width()"
        [attr.height]="height"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height"
        role="img"
        [attr.aria-label]="ariaLabel()"
        tabindex="0"
        (pointermove)="onPointer($event)"
        (pointerdown)="onPointer($event)"
        (keydown)="onKey($event)"
      >
        @for (tick of ticks; track tick) {
          <line
            class="grid"
            [attr.x1]="left"
            [attr.x2]="right()"
            [attr.y1]="y(tick)"
            [attr.y2]="y(tick)"
          />
          <text class="axis" [attr.x]="left - 8" [attr.y]="y(tick) + 4" text-anchor="end">
            {{ tick }}
          </text>
        }

        @for (segment of segments(); track $index) {
          <path class="line" [attr.d]="segment" />
        }
        @for (point of points(); track point.index) {
          <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4.5" />
        }
        @if (lastLabel(); as label) {
          <text class="value" [attr.x]="label.x" [attr.y]="label.y - 12" text-anchor="middle">
            {{ label.text }}
          </text>
        }

        @for (day of layout(); track day.index) {
          @if (day.exercised) {
            <g class="check" [attr.transform]="'translate(' + day.x + ' ' + stripY + ')'">
              <circle [attr.r]="checkRadius()" />
              @if (checkRadius() >= 7) {
                <path d="M-3.5 0.2 L-1 2.7 L3.8 -2.4" />
              }
            </g>
          }
          @if (day.showLabel) {
            <text class="axis" [attr.x]="day.x" [attr.y]="height - 8" text-anchor="middle">
              {{ day.label }}
            </text>
          }
        }

        @if (activeDay(); as day) {
          <line
            class="crosshair"
            [attr.x1]="day.x"
            [attr.x2]="day.x"
            [attr.y1]="top"
            [attr.y2]="y(0)"
          />
        }
      </svg>

      <!-- Leitura do dia escolhido, logo abaixo do gráfico: no celular uma dica flutuante
           ficaria sob o dedo ou atrás do cabeçalho fixo. -->
      <p class="readout" role="status">
        @if (activeDay(); as day) {
          <strong>{{ day.pain === null ? 'Sem registro' : 'Dor ' + day.painText + '/10' }}</strong>
          <span>{{ day.longLabel }}{{ day.exercised ? ' · exercício feito' : '' }}</span>
        } @else {
          <span>Toque no gráfico para ver cada dia.</span>
        }
      </p>
    </div>
  `,
  styleUrl: './pain-chart.scss',
})
export class PainChart {
  readonly series = input.required<readonly DayPoint[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly width = signal(310);
  protected readonly height = HEIGHT;
  protected readonly top = MARGIN.top;
  protected readonly left = MARGIN.left;
  protected readonly stripY = STRIP_Y;
  protected readonly ticks = [0, 5, 10];
  protected readonly active = signal<number | null>(null);

  protected readonly right = computed(() => this.width() - MARGIN.right);

  protected readonly layout = computed(() => {
    const series = this.series();
    const plotW = this.right() - MARGIN.left;
    const step = series.length > 1 ? plotW / (series.length - 1) : 0;
    // 7 dias: todos os rótulos; 30 dias: um a cada 5, contando a partir de hoje.
    const every = series.length > 10 ? 5 : 1;
    return series.map((day, index) => ({
      index,
      x: MARGIN.left + (series.length > 1 ? index * step : plotW / 2),
      pain: day.pain,
      painText: day.pain === null ? '' : formatPain(day.pain),
      exercised: day.exercised,
      label: every === 1 ? weekdayShort(day.date) : dayMonth(day.date),
      longLabel: `${weekdayShort(day.date)}, ${dayMonth(day.date)}`,
      showLabel: (series.length - 1 - index) % every === 0,
    }));
  });

  /** Marcador de exercício: 8 px de raio com ✓; menor (só o ponto) quando os dias ficam juntos. */
  protected readonly checkRadius = computed(() => {
    const layout = this.layout();
    const step = layout.length > 1 ? layout[1].x - layout[0].x : 16;
    return Math.max(3, Math.min(8, step / 2 - 1));
  });

  protected readonly points = computed(() =>
    this.layout().flatMap((day) =>
      day.pain === null ? [] : [{ index: day.index, x: day.x, y: this.y(day.pain) }],
    ),
  );

  /** A linha só liga dias seguidos com registro: dias sem registro ficam em branco. */
  protected readonly segments = computed(() => {
    const segments: string[] = [];
    let current = '';
    for (const day of this.layout()) {
      if (day.pain === null) {
        if (current.includes('L')) segments.push(current);
        current = '';
        continue;
      }
      current += `${current ? 'L' : 'M'}${day.x} ${this.y(day.pain)}`;
    }
    if (current.includes('L')) segments.push(current);
    return segments;
  });

  protected readonly lastLabel = computed(() => {
    const last = this.points().at(-1);
    const day = last && this.layout()[last.index];
    return last && day ? { x: last.x, y: last.y, text: day.painText } : null;
  });

  protected readonly activeDay = computed(() => {
    const index = this.active();
    return index === null ? null : (this.layout()[index] ?? null);
  });

  protected readonly ariaLabel = computed(() => {
    const days = this.series().length;
    const withPain = this.points().length;
    return `Gráfico da dor nos últimos ${days} dias: ${withPain} dias com registro. Use as setas para ver cada dia.`;
  });

  constructor() {
    // O gráfico desenha na largura real do cartão (círculos e textos sem distorção).
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      this.width.set(Math.max(240, Math.round(entry.contentRect.width))),
    );
    afterNextRender(() => observer.observe(this.host.nativeElement));
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  protected y(value: number): number {
    return MARGIN.top + PLOT_H - (value / 10) * PLOT_H;
  }

  /** A mira vai para o dia mais próximo do dedo ou do ponteiro. */
  protected onPointer(event: PointerEvent): void {
    const svg = event.currentTarget as SVGElement;
    const x = event.clientX - svg.getBoundingClientRect().left;
    const layout = this.layout();
    let nearest = 0;
    for (const day of layout) {
      if (Math.abs(day.x - x) < Math.abs(layout[nearest].x - x)) nearest = day.index;
    }
    this.active.set(nearest);
  }

  protected onKey(event: KeyboardEvent): void {
    const last = this.series().length - 1;
    const current = this.active() ?? last + 1;
    const next =
      event.key === 'ArrowLeft'
        ? Math.max(0, current - 1)
        : event.key === 'ArrowRight'
          ? Math.min(last, current + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    this.active.set(next);
  }
}
