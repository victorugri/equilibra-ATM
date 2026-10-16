import { CompressTimer } from './compress-timer';

describe('CompressTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conta 20 minutos e avisa no fim', () => {
    const onFinish = vi.fn();
    const timer = new CompressTimer(onFinish);
    expect(timer.state()).toBe('idle');
    expect(timer.display()).toBe('20:00');

    timer.start();
    vi.advanceTimersByTime(61_000);
    expect(timer.state()).toBe('running');
    expect(timer.display()).toBe('18:59');

    vi.advanceTimersByTime(19 * 60_000);
    expect(timer.state()).toBe('finished');
    expect(timer.display()).toBe('00:00');
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('pausa e continua de onde parou', () => {
    const timer = new CompressTimer();
    timer.start();
    vi.advanceTimersByTime(5 * 60_000);
    timer.pause();
    vi.advanceTimersByTime(10 * 60_000);
    expect(timer.state()).toBe('paused');
    expect(timer.display()).toBe('15:00');

    timer.resume();
    vi.advanceTimersByTime(60_000);
    expect(timer.display()).toBe('14:00');

    timer.reset();
    expect(timer.state()).toBe('idle');
    expect(timer.display()).toBe('20:00');
    timer.dispose();
  });
});
