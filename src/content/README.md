# Banco de conteúdo

`pt-BR.json` é **gerado** a partir da planilha `banco_conteudo_app_DTM.xlsx`
(aba "Banco de conteúdo") pelo comando `npm run content:build`. Não edite à mão.

- A chave de cada texto é o código da planilha (ex.: `APR-M1.2`, `EX-R3`, `INI-02`).
- Textos com status **Lacuna** não entram: aparecem só em `blocked`, e o
  `npm run content:check` recusa o build se algum deles for usado no app.
- O trecho literal da dissertação, a seção e as observações de revisão ficam só na
  planilha e não são exportados.

## Autoria e licença

Os textos de saúde deste diretório foram escritos pela equipe de pesquisa a partir da
dissertação e **não estão cobertos pela licença MIT** do código. Todos os direitos
reservados aos autores, salvo indicação em contrário.
