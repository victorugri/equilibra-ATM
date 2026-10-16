# Equilibra ATM

App de autocuidado para adultos com **disfunção temporomandibular (DTM)** e **bruxismo**.
Ele apoia a pessoa entre as consultas com lembretes, exercícios, conteúdo educativo e um
diário da dor.

> Este aplicativo ajuda você a cuidar da DTM no dia a dia, mas não substitui a consulta.
> O diagnóstico e o plano de tratamento são feitos pelo seu dentista.

**Situação:** em desenvolvimento (fase 3 — diário e dados no aparelho). Ainda não usar com pacientes.

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
src/app/core/data/      banco local (IndexedDB): diário da dor, sessões do 6x6, primeiro acesso
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

Nesta fase todos os dados ficam **só no aparelho**, num banco IndexedDB (via [Dexie](https://dexie.org)):
registros do diário da dor, sessões do Programa 6x6 (com data e hora, para medir a adesão) e a data
do primeiro acesso. Nada é enviado para servidor. O relatório para o dentista é montado no próprio
aparelho e só sai dele se a pessoa imprimir ou salvar em PDF. Conta, sincronização e as opções da
LGPD (ver, baixar e apagar os dados) vêm na fase 4.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo: textos de saúde só mudam pela planilha,
com aprovação da pesquisadora.

## Licença

- **Código:** [MIT](LICENSE).
- **Textos de saúde** (`src/content/`): de autoria da equipe de pesquisa e **fora** da
  licença MIT. Todos os direitos reservados, salvo indicação em contrário.
- **Recursos de terceiros** (fonte e ícones): ver [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
