# Fase 4 — entrada no app, conta e perfil

Screenshots: `7-300-privacidade.png`, `7-409-boas-vindas.png`, `23-2-criar-conta.png`,
`24-2-cadastro.png`, `7-3685-perfil.png`. Assets: `assets/{privacidade,boas-vindas,conta,cadastro,perfil}/`.

## Padrões

- Cabeçalho *Onboarding*: logo 32 + "Equilibra ATM" Bold 18 `#006067`; "Pular" SemiBold 16 `#3E494A`.
- Indicador de etapa: pílula `#F0F3FF`, ponto 8 `#006067`, SemiBold 16 `#006067`.
- Campo: rótulo Bold 16; caixa branca, borda 1,5 `#BEC8C9`, raio 12, altura 56, padding 0 16, ícone 22,
  texto Regular 18; ajuda Regular 14 `#3E494A`. Pílula "Opcional" `#E7EEFF` Bold 13.
- Botão primário `#147A82` altura 56 raio 12; secundário com contorno 2 `#147A82`.
- Opções (placa): 3 botões de 52, raio 12; escolhido `#006067` branco; os outros brancos com borda.

## 7:300 — Privacidade (etapa 1)

Selo (círculo 80 `#E7EEFF` com círculo 56 `#147A82` e escudo; coração em círculo 28 `#0C6344`),
"Seus dados estão protegidos" ExtraBold 28, subtítulo Regular 19, 4 cartões de compromisso,
nota com o aviso APR-18, "Concordo e continuar" e "Ler termo de privacidade completo".

**No app:** os 4 cartões do Figma trazem frases que não estão no banco e uma não é exata
("níveis de dor ou tensão" — o app não registra tensão). O texto vem do **PER-01**, num cartão só.
A nota usa o **APR-18** literal. **Omitido:** "Ler termo completo" (o termo ainda não existe).

## 7:409 — Boas-vindas (etapa 2)

Título "Cuidar da sua mandíbula pode ser *simples*", descrição Regular 19, 3 itens (Exercícios
guiados, Lembretes gentis no dia, Acompanhe sua evolução) em cartões brancos com ícone em círculo
48 `#E7EEFF`, nota com selo + aviso, "Começar" e "Leva menos de 2 minutos…". Cabeçalho com "Pular".

**No app:** a nota usa o **APR-18** literal. "Pular" entra no app sem conta.

## Telas fora desta fase

- **7:483 Seus lembretes (3 de 4):** fase 5 (lembretes).
- **7:618 Como prefere aprender (4 de 4):** não há vídeo nem áudio dos módulos.
  Por isso o app mostra "Etapa 1 de 2" e "Etapa 2 de 2".

## 23:2 — Criar conta

"Crie seu acesso", e-mail, senha (com "Mostrar"), consentimento com caixa de seleção, "Criar conta",
"Já tenho conta · Entrar", divisor "ou", "Usar sem criar conta" e o aviso de que, sem conta, os
registros ficam só no celular.

**No app:** a caixa de consentimento começa **desmarcada** (no Figma aparece marcada; consentimento
para dado de saúde precisa ser ativo, LGPD art. 11). O texto do consentimento é o do Figma, com o
PER-01 logo abaixo. As telas "Entrar", "Esqueci a senha" e "Nova senha" seguem este mesmo modelo
(não existem no Figma).

## 24:2 — Cadastro (perfil)

"CONTA CRIADA ✓", "Complete seu cadastro", campos opcionais (como prefere ser chamado(a), usa placa
Sim/Não/Não sei, nome e telefone do dentista), "Salvar e continuar", "Pular por agora", nota de dados
mínimos. A mesma tela serve para "Editar dados" no Perfil.

**No app:** a ajuda da placa diz o que o app faz hoje ("Se não usa, o diário não pergunta sobre
a placa"); no Figma falava do registro da manhã (fase 6).

## 7:3685 — Perfil

Cartão do perfil (iniciais em círculo 64 `#9BF0F9`, nome, "Membro desde", e-mail, "Editar dados"),
Minhas conquistas, Compartilhar com meu dentista (chave, caixas e link de 48 h), Privacidade e meus
dados (ver, baixar, apagar), Meu dentista (Ligar, WhatsApp), links de ajuda e rodapé.

**No app:** sem conta, o cartão do perfil oferece "Criar conta" e "Entrar". "Compartilhar com meu
dentista" leva ao relatório da fase 3 (sem chave nem caixas: o relatório já só é gerado quando a
pessoa pede). Inclui "Sair da conta". **Omitidos:** conquistas (fase 6), link temporário de 48 h
(precisa de servidor próprio para isso), dúvidas frequentes, suporte e termos (sem conteúdo ainda).
