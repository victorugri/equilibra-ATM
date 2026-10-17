import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { authErrorMessage } from '../../core/auth/auth-errors';
import { AuthService } from '../../core/auth/auth.service';
import { ContentPipe } from '../../core/content/content.pipe';
import { DataRights, PendingDataError } from '../../core/data/data-rights.service';
import { ProfileStore } from '../../core/data/profile.service';
import { SyncService } from '../../core/sync/sync.service';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { REPORT_TEXT } from '../diary/evolution-page';
import { telLink, whatsappLink } from './contact-links';
import { downloadBlob } from './download';

type PendingAction = 'delete-account' | 'delete-local';

/** Perfil — conta, compartilhar com o dentista, privacidade e meus dados (Figma 7:3685). */
@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, DatePipe, PageHeader, Icon, ContentPipe, ConfirmDialog],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  protected readonly sync = inject(SyncService);
  private readonly profileStore = inject(ProfileStore);
  private readonly rights = inject(DataRights);
  private readonly router = inject(Router);

  private readonly dialog = viewChild.required(ConfirmDialog);

  protected readonly reportText = REPORT_TEXT;
  protected readonly profile = this.profileStore.profile;
  protected readonly user = this.auth.user;

  protected readonly displayName = computed(
    () => this.profileStore.nickname() || (this.user() ? 'Sua conta' : 'Seu perfil'),
  );
  protected readonly initials = computed(() => {
    const source = this.profileStore.nickname() || this.user()?.email || '';
    const words = source.split(/[\s@._-]+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  });
  protected readonly dentistCall = computed(() => telLink(this.profile().dentistPhone));
  protected readonly dentistWhatsapp = computed(() => whatsappLink(this.profile().dentistPhone));

  protected readonly message = signal('');
  protected readonly action = signal<PendingAction | null>(null);
  protected readonly busy = signal(false);
  protected readonly dialogError = signal('');

  protected async download(): Promise<void> {
    const blob = await this.rights.exportJson();
    downloadBlob(blob, `equilibra-atm-meus-dados-${new Date().toISOString().slice(0, 10)}.json`);
  }

  protected async signOut(): Promise<void> {
    this.message.set('');
    try {
      await this.rights.signOut();
      this.message.set('Você saiu da conta. Seus dados continuam guardados nela.');
    } catch (error) {
      this.message.set(
        error instanceof PendingDataError
          ? 'Ainda há registros sem enviar para a sua conta. Conecte-se à internet e tente de novo.'
          : authErrorMessage(error),
      );
    }
  }

  protected ask(action: PendingAction): void {
    this.action.set(action);
    this.dialogError.set('');
    this.dialog().open();
  }

  protected async confirm(): Promise<void> {
    this.busy.set(true);
    this.dialogError.set('');
    try {
      if (this.action() === 'delete-account') await this.rights.deleteAccount();
      else await this.rights.deleteLocalData();
      this.dialog().close();
      await this.router.navigateByUrl('/boas-vindas');
    } catch (error) {
      this.dialogError.set(authErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
