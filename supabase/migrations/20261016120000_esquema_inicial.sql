-- Esquema inicial do Equilibra ATM (fase 4): perfil, consentimento, diário da dor e
-- sessões do Programa 6x6.
--
-- Privacidade (LGPD): todas as tabelas têm RLS e cada pessoa só lê e grava os próprios
-- dados. Ao apagar a conta, tudo é apagado junto (on delete cascade).
-- A conta é opcional: sem conta, os dados ficam só no aparelho (IndexedDB).

-- Perfil ------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Como a pessoa prefere ser chamada (só para a saudação do app).
  nickname text check (char_length(nickname) <= 40),
  -- Usa placa para dormir: define se o diário pergunta sobre a placa.
  uses_splint text check (uses_splint in ('yes', 'no', 'unsure')),
  dentist_name text check (char_length(dentist_name) <= 80),
  dentist_phone text check (char_length(dentist_phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Dados opcionais do cadastro (Figma 24:2).';

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Consentimento -----------------------------------------------------------------------

create table public.consents (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Código do texto aceito no banco de conteúdo (ex.: PER-01) e versão da dissertação.
  content_code text not null,
  content_version text,
  accepted_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.consents is
  'Registro do consentimento para tratamento de dados de saúde (LGPD, art. 11).';

create index consents_user_idx on public.consents (user_id);

-- Diário da dor -----------------------------------------------------------------------

create table public.pain_entries (
  -- Gerado no aparelho, para a sincronização não duplicar registros.
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recorded_at timestamptz not null,
  -- Nota de 0 a 10 (DIA-01).
  pain smallint not null check (pain between 0 and 10),
  exercises text check (exercises in ('yes', 'no')),
  splint text check (splint in ('yes', 'no', 'not-used')),
  slept_well text check (slept_well in ('yes', 'no')),
  note text not null default '' check (char_length(note) <= 140),
  created_at timestamptz not null default now()
);

comment on table public.pain_entries is 'Registros do diário da dor (versão enxuta).';

create index pain_entries_user_recorded_idx on public.pain_entries (user_id, recorded_at);

-- Sessões do Programa 6x6 (adesão, metodologia módulo VI-d) ---------------------------

create table public.exercise_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.exercise_sessions is 'Sessões concluídas do Programa 6x6 de Rocabado.';

create index exercise_sessions_user_completed_idx
  on public.exercise_sessions (user_id, completed_at);

-- Acesso -------------------------------------------------------------------------------
-- Sem acesso para visitantes (anon). Registros do diário e sessões são imutáveis pelo app:
-- só leitura e inclusão. O Supabase libera tudo em public por padrão, então primeiro tiramos
-- todas as permissões e depois damos só as necessárias.

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.pain_entries enable row level security;
alter table public.exercise_sessions enable row level security;

revoke all on public.profiles, public.consents, public.pain_entries, public.exercise_sessions
  from anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.consents to authenticated;
grant select, insert on public.pain_entries to authenticated;
grant select, insert on public.exercise_sessions to authenticated;

create policy "perfil: a própria pessoa lê" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: a própria pessoa cria" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: a própria pessoa altera" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "consentimento: a própria pessoa lê" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "consentimento: a própria pessoa registra" on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "consentimento: a própria pessoa revoga" on public.consents
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "diário: a própria pessoa lê" on public.pain_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "diário: a própria pessoa registra" on public.pain_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "sessões: a própria pessoa lê" on public.exercise_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sessões: a própria pessoa registra" on public.exercise_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Apagar a conta (LGPD: direito de eliminação) -----------------------------------------
-- A pessoa apaga a própria conta pelo app; o "on delete cascade" leva junto o perfil, os
-- consentimentos, o diário e as sessões.

create function public.delete_my_account() returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
