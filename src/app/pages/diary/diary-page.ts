import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content/content.service';
import { YesNo } from '../../core/data/app-database';
import { averagePain, dailySeries } from '../../core/data/diary-stats';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { ProfileStore } from '../../core/data/profile.service';
import { ChoiceGroup, ChoiceOption } from '../../shared/ui/choice-group/choice-group';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PainScale } from '../../shared/ui/pain-scale/pain-scale';
import { DiaryTabs } from './diary-tabs';
import { PAIN_QUESTION, splitQuestion } from './pain-question';
import { WeekChart } from './week-chart';
import { formatPain } from './weekday';

const YES_NO: ChoiceOption<'yes' | 'no'>[] = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
];

/** Texto da média semanal. */
const WEEK_AVERAGE = 'INI-03';

/**
 * Diário — registro do dia, na versão enxuta aprovada (seção 6 do contexto):
 * dor 0–10, três respostas rápidas, observação opcional e o mini gráfico de 7 dias.
 */
@Component({
  selector: 'app-diary-page',
  imports: [RouterLink, DatePipe, PageHeader, Icon, DiaryTabs, PainScale, ChoiceGroup, WeekChart],
  templateUrl: './diary-page.html',
  styleUrl: './diary-page.scss',
})
export class DiaryPage {
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);
  private readonly content = inject(ContentService);

  protected readonly today = new Date();
  protected readonly yesNo = YES_NO;
  private readonly profile = inject(ProfileStore);
  protected readonly askSplint = computed(() => this.profile.profile().usesSplint !== 'no');
  protected readonly splintOptions: ChoiceOption<'yes' | 'no' | 'not-used'>[] = [
    ...YES_NO,
    { value: 'not-used', label: 'Não uso' },
  ];

  /** "Quanto está doendo agora? (0 = nenhuma dor; 10 = …)" → pergunta e explicação. */
  protected readonly question = splitQuestion(this.content.get(PAIN_QUESTION));

  // Formulário: um registro por dia. Se hoje já tem, vem preenchido e salvar o atualiza.
  private readonly todayEntry = this.diary.today;
  protected readonly pain = linkedSignal<number | null>(() => this.todayEntry()?.pain ?? null);
  protected readonly exercises = linkedSignal<YesNo>(() => this.todayEntry()?.exercises ?? null);
  protected readonly splint = linkedSignal<YesNo | 'not-used'>(
    () => this.todayEntry()?.splint ?? null,
  );
  protected readonly sleptWell = linkedSignal<YesNo>(() => this.todayEntry()?.sleptWell ?? null);
  protected readonly note = linkedSignal(() => this.todayEntry()?.note ?? '');
  protected readonly error = signal('');
  protected readonly saving = signal(false);
  protected readonly savedAt = signal<Date | null>(null);
  /** O último envio substituiu um registro do dia. */
  protected readonly updated = signal(false);

  protected readonly registeredToday = this.diary.hasEntryToday;
  protected readonly week = computed(() =>
    dailySeries(this.diary.entries(), this.sessions.all(), 7, new Date()),
  );
  protected readonly weekAverage = computed(() => {
    const average = averagePain(this.week());
    const entry = this.content.entry(WEEK_AVERAGE);
    return average === null || !entry
      ? null
      : {
          title: entry.title,
          text: this.content.get(WEEK_AVERAGE, 'body', { x: formatPain(average) }),
        };
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const pain = this.pain();
    if (pain === null) {
      this.error.set('Escolha um número de 0 a 10 para a sua dor.');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    const replacing = this.registeredToday();
    try {
      // O formulário continua mostrando o que foi salvo (linkedSignal segue o registro do dia).
      const entry = await this.diary.add({
        pain,
        exercises: this.exercises(),
        splint: this.splint(),
        sleptWell: this.sleptWell(),
        note: this.note(),
      });
      this.updated.set(replacing);
      this.savedAt.set(entry.at);
    } catch {
      this.error.set('Não foi possível salvar. Tente de novo.');
    } finally {
      this.saving.set(false);
    }
  }
}
