# 37:210 — Exercícios · Programa 6x6 de Rocabado

Screenshot: `37-210-programa-6x6.png`. Assets: `assets/6x6/`.

## Estrutura

1. Cabeçalho *Interna* "Exercícios".
2. Conteúdo: padding 20 20 40, gap 16.
   - **Destaque** (degradê 140° `#005058` 7% → `#1E8F8C` 79%, raio 20, padding 20, gap 10,
     sombra `0 4px 16px rgba(0,51,64,.08)`, elipse decorativa 170 no canto):
     - Etiqueta "Protocolo domiciliar": `rgba(255,255,255,.18)`, pílula, Bold 14 branco.
     - "Programa 6x6 de Rocabado" ExtraBold 28, lh 1.18, branco.
     - Posologia (camada "Posologia · EX-06"): 3 caixas `rgba(255,255,255,.16)` raio 14,
       padding 10 0: número ExtraBold 26 branco + rótulo SemiBold 13 `rgba(255,255,255,.9)`
       ("exercícios", "repetições", "ao dia").
   - **EX-00** (fundo `#FFF5D9`, raio 16, padding 14 16 14 14, gap 12): caixa 40 `#FFE7A3` raio 12
     com ícone 22; "Com cuidado" ExtraBold 16 `#6B4500`; texto Regular 15 `#4A3A1A`.
   - **Cartão de exercício** ×6 (branco, raio 20, padding 16 16 18, gap 14, mesma sombra):
     - Número: caixa 40 raio 12 com degradê, ExtraBold 18 branco; "Exercício N de 6" Bold 13
       `#1E7F7C`; nome ExtraBold 18.
     - **Espaço para vídeo (37:204)**: degradê 140° `#0B4F55` → `#1E8F8C`, raio 14, altura 177,
       play 60, "Vídeo em breve" Bold 16 branco, legenda Regular 14 `rgba(255,255,255,.8)`
       ("Exercício N · Nome"), decoração circular 160. O selo "Espaço para upload" é anotação
       de design e não vai para o app.
     - "COMO FAZER" ExtraBold 12, tracking 0,96, `#6E797A`.
     - Passos: círculo 24 `#D8F1F2` com número ExtraBold 13 `#006067`; texto Regular 16 lh 1.4.
     - Etiqueta "↻ 6 repetições" (`#D8F1F2`, Bold 14 `#006067`).
   - "**Baseado em:** Rocabado, 1983; Rocabado, Iglarsh, 1991." centralizado.
   - Botão "Começar sessão": altura 58, raio 14, `#147A82`, sombra `0 6px 16px rgba(20,122,130,.3)`,
     ícone play 20 + Bold 18 branco.

## No app

- Título → `EX-R0` (title); posologia → números do `EX-06`/`EX-R0`.
- Passos → `EX-R1` … `EX-R6`: o corpo "1. … 2. … 3. … (6 repetições)" é dividido em passos.
- Aviso → `EX-00` (o Figma tinha uma versão encurtada; vale o texto do banco). Título "Com cuidado".
- Vídeos: `public/videos/6x6-exercicio-N.mp4` quando forem gravados (9:16, 30–45 s).
