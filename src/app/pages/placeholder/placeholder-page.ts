import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScreenData } from '../../layout/screen';
import { Disclaimer } from '../../shared/ui/disclaimer/disclaimer';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/**
 * Tela provisória da fase 1: mostra o título e o frame do Figma correspondente.
 * Cada rota troca este componente pela tela real nas próximas fases.
 */
@Component({
  selector: 'app-placeholder-page',
  imports: [PageHeader, Disclaimer],
  template: `
    <app-page-header
      [title]="title"
      [variant]="screen.backTo ? 'internal' : 'main'"
      [backTo]="screen.backTo ?? '/inicio'"
    />
    <h1 class="visually-hidden">{{ title }}</h1>
    <section class="content">
      <div class="card">
        <p class="status">Tela em construção</p>
        @if (screen.figma) {
          <p class="figma">Figma: nó {{ screen.figma }}</p>
        }
      </div>
      @if (screen.disclaimer) {
        <app-disclaimer />
      }
    </section>
  `,
  styles: `
    .content {
      display: grid;
      gap: var(--space-lg);
      padding: 0 var(--space-page) var(--space-xl);
    }

    .card {
      padding: var(--space-xl) var(--space-lg);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }

    .status {
      font-weight: var(--font-weight-bold);
    }

    .figma {
      color: var(--color-text-tertiary);
      font-size: var(--text-caption);
    }
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = this.route.snapshot.title ?? '';
  protected readonly screen = this.route.snapshot.data as ScreenData;
}
