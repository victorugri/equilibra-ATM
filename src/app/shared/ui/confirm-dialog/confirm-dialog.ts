import { Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Janela de confirmação para ações que não têm volta (ex.: apagar dados). Usa o elemento
 * <dialog> nativo: prende o foco, fecha com Esc e é anunciada pelos leitores de tela.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog #dialog aria-labelledby="confirm-title" (close)="closed()">
      <h2 id="confirm-title">{{ title() }}</h2>
      <p>{{ message() }}</p>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <div class="actions">
        <button
          type="button"
          [class]="danger() ? 'btn-danger' : 'btn-primary'"
          [disabled]="busy()"
          (click)="confirm.emit()"
        >
          {{ busy() ? 'Aguarde…' : confirmLabel() }}
        </button>
        <button type="button" class="btn-link" [disabled]="busy()" (click)="close()">
          Cancelar
        </button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(100% - 2 * var(--space-page), 420px);
      padding: var(--space-xl) var(--space-page) var(--space-lg);
      border: 0;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-raised);

      &::backdrop {
        background: rgb(17 28 45 / 45%);
      }
    }

    h2 {
      margin-bottom: var(--space-sm);
      font-size: var(--text-title-sm);
    }

    p {
      color: var(--color-text-secondary);
      line-height: var(--line-height-body);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      margin-top: var(--space-xl);
    }

    .btn-link {
      width: 100%;
    }
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly danger = input(false);
  readonly busy = input(false);
  readonly error = input('');
  readonly confirm = output<void>();
  readonly dismissed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected closed(): void {
    this.dismissed.emit();
  }
}
