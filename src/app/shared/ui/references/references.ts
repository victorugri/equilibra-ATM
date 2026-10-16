import { Component, computed, inject, input } from '@angular/core';
import { ContentService } from '../../../core/content/content.service';

/** Linha "Baseado em: …" com as referências dos textos exibidos na tela, sem repetir. */
@Component({
  selector: 'app-references',
  template: `
    @if (references().length) {
      <p><strong>Baseado em:</strong> {{ references().join('; ') }}.</p>
    }
  `,
  styles: `
    p {
      color: var(--color-text-tertiary);
      font-size: var(--text-caption);
      line-height: var(--line-height-body);
    }

    strong {
      font-weight: var(--font-weight-bold);
    }
  `,
})
export class References {
  /** Códigos dos textos da tela, na ordem em que aparecem. */
  readonly codes = input.required<readonly string[]>();

  private readonly content = inject(ContentService);
  protected readonly references = computed(() => [
    ...new Set(this.codes().flatMap((code) => this.content.entry(code)?.references ?? [])),
  ]);
}
