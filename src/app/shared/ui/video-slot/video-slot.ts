import { Component, input } from '@angular/core';

/**
 * "Espaço para vídeo (upload)" — Figma 37:204. Enquanto o vídeo não for gravado, mostra o
 * aviso "Vídeo em breve"; com `src`, mostra o vídeo (vertical 9:16, MP4).
 */
@Component({
  selector: 'app-video-slot',
  template: `
    @if (src(); as src) {
      <video
        class="video"
        [src]="src"
        controls
        playsinline
        preload="metadata"
        [attr.aria-label]="caption()"
      ></video>
    } @else {
      <div class="placeholder">
        <img src="images/video-play.svg" width="60" height="60" alt="" />
        <p class="soon">Vídeo em breve</p>
        <p class="caption">{{ caption() }}</p>
        <img class="decoration" src="images/video-decoracao.svg" width="160" height="160" alt="" />
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .placeholder {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 177px;
      padding: 34px var(--space-lg) 10px;
      overflow: hidden;
      border-radius: var(--radius-button);
      background: var(--gradient-video);
      color: var(--color-on-primary);
      text-align: center;
    }

    .soon {
      font-size: var(--text-label);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-body);
    }

    // Figma: branco a 80%; 92% para o texto pequeno chegar a 4,5:1 no degradê.
    .caption {
      color: rgb(255 255 255 / 92%);
      font-size: var(--text-caption);
      line-height: var(--line-height-body);
    }

    .decoration {
      position: absolute;
      top: 90px;
      left: 210px;
      pointer-events: none;
    }

    .video {
      width: 100%;
      max-height: 70dvh;
      aspect-ratio: 9 / 16;
      border-radius: var(--radius-button);
      background: var(--color-text);
    }
  `,
})
export class VideoSlot {
  /** Legenda, ex.: "Exercício 1 · Posição de repouso da língua". */
  readonly caption = input.required<string>();
  readonly src = input<string | null>(null);
}
