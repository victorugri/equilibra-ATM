import { Component, input, model, signal } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';

let nextId = 0;

/** Campo de senha com "Mostrar"/"Ocultar" (Figma 23:2). */
@Component({
  selector: 'app-password-field',
  imports: [Icon],
  template: `
    <div class="field">
      <label class="field-label" [for]="id">{{ label() }}</label>
      <div class="input-box">
        <app-icon name="senha" />
        <input
          [id]="id"
          [type]="visible() ? 'text' : 'password'"
          [attr.autocomplete]="autocomplete()"
          [placeholder]="placeholder()"
          [attr.aria-describedby]="help() ? id + '-help' : null"
          [value]="value()"
          (input)="value.set($any($event.target).value)"
        />
        <button
          type="button"
          class="toggle"
          [attr.aria-pressed]="visible()"
          (click)="visible.set(!visible())"
        >
          {{ visible() ? 'Ocultar' : 'Mostrar' }}
        </button>
      </div>
      @if (help()) {
        <p [id]="id + '-help'" class="field-help">{{ help() }}</p>
      }
    </div>
  `,
  styles: `
    .toggle {
      min-height: var(--touch-target);
      padding: 0 var(--space-xs);
      border: 0;
      background: transparent;
      color: var(--color-primary);
      font-size: var(--text-label);
      font-weight: var(--font-weight-bold);
      cursor: pointer;
    }
  `,
})
export class PasswordField {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly help = input('');
  readonly autocomplete = input<'new-password' | 'current-password'>('current-password');
  readonly value = model('');

  protected readonly id = `password-${nextId++}`;
  protected readonly visible = signal(false);
}
