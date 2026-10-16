import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { Icon } from '../../shared/ui/icon/icon';
import { ListItem } from '../../shared/ui/list-item/list-item';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { References } from '../../shared/ui/references/references';
import { PROGRAM_CODE, ROCABADO_EXERCISES, SAFETY_CODE, SESSIONS_PER_DAY } from './rocabado';

/** Exercícios — cartão do 6x6 com o progresso do dia e a lista dos exercícios (Figma 7:1454). */
@Component({
  selector: 'app-exercises-page',
  imports: [RouterLink, DatePipe, PageHeader, Icon, ListItem, References, ContentPipe],
  templateUrl: './exercises-page.html',
  styleUrl: './exercises-page.scss',
})
export class ExercisesPage {
  private readonly sessions = inject(ExerciseSessions);
  private readonly content = inject(ContentService);

  protected readonly programCode = PROGRAM_CODE;
  protected readonly safetyCode = SAFETY_CODE;
  protected readonly perDay = SESSIONS_PER_DAY;
  protected readonly exercises = ROCABADO_EXERCISES.map((exercise) => ({
    ...exercise,
    name: this.content.get(exercise.code, 'title'),
  }));
  protected readonly referenceCodes = [PROGRAM_CODE, ...ROCABADO_EXERCISES.map((e) => e.code)];

  protected readonly done = computed(() => this.sessions.today());
  protected readonly percent = computed(() =>
    Math.round((Math.min(this.done().length, SESSIONS_PER_DAY) / SESSIONS_PER_DAY) * 100),
  );
  /** Os 6 círculos do dia: feita (com a hora), próxima ou pendente. */
  protected readonly slots = computed(() =>
    Array.from({ length: SESSIONS_PER_DAY }, (_, i) => ({
      n: i + 1,
      doneAt: this.done()[i]?.at ?? null,
      isNext: i === this.done().length,
    })),
  );

  constructor() {
    this.sessions.refresh();
  }
}
