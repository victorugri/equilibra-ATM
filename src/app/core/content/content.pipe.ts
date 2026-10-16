import { Pipe, PipeTransform, inject } from '@angular/core';
import { ContentPart, ContentVars } from './content.model';
import { ContentService } from './content.service';

/**
 * Mostra um texto do banco de conteúdo pelo código.
 *
 *   {{ 'APR-18' | content }}
 *   {{ 'APR-M1.1' | content: 'title' }}
 *   {{ 'EX-13' | content: 'text' : { n: sessoes() } }}
 */
@Pipe({ name: 'content' })
export class ContentPipe implements PipeTransform {
  private readonly content = inject(ContentService);

  transform(code: string, part: ContentPart = 'text', vars?: ContentVars): string {
    return this.content.get(code, part, vars);
  }
}
