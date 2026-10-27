import { Component, computed, input, model, signal } from '@angular/core';
import {
  MAX_CUSTOM_TIMES,
  ReminderMode,
  THREE_TIMES,
  timesFor,
} from '../../core/reminders/reminder-schedule';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';

interface ModeOption {
  value: ReminderMode;
  title: string;
  text: string;
}

/** Ícone de cada horário do "3 vezes ao dia" (sol, tarde e lua, como no Figma). */
const PERIOD_ICONS: IconName[] = ['manha', 'tarde', 'noite'];

/**
 * Escolha da frequência dos lembretes (Figma 7:483 e 7:2142): 3 vezes ao dia, horários
 * personalizados (até 6) ou desligados.
 */
@Component({
  selector: 'app-reminder-mode-picker',
  imports: [Icon],
  template: `
    <fieldset class="options">
      <legend>{{ legend() }}</legend>
      @for (option of options(); track option.value) {
        <label class="option" [class.selected]="mode() === option.value">
          <input
            type="radio"
            name="reminder-mode"
            [value]="option.value"
            [checked]="mode() === option.value"
            (change)="mode.set(option.value)"
          />
          <span class="radio" aria-hidden="true">
            @if (mode() === option.value) {
              <app-icon name="opcao-check" />
            }
          </span>
          <span class="option-body">
            <span class="option-title">
              {{ option.title }}
              @if (option.value === 'three') {
                <span class="badge">Recomendado</span>
              }
            </span>
            <span class="option-text">{{ option.text }}</span>

            @if (mode() === option.value && option.value === 'three') {
              <span class="chips">
                @for (time of threeTimes; track time; let i = $index) {
                  <span class="chip"
                    ><app-icon [name]="periodIcons[i]" [size]="14" />{{ time }}</span
                  >
                }
              </span>
            }
          </span>
        </label>

        @if (mode() === 'custom' && option.value === 'custom') {
          <div class="custom">
            @if (sortedCustom().length) {
              <ul class="chips" aria-label="Seus horários">
                @for (time of sortedCustom(); track time) {
                  <li class="chip custom-chip">
                    {{ time }}
                    <button
                      type="button"
                      class="remove"
                      (click)="remove(time)"
                      [attr.aria-label]="'Tirar ' + time"
                    >
                      ×
                    </button>
                  </li>
                }
              </ul>
            }
            @if (sortedCustom().length < maxCustom) {
              <div class="add">
                <label class="add-label" for="reminder-new-time">Novo horário</label>
                <input
                  id="reminder-new-time"
                  type="time"
                  class="time-input"
                  [value]="newTime()"
                  (input)="newTime.set($any($event.target).value)"
                />
                <button type="button" class="add-button" (click)="add()" [disabled]="!newTime()">
                  <app-icon name="adicionar-horario" />
                  Adicionar
                </button>
              </div>
            }
          </div>
        }
      }
    </fieldset>
  `,
  styleUrl: './reminder-mode-picker.scss',
})
export class ReminderModePicker {
  readonly mode = model.required<ReminderMode>();
  readonly customTimes = model.required<readonly string[]>();
  readonly legend = input('Frequência dos lembretes');
  /** Na entrada do app a última opção é "Não quero lembretes agora". */
  readonly offLabel = input('Desligados');

  protected readonly threeTimes = THREE_TIMES;
  protected readonly periodIcons = PERIOD_ICONS;
  protected readonly maxCustom = MAX_CUSTOM_TIMES;
  protected readonly newTime = signal('');
  protected readonly sortedCustom = computed(() => timesFor('custom', this.customTimes()));

  protected readonly options = computed<ModeOption[]>(() => [
    { value: 'three', title: '3 vezes ao dia', text: 'Manhã, tarde e noite' },
    {
      value: 'custom',
      title: 'Horários personalizados',
      text: `Escolha até ${MAX_CUSTOM_TIMES} horários para a sua rotina.`,
    },
    { value: 'off', title: this.offLabel(), text: 'Você poderá ativar quando quiser.' },
  ]);

  protected add(): void {
    const time = this.newTime();
    if (!time) return;
    this.customTimes.set(timesFor('custom', [...this.customTimes(), time]));
    this.newTime.set('');
  }

  protected remove(time: string): void {
    this.customTimes.set(this.customTimes().filter((saved) => saved !== time));
  }
}
