import {
  InjectionToken,
  Service,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ReminderSettingsStore } from './reminder-settings.service';

/** Chave pública VAPID (environment.ts). Vazia = lembretes não configurados no projeto. */
export const PUSH_PUBLIC_KEY = new InjectionToken<string>('PUSH_PUBLIC_KEY', {
  factory: () => environment.push.vapidPublicKey,
});

/**
 * Situação das notificações neste aparelho:
 * - unconfigured: o projeto ainda não tem as chaves (npm run push:keys);
 * - install: iPhone/iPad fora da Tela de Início (lá as notificações não funcionam);
 * - unsupported: navegador sem notificações (ou o app aberto sem service worker);
 * - default / denied / granted: a permissão do navegador.
 */
export type PushStatus = 'unconfigured' | 'install' | 'unsupported' | NotificationPermission;

/** Notificações dos lembretes (Web Push): permissão, inscrição e registro na conta. */
@Service()
export class PushService {
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly auth = inject(AuthService);
  private readonly reminders = inject(ReminderSettingsStore);
  private readonly publicKey = inject(PUSH_PUBLIC_KEY);

  private readonly permission = signal(currentPermission());
  readonly status = computed<PushStatus>(() => {
    if (!this.publicKey) return 'unconfigured';
    if (isAppleMobile() && !isStandalone()) return 'install';
    const permission = this.permission();
    if (permission === null || !this.swPush?.isEnabled) return 'unsupported';
    return permission;
  });

  constructor() {
    // Ao abrir o app com lembretes ligados, confirma a inscrição deste aparelho na conta (o
    // navegador pode trocá-la). Não pede permissão: isso só acontece num toque da pessoa.
    effect(() => {
      if (this.auth.user() && this.reminders.active() && this.status() === 'granted') {
        untracked(() => void this.refresh().catch(() => undefined));
      }
    });
  }

  /** Pede a permissão (se preciso), inscreve o aparelho e o registra na conta. */
  async enable(): Promise<PushStatus> {
    const status = this.status();
    if (status !== 'default' && status !== 'granted') return status;
    if (status === 'default') this.permission.set(await Notification.requestPermission());
    if (this.permission() !== 'granted') return this.status();
    const subscription =
      (await this.current()) ??
      (await this.swPush!.requestSubscription({ serverPublicKey: this.publicKey }));
    await this.register(subscription);
    return 'granted';
  }

  /** Tira este aparelho da conta e cancela a inscrição (ao desligar ou sair da conta). */
  async disable(): Promise<void> {
    const subscription = await this.current();
    if (!subscription) return;
    if (this.auth.user()) {
      try {
        const client = await this.auth.client();
        await client.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      } catch {
        // Sem internet: cancelar a inscrição já basta (o servidor apaga no próximo envio).
      }
    }
    await subscription.unsubscribe();
  }

  private async refresh(): Promise<void> {
    const subscription =
      (await this.current()) ??
      (await this.swPush!.requestSubscription({ serverPublicKey: this.publicKey }));
    await this.register(subscription);
  }

  private async register(subscription: PushSubscription): Promise<void> {
    const { endpoint, keys } = subscription.toJSON();
    if (!endpoint || !keys?.['p256dh'] || !keys['auth']) throw new Error('Inscrição inválida.');
    const client = await this.auth.client();
    const { error } = await client.rpc('register_push_subscription', {
      p_endpoint: endpoint,
      p_p256dh: keys['p256dh'],
      p_auth: keys['auth'],
    });
    if (error) throw error;
  }

  private current(): Promise<PushSubscription | null> {
    return this.swPush?.isEnabled
      ? firstValueFrom(this.swPush.subscription)
      : Promise.resolve(null);
  }
}

function currentPermission(): NotificationPermission | null {
  return typeof Notification !== 'undefined' && 'PushManager' in globalThis
    ? Notification.permission
    : null;
}

/** iPhone e iPad (o iPadOS se apresenta como Mac, mas tem toque). */
function isAppleMobile(): boolean {
  const nav = globalThis.navigator;
  if (!nav) return false;
  return (
    /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1)
  );
}

/** Aberto como app instalado (Tela de Início), não numa aba do navegador. */
function isStandalone(): boolean {
  return (
    globalThis.matchMedia?.('(display-mode: standalone)').matches === true ||
    (globalThis.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
