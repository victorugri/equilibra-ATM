-- Lembretes (fase 5): preferências, inscrições de notificação e o registro de cada lembrete,
-- que mede a adesão (proporção de lembretes respondidos, metodologia módulo VI-d).
--
-- Lembretes exigem conta: o servidor envia as notificações nos horários escolhidos.
-- O envio é feito pela Edge Function send-reminders, chamada a cada minuto pelo pg_cron.

-- Preferências ---------------------------------------------------------------------------

create table public.reminder_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Opção escolhida na tela (os horários efetivos ficam em "times").
  mode text not null check (mode in ('three', 'custom', 'off')),
  -- Teto de 6 lembretes por dia, somando tudo (padrão conservador da Dra. Tayná).
  times time[] not null default '{}' check (cardinality(times) <= 6),
  -- Horário de silêncio: nenhum lembrete entre o início e o fim (pode passar da meia-noite).
  quiet_start time not null default '21:00',
  quiet_end time not null default '08:00',
  -- "Pausar por hoje": data local da pausa; no dia seguinte volta sozinho.
  paused_on date,
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) <= 64),
  updated_at timestamptz not null default now()
);

comment on table public.reminder_settings is 'Preferências de lembrete (Figma 7:2142).';

-- Um fuso inválido quebraria o agendador para todos: recusa já na gravação.
create function public.reminder_settings_check() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  new.updated_at = now();
  return new;
end;
$$;

create trigger reminder_settings_check
  before insert or update on public.reminder_settings
  for each row execute function public.reminder_settings_check();

-- Inscrições de notificação (uma por aparelho) ---------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique
    check (char_length(endpoint) <= 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);

comment on table public.push_subscriptions is 'Endereços de notificação (Web Push) dos aparelhos.';

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Lembretes enviados e respostas ------------------------------------------------------------

create table public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Horário do lembrete (o agendado); "unique" impede enviar o mesmo lembrete duas vezes.
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  -- A pessoa tocou na notificação e abriu o check-in.
  opened_at timestamptz,
  -- Resposta do check-in (LEM-02).
  answer text check (answer in ('relaxed', 'touching', 'clenching', 'tense')),
  answered_at timestamptz,
  -- "Pular" no check-in.
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, scheduled_for)
);

comment on table public.reminder_events is
  'Cada lembrete enviado e a resposta (variável de adesão da pesquisa).';

-- Cada momento é registrado uma vez só, e nunca antes do lembrete nem depois de agora.
create function public.reminder_events_guard() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  earliest timestamptz := old.scheduled_for;
begin
  if new.answer is not null and new.answered_at is null then
    new.answered_at = now();
  end if;
  new.opened_at = coalesce(old.opened_at, least(greatest(new.opened_at, earliest), now()));
  new.answer = coalesce(old.answer, new.answer);
  new.answered_at = coalesce(old.answered_at, least(greatest(new.answered_at, earliest), now()));
  new.skipped_at = coalesce(old.skipped_at, least(greatest(new.skipped_at, earliest), now()));
  return new;
end;
$$;

create trigger reminder_events_guard
  before update on public.reminder_events
  for each row execute function public.reminder_events_guard();

-- Acesso ---------------------------------------------------------------------------------

alter table public.reminder_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_events enable row level security;

revoke all on public.reminder_settings, public.push_subscriptions, public.reminder_events
  from anon, authenticated;
revoke execute on function public.reminder_settings_check() from public, anon, authenticated;
revoke execute on function public.reminder_events_guard() from public, anon, authenticated;

grant select, insert, update on public.reminder_settings to authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant select on public.reminder_events to authenticated;
-- O app só registra a abertura e a resposta; o resto é do servidor.
grant update (opened_at, answer, answered_at, skipped_at) on public.reminder_events
  to authenticated;

create policy "lembretes: a própria pessoa lê" on public.reminder_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lembretes: a própria pessoa cria" on public.reminder_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lembretes: a própria pessoa altera" on public.reminder_settings
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "notificações: a própria pessoa lê" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notificações: a própria pessoa remove" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "check-in: a própria pessoa lê" on public.reminder_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "check-in: a própria pessoa responde" on public.reminder_events
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Registrar o aparelho: o endereço passa a ser da conta que entrou por último nele.
create function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values (me, p_endpoint, p_p256dh, p_auth);
  -- No máximo 10 aparelhos por conta (os mais antigos saem).
  delete from public.push_subscriptions
    where id in (
      select id from public.push_subscriptions
      where user_id = me
      order by created_at desc
      offset 10
    );
end;
$$;

revoke execute on function public.register_push_subscription(text, text, text)
  from public, anon;
grant execute on function public.register_push_subscription(text, text, text) to authenticated;

-- Agendador -------------------------------------------------------------------------------

/** O horário está dentro do silêncio? (o intervalo pode passar da meia-noite) */
create function public.in_quiet_hours(t time, quiet_start time, quiet_end time) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when quiet_start = quiet_end then false
    when quiet_start < quiet_end then t >= quiet_start and t < quiet_end
    else t >= quiet_start or t < quiet_end
  end;
$$;

-- Segredo do agendador, gerado aqui mesmo: ninguém precisa copiar chave nenhuma.
select vault.create_secret(
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  'reminders_cron_secret',
  'Autoriza o pg_cron a chamar a função send-reminders.'
);

/**
 * Separa os lembretes que vencem agora (últimos 10 minutos, fora do silêncio e da pausa),
 * registra cada um em reminder_events e devolve os aparelhos para onde enviar.
 * Um lembrete já registrado não volta: chamar duas vezes não envia em dobro.
 */
create function public.claim_due_reminders(p_secret text)
returns table (
  event_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
language plpgsql
set search_path = ''
as $$
begin
  if p_secret is null or p_secret is distinct from (
    select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret'
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  return query
  with due as (
    select s.user_id, slot.at as scheduled_for
    from public.reminder_settings s
    cross join lateral unnest(s.times) as t (time_of_day)
    cross join lateral (
      select ((now() at time zone s.timezone)::date + t.time_of_day) at time zone s.timezone as at
    ) slot
    where s.mode <> 'off'
      and slot.at <= now()
      and slot.at > now() - interval '10 minutes'
      and s.paused_on is distinct from (now() at time zone s.timezone)::date
      and not public.in_quiet_hours(t.time_of_day, s.quiet_start, s.quiet_end)
      and exists (select 1 from public.push_subscriptions p where p.user_id = s.user_id)
  ),
  claimed as (
    insert into public.reminder_events (user_id, scheduled_for)
    select due.user_id, due.scheduled_for from due
    on conflict on constraint reminder_events_user_id_scheduled_for_key do nothing
    returning reminder_events.id, reminder_events.user_id
  )
  select claimed.id, p.id, p.endpoint, p.p256dh, p.auth
  from claimed
  join public.push_subscriptions p on p.user_id = claimed.user_id;
end;
$$;

-- Só o servidor (a Edge Function, conectada como postgres) chama.
revoke execute on function public.claim_due_reminders(text) from public, anon, authenticated;
revoke execute on function public.in_quiet_hours(time, time, time) from public, anon;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- A cada minuto, chama a função que envia os lembretes vencidos.
-- Num fork, troque o endereço do projeto.
select cron.schedule(
  'enviar-lembretes',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://qzbbdtsinhdhguwczdtv.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'reminders_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $$
);

-- O histórico do pg_cron cresce a cada minuto: guarda só a última semana.
select cron.schedule(
  'limpar-historico-cron',
  '17 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);
