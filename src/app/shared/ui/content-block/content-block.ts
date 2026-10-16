import { Component, computed, inject, input } from '@angular/core';
import { ContentService } from '../../../core/content/content.service';

/**
 * "Bloco de conteúdo (módulo)" — Figma 34:128. Variante Padrão (branco) ou Dica (azul-claro),
 * escolhida pelo tipo da linha no banco ("Dica").
 */
@Component({
  selector: 'app-content-block',
  template: `
    @if (entry(); as entry) {
      <h2 class="title">{{ entry.title ?? '' }}</h2>
      <p class="body">{{ entry.body ?? entry.text }}</p>
    }
  `,
  host: { '[class.tip]': 'isTip()' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px;
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      font-size: var(--text-body);
    }

    :host(.tip) {
      background: var(--color-surface-light-alt);
    }

    .title {
      color: var(--color-text);
      font-size: inherit;
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-title);
    }

    :host(.tip) .title {
      color: var(--color-primary);
    }

    .title:empty {
      display: none;
    }

    .body {
      color: var(--color-text-secondary);
      line-height: var(--line-height-body);
    }
  `,
})
export class ContentBlock {
  /** Código do texto no banco (ex.: APR-M1.1). */
  readonly code = input.required<string>();

  private readonly content = inject(ContentService);
  protected readonly entry = computed(() => this.content.entry(this.code()));
  protected readonly isTip = computed(() => this.entry()?.type === 'Dica');
}
