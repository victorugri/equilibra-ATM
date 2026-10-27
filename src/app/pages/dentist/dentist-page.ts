import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ContentService } from '../../core/content/content.service';
import {
  DentistPrescription,
  DentistProfile,
  DentistService,
  PrescriptionDraft,
} from '../../core/prescription/dentist.service';
import { isoDate } from '../../core/reminders/reminder-schedule';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { exerciseName } from '../exercises/exercise-catalog';
import { PrescriptionCode } from './prescription-code';
import { PrescriptionEditor } from './prescription-editor';

type Stage = 'loading' | 'signed-out' | 'unavailable' | 'profile' | 'pending' | 'ready' | 'error';

/**
 * Área do dentista (design/ajustes-tayna.md, seção 4): uma tela só, pensada para o computador do
 * consultório. Cadastro do CRO, prescrição com código e QR, e a lista das prescrições.
 */
@Component({
  selector: 'app-dentist-page',
  imports: [RouterLink, DatePipe, PageHeader, ConfirmDialog, PrescriptionCode, PrescriptionEditor],
  templateUrl: './dentist-page.html',
  styleUrl: './dentist.scss',
})
export class DentistPage {
  private readonly auth = inject(AuthService);
  private readonly dentist = inject(DentistService);
  private readonly content = inject(ContentService);
  private readonly injector = inject(Injector);
  private readonly endDialog = viewChild<ConfirmDialog>('endDialog');

  protected readonly stage = signal<Stage>('loading');
  protected readonly profile = signal<DentistProfile | null>(null);
  protected readonly prescriptions = signal<DentistPrescription[]>([]);
  /** Prescrição cujo código está em destaque (recém-criada ou "Ver código"). */
  protected readonly shown = signal<DentistPrescription | null>(null);
  protected readonly editing = signal<DentistPrescription | null>(null);
  protected readonly ending = signal<DentistPrescription | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly name = signal('');
  protected readonly cro = signal('');

  protected readonly today = isoDate(new Date());
  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  constructor() {
    void this.load();
  }

  protected exerciseNames(codes: readonly string[]): string {
    return codes
      .filter((code) => this.content.has(code))
      .map((code) => exerciseName(this.content, code))
      .join(', ');
  }

  protected status(prescription: DentistPrescription): string {
    if (!prescription.active) return 'Encerrada';
    if (prescription.validUntil && prescription.validUntil < this.today) return 'Vencida';
    return 'Ativa';
  }

  protected async saveProfile(): Promise<void> {
    if (!this.name().trim() || !this.cro().trim()) {
      this.error.set('Preencha o nome e o CRO.');
      return;
    }
    await this.run(async () => {
      await this.dentist.saveProfile(this.name(), this.cro());
      await this.load();
    });
  }

  protected editProfile(): void {
    const profile = this.profile();
    this.name.set(profile?.professionalName ?? '');
    this.cro.set(profile?.cro ?? '');
    this.stage.set('profile');
  }

  protected async save(draft: PrescriptionDraft): Promise<void> {
    if (!draft.exercises.length) {
      this.error.set('Marque pelo menos um exercício.');
      return;
    }
    if (draft.validUntil && draft.validUntil < this.today) {
      this.error.set('A validade não pode ser uma data que já passou.');
      return;
    }
    const editing = this.editing();
    await this.run(async () => {
      const saved = editing
        ? await this.dentist.update(editing.id, draft)
        : await this.dentist.create(draft);
      this.prescriptions.update((list) =>
        editing ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list],
      );
      this.editing.set(null);
      this.showCode(saved);
    });
  }

  /** Mostra o código em destaque e leva o foco (e a rolagem) até ele. */
  protected showCode(prescription: DentistPrescription): void {
    this.shown.set(prescription);
    afterNextRender(
      () => {
        const title = globalThis.document?.getElementById('code-title');
        title?.scrollIntoView({ block: 'center' });
        title?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  protected edit(prescription: DentistPrescription): void {
    this.error.set('');
    this.shown.set(null);
    this.editing.set(prescription);
  }

  protected askEnd(prescription: DentistPrescription): void {
    this.error.set('');
    this.ending.set(prescription);
    this.endDialog()?.open();
  }

  protected async confirmEnd(): Promise<void> {
    const ending = this.ending();
    if (!ending) return;
    await this.run(async () => {
      const saved = await this.dentist.end(ending.id);
      this.prescriptions.update((list) => list.map((p) => (p.id === saved.id ? saved : p)));
      if (this.shown()?.id === saved.id) this.shown.set(null);
      this.endDialog()?.close();
    });
  }

  private async load(): Promise<void> {
    this.error.set('');
    if (!this.auth.available) {
      this.stage.set('unavailable');
      return;
    }
    await this.auth.ready;
    if (!this.auth.signedIn()) {
      this.stage.set('signed-out');
      return;
    }
    try {
      const profile = await this.dentist.profile();
      this.profile.set(profile);
      if (!profile) {
        this.stage.set('profile');
      } else if (!profile.verified) {
        this.stage.set('pending');
      } else {
        this.prescriptions.set(await this.dentist.list());
        this.stage.set('ready');
      }
    } catch {
      this.stage.set('error');
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await action();
    } catch {
      this.error.set('Não deu para salvar agora. Confira a internet e tente de novo.');
    } finally {
      this.busy.set(false);
    }
  }
}
