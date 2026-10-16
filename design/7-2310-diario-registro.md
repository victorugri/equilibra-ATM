# 7:2310 — Diário · Registro

Screenshot: `7-2310-diario-registro.png` (**versão antiga**). Assets: `assets/diario/`.

O redesenho desta tela não foi aplicado no Figma (seção 6 do contexto). O app segue a
**especificação aprovada da versão enxuta** e usa o Figma só como referência visual:

1. "Como está sua dor agora?" com a escala 0–10 em uma linha (rótulos "Sem dor" e "Máxima");
2. respostas rápidas sim/não: fiz os exercícios / usei a placa (só para quem usa) / dormi bem;
3. observação opcional de uma linha;
4. botão "Salvar registro";
5. mini gráfico de 7 dias com a média e o link "Ver evolução completa".

## Referência visual aproveitada

- Abas segmentadas "Registro de hoje" / "Evolução" (fundo `#E7EEFF`, pílula; ativa branca com
  texto `#006067`, SemiBold 16).
- Linha da data: calendário + "Hoje, 24 de outubro" SemiBold 20; pílula de estado "Não registrado"
  (`#FFDAD4`, ponto `#AF301D`, SemiBold 14 `#3F0300`).
- Cartões brancos raio 12, padding 20, gap 12; título Bold 22; apoio Regular 16 `#3E494A`.
- Item selecionado `#006067` com texto branco; não selecionado `#F0F3FF`.
- Campo de texto `#F0F3FF`, raio 12, padding 14, Regular 18.
- Botão salvar `#006067`, min-height 56, raio 12, ícone 20 + Bold 18.
- Nota de privacidade com cadeado: "Seus dados ficam salvos apenas com você e sob a proteção da
  LGPD." (verdadeira enquanto os dados ficarem só no aparelho; revisar quando houver sincronização).

## Decisões

- **Pergunta da dor → DIA-01** ("Quanto está doendo agora? (0 = nenhuma dor; 10 = a pior dor
  possível)"); rótulos das pontas "Sem dor" e "Máxima" da especificação.
- **Escala 0–10 em uma linha com área de toque de 44:** 11 botões não cabem em 44 px de largura
  numa tela de 390. O app usa um controle deslizante (o cursor tem 48 px) com os números 0–10
  embaixo; tocar num número também escolhe.
- **Placa:** a resposta tem "Sim / Não / Não uso", sem precisar de cadastro.
- **Fora da versão enxuta:** mapa do rosto (DIA-02), gatilhos (DIA-03) e as faixas com emojis.
