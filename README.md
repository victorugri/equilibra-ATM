# Equilibra ATM

App de autocuidado para adultos com **disfunção temporomandibular (DTM)** e **bruxismo**.
Ele apoia a pessoa entre as consultas com lembretes, exercícios, conteúdo educativo e um
diário da dor.

> Este aplicativo ajuda você a cuidar da DTM no dia a dia, mas não substitui a consulta.
> O diagnóstico e o plano de tratamento são feitos pelo seu dentista.

**Situação:** em desenvolvimento (fase 5 — lembretes). Ainda não usar com pacientes.

## Sobre a pesquisa

O Equilibra ATM é desenvolvido como parte de um projeto de pós-graduação do PPG CTAO,
ICT-UNESP São José dos Campos. Os requisitos vêm da revisão de literatura da dissertação e
de um questionário aplicado a pacientes. Todo texto de saúde do app é rastreável até a
dissertação (ver [Conteúdo](#conteúdo)).

### Princípios

- **Simplicidade.** No questionário, a facilidade de uso foi o principal motivo para usar
  um app (13 de 20) e a complexidade, um dos maiores motivos de abandono. Na dúvida: menos
  telas, menos campos, menos toques — e poucos lembretes por padrão.
- **Conteúdo com embasamento.** Nenhum texto de saúde é escrito no código; todos vêm do
  banco de conteúdo aprovado pela pesquisadora.
- **Acessibilidade.** WCAG 2.1 AA: contraste mínimo de 4,5:1, área de toque de 44 × 44 ou
  mais, corpo de texto de 16 a 18 px e linguagem leiga.
- **Privacidade.** Cadastro mínimo, consentimento explícito para dados de saúde (LGPD) e
  compartilhamento com o dentista só quando a pessoa autorizar.

## Como rodar

Requisitos: Node.js 24.15 ou mais novo (ou 22.22.3+).

```bash
npm ci
npm start          # servidor de desenvolvimento em http://localhost:4200
npm test           # testes unitários (Vitest)
npm run test:functions  # testes das Edge Functions (Web Push), no Node
npm run build      # build de produção em dist/ (com service worker)
```

O service worker (modo offline e instalação como app) só fica ativo no build de produção.
Para testar a instalação, sirva a pasta `dist/equilibra-atm/browser` com qualquer servidor
estático, por exemplo `npx http-server dist/equilibra-atm/browser -p 8080`.

## Conteúdo

Os textos de saúde ficam em [`src/content/pt-BR.json`](src/content/pt-BR.json), gerado a
partir da planilha do banco de conteúdo da pesquisa. Cada texto é identificado pelo código
da planilha (ex.: `APR-M1.2`, `EX-R3`, `INI-02`) e usado no app sempre por esse código:

```html
<p>{{ 'APR-18' | content }}</p>
<h2>{{ 'APR-M1.1' | content: 'title' }}</h2>
<p>{{ 'EX-13' | content: 'text' : { n: sessoes() } }}</p>
```

| Comando | O que faz |
| --- | --- |
| `npm run content:build` | Lê `banco_conteudo_app_DTM.xlsx` (na raiz) e gera o JSON. |
| `npm run content:check` | Verifica se todo código usado no app existe e não é Lacuna. Roda antes de todo build. |
| `npm run content:check:strict` | Igual, mas também exige que os textos usados estejam aprovados pelo orientador. Use antes de publicar. |

A planilha tem o trecho literal da dissertação e não é versionada neste repositório; o JSON
gerado tem só o texto final do app, as referências e o status.

## Estrutura

```
design/                 cache das telas do Figma (screenshots, especificações, SVGs)
scripts/content/        geração e verificação do banco de conteúdo
scripts/design/         geração dos ícones a partir dos SVGs do Figma
src/content/            banco de conteúdo gerado (pt-BR.json)
src/styles/             tokens de design (_tokens.scss) e estilos globais
src/app/core/content/   ContentService e pipe "content"
src/app/layout/         barra inferior, botão SOS, configuração das telas
src/app/shared/ui/      componentes reutilizáveis (ícone, cabeçalho, aviso fixo…)
src/app/core/data/      banco local (IndexedDB): diário, sessões do 6x6, perfil, LGPD
src/app/core/auth/      conta opcional (Supabase Auth)
src/app/core/sync/      sincronização aparelho ↔ conta
src/app/core/reminders/ lembretes: horários, notificações (Web Push) e check-in
supabase/               migrações, configuração e consultas do backend
supabase/functions/     Edge Function que envia os lembretes
src/app/pages/          telas
```

O design vem do Figma do projeto (página "Revisão – conteúdo da dissertação"). Cada tela
implementada tem a especificação e o screenshot em [`design/`](design/README.md), para não
precisar consultar o Figma de novo.

## Roteiro

1. **Base do projeto** — PWA, tokens de design, navegação, botão SOS, rotas e banco de conteúdo.
2. **Telas de conteúdo** — Aprender (6 módulos), SOS, Exercícios, Programa 6x6, Alimentação, Sono.
3. **Dados no aparelho** — Diário da dor, evolução, indicadores do Início, sessões do 6x6.
4. **Conta e LGPD** — onboarding, consentimento, cadastro mínimo, exportar e apagar dados, relatório para o dentista.
5. **Lembretes** — notificações push, resposta rápida e registro de adesão para a pesquisa.
6. **Engajamento** — conquistas, resumo semanal, registro da manhã e modo noite.

## Dados

- **Sem conta:** tudo fica só no aparelho, num banco IndexedDB (via [Dexie](https://dexie.org)):
  diário da dor, sessões do Programa 6x6 (com data e hora, para medir a adesão), perfil e
  consentimento. Nada é enviado para servidor.
- **Com conta (opcional):** o aparelho continua sendo a fonte; os registros novos são enviados
  para o [Supabase](https://supabase.com) (servidor em São Paulo) e voltam se a pessoa entrar em
  outro aparelho. Cada pessoa só acessa os próprios dados (RLS).
- **Lembretes (exigem conta):** a pessoa escolhe a frequência e o horário de silêncio. Cada
  lembrete enviado e a resposta do check-in ficam registrados — é a medida de adesão aos
  lembretes da pesquisa.
- **Exercícios com prescrição do dentista:** a aba Exercícios só mostra o que o dentista
  liberou. Ele prescreve em `/dentista` (conta com CRO conferido) e entrega um código de 6
  caracteres, com QR Code; o paciente digita o código, com ou sem conta. A prescrição vai só do
  dentista para o paciente: o dentista não vê nenhum dado do paciente.
- **Direitos do titular (LGPD):** no Perfil a pessoa vê, baixa (JSON) e apaga os dados — e a
  conta inteira, se tiver uma. O relatório para o dentista é montado no aparelho.

### Backend (Supabase)

O esquema do banco está em `supabase/migrations` e a configuração de autenticação em
`supabase/config.toml`. Os modelos de e-mail em português (`supabase/templates`) estão
desativados ali: no plano gratuito, só dá para usá-los com um servidor de e-mail (SMTP) próprio.
Consultas para a equipe de pesquisa: `supabase/queries/pesquisa.sql`. Conferência do CRO dos
dentistas (libera a criação de prescrições): `supabase/queries/dentistas.sql`.

Para usar um projeto Supabase seu:

1. Crie o projeto e troque a URL e a chave publicável em `src/environments/environment.ts`.
2. Troque o endereço do app (`site_url` e `additional_redirect_urls`) em `supabase/config.toml`.
3. Rode, na raiz do repositório:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npm run db:push
npm run db:config
```

### Lembretes (notificações)

O agendador do próprio Supabase (pg_cron) chama a cada minuto a Edge Function
`send-reminders`, que separa os lembretes vencidos e envia as notificações (Web Push,
criptografadas e assinadas com chaves VAPID, sem bibliotecas de terceiros). Ao tocar na
notificação, o app abre o check-in rápido daquele lembrete. Com prescrição do dentista, a
sessão de exercício vai junto com o lembrete mais próximo, sem notificação a mais.

Para ativar, nesta ordem (depois do `link` acima):

```bash
npm run db:push           # tabelas dos lembretes e o agendador
npm run push:keys         # gera as chaves: a privada vai direto para os segredos do Supabase
npm run functions:deploy  # publica a função que envia os lembretes
```

O `push:keys` grava a chave pública em `src/environments/environment.ts`; ela vai para o
app no próximo build. Num fork, troque também o endereço do projeto na migração
`supabase/migrations/20261017120000_lembretes.sql` (agendador). No iPhone, as notificações
só funcionam com o app instalado na Tela de Início (iOS 16.4 ou mais novo).

A chave publicável é pública por natureza. **Nunca** coloque no código a secret key /
service_role nem a senha do banco.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo: textos de saúde só mudam pela planilha,
com aprovação da pesquisadora.

## Licença

- **Código:** [MIT](LICENSE).
- **Textos de saúde** (`src/content/`): de autoria da equipe de pesquisa e **fora** da
  licença MIT. Todos os direitos reservados, salvo indicação em contrário.
- **Recursos de terceiros** (fonte e ícones): ver [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
