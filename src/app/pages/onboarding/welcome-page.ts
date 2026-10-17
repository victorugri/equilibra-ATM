import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { PageHeader } from '../../shared/ui/page-header/page-header';

interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

/** Entrada no app, etapa 2: o que o app oferece (Figma 7:409). */
@Component({
  selector: 'app-welcome-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe],
  template: `
    <app-page-header title="Equilibra ATM" variant="onboarding" [showSkip]="true" (skip)="skip()" />
    <div class="page">
      <p class="step-badge">Etapa 2 de 2</p>

      <section class="intro">
        <h1>Cuidar da sua mandíbula pode ser <span class="highlight">simples</span></h1>
        <p>
          Um espaço diário para cuidar da sua mandíbula entre as consultas com seu dentista:
          lembretes, exercícios e informações com base científica.
        </p>
      </section>

      <ul class="features">
        @for (feature of features; track feature.title) {
          <li>
            <span class="feature-icon"><app-icon [name]="feature.icon" /></span>
            <span>
              <strong>{{ feature.title }}</strong>
              <span class="feature-text">{{ feature.text }}</span>
            </span>
          </li>
        }
      </ul>

      <p class="note">
        <span class="note-icon"><app-icon name="selo-verificado" /></span>
        <span>{{ 'APR-18' | content }}</span>
      </p>

      <a class="btn-primary start" routerLink="/conta/criar">
        Começar
        <app-icon name="seta-botao" />
      </a>
      <p class="hint">Leva menos de 2 minutos para calibrar seu perfil</p>
    </div>
  `,
  styleUrl: './onboarding.scss',
})
export class WelcomePage {
  private readonly profile = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly features: Feature[] = [
    {
      icon: 'exercicio-guiado',
      title: 'Exercícios guiados',
      text: 'Exercícios descritos na literatura científica, passo a passo',
    },
    {
      icon: 'lembrete',
      title: 'Lembretes gentis no dia',
      text: 'Pausas conscientes para desencostar os dentes',
    },
    {
      icon: 'evolucao',
      title: 'Acompanhe sua evolução',
      text: 'Registre sua dor e acompanhe a evolução',
    },
  ];

  /** "Pular": entra no app sem conta. */
  protected async skip(): Promise<void> {
    await this.profile.completeOnboarding();
    await this.router.navigateByUrl('/inicio');
  }
}
