import { Component, computed, input, model } from '@angular/core';

/**
 * Escala de dor 0–10 em uma linha (versão enxuta do diário, seção 6 do contexto).
 *
 * Onze botões não cabem com 44 px de largura numa tela de 390, então o controle principal
 * é um deslizante nativo (acessível por teclado e leitor de tela) com cursor de 48 px.
 * Os números embaixo também escolhem o valor com um toque — inclusive no iPhone, onde
 * tocar no trilho do deslizante não move o cursor.
 */
@Component({
  selector: 'app-pain-scale',
  template: `
    <div class="value" aria-hidden="true">
      @if (value() !== null) {
        <strong>{{ value() }}</strong
        ><span>/10</span>
      } @else {
        <span class="placeholder">Escolha de 0 a 10</span>
      }
    </div>
    <input
      type="range"
      min="0"
      max="10"
      step="1"
      [class.unset]="value() === null"
      [value]="value() ?? 5"
      [style.--fill.%]="fill()"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-valuetext]="valueText()"
      (input)="value.set(+$any($event.target).value)"
    />
    <div class="ticks" aria-hidden="true">
      @for (n of numbers; track n) {
        <button type="button" tabindex="-1" [class.selected]="value() === n" (click)="value.set(n)">
          {{ n }}
        </button>
      }
    </div>
    <div class="ends" aria-hidden="true">
      <span>Sem dor</span>
      <span>Máxima</span>
    </div>
  `,
  styleUrl: './pain-scale.scss',
})
export class PainScale {
  /** Nota escolhida; null enquanto a pessoa não escolheu. */
  readonly value = model<number | null>(null);
  readonly labelledBy = input<string>();
  readonly describedBy = input<string>();

  protected readonly numbers = Array.from({ length: 11 }, (_, i) => i);
  protected readonly fill = computed(() => ((this.value() ?? 0) / 10) * 100);
  protected readonly valueText = computed(() => {
    const value = this.value();
    return value === null ? 'Nenhum valor escolhido' : `${value} de 10`;
  });
}
