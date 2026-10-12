import { Routes } from '@angular/router';

/** Rutas del rol Inspector ANMAT. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasInspector: Routes = [
  {
    path: '',
    title: 'Bandeja · MediChain',
    loadComponent: () => import('./bandeja/bandeja').then((m) => m.Bandeja),
  },
  {
    path: 'empresas',
    title: 'Empresas · MediChain',
    loadComponent: () => import('../comun/empresas/empresas').then((m) => m.Empresas),
  },
  {
    path: 'circuitos',
    title: 'Circuitos · MediChain',
    loadComponent: () => import('../comun/circuitos/circuitos').then((m) => m.Circuitos),
  },
  {
    path: 'lotes',
    title: 'Lotes y cuarentenas · MediChain',
    loadComponent: () => import('./lotes/lotes-y-medidas').then((m) => m.LotesYMedidas),
  },
  {
    path: 'reportes',
    title: 'Reportes · MediChain',
    loadComponent: () => import('./reportes/reportes').then((m) => m.Reportes),
  },
  {
    path: 'cadena',
    title: 'Cadena y Sepolia · MediChain',
    loadComponent: () => import('../comun/cadena-sepolia/cadena-sepolia').then((m) => m.CadenaSepolia),
  },
];
