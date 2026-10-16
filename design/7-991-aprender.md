# 7:991 — Aprender

Screenshot: `7-991-aprender.png`. Assets: `assets/aprender/`.

## Estrutura

1. Cabeçalho *Principal* "Aprender".
2. Topo (padding 20):
   - Ícone em círculo 32 `rgba(0,96,103,.1)` + "Aprender" ExtraBold 28, tracking -0,7, lh 36.
   - Subtítulo Regular 18, lh 29,25, `#3E494A`: "Conhecimento simples e prático para aliviar sua
     mandíbula no dia a dia."
   - Seletor de formato Vídeo / Texto / Áudio (fundo `#E7EEFF`, raio 12). **Não implementado.**
3. Cartão "Conheça sua articulação em 3D" com imagem e botão "Explorar em 3D". **Não implementado.**
4. Seção "Módulos" (padding-top 28, gap 12):
   - "Módulos" Bold 22 + "6 módulos" SemiBold 14 `#006067`.
   - Dica: ícone + "Siga a ordem: primeiro entender, depois cuidar." Regular 16 `#3E494A`.
   - **Item de módulo (31:80)** ×6, gap 12: branco, raio 12, sombra `0 2px 4px rgba(18,28,46,.06)`,
     altura 80, padding 16 12 16 16, gap 14. Número: círculo 36 `#E7EEFF`, ExtraBold 16 `#006067`.
     Título Bold 17 lh 1.25; descrição Regular 14 lh 1.35 `#3E494A`; seta 22.
5. Rodapé: pílula `#F0F3FF`, check `#0C6344` + "Conteúdo baseado na revisão da literatura
   científica do projeto" SemiBold 14 `#3E494A`.

## Textos omitidos (sem código no banco)

- Descrições curtas dos módulos (ex.: "O que são, por que aparecem e por que costumam não
  piorar."). As camadas citam os códigos de origem (ex.: "APR-01 a 08 · 2.1, 2.2 e Introdução"),
  mas o banco não tem uma linha com o texto da descrição. **Para mostrar, incluir na planilha.**

## Fora do escopo agora

- Seletor Vídeo/Texto/Áudio: não há vídeo nem áudio dos módulos.
- Cartão 3D: não há modelo 3D (o rótulo APR-17 está "revisar com orientador").
