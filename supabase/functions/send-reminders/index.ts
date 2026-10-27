// Envia os lembretes vencidos. Chamada a cada minuto pelo pg_cron (migração
// 20261017120000_lembretes.sql), com o segredo do agendador no cabeçalho x-cron-secret.
//
// Variáveis: SUPABASE_DB_URL (o Supabase já fornece) e VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (gravadas por "npm run push:keys").
import postgres from 'npm:postgres@3.4.5';
import { carriesExercise } from '../_shared/exercise-slots.ts';
import { reminderNotification } from '../_shared/reminder-notification.ts';
import { sendWebPush, type VapidKeys } from '../_shared/web-push.ts';

interface DueReminder {
  event_id: string;
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  time_of_day: string;
  active_times: string[] | null;
  sessions_goal: number | null;
  sessions_done: number;
}

/** A sessão de exercício prescrita vai junto com o lembrete mais próximo (sem notificação a mais). */
function exerciseFor(row: DueReminder) {
  const goal = row.sessions_goal;
  const context = {
    timeOfDay: row.time_of_day,
    activeTimes: row.active_times ?? [],
    goal,
    done: row.sessions_done,
  };
  return goal && carriesExercise(context) ? { done: row.sessions_done, goal } : undefined;
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variável ${name} não configurada.`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(env('SUPABASE_DB_URL'), { prepare: false, max: 1 });
    const vapid: VapidKeys = {
      publicKey: env('VAPID_PUBLIC_KEY'),
      privateKey: env('VAPID_PRIVATE_KEY'),
      subject: env('VAPID_SUBJECT'),
    };
    const secret = request.headers.get('x-cron-secret') ?? '';
    const due = await sql<DueReminder[]>`select * from public.claim_due_reminders(${secret})`;

    const sentEvents = new Set<string>();
    const sentDevices: string[] = [];
    const goneDevices: string[] = [];
    await Promise.all(
      due.map(async (row) => {
        try {
          const result = await sendWebPush(
            row,
            JSON.stringify(reminderNotification(row.event_id, exerciseFor(row))),
            vapid,
            // Lembrete atrasado mais de 1 hora não serve mais; o novo substitui o antigo.
            { ttl: 3600, urgency: 'high', topic: 'lembrete' },
          );
          if (result.ok) {
            sentEvents.add(row.event_id);
            sentDevices.push(row.subscription_id);
          } else if (result.gone) {
            goneDevices.push(row.subscription_id);
          } else {
            console.error(`Falha ao enviar (${result.status})`, row.subscription_id);
          }
        } catch (error) {
          console.error('Falha ao enviar', row.subscription_id, error);
        }
      }),
    );

    if (sentEvents.size)
      await sql`update public.reminder_events set sent_at = now() where id in ${sql([...sentEvents])}`;
    if (sentDevices.length)
      await sql`update public.push_subscriptions set last_sent_at = now() where id in ${sql(sentDevices)}`;
    if (goneDevices.length)
      await sql`delete from public.push_subscriptions where id in ${sql(goneDevices)}`;

    return Response.json({ due: due.length, sent: sentEvents.size, removed: goneDevices.length });
  } catch (error) {
    if ((error as { code?: string }).code === '42501') {
      return new Response('Unauthorized', { status: 401 });
    }
    console.error(error);
    return new Response('Erro ao enviar lembretes', { status: 500 });
  } finally {
    await sql?.end();
  }
});
