import { Component, ModelSignal, computed, model, signal } from '@angular/core';
import { quietHoursLength } from '../../core/reminders/reminder-schedule';
import { Icon } from '../../shared/ui/icon/icon';

/** "Horário de silêncio" (Figma 7:483 e 7:2142): nenhum lembrete nesse intervalo. */
@Component({
  selector: 'app-quiet-hours',
  imports: [Icon],
  template: `
    <section class="quiet" aria-labelledby="quiet-title">
      <div class="quiet-head">
        <span class="quiet-icon"><app-icon name="silencio" /></span>
        <span class="quiet-text">
          <h2 id="quiet-title">Horário de silêncio</h2>
          <span>
            Sem notificações das {{ start() }} às {{ end() }} ({{ hoursLabel() }} de descanso).
          </span>
        </span>
        <button
          type="button"
          class="adjust"
          [attr.aria-expanded]="editing()"
          aria-controls="quiet-edit"
          (click)="editing.set(!editing())"
        >
          {{ editing() ? 'Pronto' : 'Ajustar' }}
        </button>
      </div>
      @if (editing()) {
        <div class="quiet-edit" id="quiet-edit">
          <label>
            Começa às
            <input type="time" [value]="start()" (change)="setTime(start, $event)" />
          </label>
          <label>
            Termina às
            <input type="time" [value]="end()" (change)="setTime(end, $event)" />
          </label>
        </div>
      }
    </section>
  `,
  styleUrl: './quiet-hours.scss',
})
export class QuietHours {
  readonly start = model.required<string>();
  readonly end = model.required<string>();

  protected readonly editing = signal(false);
  protected readonly hoursLabel = computed(() => {
    const hours = quietHoursLength(this.start(), this.end());
    return `${String(hours).replace('.', ',')} ${hours === 1 ? 'hora' : 'horas'}`;
  });

  protected setTime(target: ModelSignal<string>, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) target.set(value);
  }
}
