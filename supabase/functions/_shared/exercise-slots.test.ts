// Testes da sessão de exercício no lembrete (rodam no Node: npm run test:functions).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { carriesExercise, exerciseSlots } from './exercise-slots.ts';
import { reminderNotification } from './reminder-notification.ts';

const THREE = ['10:00:00', '15:00:00', '20:00:00'];

describe('sessão de exercício no lembrete', () => {
  it('espalha as sessões entre os lembretes do dia', () => {
    assert.deepEqual(exerciseSlots(3, 1), [1]);
    assert.deepEqual(exerciseSlots(3, 2), [0, 2]);
    assert.deepEqual(exerciseSlots(3, 3), [0, 1, 2]);
    assert.deepEqual(exerciseSlots(3, 6), [0, 1, 2]);
    assert.deepEqual(exerciseSlots(6, 2), [0, 5]);
    assert.deepEqual(exerciseSlots(6, 3), [0, 3, 5]);
    assert.deepEqual(exerciseSlots(0, 2), []);
  });

  it('só com prescrição, e para quando as sessões do dia já foram feitas', () => {
    const at = (timeOfDay: string, goal: number | null, done = 0) =>
      carriesExercise({ timeOfDay, activeTimes: THREE, goal, done });
    assert.equal(at('10:00:00', 2), true);
    assert.equal(at('15:00:00', 2), false);
    assert.equal(at('20:00', 2), true);
    assert.equal(at('20:00:00', 2, 2), false);
    assert.equal(at('10:00:00', null), false);
    assert.equal(at('11:00:00', 6), false);
  });

  it('a notificação ganha uma linha e o botão "Fazer a sessão agora"', () => {
    const plain = reminderNotification('abc-123');
    assert.equal(plain.notification.actions, undefined);

    const message = reminderNotification('abc-123', { done: 1, goal: 2 });
    assert.match(message.notification.body, /\nExercícios do seu dentista — 1 de 2 sessões$/);
    assert.deepEqual(message.notification.actions, [
      { action: 'exercicios', title: 'Fazer a sessão agora' },
    ]);
    assert.equal(message.notification.data.onActionClick.exercicios?.url, '/exercicios/sessao');
    assert.equal(message.notification.data.onActionClick.default.url, '/lembrete?e=abc-123');
    assert.ok(JSON.stringify(message).length < 1000);
  });
});
