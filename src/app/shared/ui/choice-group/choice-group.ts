import { Component, input, model } from '@angular/core';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

let nextId = 0;

/** Pergunta de resposta rápida (sim/não) com botões grandes; por baixo, um grupo de rádios. */
@Component({
  selector: 'app-choice-group',
  template: `
    <fieldset>
      <legend>{{ legend() }}</legend>
      <div class="options">
        @for (option of options(); track option.value) {
          <label class="option" [class.selected]="value() === option.value">
            <input
              type="radio"
              class="visually-hidden"
              [name]="name"
              [value]="option.value"
              [checked]="value() === option.value"
              (change)="value.set(option.value)"
            />
            {{ option.label }}
          </label>
        }
      </div>
    </fieldset>
  `,
  styles: `
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
    }

    legend {
      padding: 0;
      margin-bottom: var(--space-sm);
      color: var(--color-text);
      font-size: var(--text-body);
      font-weight: var(--font-weight-semibold);
    }

    .options {
      display: flex;
      gap: var(--space-sm);
    }

    .option {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      min-height: var(--touch-target);
      padding: 0 var(--space-md);
      border-radius: var(--radius-pill);
      background: var(--color-surface-light);
      color: var(--color-text);
      font-size: var(--text-label);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;

      &.selected {
        background: var(--color-primary);
        color: var(--color-on-primary);
      }

      &:has(:focus-visible) {
        outline: var(--focus-ring);
        outline-offset: var(--focus-ring-offset);
      }
    }
  `,
})
export class ChoiceGroup<T extends string> {
  readonly legend = input.required<string>();
  readonly options = input.required<readonly ChoiceOption<T>[]>();
  readonly value = model<T | null>(null);

  protected readonly name = `choice-${nextId++}`;
}
