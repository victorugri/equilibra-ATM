import { Component } from '@angular/core';
import { ContentPipe } from '../../../core/content/content.pipe';

/** Aviso fixo APR-18: vai nas telas de conteúdo e no onboarding. */
@Component({
  selector: 'app-disclaimer',
  imports: [ContentPipe],
  template: `<p role="note">{{ 'APR-18' | content }}</p>`,
  styles: `
    p {
      padding: var(--space-lg);
      border-radius: var(--radius-sm);
      background: var(--color-surface-light);
      color: var(--color-text-secondary);
    }
  `,
})
export class Disclaimer {}
