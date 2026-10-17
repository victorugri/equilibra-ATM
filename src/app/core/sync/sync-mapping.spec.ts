import { PainEntry } from '../data/app-database';
import { Profile } from '../data/profile.service';
import {
  painFromRow,
  painToRow,
  profileFromRow,
  profileToRow,
  sessionFromRow,
  sessionToRow,
} from './sync-mapping';

describe('conversão aparelho ↔ servidor', () => {
  const entry: PainEntry = {
    id: 7,
    uid: '6f1b4c1e-0000-4000-8000-000000000001',
    at: new Date('2026-10-16T12:30:00Z'),
    pain: 4,
    exercises: 'yes',
    splint: 'not-used',
    sleptWell: null,
    note: 'ok',
    dirty: 1,
  };

  it('ida e volta de um registro do diário mantém tudo (menos o id local)', () => {
    const row = painToRow(entry);
    expect(row).toEqual({
      id: entry.uid,
      recorded_at: '2026-10-16T12:30:00.000Z',
      pain: 4,
      exercises: 'yes',
      splint: 'not-used',
      slept_well: null,
      note: 'ok',
    });
    const { id: _local, ...withoutLocalId } = entry;
    expect(painFromRow(row)).toEqual({ ...withoutLocalId, dirty: 0 });
  });

  it('sessão do 6x6', () => {
    const session = { uid: 'abc', at: new Date('2026-10-16T08:00:00Z'), dirty: 1 as const };
    expect(sessionFromRow(sessionToRow(session))).toEqual({ ...session, dirty: 0 });
  });

  it('perfil: campos vazios viram null no servidor e voltam vazios', () => {
    const profile: Profile = {
      nickname: '  Maria ',
      usesSplint: 'unsure',
      dentistName: '',
      dentistPhone: '',
      dirty: 1,
    };
    const row = profileToRow('user-1', profile);
    expect(row).toEqual({
      id: 'user-1',
      nickname: 'Maria',
      uses_splint: 'unsure',
      dentist_name: null,
      dentist_phone: null,
    });
    expect(profileFromRow(row)).toEqual({
      nickname: 'Maria',
      usesSplint: 'unsure',
      dentistName: '',
      dentistPhone: '',
    });
  });
});
