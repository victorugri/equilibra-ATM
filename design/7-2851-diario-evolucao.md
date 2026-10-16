# 7:2851 — Diário · Evolução e relatório

Screenshot: `7-2851-diario-evolucao.png`. Assets: `assets/evolucao/`.

## Estrutura

1. Cabeçalho *Principal* "Diário". Barra inferior e SOS.
2. Conteúdo padding 0 20 40, gap 20:
   - Abas segmentadas (Evolução ativa) + filtros "Últimos 7 dias" / "Últimos 30 dias" (pílulas
     altura 44, ativa `#DEE8FF` texto `#006067`, inativa branca `#3E494A`, SemiBold 14, ícone).
   - **Resumo** (`#F0F3FF`, raio 12, padding 20, gap 18): círculo 48 `#A5F3CB` com ícone; rótulo
     Bold 14 maiúsculo `#0C6344`; título ExtraBold 20; texto Regular 16.
   - **Histórico de dor** (branco, raio 12, padding 20, gap 12): título Bold 20 + "Relação diária com
     sessões de exercício" SemiBold 14; legenda (linha `#006067` "Nível de dor (0-10)", ponto
     `#0C6344` "Exercício feito"); gráfico de linha 224 de altura com pontos e valores, dias no eixo
     X; ponto com ✓ nos dias com exercício.
   - Estatísticas (`#F0F3FF`, raio 12, padding 14): número ExtraBold 28 + rótulo SemiBold 14.
   - Gatilhos mais frequentes (barras). **Não implementado.**
   - **Relatório** (branco, raio 12, padding 20): círculo 48 `rgba(0,96,103,.1)`; rótulo "APOIO
     PROFISSIONAL" Bold 14 `#006067`; título Bold 20; texto Regular 16; botão `#006067` min 56;
     nota com cadeado SemiBold 14 "Você tem total controle. O documento só é gerado quando você
     clica aqui."

## No app

- **Resumo → DIA-04** ("Sua dor média nos últimos 7 dias: {x}/10. Nos dias em que você fez os
  exercícios, a dor média foi {y}/10."). Sem dias com exercício, mostra só o INI-03.
  **Omitido:** "PROGRESSO NOTÁVEL — Nos dias com exercício, sua dor média foi menor." (afirmação
  sobre resultado, proibida pela seção 4 do contexto).
- **Gráfico:** dor média de cada dia (0–10), com marcação nos dias com exercício (sessão do 6x6
  registrada ou "fiz os exercícios" no diário). **Omitida:** a "zona de conforto (<3)", que não
  tem base no banco.
- **Cores do gráfico:** no Figma a linha é `#006067` e o ponto de exercício `#0C6344`. O validador
  de paleta reprova o par (ΔE 6,1: indistinguíveis até sem daltonismo). O app usa uma cor só e marca
  o exercício por forma, numa faixa própria (círculo com ✓). Em 30 dias o marcador encolhe e perde o ✓.
- **Dica do gráfico:** em vez de balão flutuante, uma linha de leitura fixa abaixo do gráfico (no
  celular o balão ficaria sob o dedo ou atrás do cabeçalho fixo).
- **Estatísticas:** dias com exercício e dias com registro. **Omitido:** "Lembretes respondidos"
  (fase 5).
- **Gatilhos:** fora da versão enxuta do diário.
- **Relatório → PER-02.** Abre uma página para imprimir ou salvar em PDF pelo próprio navegador;
  nada sai do aparelho.
