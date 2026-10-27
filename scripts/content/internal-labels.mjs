// Rótulos internos da pesquisa que não podem chegar ao paciente nem ao bundle publicado
// (ajustes da Dra. Tayná, design/ajustes-tayna.md, seção 3). O app é para pacientes com DTM
// em geral: status da planilha, apêndices, seções da dissertação e "o projeto" não fazem
// sentido para quem usa.
//
// - build-content.mjs: falha se um texto para o app tiver um destes rótulos e tira das
//   referências as que forem internas (ex.: "Resultados do questionário (Apêndice B)").
// - check-content.mjs: confere o banco e o código-fonte do app.

export const INTERNAL_LABELS = [
  /lacuna/i,
  /ap[êe]ndice/i,
  /disserta[çc][ãa]o/i,
  /question[áa]rio/i,
  /do projeto/i,
  /\bse[çc][ãa]o \d/i,
];

export function internalLabel(text) {
  return INTERNAL_LABELS.find((pattern) => pattern.test(text));
}
