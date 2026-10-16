# 7:36 — Início (painel)

Screenshot: `7-36-inicio.png`. Assets: `assets/inicio/`.

## Estrutura

1. Cabeçalho *Principal* "Início". Barra inferior e SOS.
2. Conteúdo padding 0 20, gap 20:
   - **Saudação** (degradê 147° `#005058` 7% → `#1E8F8C` 79%, raio 20, padding 20 20 22, gap 4,
     sombra `0 4px 16px rgba(0,51,64,.08)`, dois círculos decorativos brancos 8%):
     - Linha superior: ponto 12 `#8FE3C0` + "PLANO DIÁRIO ATIVO" Bold 16 `#BFF0EA`; pílula do dia
       da semana (`rgba(255,255,255,.18)`, SemiBold 14 branco).
     - "Bom dia, Maria" ExtraBold 28 branco, tracking -0,7.
     - "Veja como está o seu cuidado com a mandíbula." Regular 18 `rgba(255,255,255,.88)`.
   - **Seu resumo** (ExtraBold 20) + 2 linhas de **Indicador (42:276)**, gap 12:
     cartão branco raio 18, sombra `0 4px 8px rgba(0,51,64,.08)`, padding 16, gap 6; ícone em caixa
     40 raio 12 (fundo da cor do indicador, glifo 22 com traço na cor); espaço 4; rótulo SemiBold 14;
     valor ExtraBold 34 na cor + unidade Bold 16; detalhe Regular 14 (`#3E494A`).
     - Dias se cuidando (`#0C6344`/`#DDF4EA`) → **INI-01**
     - Última dor (`#B3401F`/`#FFE8E0`) → **INI-02**
     - Média da semana (`#3949A8`/`#E6E9FF`) → **INI-03**
     - Próximo lembrete (`#006067`/`#D8F1F2`) → **INI-04**
   - Botão "Registrar minha dor de hoje" (**INI-05**): `#147A82`, altura 56, raio 14, ícone + 22.
   - **Dica do dia** (`#FFF5D9`, raio 18, padding 20): círculo 48 `#FFE7A3` com lâmpada; título
     Bold 18 `#6B4500`; texto Regular 16 `#4A3A1A` → **INI-06**.

## No app

- O texto de cada indicador vem do banco no formato "Rótulo — {valor}unidade, detalhe": o app
  separa valor, unidade e detalhe para desenhar o cartão do Figma.
- Saudação pelo horário (Bom dia / Boa tarde / Boa noite); o nome entra quando houver cadastro
  (fase 4).
- **Omitido:** "PLANO DIÁRIO ATIVO" (o app não tem o conceito de plano).
- **Última dor:** o INI-02 tem `{intensidade}`, mas o banco não define as faixas (leve, moderada…).
  O app mostra só a nota e a data/hora até a pesquisadora definir.
- **Próximo lembrete:** os lembretes são da fase 5; até lá o cartão mostra "—".
