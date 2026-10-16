# 34:129 — Aprender · Módulo (modelo)

Screenshot: `34-129-modulo-1.png`. Assets: `assets/modulo/`.

## Estrutura

1. Cabeçalho *Interna*, título "Aprender".
2. Conteúdo: padding 24 20 40, coluna com gap 14.
   - Indicador "Módulo N de 6": pílula `#F0F3FF`, padding 4 12, SemiBold 16 `#006067`.
   - Título do módulo: ExtraBold 28, line-height 1.2, `#111C2D`.
   - Introdução: Regular 18, lh 1.35, `#3E494A` → código `APR-MN.0`.
   - Espaço de 4.
   - **Bloco de conteúdo (34:128)**, padding 18, raio 12, gap 6:
     - *Padrão*: fundo branco, título Bold 17 lh 1.25 `#111C2D`, texto Regular 17 lh 1.35 `#3E494A`.
     - *Dica*: fundo `#E7EEFF`, título `#006067`.
     - Textos → `APR-MN.1`… (`title`/`body`); o tipo "Dica" do banco usa a variante Dica.
   - "**Baseado em:** …" Regular 13 `#6E797A` (Bold no rótulo) → referências dos blocos, sem repetir.
   - Botão "Próximo módulo" (no 6º: "Concluir"): altura 56, raio 12, `#147A82`, Bold 18 branco.
   - Link "Voltar ao Aprender": Bold 16 `#006067`, centralizado.

## Blocos por módulo (camadas no Figma → códigos do banco)

| Módulo | Camadas no Figma | Códigos usados |
| --- | --- | --- |
| 1 | APR-01, APR-02, APR-03, APR-06/07, APR-05 | APR-M1.0 … APR-M1.5 |
| 2 | APR-10, APR-11, APR-12, APR-13, APR-18 | APR-M2.0 … APR-M2.5 |
| 3 | APR-07, APR-09, APR-04, LEM-07, MIN-01, LEM-04 | APR-M3.0 … APR-M3.6 |
| 4 | ALI-01, ALI-02, ALI-03, ALI-02, ALI-04 | APR-M4.0 … APR-M4.5 |
| 5 | SON-02, SON-03, APR-14, SON-05 | APR-M5.0 … APR-M5.4 |
| 6 | SOS-04, EX-02, EX-06, EX-00 | APR-M6.0 … APR-M6.4 |

As linhas `APR-M*` do banco são as versões dos textos feitas para os módulos ("Derivado de …").

## No app

- Aviso fixo APR-18 no rodapé (pedido do banco: "rodapé das lições"); o módulo 2 já o tem como
  bloco, então ali não se repete.
