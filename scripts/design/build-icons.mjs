// Gera src/app/shared/ui/icon/icons.ts a partir dos SVGs exportados do Figma (design/assets).
//
// Uso: npm run icons:build
// Para incluir um ícone: salve o SVG do Figma em design/assets/<tela>/ e acrescente-o em ICONS.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ASSETS = resolve(ROOT, 'design/assets');
const OUTPUT = resolve(ROOT, 'src/app/shared/ui/icon/icons.ts');

/** Nome no app → arquivo em design/assets. */
const ICONS = {
  'nav-inicio': 'aprender/nav-inicio.svg',
  'nav-aprender': 'aprender/nav-aprender.svg',
  'nav-exercicios': 'aprender/nav-exercicios.svg',
  'nav-diario': 'aprender/nav-diario.svg',
  'nav-perfil': 'aprender/nav-perfil.svg',
  voltar: 'modulo/cabecalho-voltar.svg',
  fechar: 'sos/cabecalho-fechar.svg',
  sos: 'aprender/sos-icone.svg',
  'seta-modulo': 'aprender/item-modulo-seta.svg',
  'seta-exercicio': 'exercicios/item-seta.svg',
  'seta-botao': 'exercicios/botao-seta.svg',
  livro: 'aprender/titulo-icone.svg',
  ordem: 'aprender/modulos-dica.svg',
  'check-rodape': 'aprender/rodape-check.svg',
  'selo-protocolo': 'exercicios/selo-icone.svg',
  posologia: 'exercicios/posologia-icone.svg',
  'check-sessao': 'exercicios/sessao-check.svg',
  escudo: 'exercicios/lembrese-icone.svg',
  aviso: '6x6/aviso-icone.svg',
  play: '6x6/comecar-icone.svg',
  'sos-selo': 'sos/selo-icone.svg',
  'sos-progresso': 'sos/progresso-icone.svg',
  'sos-passo-1': 'sos/passo1-icone.svg',
  'sos-passo-2': 'sos/passo2-icone.svg',
  timer: 'sos/timer-icone.svg',
  alerta: 'sos/alerta-icone.svg',
  'indicador-dias': 'inicio/indicador-dias.svg',
  'indicador-dor': 'inicio/indicador-dor.svg',
  'indicador-media': 'inicio/indicador-media.svg',
  'indicador-lembrete': 'inicio/indicador-lembrete.svg',
  mais: 'inicio/botao-mais.svg',
  lampada: 'inicio/dica-icone.svg',
  calendario: 'diario/calendario.svg',
  nivel: 'diario/nivel-icone.svg',
  observacao: 'diario/observacao-icone.svg',
  salvar: 'diario/salvar-icone.svg',
  cadeado: 'diario/cadeado.svg',
  'periodo-7': 'evolucao/periodo-7.svg',
  'periodo-30': 'evolucao/periodo-30.svg',
  resumo: 'evolucao/resumo-icone.svg',
  grafico: 'evolucao/grafico-icone.svg',
  relatorio: 'evolucao/relatorio-icone.svg',
  pdf: 'evolucao/pdf-icone.svg',
  'escudo-privacidade': 'privacidade/escudo.svg',
  coracao: 'privacidade/coracao.svg',
  'privacidade-cadeado': 'privacidade/card-cadeado.svg',
  'nota-escudo': 'privacidade/nota-escudo.svg',
  'exercicio-guiado': 'boas-vindas/exercicio.svg',
  lembrete: 'boas-vindas/lembrete.svg',
  evolucao: 'boas-vindas/evolucao.svg',
  'selo-verificado': 'boas-vindas/selo.svg',
  email: 'conta/email.svg',
  senha: 'conta/senha.svg',
  check: 'conta/check.svg',
  celular: 'conta/celular.svg',
  pessoa: 'cadastro/pessoa.svg',
  dente: 'cadastro/dente.svg',
  telefone: 'cadastro/telefone.svg',
  'selo-check': 'perfil/selo-check.svg',
  editar: 'perfil/editar.svg',
  compartilhar: 'perfil/compartilhar.svg',
  privacidade: 'perfil/privacidade.svg',
  ver: 'perfil/ver.svg',
  chevron: 'perfil/chevron.svg',
  baixar: 'perfil/baixar.svg',
  apagar: 'perfil/apagar.svg',
  dentista: 'perfil/dentista.svg',
  ligar: 'perfil/ligar.svg',
  whatsapp: 'perfil/whatsapp.svg',
};

let out = `// Ícones exportados do Figma (página 7:2), arquivos originais em design/assets/.
// São Material Symbols (Apache-2.0, ver THIRD_PARTY_NOTICES.md) gerados pelo Google Stitch.
// A cor vem de currentColor; o tamanho padrão é o do Figma (width × height).
// Arquivo gerado por scripts/design/build-icons.mjs — não edite à mão.

export interface IconDef {
  width: number;
  height: number;
  /** Cada caminho; strokeWidth indica traço em vez de preenchimento. */
  paths: readonly { d: string; strokeWidth?: number }[];
}

export const ICONS = {
`;
for (const [name, file] of Object.entries(ICONS)) {
  const svg = readFileSync(join(ASSETS, file), 'utf8');
  const width = +svg.match(/width="([\d.]+)"/)[1];
  const height = +svg.match(/height="([\d.]+)"/)[1];
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  if (viewBox !== `0 0 ${width} ${height}`)
    throw new Error(`${name}: viewBox inesperado (${viewBox})`);
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*>/g)].map((m) => {
    const stroke = m[0].match(/stroke-width="([\d.]+)"/);
    return stroke ? `{ d: '${m[1]}', strokeWidth: ${+stroke[1]} }` : `{ d: '${m[1]}' }`;
  });
  out += `  '${name}': {\n    width: ${width},\n    height: ${height},\n    paths: [${paths.join(', ')}],\n  },\n`;
}
out += `} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
`;

writeFileSync(OUTPUT, out);
console.log(`✔ ${Object.keys(ICONS).length} ícones em src/app/shared/ui/icon/icons.ts`);
