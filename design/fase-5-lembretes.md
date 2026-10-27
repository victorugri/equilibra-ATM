# Fase 5 — lembretes

Screenshots: `7-483-lembretes-entrada.png`, `7-2142-meus-lembretes.png`, `7-2020-resposta-rapida.png`.
Assets: `assets/{lembretes-entrada,meus-lembretes,resposta-rapida}/`. Buscado em 17/10/2026.

**Decisões (17/10/2026):** lembretes só para quem tem conta (o servidor precisa saber para onde
enviar); modo avaliação de 7 dias (LEM-06) fica para depois. Os textos de saúde vêm da planilha
(LEM-01 a LEM-05, EX-08); os do Figma que não estão nela foram trocados ou omitidos.

## Padrões

- Cartão de opção: branco, raio 12, padding 20, sombra `0 1px 1px rgba(0,0,0,.05)`, gap 12–20.
  Indicador de rádio: círculo 28; escolhido `#006067` com check branco; os outros `#DEE8FF`.
  Título Bold 18 `#111C2D`; descrição Regular 16 `#3E494A`.
- Selo "Recomendado": pílula `#A5F3CB`, SemiBold 14 `#002114` (no 7:483 aparece "Ideal", Bold 14 `#005237`).
- Chip de horário: pílula branca, padding 6 12, ícone ~14 + SemiBold 14 `#006067`. Chip de horário
  personalizado: `#E7EEFF`, SemiBold 14 `#111C2D`.
- Interruptor: 64 × 36, desligado `#DEE8FF`, ligado `#006067`, botão branco 28.
- Botão primário `#006067` (ou `#147A82` na entrada) altura 56, raio 12.

## 7:483 — Seus lembretes (entrada, "Etapa 3 de 4")

Cabeçalho *Onboarding* com "Pular". Título "Seus lembretes de relaxamento" ExtraBold 28/35,
texto Regular 18/29,25, legenda "Qual ritmo combina melhor com você?" Bold 18. Quatro opções:
"3 vezes ao dia" (selo "Ideal", "Manhã, tarde e noite"), "A cada 2 horas", "Escolher horários"
(ícone de relógio) e "Não quero lembretes agora" ("Você poderá ativar quando quiser."). Cartão
"Horário de silêncio" `#E7EEFF` (ícone de lua em círculo 40, "Sem notificações durante seu descanso
(22:00 às 07:00).", botão "Ajustar" em pílula branca). "Continuar →" e a nota "Você terá controle
total sobre esses alertas no seu perfil".

**No app:** aparece depois do cadastro, só para quem criou conta. O texto de abertura é o
**LEM-05**. As frases "Recomendado para criar o hábito com calma." e "Para quem aperta muito os
dentes no trabalho." não estão na planilha: no lugar, cada opção mostra os horários.
"Pular" = sem lembretes (dá para ativar depois no Perfil). O selo de etapa não aparece (a entrada
do app tem outro número de etapas).

## 7:2142 — Meus lembretes (Perfil)

Cabeçalho *Interna* "Meus lembretes". Seções: texto de abertura; dica "Lábios selados, dentes
afastados e respiração nasal livre." (`#F0F3FF`); "Pausar por hoje" (ícone em círculo 44 `#FFDAD4`,
título SemiBold 20, "Pausa temporária", interruptor; "Reativa automaticamente amanhã.");
"Frequência dos lembretes" com "3 vezes ao dia" (Recomendado; 09:00, 14:30, 20:00 em chips com
sol, tarde e lua), "A cada 2 horas" e "Horários personalizados" (chips 09:30, 13:00, 17:30 e botão
"Definir meus horários" `#DEE8FF` altura 48); "Horário de silêncio" (botão "22:00 às 07:00" `#F0F3FF`
altura 44 com seta; barra "Modo Noturno ativo · 9 horas de descanso"); "Modo Avaliação de 7 Dias"
(selo "Novo", interruptor); "Salvar preferências de lembrete" e "Suas alterações sincronizam
instantaneamente com o dispositivo."

**No app:** texto de abertura = **LEM-05**. **Omitidos:** a dica (não está na planilha; o LEM-04
aparece depois de cada resposta), a barra "Modo Noturno" (o modo noite é da fase 6) e o modo
avaliação (depois). **Acrescentado:** a opção "Desligados" (o contexto pede opção de desligar) e os
avisos de estado: sem conta, notificações bloqueadas no aparelho e iPhone sem o app instalado na
tela inicial. Horários do padrão: **10:00, 15:00 e 20:00**. O Figma tinha 09:00, 14:30 e 20:00, e
o "A cada 2 horas" saiu. Pelos ajustes da Dra. Tayná, o silêncio padrão é 21h–8h e o teto é de 6
por dia (design/ajustes-tayna.md, seção 5).

## 7:2020 — Check-in rápido (resposta ao lembrete)

Cabeçalho *Interna* "Check-in rápido". Selo "Check-in em 3 segundos" (`#DEE8FF`, ícone de
cronômetro) e "Pular ×". Pergunta Bold 22/30 (−0,55), apoio "Toque no que você sente agora. Sem
julgamento." Regular 18/26. Quatro opções com altura mínima 72, padding 16, raio 12, ícone em
círculo 48 `#E7EEFF` e rádio 28 à direita; escolhida com fundo `#CEFAFF`, sombra
`0 4px 10px rgba(20,122,130,.12)`, círculo do ícone `#006067` e título `#006067`. Depois da escolha:
cartão "Dica:" `#147A82` (lâmpada em círculo 36 `#CEFAFF`, texto Regular 18/29,25 `#CEFAFF`, linha
final SemiBold 14 `#C9FFE1` com ícone); cartão "Exercício rápido · 30 seg" `#E7EEFF` com botão
"Fazer relaxamento de 30 segundos (Opcional)"; botão "✓ Salvo! Voltar ao que estava fazendo"
`#006067` altura 58.

**No app:** pergunta e opções = **LEM-02** (as descrições do Figma, como "Mordendo com pressão
involuntária", não estão na planilha). Dica = **LEM-04**; linha final = **LEM-03**. Exercício rápido =
**EX-08** (sem o botão de 30 s: não há relaxamento guiado no banco). "Pular" registra o lembrete
como aberto e não respondido.

## 7:1939 — Notificação na tela bloqueada

Só uma imagem de fundo: a notificação real é desenhada pelo sistema do celular. Título **LEM-01**,
texto **LEM-03**; ao tocar, abre o check-in rápido. Não foi buscada no Figma.
