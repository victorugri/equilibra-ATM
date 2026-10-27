import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { ContentPipe } from '../../core/content/content.pipe';
import { ContentService } from '../../core/content/content.service';
import {
  PrescriptionError,
  PrescriptionErrorReason,
  PrescriptionStore,
} from '../../core/prescription/prescription.service';
import { Icon } from '../../shared/ui/icon/icon';

const TITLE = 'EX-P01';
const TEXT = 'EX-P02';
const BUTTON = 'EX-P03';
const INVALID = 'EX-P04';
const ENDED = 'EX-P07';

/** Convite sem prescrição: pedir o código ao dentista e digitar aqui (seção 4). */
@Component({
  selector: 'app-prescription-invite',
  imports: [Icon, ContentPipe],
  template: `
    @if (store.ended()) {
      <p class="ended" role="status">
        <app-icon name="aviso" />
        <span>{{ endedCode | content }}</span>
      </p>
    }
    <section class="invite" aria-labelledby="invite-title">
      <span class="invite-icon"><app-icon name="dentista" /></span>
      <h2 id="invite-title">{{ titleCode | content }}</h2>
      <p>{{ textCode | content }}</p>

      <form class="form" (submit)="$event.preventDefault(); submit()">
        <div class="field">
          <label class="field-label" for="prescription-code">Código de exercícios</label>
          <div class="input-box">
            <input
              id="prescription-code"
              class="code-input"
              [value]="code()"
              (input)="code.set($any($event.target).value)"
              maxlength="8"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="Ex.: ABC234"
              [attr.aria-invalid]="error() ? true : null"
              [attr.aria-describedby]="error() ? 'prescription-error' : null"
            />
          </div>
          @if (error()) {
            <p class="form-error" id="prescription-error" role="alert">{{ error() }}</p>
          }
        </div>
        <button type="submit" class="btn-primary" [disabled]="busy() || !code().trim()">
          {{ buttonCode | content }}
        </button>
      </form>
    </section>
  `,
  styleUrl: './prescription-invite.scss',
})
export class PrescriptionInvite {
  protected readonly store = inject(PrescriptionStore);
  private readonly content = inject(ContentService);

  /** Código que veio do QR (/prescricao/ABC234): já preenche e tenta liberar. */
  readonly initialCode = input<string>();

  protected readonly titleCode = TITLE;
  protected readonly textCode = TEXT;
  protected readonly buttonCode = BUTTON;
  protected readonly endedCode = ENDED;
  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    effect(() => {
      const initial = this.initialCode();
      if (!initial) return;
      untracked(() => {
        this.code.set(initial);
        void this.submit();
      });
    });
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    try {
      await this.store.redeem(this.code());
    } catch (error) {
      const reason: PrescriptionErrorReason =
        error instanceof PrescriptionError ? error.reason : 'unavailable';
      this.error.set(this.message(reason));
    } finally {
      this.busy.set(false);
    }
  }

  private message(reason: PrescriptionErrorReason): string {
    switch (reason) {
      case 'too-many':
        return 'Muitas tentativas. Tente de novo daqui a uma hora.';
      case 'offline':
        return 'Sem internet agora. Tente de novo quando estiver on-line.';
      case 'unavailable':
        return 'Não deu para liberar agora. Tente de novo em instantes.';
      default:
        return this.content.get(INVALID);
    }
  }
}
