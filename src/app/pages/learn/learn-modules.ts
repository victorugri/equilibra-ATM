/** Um módulo do Aprender (Figma 34:129 e seguintes; ver design/34-129-modulo.md). */
export interface LearnModule {
  n: number;
  /** Título de navegação, como no Figma. */
  title: string;
  /** Id do frame no Figma. */
  figma: string;
  /** Código da frase de abertura. */
  intro: string;
  /** Códigos dos blocos, na ordem; o tipo "Dica" do banco usa a variante Dica. */
  blocks: readonly string[];
  /** O módulo já traz o aviso fixo (APR-18) como bloco, então o rodapé não o repete. */
  hasDisclaimerBlock?: boolean;
}

/** Os 6 módulos, em ordem fixa. Os textos vêm das linhas APR-M* do banco. */
export const LEARN_MODULES: readonly LearnModule[] = [
  {
    n: 1,
    title: 'Entendendo a DTM e o bruxismo',
    figma: '34:129',
    intro: 'APR-M1.0',
    blocks: ['APR-M1.1', 'APR-M1.2', 'APR-M1.3', 'APR-M1.4', 'APR-M1.5'],
  },
  {
    n: 2,
    title: 'Como é o tratamento',
    figma: '34:160',
    intro: 'APR-M2.0',
    blocks: ['APR-M2.1', 'APR-M2.2', 'APR-M2.3', 'APR-M2.4', 'APR-M2.5'],
    hasDisclaimerBlock: true,
  },
  {
    n: 3,
    title: 'Hábitos que pioram a dor',
    figma: '34:191',
    intro: 'APR-M3.0',
    blocks: ['APR-M3.1', 'APR-M3.2', 'APR-M3.3', 'APR-M3.4', 'APR-M3.5', 'APR-M3.6'],
  },
  {
    n: 4,
    title: 'O que comer nos dias de dor',
    figma: '34:225',
    intro: 'APR-M4.0',
    blocks: ['APR-M4.1', 'APR-M4.2', 'APR-M4.3', 'APR-M4.4', 'APR-M4.5'],
  },
  {
    n: 5,
    title: 'Dormir melhor',
    figma: '34:256',
    intro: 'APR-M5.0',
    blocks: ['APR-M5.1', 'APR-M5.2', 'APR-M5.3', 'APR-M5.4'],
  },
  {
    n: 6,
    title: 'Alívio em casa',
    figma: '34:284',
    intro: 'APR-M6.0',
    blocks: ['APR-M6.1', 'APR-M6.2', 'APR-M6.3', 'APR-M6.4'],
  },
];
