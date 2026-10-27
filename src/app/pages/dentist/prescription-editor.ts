import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { ContentService } from '../../core/content/content.service';
import { PrescriptionDraft } from '../../core/prescription/dentist.service';
import { availableExercises, exerciseName } from '../exercises/exercise-catalog';
import { PROGRAM_CODE } from '../exercises/rocabado';

const EMPTY_DRAFT: PrescriptionDraft = {
  exercises: [],
  sessionsPerDay: 2,
  remindersPerDay: 3,
  note: '',
  validUntil: '',
};

export const NOTE_MAX = 200;
const SESSIONS = [1, 2, 3, 4, 5, 6];
const REMINDERS = [0, 1, 2, 3, 4, 5, 6];

/** Formulário da prescrição: exercícios, sessões, lembretes, validade e recado (seção 4). */
@Component({
  selector: 'app-prescription-editor',
  template: `
    <form class="editor" (submit)="$event.preventDefault(); submit()">
      <fieldset class="field">
        <legend class="field-label">Exercícios</legend>
        @for (group of groups(); track group.id) {
          <div class="group">
            <div class="group-head">
              <h3>{{ group.title }}</h3>
              @if (group.id === 'rocabado') {
                <button type="button" class="link-button" (click)="toggleAll(group.codes)">
                  {{ allChecked(group.codes) ? 'Desmarcar os 6' : 'Marcar os 6' }}
                </button>
              }
            </div>
            @for (exercise of group.items; track exercise.code) {
              <label class="check">
                <input
                  type="checkbox"
                  [checked]="selected().has(exercise.code)"
                  (change)="toggle(exercise.code)"
                />
                <span>{{ exercise.name }}</span>
              </label>
            }
          </div>
        }
      </fieldset>

      <div class="row">
        <div class="field">
          <label class="field-label" for="sessions-per-day">Sessões por dia</label>
          <select
            id="sessions-per-day"
            class="select"
            [value]="draft().sessionsPerDay"
            (change)="set('sessionsPerDay', +$any($event.target).value)"
          >
            @for (n of sessionOptions; track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="reminders-per-day">Lembretes por dia</label>
          <select
            id="reminders-per-day"
            class="select"
            [value]="draft().remindersPerDay"
            (change)="set('remindersPerDay', +$any($event.target).value)"
          >
            @for (n of reminderOptions; track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </div>
      </div>
      <p class="field-help">
        Os lembretes são uma sugestão: o paciente decide se usa (no máximo 6 por dia).
      </p>

      <div class="field">
        <label class="field-label" for="valid-until">
          Válida até <span class="optional">Opcional</span>
        </label>
        <div class="input-box">
          <input
            id="valid-until"
            type="date"
            [value]="draft().validUntil"
            (input)="set('validUntil', $any($event.target).value)"
          />
        </div>
      </div>

      <div class="field">
        <label class="field-label" for="note">
          Recado para o paciente <span class="optional">Opcional</span>
        </label>
        <textarea
          id="note"
          class="textarea"
          rows="3"
          [attr.maxlength]="noteMax"
          aria-describedby="note-count"
          [value]="draft().note"
          (input)="set('note', $any($event.target).value)"
        ></textarea>
        <p class="field-help" id="note-count">
          {{ draft().note.length }} de {{ noteMax }} caracteres
        </p>
      </div>

      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <div class="actions">
        <button type="submit" class="btn-primary" [disabled]="busy()">
          {{ busy() ? 'Aguarde…' : initial() ? 'Salvar alterações' : 'Gerar código' }}
        </button>
        @if (initial()) {
          <button type="button" class="btn-outline" (click)="cancelled.emit()">Cancelar</button>
        }
      </div>
    </form>
  `,
  styleUrl: './dentist.scss',
})
export class PrescriptionEditor {
  private readonly content = inject(ContentService);

  /** Prescrição em edição; sem ela, cria uma nova. */
  readonly initial = input<PrescriptionDraft | null>(null);
  readonly busy = input(false);
  readonly error = input('');
  readonly saved = output<PrescriptionDraft>();
  readonly cancelled = output<void>();

  protected readonly noteMax = NOTE_MAX;
  protected readonly sessionOptions = SESSIONS;
  protected readonly reminderOptions = REMINDERS;

  protected readonly draft = linkedSignal(() => ({ ...(this.initial() ?? EMPTY_DRAFT) }));
  protected readonly selected = computed(() => new Set(this.draft().exercises));
  protected readonly groups = computed(() => {
    const all = availableExercises(this.content).map((exercise) => ({
      ...exercise,
      name: exerciseName(this.content, exercise.code),
    }));
    const rocabado = all.filter((e) => e.group === 'rocabado');
    return [
      {
        id: 'rocabado',
        title: this.content.get(PROGRAM_CODE, 'title'),
        items: rocabado,
        codes: rocabado.map((e) => e.code),
      },
      {
        id: 'other',
        title: 'Outros exercícios',
        items: all.filter((e) => e.group === 'other'),
        codes: [],
      },
    ];
  });
  /** Ordem do catálogo, para o paciente ver na mesma ordem que o dentista. */
  private readonly order = computed(() => this.groups().flatMap((g) => g.items.map((e) => e.code)));

  protected set<K extends keyof PrescriptionDraft>(key: K, value: PrescriptionDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected toggle(code: string): void {
    const selected = new Set(this.selected());
    if (selected.has(code)) selected.delete(code);
    else selected.add(code);
    this.setExercises(selected);
  }

  protected allChecked(codes: readonly string[]): boolean {
    return codes.length > 0 && codes.every((code) => this.selected().has(code));
  }

  protected toggleAll(codes: readonly string[]): void {
    const selected = new Set(this.selected());
    const check = !this.allChecked(codes);
    for (const code of codes) {
      if (check) selected.add(code);
      else selected.delete(code);
    }
    this.setExercises(selected);
  }

  protected submit(): void {
    this.saved.emit({ ...this.draft(), note: this.draft().note.trim() });
  }

  private setExercises(selected: Set<string>): void {
    this.set(
      'exercises',
      this.order().filter((code) => selected.has(code)),
    );
  }
}
