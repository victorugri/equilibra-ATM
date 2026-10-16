import { Component, computed, input } from '@angular/core';
import { ICONS, IconDef, IconName } from './icons';

/**
 * Ícone decorativo (aria-hidden). O nome acessível fica no elemento que o contém.
 * Usa o tamanho do Figma; `size` muda o lado maior mantendo a proporção.
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      [attr.width]="width()"
      [attr.height]="height()"
      aria-hidden="true"
      focusable="false"
    >
      @for (path of icon().paths; track $index) {
        @if (path.strokeWidth; as strokeWidth) {
          <path
            [attr.d]="path.d"
            fill="none"
            stroke="currentColor"
            [attr.stroke-width]="strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        } @else {
          <path [attr.d]="path.d" fill="currentColor" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<number>();

  protected readonly icon = computed((): IconDef => ICONS[this.name()]);
  protected readonly viewBox = computed(() => `0 0 ${this.icon().width} ${this.icon().height}`);
  private readonly scale = computed(() => {
    const size = this.size();
    const { width, height } = this.icon();
    return size ? size / Math.max(width, height) : 1;
  });
  protected readonly width = computed(() => this.icon().width * this.scale());
  protected readonly height = computed(() => this.icon().height * this.scale());
}
