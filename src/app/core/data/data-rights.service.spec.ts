import { TestBed } from '@angular/core/testing';
import { SUPABASE_CONFIG } from '../auth/auth.service';
import { APP_DATABASE, AppDatabase } from './app-database';
import { DataRights } from './data-rights.service';
import { PainDiary } from './pain-diary.service';
import { ProfileStore } from './profile.service';
import { CheckinStore } from '../reminders/checkins.service';
import { ReminderSettingsStore } from '../reminders/reminder-settings.service';

const EVENT = '00000000-0000-4000-8000-0000000000aa';

let counter = 0;

describe('DataRights (LGPD) sem conta', () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = new AppDatabase(`direitos-${++counter}`);
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_DATABASE, useValue: db },
        { provide: SUPABASE_CONFIG, useValue: null },
      ],
    });
    const profile = TestBed.inject(ProfileStore);
    await profile.ready;
    await profile.acceptConsent('PER-01', 'teste');
    await profile.saveProfile({ nickname: 'Maria' });
    await profile.completeOnboarding();
    await TestBed.inject(PainDiary).add({
      pain: 3,
      exercises: 'yes',
      splint: null,
      sleptWell: 'no',
      note: 'ok',
    });
    const reminders = TestBed.inject(ReminderSettingsStore);
    await reminders.ready;
    await reminders.save({ mode: 'three' });
    await TestBed.inject(CheckinStore).answer(EVENT, 'relaxed');
  });

  it('exporta tudo o que o app guarda, em JSON', async () => {
    const blob = await TestBed.inject(DataRights).exportJson();
    const data = JSON.parse(await blob.text());
    expect(data.account).toBeNull();
    expect(data.profile.nickname).toBe('Maria');
    expect(data.consent.contentCode).toBe('PER-01');
    expect(data.painEntries).toHaveLength(1);
    expect(data.painEntries[0]).toMatchObject({ pain: 3, exercises: 'yes', note: 'ok' });
    expect(data.painEntries[0].dirty).toBeUndefined();
    expect(data.reminders).toMatchObject({ mode: 'three', quietStart: '21:00' });
    expect(data.reminders.dirty).toBeUndefined();
    expect(data.reminderResponses).toEqual([
      expect.objectContaining({ reminderId: EVENT, answer: 'relaxed' }),
    ]);
  });

  it('apagar os dados do aparelho limpa registros, perfil, consentimento e a entrada', async () => {
    await TestBed.inject(DataRights).deleteLocalData();
    const profile = TestBed.inject(ProfileStore);
    expect(TestBed.inject(PainDiary).entries()).toHaveLength(0);
    expect(profile.nickname()).toBe('');
    expect(profile.consent()).toBeNull();
    expect(profile.onboardingDone()).toBe(false);
    expect(await db.pain.count()).toBe(0);
    expect(await db.checkins.count()).toBe(0);
    expect(TestBed.inject(ReminderSettingsStore).settings().mode).toBe('off');
  });
});
