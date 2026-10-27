import { Checkin, ExerciseSession, PainEntry } from '../data/app-database';
import { Consent, Profile } from '../data/profile.service';
import { JawState } from '../reminders/jaw-states';
import { ReminderMode, ReminderPlan, timesFor } from '../reminders/reminder-schedule';

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

/** Preferências de lembrete: os horários efetivos vão prontos para o agendador do servidor. */
export interface ReminderSettingsRow {
  user_id: string;
  mode: ReminderMode;
  times: string[];
  quiet_start: string;
  quiet_end: string;
  paused_on: string | null;
  exercise_reminders: boolean;
  timezone: string;
}

export const remindersToRow = (
  userId: string,
  plan: ReminderPlan,
  timezone: string,
): ReminderSettingsRow => ({
  user_id: userId,
  mode: plan.mode,
  times: timesFor(plan.mode, plan.customTimes),
  quiet_start: plan.quietStart,
  quiet_end: plan.quietEnd,
  paused_on: plan.pausedOn,
  exercise_reminders: plan.exerciseReminders,
  timezone,
});

/** O Postgres devolve "HH:MM:SS"; o app usa "HH:MM". */
const hhmm = (time: string) => time.slice(0, 5);

export const remindersFromRow = (
  row: Omit<ReminderSettingsRow, 'user_id' | 'timezone'>,
): ReminderPlan => ({
  mode: row.mode,
  customTimes: row.mode === 'custom' ? row.times.map(hhmm) : [],
  quietStart: hhmm(row.quiet_start),
  quietEnd: hhmm(row.quiet_end),
  pausedOn: row.paused_on,
  exerciseReminders: row.exercise_reminders,
});

/** O que o app grava num lembrete (o servidor guarda só a primeira vez de cada campo). */
export interface CheckinRow {
  opened_at: string | null;
  answer: JawState | null;
  answered_at: string | null;
  skipped_at: string | null;
}

export const checkinToRow = (checkin: Checkin): CheckinRow => ({
  opened_at: checkin.openedAt?.toISOString() ?? null,
  answer: checkin.answer,
  answered_at: checkin.answeredAt?.toISOString() ?? null,
  skipped_at: checkin.skippedAt?.toISOString() ?? null,
});
