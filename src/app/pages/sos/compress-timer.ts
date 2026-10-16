import { computed, signal } from '@angular/core';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

/** Compressa morna e úmida por 20 minutos (SOS-04). */
export const COMPRESS_MINUTES = 20;

/**
 * Contagem regressiva da compressa. Usa a hora de término (e não um contador), então
 * continua certa mesmo se o celular suspender a página por um tempo.
 */
export class CompressTimer {
  readonly duration = COMPRESS_MINUTES * 60_000;

  private readonly now = signal(Date.now());
  private readonly endsAt = signal<number | null>(null);
  private readonly pausedRemaining = signal<number | null>(null);
  private interval: ReturnType<typeof setInterval> | undefined;

  readonly remaining = computed(() => {
    const endsAt = this.endsAt();
    if (endsAt !== null) return Math.max(0, endsAt - this.now());
    return this.pausedRemaining() ?? this.duration;
  });

  readonly state = computed<TimerState>(() => {
    if (this.endsAt() !== null) return this.remaining() > 0 ? 'running' : 'finished';
    return this.pausedRemaining() !== null ? 'paused' : 'idle';
  });

  /** "mm:ss", arredondando para cima (mostra 20:00 no início e 00:01 no último segundo). */
  readonly display = computed(() => {
    const seconds = Math.ceil(this.remaining() / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  });

  constructor(private readonly onFinish: () => void = () => {}) {}

  start(): void {
    this.run(this.duration);
  }

  pause(): void {
    if (this.state() !== 'running') return;
    this.pausedRemaining.set(this.remaining());
    this.endsAt.set(null);
    this.stopTicking();
  }

  resume(): void {
    const remaining = this.pausedRemaining();
    if (remaining !== null) this.run(remaining);
  }

  reset(): void {
    this.endsAt.set(null);
    this.pausedRemaining.set(null);
    this.stopTicking();
  }

  dispose(): void {
    this.stopTicking();
  }

  private run(remaining: number): void {
    this.stopTicking();
    this.pausedRemaining.set(null);
    this.now.set(Date.now());
    this.endsAt.set(Date.now() + remaining);
    this.interval = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    this.now.set(Date.now());
    if (this.state() === 'finished') {
      this.stopTicking();
      this.onFinish();
    }
  }

  private stopTicking(): void {
    clearInterval(this.interval);
    this.interval = undefined;
  }
}
