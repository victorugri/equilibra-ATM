-- Consultas para a pesquisadora (rodar no SQL Editor do painel do Supabase).
-- Elas leem auth.users, então só funcionam no painel (não pelo app). Os participantes são
-- identificados pelo e-mail da conta, como definido para o estudo.
-- Para exportar: rode a consulta e use "Download CSV" no resultado.

-- 1. Participantes (contas) e consentimento --------------------------------------------
select
  u.email,
  u.created_at as conta_criada_em,
  p.nickname as apelido,
  p.uses_splint as usa_placa,
  c.content_code as texto_aceito,
  c.content_version as versao_conteudo,
  c.accepted_at as consentiu_em,
  c.revoked_at as revogou_em
from auth.users u
left join public.profiles p on p.id = u.id
left join lateral (
  select * from public.consents c where c.user_id = u.id order by c.accepted_at desc limit 1
) c on true
order by u.created_at;

-- 2. Adesão ao Programa 6x6: sessões por participante e por dia (0–6 esperado) ----------
-- Dia no fuso de São Paulo.
select
  u.email,
  (s.completed_at at time zone 'America/Sao_Paulo')::date as dia,
  count(*) as sessoes
from public.exercise_sessions s
join auth.users u on u.id = s.user_id
group by u.email, dia
order by u.email, dia;

-- 3. Diário da dor: todos os registros ---------------------------------------------------
select
  u.email,
  e.recorded_at at time zone 'America/Sao_Paulo' as registrado_em,
  e.pain as dor_0_a_10,
  e.exercises as fez_exercicios,
  e.splint as usou_placa,
  e.slept_well as dormiu_bem,
  e.note as observacao
from public.pain_entries e
join auth.users u on u.id = e.user_id
order by u.email, e.recorded_at;

-- 4. Resumo por participante -------------------------------------------------------------
select
  u.email,
  (select count(*) from public.pain_entries e where e.user_id = u.id) as registros_de_dor,
  (select round(avg(e.pain), 1) from public.pain_entries e where e.user_id = u.id) as dor_media,
  (select count(*) from public.exercise_sessions s where s.user_id = u.id) as sessoes_6x6,
  (
    select count(distinct (s.completed_at at time zone 'America/Sao_Paulo')::date)
    from public.exercise_sessions s
    where s.user_id = u.id
  ) as dias_com_sessao
from auth.users u
order by u.email;
