import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { References } from '../../shared/ui/references/references';
import { ExerciseCard } from './exercise-card';
import { prescribedExercises } from './exercise-catalog';
import { SAFETY_CODE } from './rocabado';

const ORIGIN = 'EX-P05';

/**
 * Os exercícios prescritos, com vídeo e passo a passo (Figma 37:210). A rota só abre com
 * prescrição ativa (prescriptionGuard).
 */
@Component({
  selector: 'app-program-page',
  imports: [RouterLink, PageHeader, Icon, References, ContentPipe, ExerciseCard],
  template: `
    <app-page-header title="Exercícios" variant="internal" backTo="/exercicios" />
    <div class="page">
      <section class="hero">
        <img class="ellipse" src="images/destaque-elipse.svg" width="170" height="170" alt="" />
        <span class="tag">Indicação do dentista</span>
        <h1>{{ origin() }}</h1>
        <ul class="posology" aria-label="Posologia">
          <li>
            <strong>{{ exercises().length }}</strong>
            <span>{{ exercises().length === 1 ? 'exercício' : 'exercícios' }}</span>
          </li>
          <li>
            <strong>{{ perDay() }}×</strong> <span>ao dia</span>
          </li>
        </ul>
      </section>

      <aside class="safety" aria-labelledby="safety-title">
        <span class="safety-icon"><app-icon name="aviso" /></span>
        <div>
          <h2 id="safety-title">Com cuidado</h2>
          <p>{{ safetyCode | content }}</p>
        </div>
      </aside>

      @for (exercise of exercises(); track exercise.code; let i = $index) {
        <app-exercise-card
          [id]="'exercicio-' + (i + 1)"
          [exercise]="exercise"
          [position]="i + 1"
          [total]="exercises().length"
        />
      }

      <app-references class="references" [codes]="referenceCodes()" />

      <a class="btn-primary start" routerLink="/exercicios/sessao">
        <app-icon name="play" />
        Começar sessão
      </a>
    </div>
  `,
  styleUrl: './program-page.scss',
})
export class ProgramPage {
  private readonly content = inject(ContentService);
  private readonly prescription = inject(PrescriptionStore);

  protected readonly safetyCode = SAFETY_CODE;
  protected readonly exercises = computed(() =>
    prescribedExercises(this.content, this.prescription.allowed()),
  );
  protected readonly referenceCodes = computed(() => this.exercises().map((e) => e.code));
  protected readonly perDay = computed(() => this.prescription.current()?.sessionsPerDay ?? 0);
  protected readonly origin = computed(() =>
    this.content.get(ORIGIN, 'text', {
      nome: this.prescription.current()?.dentistName || 'seu dentista',
    }),
  );
}
