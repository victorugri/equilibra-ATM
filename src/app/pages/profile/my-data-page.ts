import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ContentPipe } from '../../core/content/content.pipe';
import { DataRights } from '../../core/data/data-rights.service';
import { ExerciseSessions } from '../../core/data/exercise-sessions.service';
import { PainDiary } from '../../core/data/pain-diary.service';
import { ProfileStore } from '../../core/data/profile.service';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { downloadBlob } from './download';

const SPLINT: Record<string, string> = { yes: 'Sim', no: 'Não', unsure: 'Não sei' };

/** "Ver todos os meus dados salvos" (LGPD, art. 18, II: acesso aos dados). */
@Component({
  selector: 'app-my-data-page',
  imports: [DatePipe, PageHeader, ContentPipe],
  template: `
    <app-page-header title="Meus dados" variant="internal" backTo="/perfil" />
    <div class="page">
      <h1 class="visually-hidden">Meus dados</h1>
      <p class="intro">Tudo o que o Equilibra ATM guarda sobre você.</p>

      <section aria-labelledby="account-title">
        <h2 id="account-title">Conta</h2>
        <dl>
          <div>
            <dt>E-mail</dt>
            <dd>{{ auth.user()?.email ?? 'Sem conta (dados só neste aparelho)' }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="profile-title">
        <h2 id="profile-title">Perfil</h2>
        <dl>
          <div>
            <dt>Como prefere ser chamado(a)</dt>
            <dd>{{ profile().nickname || '—' }}</dd>
          </div>
          <div>
            <dt>Usa placa para dormir</dt>
            <dd>{{ splintLabel() }}</dd>
          </div>
          <div>
            <dt>Dentista</dt>
            <dd>{{ profile().dentistName || '—' }}</dd>
          </div>
          <div>
            <dt>Telefone do dentista</dt>
            <dd>{{ profile().dentistPhone || '—' }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="consent-title">
        <h2 id="consent-title">Consentimento</h2>
        @if (consent(); as consent) {
          <p>
            Você concordou em {{ consent.acceptedAt | date: "dd/MM/yyyy 'às' HH:mm" }} com este
            texto:
          </p>
          <blockquote>{{ consent.contentCode | content }}</blockquote>
        } @else {
          <p>Nenhum consentimento registrado.</p>
        }
      </section>

      <section aria-labelledby="records-title">
        <h2 id="records-title">Registros</h2>
        <dl>
          <div>
            <dt>Registros do diário da dor</dt>
            <dd>{{ entries().length }}</dd>
          </div>
          @if (entries().length) {
            <div>
              <dt>Período</dt>
              <dd>
                {{ entries()[0].at | date: 'dd/MM/yyyy' }} a
                {{ entries()[entries().length - 1].at | date: 'dd/MM/yyyy' }}
              </dd>
            </div>
          }
          <div>
            <dt>Sessões do Programa 6x6</dt>
            <dd>{{ sessions().length }}</dd>
          </div>
        </dl>
      </section>

      <button type="button" class="btn-primary" (click)="download()">
        Baixar cópia dos meus dados
      </button>
      <p class="hint">Arquivo JSON (formato aberto), gerado neste aparelho.</p>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
      padding: var(--space-lg) var(--space-page) 40px;
    }

    .intro,
    .hint,
    p {
      color: var(--color-text-secondary);
    }

    .hint {
      margin-top: calc(var(--space-md) * -1);
      font-size: var(--text-caption);
      text-align: center;
    }

    h2 {
      margin-bottom: var(--space-sm);
      color: var(--color-text);
      font-size: var(--text-title-sm);
    }

    dl {
      margin: 0;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      gap: var(--space-md);
      padding: var(--space-sm) 0;
      border-bottom: 1px solid var(--color-border);
    }

    dt {
      color: var(--color-text-secondary);
    }

    dd {
      margin: 0;
      color: var(--color-text);
      font-weight: var(--font-weight-semibold);
      text-align: right;
      overflow-wrap: anywhere;
    }

    blockquote {
      margin: var(--space-sm) 0 0;
      padding: var(--space-md) var(--space-lg);
      border-left: 4px solid var(--color-primary);
      border-radius: var(--radius-xs);
      background: var(--color-surface-light);
      color: var(--color-text);
    }
  `,
})
export class MyDataPage {
  protected readonly auth = inject(AuthService);
  private readonly profileStore = inject(ProfileStore);
  private readonly rights = inject(DataRights);

  protected readonly profile = this.profileStore.profile;
  protected readonly consent = this.profileStore.consent;
  protected readonly entries = inject(PainDiary).entries;
  protected readonly sessions = inject(ExerciseSessions).all;
  protected readonly splintLabel = computed(() => {
    const value = this.profile().usesSplint;
    return value ? SPLINT[value] : '—';
  });

  protected async download(): Promise<void> {
    const blob = await this.rights.exportJson();
    downloadBlob(blob, `equilibra-atm-meus-dados-${new Date().toISOString().slice(0, 10)}.json`);
  }
}
