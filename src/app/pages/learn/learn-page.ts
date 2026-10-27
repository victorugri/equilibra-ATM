import { Component } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';
import { ListItem } from '../../shared/ui/list-item/list-item';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { LEARN_MODULES } from './learn-modules';

/** Aprender — lista dos 6 módulos (Figma 7:991; ver design/7-991-aprender.md). */
@Component({
  selector: 'app-learn-page',
  imports: [PageHeader, Icon, ListItem],
  template: `
    <app-page-header title="Aprender" />
    <div class="page">
      <section class="intro">
        <div class="heading">
          <span class="heading-icon"><app-icon name="livro" /></span>
          <h1>Aprender</h1>
        </div>
        <p class="subtitle">
          Conhecimento simples e prático para aliviar sua mandíbula no dia a dia.
        </p>
      </section>

      <section class="modules" aria-labelledby="modules-title">
        <div class="modules-header">
          <h2 id="modules-title">Módulos</h2>
          <span class="count">{{ modules.length }} módulos</span>
        </div>
        <p class="hint">
          <app-icon name="ordem" />
          Siga a ordem: primeiro entender, depois cuidar.
        </p>
        <ol class="list">
          @for (module of modules; track module.n) {
            <li>
              <app-list-item
                [number]="module.n"
                [title]="module.title"
                [link]="'/aprender/modulo/' + module.n"
              />
            </li>
          }
        </ol>
      </section>

      <p class="footnote">
        <app-icon name="check-rodape" />
        <span>Conteúdo baseado em revisão da literatura científica.</span>
      </p>
    </div>
  `,
  styleUrl: './learn-page.scss',
})
export class LearnPage {
  protected readonly modules = LEARN_MODULES;
}
