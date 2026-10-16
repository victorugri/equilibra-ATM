import { TestBed } from '@angular/core/testing';
import { APP_DATABASE, AppDatabase } from './app-database';
import { AppUsage } from './app-usage.service';
import { ExerciseSessions } from './exercise-sessions.service';
import { PainDiary } from './pain-diary.service';

let counter = 0;

/** Cada teste usa um banco novo (IndexedDB em memória, ver src/test-setup.ts). */
function setup(db = new AppDatabase(`teste-${++counter}`)) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: APP_DATABASE, useValue: db }] });
  return db;
}

describe('PainDiary', () => {
  it('guarda registros e os lê de novo ao reabrir o app', async () => {
    const db = setup();
    const diary = TestBed.inject(PainDiary);
    await diary.ready;
    expect(diary.entries()).toEqual([]);
    expect(diary.hasEntryToday()).toBe(false);

    await diary.add({
      pain: 4,
      exercises: 'yes',
      splint: 'not-used',
      sleptWell: null,
      note: '  ok ',
    });
    expect(diary.last()?.pain).toBe(4);
    expect(diary.last()?.note).toBe('ok');
    expect(diary.hasEntryToday()).toBe(true);

    setup(db);
    const reopened = TestBed.inject(PainDiary);
    await reopened.ready;
    expect(reopened.entries()).toHaveLength(1);
  });

  it('recusa nota fora de 0 a 10', async () => {
    setup();
    const diary = TestBed.inject(PainDiary);
    await expect(
      diary.add({ pain: 11, exercises: null, splint: null, sleptWell: null, note: '' }),
    ).rejects.toThrow(RangeError);
  });
});

describe('ExerciseSessions', () => {
  afterEach(() => localStorage.clear());

  it('conta as sessões de hoje', async () => {
    setup();
    const sessions = TestBed.inject(ExerciseSessions);
    expect(await sessions.record()).toBe(1);
    expect(await sessions.record()).toBe(2);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await sessions.record(yesterday);
    expect(sessions.today()).toHaveLength(2);
    expect(sessions.all()).toHaveLength(3);
  });

  it('migra as sessões guardadas no localStorage pela fase 2', async () => {
    localStorage.setItem('equilibra.sessoes-6x6', JSON.stringify([new Date().toISOString()]));
    setup();
    const sessions = TestBed.inject(ExerciseSessions);
    await sessions.ready;
    expect(sessions.today()).toHaveLength(1);
    expect(localStorage.getItem('equilibra.sessoes-6x6')).toBeNull();
  });
});

describe('AppUsage', () => {
  it('grava o primeiro acesso e conta os dias de uso', async () => {
    const db = setup();
    const usage = TestBed.inject(AppUsage);
    await usage.ready;
    expect(usage.daysUsing()).toBe(1);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await db.meta.put({ key: 'firstUse', value: threeDaysAgo });
    setup(db);
    const reopened = TestBed.inject(AppUsage);
    await reopened.ready;
    expect(reopened.daysUsing()).toBe(4);
  });
});
