import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { CheckinStore } from '../../core/reminders/checkins.service';
import { JawState, parseCheckinQuestion } from '../../core/reminders/jaw-states';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { PageHeader } from '../../shared/ui/page-header/page-header';

const QUESTION = 'LEM-02';
/** "Exercícios do seu dentista — {x} de {n} sessões" (a mesma linha da notificação). */
const EXERCISE = 'INI-P03';
const ICONS: Record<JawState, IconName> = {
  relaxed: 'mandibula-relaxada',
  touching: 'mandibula-encostando',
  clenching: 'mandibula-apertando',
  tense: 'mandibula-tensa',
};

/**
 * Check-in rápido (Figma 7:2020): aberto pela notificação do lembrete. A resposta fica no
 * aparelho e vai para a conta; é a medida de adesão aos lembretes da pesquisa.
 */
@Component({
  selector: 'app-checkin-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe],
  template: `
    <app-page-header title="Check-in rápido" variant="internal" backTo="/inicio" />
    <div class="page">
      <div class="top">
        <span class="fast"><app-icon name="checkin-rapido" />Check-in em 3 segundos</span>
        @if (!answer()) {
          <button type="button" class="skip" (click)="skip()">
            Pular
            <app-icon name="fechar" [size]="11" />
          </button>
        }
      </div>

      <fieldset class="question">
        <legend>
          <span class="question-title">{{ question.question }}</span>
          <span class="question-help">Toque no que você sente agora. Sem julgamento.</span>
        </legend>
        @for (option of question.options; track option.value) {
          <label
            class="option"
            [class.selected]="answer() === option.value"
            [class.alert]="isAlert(option.value)"
          >
            <input
              type="radio"
              name="jaw-state"
              [value]="option.value"
              [checked]="answer() === option.value"
              [disabled]="!!answer()"
              (change)="choose(option.value)"
            />
            <span class="option-icon"><app-icon [name]="icons[option.value]" /></span>
            <span class="option-label">{{ option.label }}</span>
            <span class="radio" aria-hidden="true">
              @if (answer() === option.value) {
                <app-icon name="opcao-check" />
              }
            </span>
          </label>
        }
      </fieldset>

      <div aria-live="polite">
        @if (answer()) {
          <div class="feedback">
            <section class="tip" aria-labelledby="tip-title">
              <p class="tip-title" id="tip-title">
                <span class="tip-icon"><app-icon name="dica-lampada" /></span>
                Dica:
              </p>
              <p class="tip-text">{{ 'LEM-04' | content }}</p>
              <p class="tip-note">
                <app-icon name="comendo-falando" />
                <span>{{ 'LEM-03' | content }}</span>
              </p>
            </section>

            <!-- Exercício só com prescrição do dentista (design/ajustes-tayna.md, seção 4). -->
            @if (exercise(); as exercise) {
              <section class="exercise" aria-labelledby="exercise-title">
                <p class="exercise-title" id="exercise-title">
                  <app-icon name="exercicio-rapido" />
                  {{ exerciseCode | content: 'title' }}
                </p>
                <p>{{ exerciseCode | content: 'body' : exercise }}</p>
                <a class="btn-outline" routerLink="/exercicios/sessao">Fazer a sessão agora</a>
              </section>
            }

            <button type="button" class="btn-primary done" (click)="done()">
              <app-icon name="check-circulo" />
              {{ recorded() ? 'Salvo! Voltar ao que estava fazendo' : 'Voltar ao início' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './checkin-page.scss',
})
export class CheckinPage {
  /** Id do lembrete (?e=… na notificação). */
  readonly e = input<string>();

  private readonly checkins = inject(CheckinStore);
  private readonly router = inject(Router);

  protected readonly question = parseCheckinQuestion(inject(ContentService).get(QUESTION));
  protected readonly icons = ICONS;
  protected readonly exerciseCode = EXERCISE;
  private readonly prescription = inject(PrescriptionStore);
  private readonly sessions = inject(ExerciseSessions);
  /** Sessões de hoje, se há prescrição e ainda falta sessão; senão null. */
  protected readonly exercise = computed(() => {
    const goal = this.prescription.active() ? this.prescription.current()?.sessionsPerDay : null;
    const done = this.sessions.today().length;
    return goal && done < goal ? { x: done, n: goal } : null;
  });
  protected readonly answer = signal<JawState | null>(null);
  private readonly eventId = computed(() => {
    const id = this.e();
    return CheckinStore.isEventId(id) ? id : null;
  });
  /** Veio de um lembrete: a resposta é registrada. */
  protected readonly recorded = computed(() => this.eventId() !== null);

  constructor() {
    effect(() => {
      const id = this.eventId();
      if (id) untracked(() => void this.open(id));
    });
  }

  protected isAlert(state: JawState): boolean {
    return state === 'clenching' || state === 'tense';
  }

  protected async choose(state: JawState): Promise<void> {
    if (this.answer()) return;
    this.answer.set(state);
    const id = this.eventId();
    if (id) await this.checkins.answer(id, state);
  }

  protected async skip(): Promise<void> {
    const id = this.eventId();
    if (id) await this.checkins.skip(id);
    await this.router.navigateByUrl('/inicio');
  }

  protected async done(): Promise<void> {
    await this.router.navigateByUrl('/inicio');
  }

  private async open(id: string): Promise<void> {
    const checkin = await this.checkins.open(id);
    if (checkin.answer) this.answer.set(checkin.answer);
  }
}
