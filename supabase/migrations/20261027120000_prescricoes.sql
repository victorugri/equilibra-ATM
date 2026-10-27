-- Exercícios só com prescrição do dentista (ajustes da Dra. Tayná, design/ajustes-tayna.md, seção 4).
--
-- O dentista tem uma conta comum com o CRO preenchido no perfil. Ele só cria prescrições depois que
-- o CRO é conferido à mão (cro_verified, ver supabase/queries/dentistas.sql). O paciente resgata a
-- prescrição pelo código de 6 caracteres, com ou sem conta.
--
-- Privacidade (LGPD): a prescrição vai do dentista para o paciente, nunca ao contrário. O dentista
-- não vê dor, diário nem uso do app: nenhuma política dá a ele acesso aos dados do paciente.

-- Dentista no perfil --------------------------------------------------------------------

alter table public.profiles
  add column cro text check (char_length(cro) <= 20),
  -- Nome que o paciente vê ("Exercícios indicados por Dra. Ana").
  add column professional_name text check (char_length(professional_name) <= 80),
  -- Conferido à mão pelo administrador (SQL Editor). Nunca pelo app.
  add column cro_verified boolean not null default false;

comment on column public.profiles.cro_verified is 'CRO conferido à mão; só então cria prescrições.';

-- Pelo app, ninguém se declara verificado; mudar o CRO pede nova conferência.
create function public.profiles_guard_cro() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.cro_verified := false;
    elsif new.cro is distinct from old.cro then
      new.cro_verified := false;
    else
      new.cro_verified := old.cro_verified;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_cro
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_cro();

revoke execute on function public.profiles_guard_cro() from public, anon, authenticated;

-- Prescrições ---------------------------------------------------------------------------

-- Código sem letras ou números que se confundem (sem 0/O, 1/I/L).
create function public.prescription_code() returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), ''
  )
  from generate_series(1, 6);
$$;

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.prescription_code()
    check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  dentist_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Preenchido quando um paciente com conta resgata o código.
  patient_id uuid references auth.users (id) on delete set null,
  -- Códigos do banco de conteúdo (ex.: EX-R1).
  exercises text[] not null check (
    cardinality(exercises) between 1 and 12
    and array_to_string(exercises, ',') ~ '^EX-[A-Z0-9]+(,EX-[A-Z0-9]+)*$'
  ),
  sessions_per_day smallint not null default 2 check (sessions_per_day between 1 and 6),
  reminders_per_day smallint not null default 3 check (reminders_per_day between 0 and 6),
  note text check (char_length(note) <= 200),
  valid_until date,
  active boolean not null default true,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.prescriptions is 'Exercícios prescritos pelo dentista (resgatados pelo código).';

create index prescriptions_dentist_id_idx on public.prescriptions (dentist_id);
create index prescriptions_patient_id_idx on public.prescriptions (patient_id);

create trigger prescriptions_updated_at
  before update on public.prescriptions
  for each row execute function public.set_updated_at();

alter table public.prescriptions enable row level security;

revoke all on public.prescriptions from anon, authenticated;
grant select on public.prescriptions to authenticated;
grant insert (exercises, sessions_per_day, reminders_per_day, note, valid_until)
  on public.prescriptions to authenticated;
-- Editar ou encerrar (active = false). Código, dentista e paciente não mudam.
grant update (exercises, sessions_per_day, reminders_per_day, note, valid_until, active)
  on public.prescriptions to authenticated;

create policy "prescrição: o dentista lê as suas" on public.prescriptions
  for select to authenticated using ((select auth.uid()) = dentist_id);
create policy "prescrição: o paciente lê a sua" on public.prescriptions
  for select to authenticated using ((select auth.uid()) = patient_id);
create policy "prescrição: dentista com CRO conferido cria" on public.prescriptions
  for insert to authenticated with check (
    (select auth.uid()) = dentist_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.cro_verified and p.cro is not null
    )
  );
create policy "prescrição: o dentista edita as suas" on public.prescriptions
  for update to authenticated
  using ((select auth.uid()) = dentist_id) with check ((select auth.uid()) = dentist_id);

-- Resgate -------------------------------------------------------------------------------

-- Tentativas erradas, para ninguém ficar chutando códigos (por conta ou por IP).
create table public.prescription_attempts (
  key text not null,
  attempted_at timestamptz not null default now()
);

create index prescription_attempts_key_idx on public.prescription_attempts (key, attempted_at);

alter table public.prescription_attempts enable row level security;
revoke all on public.prescription_attempts from anon, authenticated;

-- O que o paciente recebe (o nome do dentista vem do perfil profissional).
create function public.prescription_json(r public.prescriptions) returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'code', r.code,
    'active', r.active and (r.valid_until is null or r.valid_until >= current_date),
    'exercises', r.exercises,
    'sessionsPerDay', r.sessions_per_day,
    'remindersPerDay', r.reminders_per_day,
    'note', r.note,
    'validUntil', r.valid_until,
    'dentistName', (select nullif(trim(p.professional_name), '') from public.profiles p
                    where p.id = r.dentist_id)
  );
$$;

revoke execute on function public.prescription_json(public.prescriptions)
  from public, anon, authenticated;

/**
 * Resgata (ou atualiza) a prescrição pelo código. Funciona com ou sem conta; com conta, vincula
 * ao paciente na primeira vez. Código que não existe: null (e conta como tentativa errada).
 * Encerrada ou vencida: { active: false }, para o app avisar e tirar os exercícios.
 */
create function public.redeem_prescription(p_code text) returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  caller text := coalesce(
    (select auth.uid())::text,
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    'desconhecido'
  );
  r public.prescriptions;
begin
  if (
    select count(*) from public.prescription_attempts a
    where a.key = caller and a.attempted_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'too many attempts' using errcode = 'P0429';
  end if;

  select * into r from public.prescriptions p
  where p.code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  if not found then
    delete from public.prescription_attempts a
      where a.key = caller and a.attempted_at < now() - interval '1 day';
    insert into public.prescription_attempts (key) values (caller);
    return null;
  end if;

  if (select auth.uid()) is not null and r.patient_id is null and r.active then
    update public.prescriptions p
      set patient_id = (select auth.uid()), redeemed_at = now()
      where p.id = r.id
      returning * into r;
  end if;

  return public.prescription_json(r);
end;
$$;

revoke execute on function public.redeem_prescription(text) from public;
grant execute on function public.redeem_prescription(text) to anon, authenticated;

-- A prescrição mais recente do paciente (ao entrar na conta num aparelho novo).
create function public.my_prescription() returns json
language sql
stable
security definer
set search_path = ''
as $$
  select public.prescription_json(p)
  from public.prescriptions p
  where p.patient_id = (select auth.uid())
  order by p.redeemed_at desc nulls last
  limit 1;
$$;

revoke execute on function public.my_prescription() from public, anon;
grant execute on function public.my_prescription() to authenticated;

-- Sessão de exercício no lembrete -------------------------------------------------------
-- Sem notificação a mais: a sessão prescrita vai junto com o lembrete mais próximo
-- ("Seus dentes estão se tocando agora?"), até o paciente fazer as sessões do dia.
-- A Edge Function escolhe em quais lembretes (supabase/functions/_shared/exercise-slots.ts).

alter table public.reminder_settings
  -- O paciente pode desligar (Meus lembretes).
  add column exercise_reminders boolean not null default true;

drop function public.claim_due_reminders(text);

/**
 * Como em 20261017120000_lembretes.sql, e devolve também o que a Edge Function precisa para
 * juntar a sessão de exercício: o horário do lembrete, os horários que tocam hoje, a meta da
 * prescrição ativa (null sem prescrição ou com a opção desligada) e as sessões já feitas hoje.
 */
create function public.claim_due_reminders(p_secret text)
returns table (
  event_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  time_of_day time,
  active_times time[],
  sessions_goal smallint,
  sessions_done integer
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
    select s.user_id, slot.at as scheduled_for, t.time_of_day
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
    returning reminder_events.id, reminder_events.user_id, reminder_events.scheduled_for
  )
  select
    claimed.id,
    p.id,
    p.endpoint,
    p.p256dh,
    p.auth,
    due.time_of_day,
    (
      select array_agg(x order by x) from unnest(s.times) as x
      where not public.in_quiet_hours(x, s.quiet_start, s.quiet_end)
    ),
    case when s.exercise_reminders then (
      select r.sessions_per_day from public.prescriptions r
      where r.patient_id = s.user_id
        and r.active
        and (r.valid_until is null or r.valid_until >= lt.today)
      order by r.redeemed_at desc nulls last
      limit 1
    ) end,
    (
      select count(*)::integer from public.exercise_sessions e
      where e.user_id = s.user_id
        and (e.completed_at at time zone s.timezone)::date = lt.today
    )
  from claimed
  join due on due.user_id = claimed.user_id and due.scheduled_for = claimed.scheduled_for
  join public.reminder_settings s on s.user_id = claimed.user_id
  cross join lateral (select (now() at time zone s.timezone)::date as today) lt
  join public.push_subscriptions p on p.user_id = claimed.user_id;
end;
$$;

-- Só o servidor (a Edge Function, conectada como postgres) chama.
revoke execute on function public.claim_due_reminders(text) from public, anon, authenticated;
