/** Situação do texto na planilha do banco de conteúdo. */
export type ContentStatus = 'embasado' | 'revisar' | 'sem-status';

/** Um texto de saúde do app, identificado pelo código da planilha (ex.: APR-M1.2). */
export interface ContentEntry {
  code: string;
  module: string;
  screen: string;
  type: string;
  /** Texto completo, exatamente como na coluna "Texto para o app". */
  text: string;
  /** Para textos no formato "Título — corpo". */
  title?: string;
  body?: string;
  references: string[];
  status: ContentStatus;
  approvedByAdvisor: boolean;
  /** Marcação editorial que estava entre colchetes no início do texto. */
  note?: string;
}

export interface ContentBank {
  source: { file: string; dissertationVersion: string | null };
  entries: Record<string, ContentEntry>;
  /** Códigos com status Lacuna: não podem aparecer no app. Valor = motivo. */
  blocked: Record<string, string>;
}

export type ContentPart = 'text' | 'title' | 'body';

/** Valores para os marcadores do texto, ex.: {n} em "Hoje você fez {n} de 6 sessões." */
export type ContentVars = Record<string, string | number>;
