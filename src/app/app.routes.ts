import { Routes } from '@angular/router';
import { ScreenData, screen } from './layout/screen';
import { LEARN_MODULES } from './pages/learn/learn-modules';

// Telas ainda não construídas usam o componente provisório; cada `page(...)` vira
// `screen(..., { loadComponent: () => import('./pages/<tela>') })` quando a tela fica pronta.
const placeholder = () =>
  import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage);
const page = (path: string, title: string, data: ScreenData) =>
  screen(path, title, data, { loadComponent: placeholder });

/** Telas sem barra inferior nem SOS (fluxos focados). */
const focused: ScreenData = { tabBar: false, sos: false };
/** Telas internas que no Figma não têm barra inferior nem SOS (módulos, 6x6). */
const internal: ScreenData = focused;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },

  // Abas principais
  screen(
    'inicio',
    'Início',
    { figma: '7:36' },
    { loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage) },
  ),
  screen(
    'aprender',
    'Aprender',
    { figma: '7:991' },
    { loadComponent: () => import('./pages/learn/learn-page').then((m) => m.LearnPage) },
  ),
  screen(
    'exercicios',
    'Exercícios',
    { figma: '7:1454' },
    {
      loadComponent: () => import('./pages/exercises/exercises-page').then((m) => m.ExercisesPage),
    },
  ),
  screen(
    'diario',
    'Diário',
    { figma: '7:2310' },
    { loadComponent: () => import('./pages/diary/diary-page').then((m) => m.DiaryPage) },
  ),
  page('perfil', 'Perfil', { figma: '7:3685' }),

  // Aprender
  ...LEARN_MODULES.map((learnModule) =>
    screen(
      `aprender/modulo/${learnModule.n}`,
      learnModule.title,
      // `module` chega ao componente como input (withComponentInputBinding).
      { ...internal, figma: learnModule.figma, backTo: '/aprender', module: learnModule.n },
      { loadComponent: () => import('./pages/learn/module-page').then((m) => m.ModulePage) },
    ),
  ),
  // As telas de Alimentação (7:2614) e Sono (7:3107) saíram do Figma; o conteúdo está nos módulos.
  { path: 'alimentacao', redirectTo: 'aprender/modulo/4' },
  { path: 'sono', redirectTo: 'aprender/modulo/5' },

  // Exercícios
  screen(
    'exercicios/6x6',
    'Programa 6x6 de Rocabado',
    { ...internal, figma: '37:210', backTo: '/exercicios' },
    { loadComponent: () => import('./pages/exercises/program-page').then((m) => m.ProgramPage) },
  ),
  screen(
    'exercicios/6x6/sessao',
    'Sessão do 6x6',
    { ...focused, backTo: '/exercicios/6x6' },
    { loadComponent: () => import('./pages/exercises/session-page').then((m) => m.SessionPage) },
  ),

  // Diário
  screen(
    'diario/evolucao',
    'Evolução',
    { figma: '7:2851' },
    { loadComponent: () => import('./pages/diary/evolution-page').then((m) => m.EvolutionPage) },
  ),
  screen(
    'diario/relatorio',
    'Relatório para o dentista',
    { ...focused, backTo: '/diario/evolucao' },
    { loadComponent: () => import('./pages/diary/report-page').then((m) => m.ReportPage) },
  ),
  page('registro-matinal', 'Registro da manhã', { ...focused, figma: '7:3370', backTo: '/inicio' }),
  page('modo-noite', 'Modo noite', { ...focused, figma: '7:3552', backTo: '/inicio' }),

  // SOS
  screen(
    'sos',
    'SOS – Estou com dor',
    { ...focused, figma: '7:749', backTo: '/inicio' },
    { loadComponent: () => import('./pages/sos/sos-page').then((m) => m.SosPage) },
  ),

  // Lembretes
  page('perfil/lembretes', 'Meus lembretes', { figma: '7:2142', backTo: '/perfil' }),
  // Aberta ao tocar na notificação "Seus dentes estão se tocando agora?" (7:1939).
  page('lembrete', 'Resposta rápida', { ...focused, figma: '7:2020', backTo: '/inicio' }),

  // Engajamento
  page('conquista', 'Conquista', { ...focused, figma: '7:4019', backTo: '/inicio' }),
  page('resumo-semanal', 'Resumo da semana', { ...focused, figma: '7:4142', backTo: '/inicio' }),
  page('bem-vindo-de-volta', 'Bem-vindo de volta', { ...focused, backTo: '/inicio' }),

  // Onboarding e cadastro (fase 4)
  page('boas-vindas', 'Privacidade dos seus dados', {
    ...focused,
    figma: '7:300',
    disclaimer: true,
  }),
  page('boas-vindas/apresentacao', 'Boas-vindas', {
    ...focused,
    figma: '7:409',
    backTo: '/boas-vindas',
  }),
  page('boas-vindas/lembretes', 'Seus lembretes', {
    ...focused,
    figma: '7:483',
    backTo: '/boas-vindas/apresentacao',
  }),
  page('boas-vindas/como-aprender', 'Como prefere aprender', {
    ...focused,
    figma: '7:618',
    backTo: '/boas-vindas/lembretes',
  }),
  page('boas-vindas/criar-conta', 'Criar conta', {
    ...focused,
    figma: '23:2',
    backTo: '/boas-vindas/como-aprender',
  }),
  page('boas-vindas/cadastro', 'Cadastro', {
    ...focused,
    figma: '24:2',
    backTo: '/boas-vindas/criar-conta',
  }),

  { path: '**', redirectTo: 'inicio' },
];
