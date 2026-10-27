import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { CareLog } from '../../core/data/care-log.service';
import { ContentBlock } from '../../shared/ui/content-block/content-block';
import { Disclaimer } from '../../shared/ui/disclaimer/disclaimer';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { References } from '../../shared/ui/references/references';
import { LEARN_MODULES } from './learn-modules';

/** Um módulo do Aprender (Figma 34:129 e seguintes; ver design/34-129-modulo.md). */
@Component({
  selector: 'app-module-page',
  imports: [RouterLink, PageHeader, ContentPipe, ContentBlock, References, Disclaimer],
  template: `
    <app-page-header title="Aprender" variant="internal" backTo="/aprender" />
    @let current = learnModule();
    <article class="page">
      <p class="badge">Módulo {{ current.n }} de {{ total }}</p>
      <h1>{{ current.title }}</h1>
      <p class="intro">{{ current.intro | content }}</p>

      <div class="blocks">
        @for (code of current.blocks; track code) {
          <app-content-block [code]="code" />
        }
      </div>

      <app-references [codes]="[current.intro, ...current.blocks]" />

      @if (next(); as next) {
        <a class="btn-primary" [routerLink]="'/aprender/modulo/' + next">Próximo módulo</a>
      } @else {
        <a class="btn-primary" routerLink="/aprender">Concluir</a>
      }
      <a class="btn-link" routerLink="/aprender">Voltar ao Aprender</a>

      @if (!current.hasDisclaimerBlock) {
        <app-disclaimer />
      }
    </article>
  `,
  styleUrl: './module-page.scss',
})
export class ModulePage {
  /** Número do módulo (vem de `data.module` da rota). */
  readonly module = input.required<number>();

  protected readonly total = LEARN_MODULES.length;
  protected readonly learnModule = computed(() => LEARN_MODULES[this.module() - 1]);
  protected readonly next = computed(() => (this.module() < this.total ? this.module() + 1 : null));

  constructor() {
    // Módulo aberto conta como lido para o Plano de hoje ("Ler o Módulo {n}").
    const careLog = inject(CareLog);
    effect(() => {
      const n = this.module();
      untracked(() => void careLog.markModuleRead(n));
    });
  }
}
