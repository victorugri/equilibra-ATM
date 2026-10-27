import { Service, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/** Perfil profissional do dentista (colunas de profiles, migração 20261027120000). */
export interface DentistProfile {
  professionalName: string;
  cro: string;
  /** Conferido à mão pelo administrador; só então cria prescrições. */
  verified: boolean;
}

/** O que o dentista escolhe ao prescrever. */
export interface PrescriptionDraft {
  exercises: string[];
  sessionsPerDay: number;
  remindersPerDay: number;
  note: string;
  /** "AAAA-MM-DD" ou "" (sem validade). */
  validUntil: string;
}

/** Uma prescrição na lista do dentista. */
export interface DentistPrescription extends PrescriptionDraft {
  id: string;
  code: string;
  active: boolean;
  redeemed: boolean;
  createdAt: Date;
}

interface PrescriptionRow {
  id: string;
  code: string;
  exercises: string[];
  sessions_per_day: number;
  reminders_per_day: number;
  note: string | null;
  valid_until: string | null;
  active: boolean;
  redeemed_at: string | null;
  created_at: string;
}

const COLUMNS =
  'id, code, exercises, sessions_per_day, reminders_per_day, note, valid_until, active, redeemed_at, created_at';
/** Código repetido (unique): raro, mas basta tentar de novo. */
const UNIQUE_VIOLATION = '23505';

const toRow = (draft: PrescriptionDraft) => ({
  exercises: draft.exercises,
  sessions_per_day: draft.sessionsPerDay,
  reminders_per_day: draft.remindersPerDay,
  note: draft.note.trim() || null,
  valid_until: draft.validUntil || null,
});

const fromRow = (row: PrescriptionRow): DentistPrescription => ({
  id: row.id,
  code: row.code,
  exercises: row.exercises,
  sessionsPerDay: row.sessions_per_day,
  remindersPerDay: row.reminders_per_day,
  note: row.note ?? '',
  validUntil: row.valid_until ?? '',
  active: row.active,
  redeemed: row.redeemed_at !== null,
  createdAt: new Date(row.created_at),
});

/**
 * Área do dentista (/dentista): perfil profissional e prescrições. Tudo direto no servidor
 * (precisa de conta e internet); o dentista não tem acesso a nenhum dado dos pacientes.
 */
@Service()
export class DentistService {
  private readonly auth = inject(AuthService);

  async profile(): Promise<DentistProfile | null> {
    const client = await this.auth.client();
    const { data, error } = await client
      .from('profiles')
      .select('cro, professional_name, cro_verified')
      .eq('id', this.userId())
      .maybeSingle();
    if (error) throw error;
    if (!data?.cro) return null;
    return {
      cro: data.cro,
      professionalName: data.professional_name ?? '',
      verified: data.cro_verified,
    };
  }

  /** Grava nome e CRO. Mudar o CRO pede nova conferência (gatilho no banco). */
  async saveProfile(professionalName: string, cro: string): Promise<void> {
    const client = await this.auth.client();
    const { error } = await client.from('profiles').upsert({
      id: this.userId(),
      professional_name: professionalName.trim(),
      cro: cro.trim().toUpperCase(),
    });
    if (error) throw error;
  }

  async list(): Promise<DentistPrescription[]> {
    const client = await this.auth.client();
    const { data, error } = await client
      .from('prescriptions')
      .select(COLUMNS)
      .eq('dentist_id', this.userId())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as PrescriptionRow[]).map(fromRow);
  }

  async create(draft: PrescriptionDraft): Promise<DentistPrescription> {
    const client = await this.auth.client();
    for (let attempt = 0; ; attempt++) {
      const { data, error } = await client
        .from('prescriptions')
        .insert(toRow(draft))
        .select(COLUMNS)
        .single();
      if (!error) return fromRow(data as PrescriptionRow);
      if (error.code !== UNIQUE_VIOLATION || attempt >= 2) throw error;
    }
  }

  async update(id: string, draft: PrescriptionDraft): Promise<DentistPrescription> {
    return this.patch(id, toRow(draft));
  }

  /** Encerrar: os exercícios saem do app do paciente na próxima vez que ele abrir on-line. */
  async end(id: string): Promise<DentistPrescription> {
    return this.patch(id, { active: false });
  }

  private async patch(id: string, changes: object): Promise<DentistPrescription> {
    const client = await this.auth.client();
    const { data, error } = await client
      .from('prescriptions')
      .update(changes)
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return fromRow(data as PrescriptionRow);
  }

  private userId(): string {
    const user = this.auth.user();
    if (!user) throw new Error('Entre na sua conta.');
    return user.id;
  }
}
