import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import { AppUsage } from '../../core/data/app-usage.service';
import { daysBetween } from '../../core/data/day';
import { averagePain, dailySeries } from '../../core/data/diary-stats';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { Indicator, IndicatorTone } from '../../shared/ui/indicator/indicator';
import { IndicatorVars, indicatorParts } from '../../shared/ui/indicator/indicator-text';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { formatPain } from '../diary/weekday';

const DAYS = 'INI-01';
const LAST_PAIN = 'INI-02';
const WEEK_AVERAGE = 'INI-03';
const NEXT_REMINDER = 'INI-04';
const REGISTER_BUTTON = 'INI-05';
const TIP = 'INI-06';

interface IndicatorView {
  tone: IndicatorTone;
  label: string;
  value: string;
  unit: string;
  detail: string;
}

/** Início — painel com saudação, 4 indicadores e dica do dia (Figma 7:36). */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PageHeader, Icon, Indicator, ContentPipe],
  providers: [DatePipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly content = inject(ContentService);
  private readonly diary = inject(PainDiary);
  private readonly sessions = inject(ExerciseSessions);
  private readonly usage = inject(AppUsage);
  private readonly datePipe = inject(DatePipe);

  private readonly now = new Date();
  protected readonly tipCode = TIP;
  private readonly nickname = inject(ProfileStore).nickname;
  /** "Boa tarde, Maria!" (com apelido) ou "Boa tarde!". */
  protected readonly greeting = computed(() => {
    const name = this.nickname();
    return `${greetingFor(this.now)}${name ? ', ' + name : ''}!`;
  });
  protected readonly weekday = capitalize(this.datePipe.transform(this.now, 'EEEE') ?? '');
  /** Botões não levam ponto final ("Registrar minha dor de hoje."). */
  protected readonly registerLabel = this.content.get(REGISTER_BUTTON).replace(/\.$/, '');

  protected readonly indicators = computed<IndicatorView[]>(() => {
    const days = this.usage.daysUsing();
    const last = this.diary.last();
    const average = averagePain(
      dailySeries(this.diary.entries(), this.sessions.all(), 7, new Date()),
    );
    return [
      this.indicator('days', DAYS, { n: days === null ? null : String(days) }),
      last
        ? this.indicator('pain', LAST_PAIN, {
            x: String(last.pain),
            // O banco ainda não define as faixas de intensidade (INI-02 em revisão).
            intensidade: null,
            'data e hora': formatWhen(last.at, new Date()),
          })
        : this.empty('pain', LAST_PAIN, 'Nenhum registro ainda'),
      average === null
        ? this.empty('average', WEEK_AVERAGE)
        : this.indicator('average', WEEK_AVERAGE, { x: formatPain(average) }),
      // Lembretes chegam na fase 5.
      this.empty('reminder', NEXT_REMINDER, 'Nenhum lembrete ativo'),
    ];
  });

  private indicator(tone: IndicatorTone, code: string, vars: IndicatorVars): IndicatorView {
    const entry = this.content.entry(code);
    const parts = entry?.body ? indicatorParts(entry.body, vars) : null;
    return parts ? { tone, label: entry?.title ?? '', ...parts } : this.empty(tone, code);
  }

  /** Sem dado: "—" no lugar do valor; o detalhe do banco fica, se não depender do valor. */
  private empty(tone: IndicatorTone, code: string, detail?: string): IndicatorView {
    const entry = this.content.entry(code);
    const parts = entry?.body ? indicatorParts(entry.body, { [valueVar(entry.body)]: '—' }) : null;
    return {
      tone,
      label: entry?.title ?? '',
      value: '—',
      unit: '',
      detail: detail ?? parts?.detail ?? '',
    };
  }
}

function valueVar(body: string): string {
  return body.match(/^\{([^}]+)\}/)?.[1] ?? '';
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "hoje, 8h10" · "ontem, 20h30" · "12/10, 8h10" */
export function formatWhen(at: Date, now: Date): string {
  const diff = daysBetween(at, now);
  const day =
    diff === 0
      ? 'hoje'
      : diff === 1
        ? 'ontem'
        : `${String(at.getDate()).padStart(2, '0')}/${String(at.getMonth() + 1).padStart(2, '0')}`;
  return `${day}, ${at.getHours()}h${String(at.getMinutes()).padStart(2, '0')}`;
}
