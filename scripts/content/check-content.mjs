// Verifica o banco de conteúdo e o uso dos códigos no código-fonte.
//
// Uso: npm run content:check            (avisos não quebram o build)
//      npm run content:check -- --strict (para publicar: avisos viram erros)
//
// Erros:
// - código usado no app que não existe no banco;
// - código usado no app que está bloqueado (Lacuna);
// - texto proibido no banco ou no código-fonte (ver FORBIDDEN).
// Avisos (erros com --strict):
// - código usado no app com status "revisar com orientador" ou sem status;
// - código usado no app ainda não aprovado pelo orientador.
//
// Não precisa da planilha: lê só src/content/pt-BR.json e src/app.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BANK = resolve(ROOT, 'src/content/pt-BR.json');
const SOURCE_DIR = resolve(ROOT, 'src/app');
const strict = process.argv.includes('--strict');

/** Frases que não podem aparecer no app (seção 4 do contexto do projeto). */
const FORBIDDEN = [
  { pattern: /\b46\s?%/, reason: 'estatística de 46% não pode ser exibida' },
  { pattern: /pare se sentir dor forte/i, reason: 'use a linha de segurança EX-00' },
  { pattern: /\[A DEFINIR/i, reason: 'texto provisório (Lacuna)' },
];

const bank = JSON.parse(readFileSync(BANK, 'utf8'));
const known = new Set([...Object.keys(bank.entries), ...Object.keys(bank.blocked)]);
const prefixes = [...new Set([...known].map((code) => code.split('-')[0]))];
const codePattern = new RegExp(
  `['"\`]((?:${prefixes.join('|')})-[A-Z]?\\d+(?:\\.\\d+)?)['"\`]`,
  'g',
);

const errors = [];
const warnings = [];
const notApproved = [];

for (const entry of Object.values(bank.entries)) {
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(entry.text)) errors.push(`${entry.code} no banco: ${reason}`);
  }
}

const usage = new Map();
for (const file of listSourceFiles(SOURCE_DIR)) {
  const source = stripComments(readFileSync(file, 'utf8'));
  const where = relative(ROOT, file).replaceAll('\\', '/');

  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(source)) errors.push(`${where}: ${reason}`);
  }
  for (const [, code] of source.matchAll(codePattern)) {
    if (!usage.has(code)) usage.set(code, new Set());
    usage.get(code).add(where);
  }
}

for (const [code, files] of usage) {
  const at = [...files].join(', ');
  if (bank.blocked[code]) {
    errors.push(
      `${code} está bloqueado (${bank.blocked[code]}) e não pode aparecer no app — ${at}`,
    );
    continue;
  }
  const entry = bank.entries[code];
  if (!entry) {
    errors.push(`${code} não existe no banco de conteúdo — ${at}`);
    continue;
  }
  if (entry.status === 'revisar')
    warnings.push(`${code} ainda está "revisar com orientador" — ${at}`);
  else if (entry.status === 'sem-status')
    warnings.push(`${code} está sem status na planilha — ${at}`);
  else if (!entry.approvedByAdvisor)
    notApproved.push(`${code} ainda não foi aprovado pelo orientador — ${at}`);
}

// Fora do modo estrito, os textos ainda não aprovados viram uma linha só.
if (strict) warnings.push(...notApproved);
else if (notApproved.length)
  warnings.push(
    `${notApproved.length} textos usados ainda sem "Aprovado" do orientador (detalhes: npm run content:check:strict)`,
  );

console.log(
  `Banco: ${Object.keys(bank.entries).length} textos, ${Object.keys(bank.blocked).length} bloqueados. ` +
    `Códigos usados no app: ${usage.size}.`,
);
for (const w of warnings) console.log(`${strict ? '✖' : '⚠'} ${w}`);
for (const e of errors) console.error(`✖ ${e}`);

if (errors.length || (strict && warnings.length)) {
  console.error(`\nVerificação do conteúdo falhou.`);
  process.exit(1);
}
console.log('✔ Conteúdo verificado.');

/** Exemplos em comentários não contam como uso. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    // Testes podem citar códigos bloqueados de propósito.
    return /\.(ts|html)$/.test(name) && !name.endsWith('.spec.ts') ? [path] : [];
  });
}
