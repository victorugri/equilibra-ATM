# Como contribuir

Obrigado pelo interesse! O Equilibra ATM é um instrumento de pesquisa, então algumas regras
são mais rígidas do que num projeto comum.

## Textos de saúde

Esta é a regra que não pode ser quebrada:

- **Não escreva nem reescreva textos de saúde no código.** Todo texto clínico ou educativo
  vem de `src/content/pt-BR.json`, pelo código da planilha (`{{ 'EX-00' | content }}`).
- Para mudar um texto, a mudança é feita na planilha do banco de conteúdo pela
  pesquisadora, e o JSON é gerado de novo com `npm run content:build`. Pull requests que
  editam `pt-BR.json` à mão não serão aceitos.
- Textos com status **Lacuna** não podem aparecer no app. O `npm run content:check` falha
  se algum deles for usado.
- Nunca prometa resultado ("a placa cura", "sua dor diminuiu por causa dos exercícios").
  Indicadores calculados descrevem os dados; não fazem afirmação clínica.

Textos de interface (botões, títulos de navegação, mensagens de erro) podem ficar no código.

## Código

- Angular com componentes standalone, signals e controle de fluxo nativo (`@if`, `@for`).
  Detalhes em [CLAUDE.md](CLAUDE.md).
- Cores, tamanhos e espaçamentos só pelas variáveis de `src/styles/_tokens.scss`.
- Nomes no código em inglês; textos da interface e comentários em português.
- Acessibilidade é requisito: contraste mínimo de 4,5:1, área de toque de 44 × 44 ou mais,
  rótulos acessíveis e navegação por teclado.

Antes de abrir um pull request:

```bash
npm test -- --watch=false
npm run build
```

## Dados pessoais

Nunca inclua dados reais de participantes em issues, testes ou capturas de tela.
