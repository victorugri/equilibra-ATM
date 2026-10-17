import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/** Texto de privacidade aceito no consentimento. */
export const PRIVACY_CODE = 'PER-01';

/** Entrada no app, etapa 1: privacidade e consentimento (Figma 7:300). */
@Component({
  selector: 'app-privacy-page',
  imports: [PageHeader, Icon, ContentPipe],
  template: `
    <app-page-header title="Equilibra ATM" variant="onboarding" />
    <div class="page">
      <p class="step-badge">Etapa 1 de 2</p>

      <section class="hero">
        <span class="seal" aria-hidden="true">
          <span class="seal-inner"><app-icon name="escudo-privacidade" /></span>
          <span class="seal-badge"><app-icon name="coracao" /></span>
        </span>
        <h1>Seus dados estão protegidos</h1>
        <p>
          Aqui você tem total controle sobre sua privacidade e saúde. Sem termos complicados, com
          respeito ao seu bem-estar.
        </p>
      </section>

      <section class="card" aria-labelledby="privacy-title">
        <span class="card-icon"><app-icon name="privacidade-cadeado" /></span>
        <div>
          <h2 id="privacy-title">Como cuidamos dos seus dados</h2>
          <p>{{ privacyCode | content }}</p>
        </div>
      </section>

      <p class="note">
        <span class="note-icon"><app-icon name="nota-escudo" /></span>
        <span>{{ 'APR-18' | content }}</span>
      </p>

      <button type="button" class="btn-primary" [disabled]="saving()" (click)="accept()">
        Concordo e continuar
        <app-icon name="seta-botao" />
      </button>
    </div>
  `,
  styleUrl: './onboarding.scss',
})
export class PrivacyPage {
  private readonly profile = inject(ProfileStore);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);

  protected readonly privacyCode = PRIVACY_CODE;
  protected readonly saving = signal(false);

  protected async accept(): Promise<void> {
    this.saving.set(true);
    await this.profile.acceptConsent(PRIVACY_CODE, this.content.version());
    await this.router.navigateByUrl('/boas-vindas/apresentacao');
  }
}
