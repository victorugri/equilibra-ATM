import { Service, computed, inject, signal } from '@angular/core';
import { APP_DATABASE, Dirty, newUid } from './app-database';

/** Usa placa para dormir (cadastro, Figma 24:2). */
export type UsesSplint = 'yes' | 'no' | 'unsure' | null;

/** Dados opcionais do cadastro. Tudo pode ser preenchido ou mudado depois, no Perfil. */
export interface Profile {
  nickname: string;
  usesSplint: UsesSplint;
  dentistName: string;
  dentistPhone: string;
  dirty: Dirty;
}

/** Consentimento para o tratamento dos dados de saúde (LGPD, art. 11). */
export interface Consent {
  uid: string;
  /** Texto aceito no banco de conteúdo. */
  contentCode: string;
  contentVersion: string | null;
  acceptedAt: Date;
  dirty: Dirty;
}

const EMPTY_PROFILE: Profile = {
  nickname: '',
  usesSplint: null,
  dentistName: '',
  dentistPhone: '',
  dirty: 0,
};

/** Perfil, consentimento e entrada no app, guardados no aparelho (tabela meta). */
@Service()
export class ProfileStore {
  private readonly db = inject(APP_DATABASE);

  readonly profile = signal<Profile>(EMPTY_PROFILE);
  readonly consent = signal<Consent | null>(null);
  readonly onboardingDone = signal(false);
  /** Resolve quando os dados guardados foram lidos. */
  readonly ready: Promise<void> = this.reload();

  /** Para a saudação do Início ("Boa tarde, Maria"). */
  readonly nickname = computed(() => this.profile().nickname.trim());

  async saveProfile(changes: Partial<Omit<Profile, 'dirty'>>): Promise<void> {
    const profile: Profile = { ...this.profile(), ...changes, dirty: 1 };
    await this.db.meta.put({ key: 'profile', value: profile });
    this.profile.set(profile);
  }

  /** Registra o aceite do texto de privacidade (ex.: PER-01). */
  async acceptConsent(contentCode: string, contentVersion: string | null): Promise<void> {
    const consent: Consent = {
      uid: newUid(),
      contentCode,
      contentVersion,
      acceptedAt: new Date(),
      dirty: 1,
    };
    await this.db.meta.put({ key: 'consent', value: consent });
    this.consent.set(consent);
  }

  async completeOnboarding(): Promise<void> {
    await this.db.meta.put({ key: 'onboarding', value: { completedAt: new Date() } });
    this.onboardingDone.set(true);
  }

  /** Marca o perfil como enviado à conta, se não mudou enquanto era enviado. */
  async markProfileSynced(sent: Profile): Promise<void> {
    if (this.profile() !== sent) return;
    const profile: Profile = { ...sent, dirty: 0 };
    await this.db.meta.put({ key: 'profile', value: profile });
    this.profile.set(profile);
  }

  /** Marca o consentimento como enviado à conta (se ainda é o mesmo aceite). */
  async markConsentSynced(sent: Consent): Promise<void> {
    if (this.consent()?.uid !== sent.uid) return;
    const consent: Consent = { ...sent, dirty: 0 };
    await this.db.meta.put({ key: 'consent', value: consent });
    this.consent.set(consent);
  }

  /** Usa o perfil que veio da conta (ex.: ao entrar num aparelho novo). */
  async applyRemoteProfile(remote: Omit<Profile, 'dirty'>): Promise<void> {
    // Uma edição feita aqui enquanto a conta respondia ainda não foi enviada: ela vale.
    if (this.profile().dirty) return;
    const profile: Profile = { ...remote, dirty: 0 };
    await this.db.meta.put({ key: 'profile', value: profile });
    this.profile.set(profile);
  }

  async reload(): Promise<void> {
    const [profile, consent, onboarding] = await this.db.meta.bulkGet([
      'profile',
      'consent',
      'onboarding',
    ]);
    this.profile.set({ ...EMPTY_PROFILE, ...(profile?.value as Partial<Profile> | undefined) });
    this.consent.set((consent?.value as Consent | undefined) ?? null);
    this.onboardingDone.set(!!onboarding);
  }
}
