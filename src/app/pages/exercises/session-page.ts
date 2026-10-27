import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ExerciseCard } from './exercise-card';
import { prescribedExercises } from './exercise-catalog';
import { SAFETY_CODE } from './rocabado';

/**
 * Player da sessão: os exercícios prescritos, um por vez, e no fim o registro da sessão (EX-13).
 * A tela 7:1742 do contexto não está na página do Figma; segue o estilo dos cartões do 6x6.
 * A rota só abre com prescrição ativa (prescriptionGuard).
 */
@Component({
  selector: 'app-session-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe, ExerciseCard],
  template: `
    <app-page-header title="Sessão de exercícios" variant="internal" backTo="/exercicios/meus" />
    @if (sessionsToday() === null) {
      <div class="page">
        <div class="progress">
          <p class="progress-text">Exercício {{ index() + 1 }} de {{ total() }}</p>
          <div
            class="bar"
            role="progressbar"
            [attr.aria-valuenow]="index() + 1"
            aria-valuemin="1"
            [attr.aria-valuemax]="total()"
            aria-label="Progresso da sessão"
          >
            <span [style.width.%]="((index() + 1) / total()) * 100"></span>
          </div>
        </div>

        @if (index() === 0) {
          <p class="safety" role="note">
            <app-icon name="aviso" />
            <span>{{ safetyCode | content }}</span>
          </p>
        }

        <app-exercise-card
          #card
          [exercise]="current()"
          [position]="index() + 1"
          [total]="total()"
          [headingLevel]="1"
        />

        <div class="actions">
          @if (index() > 0) {
            <button type="button" class="btn-secondary" (click)="go(-1)">Anterior</button>
          }
          @if (isLast()) {
            <button type="button" class="btn-primary" (click)="finish()">Concluir sessão</button>
          } @else {
            <button type="button" class="btn-primary" (click)="go(1)">Próximo exercício</button>
          }
        </div>
      </div>
    } @else {
      <div class="page done">
        <span class="done-icon"><app-icon name="check-sessao" [size]="40" /></span>
        <p class="done-text" role="status">
          {{ 'EX-13' | content: 'text' : { n: sessionsToday()!, meta: perDay() } }}
        </p>
        <a class="btn-primary" routerLink="/exercicios">Voltar aos exercícios</a>
      </div>
    }
  `,
  styleUrl: './session-page.scss',
})
export class SessionPage {
  private readonly sessions = inject(ExerciseSessions);
  private readonly injector = inject(Injector);
  private readonly card = viewChild('card', { read: ElementRef });

  private readonly content = inject(ContentService);
  private readonly prescription = inject(PrescriptionStore);
  private readonly exercises = computed(() =>
    prescribedExercises(this.content, this.prescription.allowed()),
  );
  protected readonly total = computed(() => this.exercises().length);
  protected readonly perDay = computed(() => this.prescription.current()?.sessionsPerDay ?? 0);
  protected readonly safetyCode = SAFETY_CODE;
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.exercises()[this.index()]);
  protected readonly isLast = computed(() => this.index() === this.total() - 1);
  /** Preenchido ao concluir: quantas sessões a pessoa fez hoje. */
  protected readonly sessionsToday = signal<number | null>(null);

  protected go(step: 1 | -1): void {
    this.index.update((i) => i + step);
    globalThis.scrollTo?.({ top: 0 });
    // Leva o foco ao nome do novo exercício (leitores de tela anunciam a troca).
    afterNextRender(() => this.card()?.nativeElement.querySelector('h1')?.focus(), {
      injector: this.injector,
    });
  }

  protected async finish(): Promise<void> {
    this.sessionsToday.set(await this.sessions.record());
    globalThis.scrollTo?.({ top: 0 });
  }
}
