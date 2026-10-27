You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Projeto Equilibra ATM

App (PWA) de autocuidado para DTM e bruxismo, instrumento de uma pesquisa de pós-graduação
(ICT-UNESP). Contexto completo, telas e ids do Figma em `Contexto Inicial.txt` (só local,
não versionado). Princípio que guia tudo: simplicidade — menos telas, campos e toques.

- **Textos de saúde:** nunca escrever no código. Usar `{{ 'CÓDIGO' | content }}` ou
  `ContentService.get()`. Os textos vêm de `src/content/pt-BR.json`, gerado da planilha
  `banco_conteudo_app_DTM.xlsx` com `npm run content:build`. Códigos Lacuna são bloqueados;
  `npm run content:check` valida o uso (roda no prebuild). Ver CONTRIBUTING.md.
- **Design:** tokens em `src/styles/_tokens.scss` (cores, tipografia, espaçamento). Não usar
  valores soltos. Componentes espelham os do Figma (página 7:2).
- **Telas:** rotas em `src/app/app.routes.ts` com `ScreenData` (id do Figma, barra inferior,
  SOS, voltar, aviso APR-18). Telas ainda não feitas usam `PlaceholderPage`.
- **Figma:** plano Starter com limite de chamadas. Antes de buscar uma tela, veja `design/README.md`
  (screenshots, especificações e SVGs já baixados). Ícones: SVG em `design/assets` + `npm run icons:build`.
- **Dados:** `src/app/core/data` (Dexie/IndexedDB, só no aparelho). Serviços com `ready` (Promise) e
  signals; estatísticas puras em `diary-stats.ts`. Testes usam `fake-indexeddb` (src/test-setup.ts).
- **Conta (opcional) e sincronização:** Supabase (São Paulo). `AuthService` carrega o cliente sob
  demanda; `SyncService` envia o que tem `dirty = 1` e traz o que falta. Esquema e RLS em
  `supabase/migrations`; quem aplica no projeto é o usuário (`npm run db:push`). Não criar contas
  nem fazer login no Supabase real durante testes — isso é com o usuário.
- **Lembretes (fase 5):** exigem conta. Preferências e respostas ficam no aparelho e sobem pela
  sincronização (`src/app/core/reminders`). O servidor envia: pg_cron → Edge Function
  `send-reminders` → Web Push (`supabase/functions/_shared/web-push.ts`, só WebCrypto, testado com
  `npm run test:functions`). Os textos da notificação vêm do banco (gerados por
  `scripts/content/function-texts.mjs`). Chaves VAPID: `npm run push:keys` (a privada nunca no código).
- **Prescrição do dentista:** exercícios só com prescrição (`src/app/core/prescription`, guardada
  no aparelho e atualizada pela função `redeem_prescription`). Catálogo em
  `pages/exercises/exercise-catalog.ts`; área `/dentista`. O CRO é conferido à mão
  (`supabase/queries/dentistas.sql`); `cro_verified` nunca muda pelo app (gatilho no banco).
- **Gráficos:** SVG próprio, uma cor; leitura do dia abaixo do gráfico e tabela com os valores.
- **Convenções:** identificadores em inglês; textos de interface e comentários em português (pt-BR).
- **Commits:** o usuário faz os commits; não commitar.
