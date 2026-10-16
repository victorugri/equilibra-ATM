import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { References } from '../../shared/ui/references/references';
import { ExerciseCard } from './exercise-card';
import { PROGRAM_CODE, ROCABADO_EXERCISES, SAFETY_CODE } from './rocabado';

/** Programa 6x6 de Rocabado — os 6 exercícios com vídeo e passo a passo (Figma 37:210). */
@Component({
  selector: 'app-program-page',
  imports: [RouterLink, PageHeader, Icon, References, ContentPipe, ExerciseCard],
  template: `
    <app-page-header title="Exercícios" variant="internal" backTo="/exercicios" />
    <div class="page">
      <section class="hero">
        <img class="ellipse" src="images/destaque-elipse.svg" width="170" height="170" alt="" />
        <span class="tag">Protocolo domiciliar</span>
        <h1>{{ programCode | content: 'title' }}</h1>
        <ul class="posology" aria-label="Posologia">
          <li><strong>6</strong> <span>exercícios</span></li>
          <li><strong>6</strong> <span>repetições</span></li>
          <li><strong>6×</strong> <span>ao dia</span></li>
        </ul>
      </section>

      <aside class="safety" aria-labelledby="safety-title">
        <span class="safety-icon"><app-icon name="aviso" /></span>
        <div>
          <h2 id="safety-title">Com cuidado</h2>
          <p>{{ safetyCode | content }}</p>
        </div>
      </aside>

      @for (exercise of exercises; track exercise.n) {
        <app-exercise-card [id]="'exercicio-' + exercise.n" [exercise]="exercise" />
      }

      <app-references class="references" [codes]="referenceCodes" />

      <a class="btn-primary start" routerLink="/exercicios/6x6/sessao">
        <app-icon name="play" />
        Começar sessão
      </a>
    </div>
  `,
  styleUrl: './program-page.scss',
})
export class ProgramPage {
  protected readonly programCode = PROGRAM_CODE;
  protected readonly safetyCode = SAFETY_CODE;
  protected readonly exercises = ROCABADO_EXERCISES;
  protected readonly referenceCodes = [PROGRAM_CODE, ...ROCABADO_EXERCISES.map((e) => e.code)];
}
