import { Component, inject, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Icon } from '../icon/icon';

/** Variantes do componente "Cabeçalho" (Figma 27:19). */
export type HeaderVariant = 'main' | 'internal' | 'sos' | 'onboarding';

/**
 * Cabeçalho das telas (Figma 27:19). Principal: telas das abas. Interna: telas com
 * voltar. SOS: fluxo de crise, com fechar. Onboarding: primeiro acesso, com o nome do app.
 * "Pular" aparece só quando showSkip = true.
 */
@Component({
  selector: 'app-page-header',
  imports: [Icon],
  template: `
    <header
      class="header"
      [class.sos]="variant() === 'sos'"
      [class.onboarding]="variant() === 'onboarding'"
    >
      @switch (variant()) {
        @case ('main') {
          <img class="logo" src="icons/icon.svg" alt="" width="32" height="32" />
        }
        @case ('onboarding') {
          <img class="logo" src="icons/icon.svg" alt="" width="32" height="32" />
        }
        @case ('internal') {
          <button type="button" class="round-button" (click)="goBack()" aria-label="Voltar">
            <app-icon name="voltar" />
          </button>
        }
        @case ('sos') {
          <button type="button" class="round-button" (click)="goBack()" aria-label="Fechar">
            <app-icon name="fechar" />
          </button>
        }
      }
      <p class="title">{{ title() }}</p>
      @if (showSkip()) {
        <button type="button" class="skip" (click)="skip.emit()">Pular</button>
      }
    </header>
  `,
  styleUrl: './page-header.scss',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly variant = input<HeaderVariant>('main');
  /** Para onde voltar quando a tela foi aberta direto (ex.: por uma notificação). */
  readonly backTo = input('/inicio');
  readonly showSkip = input(false);
  readonly skip = output<void>();

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected goBack(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigateByUrl(this.backTo());
    }
  }
}
