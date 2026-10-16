import { Component, input } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';
import { COMPRESS_MINUTES, CompressTimer } from './compress-timer';

/** Mostrador e botões do timer da compressa (Figma 7:749, passo 3). */
@Component({
  selector: 'app-timer-controls',
  imports: [Icon],
  template: `
    @let state = timer().state();
    <div class="row">
      <span class="time" role="timer" [attr.aria-label]="'Tempo restante ' + timer().display()">
        {{ timer().display() }}
      </span>
      @switch (state) {
        @case ('idle') {
          <button type="button" class="btn-secondary" (click)="timer().start()">
            <app-icon name="timer" />
            Ligar timer ({{ minutes }} min)
          </button>
        }
        @case ('running') {
          <button type="button" class="btn-secondary" (click)="timer().pause()">Pausar</button>
        }
        @case ('paused') {
          <button type="button" class="btn-secondary" (click)="timer().resume()">Continuar</button>
        }
        @case ('finished') {
          <button type="button" class="btn-secondary" (click)="timer().start()">
            Ligar de novo
          </button>
        }
      }
    </div>
    @if (state === 'paused') {
      <button type="button" class="btn-link reset" (click)="timer().reset()">Zerar o timer</button>
    }
    <p class="visually-hidden" role="status">
      @if (state === 'finished') {
        Tempo concluído.
      }
    </p>
    @if (state === 'finished') {
      <p class="finished" aria-hidden="true">Tempo concluído.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--space-md);

      .btn-secondary {
        flex: 1;
      }
    }

    .time {
      min-width: 64px;
      color: var(--color-sos-action);
      font-size: var(--text-body-lg);
      font-weight: var(--font-weight-bold);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }

    .reset {
      align-self: center;
    }

    .finished {
      color: var(--color-success-strong);
      font-size: var(--text-label);
      font-weight: var(--font-weight-bold);
    }
  `,
})
export class TimerControls {
  readonly timer = input.required<CompressTimer>();
  protected readonly minutes = COMPRESS_MINUTES;
}
