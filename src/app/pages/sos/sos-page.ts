import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPipe } from '../../core/content/content.pipe';
import { CareLog } from '../../core/data/care-log.service';
import { ProfileStore } from '../../core/data/profile.service';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { telLink } from '../profile/contact-links';
import { CompressTimer } from './compress-timer';
import { TimerControls } from './timer-controls';

interface SosStep {
  n: number;
  /** Título do passo (Figma 7:749). */
  title: string;
  /** Rótulo curto para o indicador de progresso. */
  short: string;
  /** Texto do passo no banco. */
  code: string;
  /** O passo 4 fica sem ícone: o do Figma era de vídeo e não combina com o passo. */
  icon?: IconName;
  timer?: boolean;
}

/** Condutas imediatas, na ordem do banco (SOS-02 a SOS-05). */
const SOS_STEPS: readonly SosStep[] = [
  {
    n: 1,
    title: 'Desencoste os dentes agora',
    short: 'Soltar os dentes',
    code: 'SOS-02',
    icon: 'sos-passo-1',
  },
  {
    n: 2,
    title: 'Respiração diafragmática',
    short: 'Respiração',
    code: 'SOS-03',
    icon: 'sos-passo-2',
  },
  {
    n: 3,
    title: 'Compressa morna no rosto',
    short: 'Compressa morna',
    code: 'SOS-04',
    icon: 'timer',
    timer: true,
  },
  {
    n: 4,
    title: 'Poupe a mandíbula',
    short: 'Poupar a mandíbula',
    code: 'SOS-05',
  },
];

/** SOS – estou com dor (Figma 7:749; ver design/7-749-sos.md). */
@Component({
  selector: 'app-sos-page',
  imports: [RouterLink, PageHeader, Icon, ContentPipe, TimerControls],
  templateUrl: './sos-page.html',
  styleUrl: './sos-page.scss',
})
export class SosPage {
  private readonly injector = inject(Injector);
  private readonly stepTitle = viewChild<ElementRef<HTMLElement>>('stepTitle');

  protected readonly steps = SOS_STEPS;
  /** Botão "Ligar para meu dentista" (Figma 7:969), se o telefone foi cadastrado no Perfil. */
  private readonly profile = inject(ProfileStore).profile;
  protected readonly dentistCall = computed(() => telLink(this.profile().dentistPhone));
  /** `?passo=3` abre direto na compressa (item do Plano de hoje). */
  readonly passo = input<string>();
  protected readonly index = linkedSignal(() => {
    const n = Number(this.passo());
    return Number.isInteger(n) && n >= 1 && n <= SOS_STEPS.length ? n - 1 : 0;
  });
  protected readonly current = computed(() => SOS_STEPS[this.index()]);
  protected readonly following = computed(() => SOS_STEPS.slice(this.index() + 1));
  protected readonly isLast = computed(() => this.index() === SOS_STEPS.length - 1);
  protected readonly progress = computed(() => ((this.index() + 1) / SOS_STEPS.length) * 100);

  /** O timer continua contando enquanto a pessoa segue para os outros passos. */
  private readonly careLog = inject(CareLog);
  protected readonly timer = new CompressTimer(() => {
    globalThis.navigator?.vibrate?.([300, 150, 300]);
    void this.careLog.markCompress();
  });
  protected readonly timerStep = SOS_STEPS.find((step) => step.timer)!;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timer.dispose());
  }

  protected goTo(index: number): void {
    this.index.set(index);
    afterNextRender(
      () => {
        const title = this.stepTitle()?.nativeElement;
        title?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        title?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
