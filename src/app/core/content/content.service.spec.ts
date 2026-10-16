import { TestBed } from '@angular/core/testing';
import realBank from '../../../content/pt-BR.json';
import { ContentBank } from './content.model';
import { CONTENT_BANK, ContentService } from './content.service';

const fakeBank: ContentBank = {
  source: { file: 'teste.xlsx', dissertationVersion: null },
  entries: {
    'TST-01': {
      code: 'TST-01',
      module: 'Teste',
      screen: 'Tela',
      type: 'Bloco',
      text: 'Título — Corpo do texto.',
      title: 'Título',
      body: 'Corpo do texto.',
      references: ['Autor (2020)'],
      status: 'embasado',
      approvedByAdvisor: true,
    },
    'TST-02': {
      code: 'TST-02',
      module: 'Teste',
      screen: 'Tela',
      type: 'Mensagem',
      text: 'Hoje você fez {n} de 6 sessões.',
      references: [],
      status: 'embasado',
      approvedByAdvisor: true,
    },
  },
  blocked: { 'TST-99': 'Lacuna – sem embasamento na dissertação' },
};

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: CONTENT_BANK, useValue: fakeBank }] });
    service = TestBed.inject(ContentService);
  });

  it('retorna o texto, o título e o corpo pelo código', () => {
    expect(service.get('TST-01')).toBe('Título — Corpo do texto.');
    expect(service.get('TST-01', 'title')).toBe('Título');
    expect(service.get('TST-01', 'body')).toBe('Corpo do texto.');
  });

  it('preenche os marcadores', () => {
    expect(service.get('TST-02', 'text', { n: 3 })).toBe('Hoje você fez 3 de 6 sessões.');
  });

  it('recusa marcador sem valor', () => {
    expect(() => service.get('TST-02')).toThrowError(/\{n\}/);
  });

  it('recusa código bloqueado (Lacuna)', () => {
    expect(() => service.get('TST-99')).toThrowError(/bloqueado/);
  });

  it('recusa código inexistente', () => {
    expect(() => service.get('TST-42')).toThrowError(/não existe/);
  });
});

describe('Banco de conteúdo gerado', () => {
  const bank = realBank as ContentBank;

  it('não mistura textos liberados com códigos bloqueados', () => {
    for (const code of Object.keys(bank.blocked)) {
      expect(bank.entries[code]).toBeUndefined();
    }
  });

  it('tem o aviso fixo APR-18 e a linha de segurança EX-00', () => {
    expect(bank.entries['APR-18']?.text).toContain('não substitui a consulta');
    expect(bank.entries['EX-00']?.text).toContain('sem forçar a boca além do início da dor');
  });

  it('não tem texto provisório', () => {
    for (const entry of Object.values(bank.entries)) {
      expect(entry.text, entry.code).not.toMatch(/\[A DEFINIR/i);
      expect(entry.text.trim(), entry.code).not.toBe('');
    }
  });
});
