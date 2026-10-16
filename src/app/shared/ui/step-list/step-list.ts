import { Component, input } from '@angular/core';

/** Passo a passo numerado dos exercícios (Figma 37:210, "Passos"). */
@Component({
  selector: 'app-step-list',
  template: `
    <ol>
      @for (step of steps(); track $index) {
        <li>
          <span class="number" aria-hidden="true">{{ $index + 1 }}</span>
          <span>{{ step }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    ol {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: var(--color-text-secondary);
      font-size: var(--text-label);
      line-height: 1.4;
    }

    .number {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-pill);
      background: var(--color-teal-light);
      color: var(--color-primary);
      font-size: var(--text-caption);
      font-weight: var(--font-weight-extrabold);
      line-height: 1;
    }
  `,
})
export class StepList {
  readonly steps = input.required<readonly string[]>();
}
