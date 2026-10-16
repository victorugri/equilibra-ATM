/** Partes de um indicador do Início (Figma 42:276: Rótulo, Valor, Unidade, Detalhe). */
export interface IndicatorParts {
  value: string;
  unit: string;
  detail: string;
}

/** Valores para os marcadores; null = valor desconhecido (o trecho é omitido). */
export type IndicatorVars = Record<string, string | null>;

/** Plural → singular quando o valor é 1 ("1 dia"). */
const SINGULAR: Record<string, string> = { dias: 'dia' };

/**
 * Separa o corpo de um texto INI do banco — "{valor}unidade, detalhe" ou
 * "{valor}unidade · detalhe · detalhe" — nas partes do cartão, sem trocar palavras.
 * Trechos do detalhe com um marcador sem valor são omitidos (ex.: {intensidade}, que o
 * banco ainda não define).
 */
export function indicatorParts(body: string, vars: IndicatorVars): IndicatorParts | null {
  const match = body.match(/^\{([^}]+)\}\s?([^,·]*?)\s*[,·]\s*(.+?)\.?$/);
  if (!match) return null;
  const [, valueVar, rawUnit, rawDetail] = match;
  const value = vars[valueVar];
  if (value === null || value === undefined) return null;

  const unit = value === '1' && SINGULAR[rawUnit] ? SINGULAR[rawUnit] : rawUnit;
  const detail = rawDetail
    .split(' · ')
    .filter((segment) =>
      [...segment.matchAll(/\{([^}]+)\}/g)].every(([, name]) => vars[name] != null),
    )
    .map((segment) => segment.replace(/\{([^}]+)\}/g, (_, name: string) => vars[name] ?? ''))
    .join(' · ');
  return { value, unit, detail };
}
