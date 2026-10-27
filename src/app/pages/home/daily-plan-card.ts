import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { CareLog } from '../../core/data/care-log.service';
import { dayKey } from '../../core/data/day';
import { PainDiary } from '../../core/data/pain-diary.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PlanItem, dailyPlan } from '../../core/plan/daily-plan';
import { PrescriptionStore } from '../../core/prescription/prescription.service';
import { Icon } from '../../shared/ui/icon/icon';
import { LEARN_MODULES } from '../learn/learn-modules';

const TITLE = 'INI-P01';
const ALL_DONE = 'INI-P07';

interface PlanItemView extends PlanItem {
  title: string;
  detail: string;
}

/** Plano de hoje: até 3 tarefas no Início (design/ajustes-tayna.md, seção 5). */
@Component({
  selector: 'app-daily-plan-card',
  imports: [NgTemplateOutlet, RouterLink, Icon, ContentPipe],
  template: `
    <section class="plan" aria-labelledby="plan-title">
      <header class="plan-header">
        <h2 id="plan-title">{{ titleCode | content }}</h2>
        <span class="count" aria-live="polite">
          {{ doneCount() }} de {{ items().length }}<span class="visually-hidden"> feitos</span>
        </span>
      </header>
      <ul class="items">
        @for (item of items(); track item.kind) {
          <li class="item" [class.done]="item.done">
            @if (item.route) {
              <a class="row" [routerLink]="item.route" [queryParams]="item.query">
                <ng-container *ngTemplateOutlet="texts; context: { $implicit: item }" />
                <app-icon name="chevron" class="arrow" />
              </a>
            } @else {
              <!-- Depois do "Fiz" o botão some: o foco fica na linha, sem cair no topo da página. -->
              <div class="row" tabindex="-1" #tipRow>
                <ng-container *ngTemplateOutlet="texts; context: { $implicit: item }" />
                @if (!item.done) {
                  <button type="button" class="mark" (click)="markTip(tipRow)">
                    Fiz<span class="visually-hidden">: {{ item.title }}</span>
                  </button>
                }
              </div>
            }
          </li>
        }
      </ul>

      <ng-template #texts let-item>
        <span class="check" aria-hidden="true">
          @if (item.done) {
            <app-icon name="check" [size]="14" />
          }
        </span>
        <span class="texts">
          <span class="title">
            @if (item.done) {
              <span class="visually-hidden">Feito: </span>
            }
            {{ item.title }}
          </span>
          <span class="detail">{{ item.detail }}</span>
        </span>
      </ng-template>
      @if (allDone()) {
        <p class="all-done">{{ allDoneCode | content }}</p>
      }
    </section>
  `,
  styleUrl: './daily-plan-card.scss',
})
export class DailyPlanCard {
  private readonly content = inject(ContentService);
  private readonly diary = inject(PainDiary);
  private readonly careLog = inject(CareLog);
  private readonly sessions = inject(ExerciseSessions);
  private readonly prescription = inject(PrescriptionStore);

  protected readonly titleCode = TITLE;
  protected readonly allDoneCode = ALL_DONE;

  protected readonly items = computed<PlanItemView[]>(() => {
    const today = new Date();
    const key = dayKey(today);
    // Registros em ordem: o último de hoje é a nota que vale.
    const last = this.diary.last();
    const painToday = last && dayKey(last.at) === key ? last : null;
    const plan = dailyPlan({
      today,
      painToday: painToday?.pain ?? null,
      care: this.careLog.data(),
      moduleCount: LEARN_MODULES.length,
      sessionsGoal: this.prescription.active()
        ? (this.prescription.current()?.sessionsPerDay ?? null)
        : null,
      sessionsToday: this.sessions.today().length,
    });
    return plan.map((item) => ({
      ...item,
      title: this.content.get(item.code, 'title', item.module ? { n: item.module } : undefined),
      detail:
        item.kind === 'pain' && painToday
          ? `Registrado: ${painToday.pain}/10`
          : this.content.get(
              item.code,
              'body',
              item.progress ? { x: item.progress.done, n: item.progress.goal } : undefined,
            ),
    }));
  });

  protected readonly doneCount = computed(() => this.items().filter((item) => item.done).length);
  protected readonly allDone = computed(() => this.doneCount() === this.items().length);

  protected async markTip(row: HTMLElement): Promise<void> {
    row.focus();
    await this.careLog.markTip();
  }
}
