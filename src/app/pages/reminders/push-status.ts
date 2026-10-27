import { Component, computed, inject } from '@angular/core';
import { PushService } from '../../core/reminders/push.service';
import { Icon } from '../../shared/ui/icon/icon';

/** Aviso quando este aparelho não pode receber os lembretes (e o que fazer). */
@Component({
  selector: 'app-push-status',
  imports: [Icon],
  template: `
    @if (message(); as text) {
      <p class="push-status" role="status">
        <app-icon name="aviso" />
        <span>{{ text }}</span>
      </p>
    }
  `,
  styles: `
    .push-status {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      margin: 0;
      padding: var(--space-lg);
      border-radius: var(--radius-sm);
      background: var(--color-tip-bg);
      color: var(--color-tip-text);
      font-size: var(--text-label);
      line-height: var(--line-height-body);

      app-icon {
        margin-top: 2px;
        color: var(--color-tip-icon);
      }
    }
  `,
})
export class PushStatusNote {
  private readonly push = inject(PushService);

  protected readonly message = computed(() => {
    switch (this.push.status()) {
      case 'unconfigured':
        return 'Os lembretes ainda não estão disponíveis nesta versão do app.';
      case 'install':
        return 'No iPhone, os lembretes só chegam com o app na Tela de Início: toque em Compartilhar, depois em “Adicionar à Tela de Início”, e abra o app por lá.';
      case 'unsupported':
        return 'Este navegador não recebe notificações. No Android, use o Chrome; no iPhone, adicione o app à Tela de Início.';
      case 'denied':
        return 'As notificações estão bloqueadas para este app. Libere nas configurações do navegador ou do celular para receber os lembretes.';
      default:
        return null;
    }
  });
}
