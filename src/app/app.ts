import { Component, computed, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppUsage } from './core/data/app-usage.service';
import { ScreenData, deepestScreenData } from './layout/screen';
import { SosButton } from './layout/sos-button/sos-button';
import { TabBar } from './layout/tab-bar/tab-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabBar, SosButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.with-tab-bar]': 'showTabBar()',
    '[class.with-sos]': 'showSos()',
  },
})
export class App {
  private readonly router = inject(Router);

  private readonly screen = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestScreenData(this.router.routerState.snapshot.root)),
    ),
    // Antes da primeira navegação, nada de barra nem SOS (evita piscar no onboarding).
    { initialValue: { tabBar: false, sos: false } satisfies ScreenData },
  );

  protected readonly showTabBar = computed(() => this.screen().tabBar ?? true);
  protected readonly showSos = computed(() => this.screen().sos ?? true);

  constructor() {
    // Âncoras (ex.: #exercicio-3) param abaixo do cabeçalho fixo de 64 px, com respiro.
    inject(ViewportScroller).setOffset([0, 80]);
    // Registra o primeiro acesso (conta os "Dias se cuidando" do Início).
    inject(AppUsage);
  }
}
