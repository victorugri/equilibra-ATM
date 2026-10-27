import { InjectionToken, Service, inject, isDevMode } from '@angular/core';
import bank from '../../../content/pt-BR.json';
import { ContentBank, ContentEntry, ContentPart, ContentVars } from './content.model';

/** Banco de conteúdo usado pelo app. Pode ser trocado nos testes. */
export const CONTENT_BANK = new InjectionToken<ContentBank>('CONTENT_BANK', {
  factory: () => bank as ContentBank,
});

/**
 * Único ponto de acesso aos textos de saúde. Todo texto clínico ou educativo
 * precisa vir daqui, pelo código da planilha — nunca escrito direto no template.
 */
@Service()
export class ContentService {
  private readonly bank = inject(CONTENT_BANK);

  /** Retorna o texto (ou o título/corpo) do código, com os marcadores preenchidos. */
  get(code: string, part: ContentPart = 'text', vars?: ContentVars): string {
    const entry = this.entry(code);
    if (!entry) return '';
    const value = entry[part];
    if (value === undefined) {
      return this.fail(
        `O texto ${code} não tem "${part}" (só textos no formato "Título — corpo").`,
      );
    }
    return vars || /\{[^}]+\}/.test(value) ? this.fill(code, value, vars ?? {}) : value;
  }

  /** Versão da dissertação usada para gerar o banco (registrada com o consentimento). */
  version(): string | null {
    return this.bank.source.dissertationVersion;
  }

  /** O código existe e está liberado? Não acusa erro (para listas que dependem da planilha). */
  has(code: string): boolean {
    return Object.hasOwn(this.bank.entries, code);
  }

  /** Retorna a linha completa do banco, ou undefined se o código não puder ser usado. */
  entry(code: string): ContentEntry | undefined {
    const entry = this.bank.entries[code];
    if (entry) return entry;
    const reason = this.bank.blocked[code];
    this.fail(
      reason
        ? `O texto ${code} está bloqueado (${reason}) e não pode aparecer no app.`
        : `O texto ${code} não existe no banco de conteúdo.`,
    );
    return undefined;
  }

  private fill(code: string, text: string, vars: ContentVars): string {
    return text.replace(/\{([^}]+)\}/g, (marker, name: string) => {
      if (name in vars) return String(vars[name]);
      this.fail(`Falta o valor de {${name}} para o texto ${code}.`);
      return marker;
    });
  }

  /** Em desenvolvimento, quebra na hora; em produção, registra e segue sem o texto. */
  private fail(message: string): '' {
    if (isDevMode()) throw new Error(message);
    console.error(message);
    return '';
  }
}
