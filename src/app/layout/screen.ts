import { ActivatedRouteSnapshot, Route } from '@angular/router';

/** Configuração de uma tela, guardada em `data` da rota. */
export interface ScreenData {
  /** Id do frame da tela no Figma (página 7:2 "Revisão – conteúdo da dissertação"). */
  figma?: string;
  /** Barra inferior com as 5 abas. Padrão: true. */
  tabBar?: boolean;
  /** Botão flutuante "SOS – Estou com dor". Padrão: true. */
  sos?: boolean;
  /** Tela interna: o cabeçalho mostra "voltar" e usa esta rota se não houver histórico. */
  backTo?: string;
  /** Mostra o aviso fixo APR-18 (telas de conteúdo e onboarding). */
  disclaimer?: boolean;
}

/** Atalho para declarar uma rota de tela com título e dados tipados (e outros dados da tela). */
export function screen<T extends ScreenData>(
  path: string,
  title: string,
  data: T,
  route: Partial<Route> = {},
): Route {
  return { path, title, data, ...route };
}

/** Dados da rota mais interna ativa. */
export function deepestScreenData(root: ActivatedRouteSnapshot): ScreenData {
  let route = root;
  while (route.firstChild) route = route.firstChild;
  return route.data as ScreenData;
}
