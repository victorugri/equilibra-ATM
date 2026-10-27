import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { Icon } from '../../shared/ui/icon/icon';
import { ListItem } from '../../shared/ui/list-item/list-item';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { References } from '../../shared/ui/references/references';
import { exerciseName, prescribedExercises } from './exercise-catalog';
import { PrescriptionInvite } from './prescription-invite';
import { ReminderSuggestion } from './reminder-suggestion';
import { SAFETY_CODE } from './rocabado';

const ORIGIN = 'EX-P05';
const NOTE_TITLE = 'EX-P06';

/**
 * Exercícios (Figma 7:1454). Só os que o dentista prescreveu (design/ajustes-tayna.md, seção 4);
 * sem prescrição, o convite para digitar o código.
 */
@Component({
  selector: 'app-exercises-page',
  imports: [
    RouterLink,
    DatePipe,
    PageHeader,
    Icon,
    ListItem,
    References,
    ContentPipe,
    PrescriptionInvite,
    ReminderSuggestion,
  ],
  templateUrl: './exercises-page.html',
  styleUrl: './exercises-page.scss',
})
export class ExercisesPage {
  private readonly sessions = inject(ExerciseSessions);
  private readonly content = inject(ContentService);
  protected readonly prescription = inject(PrescriptionStore);

  /** `?codigo=ABC234`, vindo do QR Code do dentista. */
  readonly codigo = input<string>();

  protected readonly safetyCode = SAFETY_CODE;
  protected readonly noteTitleCode = NOTE_TITLE;

  protected readonly current = computed(() =>
    this.prescription.active() ? this.prescription.current() : null,
  );
  protected readonly origin = computed(() =>
    this.content.get(ORIGIN, 'text', {
      nome: this.current()?.dentistName || 'seu dentista',
    }),
  );
  protected readonly exercises = computed(() =>
    prescribedExercises(this.content, this.prescription.allowed()).map((exercise, i) => ({
      ...exercise,
      n: i + 1,
      name: exerciseName(this.content, exercise.code),
    })),
  );
  protected readonly referenceCodes = computed(() => this.exercises().map((e) => e.code));
  protected readonly perDay = computed(() => this.current()?.sessionsPerDay ?? 0);

  protected readonly done = computed(() => this.sessions.today());
  protected readonly percent = computed(() =>
    this.perDay()
      ? Math.round((Math.min(this.done().length, this.perDay()) / this.perDay()) * 100)
      : 0,
  );
  /** Os círculos do dia (um por sessão prescrita): feita (com a hora), próxima ou pendente. */
  protected readonly slots = computed(() =>
    Array.from({ length: this.perDay() }, (_, i) => ({
      n: i + 1,
      doneAt: this.done()[i]?.at ?? null,
      isNext: i === this.done().length,
    })),
  );

  constructor() {
    this.sessions.refresh();
  }
}
