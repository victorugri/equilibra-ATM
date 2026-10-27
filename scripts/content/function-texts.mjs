// Textos do banco de conteúdo usados pelas Edge Functions do Supabase (a notificação do
// lembrete e a linha da sessão de exercício prescrita). As funções rodam no servidor e não leem src/content, então os textos são
// copiados para supabase/functions/_shared/notification-texts.ts.
//
// Uso: node scripts/content/function-texts.mjs   (também roda no "npm run content:build";
//      o "npm run content:check" confere se a cópia está igual ao banco)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BANK = resolve(ROOT, 'src/content/pt-BR.json');
export const FUNCTION_TEXTS_FILE = 'supabase/functions/_shared/notification-texts.ts';

/** Campo da notificação → código do banco de conteúdo. */
export const FUNCTION_CODES = {
  title: 'LEM-01',
  body: 'LEM-03',
  /** Junto com o lembrete, quando há sessão de exercício prescrita a fazer ({x} de {n}). */
  exercises: 'INI-P03',
};

export function renderFunctionTexts(bank) {
  const lines = Object.entries(FUNCTION_CODES).map(([field, code]) => {
    const entry = bank.entries[code];
    if (!entry) throw new Error(`${code} não existe no banco de conteúdo.`);
    return `  /** ${code} */\n  ${field}: ${quote(entry.text)},`;
  });
  return [
    '// Gerado por scripts/content/function-texts.mjs a partir de src/content/pt-BR.json.',
    '// Não edite à mão: altere a planilha e rode "npm run content:build".',
    '',
    'export const NOTIFICATION = {',
    ...lines,
    '} as const;',
    '',
  ].join('\n');
}

/** Aspas como o Prettier do projeto (simples, a não ser que o texto tenha apóstrofo). */
function quote(text) {
  if (text.includes("'") && !text.includes('"')) return JSON.stringify(text);
  return `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

export function writeFunctionTexts(bank) {
  writeFileSync(resolve(ROOT, FUNCTION_TEXTS_FILE), renderFunctionTexts(bank), 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFunctionTexts(JSON.parse(readFileSync(BANK, 'utf8')));
  console.log(`✔ Textos da notificação gravados em ${FUNCTION_TEXTS_FILE}`);
}
