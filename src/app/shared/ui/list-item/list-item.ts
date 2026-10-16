import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

/**
 * Linha de lista com número, título, descrição opcional e seta.
 * Variante "module" = "Item de módulo (Aprender)", Figma 31:80.
 * Variante "exercise" = "Item exercício 6x6", Figma 40:244.
 */
@Component({
  selector: 'app-list-item',
  imports: [RouterLink, Icon],
  template: `
    <a
      class="item"
      [class.exercise]="variant() === 'exercise'"
      [routerLink]="link()"
      [fragment]="fragment()"
    >
      <span class="number" aria-hidden="true">{{ number() }}</span>
      <span class="texts">
        <span class="title"
          ><span class="visually-hidden">{{ number() }}. </span>{{ title() }}</span
        >
        @if (description()) {
          <span class="description">{{ description() }}</span>
        }
      </span>
      <app-icon
        [name]="variant() === 'exercise' ? 'seta-exercicio' : 'seta-modulo'"
        class="arrow"
      />
    </a>
  `,
  styleUrl: './list-item.scss',
})
export class ListItem {
  readonly variant = input<'module' | 'exercise'>('module');
  readonly number = input.required<number>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly link = input.required<string>();
  readonly fragment = input<string>();
}
