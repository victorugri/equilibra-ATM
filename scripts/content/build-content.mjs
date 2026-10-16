// Gera src/content/pt-BR.json a partir da planilha banco_conteudo_app_DTM.xlsx.
//
// Uso: npm run content:build [-- caminho/da/planilha.xlsx]
//
// Regras (ver CONTRIBUTING.md):
// - O texto vai para o JSON exatamente como está na coluna "Texto para o app".
// - Linhas com status "Lacuna" ou com "[A DEFINIR" no texto NÃO entram no JSON:
//   ficam só como código bloqueado, para que o verificador recuse o uso delas.
// - O trecho literal da dissertação, a seção e as observações de revisão não são
//   exportados (ficam só na planilha).

import ExcelJS from 'exceljs';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_XLSX = resolve(ROOT, 'banco_conteudo_app_DTM.xlsx');
const OUTPUT = resolve(ROOT, 'src/content/pt-BR.json');

const SHEET_CONTENT = 'Banco de conteúdo';
const SHEET_README = 'Leia-me';

/** Cabeçalhos da planilha → campos do JSON. As demais colunas são ignoradas. */
const COLUMNS = {
  Código: 'code',
  Módulo: 'module',
  'Tela / elemento': 'screen',
  Tipo: 'type',
  'Texto para o app': 'text',
  Referências: 'references',
  Status: 'status',
  'Revisão do orientador': 'advisorReview',
};

/** Tipos cujo texto segue o formato "Título — corpo". */
const TITLED_TYPES = new Set(['Bloco', 'Dica', 'Destaque', 'Indicador', 'Passo a passo']);
const TITLE_SEPARATOR = ' — ';

const xlsxPath = resolve(process.argv[2] ?? DEFAULT_XLSX);
if (!existsSync(xlsxPath)) {
  console.error(`Planilha não encontrada: ${xlsxPath}`);
  console.error('Coloque banco_conteudo_app_DTM.xlsx na raiz do projeto ou passe o caminho.');
  process.exit(1);
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(xlsxPath);

const sheet = workbook.getWorksheet(SHEET_CONTENT);
if (!sheet) fail(`Aba "${SHEET_CONTENT}" não encontrada.`);

const columnIndex = mapColumns(sheet.getRow(1));
const entries = {};
const blocked = {};
const report = { revisar: [], semStatus: [], notes: [] };

sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;
  const raw = Object.fromEntries(
    Object.entries(columnIndex).map(([field, col]) => [field, cellText(row.getCell(col))]),
  );
  if (!raw.code) return;

  if (entries[raw.code] || blocked[raw.code])
    fail(`Código duplicado na linha ${rowNumber}: ${raw.code}`);

  const status = normalizeStatus(raw.status);
  if (status === 'lacuna' || raw.text.includes('[A DEFINIR')) {
    blocked[raw.code] = raw.status || 'Texto [A DEFINIR]';
    return;
  }
  if (!raw.text) fail(`Linha ${rowNumber} (${raw.code}) sem "Texto para o app".`);

  const entry = {
    code: raw.code,
    module: raw.module,
    screen: raw.screen,
    type: raw.type,
    text: raw.text,
    references: parseReferences(raw.references),
    status,
    approvedByAdvisor: /^aprovado/i.test(raw.advisorReview),
  };

  // Marcação editorial no início do texto, ex.: "[SOMENTE COM INDICAÇÃO DO DENTISTA] ...".
  const note = entry.text.match(/^\[([^\]]+)\]\s*/);
  if (note) {
    entry.note = note[1];
    entry.text = entry.text.slice(note[0].length);
    report.notes.push(`${entry.code}: [${entry.note}]`);
  }

  if (TITLED_TYPES.has(entry.type) && entry.text.includes(TITLE_SEPARATOR)) {
    const at = entry.text.indexOf(TITLE_SEPARATOR);
    entry.title = entry.text.slice(0, at).trim();
    entry.body = entry.text.slice(at + TITLE_SEPARATOR.length).trim();
  }

  if (status === 'revisar') report.revisar.push(entry.code);
  if (status === 'sem-status') report.semStatus.push(entry.code);
  entries[entry.code] = entry;
});

const bank = {
  $comment:
    'Gerado por scripts/content/build-content.mjs a partir da planilha do banco de conteúdo. Não edite à mão: altere a planilha e rode "npm run content:build".',
  source: {
    file: basename(xlsxPath),
    dissertationVersion: readDissertationVersion(workbook),
  },
  entries,
  blocked,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(bank, null, 2) + '\n', 'utf8');

console.log(
  `✔ ${Object.keys(entries).length} textos exportados para ${OUTPUT.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`,
);
console.log(
  `  ${Object.keys(blocked).length} bloqueados (Lacuna): ${Object.keys(blocked).join(', ')}`,
);
if (report.revisar.length)
  console.log(`  ${report.revisar.length} a revisar com orientador: ${report.revisar.join(', ')}`);
if (report.semStatus.length)
  console.log(
    `  ${report.semStatus.length} sem status na planilha: ${report.semStatus.join(', ')}`,
  );
if (report.notes.length) console.log(`  Marcações editoriais: ${report.notes.join('; ')}`);

// ---------------------------------------------------------------------------

function mapColumns(headerRow) {
  const found = {};
  headerRow.eachCell((cell, col) => {
    const field = COLUMNS[cellText(cell)];
    if (field) found[field] = col;
  });
  const missing = Object.entries(COLUMNS)
    .filter(([, field]) => !found[field])
    .map(([header]) => header);
  if (missing.length)
    fail(`Colunas não encontradas na aba "${SHEET_CONTENT}": ${missing.join(', ')}`);
  return found;
}

function cellText(cell) {
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'object') {
    if (Array.isArray(v.richText))
      return v.richText
        .map((r) => r.text)
        .join('')
        .trim();
    if ('result' in v) return String(v.result ?? '').trim();
    if ('text' in v) return String(v.text).trim();
  }
  return String(v).trim();
}

function normalizeStatus(status) {
  const s = status.toLowerCase();
  if (s.startsWith('lacuna')) return 'lacuna';
  if (s.includes('revisar')) return 'revisar';
  if (s.startsWith('embasado')) return 'embasado';
  return 'sem-status';
}

function parseReferences(value) {
  if (!value || value === '—' || value === '-') return [];
  return value
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean);
}

function readDissertationVersion(wb) {
  const readme = wb.getWorksheet(SHEET_README);
  let version = null;
  readme?.eachRow((row) => {
    const text = cellText(row.getCell(1));
    const match = text.match(/^Versão de referência:\s*(.+?)\.?$/);
    if (match) version = match[1];
  });
  return version;
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}
