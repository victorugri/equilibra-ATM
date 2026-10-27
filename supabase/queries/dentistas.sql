-- Conferência do CRO dos dentistas (rodar no SQL Editor do painel do Supabase).
-- O dentista cria a conta no app e preenche nome e CRO em /dentista. Confira o número no site
-- do conselho regional (CFO/CRO) antes de liberar.

-- 1. Dentistas aguardando conferência ---------------------------------------------------
select u.email, p.professional_name as nome, p.cro, u.created_at as conta_criada_em
from public.profiles p
join auth.users u on u.id = p.id
where p.cro is not null and not p.cro_verified
order by u.created_at;

-- 2. Liberar (troque o e-mail) ----------------------------------------------------------
-- update public.profiles set cro_verified = true
-- where id = (select id from auth.users where email = 'dentista@exemplo.com');

-- 3. Prescrições por dentista (só contagens; sem dados dos pacientes) -------------------
select
  p.professional_name as nome,
  p.cro,
  count(r.*) as prescricoes,
  count(r.*) filter (where r.active) as ativas,
  count(r.redeemed_at) as resgatadas_com_conta
from public.profiles p
left join public.prescriptions r on r.dentist_id = p.id
where p.cro is not null
group by p.id
order by prescricoes desc;
