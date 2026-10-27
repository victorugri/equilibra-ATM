# Equilibra ATM — ajustes para o Victor

> Cópia do Claude Doc da Tayná (19 de out. de 2026), colada em 26/10/2026.
> Original: https://claude.ai/artifact/HtwYN5z5xbi2oKCK1VxVn4
>
> O código do doc foi escrito sem acesso ao repositório (a partir do bundle publicado). Onde os
> nomes não batem com o projeto, vale o que já existe aqui.
>
> **Como ficou no projeto (seções 1–3, 26/10/2026):**
> - Planilha: APR-02 e APR-M1.2 com "Você não está só."; DIA-04 só com a média dos 7 dias;
>   linhas novas REL-P01 ("Registro diário", subtítulo do gráfico do Diário) e REL-P02 (cartão do
>   relatório na Evolução), ainda sem status.
> - "Relação diária com sessões de exercício" era o subtítulo do gráfico em Diário › Evolução (não
>   o relatório impresso). A Evolução sempre usa DIA-04; `averageOnExerciseDays` foi apagada.
> - A trava fica em `scripts/content/internal-labels.mjs`, usada pelo build (falha com rótulo
>   interno no texto e tira as referências internas) e pelo `content:check` (banco e `src/app`).
>   O motivo do bloqueio no JSON virou "sem embasamento" / "texto a definir".
> - O grep da seção 2 também pega "Dias com exercício" (só contagem, sem cruzar com a dor): isso
>   fica. A versão estrita (`dor média nos dias|dias em que você fez|relação diária`) dá ok.
>
> **Seção 5 (27/10/2026):**
> - Plano de hoje: lógica pura em `src/app/core/plan/daily-plan.ts` (com testes) e cartão
>   `pages/home/daily-plan-card.ts`, logo abaixo da saudação e acima dos 4 indicadores. Saíram o
>   botão "Registrar minha dor de hoje" (INI-05) e o cartão fixo da dica (INI-06, que entrou no
>   rodízio).
> - Item 1 vai para o Diário, que já tinha o "dormiu bem?". Item 2 (exercícios) fica para a seção 4,
>   porque depende da prescrição. Por enquanto o plano tem 2 itens.
> - Item 3: compressa com qualquer dor de hoje (abre o SOS direto no passo 3 e fica feita quando o
>   timer termina); módulo às segundas (fica feito ao abrir o módulo); nos outros dias, rodízio entre
>   o "Faça agora" do Módulo 3 (código original APR-M3.6, no lugar do INI-P06) e a dica do dia
>   (INI-06), com botão "Fiz". O que foi feito fica em `CareLog` (só no aparelho).
> - Planilha: INI-P01, P02, P04, P05 e P07, sem status. INI-P03 e LEM-P01 entram com a seção 4.
>   O tipo novo "Item do plano" segue o formato "Título — corpo".
> - Lembretes: 3 por dia às 10h, 15h e 20h; silêncio 21h–8h; personalizados até 6, e o teto de 6
>   também vale no banco (`cardinality(times) <= 6`). O "a cada 2 horas" (7 por dia) saiu. O modo
>   avaliação nunca foi feito na interface (LEM-06 segue sem uso). O Registro da manhã era só uma
>   tela provisória: a rota agora leva ao Diário.
> - A migração da fase 5 foi editada no lugar, porque ainda não foi aplicada no Supabase.
>
> **Seção 4 (27/10/2026):**
> - Migração `20261027120000_prescricoes.sql`, com nomes em inglês como o resto do banco
>   (`prescriptions`, `redeem_prescription`, `my_prescription`). Em vez de `papel`, o dentista é
>   quem tem `cro` no perfil, e `cro_verified` (conferido à mão, `supabase/queries/dentistas.sql`)
>   libera criar prescrições. Um gatilho impede o app de marcar `cro_verified`, e mudar o CRO
>   pede nova conferência. O nome que o paciente vê é `professional_name`, separado do apelido.
> - Limite de tentativas dentro do banco: 10 códigos errados por hora, por conta ou por IP
>   (`prescription_attempts`). Resgatar ou atualizar um código válido não conta.
> - Prescrição encerrada ou vencida volta como `{ active: false }`: o app tira os exercícios e
>   mostra o EX-P07. Código inexistente volta `null`.
> - App: `PrescriptionStore` guarda no IndexedDB (não no localStorage) e atualiza ao abrir
>   on-line e ao entrar na conta. As rotas `/exercicios/meus` (cartões) e `/exercicios/sessao`
>   (player) têm `canMatch`. O antigo `/exercicios/6x6` redireciona. O QR abre `/prescricao/ABC234`,
>   que leva a Exercícios com o código preenchido.
> - Catálogo prescritível em código (`pages/exercises/exercise-catalog.ts`): EX-R1 a R6 e EX-01 a
>   05 e EX-15. Não montei a lista só a partir do JSON porque a planilha tem códigos EX que não
>   são exercícios (EX-00, 06, 13, R0, R7, R8) e duplicatas do 6x6 (EX-07 a 12). Um código
>   bloqueado sai sozinho; um exercício novo pede uma linha no catálogo.
> - A sessão percorre os exercícios prescritos e a meta é `sessionsPerDay`. O EX-13 passou de
>   "de 6 sessões" para "de {meta} sessões" (mudança só da variável; vale a Dra. Tayná conferir).
> - LEM-P01: aparece em Exercícios para quem já tem lembretes ligados com um número diferente do
>   sugerido. "Usar" troca para 3 vezes ao dia ou para horários espalhados das 10h às 20h.
> - Sessão de exercício no lembrete (27/10/2026): a Edge Function espalha as sessões
>   prescritas entre os lembretes do dia (`_shared/exercise-slots.ts`; 2 sessões em 3 lembretes
>   vão às 10h e às 20h). A notificação ganha a linha INI-P03 ("Exercícios do seu dentista — 1 de
>   2 sessões") e o botão "Fazer a sessão agora". Para quando as sessões do dia foram feitas.
>   O paciente desliga em Meus lembretes (`exercise_reminders`). No iPhone não há botões: o
>   atalho fica no check-in.
> - No check-in, o "Exercício rápido" (EX-08, um exercício do 6x6, que aparecia para todos)
>   virou a sessão prescrita, e só aparece com prescrição e sessão por fazer.
> - Área `/dentista`: uma tela, com a largura do app (480 px). Tem o cadastro de nome e CRO, o
>   aviso de conferência, o formulário (atalho "Marcar os 6"), o código com QR e "Imprimir", e a
>   lista com "Ver código", "Editar" e "Encerrar". O canvas "Início e logo" não foi usado (não
>   tenho acesso).
>
> **Seção 6 (27/10/2026):**
> - O pacote completo fica em `design/assets/logo`. Em `public/` vão só os usados: `favicon.ico`,
>   `icons/lotus.svg` (cabeçalho e aba do navegador), `icone-app.svg`, `icone-192/512`,
>   `icone-maskable-192/512` (manifest) e `icone-180` (apple-touch-icon). Os ícones antigos saíram.
> - Cabeçalho principal e de onboarding com a lótus; no Início o título virou "Equilibra ATM".
> - Notificação dos lembretes: ícone `icone-192.png` e badge `lotus-512.png` (fundo transparente,
>   que é o que o Android usa). Vale com o próximo `npm run functions:deploy`.

Victor, estas são as correções que a Dra. Tayná aprovou depois da revisão do app publicado em
equilibraatm.ugrinovich.com. O app é para **pacientes com DTM em geral**, não para a pesquisa do
mestrado. Por isso, o consentimento atual (só para o funcionamento do app) e o aviso "Sem conta: seus
registros ficam só neste aparelho" **ficam como estão**.

| # | Mudança | Esforço | Onde mexe |
|---|---|---|---|
| 1 | "Você não está sozinho" → "Você não está só" | 5 min | Planilha de conteúdo |
| 2 | Tirar as comparações dor × exercício | 1 h | Planilha + Início/Diário/Relatório |
| 3 | Garantir que lacunas e rótulos internos não aparecem | 1 h | `build-content.mjs` |
| 4 | Exercícios só com prescrição do dentista | 2–3 dias | Banco, serviço, telas novas |
| 5 | "Plano de hoje" com no máximo 3 itens | 1–2 dias | Início, lembretes |
| 6 | Logo novo (lótus) | 30 min | `public/icons`, manifest |

O código abaixo é um ponto de partida: escrevi a partir do bundle publicado, sem acesso ao
repositório. O backend parece ser Supabase (cabeçalhos `x-upsert` no storage). Se não for, a lógica
vale igual e só muda a camada de dados.

**Regra que continua valendo:** nenhum texto de saúde novo vai para o app sem a aprovação da
Dra. Tayná. Os textos novos deste documento já foram aprovados (tabela no fim) e estão marcados com
**[aprovar]**.

## 1. "Você não está só"

A maior parte do público é de mulheres, então o texto passa a ser neutro. A frase aparece em duas
linhas do banco de conteúdo (texto longo do Módulo 1 e bloco "É comum").

1. Na planilha `banco_conteudo_app_DTM.xlsx`, troque **"Você não está sozinho."** por
   **"Você não está só."** nas duas linhas.
2. Rode o `scripts/content/build-content.mjs` de novo. Não edite o JSON gerado à mão.
3. Confira: `grep -rn "sozinho" src/` não deve retornar nada.

Vale a mesma atenção para os textos novos: prefira formas neutras ("Que bom ter você de volta", e não
"Bem-vindo de volta").

## 2. Sem causa e efeito entre dor e exercício

O app mostra a dor e os exercícios **lado a lado, nunca cruzados**. Comparar "dor nos dias com
exercício" leva o paciente a concluir que o exercício causou a melhora, ou que deve fazer mais quando
dói. Nenhuma das duas coisas é segura de afirmar.

| Onde | Texto atual | O que fazer |
|---|---|---|
| Resumo semanal / Diário | "Sua dor média nos últimos 7 dias: {x}/10. Nos dias em que você fez os exercícios, a dor média foi {y}/10." | Manter só "Sua dor média nos últimos 7 dias: {x}/10." |
| Relatório para o dentista | "Dor média nos dias com exercício (30 dias)" | Remover o indicador e o cálculo |
| Relatório para o dentista | "Relação diária com sessões de exercício" | Trocar por "Registro diário" [aprovar]: tabela com data, dor e sessões em colunas separadas, sem comentário |
| Relatório para o dentista | "Leve estes dados para sua próxima consulta" | Manter. Acrescentar abaixo: "Seu dentista vai interpretar esses dados com você." [aprovar] |

No código, apague a função que separa os dias com e sem sessão para calcular a média. Ela não deve
sobrar em nenhum lugar:

```ts
// REMOVER — qualquer cálculo deste tipo
const mediaDiasComExercicio = media(
  registros.filter(r => sessoesPorDia[r.data] > 0).map(r => r.dor)
);
```

```bash
# conferir depois da mudança
grep -rniE "dias (em que você fez|com exerc)|relação diária" src/ dist/ && echo "AINDA TEM" || echo ok
```

## 3. Lacunas e rótulos internos fora da tela

O JavaScript publicado ainda carrega textos internos da planilha. Eles não podem aparecer para o
paciente, e o ideal é que nem saiam no bundle. Encontrei estes:

- `Lacuna – sem embasamento na dissertação` (rótulo de status)
- `Resultados do questionário (Apêndice B)` e `resultados do questionário (Apêndice B)` (referências
  da pesquisa)
- `Conteúdo baseado na revisão da literatura científica do projeto` (cita "o projeto", que o paciente
  não conhece; use "Conteúdo baseado em revisão da literatura científica.", que já existe)
- `Modo avaliação (opcional)`, com pelo menos 12 alertas por dia: veio da metodologia da pesquisa. No
  app geral ele sai de vista (seção 5)

Trave isso no gerador de conteúdo, para não voltar no próximo build:

```js
// scripts/content/build-content.mjs — antes de gravar o JSON
const BLOQUEADOS = [/lacuna/i, /ap[êe]ndice/i, /disserta[çc][ãa]o/i, /question[áa]rio/i, /do projeto/i];

const linhasApp = linhas.filter(l => (l.status ?? '').trim().toLowerCase() !== 'lacuna');

for (const l of linhasApp) {
  const visivel = [l.textoApp, l.referenciasVisiveis].filter(Boolean).join(' ');
  const hit = BLOQUEADOS.find(rx => rx.test(visivel));
  if (hit) {
    console.error(`✖ ${l.codigo}: texto interno vazando (${hit}) → "${visivel.slice(0, 80)}…"`);
    process.exitCode = 1;
  }
}
if (process.exitCode) throw new Error('Conteúdo bloqueado. Corrija a planilha.');

// grave só o que o app usa: código + texto final (+ referências públicas)
const saida = Object.fromEntries(linhasApp.map(l => [l.codigo, { texto: l.textoApp, refs: l.referenciasVisiveis ?? null }]));
```

Os nomes das colunas (`status`, `textoApp`, `referenciasVisiveis`) são suposições; ajuste para os do
script. Colunas como "trecho literal da dissertação", "seção" e "observação" não vão para o JSON.

Depois do build: `grep -c -iE "lacuna|apêndice" dist/**/*.js` precisa dar 0.

## 4. Exercícios só com prescrição do dentista

O paciente só vê os exercícios que um dentista liberou. Sem prescrição, a aba Exercícios mostra um
convite para pedir o código na consulta. O Aprender e o SOS continuam abertos, porque são condutas
conservadoras e educativas.

### Como funciona

1. O dentista tem uma conta do tipo "dentista". Ela só cria prescrições depois que o administrador
   confere o CRO (campo `cro_verificado`).
2. Na área `/dentista`, ele marca os exercícios (os 6 do 6x6 e todos os exercícios citados nas fontes
   da revisão de literatura, pelos códigos), as sessões por dia (1 a 6), quantos lembretes sugere e
   uma observação curta opcional.
3. O app gera um código de 6 caracteres e um QR Code (`/prescricao/ABC234`). O dentista entrega
   impresso ou mostra na tela.
4. O paciente digita o código em Exercícios ou no Perfil. Funciona com ou sem conta: sem conta, a
   prescrição fica salva só no aparelho, como os outros registros.
5. O dentista pode editar ou encerrar a prescrição. O app atualiza quando estiver on-line.

**LGPD:** a prescrição vai do dentista para o paciente, nunca no sentido contrário. O dentista não vê
dor, diário nem uso do app. Isso só acontece se o paciente gerar o relatório e compartilhar, como já
é hoje.

### Banco (migração Supabase)

```sql
-- papel do usuário
create type papel_usuario as enum ('paciente', 'dentista', 'admin');
alter table perfis
  add column if not exists papel papel_usuario not null default 'paciente',
  add column if not exists cro text,
  add column if not exists cro_verificado boolean not null default false;

create table prescricoes (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  dentista_id      uuid not null references auth.users(id) on delete cascade,
  paciente_id      uuid references auth.users(id) on delete set null,
  exercicios       text[] not null check (cardinality(exercicios) between 1 and 12),
  sessoes_por_dia  smallint not null default 2 check (sessoes_por_dia between 1 and 6),
  lembretes_por_dia smallint not null default 3 check (lembretes_por_dia between 0 and 6),
  observacao       text check (char_length(observacao) <= 200),
  valida_ate       date,
  ativa            boolean not null default true,
  criada_em        timestamptz not null default now(),
  resgatada_em     timestamptz
);

alter table prescricoes enable row level security;

create policy dentista_le on prescricoes for select using (dentista_id = auth.uid());
create policy dentista_edita on prescricoes for update using (dentista_id = auth.uid());
create policy dentista_verificado_cria on prescricoes for insert with check (
  dentista_id = auth.uid() and exists (
    select 1 from perfis p where p.id = auth.uid() and p.papel = 'dentista' and p.cro_verificado));
create policy paciente_le on prescricoes for select using (paciente_id = auth.uid());

-- gera código sem letras ambíguas (sem 0/O, 1/I/L)
create or replace function gerar_codigo() returns text language sql as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random()*31)::int, 1), '')
  from generate_series(1, 6);
$$;
alter table prescricoes alter column codigo set default gerar_codigo();

-- resgate: funciona com ou sem login; com login, vincula ao paciente
create or replace function resgatar_prescricao(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare r prescricoes; nome text;
begin
  select * into r from prescricoes
   where codigo = upper(p_codigo) and ativa
     and (valida_ate is null or valida_ate >= current_date);
  if not found then return null; end if;

  if auth.uid() is not null and r.paciente_id is null then
    update prescricoes set paciente_id = auth.uid(), resgatada_em = now() where id = r.id;
  end if;

  select coalesce(apelido, 'Seu dentista') into nome from perfis where id = r.dentista_id;
  return json_build_object(
    'codigo', r.codigo, 'exercicios', r.exercicios, 'sessoesPorDia', r.sessoes_por_dia,
    'lembretesPorDia', r.lembretes_por_dia, 'observacao', r.observacao,
    'validaAte', r.valida_ate, 'dentistaNome', nome);
end $$;
grant execute on function resgatar_prescricao(text) to anon, authenticated;
```

Coloque um limite de tentativas no resgate (por IP, no Edge ou no proxy), para ninguém ficar
chutando códigos.

### Serviço Angular

```ts
// src/app/core/prescricao.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service'; // ajuste para o serviço que já existe

export interface Prescricao {
  codigo: string;
  exercicios: string[];        // códigos do banco de conteúdo, ex.: 'EX-R1'
  sessoesPorDia: number;       // 1–6
  lembretesPorDia: number;     // 0–6
  observacao?: string | null;
  validaAte?: string | null;   // 'YYYY-MM-DD'
  dentistaNome?: string;
}

const CHAVE = 'equilibra.prescricao';
const hoje = () => new Date().toISOString().slice(0, 10);

@Injectable({ providedIn: 'root' })
export class PrescricaoService {
  private db = inject(SupabaseService).client;

  readonly atual = signal<Prescricao | null>(this.lerLocal());
  readonly ativa = computed(() => {
    const p = this.atual();
    return !!p && (!p.validaAte || p.validaAte >= hoje());
  });
  readonly liberados = computed(() => new Set(this.ativa() ? this.atual()!.exercicios : []));

  podeVer(codigoExercicio: string) { return this.liberados().has(codigoExercicio); }

  async resgatar(codigoDigitado: string): Promise<Prescricao> {
    const codigo = codigoDigitado.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const { data, error } = await this.db.rpc('resgatar_prescricao', { p_codigo: codigo });
    if (error || !data) throw new Error('Código inválido ou vencido. Confira com seu dentista.');
    this.salvar(data as Prescricao);
    return data as Prescricao;
  }

  /** Chamar ao abrir o app, se estiver on-line. */
  async sincronizar() {
    const p = this.atual();
    if (!p || !navigator.onLine) return;
    const { data, error } = await this.db.rpc('resgatar_prescricao', { p_codigo: p.codigo });
    if (error) return;               // sem rede ou erro: mantém a cópia local
    data ? this.salvar(data as Prescricao) : this.remover(); // encerrada pelo dentista
  }

  remover() { this.atual.set(null); try { localStorage.removeItem(CHAVE); } catch {} }

  private salvar(p: Prescricao) { this.atual.set(p); try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch {} }
  private lerLocal(): Prescricao | null { try { return JSON.parse(localStorage.getItem(CHAVE) ?? 'null'); } catch { return null; } }
}
```

### Tela Exercícios

```ts
// exercicios.component.ts (trecho)
prescricao = inject(PrescricaoService);
exercicios = computed(() => TODOS_EXERCICIOS.filter(e => this.prescricao.podeVer(e.codigo)));
```

```html
@if (prescricao.ativa()) {
  <p class="origem">Exercícios indicados por {{ prescricao.atual()!.dentistaNome }}</p>
  @if (prescricao.atual()!.observacao; as obs) { <app-bloco tipo="Dica" titulo="Recado do seu dentista" [texto]="obs" /> }
  <!-- cartão de progresso: meta = sessoesPorDia, e não 6 fixo -->
  <app-progresso-sessoes [meta]="prescricao.atual()!.sessoesPorDia" />
  @for (e of exercicios(); track e.codigo) { <app-item-exercicio [exercicio]="e" /> }
  <app-aviso-seguranca codigo="EX-00" />
} @else {
  <app-convite-prescricao />   <!-- título, texto, campo do código, botão "Liberar exercícios" -->
}
```

Proteja também a rota do player (`/exercicios/:codigo`) com um `canMatch` que chama
`podeVer(codigo)`. Assim ninguém abre o exercício pelo link.

### Textos novos [aprovar]

| Onde | Texto |
|---|---|
| Convite, título | Seus exercícios vêm do seu dentista |
| Convite, texto | Cada pessoa precisa de exercícios diferentes. Na consulta, peça ao seu dentista o código de exercícios e digite aqui. |
| Convite, botão | Liberar exercícios |
| Erro | Código inválido ou vencido. Confira com seu dentista. |
| Topo da lista | Exercícios indicados por {nome} |
| Prescrição encerrada | Seu dentista encerrou estes exercícios. Se tiver dúvida, fale com ele. |

### Área do dentista (`/dentista`)

Uma tela só, pensada para o computador do consultório:

- lista de exercícios com caixa de seleção (o 6x6 vem com um atalho "marcar os 6");
- sessões por dia (1–6), lembretes por dia (0–6), validade opcional e observação de até 200
  caracteres;
- botão "Gerar código", que mostra o código grande, o QR (biblioteca `qrcode`) e "Imprimir";
- lista das prescrições criadas, com "Editar" e "Encerrar".

O desenho dessa tela e do novo Início está no canvas "Equilibra ATM – Início e logo".

## 5. Simplicidade: "Plano de hoje" com até 3 itens

O Início passa a mostrar um plano de no máximo 3 tarefas por dia, e o resto do app fica como
consulta, sem obrigação. Hoje, somando tudo, o paciente teria 6x6 seis vezes ao dia, respiração e
alongamento a cada 2 horas, compressa, registro matinal e lembretes, e até 12 alertas no modo
avaliação. No questionário da Dra. Tayná, a complexidade foi um dos maiores motivos de abandono (9 de
20 pacientes), e 85% disseram que notificações frequentes incomodam.

### Os 3 itens

| # | Item | Quando aparece | Tempo |
|---|---|---|---|
| 1 | Como está sua dor? (0–10 + dormiu bem? sim/não) | Todo dia | 15 s |
| 2 | Exercícios: X de N sessões | Só com prescrição; N vem da prescrição | 2–3 min por sessão |
| 3 | Cuidado do dia (um só, em rodízio) | Todo dia | 30 s a 3 min |

O "Cuidado do dia" escolhe um destes, nesta ordem de prioridade:

1. Se registrou dor hoje: "Alívio: compressa morna por 20 minutos", com o timer que já existe no SOS.
   (com qualquer dor, decidido)
2. Uma vez por semana, até terminar os 6 módulos: "Ler o Módulo X (3 min)".
3. Nos outros dias, rodízio fixo pelo dia do ano: "Faça agora" (posição de repouso, 30 s) e as dicas
   do dia.

### O que sai da rotina do paciente

- **Registro matinal separado:** as perguntas de sono viram o "dormiu bem?" do item 1.
- **Modo avaliação (12 alertas/dia):** sai da interface do paciente. Era da metodologia da pesquisa.
- **Respiração e alongamento "a cada 2 horas":** só aparecem se o dentista prescrever (são códigos de
  exercício como os outros).
- **Sequência de dias ("{n} dias seguidos"):** pode ficar, mas nunca com mensagem de perda ("você
  quebrou sua sequência").

### Lembretes: padrão conservador

| Ajuste | Padrão | O paciente pode |
|---|---|---|
| "Seus dentes estão se tocando agora?" | 3 por dia: 10h, 15h, 20h | De 0 a 6, e escolher os horários |
| Sessão de exercício | Junto com o lembrete mais próximo, na mesma notificação | Desligar |
| Horário de silêncio | 21h → 8h | Mudar |
| Teto total | 6 notificações por dia, somando tudo | — |

Se a prescrição trouxer `lembretesPorDia`, o app sugere esse número ao resgatar ("Seu dentista sugeriu
4 lembretes por dia. Usar?" [aprovar]), mas a escolha é sempre do paciente.

### Código

```ts
// src/app/inicio/plano-do-dia.service.ts
import { Injectable, computed, inject } from '@angular/core';
import { PrescricaoService } from '../core/prescricao.service';
import { DiarioService } from '../diario/diario.service';     // ajuste aos nomes reais
import { SessoesService } from '../exercicios/sessoes.service';
import { AprenderService } from '../aprender/aprender.service';

export interface ItemPlano {
  id: 'dor' | 'exercicios' | 'cuidado';
  titulo: string;
  detalhe: string;
  rota: string;
  feito: boolean;
  progresso?: { feito: number; meta: number };
}

const LIMIAR_DOR_COMPRESSA = 1;   // qualquer dor (decidido pela Dra. Tayná)
const DIA_DO_MODULO = 1;           // segunda-feira
const RODIZIO = ['INI-FACA-AGORA', 'INI-DICA-1', 'INI-DICA-2', 'INI-DICA-3']; // códigos do banco

@Injectable({ providedIn: 'root' })
export class PlanoDoDiaService {
  private prescricao = inject(PrescricaoService);
  private diario = inject(DiarioService);
  private sessoes = inject(SessoesService);
  private aprender = inject(AprenderService);

  readonly itens = computed<ItemPlano[]>(() => {
    const hoje = new Date();
    const dorHoje = this.diario.registroDeHoje();          // signal<{ dor: number } | null>
    const itens: ItemPlano[] = [];

    // 1. dor — sempre
    itens.push({
      id: 'dor', titulo: 'Como está sua dor?', detalhe: dorHoje ? `Registrado: ${dorHoje.dor}/10` : 'Leva 15 segundos',
      rota: '/diario', feito: !!dorHoje,
    });

    // 2. exercícios — só com prescrição ativa
    if (this.prescricao.ativa()) {
      const meta = this.prescricao.atual()!.sessoesPorDia;
      const feito = Math.min(this.sessoes.sessoesDeHoje(), meta);
      itens.push({
        id: 'exercicios', titulo: 'Exercícios do seu dentista', detalhe: `${feito} de ${meta} sessões`,
        rota: '/exercicios', feito: feito >= meta, progresso: { feito, meta },
      });
    }

    // 3. um cuidado do dia
    itens.push(this.cuidadoDoDia(hoje, dorHoje?.dor ?? null));

    return itens; // nunca mais de 3
  });

  readonly tudoFeito = computed(() => this.itens().every(i => i.feito));

  private cuidadoDoDia(hoje: Date, dor: number | null): ItemPlano {
    if (dor !== null && dor >= LIMIAR_DOR_COMPRESSA) {
      return { id: 'cuidado', titulo: 'Alívio: compressa morna', detalhe: '20 minutos, com timer',
               rota: '/sos', feito: this.diario.compressaFeitaHoje() };
    }
    const proximo = this.aprender.proximoModulo();          // number | null
    if (proximo && hoje.getDay() === DIA_DO_MODULO) {
      return { id: 'cuidado', titulo: `Ler o Módulo ${proximo}`, detalhe: 'Cerca de 3 minutos',
               rota: `/aprender/${proximo}`, feito: false };
    }
    const diaDoAno = Math.floor((+hoje - +new Date(hoje.getFullYear(), 0, 0)) / 864e5);
    const codigo = RODIZIO[diaDoAno % RODIZIO.length];
    return { id: 'cuidado', titulo: conteudo(codigo).titulo, detalhe: conteudo(codigo).resumo,
             rota: `/dica/${codigo}`, feito: this.aprender.dicaVistaHoje(codigo) };
  }
}
```

```html
<!-- inicio.component.html: substitui o botão "Registrar minha dor de hoje" e o cartão "Dica do dia" -->
<section class="plano" aria-labelledby="plano-titulo">
  <header><h2 id="plano-titulo">Plano de hoje</h2>
    <span>{{ feitos() }} de {{ plano.itens().length }}</span></header>

  @for (item of plano.itens(); track item.id) {
    <a class="item" [routerLink]="item.rota" [class.feito]="item.feito">
      <span class="check" aria-hidden="true">@if (item.feito) { <app-icone nome="check" /> }</span>
      <span class="textos"><strong>{{ item.titulo }}</strong><small>{{ item.detalhe }}</small></span>
      <app-icone nome="seta" aria-hidden="true" />
    </a>
  }

  @if (plano.tudoFeito()) { <p class="fim">Tudo feito por hoje. Até amanhã!</p> } <!-- [aprovar] -->
</section>
```

No Início, o painel de 4 indicadores continua, logo abaixo do plano. O botão grande "Registrar minha
dor de hoje" sai, porque virou o item 1.

## 6. Logo novo: lótus de 3 pétalas

O círculo genérico (`icons/icon.svg`) dá lugar à lótus de 3 pétalas, com um arco embaixo que lembra a
mandíbula. A Dra. Tayná tem o pacote `icones-equilibra-atm.zip`, com estes arquivos:

| Arquivo | Uso |
|---|---|
| `lotus.svg` | Logo no cabeçalho, sobre fundo claro |
| `lotus-branca.svg` | Sobre o degradê ou fundo escuro |
| `icone-app.svg`, `icone-1024.png`, `icone-512.png`, `icone-192.png` | Ícone do app (PWA/lojas) |
| `icone-maskable-512.png`, `icone-maskable-192.png` | Android (área segura de 80%) |
| `icone-180.png` | apple-touch-icon |
| `favicon.ico`, `icone-32.png`, `icone-16.png` | Aba do navegador |

```json
// manifest.webmanifest — trecho
"icons": [
  { "src": "icons/icone-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "icons/icone-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "icons/icone-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "icons/icone-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

```html
<!-- index.html -->
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" href="icons/lotus.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/icone-180.png">
```

Se preferir o SVG inline no componente do cabeçalho, é este:

```html
<svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true">
  <path d="M30 45 C18 43 10 33 9 20 C20 22 28 32 30 45 Z" fill="#2A9A96"/>
  <path d="M34 45 C46 43 54 33 55 20 C44 22 36 32 34 45 Z" fill="#2A9A96"/>
  <path d="M32 8 C42 19 42 35 32 46 C22 35 22 19 32 8 Z" fill="#006067"/>
  <path d="M15 53 Q32 61 49 53" fill="none" stroke="#006067" stroke-width="3" stroke-linecap="round"/>
</svg>
```

No cabeçalho do Início, o título "Início" pode virar "Equilibra ATM" com o logo, porque a aba de
baixo já diz onde a pessoa está.

## Decisões da Dra. Tayná e checklist

Antes de publicar, faltam três decisões clínicas:

- [x] Compressa: o plano sugere com qualquer dor registrada no dia (`LIMIAR_DOR_COMPRESSA = 1`)
- [x] Exercícios prescritíveis: todos os exercícios citados nas fontes da revisão de literatura
  (lista abaixo)
- [x] Textos novos aprovados; entram na planilha com os códigos da tabela abaixo

### Exercícios que o dentista pode prescrever

São todos os exercícios do banco de conteúdo com referência da revisão. Linhas com status "Lacuna"
(por exemplo, técnica de automassagem) continuam fora.

| Grupo | Exercício |
|---|---|
| Programa 6x6 de Rocabado | 1. Posição de repouso da língua |
| Programa 6x6 de Rocabado | 2. Postura dos ombros |
| Programa 6x6 de Rocabado | 3. Aceno de cabeça com apoio |
| Programa 6x6 de Rocabado | 4. Alongamento do pescoço |
| Programa 6x6 de Rocabado | 5. Abertura controlada da boca |
| Programa 6x6 de Rocabado | 6. Estabilização da mandíbula |
| Outros | Respiração diafragmática (5 min, a cada 2 h) |
| Outros | Alongamento passivo com os dedos (1 min, 6 vezes, a cada 2 h) |
| Outros | Movimentos controlados na frente do espelho (3 vezes ao dia) |
| Outros | Exercícios com resistência (punho no queixo) |
| Outros | Movimentos laterais e com objeto entre os dentes |
| Outros | Relaxamento muscular progressivo (áudio) |

No app, a área `/dentista` monta essa lista a partir do JSON gerado da planilha: todo código de
exercício (`EX-…`) que passou pela trava da seção 3 aparece para prescrição. Assim, quando a
Dra. Tayná incluir um exercício novo na planilha, ele aparece sem mudar o código.

### Textos aprovados: entram na planilha com estes códigos

Os códigos são sugestões no padrão da planilha. Confira se nenhum já existe antes de gravar.

| Código | Tela | Texto |
|---|---|---|
| APR-M1.2 (alteração) | Módulo 1 / "É comum" | Você não está só. |
| EX-P01 | Exercícios, convite | Seus exercícios vêm do seu dentista |
| EX-P02 | Exercícios, convite | Cada pessoa precisa de exercícios diferentes. Na consulta, peça ao seu dentista o código de exercícios e digite aqui. |
| EX-P03 | Exercícios, botão | Liberar exercícios |
| EX-P04 | Exercícios, erro | Código inválido ou vencido. Confira com seu dentista. |
| EX-P05 | Exercícios, topo | Exercícios indicados por {nome} |
| EX-P06 | Exercícios, recado | Recado do seu dentista |
| EX-P07 | Exercícios, encerrada | Seu dentista encerrou estes exercícios. Se tiver dúvida, fale com ele. |
| INI-P01 | Início | Plano de hoje |
| INI-P02 | Início, item 1 | Como está sua dor? · Leva 15 segundos |
| INI-P03 | Início, item 2 | Exercícios do seu dentista · {x} de {n} sessões |
| INI-P04 | Início, item 3 | Alívio: compressa morna · 20 minutos, com timer |
| INI-P05 | Início, item 3 | Ler o Módulo {n} · Cerca de 3 minutos |
| INI-P06 | Início, item 3 | Faça agora: solte os dentes · Lábios juntos, língua no céu da boca · 30 s |
| INI-P07 | Início, fim | Tudo feito por hoje. Até amanhã! |
| LEM-P01 | Lembretes | Seu dentista sugeriu {n} lembretes por dia. Usar? |
| REL-P01 | Relatório | Registro diário |
| REL-P02 | Relatório | Seu dentista vai interpretar esses dados com você. |

O INI-P06 reaproveita o texto do "Faça agora" do Módulo 3, que já está no banco. Se preferir, use o
código original no lugar de um novo.

### Checklist do Victor

- [x] "Você não está só" na planilha + build (seção 1)
- [x] Comparativos dor × exercício removidos; grep sem resultados (seção 2)
- [x] Trava no `build-content.mjs`; grep de "lacuna|apêndice" no `dist/` dá 0 (seção 3)
- [x] Migração `prescricoes` + RLS + `resgatar_prescricao` com limite de tentativas (seção 4).
  No repo: `prescriptions` e `redeem_prescription`. Falta aplicar com `npm run db:push`
- [x] `PrescricaoService`, aba Exercícios filtrada, `canMatch` no player (seção 4). No repo:
  `PrescriptionStore` e `prescriptionGuard`
- [x] Área `/dentista` e verificação manual de CRO (seção 4). A conferência é feita pelo
  `supabase/queries/dentistas.sql`
- [x] `PlanoDoDiaService` e cartão "Plano de hoje" no Início (seção 5). No repo: `dailyPlan` e
  `DailyPlanCard`. O item de exercícios entra com a seção 4
- [x] Lembretes: 3 por dia, silêncio 21h–8h, teto de 6; modo avaliação e registro matinal fora da
  rotina (seção 5). A sessão de exercício vai na mesma notificação (pode desligar)
- [x] Ícones novos, manifest e favicon (seção 6)
- [ ] Testar com e sem conta, on-line e off-line, em 390 px de largura
