# Design — cache do Figma

Cópia local das telas do arquivo Figma `1sYsYyUwQc2nMpQEc5G2kI`, página **7:2 "Revisão – conteúdo
da dissertação"**. A conta é do plano Starter (limite de chamadas ao MCP do Figma): antes de
buscar uma tela de novo, veja se ela já está aqui.

| Arquivo | Conteúdo |
| --- | --- |
| `pagina-7-2.metadata.xml` | Estrutura completa da página (ids, nomes de camada, tamanhos). Buscado em 16/10/2026. |
| `<id>-<tela>.png` | Screenshot da tela (render do Figma). |
| `<id>-<tela>.md` | Especificação extraída do `get_design_context`: medidas, cores, textos e decisões. |
| `assets/<tela>/` | SVGs e imagens exportados da tela (os usados no app foram copiados para `src/` ou `public/`). |

## Telas guardadas

| Id | Tela | Fase |
| --- | --- | --- |
| 7:991 | [Aprender](7-991-aprender.md) | 2 |
| 34:129 | [Módulo 1 (modelo dos 6 módulos)](34-129-modulo.md) | 2 |
| 7:1454 | [Exercícios](7-1454-exercicios.md) | 2 |
| 37:210 | [Programa 6x6 de Rocabado](37-210-programa-6x6.md) | 2 |
| 7:749 | [SOS – estou com dor](7-749-sos.md) | 2 |
| 7:36 | [Início](7-36-inicio.md) | 3 |
| 7:2310 | [Diário · Registro](7-2310-diario-registro.md) (versão antiga; vale a especificação enxuta) | 3 |
| 7:2851 | [Diário · Evolução e relatório](7-2851-diario-evolucao.md) | 3 |
| 7:300, 7:409, 23:2, 24:2, 7:3685 | [Entrada, conta e perfil](fase-4-conta.md) | 4 |
| 7:483, 7:2142, 7:2020 | [Lembretes e check-in rápido](fase-5-lembretes.md) | 5 |

Os módulos 2 a 6 (34:160, 34:191, 34:225, 34:256, 34:284) seguem o mesmo modelo do módulo 1; a
lista de blocos de cada um está no XML de metadados.

## Telas citadas no contexto que não existem na página 7:2

Os ids abaixo aparecem no `Contexto Inicial.txt`, mas não estão na página válida (provavelmente
foram removidos quando o conteúdo passou para os módulos):

- **7:1742 Player do exercício** — implementado a partir do estilo dos cartões do 6x6 (37:210).
- **7:2614 Alimentação** e **7:3107 Sono e relaxamento** — o conteúdo está nos módulos 4 e 5;
  as rotas `/alimentacao` e `/sono` redirecionam para eles.
- **7:4312 Bem-vindo de volta**.

Também há telas que o contexto não cita: **7:618** "Como prefere aprender (4 de 4)", **23:2**
"Criar conta", **24:2** "Cadastro (perfil)" e **7:1267** "Visualizador 3D da ATM".

## Padrões globais (vistos em todas as telas)

- **Cabeçalho (27:19)**, altura 64, fundo `#F9F9FF`, borda inferior 1px `#DEE3EA`, padding 0 16,
  gap 12, título Nunito Sans ExtraBold 20 `#111C2D` (uma linha, reticências).
  - *Principal* (abas): logo 32 + título. O círculo do Figma deu lugar à lótus de 3 pétalas
    (`design/assets/logo`, pacote da Dra. Tayná); no Início o título é "Equilibra ATM".
  - *Interna*: botão voltar círculo 40 `#F0F3FF` com chevron 22 (traço 2,5 `#006067`).
  - *SOS*: fundo `#FFF4F2`, botão fechar círculo 40 `#FFDAD6` com X, título `#93000A`.
- **Barra inferior**, altura 80, fundo `rgba(249,249,255,.95)` + blur 12, sombra
  `0 -4px 20px rgba(20,122,130,.06)`. Itens: ícone + rótulo SemiBold 14 `#3E494A`, gap 4,
  min-width 56. O Figma não mostra o estado ativo (o app usa cor primária + pílula).
- **SOS flutuante**, à direita (20) e 16 acima da barra: fundo `#AF301D`, pílula, min-height 56,
  padding 12 20, gap 6, ícone 23, "SOS" Bold 18 + "Estou com dor" SemiBold 14, branco; sombra
  `0 16px 40px -6px rgba(224,83,60,.45)`.
- Margem lateral 20; cartões brancos raio 12–20.

## Ajustes feitos no app em relação ao Figma

- **Contraste (WCAG 2.1 AA):** textos pequenos em `#6E797A` usam `--color-text-tertiary`
  (`#646F70`); textos de 12–13 px subiram para 14 px. Nos chips de posologia do 6x6, o fundo
  branco translúcido virou escuro translúcido (o texto branco pequeno ficava abaixo de 4,5:1 na
  parte clara do degradê).
- **Itens min-height em vez de altura fixa** (80): títulos longos quebram linha sem cortar.
- **Textos sem código no banco foram omitidos** (regra da seção 4 do contexto). Ver a lista em
  cada especificação.
