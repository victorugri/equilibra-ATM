import { NOTIFICATION } from './notification-texts.ts';

/** Sessões de hoje, quando o lembrete leva a sessão de exercício prescrita. */
export interface ExerciseProgress {
  done: number;
  goal: number;
}

interface ActionClick {
  operation: 'navigateLastFocusedOrOpen';
  url: string;
}

const open = (url: string): ActionClick => ({ operation: 'navigateLastFocusedOrOpen', url });

/**
 * Mensagem do lembrete no formato do service worker do Angular (ngsw): ele mostra a
 * notificação e, ao tocar, abre (ou traz para a frente) o app no check-in deste lembrete.
 * Com `exercise`, ganha a linha das sessões (INI-P03) e o botão "Fazer a sessão agora"
 * (no iPhone não há botões: a sessão fica no check-in).
 */
export function reminderNotification(eventId: string, exercise?: ExerciseProgress) {
  const onActionClick: { default: ActionClick; exercicios?: ActionClick } = {
    default: open(`/lembrete?e=${encodeURIComponent(eventId)}`),
  };
  let body: string = NOTIFICATION.body;
  let actions: { action: string; title: string }[] | undefined;
  if (exercise) {
    const line = NOTIFICATION.exercises
      .replace('{x}', String(exercise.done))
      .replace('{n}', String(exercise.goal));
    body = `${body}\n${line}`;
    actions = [{ action: 'exercicios', title: 'Fazer a sessão agora' }];
    onActionClick.exercicios = open('/exercicios/sessao');
  }
  return {
    notification: {
      title: NOTIFICATION.title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      lang: 'pt-BR',
      // Um lembrete novo substitui o anterior ainda na tela.
      tag: 'lembrete',
      renotify: true,
      ...(actions ? { actions } : {}),
      data: { onActionClick },
    },
  };
}
