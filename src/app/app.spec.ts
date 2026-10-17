import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { SUPABASE_CONFIG } from './core/auth/auth.service';
import { APP_DATABASE, AppDatabase } from './core/data/app-database';

let counter = 0;

describe('App (shell)', () => {
  async function open(url: string, { onboardingDone = true } = {}) {
    const db = new AppDatabase(`app-spec-${++counter}`);
    if (onboardingDone)
      await db.meta.put({ key: 'onboarding', value: { completedAt: new Date() } });
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: APP_DATABASE, useValue: db },
        // Sem Supabase nos testes: o app funciona sem conta.
        { provide: SUPABASE_CONFIG, useValue: null },
      ],
    });
    const fixture = TestBed.createComponent(App);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, router: TestBed.inject(Router) };
  }

  it('mostra as 5 abas e o SOS nas telas principais', async () => {
    const { el } = await open('/inicio');
    const tabs = [...el.querySelectorAll('app-tab-bar a')].map((a) => a.textContent?.trim());
    expect(tabs).toEqual(['Início', 'Aprender', 'Exercícios', 'Diário', 'Perfil']);
    expect(el.querySelector('app-sos-button a')?.getAttribute('href')).toBe('/sos');
  });

  it('esconde a barra e o SOS na própria tela de SOS', async () => {
    const { el } = await open('/sos');
    expect(el.querySelector('app-tab-bar')).toBeNull();
    expect(el.querySelector('app-sos-button')).toBeNull();
  });

  it('no primeiro acesso leva para a entrada no app, mas o SOS continua liberado', async () => {
    const first = await open('/inicio', { onboardingDone: false });
    expect(first.router.url).toBe('/boas-vindas');

    TestBed.resetTestingModule();
    const sos = await open('/sos', { onboardingDone: false });
    expect(sos.router.url).toBe('/sos');
  });
});
