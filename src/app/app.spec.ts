import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App (shell)', () => {
  async function open(url: string) {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(App);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra as 5 abas e o SOS nas telas principais', async () => {
    const el = await open('/inicio');
    const tabs = [...el.querySelectorAll('app-tab-bar a')].map((a) => a.textContent?.trim());
    expect(tabs).toEqual(['Início', 'Aprender', 'Exercícios', 'Diário', 'Perfil']);
    expect(el.querySelector('app-sos-button a')?.getAttribute('href')).toBe('/sos');
  });

  it('esconde a barra e o SOS na própria tela de SOS', async () => {
    const el = await open('/sos');
    expect(el.querySelector('app-tab-bar')).toBeNull();
    expect(el.querySelector('app-sos-button')).toBeNull();
  });
});
