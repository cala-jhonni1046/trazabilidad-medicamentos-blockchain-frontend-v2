import { Routes } from '@angular/router';

/** Rutas del rol Farmacia. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasFarmacia: Routes = [
  {
    path: '',
    title: 'Circuitos · MediChain',
    loadComponent: () => import('../comun/circuitos/circuitos').then((m) => m.Circuitos),
  },
  {
    path: 'recepcion',
    title: 'Por recibir · MediChain',
    loadComponent: () => import('../comun/recepcion/recepcion').then((m) => m.Recepcion),
  },
  {
    path: 'stock',
    title: 'Stock · MediChain',
    loadComponent: () => import('./stock/stock').then((m) => m.Stock),
  },
  {
    path: 'dispensar',
    title: 'Dispensar · MediChain',
    loadComponent: () => import('./dispensar/dispensar').then((m) => m.Dispensar),
  },
  {
    path: 'equipo',
    title: 'Equipo · MediChain',
    loadComponent: () => import('../comun/equipo/equipo').then((m) => m.Equipo),
  },
];
