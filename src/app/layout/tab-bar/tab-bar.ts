import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';

interface Tab {
  path: string;
  label: string;
  icon: IconName;
}

/** Navegação inferior com as 5 abas principais (Figma: "Nav"). */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav class="tab-bar" aria-label="Navegação principal">
      @for (tab of tabs; track tab.path) {
        <a
          class="tab"
          [routerLink]="tab.path"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <span class="icon-pill">
            <app-icon [name]="tab.icon" />
          </span>
          <span class="label">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './tab-bar.scss',
})
export class TabBar {
  protected readonly tabs: Tab[] = [
    { path: '/inicio', label: 'Início', icon: 'nav-inicio' },
    { path: '/aprender', label: 'Aprender', icon: 'nav-aprender' },
    { path: '/exercicios', label: 'Exercícios', icon: 'nav-exercicios' },
    { path: '/diario', label: 'Diário', icon: 'nav-diario' },
    { path: '/perfil', label: 'Perfil', icon: 'nav-perfil' },
  ];
}
