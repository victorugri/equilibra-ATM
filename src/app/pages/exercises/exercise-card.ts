import { Component, computed, inject, input } from '@angular/core';
import { ContentService } from '../../core/content/content.service';
import { StepList } from '../../shared/ui/step-list/step-list';
import { VideoSlot } from '../../shared/ui/video-slot/video-slot';
import { exerciseName, exerciseText } from './exercise-catalog';
import { splitSteps } from './exercise-steps';

/** Cartão de um exercício: vídeo, "Como fazer" e repetições (Figma 37:210). */
@Component({
  selector: 'app-exercise-card',
  imports: [VideoSlot, StepList],
  template: `
    <div class="title-row">
      <span class="number" aria-hidden="true">{{ position() }}</span>
      <div class="titles">
        <p class="label">Exercício {{ position() }} de {{ total() }}</p>
        @if (headingLevel() === 1) {
          <h1 class="name" tabindex="-1">{{ name() }}</h1>
        } @else {
          <h2 class="name">{{ name() }}</h2>
        }
      </div>
    </div>
    <app-video-slot [caption]="caption()" [src]="exercise().video" />
    <p class="how">Como fazer</p>
    <app-step-list [steps]="steps().steps" />
    @if (steps().repetitions; as repetitions) {
      <p class="reps"><span aria-hidden="true">↻</span> {{ repetitions }}</p>
    }
  `,
  styleUrl: './exercise-card.scss',
})
export class ExerciseCard {
  readonly exercise = input.required<{ code: string; video: string | null }>();
  /** Posição na lista do paciente (1 = primeiro). */
  readonly position = input.required<number>();
  readonly total = input.required<number>();
  /** 1 no player (o exercício é o assunto da tela); 2 na lista. */
  readonly headingLevel = input<1 | 2>(2);

  private readonly content = inject(ContentService);
  protected readonly name = computed(() => exerciseName(this.content, this.exercise().code));
  protected readonly steps = computed(() =>
    splitSteps(exerciseText(this.content, this.exercise().code)),
  );
  protected readonly caption = computed(() => `Exercício ${this.position()} · ${this.name()}`);
}
