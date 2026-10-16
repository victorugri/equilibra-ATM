import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';

/** Botão flutuante "SOS – Estou com dor", acima da barra inferior nas telas principais. */
@Component({
  selector: 'app-sos-button',
  imports: [RouterLink, Icon],
  template: `
    <a class="sos" routerLink="/sos" aria-label="SOS – Estou com dor">
      <app-icon name="sos" />
      <span class="text" aria-hidden="true">
        <span class="title">SOS</span>
        <span class="subtitle">Estou com dor</span>
      </span>
    </a>
  `,
  styles: `
    .sos {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: var(--button-height);
      padding: var(--space-md) var(--space-page);
      border-radius: var(--radius-pill);
      background: var(--color-sos-action);
      color: var(--color-on-sos);
      box-shadow: var(--shadow-sos);
      text-decoration: none;
    }

    .text {
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: var(--text-body-lg);
      font-weight: var(--font-weight-bold);
      line-height: 1;
      letter-spacing: 0.02em;
    }

    .subtitle {
      font-size: var(--text-caption);
      font-weight: var(--font-weight-semibold);
      line-height: 1.1;
      letter-spacing: 0.03em;
    }

    .sos:focus-visible {
      outline-color: var(--color-sos-action);
      outline-offset: 3px;
    }
  `,
})
export class SosButton {}
