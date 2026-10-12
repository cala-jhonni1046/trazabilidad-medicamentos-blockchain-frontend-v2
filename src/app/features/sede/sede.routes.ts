import { Routes } from '@angular/router';

/** Rutas del rol Sede Central. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasSede: Routes = [
  {
    path: '',
    title: 'Tablero · MediChain',
    loadComponent: () => import('./tablero/tablero').then((m) => m.Tablero),
  },
  {
    path: 'inspectores',
    title: 'Inspectores · MediChain',
    loadComponent: () => import('./inspectores/inspectores').then((m) => m.Inspectores),
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
    path: 'cadena',
    title: 'Cadena y Sepolia · MediChain',
    loadComponent: () => import('../comun/cadena-sepolia/cadena-sepolia').then((m) => m.CadenaSepolia),
  },
  {
    path: 'usuarios',
    title: 'Usuarios · MediChain',
    loadComponent: () => import('./usuarios/usuarios').then((m) => m.UsuariosSede),
  },
];
