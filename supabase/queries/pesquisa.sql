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

-- 3. Diário da dor: um registro por dia ---------------------------------------------------
-- O app guarda um registro por dia. Quem atualiza o dia grava um registro novo (o anterior
-- fica no banco como histórico); vale o mais recente de cada dia, como no app.
-- Para ver também as versões substituídas, troque "select distinct on (...)" por "select".
select distinct on (u.email, (e.recorded_at at time zone 'America/Sao_Paulo')::date)
  u.email,
  (e.recorded_at at time zone 'America/Sao_Paulo')::date as dia,
  e.recorded_at at time zone 'America/Sao_Paulo' as registrado_em,
  e.pain as dor_0_a_10,
  e.exercises as fez_exercicios,
  e.splint as usou_placa,
  e.slept_well as dormiu_bem,
  e.note as observacao
from public.pain_entries e
join auth.users u on u.id = e.user_id
order by u.email, (e.recorded_at at time zone 'America/Sao_Paulo')::date, e.recorded_at desc;

-- 4. Resumo por participante -------------------------------------------------------------
-- Dor: só o registro que vale de cada dia (o mais recente), como no item 3.
with dor_do_dia as (
  select distinct on (e.user_id, (e.recorded_at at time zone 'America/Sao_Paulo')::date)
    e.user_id,
    e.pain
  from public.pain_entries e
  order by e.user_id, (e.recorded_at at time zone 'America/Sao_Paulo')::date, e.recorded_at desc
)
select
  u.email,
  (select count(*) from dor_do_dia d where d.user_id = u.id) as dias_com_registro_de_dor,
  (select round(avg(d.pain), 1) from dor_do_dia d where d.user_id = u.id) as dor_media,
  (select count(*) from public.exercise_sessions s where s.user_id = u.id) as sessoes_6x6,
  (
    select count(distinct (s.completed_at at time zone 'America/Sao_Paulo')::date)
    from public.exercise_sessions s
    where s.user_id = u.id
  ) as dias_com_sessao
from auth.users u
order by u.email;

-- 5. Adesão aos lembretes por participante ------------------------------------------------
-- Conta só os lembretes que chegaram ao serviço de notificação (sent_at preenchido).
-- "Respondidos" = escolheu uma das 4 opções do check-in (LEM-02).
select
  u.email,
  count(*) filter (where e.sent_at is not null) as lembretes_enviados,
  count(*) filter (where e.sent_at is not null and e.opened_at is not null) as abertos,
  count(*) filter (where e.sent_at is not null and e.answered_at is not null) as respondidos,
  count(*) filter (where e.sent_at is not null and e.skipped_at is not null and e.answer is null)
    as pulados,
  round(
    100.0 * count(*) filter (where e.sent_at is not null and e.answered_at is not null)
      / nullif(count(*) filter (where e.sent_at is not null), 0),
    1
  ) as percentual_respondidos
from auth.users u
join public.reminder_events e on e.user_id = u.id
group by u.email
order by u.email;

-- 6. Respostas do check-in por participante ---------------------------------------------
-- relaxed = relaxada; touching = dentes encostando; clenching = apertando; tense = músculos tensos.
select
  u.email,
  count(*) filter (where e.answer = 'relaxed') as relaxada,
  count(*) filter (where e.answer = 'touching') as dentes_encostando,
  count(*) filter (where e.answer = 'clenching') as apertando,
  count(*) filter (where e.answer = 'tense') as musculos_tensos
from auth.users u
join public.reminder_events e on e.user_id = u.id
where e.answer is not null
group by u.email
order by u.email;

-- 7. Todos os lembretes, um por linha (horário de São Paulo) ------------------------------
select
  u.email,
  e.scheduled_for at time zone 'America/Sao_Paulo' as lembrete,
  e.sent_at at time zone 'America/Sao_Paulo' as enviado_em,
  e.opened_at at time zone 'America/Sao_Paulo' as aberto_em,
  e.answer as resposta,
  e.answered_at at time zone 'America/Sao_Paulo' as respondido_em,
  e.skipped_at at time zone 'America/Sao_Paulo' as pulado_em
from public.reminder_events e
join auth.users u on u.id = e.user_id
order by u.email, e.scheduled_for;
