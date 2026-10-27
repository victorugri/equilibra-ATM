import { Routes } from '@angular/router';
import { prescriptionGuard } from './core/prescription/prescription.guard';
import { onboardingGuard } from './layout/onboarding.guard';
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

/** Telas do app em si: só depois da entrada (privacidade e boas-vindas). */
const appScreens: Routes = [
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
  screen(
    'perfil',
    'Perfil',
    { figma: '7:3685' },
    { loadComponent: () => import('./pages/profile/profile-page').then((m) => m.ProfilePage) },
  ),

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
  // Só com prescrição do dentista (design/ajustes-tayna.md, seção 4); sem ela, volta ao convite.
  screen(
    'exercicios/meus',
    'Seus exercícios',
    { ...internal, figma: '37:210', backTo: '/exercicios' },
    {
      canMatch: [prescriptionGuard],
      loadComponent: () => import('./pages/exercises/program-page').then((m) => m.ProgramPage),
    },
  ),
  screen(
    'exercicios/sessao',
    'Sessão de exercícios',
    { ...focused, backTo: '/exercicios/meus' },
    {
      canMatch: [prescriptionGuard],
      loadComponent: () => import('./pages/exercises/session-page').then((m) => m.SessionPage),
    },
  ),
  { path: 'exercicios/6x6', redirectTo: 'exercicios/meus' },
  { path: 'exercicios/6x6/sessao', redirectTo: 'exercicios/sessao' },
  // QR Code do dentista: abre Exercícios com o código preenchido.
  {
    path: 'prescricao/:code',
    redirectTo: ({ params }) => `/exercicios?codigo=${encodeURIComponent(params['code'])}`,
  },

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
  // O Registro da manhã (7:3370) saiu da rotina: o "dormiu bem?" do diário cobre o sono
  // (design/ajustes-tayna.md, seção 5).
  { path: 'registro-matinal', redirectTo: 'diario' },
  page('modo-noite', 'Modo noite', { ...focused, figma: '7:3552', backTo: '/inicio' }),

  // Perfil
  screen(
    'perfil/editar',
    'Editar dados',
    { ...focused, figma: '24:2', backTo: '/perfil', mode: 'edit' },
    {
      loadComponent: () =>
        import('./pages/account/profile-form-page').then((m) => m.ProfileFormPage),
    },
  ),
  screen(
    'perfil/meus-dados',
    'Meus dados',
    { ...focused, backTo: '/perfil' },
    { loadComponent: () => import('./pages/profile/my-data-page').then((m) => m.MyDataPage) },
  ),

  // Lembretes
  screen(
    'perfil/lembretes',
    'Meus lembretes',
    { ...focused, figma: '7:2142', backTo: '/perfil' },
    {
      loadComponent: () => import('./pages/reminders/reminders-page').then((m) => m.RemindersPage),
    },
  ),
  // Aberta ao tocar na notificação "Seus dentes estão se tocando agora?" (7:1939).
  screen(
    'lembrete',
    'Check-in rápido',
    { ...focused, figma: '7:2020', backTo: '/inicio' },
    { loadComponent: () => import('./pages/reminders/checkin-page').then((m) => m.CheckinPage) },
  ),

  // Engajamento
  page('conquista', 'Conquista', { ...focused, figma: '7:4019', backTo: '/inicio' }),
  page('resumo-semanal', 'Resumo da semana', { ...focused, figma: '7:4142', backTo: '/inicio' }),
  page('bem-vindo-de-volta', 'Bem-vindo de volta', { ...focused, backTo: '/inicio' }),
];

export const routes: Routes = [
  // Entrada no app (primeiro acesso)
  screen(
    'boas-vindas',
    'Privacidade dos seus dados',
    { ...focused, figma: '7:300' },
    {
      loadComponent: () => import('./pages/onboarding/privacy-page').then((m) => m.PrivacyPage),
    },
  ),
  screen(
    'boas-vindas/apresentacao',
    'Boas-vindas',
    { ...focused, figma: '7:409' },
    {
      loadComponent: () => import('./pages/onboarding/welcome-page').then((m) => m.WelcomePage),
    },
  ),

  // Conta (opcional)
  screen(
    'conta/criar',
    'Criar conta',
    { ...focused, figma: '23:2' },
    { loadComponent: () => import('./pages/account/sign-up-page').then((m) => m.SignUpPage) },
  ),
  screen(
    'conta/entrar',
    'Entrar',
    { ...focused, backTo: '/perfil' },
    { loadComponent: () => import('./pages/account/sign-in-page').then((m) => m.SignInPage) },
  ),
  screen(
    'conta/esqueci-senha',
    'Recuperar senha',
    { ...focused, backTo: '/conta/entrar' },
    {
      loadComponent: () =>
        import('./pages/account/forgot-password-page').then((m) => m.ForgotPasswordPage),
    },
  ),
  screen(
    'conta/cadastro',
    'Complete seu cadastro',
    { ...focused, figma: '24:2', mode: 'signup' },
    {
      loadComponent: () =>
        import('./pages/account/profile-form-page').then((m) => m.ProfileFormPage),
    },
  ),
  // Depois do cadastro: escolher os lembretes (só com conta).
  screen(
    'boas-vindas/lembretes',
    'Seus lembretes',
    { ...focused, figma: '7:483' },
    {
      loadComponent: () =>
        import('./pages/reminders/reminders-onboarding-page').then(
          (m) => m.RemindersOnboardingPage,
        ),
    },
  ),
  // Link do e-mail de recuperação de senha (Supabase).
  screen(
    'redefinir-senha',
    'Nova senha',
    { ...focused, backTo: '/conta/entrar' },
    {
      loadComponent: () =>
        import('./pages/account/reset-password-page').then((m) => m.ResetPasswordPage),
    },
  ),

  // SOS fica sempre acessível, mesmo antes da entrada no app.
  screen(
    'sos',
    'SOS – Estou com dor',
    { ...focused, figma: '7:749', backTo: '/inicio' },
    { loadComponent: () => import('./pages/sos/sos-page').then((m) => m.SosPage) },
  ),

  // Área do dentista: fora da entrada do paciente (privacidade e boas-vindas não se aplicam).
  screen(
    'dentista',
    'Área do dentista',
    { ...focused, backTo: '/inicio' },
    { loadComponent: () => import('./pages/dentist/dentist-page').then((m) => m.DentistPage) },
  ),

  { path: '', canActivateChild: [onboardingGuard], children: appScreens },
  { path: '**', redirectTo: 'inicio' },
];
