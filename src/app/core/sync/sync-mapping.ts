import { ExerciseSession, PainEntry } from '../data/app-database';
import { Consent, Profile } from '../data/profile.service';

/** Linhas das tabelas do Supabase (supabase/migrations). */
export interface PainRow {
  id: string;
  recorded_at: string;
  pain: number;
  exercises: PainEntry['exercises'];
  splint: PainEntry['splint'];
  slept_well: PainEntry['sleptWell'];
  note: string;
}

export interface SessionRow {
  id: string;
  completed_at: string;
}

export interface ProfileRow {
  id: string;
  nickname: string | null;
  uses_splint: Profile['usesSplint'];
  dentist_name: string | null;
  dentist_phone: string | null;
}

export interface ConsentRow {
  id: string;
  content_code: string;
  content_version: string | null;
  accepted_at: string;
}

export const painToRow = (entry: PainEntry): PainRow => ({
  id: entry.uid,
  recorded_at: entry.at.toISOString(),
  pain: entry.pain,
  exercises: entry.exercises,
  splint: entry.splint,
  slept_well: entry.sleptWell,
  note: entry.note,
});

export const painFromRow = (row: PainRow): PainEntry => ({
  uid: row.id,
  at: new Date(row.recorded_at),
  pain: row.pain,
  exercises: row.exercises,
  splint: row.splint,
  sleptWell: row.slept_well,
  note: row.note,
  dirty: 0,
});

export const sessionToRow = (session: ExerciseSession): SessionRow => ({
  id: session.uid,
  completed_at: session.at.toISOString(),
});

export const sessionFromRow = (row: SessionRow): ExerciseSession => ({
  uid: row.id,
  at: new Date(row.completed_at),
  dirty: 0,
});

/** Campos vazios vão como null (o banco não guarda texto vazio à toa). */
export const profileToRow = (userId: string, profile: Profile): ProfileRow => ({
  id: userId,
  nickname: profile.nickname.trim() || null,
  uses_splint: profile.usesSplint,
  dentist_name: profile.dentistName.trim() || null,
  dentist_phone: profile.dentistPhone.trim() || null,
});

export const profileFromRow = (row: ProfileRow): Omit<Profile, 'dirty'> => ({
  nickname: row.nickname ?? '',
  usesSplint: row.uses_splint,
  dentistName: row.dentist_name ?? '',
  dentistPhone: row.dentist_phone ?? '',
});

export const consentToRow = (consent: Consent): ConsentRow => ({
  id: consent.uid,
  content_code: consent.contentCode,
  content_version: consent.contentVersion,
  accepted_at: consent.acceptedAt.toISOString(),
});
