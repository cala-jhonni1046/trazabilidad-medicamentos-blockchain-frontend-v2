import { Routes } from '@angular/router';

/** Rutas del rol Paciente. Se cargan diferidas y solo para ese rol (rolGuard en app.routes.ts). */
export const rutasPaciente: Routes = [
  {
    path: '',
    title: 'Verificar un medicamento · MediChain',
    loadComponent: () => import('./verificar-reportar/verificar-y-reportar').then((m) => m.VerificarYReportar),
  },
  {
    path: 'reportes',
    title: 'Mis reportes · MediChain',
    loadComponent: () => import('./reportes/mis-reportes').then((m) => m.MisReportes),
  },
];
