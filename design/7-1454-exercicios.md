# 7:1454 — Exercícios

Screenshot: `7-1454-exercicios.png`. Assets: `assets/exercicios/`.

## Estrutura

1. Cabeçalho *Principal* "Exercícios".
2. Conteúdo (padding 0 20, gap 28):
   - H1 "Exercícios de Alívio": ExtraBold 28 `#006067`, tracking -0,7.
   - **Cartão do 6x6**: branco, raio 12, sombra `0 4px 24px -2px rgba(20,122,130,.08),
     0 2px 8px -1px rgba(30,41,59,.04)`.
     - Imagem 176 de altura (`foto-destaque.png`), degradê branco de baixo para cima; selo
       "PROTOCOLO DOMICILIAR" (fundo `#0C6344`, Bold 14 branco, maiúsculas, ícone 15).
     - Corpo padding 20, gap 20: título "Programa 6x6 de Rocabado" ExtraBold 26;
       posologia (fundo `#F0F3FF`, raio 8, ícone + "6 exercícios • 6 repetições • 6 vezes ao dia"
       Bold 18 `#006067`).
     - **Progresso de hoje** (fundo `#E7EEFF`, raio 8, padding 12): "Progresso de Hoje" Bold 16 +
       "2 de 6 sessões (33%)" ExtraBold 16 `#006067`; 6 círculos de 40: feito `#0C6344` com check,
       próximo `#9BF0F9` "3ª", pendente `#D8E3FB` "4ª"; legenda abaixo Bold/SemiBold 14.
     - Botão "Fazer sessão de agora (3 min)" `#006067`, min-height 56, raio 12, Bold 18 + seta.
   - **Os 6 exercícios**: "Os 6 exercícios" ExtraBold 22 + pílula "6 repetições cada"
     (`#F0F3FF`, SemiBold 14 `#006067`); texto "Faça na ordem. Toque em um exercício para ver o
     vídeo e o passo a passo." Regular 17.
     - **Item exercício 6x6 (40:244)** ×6, gap 10: branco, borda 1 `#E7EEFF`, raio 12, altura 80,
       padding 16 14 16 16, gap 14. Número: círculo 40 `#006067`, ExtraBold 18 branco. Nome Bold
       17; resumo Regular 15 lh 1.3; seta 24.
     - "**Baseado em:** Rocabado, 1983; Rocabado, Iglarsh, 1991." Regular 13 `#6E797A`.
   - **Lembre-se** (fundo `#F0F3FF`, raio 12, padding 20, gap 12): círculo 40 `#A5F3CB` com
     escudo; "Lembre-se:" Bold 20 `#0C6344`; texto Regular 18 `#111C2D` → **EX-00**.

## No app

- Nomes dos exercícios → título de `EX-R1` … `EX-R6`; posologia → `EX-06`; aviso → `EX-00`.
- Progresso: sessões registradas hoje no aparelho. Círculo feito mostra a hora; o próximo mostra
  "Próxima"; os outros ficam sem legenda (as legendas "Tarde", "Noite" do Figma eram exemplo).
- Botão: "Fazer a sessão agora" (sem "3 min", que não tem base no banco).

## Textos omitidos (sem código no banco)

- "O PROTOCOLO DOMICILIAR MAIS DIFUNDIDO" (camada nomeada EX-06, mas o texto não está no EX-06).
- Resumos de uma linha dos exercícios (ex.: "Língua no céu da boca, dentes separados, lábios
  fechados"). A linha EX-R7 do banco descreve os resumos, mas não traz o texto de cada um.
  **Para mostrar, incluir os 6 resumos na planilha.**
