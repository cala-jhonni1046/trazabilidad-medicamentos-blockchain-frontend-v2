import { Routes } from '@angular/router';

/** Rutas del rol Laboratorio. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasLaboratorio: Routes = [
  {
    path: '',
    title: 'Circuitos · MediChain',
    loadComponent: () => import('../comun/circuitos/circuitos').then((m) => m.Circuitos),
  },
  {
    path: 'medicamentos',
    title: 'Medicamentos · MediChain',
    loadComponent: () => import('./medicamentos/medicamentos').then((m) => m.Medicamentos),
  },
  {
    path: 'lotes',
    title: 'Lotes · MediChain',
    loadComponent: () => import('./lotes/lotes').then((m) => m.LotesLaboratorio),
  },
  {
    path: 'bultos',
    title: 'Bultos · MediChain',
    loadComponent: () => import('./bultos/bultos').then((m) => m.BultosLaboratorio),
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
