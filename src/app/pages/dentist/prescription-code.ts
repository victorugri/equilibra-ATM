import { Component, computed, inject, input, resource } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Código grande, QR Code e "Imprimir", para o dentista entregar ao paciente. O QR abre
 * /prescricao/CODIGO, que leva à aba Exercícios com o código preenchido.
 */
@Component({
  selector: 'app-prescription-code',
  template: `
    <section class="code-card" aria-labelledby="code-title">
      <h2 id="code-title" tabindex="-1">Código de exercícios</h2>
      <p class="code">
        <span aria-hidden="true">{{ code() }}</span>
        <span class="visually-hidden">{{ spelled() }}</span>
      </p>
      @if (qr.value(); as src) {
        <img class="qr" [src]="src" width="200" height="200" [alt]="'QR Code para ' + link()" />
      }
      <p class="how">
        No app Equilibra ATM, toque em <strong>Exercícios</strong> e digite o código, ou aponte a
        câmera do celular para o QR Code.
      </p>
      <p class="link">{{ link() }}</p>
      <button type="button" class="btn-primary no-print" (click)="print()">Imprimir</button>
    </section>
  `,
  styleUrl: './prescription-code.scss',
})
export class PrescriptionCode {
  private readonly document = inject(DOCUMENT);

  readonly code = input.required<string>();

  protected readonly link = computed(
    () => `${this.document.location.origin}/prescricao/${this.code()}`,
  );
  /** Leitores de tela soletram o código ("A B C 2 3 4"). */
  protected readonly spelled = computed(() => this.code().split('').join(' '));

  protected readonly qr = resource({
    params: () => this.link(),
    loader: async ({ params }) => {
      const { toDataURL } = await import('qrcode');
      return toDataURL(params, { width: 400, margin: 1, errorCorrectionLevel: 'M' });
    },
  });

  protected print(): void {
    this.document.defaultView?.print();
  }
}
