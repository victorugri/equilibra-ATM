import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Abas segmentadas do Diário: registro de hoje e evolução (Figma 7:2310 / 7:2851). */
@Component({
  selector: 'app-diary-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs" aria-label="Seções do diário">
      <a
        routerLink="/diario"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
        >Registro de hoje</a
      >
      <a routerLink="/diario/evolucao" routerLinkActive="active" ariaCurrentWhenActive="page"
        >Evolução</a
      >
    </nav>
  `,
  styles: `
    .tabs {
      display: flex;
      padding: var(--space-xs);
      border-radius: var(--radius-pill);
      background: var(--color-surface-light-alt);
    }

    a {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      min-height: var(--touch-target);
      border-radius: var(--radius-pill);
      color: var(--color-text-secondary);
      font-size: var(--text-label);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
      text-decoration: none;

      &.active {
        background: var(--color-surface);
        color: var(--color-primary);
        box-shadow: 0 1px 1px rgb(0 0 0 / 5%);
      }
    }
  `,
})
export class DiaryTabs {}
