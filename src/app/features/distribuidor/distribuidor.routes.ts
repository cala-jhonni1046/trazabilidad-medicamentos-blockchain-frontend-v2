import { Routes } from '@angular/router';

/** Rutas del rol Distribuidora. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasDistribuidor: Routes = [
  {
    path: '',
    title: 'Circuitos · MediChain',
    loadComponent: () => import('../comun/circuitos/circuitos').then((m) => m.Circuitos),
  },
  {
    path: 'recepcion',
    title: 'Recibir bultos · MediChain',
    loadComponent: () => import('../comun/recepcion/recepcion').then((m) => m.Recepcion),
  },
  {
    path: 'deposito',
    title: 'Depósito · MediChain',
    loadComponent: () => import('./deposito/deposito').then((m) => m.Deposito),
  },
  {
    path: 'viajes',
    title: 'Viajes · MediChain',
    loadComponent: () => import('../comun/viajes/viajes').then((m) => m.Viajes),
  },
  {
    path: 'equipo',
    title: 'Equipo · MediChain',
    loadComponent: () => import('../comun/equipo/equipo').then((m) => m.Equipo),
  },
];
